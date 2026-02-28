import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

// Firebase Authユーザー情報取得
export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const email = new URL(request.url).searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  try {
    const { adminAuth } = getFirebaseAdmin()
    const user = await adminAuth.getUserByEmail(email)
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      customClaims: user.customClaims,
      createdAt: user.metadata.creationTime,
    })
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Firebase Authユーザー削除
export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const email = new URL(request.url).searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  try {
    const { adminAuth } = getFirebaseAdmin()
    const user = await adminAuth.getUserByEmail(email)
    await adminAuth.deleteUser(user.uid)
    return NextResponse.json({ ok: true, deleted_uid: user.uid })
  } catch (e: any) {
    if (e.code === 'auth/user-not-found') {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
