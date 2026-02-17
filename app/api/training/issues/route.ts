import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'
import { IssueRecordInput } from '@/types/evaluation'

const DATE_FIELDS = ['identified_at', 'resolved_at', 'created_at'] as const

// GET /api/training/issues?patient_id=xxx&include_resolved=false
// 患者の課題一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const patient_id = searchParams.get('patient_id')
    const include_resolved = searchParams.get('include_resolved') === 'true'

    if (!patient_id) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const whereCondition: any = { patient_id }
    if (!include_resolved) {
      whereCondition.is_resolved = false
    }

    const data = await prisma.patient_issue_records.findMany({
      where: whereCondition,
      include: {
        patient_issues: true
      },
      orderBy: { identified_at: 'desc' }
    })

    // Supabase互換: issue フィールドとしてpatient_issuesを返す
    const dataWithIssue = data.map((record) => {
      const { patient_issues, ...rest } = record as any
      return {
        ...convertDatesToStrings(rest, [...DATE_FIELDS]),
        issue: patient_issues ? convertDatesToStrings(patient_issues, ['created_at']) : null
      }
    })

    // 解決済みと現在の課題に分ける
    const current = dataWithIssue.filter((r) => !r.is_resolved) || []
    const resolved = dataWithIssue.filter((r) => r.is_resolved) || []

    return NextResponse.json({
      success: true,
      data: {
        current,
        resolved,
      },
    })
  } catch (error: any) {
    console.error('課題取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/training/issues
// 課題を記録
export async function POST(req: NextRequest) {
  try {
    const body: IssueRecordInput = await req.json()

    const { patient_id, clinic_id, issue_code, severity, notes, identified_by } = body

    if (!patient_id || !clinic_id || !issue_code || !severity) {
      return NextResponse.json(
        { error: 'patient_id, clinic_id, issue_code, and severity are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 既存の同じ課題が未解決で存在しないかチェック
    const existing = await prisma.patient_issue_records.findMany({
      where: {
        patient_id,
        issue_code,
        is_resolved: false
      }
    })

    if (existing && existing.length > 0) {
      // 既存の課題を更新
      const updated = await prisma.patient_issue_records.update({
        where: { id: existing[0].id },
        data: {
          severity,
          notes: notes || null,
          identified_at: new Date(),
          identified_by: identified_by || null,
        },
        include: {
          patient_issues: true
        }
      })

      const { patient_issues, ...rest } = updated as any
      const result = {
        ...convertDatesToStrings(rest, [...DATE_FIELDS]),
        issue: patient_issues ? convertDatesToStrings(patient_issues, ['created_at']) : null
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: '既存の課題を更新しました',
      })
    }

    // 新規課題を作成
    const created = await prisma.patient_issue_records.create({
      data: {
        patient_id,
        clinic_id,
        issue_code,
        severity,
        notes: notes || null,
        identified_by: identified_by || null,
      },
      include: {
        patient_issues: true
      }
    })

    const { patient_issues, ...rest } = created as any
    const result = {
      ...convertDatesToStrings(rest, [...DATE_FIELDS]),
      issue: patient_issues ? convertDatesToStrings(patient_issues, ['created_at']) : null
    }

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: any) {
    console.error('課題記録エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
