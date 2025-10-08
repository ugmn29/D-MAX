import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { MOCK_MODE } from '@/lib/utils/mock-mode'

// GET: 患者一覧を取得
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
        const mockPatients = getMockPatients()
        console.log('MOCK_MODE: localStorageから患者データを取得:', mockPatients.length, '件')
        return NextResponse.json(mockPatients)
      } catch (mockError) {
        console.error('MOCK_MODE患者データ取得エラー:', mockError)
        return NextResponse.json([])
      }
    }

    // 本番モードではデータベースから取得
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('patient_number', { ascending: true })

    if (error) {
      console.error('患者取得エラー:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('患者API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新しい患者を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, patient_number, last_name, first_name, last_name_kana, first_name_kana, birth_date, gender, phone, email, is_registered } = body

    if (!clinic_id || !last_name || !first_name) {
      return NextResponse.json({ error: 'clinic_id, last_name, and first_name are required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageに保存
    if (MOCK_MODE) {
      try {
        const { addMockPatient } = await import('@/lib/utils/mock-mode')
        const newPatient = {
          id: `p_${Date.now()}`,
          clinic_id,
          patient_number: patient_number || Date.now(),
          last_name,
          first_name,
          last_name_kana: last_name_kana || '',
          first_name_kana: first_name_kana || '',
          birth_date: birth_date || null,
          gender: gender || null,
          phone: phone || '',
          email: email || '',
          is_registered: is_registered !== undefined ? is_registered : false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        const result = addMockPatient(newPatient)
        return NextResponse.json(result)
      } catch (mockError) {
        console.error('MOCK_MODE患者作成エラー:', mockError)
        return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
      }
    }

    // 本番モードではデータベースに保存
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('patients')
      .insert({
        clinic_id,
        patient_number: patient_number || Date.now(),
        last_name,
        first_name,
        last_name_kana: last_name_kana || '',
        first_name_kana: first_name_kana || '',
        birth_date: birth_date || null,
        gender: gender || null,
        phone: phone || '',
        email: email || '',
        is_registered: is_registered !== undefined ? is_registered : false
      })
      .select()
      .single()

    if (error) {
      console.error('患者作成エラー:', error)
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('患者作成API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: 患者を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, last_name, first_name, last_name_kana, first_name_kana, birth_date, gender, phone, email, is_registered } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageを更新
    if (MOCK_MODE) {
      try {
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        const updates = {
          ...(last_name && { last_name }),
          ...(first_name && { first_name }),
          ...(last_name_kana !== undefined && { last_name_kana }),
          ...(first_name_kana !== undefined && { first_name_kana }),
          ...(birth_date !== undefined && { birth_date }),
          ...(gender !== undefined && { gender }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(is_registered !== undefined && { is_registered }),
          updated_at: new Date().toISOString()
        }
        const result = updateMockPatient(id, updates)
        if (!result) {
          return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
        }
        return NextResponse.json(result)
      } catch (mockError) {
        console.error('MOCK_MODE患者更新エラー:', mockError)
        return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
      }
    }

    // 本番モードではデータベースを更新
    const client = getSupabaseClient()
    const updates: any = {
      updated_at: new Date().toISOString()
    }
    
    if (last_name) updates.last_name = last_name
    if (first_name) updates.first_name = first_name
    if (last_name_kana !== undefined) updates.last_name_kana = last_name_kana
    if (first_name_kana !== undefined) updates.first_name_kana = first_name_kana
    if (birth_date !== undefined) updates.birth_date = birth_date
    if (gender !== undefined) updates.gender = gender
    if (phone !== undefined) updates.phone = phone
    if (email !== undefined) updates.email = email
    if (is_registered !== undefined) updates.is_registered = is_registered

    const { data, error } = await client
      .from('patients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('患者更新エラー:', error)
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('患者更新API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 患者を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // MOCK_MODEの場合はlocalStorageから削除
    if (MOCK_MODE) {
      try {
        const { removeMockPatient } = await import('@/lib/utils/mock-mode')
        removeMockPatient(id)
        return NextResponse.json({ success: true })
      } catch (mockError) {
        console.error('MOCK_MODE患者削除エラー:', mockError)
        return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
      }
    }

    // 本番モードではデータベースから削除
    const client = getSupabaseClient()
    const { error } = await client
      .from('patients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('患者削除エラー:', error)
      return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('患者削除API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
