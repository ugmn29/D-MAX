import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    // 既存のクリニックIDを取得
    const existingClinic = await prisma.clinics.findFirst({
      select: { id: true }
    })

    let clinicId: string

    if (!existingClinic) {
      // クリニックがなければデモクリニックを作成
      try {
        const newClinic = await prisma.clinics.create({
          data: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'デモクリニック'
          }
        })
        clinicId = newClinic.id
      } catch (e: any) {
        // unique violation (already exists)
        if (e.code === 'P2002') {
          clinicId = '11111111-1111-1111-1111-111111111111'
        } else {
          console.error('クリニック作成エラー:', e)
          return NextResponse.json({ error: 'クリニック作成失敗' }, { status: 500 })
        }
      }
    } else {
      clinicId = existingClinic.id
    }

    // デモスタッフを作成
    try {
      const staff = await prisma.staff.create({
        data: {
          id: '11111111-1111-1111-1111-111111111111',
          clinic_id: clinicId,
          name: 'デモスタッフ',
          email: 'demo@example.com',
          role: 'admin',
          is_active: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'デモスタッフを作成しました',
        staff
      })
    } catch (e: any) {
      if (e.code === 'P2002') {
        // 既に存在する場合は成功とみなす
        return NextResponse.json({
          success: true,
          message: 'デモスタッフは既に存在します',
          staff_id: '11111111-1111-1111-1111-111111111111'
        })
      }

      console.error('スタッフ作成エラー:', e)
      return NextResponse.json({ error: 'スタッフ作成失敗', details: e.message }, { status: 500 })
    }

  } catch (error) {
    console.error('セットアップエラー:', error)
    return NextResponse.json({ error: 'セットアップ失敗' }, { status: 500 })
  }
}
