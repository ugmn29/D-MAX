import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// POST /api/training/clinic/protocol-step-items
// body: { stepId, trainingId, sort_order? }
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { stepId, trainingId, sort_order } = await req.json()
    if (!stepId || !trainingId) return NextResponse.json({ error: 'stepId and trainingId are required' }, { status: 400 })

    const item = await prisma.training_protocol_step_items.create({
      data: {
        step_id: stepId,
        training_id: trainingId,
        sort_order: sort_order ?? 0,
      },
    })

    return NextResponse.json({ item })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    }
    console.error('training_protocol_step_items POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/training/clinic/protocol-step-items?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.training_protocol_step_items.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('training_protocol_step_items DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
