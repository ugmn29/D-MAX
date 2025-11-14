/**
 * CR充填3分離の最終確認スクリプト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('✅ CR充填3分離の最終確認\n')

  // すべてのコードを確認
  const codes = [
    '140000310', // 窩洞形成（単純）
    '140000410', // 窩洞形成（複雑）
    '140009110', // 充填１（単純）
    '140009210', // 充填１（複雑）
    '140009310', // 充填２（単純）
    '140009410', // 充填２（複雑）
    '140000210', // う蝕歯即時充填形成
  ]

  const { data, error } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .in('code', codes)
    .order('code')

  if (error) {
    console.error('❌ エラー:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error('❌ データが見つかりません')
    process.exit(1)
  }

  console.log('📊 登録されている処置コード:\n')

  let totalExpected = 7
  let totalFound = data.length

  console.log('形成料:')
  const formations = data.filter(d => d.code.startsWith('1400003'))
  formations.forEach(d => console.log(`  ✓ ${d.code}: ${d.name} (${d.points}点)`))

  console.log('\n充填料:')
  const fillings = data.filter(d => d.code.startsWith('1400094'))
  fillings.forEach(d => console.log(`  ✓ ${d.code}: ${d.name} (${d.points}点)`))

  console.log('\n形成・充填一体:')
  const immediate = data.filter(d => d.code === '140000210')
  immediate.forEach(d => console.log(`  ✓ ${d.code}: ${d.name} (${d.points}点)`))

  console.log('\n────────────────────────────────────')
  console.log(`結果: ${totalFound}/${totalExpected} 件のコードが登録されています`)

  if (totalFound === totalExpected) {
    console.log('\n✅ すべての処置コードが正しく登録されています！')
    console.log('\n💡 使い方:')
    console.log('  1. http://localhost:3000 にアクセス')
    console.log('  2. 患者詳細ページのEMRタブを開く')
    console.log('  3. 「充填」カテゴリーを選択')
    console.log('  4. 形成料・充填料の7つの項目が表示されることを確認')
    console.log('\n🎉 実装完了！')
  } else {
    console.log(`\n⚠️  ${totalExpected - totalFound} 件のコードが不足しています`)
    process.exit(1)
  }
}

main()
