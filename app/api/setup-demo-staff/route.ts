import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // 既存のクリニックIDを取得
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id')
      .limit(1)

    let clinicId: string

    if (!clinics || clinics.length === 0) {
      // クリニックがなければデモクリニックを作成
      const { data: newClinic, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'デモクリニック'
        })
        .select()
        .single()

      if (clinicError && clinicError.code !== '23505') { // 23505 = unique violation (already exists)
        console.error('クリニック作成エラー:', clinicError)
        return NextResponse.json({ error: 'クリニック作成失敗' }, { status: 500 })
      }

      clinicId = newClinic?.id || '11111111-1111-1111-1111-111111111111'
    } else {
      clinicId = clinics[0].id
    }

    // デモスタッフを作成
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        id: '11111111-1111-1111-1111-111111111111',
        clinic_id: clinicId,
        name: 'デモスタッフ',
        email: 'demo@example.com',
        role: 'admin',
        is_active: true
      })
      .select()
      .single()

    if (staffError) {
      if (staffError.code === '23505') {
        // 既に存在する場合は成功とみなす
        return NextResponse.json({
          success: true,
          message: 'デモスタッフは既に存在します',
          staff_id: '11111111-1111-1111-1111-111111111111'
        })
      }

      console.error('スタッフ作成エラー:', staffError)
      return NextResponse.json({ error: 'スタッフ作成失敗', details: staffError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'デモスタッフを作成しました',
      staff
    })

  } catch (error) {
    console.error('セットアップエラー:', error)
    return NextResponse.json({ error: 'セットアップ失敗' }, { status: 500 })
  }
}
