/**
 * 診療行為提案システムのテスト
 * Test Treatment Suggestion System
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSuggestionSystem() {
  console.log('🧪 診療行為提案システムのテスト\n')
  console.log('='.repeat(60))

  // テスト1: 抜髄を選択した場合の提案
  console.log('\n📝 テスト1: 抜髄を選択した場合の提案')
  console.log('-'.repeat(60))

  const { data: bassui } = await supabase
    .from('treatment_codes')
    .select('*')
    .ilike('name', '%抜髄%')
    .limit(1)
    .single()

  if (bassui) {
    console.log(`選択した処置: ${bassui.code} - ${bassui.name} (${bassui.points}点)`)
    console.log('\nメタデータ:')
    console.log('  包括ルール:', bassui.inclusion_rules?.length || 0, '件')
    console.log('  背反ルール:', Object.keys(bassui.exclusion_rules || {}).length, 'タイプ')
    console.log('  算定回数制限:', bassui.frequency_limits?.length || 0, '件')

    if (bassui.metadata && Object.keys(bassui.metadata).length > 0) {
      console.log('  詳細ルール:', JSON.stringify(bassui.metadata, null, 2))
    }
  }

  // テスト2: 根管充填を検索
  console.log('\n\n📝 テスト2: 関連処置を検索 - "根管充填"')
  console.log('-'.repeat(60))

  const { data: relatedTreatments } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%根管充填%')
    .limit(5)

  if (relatedTreatments && relatedTreatments.length > 0) {
    console.log(`検索結果: ${relatedTreatments.length}件`)
    relatedTreatments.forEach(t => {
      console.log(`  ✅ ${t.code}: ${t.name} (${t.points}点)`)
    })
  }

  // テスト3: 抜歯に関連する処置
  console.log('\n\n📝 テスト3: 抜歯に関連する処置')
  console.log('-'.repeat(60))

  const { data: extraction } = await supabase
    .from('treatment_codes')
    .select('*')
    .eq('code', '310000210') // 抜歯（前歯）
    .single()

  if (extraction) {
    console.log(`選択した処置: ${extraction.code} - ${extraction.name} (${extraction.points}点)`)

    // 包括されている処置を確認
    if (extraction.inclusion_rules && extraction.inclusion_rules.length > 0) {
      console.log('\n包括されている処置:')
      for (const code of extraction.inclusion_rules.slice(0, 5)) {
        const { data: included } = await supabase
          .from('treatment_codes')
          .select('name, points')
          .eq('code', code)
          .single()

        if (included) {
          console.log(`  - ${code}: ${included.name} (${included.points}点) ※別途算定不可`)
        }
      }
      if (extraction.inclusion_rules.length > 5) {
        console.log(`  他 ${extraction.inclusion_rules.length - 5}件...`)
      }
    }

    // 背反（同時算定不可）の処置を確認
    const exclusionRules = extraction.exclusion_rules || {}
    if (exclusionRules.same_day && exclusionRules.same_day.length > 0) {
      console.log('\n同日算定不可:')
      for (const code of exclusionRules.same_day.slice(0, 3)) {
        const { data: excluded } = await supabase
          .from('treatment_codes')
          .select('name')
          .eq('code', code)
          .single()

        if (excluded) {
          console.log(`  - ${code}: ${excluded.name}`)
        }
      }
      if (exclusionRules.same_day.length > 3) {
        console.log(`  他 ${exclusionRules.same_day.length - 3}件...`)
      }
    }
  }

  // テスト4: 充填に関連する処置
  console.log('\n\n📝 テスト4: 充填に関連する処置（窩洞形成など）')
  console.log('-'.repeat(60))

  const { data: filling } = await supabase
    .from('treatment_codes')
    .select('*')
    .eq('code', '313024310') // 充填１（単純）
    .single()

  if (filling) {
    console.log(`選択した処置: ${filling.code} - ${filling.name} (${filling.points}点)`)

    // カテゴリ313の関連処置を検索
    const { data: relatedToFilling } = await supabase
      .from('treatment_codes')
      .select('code, name, points')
      .ilike('code', '313%')
      .or('name.ilike.%窩洞%,name.ilike.%形成%')
      .limit(5)

    if (relatedToFilling && relatedToFilling.length > 0) {
      console.log('\nカテゴリ内の関連処置:')
      relatedToFilling.forEach(t => {
        console.log(`  ✅ ${t.code}: ${t.name} (${t.points}点)`)
      })
    }
  }

  // テスト5: 加算ルールの確認
  console.log('\n\n📝 テスト5: 加算ルールが設定されている処置')
  console.log('-'.repeat(60))

  const { data: withAdditions } = await supabase
    .from('treatment_codes')
    .select('code, name, points, metadata')
    .not('metadata', 'is', null)
    .limit(10)

  if (withAdditions) {
    let count = 0
    for (const treatment of withAdditions) {
      if (treatment.metadata && treatment.metadata.addition_rules) {
        count++
        console.log(`${count}. ${treatment.code}: ${treatment.name} (${treatment.points}点)`)
        const rules = treatment.metadata.addition_rules
        if (rules.age_based_additions) {
          console.log(`   - 年齢加算: ${rules.age_based_additions.length}件`)
        }
        if (rules.time_based_additions) {
          console.log(`   - 時間帯加算: ${rules.time_based_additions.length}件`)
        }
        if (count >= 3) break
      }
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ テスト完了\n')

  console.log('📊 システム概要:')
  console.log('  - 診療行為を選択すると、関連する処置や加算が自動提案されます')
  console.log('  - 包括ルールで別途算定できない処置を警告します')
  console.log('  - 背反ルールで同時算定できない処置をブロックします')
  console.log('  - 年齢や時間帯に応じた加算を自動提案します')
  console.log('\n患者詳細ページの電子カルテタブでお試しください！')
  console.log('http://localhost:3000/patients/9f0e47ed-a900-4732-93b9-9370597f4d32\n')
}

testSuggestionSystem()
