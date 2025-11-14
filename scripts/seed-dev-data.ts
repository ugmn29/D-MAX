/**
 * 開発用シードデータ作成スクリプト
 * Development Seed Data Script
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🌱 開発用データを作成中...\n')

  try {
    // 1. クリニック作成
    console.log('1️⃣ クリニックを作成...')
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .upsert({
        name: 'テスト歯科医院',
        name_kana: 'テストシカイイン',
        time_slot_minutes: 15,
      })
      .select()
      .single()

    if (clinicError) throw clinicError
    console.log(`   ✅ クリニック作成: ${clinic.name}\n`)

    // 2. スタッフ作成
    console.log('2️⃣ スタッフを作成...')
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .upsert({
        clinic_id: clinic.id,
        name: '院長',
        name_kana: 'インチョウ',
        role: 'admin',
        is_active: true,
      })
      .select()
      .single()

    if (staffError && staffError.code !== '23505') throw staffError
    console.log(`   ✅ スタッフ作成: ${staff?.name || '院長'}\n`)

    // 3. ユニット作成
    console.log('3️⃣ ユニット（診療台）を作成...')
    const { error: unitError } = await supabase
      .from('units')
      .upsert([
        { clinic_id: clinic.id, name: 'ユニット1', sort_order: 1 },
        { clinic_id: clinic.id, name: 'ユニット2', sort_order: 2 },
      ])

    if (unitError && unitError.code !== '23505') throw unitError
    console.log(`   ✅ ユニット作成完了\n`)

    // 4. テスト患者作成
    console.log('4️⃣ テスト患者を作成...')
    const patients = [
      {
        clinic_id: clinic.id,
        patient_number: 1,
        last_name: '山田',
        first_name: '太郎',
        last_name_kana: 'ヤマダ',
        first_name_kana: 'タロウ',
        birth_date: '2015-04-15',
        gender: 'male',
        phone: '090-1234-5678',
        is_registered: true,
      },
      {
        clinic_id: clinic.id,
        patient_number: 2,
        last_name: '佐藤',
        first_name: '花子',
        last_name_kana: 'サトウ',
        first_name_kana: 'ハナコ',
        birth_date: '2010-08-20',
        gender: 'female',
        phone: '090-5678-1234',
        is_registered: true,
      },
      {
        clinic_id: clinic.id,
        patient_number: 3,
        last_name: '鈴木',
        first_name: '一郎',
        last_name_kana: 'スズキ',
        first_name_kana: 'イチロウ',
        birth_date: '1980-03-10',
        gender: 'male',
        phone: '090-9999-8888',
        is_registered: true,
      },
    ]

    for (const patient of patients) {
      const { error: patientError } = await supabase
        .from('patients')
        .insert(patient)

      if (patientError && patientError.code !== '23505') {
        console.log(`   ⚠️  患者 ${patient.last_name}${patient.first_name} 作成エラー:`, patientError.message)
      } else {
        console.log(`   ✅ 患者${patient.patient_number}: ${patient.last_name}${patient.first_name}`)
      }
    }

    console.log('\n🎉 開発用データの作成が完了しました！')
    console.log('\n📊 作成されたデータ:')
    console.log(`   - クリニック: ${clinic.name}`)
    console.log(`   - スタッフ: 1名`)
    console.log(`   - ユニット: 2台`)
    console.log(`   - 患者: ${patients.length}名`)
    console.log('\n✨ http://localhost:3000 でアプリケーションを確認できます\n')

  } catch (error: any) {
    console.error('\n❌ エラーが発生しました:', error.message)
    process.exit(1)
  }
}

main()
