import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    console.log('Server-side medical document creation:', {
      patientId: body.patient_id,
      documentType: body.document_type
    })

    const data = await prisma.medical_documents.create({
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

    console.log('Medical document created successfully:', result.id)
    return NextResponse.json(result)
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

    const prisma = getPrismaClient()

    const data = await prisma.medical_documents.findMany({
      where: { patient_id: patientId },
      include: {
        staff: {
          select: { id: true, name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    // Reshape to match Supabase's aliased join format: creator instead of staff
    const result = data.map(({ staff, ...rest }) => {
      const converted = convertDatesToStrings(rest, ['created_at', 'updated_at'])
      return { ...converted, creator: staff }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Unexpected error fetching medical documents:', error)
    return NextResponse.json(
      { error: '提供文書の取得に失敗しました' },
      { status: 500 }
    )
  }
}
