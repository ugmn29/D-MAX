import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

// GET /api/patient-alert-notes?patient_id=xxx - Get alert notes
// GET /api/patient-alert-notes?patient_id=xxx&action=check_confirmation&date=YYYY-MM-DD - Check today's confirmation
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patient_id')
    const action = searchParams.get('action')

    if (!patientId) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    if (action === 'check_confirmation') {
      const date = searchParams.get('date')
      if (!date) {
        return NextResponse.json({ error: 'date is required' }, { status: 400 })
      }
      const confirmation = await prisma.patient_alert_confirmations.findUnique({
        where: {
          patient_id_confirmed_date: {
            patient_id: patientId,
            confirmed_date: new Date(date)
          }
        },
        select: { id: true }
      })
      return NextResponse.json({ confirmed: !!confirmation })
    }

    // Default: get alert notes from patients table
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { alert_notes: true }
    })

    if (!patient?.alert_notes) {
      return NextResponse.json({ notes: [] })
    }

    try {
      const notes = JSON.parse(patient.alert_notes)
      return NextResponse.json({ notes: Array.isArray(notes) ? notes : [] })
    } catch {
      return NextResponse.json({ notes: [] })
    }
  } catch (error) {
    console.error('注意事項取得エラー:', error)
    return NextResponse.json({ error: '注意事項の取得に失敗しました' }, { status: 500 })
  }
}

// POST /api/patient-alert-notes - Update alert notes or record confirmation
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { patient_id, action, notes, date } = body

    if (!patient_id) {
      return NextResponse.json({ error: 'patient_id is required' }, { status: 400 })
    }

    if (action === 'record_confirmation') {
      if (!date) {
        return NextResponse.json({ error: 'date is required' }, { status: 400 })
      }
      try {
        await prisma.patient_alert_confirmations.create({
          data: {
            patient_id,
            confirmed_date: new Date(date)
          }
        })
      } catch (err: any) {
        // Unique constraint violation - already confirmed
        if (err.code === 'P2002') {
          return NextResponse.json({ success: true })
        }
        throw err
      }
      return NextResponse.json({ success: true })
    }

    // Default: update alert notes
    await prisma.patients.update({
      where: { id: patient_id },
      data: { alert_notes: JSON.stringify(notes || []) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('注意事項更新エラー:', error)
    return NextResponse.json({ error: '注意事項の更新に失敗しました' }, { status: 500 })
  }
}
