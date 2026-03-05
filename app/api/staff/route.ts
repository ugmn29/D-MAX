/**
 * Staff API Route - Prisma版
 * スタッフ作成時にFirebase Authアカウントも同時に作成
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { convertToDate } from '@/lib/prisma/helpers'
import { verifyAdmin } from '@/lib/auth/verify-request'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { sendStaffWelcomeEmail } from '@/lib/api/send-staff-welcome-email'

export async function POST(request: NextRequest) {
  try {
    // 管理者のみスタッフ作成可能
    const admin = await verifyAdmin(request)
    const clinicId = admin.clinicId

    const body = await request.json()
    const { name, name_kana, email, phone, position_id, role = 'staff' } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: '名前とメールアドレスは必須です' },
        { status: 400 }
      )
    }

    const { adminAuth } = getFirebaseAdmin()

    // Firebase Authユーザー作成（一時パスワードはランダム生成）
    const tempPassword = crypto.randomUUID()
    let firebaseUser
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name,
      })
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-exists'
        ? 'このメールアドレスは既に登録されています'
        : e.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // DBにスタッフレコード作成
    let newStaff
    try {
      newStaff = await prisma.staff.create({
        data: {
          clinic_id: clinicId,
          name,
          name_kana: name_kana || null,
          email,
          phone: phone || null,
          position_id: position_id || null,
          role: role === 'admin' ? 'admin' : 'staff',
          is_active: true,
        },
        include: {
          staff_positions: {
            select: {
              id: true,
              name: true,
              sort_order: true,
              clinic_id: true,
              created_at: true,
            }
          }
        }
      })
    } catch (e: any) {
      // ロールバック: Firebaseユーザーを削除
      await adminAuth.deleteUser(firebaseUser.uid)
      return NextResponse.json(
        { error: `スタッフ作成失敗: ${e.message}` },
        { status: 500 }
      )
    }

    // Firebase Custom Claims設定
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      clinic_id: clinicId,
      staff_id: newStaff.id,
      role: role === 'admin' ? 'admin' : 'staff',
    })

    // パスワード設定リンクを生成
    let passwordSetupLink: string | null = null
    try {
      passwordSetupLink = await adminAuth.generatePasswordResetLink(email)
    } catch {
      // リンク生成失敗してもスタッフ作成自体は成功扱い
    }

    // パスワード設定メールを自動送信
    let emailSent = false
    if (passwordSetupLink) {
      const clinic = await prisma.clinics.findUnique({ where: { id: clinicId }, select: { name: true } })
      if (clinic) {
        emailSent = await sendStaffWelcomeEmail({
          email,
          name,
          clinicName: clinic.name,
          passwordSetupLink,
        })
      }
    }

    const result = {
      id: newStaff.id,
      name: newStaff.name,
      name_kana: newStaff.name_kana || undefined,
      email: newStaff.email || undefined,
      phone: newStaff.phone || undefined,
      position_id: newStaff.position_id || undefined,
      role: newStaff.role || 'staff',
      is_active: newStaff.is_active ?? true,
      created_at: convertToDate(newStaff.created_at).toISOString(),
      updated_at: convertToDate(newStaff.updated_at).toISOString(),
      clinic_id: newStaff.clinic_id,
      position: newStaff.staff_positions ? {
        id: newStaff.staff_positions.id,
        name: newStaff.staff_positions.name,
        sort_order: newStaff.staff_positions.sort_order,
        clinic_id: newStaff.staff_positions.clinic_id,
        created_at: convertToDate(newStaff.staff_positions.created_at).toISOString(),
        updated_at: convertToDate(newStaff.staff_positions.created_at).toISOString()
      } : undefined,
      passwordSetupLink,
      emailSent,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    if (error.message === '管理者権限が必要です') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message === '認証トークンがありません') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('スタッフ作成エラー:', error)
    return NextResponse.json(
      { error: 'スタッフの作成に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const activeOnly = searchParams.get('active_only') !== 'false'

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const staffList = await prisma.staff.findMany({
      where: {
        clinic_id: clinicId,
        ...(activeOnly ? { is_active: true } : {})
      },
      include: {
        staff_positions: {
          select: {
            id: true,
            name: true,
            sort_order: true,
            clinic_id: true,
            created_at: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const staff = staffList.map(s => ({
      id: s.id,
      name: s.name,
      name_kana: s.name_kana || undefined,
      email: s.email || undefined,
      phone: s.phone || undefined,
      position_id: s.position_id || undefined,
      role: s.role || 'staff',
      is_active: s.is_active ?? true,
      created_at: convertToDate(s.created_at).toISOString(),
      updated_at: convertToDate(s.updated_at).toISOString(),
      clinic_id: s.clinic_id,
      position: s.staff_positions ? {
        id: s.staff_positions.id,
        name: s.staff_positions.name,
        sort_order: s.staff_positions.sort_order,
        clinic_id: s.staff_positions.clinic_id,
        created_at: convertToDate(s.staff_positions.created_at).toISOString(),
        updated_at: convertToDate(s.staff_positions.created_at).toISOString()
      } : undefined
    }))

    return NextResponse.json(staff)
  } catch (error) {
    console.error('スタッフ取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
