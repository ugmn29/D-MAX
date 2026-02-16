import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/line/user-links?lineUserId=xxx&clinicId=xxx
 * または GET /api/line/user-links?patientId=xxx
 * LINE連携を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const lineUserId = searchParams.get('lineUserId')
    const clinicId = searchParams.get('clinicId')
    const patientId = searchParams.get('patientId')

    if (patientId) {
      // 患者IDでLINE連携を取得
      const links = await prisma.line_user_links.findMany({
        where: {
          patient_id: patientId
        }
      })

      const linksWithStringDates = links.map(link =>
        convertDatesToStrings(link, ['created_at', 'updated_at', 'linked_at', 'last_selected_at', 'last_interaction_at'])
      )

      return NextResponse.json(linksWithStringDates)
    }

    if (lineUserId) {
      // LINE User IDで連携を取得
      const where: any = {
        line_user_id: lineUserId
      }

      if (clinicId) {
        where.clinic_id = clinicId
      }

      const links = await prisma.line_user_links.findMany({
        where,
        orderBy: [
          { is_primary: 'desc' },
          { linked_at: 'asc' }
        ]
      })

      const linksWithStringDates = links.map(link =>
        convertDatesToStrings(link, ['created_at', 'updated_at', 'linked_at', 'last_selected_at', 'last_interaction_at'])
      )

      return NextResponse.json(linksWithStringDates)
    }

    return NextResponse.json(
      { error: 'lineUserId or patientId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('LINE連携取得エラー:', error)
    return NextResponse.json(
      { error: 'LINE連携の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/line/user-links
 * LINE User IDと患者を紐付け
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { clinic_id, line_user_id, patient_number, birthdate, relationship } = body

    if (!clinic_id || !line_user_id || !patient_number || !birthdate) {
      return NextResponse.json(
        { error: 'clinic_id, line_user_id, patient_number, birthdate are required' },
        { status: 400 }
      )
    }

    // 患者番号と生年月日で患者を検索
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id,
        patient_number
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        birth_date: true
      }
    })

    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { error: '該当する患者が見つかりません' },
        { status: 404 }
      )
    }

    // 生年月日の照合（8桁数字で照合）
    const patient = patients.find(p => {
      if (!p.birth_date) return false
      const birthDate = new Date(p.birth_date)
      const birthdateStr = `${birthDate.getFullYear()}${String(birthDate.getMonth() + 1).padStart(2, '0')}${String(birthDate.getDate()).padStart(2, '0')}`
      return birthdateStr === birthdate
    })

    if (!patient) {
      return NextResponse.json(
        { error: '生年月日が一致しません' },
        { status: 400 }
      )
    }

    // 既に連携されているかチェック
    const existing = await prisma.line_user_links.findFirst({
      where: {
        line_user_id,
        patient_id: patient.id
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: '既に連携されています' },
        { status: 400 }
      )
    }

    // 現在の連携数を確認
    const existingLinks = await prisma.line_user_links.findMany({
      where: {
        line_user_id
      }
    })

    const isPrimary = existingLinks.length === 0

    // 連携を作成
    const link = await prisma.line_user_links.create({
      data: {
        clinic_id,
        line_user_id,
        patient_id: patient.id,
        relationship: relationship || (isPrimary ? 'self' : null),
        nickname: `${patient.last_name} ${patient.first_name}`,
        is_primary: isPrimary,
        linked_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    const linkWithStringDates = convertDatesToStrings(link, ['created_at', 'updated_at', 'linked_at', 'last_selected_at', 'last_interaction_at'])

    return NextResponse.json({
      ...linkWithStringDates,
      patient_name: `${patient.last_name} ${patient.first_name}`
    })
  } catch (error) {
    console.error('LINE連携作成エラー:', error)
    return NextResponse.json(
      { error: 'LINE連携の作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/line/user-links?lineUserId=xxx&patientId=xxx
 * LINE連携を削除
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const lineUserId = searchParams.get('lineUserId')
    const patientId = searchParams.get('patientId')

    if (!lineUserId || !patientId) {
      return NextResponse.json(
        { error: 'lineUserId and patientId are required' },
        { status: 400 }
      )
    }

    await prisma.line_user_links.deleteMany({
      where: {
        line_user_id: lineUserId,
        patient_id: patientId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LINE連携削除エラー:', error)
    return NextResponse.json(
      { error: 'LINE連携の削除に失敗しました' },
      { status: 500 }
    )
  }
}
