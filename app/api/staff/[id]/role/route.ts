import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-request'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma-client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const requester = await verifyAdmin(request)
    const { id: staffId } = await params
    const { role } = await request.json()

    if (role !== 'admin' && role !== 'staff') {
      return NextResponse.json({ error: '無効なロールです' }, { status: 400 })
    }

    // 自分自身のロールは変更不可
    if (staffId === requester.staffId) {
      return NextResponse.json(
        { error: '自分自身のロールは変更できません' },
        { status: 400 }
      )
    }

    // DBのロールを更新
    const staff = await prisma.staff.update({
      where: { id: staffId, clinic_id: requester.clinicId },
      data: { role, updated_at: new Date() },
      select: { id: true, email: true, role: true },
    })

    // Firebase カスタムクレームのロールを更新
    const { adminAuth } = getFirebaseAdmin()
    try {
      const firebaseUser = await adminAuth.getUserByEmail(staff.email ?? '')
      const currentClaims = firebaseUser.customClaims || {}
      await adminAuth.setCustomUserClaims(firebaseUser.uid, {
        ...currentClaims,
        role,
      })
    } catch {
      // Firebaseアカウントが未連携の場合はDB更新のみで続行
    }

    return NextResponse.json({ success: true, role: staff.role })
  } catch (error: any) {
    if (error.message === '管理者権限が必要です') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message === '認証トークンがありません') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: error.message || 'ロールの更新に失敗しました' },
      { status: 500 }
    )
  }
}
