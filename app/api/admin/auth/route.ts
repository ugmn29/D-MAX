import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma-client'

const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, email, password } = body

  if (action === 'logout') {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('__admin_session', '', { maxAge: 0, path: '/' })
    return response
  }

  if (!ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: '管理者設定が未構成です' }, { status: 500 })
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'メールアドレスとパスワードを入力してください' }, { status: 400 })
  }

  // DBから管理者アカウントを検索
  const account = await prisma.admin_accounts.findUnique({ where: { email } }).catch(() => null)

  // DBに存在しない場合は環境変数にフォールバック（初回移行用）
  let authenticated = false
  if (account) {
    authenticated = await bcrypt.compare(password, account.password_hash)
  } else {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      authenticated = true
    }
  }

  if (!authenticated) {
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
