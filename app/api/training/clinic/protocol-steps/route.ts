import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/protocol-steps?protocolId=xxx
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const protocolId = new URL(req.url).searchParams.get('protocolId')
    if (!protocolId) return NextResponse.json({ error: 'protocolId is required' }, { status: 400 })

    const steps = await prisma.training_protocol_steps.findMany({
      where: { protocol_id: protocolId },
      orderBy: { step_number: 'asc' },
      include: {
        items: {
          orderBy: { sort_order: 'asc' },
          include: { training: true },
        },
      },
    })

    return NextResponse.json({ steps })
  } catch (error: any) {
    console.error('training_protocol_steps GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/training/clinic/protocol-steps
// body: { protocolId, step_number, checkpoint_name, description? }
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { protocolId, step_number, checkpoint_name, description } = await req.json()
    if (!protocolId || !checkpoint_name) return NextResponse.json({ error: 'protocolId and checkpoint_name are required' }, { status: 400 })

    const step = await prisma.training_protocol_steps.create({
      data: {
        protocol_id: protocolId,
        step_number: step_number ?? 1,
        checkpoint_name,
        description: description ?? null,
      },
    })

    return NextResponse.json({ step })
  } catch (error: any) {
    console.error('training_protocol_steps POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT /api/training/clinic/protocol-steps
// body: { id, step_number?, checkpoint_name?, description? }
export async function PUT(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { id, step_number, checkpoint_name, description } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const step = await prisma.training_protocol_steps.update({
      where: { id },
      data: {
        ...(step_number !== undefined && { step_number }),
        ...(checkpoint_name !== undefined && { checkpoint_name }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({ step })
  } catch (error: any) {
    console.error('training_protocol_steps PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/training/clinic/protocol-steps?id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.training_protocol_steps.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('training_protocol_steps DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
