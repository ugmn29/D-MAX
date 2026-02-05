import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/auth/verify-request'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 管理者のみ実行可能
    const admin = await verifyAdmin(request)

    const body = await request.json()
    const { email, password, name, role = 'staff' } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'メールアドレス、パスワード、名前は必須です' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上にしてください' },
        { status: 400 }
      )
    }

    const { adminAuth } = getFirebaseAdmin()

    // Firebaseユーザー作成
    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    })

    // Supabaseにスタッフレコード作成
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        clinic_id: admin.clinicId,
        name,
        email,
        role: role === 'admin' ? 'admin' : 'staff',
        is_active: true,
      })
      .select()
      .single()

    if (staffError) {
      // ロールバック: Firebaseユーザーを削除
      await adminAuth.deleteUser(firebaseUser.uid)
      return NextResponse.json(
        { error: `スタッフレコード作成エラー: ${staffError.message}` },
        { status: 500 }
      )
    }

    // Custom Claims設定
    await adminAuth.setCustomUserClaims(firebaseUser.uid, {
      clinic_id: admin.clinicId,
      staff_id: staff.id,
      role: role === 'admin' ? 'admin' : 'staff',
    })

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    })
  } catch (error: any) {
    if (error.message === '管理者権限が必要です') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error.message === '認証トークンがありません') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const message = error.code === 'auth/email-already-exists'
      ? 'このメールアドレスは既に登録されています'
      : error.message || 'スタッフ作成に失敗しました'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
