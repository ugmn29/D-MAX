import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase-client'
import { IssueRecordInput } from '@/types/evaluation'

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

    let query = supabase
      .from('patient_issue_records')
      .select(`
        *,
        issue:patient_issues(*)
      `)
      .eq('patient_id', patient_id)
      .order('identified_at', { ascending: false })

    if (!include_resolved) {
      query = query.eq('is_resolved', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('課題取得エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 解決済みと現在の課題に分ける
    const current = data?.filter((r) => !r.is_resolved) || []
    const resolved = data?.filter((r) => r.is_resolved) || []

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

    // 既存の同じ課題が未解決で存在しないかチェック
    const { data: existing, error: checkError } = await supabase
      .from('patient_issue_records')
      .select('*')
      .eq('patient_id', patient_id)
      .eq('issue_code', issue_code)
      .eq('is_resolved', false)

    if (checkError) {
      console.error('課題チェックエラー:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      // 既存の課題を更新
      const { data: updated, error: updateError } = await supabase
        .from('patient_issue_records')
        .update({
          severity,
          notes: notes || null,
          identified_at: new Date().toISOString(),
          identified_by: identified_by || null,
        })
        .eq('id', existing[0].id)
        .select(`
          *,
          issue:patient_issues(*)
        `)
        .single()

      if (updateError) {
        console.error('課題更新エラー:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: updated,
        message: '既存の課題を更新しました',
      })
    }

    // 新規課題を作成
    const { data: created, error: createError } = await supabase
      .from('patient_issue_records')
      .insert({
        patient_id,
        clinic_id,
        issue_code,
        severity,
        notes: notes || null,
        identified_by: identified_by || null,
      })
      .select(`
        *,
        issue:patient_issues(*)
      `)
      .single()

    if (createError) {
      console.error('課題作成エラー:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: created,
    })
  } catch (error: any) {
    console.error('課題記録エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
