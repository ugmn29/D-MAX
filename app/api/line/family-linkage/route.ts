import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase-client'server'

/**
 * 家族連携API
 *
 * POST: 家族メンバーを連携
 * GET: 連携済みの家族メンバー一覧を取得
 * DELETE: 家族連携を解除
 */

export async function POST(request: NextRequest) {
  try {
    const { line_user_id, patient_id, relationship } = await request.json()

    // バリデーション
    if (!line_user_id || !patient_id) {
      return NextResponse.json(
        { error: 'LINE User IDと患者IDが必要です' },
        { status: 400 }
      )
    }

    // 関係性のバリデーション
    const validRelationships = ['parent', 'spouse', 'child', 'other']
    if (relationship && !validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: '関係性の値が正しくありません' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 患者情報を取得
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, clinic_id, patient_number, last_name, first_name, birth_date')
      .eq('id', patient_id)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 既に連携されているか確認
    const { data: existingLinkage } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)
      .eq('patient_id', patient_id)
      .single()

    if (existingLinkage) {
      return NextResponse.json(
        { error: 'この患者は既に連携されています' },
        { status: 409 }
      )
    }

    // 既存の連携数を確認（プライマリ判定のため）
    const { data: existingLinkages } = await supabase
      .from('line_patient_linkages')
      .select('id')
      .eq('line_user_id', line_user_id)

    // 連携を作成
    const { data: linkage, error: linkageError } = await supabase
      .from('line_patient_linkages')
      .insert({
        line_user_id,
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        relationship: relationship || 'other',
        is_primary: existingLinkages.length === 0, // 初めての連携ならプライマリ
        linked_at: new Date().toISOString()
      })
      .select()
      .single()

    if (linkageError) {
      console.error('連携作成エラー:', linkageError)
      return NextResponse.json(
        { error: '連携の作成に失敗しました' },
        { status: 500 }
      )
    }

    // QRコードが存在しない場合は自動生成
    const { data: existingQR } = await supabase
      .from('patient_qr_codes')
      .select('id')
      .eq('patient_id', patient_id)
      .single()

    if (!existingQR) {
      const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`
      await supabase
        .from('patient_qr_codes')
        .insert({
          patient_id: patient.id,
          clinic_id: patient.clinic_id,
          qr_token,
          expires_at: null,
          usage_count: 0
        })
    }

    return NextResponse.json({
      success: true,
      linkage: {
        id: linkage.id,
        patient: {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number,
          birth_date: patient.birth_date
        },
        relationship: linkage.relationship,
        is_primary: linkage.is_primary,
        linked_at: linkage.linked_at
      }
    })

  } catch (error) {
    console.error('家族連携API エラー:', error)
    return NextResponse.json(
      { error: '連携処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const line_user_id = searchParams.get('line_user_id')

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 連携情報を取得
    const { data: linkages, error } = await supabase
      .from('line_patient_linkages')
      .select(`
        id,
        patient_id,
        relationship,
        is_primary,
        linked_at,
        patients (
          id,
          patient_number,
          last_name,
          first_name,
          birth_date,
          phone
        )
      `)
      .eq('line_user_id', line_user_id)
      .order('is_primary', { ascending: false })
      .order('linked_at', { ascending: true })

    if (error) {
      console.error('連携情報取得エラー:', error)
      return NextResponse.json(
        { error: '連携情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      linkages: linkages || [],
      count: linkages?.length || 0
    })

  } catch (error) {
    console.error('家族連携取得API エラー:', error)
    return NextResponse.json(
      { error: '取得処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkage_id = searchParams.get('id')

    if (!linkage_id) {
      return NextResponse.json(
        { error: '連携IDが必要です' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 連携を削除
    const { error } = await supabase
      .from('line_patient_linkages')
      .delete()
      .eq('id', linkage_id)

    if (error) {
      console.error('連携削除エラー:', error)
      return NextResponse.json(
        { error: '連携の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '連携を解除しました'
    })

  } catch (error) {
    console.error('家族連携削除API エラー:', error)
    return NextResponse.json(
      { error: '削除処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
