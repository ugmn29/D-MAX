import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-request'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma/client'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    const body = await request.json()
    const { newEmail } = body

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 })
    }

    if (newEmail === user.email) {
      return NextResponse.json({ error: '現在と同じメールアドレスです' }, { status: 400 })
    }

    const { adminAuth } = getFirebaseAdmin()

    // Firebase AuthのメールアドレスをAdmin SDKで更新
    await adminAuth.updateUser(user.uid, { email: newEmail })

    // DBのstaff.emailも同期
    await prisma.staff.updateMany({
      where: { id: user.staffId },
      data: { email: newEmail },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'このメールアドレスはすでに使用されています' }, { status: 400 })
    }
    if (error.message === '認証トークンがありません') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: error.message || 'メールアドレス変更に失敗しました' },
      { status: 500 }
    )
  }
}
