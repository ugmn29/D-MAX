import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

// クリニックの初回スタッフアカウントを作成
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  try {
    const body = await request.json()
    const { name, email, password, role = 'admin' } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: '名前・メール・パスワードは必須です' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上にしてください' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // クリニック存在確認
    const clinic = await prisma.clinics.findUnique({ where: { id: clinicId }, select: { id: true } })
    if (!clinic) {
      return NextResponse.json({ error: 'クリニックが見つかりません' }, { status: 404 })
    }

    const { adminAuth } = getFirebaseAdmin()

    // Firebase Authユーザー作成
    let firebaseUser
    try {
      firebaseUser = await adminAuth.createUser({ email, password, displayName: name })
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-exists'
        ? 'このメールアドレスはすでに登録されています'
        : e.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // DBにスタッフレコード作成
    let staff
    try {
      staff = await prisma.staff.create({
        data: {
          clinic_id: clinicId,
          name,
          email,
          role: role === 'admin' ? 'admin' : 'staff',
          is_active: true,
        },
      })
    } catch (e: any) {
      // ロールバック: Firebaseユーザーを削除
      await adminAuth.deleteUser(firebaseUser.uid)
      return NextResponse.json({ error: `スタッフ作成失敗: ${e.message}` }, { status: 500 })
    }

    // Firebase Custom Claims設定（clinic_id・staff_id・role）
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      clinic_id: clinicId,
      staff_id: staff.id,
      role: role === 'admin' ? 'admin' : 'staff',
    })

    return NextResponse.json({
      ok: true,
      staff: { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// クリニックのスタッフ一覧取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  try {
    const prisma = getPrismaClient()
    const staffList = await prisma.staff.findMany({
      where: { clinic_id: clinicId },
      select: { id: true, name: true, email: true, role: true, is_active: true, created_at: true },
      orderBy: { created_at: 'asc' },
    })
    return NextResponse.json(staffList)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
