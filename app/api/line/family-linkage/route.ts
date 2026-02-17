import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * 家族連携API
 *
 * POST: 家族メンバーを連携
 * GET: 連携済みの家族メンバー一覧を取得
 * DELETE: 家族連携を解除
 */

export async function POST(request: NextRequest) {
  try {
    const { line_user_id, patient_id, relationship } = await request.json()

    // バリデーション
    if (!line_user_id || !patient_id) {
      return NextResponse.json(
        { error: 'LINE User IDと患者IDが必要です' },
        { status: 400 }
      )
    }

    // 関係性のバリデーション
    const validRelationships = ['parent', 'spouse', 'child', 'other']
    if (relationship && !validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: '関係性の値が正しくありません' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 患者情報を取得
    const patient = await prisma.patients.findUnique({
      where: { id: patient_id },
      select: {
        id: true,
        clinic_id: true,
        patient_number: true,
        last_name: true,
        first_name: true,
        birth_date: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: '患者が見つかりません' },
        { status: 404 }
      )
    }

    // 既に連携されているか確認
    const existingLinkage = await prisma.line_patient_linkages.findUnique({
      where: {
        idx_line_patient_linkages_unique: {
          line_user_id,
          patient_id
        }
      },
      select: { id: true }
    })

    if (existingLinkage) {
      return NextResponse.json(
        { error: 'この患者は既に連携されています' },
        { status: 409 }
      )
    }

    // 既存の連携数を確認（プライマリ判定のため）
    const existingCount = await prisma.line_patient_linkages.count({
      where: { line_user_id }
    })

    // 連携を作成
    const linkage = await prisma.line_patient_linkages.create({
      data: {
        line_user_id,
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        relationship: relationship || 'other',
        is_primary: existingCount === 0, // 初めての連携ならプライマリ
        linked_at: new Date()
      }
    })

    // QRコードが存在しない場合は自動生成
    const existingQR = await prisma.patient_qr_codes.findUnique({
      where: { patient_id },
      select: { id: true }
    })

    if (!existingQR) {
      const qr_token = `${patient.clinic_id}-${patient.id}-${Date.now()}`
      await prisma.patient_qr_codes.create({
        data: {
          patient_id: patient.id,
          clinic_id: patient.clinic_id,
          qr_token,
          expires_at: null,
          usage_count: 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      linkage: {
        id: linkage.id,
        patient: {
          id: patient.id,
          name: `${patient.last_name} ${patient.first_name}`,
          patient_number: patient.patient_number,
          birth_date: patient.birth_date ? patient.birth_date.toISOString() : null
        },
        relationship: linkage.relationship,
        is_primary: linkage.is_primary,
        linked_at: linkage.linked_at ? linkage.linked_at.toISOString() : null
      }
    })

  } catch (error) {
    console.error('家族連携API エラー:', error)
    return NextResponse.json(
      { error: '連携処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const line_user_id = searchParams.get('line_user_id')

    if (!line_user_id) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 連携情報を取得（患者情報含む）
    const linkages = await prisma.line_patient_linkages.findMany({
      where: { line_user_id },
      select: {
        id: true,
        patient_id: true,
        relationship: true,
        is_primary: true,
        linked_at: true
      },
      orderBy: [
        { is_primary: 'desc' },
        { linked_at: 'asc' }
      ]
    })

    // 患者情報を取得して結合
    const linkagesWithPatients = await Promise.all(
      linkages.map(async (linkage) => {
        const patient = await prisma.patients.findUnique({
          where: { id: linkage.patient_id },
          select: {
            id: true,
            patient_number: true,
            last_name: true,
            first_name: true,
            birth_date: true,
            phone: true
          }
        })
        return {
          ...linkage,
          linked_at: linkage.linked_at ? linkage.linked_at.toISOString() : null,
          patients: patient ? {
            ...patient,
            birth_date: patient.birth_date ? patient.birth_date.toISOString() : null
          } : null
        }
      })
    )

    return NextResponse.json({
      linkages: linkagesWithPatients,
      count: linkagesWithPatients.length
    })

  } catch (error) {
    console.error('家族連携取得API エラー:', error)
    return NextResponse.json(
      { error: '取得処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const linkage_id = searchParams.get('id')

    if (!linkage_id) {
      return NextResponse.json(
        { error: '連携IDが必要です' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 連携を削除
    await prisma.line_patient_linkages.delete({
      where: { id: linkage_id }
    })

    return NextResponse.json({
      success: true,
      message: '連携を解除しました'
    })

  } catch (error) {
    console.error('家族連携削除API エラー:', error)
    return NextResponse.json(
      { error: '削除処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
