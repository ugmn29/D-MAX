import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { currentPassword, newPassword, email } = await request.json()

  if (!email || !currentPassword || !newPassword) {
    return NextResponse.json({ error: '必要な項目が不足しています' }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'パスワードは8文字以上で入力してください' }, { status: 400 })
  }

  // 現在のパスワード検証
  const account = await prisma.admin_accounts.findUnique({ where: { email } }).catch(() => null)

  if (account) {
    const valid = await bcrypt.compare(currentPassword, account.password_hash)
    if (!valid) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 })
    }
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.admin_accounts.update({
      where: { email },
      data: { password_hash: hash, updated_at: new Date() },
    })
  } else {
    // 環境変数で照合（初回: DBに移行しつつパスワードを変更）
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
    if (email !== ADMIN_EMAIL || currentPassword !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 401 })
    }
    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.admin_accounts.create({
      data: { email, password_hash: hash },
    })
  }

  return NextResponse.json({ ok: true })
}
