/**
 * 病名→診療行為マッピングのテスト
 * Test Disease-Treatment Mapping (Dentis/Julea style)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// 簡易版のマッピングロジック
function identifyTreatmentPattern(diseaseName: string): { keywords: string[], reason: string } | null {
  // う蝕（虫歯）関連
  if (diseaseName.includes('う蝕') || diseaseName.includes('齲')) {
    if (diseaseName.includes('第３度') || diseaseName.includes('C3') || diseaseName.includes('歯髄炎')) {
      return {
        keywords: ['抜髄', '根管'],
        reason: 'う蝕第3度（C3）には抜髄処置が必要です'
      }
    } else if (diseaseName.includes('第２度') || diseaseName.includes('C2')) {
      return {
        keywords: ['充填'],
        reason: 'う蝕第2度（C2）には充填処置が適しています'
      }
    } else {
      return {
        keywords: ['充填', 'う蝕'],
        reason: 'う蝕には充填処置が基本です'
      }
    }
  }

  // 歯髄炎
  if (diseaseName.includes('歯髄炎')) {
    return {
      keywords: ['抜髄', '根管'],
      reason: '歯髄炎には抜髄処置が必要です'
    }
  }

  // 根尖性歯周炎
  if (diseaseName.includes('根尖') || diseaseName.includes('Per')) {
    return {
      keywords: ['感染根管', '根管'],
      reason: '根尖性歯周炎には感染根管処置が必要です'
    }
  }

  // 歯周病
  if (diseaseName.includes('歯周')) {
    return {
      keywords: ['スケーリング', '歯周'],
      reason: '歯周病には歯周基本治療が必要です'
    }
  }

  return null
}

async function testDiseaseMapping() {
  console.log('🦷 病名→診療行為マッピングテスト（Dentis/Julea方式）\n')
  console.log('='.repeat(70))

  const testCases = [
    { name: 'う蝕第２度', tooth: '21' },
    { name: 'う蝕第３度', tooth: '36' },
    { name: '単純性歯髄炎', tooth: '46' },
    { name: '急性化膿性根尖性歯周炎', tooth: '11' },
    { name: '慢性歯周炎', tooth: '全顎' },
  ]

  for (const testCase of testCases) {
    console.log(`\n🔍 テストケース: ${testCase.name}（歯式: ${testCase.tooth}）`)
    console.log('-'.repeat(70))

    const pattern = identifyTreatmentPattern(testCase.name)

    if (!pattern) {
      console.log('  ⚠️  該当する処置パターンなし')
      continue
    }

    console.log(`  💡 提案理由: ${pattern.reason}`)
    console.log('  📋 推奨処置:')

    for (const keyword of pattern.keywords) {
      const { data: treatments } = await supabase
        .from('treatment_codes')
        .select('code, name, points')
        .ilike('name', `%${keyword}%`)
        .not('name', 'ilike', '%加算%')
        .limit(3)

      if (treatments && treatments.length > 0) {
        treatments.forEach(t => {
          console.log(`     ✅ ${t.code}: ${t.name} (${t.points}点)`)
        })
      }
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ テスト完了\n')

  console.log('📝 Dentis/Julea方式の特徴:')
  console.log('  1. 病名を選択 → 対応する処置が自動提案')
  console.log('  2. 歯式を選択 → 該当歯に対する処置')
  console.log('  3. 病名に応じた適切な処置をガイド\n')

  console.log('💡 実装された病名マッピング:')
  console.log('  - う蝕 C1/C2 → 充填処置')
  console.log('  - う蝕 C3 / 歯髄炎 → 抜髄処置')
  console.log('  - 根尖性歯周炎 → 感染根管処置')
  console.log('  - 歯周病 → スケーリング/歯周治療')
  console.log('  - 智歯周囲炎 → 消炎処置/抜歯')
  console.log('  - 残根/埋伏歯 → 抜歯\n')
}

testDiseaseMapping()
