import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['completed_at', 'implemented_date', 'created_at', 'updated_at']

export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status')

    if (!clinicId || !patientId) {
      return NextResponse.json({ error: 'clinic_id and patient_id are required' }, { status: 400 })
    }

    const where: any = { clinic_id: clinicId, patient_id: patientId }
    if (status === 'pending') {
      where.status = { in: ['planned', 'in_progress'] }
    }

    const data = await prisma.treatment_plans.findMany({
      where,
      orderBy: { sort_order: 'asc' }
    })

    return NextResponse.json(data.map(d => convertDatesToStrings(d, DATE_FIELDS)))
  } catch (error) {
    console.error('治療計画取得エラー:', error)
    return NextResponse.json({ error: '治療計画の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { clinic_id, patient_id, ...input } = body

    if (!clinic_id || !patient_id) {
      return NextResponse.json({ error: 'clinic_id and patient_id are required' }, { status: 400 })
    }

    // Get max sort_order
    const maxPlan = await prisma.treatment_plans.findFirst({
      where: { clinic_id, patient_id },
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true }
    })

    const data = await prisma.treatment_plans.create({
      data: {
        clinic_id,
        patient_id,
        ...input,
        sort_order: input.sort_order ?? ((maxPlan?.sort_order ?? -1) + 1),
        priority: input.priority ?? 2,
        status: input.status ?? 'planned'
      }
    })

    return NextResponse.json(convertDatesToStrings(data, DATE_FIELDS))
  } catch (error) {
    console.error('治療計画作成エラー:', error)
    return NextResponse.json({ error: '治療計画の作成に失敗しました' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { action, id, clinic_id, ...input } = body

    if (action === 'reorder') {
      const { plan_ids, patient_id } = body
      if (!plan_ids || !clinic_id || !patient_id) {
        return NextResponse.json({ error: 'plan_ids, clinic_id, patient_id required' }, { status: 400 })
      }
      await Promise.all(
        plan_ids.map((planId: string, index: number) =>
          prisma.treatment_plans.update({
            where: { id: planId },
            data: { sort_order: index }
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'complete') {
      if (!id || !clinic_id) {
        return NextResponse.json({ error: 'id and clinic_id required' }, { status: 400 })
      }
      const data = await prisma.treatment_plans.update({
        where: { id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          implemented_date: new Date(),
          implemented_by: input.implemented_by,
          memo: input.memo,
          updated_at: new Date()
        }
      })
      return NextResponse.json(convertDatesToStrings(data, DATE_FIELDS))
    }

    // Default update
    if (!id || !clinic_id) {
      return NextResponse.json({ error: 'id and clinic_id are required' }, { status: 400 })
    }

    const data = await prisma.treatment_plans.update({
      where: { id },
      data: { ...input, updated_at: new Date() }
    })

    return NextResponse.json(convertDatesToStrings(data, DATE_FIELDS))
  } catch (error) {
    console.error('治療計画更新エラー:', error)
    return NextResponse.json({ error: '治療計画の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const clinicId = searchParams.get('clinic_id')

    if (!id || !clinicId) {
      return NextResponse.json({ error: 'id and clinic_id are required' }, { status: 400 })
    }

    await prisma.treatment_plans.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('治療計画削除エラー:', error)
    return NextResponse.json({ error: '治療計画の削除に失敗しました' }, { status: 500 })
  }
}
