import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-request'
import { getFirebaseAdmin } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request)

    const body = await request.json()
    const { newPassword } = body

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: '新しいパスワードは6文字以上にしてください' },
        { status: 400 }
      )
    }

    const { adminAuth } = getFirebaseAdmin()

    // Firebase Admin SDKでパスワード更新
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === '認証トークンがありません') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: error.message || 'パスワード変更に失敗しました' },
      { status: 500 }
    )
  }
}
