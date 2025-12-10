import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// GET: 患者の連携状況を取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageから取得
    if (MOCK_MODE) {
      try {
        const { getMockPatients } = await import('@/lib/utils/mock-mode')
        const allPatients = getMockPatients()
        
        // 未連携患者（仮登録）
        const unlinkedPatients = allPatients.filter(p => !p.is_registered)
        
        // 連携済み患者（本登録）
        const linkedPatients = allPatients.filter(p => p.is_registered)
        
        console.log('MOCK_MODE: 連携状況データ取得 - 未連携:', unlinkedPatients.length, '件, 連携済み:', linkedPatients.length, '件')
        
        return NextResponse.json({
          unlinkedPatients,
          linkedPatients
        })
      } catch (mockError) {
        console.error('MOCK_MODE連携状況データ取得エラー:', mockError)
        return NextResponse.json({
          unlinkedPatients: [],
          linkedPatients: []
        })
      }
    }

    // 本番モードではデータベースから取得
    const client = getSupabaseClient()

    try {
      // 仮登録患者（未連携）を取得 - シンプルなクエリに変更
      const { data: unlinkedPatients, error: unlinkedError } = await client
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_registered', false)
        .order('created_at', { ascending: false })

      if (unlinkedError) {
        console.error('未連携患者取得エラー:', unlinkedError)
        throw unlinkedError
      }

      // 本登録患者（連携済み）を取得 - シンプルなクエリに変更
      const { data: linkedPatients, error: linkedError } = await client
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_registered', true)
        .order('updated_at', { ascending: false })

      if (linkedError) {
        console.error('連携済み患者取得エラー:', linkedError)
        throw linkedError
      }

      return NextResponse.json({
        unlinkedPatients: unlinkedPatients || [],
        linkedPatients: linkedPatients || []
      })
    } catch (error) {
      console.error('連携状況取得エラー:', error)
      return NextResponse.json({
        unlinkedPatients: [],
        linkedPatients: []
      })
    }
  } catch (error) {
    console.error('連携状況API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 患者を連携（本登録に変更）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientId } = body

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageを更新
    if (MOCK_MODE) {
      try {
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        const updates = {
          is_registered: true,
          registered_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const result = updateMockPatient(patientId, updates)
        if (!result) {
          return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, patient: result })
      } catch (mockError) {
        console.error('MOCK_MODE患者連携エラー:', mockError)
        return NextResponse.json({ error: 'Failed to link patient' }, { status: 500 })
      }
    }

    // 本番モードではデータベースを更新
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patients')
      .update({ 
        is_registered: true,
        registered_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single()

    if (error) {
      console.error('患者連携エラー:', error)
      return NextResponse.json({ error: 'Failed to link patient' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, patient: data })
  } catch (error) {
    console.error('患者連携API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 患者の連携を解除（仮登録に戻す）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageを更新
    if (MOCK_MODE) {
      try {
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        const updates = {
          is_registered: false,
          registered_at: null,
          updated_at: new Date().toISOString()
        }
        const result = updateMockPatient(patientId, updates)
        if (!result) {
          return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
        }
        return NextResponse.json({ success: true, patient: result })
      } catch (mockError) {
        console.error('MOCK_MODE患者連携解除エラー:', mockError)
        return NextResponse.json({ error: 'Failed to unlink patient' }, { status: 500 })
      }
    }

    // 本番モードではデータベースを更新
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patients')
      .update({ 
        is_registered: false,
        registered_at: null
      })
      .eq('id', patientId)
      .select()
      .single()

    if (error) {
      console.error('患者連携解除エラー:', error)
      return NextResponse.json({ error: 'Failed to unlink patient' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, patient: data })
  } catch (error) {
    console.error('患者連携解除API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
