import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const prisma = getPrismaClient()

    console.log('Server-side medical document fetch by ID:', { documentId })

    const data = await prisma.medical_documents.findUnique({
      where: { id: documentId },
      include: {
        staff: {
          select: { id: true, name: true }
        }
      }
    })

    if (!data) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Reshape to match Supabase's aliased join format: creator instead of staff
    const { staff, ...rest } = data
    const converted = convertDatesToStrings(rest, ['created_at', 'updated_at'])
    const result = { ...converted, creator: staff }

    return NextResponse.json(result)
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
    const prisma = getPrismaClient()

    console.log('Server-side medical document update:', {
      documentId,
      updates: body
    })

    const data = await prisma.medical_documents.update({
      where: { id: documentId },
      data: body,
      include: {
        staff: {
          select: { id: true, name: true }
        }
      }
    })

    // Reshape to match Supabase's aliased join format: creator instead of staff
    const { staff, ...rest } = data
    const converted = convertDatesToStrings(rest, ['created_at', 'updated_at'])
    const result = { ...converted, creator: staff }

    console.log('Medical document updated successfully:', result.id)
    return NextResponse.json(result)
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
    const prisma = getPrismaClient()

    console.log('Server-side medical document deletion:', { documentId })

    await prisma.medical_documents.delete({
      where: { id: documentId }
    })

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
