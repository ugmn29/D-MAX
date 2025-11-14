import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params

    if (!patientId) {
      return NextResponse.json(
        { error: '患者IDが指定されていません' },
        { status: 400 }
      )
    }

    // まず患者レコードを取得してclinicIdを確認
    const client = getSupabaseClient()
    const { data: patient, error } = await client
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error || !patient) {
      console.error('患者情報取得エラー:', error)
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('患者情報取得エラー:', error)
    return NextResponse.json(
      { error: '患者情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
