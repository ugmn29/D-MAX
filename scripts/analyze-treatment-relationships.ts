/**
 * 診療行為の関連性を分析
 * Analyze treatment code relationships
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeTreatmentRelationships() {
  console.log('🔍 診療行為の関連性分析\n')
  console.log('='.repeat(70))

  // 1. 包括ルールの統計
  console.log('\n📊 1. 包括ルール（Inclusion Rules）の統計')
  console.log('-'.repeat(70))

  const { data: withInclusion } = await supabase
    .from('treatment_codes')
    .select('code, name, inclusion_rules')
    .not('inclusion_rules', 'is', null)
    .neq('inclusion_rules', '{}')
    .limit(10)

  if (withInclusion && withInclusion.length > 0) {
    console.log(`包括ルールを持つ処置: ${withInclusion.length}件（サンプル）\n`)

    for (const treatment of withInclusion.slice(0, 5)) {
      const inclusionCount = treatment.inclusion_rules?.length || 0
      console.log(`${treatment.code}: ${treatment.name}`)
      console.log(`  → ${inclusionCount}件の処置を包括`)

      if (treatment.inclusion_rules && treatment.inclusion_rules.length > 0) {
        // 包括される処置の名前を取得
        for (const code of treatment.inclusion_rules.slice(0, 3)) {
          const { data: included } = await supabase
            .from('treatment_codes')
            .select('name')
            .eq('code', code)
            .single()

          if (included) {
            console.log(`     - ${code}: ${included.name}`)
          }
        }
        if (treatment.inclusion_rules.length > 3) {
          console.log(`     ... 他${treatment.inclusion_rules.length - 3}件`)
        }
      }
      console.log()
    }
  } else {
    console.log('⚠️  包括ルールを持つ処置が見つかりません')
  }

  // 2. 背反ルールの統計
  console.log('\n📊 2. 背反ルール（Exclusion Rules）の統計')
  console.log('-'.repeat(70))

  const { data: treatments } = await supabase
    .from('treatment_codes')
    .select('code, name, exclusion_rules')
    .not('exclusion_rules', 'is', null)
    .limit(100)

  if (treatments) {
    let sameDayCount = 0
    let sameMonthCount = 0
    let simultaneousCount = 0

    for (const t of treatments) {
      const rules = t.exclusion_rules || {}
      if (rules.same_day && rules.same_day.length > 0) sameDayCount++
      if (rules.same_month && rules.same_month.length > 0) sameMonthCount++
      if (rules.simultaneous && rules.simultaneous.length > 0) simultaneousCount++
    }

    console.log(`分析対象: ${treatments.length}件`)
    console.log(`  同日算定不可ルールあり: ${sameDayCount}件`)
    console.log(`  同月算定不可ルールあり: ${sameMonthCount}件`)
    console.log(`  同時算定不可ルールあり: ${simultaneousCount}件\n`)

    // サンプル表示
    const withExclusion = treatments.filter(t => {
      const rules = t.exclusion_rules || {}
      return (rules.same_day && rules.same_day.length > 0) ||
             (rules.same_month && rules.same_month.length > 0) ||
             (rules.simultaneous && rules.simultaneous.length > 0)
    }).slice(0, 3)

    console.log('サンプル:')
    for (const treatment of withExclusion) {
      console.log(`\n${treatment.code}: ${treatment.name}`)
      const rules = treatment.exclusion_rules || {}

      if (rules.same_day && rules.same_day.length > 0) {
        console.log(`  同日算定不可: ${rules.same_day.length}件`)
        for (const code of rules.same_day.slice(0, 2)) {
          const { data: excluded } = await supabase
            .from('treatment_codes')
            .select('name')
            .eq('code', code)
            .single()
          if (excluded) {
            console.log(`    - ${code}: ${excluded.name}`)
          }
        }
      }
    }
  }

  // 3. カテゴリ別分析
  console.log('\n\n📊 3. カテゴリ別の処置分析')
  console.log('-'.repeat(70))

  const categories = [
    { code: '309', name: '歯内療法（抜髄・根管治療）' },
    { code: '310', name: '抜歯' },
    { code: '313', name: '充填' },
    { code: '316', name: '歯冠修復' },
    { code: '318', name: '歯周治療' }
  ]

  for (const category of categories) {
    const { data: catTreatments, count } = await supabase
      .from('treatment_codes')
      .select('code, name', { count: 'exact' })
      .ilike('code', `${category.code}%`)
      .limit(5)

    console.log(`\n${category.name} (${category.code}xxx): ${count}件`)
    if (catTreatments && catTreatments.length > 0) {
      catTreatments.forEach(t => {
        console.log(`  - ${t.code}: ${t.name}`)
      })
    }
  }

  // 4. よく使われる処置パターンの提案
  console.log('\n\n💡 4. 推奨される提案パターン')
  console.log('-'.repeat(70))

  const patterns = [
    {
      trigger: '309002110', // 抜髄（単根管）
      name: '抜髄処置',
      related: ['根管貼薬', '感染根管', '根管充填']
    },
    {
      trigger: '310000210', // 抜歯（前歯）
      name: '抜歯処置',
      related: ['消炎', '縫合', '抜歯後']
    },
    {
      trigger: '313024310', // 充填
      name: '充填処置',
      related: ['窩洞', 'う蝕除去', 'CR充填']
    }
  ]

  for (const pattern of patterns) {
    console.log(`\n${pattern.name} (${pattern.trigger}):`)

    for (const keyword of pattern.related) {
      const { data: related, count } = await supabase
        .from('treatment_codes')
        .select('code, name, points', { count: 'exact' })
        .ilike('name', `%${keyword}%`)
        .limit(3)

      if (related && related.length > 0) {
        console.log(`  "${keyword}" に関連する処置: ${count}件`)
        related.forEach(r => {
          console.log(`    ✓ ${r.code}: ${r.name} (${r.points}点)`)
        })
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ 分析完了\n')
}

analyzeTreatmentRelationships()
