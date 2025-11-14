/**
 * CR充填3分離のテストスクリプト
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🦷 CR充填3分離のテスト\n')

  // 1. 形成料の確認
  console.log('=== 1. 形成料（M001-3 窩洞形成） ===')
  const { data: formations, error: formError } = await supabase
    .from('treatment_codes')
    .select('code, name, points, category, metadata')
    .in('code', ['140000310', '140000410'])
    .order('code')

  if (formError) {
    console.error('❌ エラー:', formError)
  } else if (formations && formations.length > 0) {
    formations.forEach(t => {
      console.log(`✅ ${t.code}: ${t.name}`)
      console.log(`   カテゴリ: ${t.category}`)
      console.log(`   点数: ${t.points}点`)
      console.log(`   PDF参照: ${t.metadata?.pdf_reference || 'N/A'}`)
      console.log(`   備考: ${t.metadata?.notes || 'N/A'}`)
      console.log()
    })
  } else {
    console.log('❌ 形成料のデータが見つかりません')
  }

  // 2. 充填料の確認
  console.log('\n=== 2. 充填料（M009 充填） ===')
  const { data: fillings, error: fillError } = await supabase
    .from('treatment_codes')
    .select('code, name, points, category, metadata')
    .in('code', ['140009110', '140009210', '140009310', '140009410'])
    .order('code')

  if (fillError) {
    console.error('❌ エラー:', fillError)
  } else if (fillings && fillings.length > 0) {
    fillings.forEach(t => {
      console.log(`✅ ${t.code}: ${t.name}`)
      console.log(`   カテゴリ: ${t.category}`)
      console.log(`   点数: ${t.points}点`)
      console.log(`   PDF参照: ${t.metadata?.pdf_reference || 'N/A'}`)
      console.log(`   材料タイプ: ${t.metadata?.material_type || 'N/A'}`)
      console.log()
    })
  } else {
    console.log('❌ 充填料のデータが見つかりません')
  }

  // 3. 形成・充填一体の確認
  console.log('\n=== 3. 形成・充填一体（M001-2） ===')
  const { data: immediate, error: immError } = await supabase
    .from('treatment_codes')
    .select('code, name, points, category, metadata')
    .eq('code', '140000210')
    .single()

  if (immError) {
    console.error('❌ エラー:', immError)
  } else if (immediate) {
    console.log(`✅ ${immediate.code}: ${immediate.name}`)
    console.log(`   カテゴリ: ${immediate.category}`)
    console.log(`   点数: ${immediate.points}点`)
    console.log(`   PDF参照: ${immediate.metadata?.pdf_reference || 'N/A'}`)
    console.log(`   包括内容: ${immediate.metadata?.includes?.join(', ') || 'N/A'}`)
    console.log()
  } else {
    console.log('❌ 形成・充填一体のデータが見つかりません')
  }

  // 4. CR充填の典型的な算定例
  console.log('\n=== 4. CR充填の典型的な算定例 ===')
  console.log('\n【パターン1: 単純なCR充填】')
  console.log('  ① 窩洞形成（単純なもの）: 60点')
  console.log('  ② 充填１（単純なもの）※CR: 106点')
  console.log('  ③ 材料代（M100）: 別途算定')
  console.log('  合計: 166点 + 材料代')

  console.log('\n【パターン2: 複雑なCR充填】')
  console.log('  ① 窩洞形成（複雑なもの）: 86点')
  console.log('  ② 充填１（複雑なもの）※CR: 158点')
  console.log('  ③ 材料代（M100）: 別途算定')
  console.log('  合計: 244点 + 材料代')

  console.log('\n【パターン3: 即時充填形成（小さいう蝕）】')
  console.log('  ① う蝕歯即時充填形成: 128点')
  console.log('     （麻酔、歯髄保護、形成、充填すべて含む）')
  console.log('  合計: 128点')

  // 5. 検索テスト
  console.log('\n\n=== 5. 検索テスト ===')
  console.log('\n「充填」で検索:')
  const { data: searchFilling, error: searchError } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%充填%')
    .order('code')
    .limit(10)

  if (searchError) {
    console.error('❌ エラー:', searchError)
  } else if (searchFilling && searchFilling.length > 0) {
    searchFilling.forEach(t => {
      console.log(`  ${t.code}: ${t.name} (${t.points}点)`)
    })
  }

  console.log('\n「窩洞形成」で検索:')
  const { data: searchFormation, error: searchError2 } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%窩洞形成%')
    .order('code')
    .limit(5)

  if (searchError2) {
    console.error('❌ エラー:', searchError2)
  } else if (searchFormation && searchFormation.length > 0) {
    searchFormation.forEach(t => {
      console.log(`  ${t.code}: ${t.name} (${t.points}点)`)
    })
  }

  // 6. 診療セットの確認
  console.log('\n\n=== 6. 充填セットの確認 ===')
  const { data: setItems, error: setError } = await supabase
    .from('treatment_set_items')
    .select(`
      *,
      treatment_sets!inner(name)
    `)
    .eq('treatment_sets.code', 'SET_FILLING')
    .order('order')

  if (setError) {
    console.error('❌ エラー:', setError)
  } else if (setItems && setItems.length > 0) {
    console.log('充填セットの構成:')
    setItems.forEach((item: any) => {
      const selected = item.default_selected ? '✓' : '  '
      console.log(`  ${selected} ${item.treatment_name} (${item.treatment_code})`)
      if (item.notes) {
        console.log(`      → ${item.notes}`)
      }
    })
  } else {
    console.log('⚠️  充填セットのアイテムが見つかりません（seed-treatment-sets.ts を実行してください）')
  }

  console.log('\n✨ テスト完了！')
}

main()
