/**
 * 最新の歯周検査取得API Route - Prisma版
 * Latest Periodontal Exam API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET - 患者の最新の歯周検査を取得（前回値コピー用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 最新の検査レコードを取得
    const exam = await prisma.periodontal_examinations.findFirst({
      where: { patient_id: patientId },
      orderBy: { examination_date: 'desc' },
    })

    if (!exam) {
      // データが見つからない場合
      return NextResponse.json(null)
    }

    // 歯ごとのデータを取得
    const toothData = await prisma.periodontal_tooth_data.findMany({
      where: { examination_id: exam.id },
      orderBy: { tooth_number: 'asc' },
    })

    // Date型をISO文字列に変換
    const result = {
      ...exam,
      examination_date: exam.examination_date?.toISOString() ?? null,
      created_at: exam.created_at?.toISOString() ?? null,
      updated_at: exam.updated_at?.toISOString() ?? null,
      tooth_data: toothData.map((tooth) => ({
        ...tooth,
        created_at: tooth.created_at?.toISOString() ?? null,
        updated_at: tooth.updated_at?.toISOString() ?? null,
      })),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/periodontal-exams/latest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
