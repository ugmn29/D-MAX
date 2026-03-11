import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/protocols?clinicId=xxx
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const clinicId = new URL(req.url).searchParams.get('clinicId')
    if (!clinicId) return NextResponse.json({ error: 'clinicId is required' }, { status: 400 })

    const protocols = await prisma.training_protocols.findMany({
      where: { clinic_id: clinicId, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        steps: {
          orderBy: { step_number: 'asc' },
          include: {
            items: {
              orderBy: { sort_order: 'asc' },
              include: { training: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ protocols })
  } catch (error: any) {
    console.error('training_protocols GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/training/clinic/protocols
// body: { clinicId, name, description?, sort_order?, is_parallel_layout? }
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { clinicId, name, description, sort_order, is_parallel_layout } = await req.json()
    if (!clinicId || !name) return NextResponse.json({ error: 'clinicId and name are required' }, { status: 400 })

    const protocol = await prisma.training_protocols.create({
      data: {
        clinic_id: clinicId,
        name,
        description: description ?? null,
        sort_order: sort_order ?? 0,
        is_parallel_layout: is_parallel_layout ?? false,
      },
    })

    return NextResponse.json({ protocol })
  } catch (error: any) {
    console.error('training_protocols POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/training/clinic/protocols
// body: { id, name?, description?, sort_order?, is_active?, is_parallel_layout? }
export async function PUT(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { id, name, description, sort_order, is_active, is_parallel_layout } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const protocol = await prisma.training_protocols.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(sort_order !== undefined && { sort_order }),
        ...(is_active !== undefined && { is_active }),
        ...(is_parallel_layout !== undefined && { is_parallel_layout }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ protocol })
  } catch (error: any) {
    console.error('training_protocols PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/training/clinic/protocols?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.training_protocols.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('training_protocols DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
