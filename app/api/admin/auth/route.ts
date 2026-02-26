import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET

export async function POST(request: NextRequest) {
  const { action, email, password } = await request.json()

  if (action === 'logout') {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('__admin_session', '', { maxAge: 0, path: '/' })
    return response
  }

  // ログイン
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: '管理者設定が未構成です' }, { status: 500 })
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set('__admin_session', ADMIN_SESSION_SECRET, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8時間
  })
  return response
}
