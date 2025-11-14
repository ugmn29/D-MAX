import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params

    console.log('Server-side medical document fetch by ID:', { documentId })

    const supabaseClient = getSupabaseClient()

    const { data, error } = await supabaseClient
      .from('medical_documents')
      .select(`
        *,
        creator:staff!medical_documents_created_by_fkey(id, name)
      `)
      .eq('id', documentId)
      .single()

    if (error) {
      console.error('Medical document fetch error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error fetching medical document:', error)
    return NextResponse.json(
      { error: '提供文書の取得に失敗しました' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const body = await request.json()

    console.log('Server-side medical document update:', {
      documentId,
      updates: body
    })

    const supabaseClient = getSupabaseClient()

    const { data, error } = await supabaseClient
      .from('medical_documents')
      .update(body)
      .eq('id', documentId)
      .select(`
        *,
        creator:staff!medical_documents_created_by_fkey(id, name)
      `)
      .single()

    if (error) {
      console.error('Medical document update error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('Medical document updated successfully:', data.id)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error updating medical document:', error)
    return NextResponse.json(
      { error: '提供文書の更新に失敗しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params

    console.log('Server-side medical document deletion:', { documentId })

    const supabaseClient = getSupabaseClient()

    const { error } = await supabaseClient
      .from('medical_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('Medical document deletion error:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('Medical document deleted successfully:', documentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error deleting medical document:', error)
    return NextResponse.json(
      { error: '提供文書の削除に失敗しました' },
      { status: 500 }
    )
  }
}
