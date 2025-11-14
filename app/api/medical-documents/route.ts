import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Server-side medical document creation:', {
      patientId: body.patient_id,
      documentType: body.document_type
    })

    const supabaseClient = getSupabaseClient()
    console.log('Server-side Supabase client check:', {
      clientType: supabaseClient.constructor.name,
      hasAuth: !!supabaseClient.auth
    })

    const { data, error } = await supabaseClient
      .from('medical_documents')
      .insert([body])
      .select(`
        *,
        creator:staff!medical_documents_created_by_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error('Medical document creation error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('Medical document created successfully:', data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error creating medical document:', error)
    return NextResponse.json(
      { error: '提供文書の作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patient_id is required' },
        { status: 400 }
      )
    }

    const supabaseClient = getSupabaseClient()

    const { data, error } = await supabaseClient
      .from('medical_documents')
      .select(`
        *,
        creator:staff!medical_documents_created_by_fkey(id, name)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching medical documents:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error fetching medical documents:', error)
    return NextResponse.json(
      { error: '提供文書の取得に失敗しました' },
      { status: 500 }
    )
  }
}
