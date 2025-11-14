/**
 * 充填処置の提案テスト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// 提案ロジックをインポート（簡易版）
async function findRelatedToFilling() {
  console.log('🦷 充填処置の提案テスト\n')
  console.log('='.repeat(60))

  // 充填１（単純）を選択
  const { data: filling } = await supabase
    .from('treatment_codes')
    .select('*')
    .eq('code', '313024310')
    .single()

  if (!filling) {
    console.log('充填処置が見つかりません')
    return
  }

  console.log(`\n選択した処置: ${filling.code} - ${filling.name} (${filling.points}点)\n`)

  // 関連処置パターン1: う蝕処置
  console.log('💡 提案1: う蝕処置（充填前）')
  console.log('-'.repeat(60))

  const { data: ushoku } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%う蝕%')
    .not('name', 'ilike', '%歯髄%')
    .not('name', 'ilike', '%根管%')
    .neq('code', filling.code)
    .limit(3)

  if (ushoku && ushoku.length > 0) {
    ushoku.forEach(t => {
      console.log(`  🟢 ${t.code}: ${t.name} (${t.points}点)`)
      console.log(`     理由: 充填前のう蝕除去`)
    })
  }

  // 関連処置パターン2: 知覚過敏
  console.log('\n💡 提案2: 知覚過敏処置（充填後）')
  console.log('-'.repeat(60))

  const { data: hypersensitivity } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%知覚過敏%')
    .limit(3)

  if (hypersensitivity && hypersensitivity.length > 0) {
    hypersensitivity.forEach(t => {
      console.log(`  🟠 ${t.code}: ${t.name} (${t.points}点)`)
      console.log(`     理由: 充填後の知覚過敏処置`)
    })
  }

  // 他の充填処置（参考）
  console.log('\n📋 参考: 他の充填処置')
  console.log('-'.repeat(60))

  const { data: otherFillings } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%充填%')
    .neq('code', filling.code)
    .not('name', 'ilike', '%根管%')
    .limit(5)

  if (otherFillings && otherFillings.length > 0) {
    otherFillings.forEach(t => {
      console.log(`  - ${t.code}: ${t.name} (${t.points}点)`)
    })
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ テスト完了\n')

  console.log('📝 充填処置の提案パターン:')
  console.log('  1. う蝕処置（充填前の前処置）')
  console.log('  2. 知覚過敏処置（充填後の対応）')
  console.log('  ※ 形成は必要ないため除外\n')
}

findRelatedToFilling()
