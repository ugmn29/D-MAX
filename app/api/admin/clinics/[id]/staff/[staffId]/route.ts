import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

type Params = { params: Promise<{ id: string; staffId: string }> }

// スタッフ情報を更新
export async function PUT(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId, staffId } = await params
  try {
    const body = await request.json()
    const { name, email, role } = body

    if (!name || !email) {
      return NextResponse.json({ error: '名前・メールアドレスは必須です' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const existing = await prisma.staff.findFirst({
      where: { id: staffId, clinic_id: clinicId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 })
    }

    const newRole = role === 'admin' ? 'admin' : 'staff'

    const updated = await prisma.staff.update({
      where: { id: staffId },
      data: { name, email, role: newRole },
    })

    // ロールが変わった場合はFirebase Custom Claimsも更新
    if (existing.role !== newRole && existing.email) {
      try {
        const { adminAuth } = getFirebaseAdmin()
        const firebaseUser = await adminAuth.getUserByEmail(existing.email)
        await adminAuth.setCustomUserClaims(firebaseUser.uid, {
          clinic_id: clinicId,
          staff_id: staffId,
          role: newRole,
        })
      } catch {
        // Claims更新失敗はスタッフ更新自体の成功には影響しない
        console.error('Firebase Custom Claims更新に失敗しました')
      }
    }

    return NextResponse.json({
      ok: true,
      staff: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// スタッフを完全削除
export async function DELETE(request: NextRequest, { params }: Params) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId, staffId } = await params
  try {
    const prisma = getPrismaClient()

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, clinic_id: clinicId },
    })
    if (!staff) {
      return NextResponse.json({ error: 'スタッフが見つかりません' }, { status: 404 })
    }

    // Firebase Authユーザーを削除（失敗してもDB削除は続行）
    if (staff.email) {
      try {
        const { adminAuth } = getFirebaseAdmin()
        const firebaseUser = await adminAuth.getUserByEmail(staff.email)
        await adminAuth.deleteUser(firebaseUser.uid)
      } catch {
        console.error('Firebase Authユーザーの削除に失敗しました（DB削除は続行）')
      }
    }

    await prisma.staff.delete({ where: { id: staffId } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
