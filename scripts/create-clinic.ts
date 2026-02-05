/**
 * 医院＋管理者アカウント作成スクリプト（運営用）
 *
 * 使用方法:
 *   npx ts-node scripts/create-clinic.ts
 *
 * 前提条件:
 *   gcloud auth login 済み
 *   .env.local に Supabase 環境変数が設定済み
 */

import * as dotenv from 'dotenv'
import * as readline from 'readline'
import { execSync } from 'child_process'

// .env.local を読み込み
dotenv.config({ path: '.env.local' })

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'd-max-66011'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim())
    })
  })
}

function getAccessToken(): string {
  return execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim()
}

async function createFirebaseUser(
  accessToken: string,
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': FIREBASE_PROJECT_ID,
    },
    body: JSON.stringify({
      email,
      password,
      displayName,
      emailVerified: true,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Firebaseユーザー作成エラー: ${error}`)
  }

  const data = await res.json()
  return data.localId
}

async function setCustomClaims(
  accessToken: string,
  uid: string,
  claims: Record<string, any>
): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/accounts:update`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': FIREBASE_PROJECT_ID,
    },
    body: JSON.stringify({
      localId: uid,
      customAttributes: JSON.stringify(claims),
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Custom Claims設定エラー: ${error}`)
  }
}

async function main() {
  console.log('=== DAX 医院＋管理者アカウント作成 ===\n')

  // 入力を収集
  const clinicName = await question('医院名: ')
  const adminEmail = await question('管理者メールアドレス: ')
  const adminPassword = await question('初期パスワード（6文字以上）: ')
  const adminName = await question('管理者名: ')

  if (!clinicName || !adminEmail || !adminPassword || !adminName) {
    console.error('全ての項目を入力してください')
    rl.close()
    process.exit(1)
  }

  if (adminPassword.length < 6) {
    console.error('パスワードは6文字以上にしてください')
    rl.close()
    process.exit(1)
  }

  console.log('\n以下の内容で作成します:')
  console.log(`  医院名: ${clinicName}`)
  console.log(`  管理者メール: ${adminEmail}`)
  console.log(`  管理者名: ${adminName}`)

  const confirm = await question('\n作成しますか？ (y/n): ')
  if (confirm.toLowerCase() !== 'y') {
    console.log('キャンセルしました')
    rl.close()
    process.exit(0)
  }

  try {
    // gcloud アクセストークン取得
    console.log('\n0. gcloudアクセストークンを取得中...')
    const accessToken = getAccessToken()
    console.log('   トークン取得完了')

    // Supabase初期化
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabaseの環境変数が設定されていません')
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Supabaseに医院レコード作成
    console.log('1. 医院レコードを作成中...')
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        name: clinicName,
        time_slot_minutes: 15,
      })
      .select()
      .single()

    if (clinicError) {
      throw new Error(`医院レコード作成エラー: ${clinicError.message}`)
    }
    console.log(`   医院ID: ${clinic.id}`)

    // 2. Firebaseにユーザー作成（REST API）
    console.log('2. Firebaseユーザーを作成中...')
    const firebaseUid = await createFirebaseUser(accessToken, adminEmail, adminPassword, adminName)
    console.log(`   Firebase UID: ${firebaseUid}`)

    // 3. Supabaseにスタッフレコード作成
    console.log('3. スタッフレコードを作成中...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        clinic_id: clinic.id,
        name: adminName,
        email: adminEmail,
        role: 'admin',
        is_active: true,
      })
      .select()
      .single()

    if (staffError) {
      throw new Error(`スタッフレコード作成エラー: ${staffError.message}`)
    }
    console.log(`   スタッフID: ${staff.id}`)

    // 4. Firebase Custom Claims設定（REST API）
    console.log('4. Firebase Custom Claimsを設定中...')
    await setCustomClaims(accessToken, firebaseUid, {
      clinic_id: clinic.id,
      staff_id: staff.id,
      role: 'admin',
    })
    console.log('   Custom Claims設定完了')

    console.log('\n=== 作成完了 ===')
    console.log(`医院名: ${clinicName}`)
    console.log(`医院ID: ${clinic.id}`)
    console.log(`管理者名: ${adminName}`)
    console.log(`メール: ${adminEmail}`)
    console.log(`ロール: admin（管理者）`)
    console.log('\n上記の情報を管理者に共有してください。')
  } catch (error: any) {
    console.error(`\nエラー: ${error.message}`)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
