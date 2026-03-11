import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/groups?clinicId=xxx
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const clinicId = new URL(req.url).searchParams.get('clinicId')
    if (!clinicId) return NextResponse.json({ error: 'clinicId is required' }, { status: 400 })

    const groups = await prisma.training_groups.findMany({
      where: { clinic_id: clinicId, is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        items: {
          orderBy: { sort_order: 'asc' },
          include: { training: true },
        },
      },
    })

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('training_groups GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/training/clinic/groups
// body: { clinicId, name, icon, color, sort_order }
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { clinicId, name, icon, color, sort_order } = await req.json()
    if (!clinicId || !name) return NextResponse.json({ error: 'clinicId and name are required' }, { status: 400 })

    const group = await prisma.training_groups.create({
      data: {
        clinic_id: clinicId,
        name,
        icon: icon ?? '📋',
        color: color ?? 'blue',
        sort_order: sort_order ?? 0,
      },
    })

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('training_groups POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/training/clinic/groups
// body: { id, name?, icon?, color?, sort_order?, is_active? }
export async function PUT(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { id, name, icon, color, sort_order, is_active } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const group = await prisma.training_groups.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(sort_order !== undefined && { sort_order }),
        ...(is_active !== undefined && { is_active }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ group })
  } catch (error: any) {
    console.error('training_groups PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/training/clinic/groups?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.training_groups.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('training_groups DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
