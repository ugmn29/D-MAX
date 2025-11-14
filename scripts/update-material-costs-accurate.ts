/**
 * CR充填の材料代を正確な値に更新
 * 出典：特定保険医療材料及びその材料価格.pdf Page 3
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🦷 CR充填の材料代を正確な値に更新します...\n')
  console.log('出典：特定保険医療材料及びその材料価格.pdf Page 3\n')

  // 古い仮の材料を削除
  await supabase
    .from('treatment_codes')
    .delete()
    .in('code', ['140100010', '140100020', '140100030'])

  // 正確な材料価格（M009 充填用材料）
  const materials = [
    // 歯科充填用材料Ⅰ（充填１＝CR充填、歯面処理あり）
    {
      code: '140100110',
      name: '複合レジン系（単純なもの）',
      points: 11,
      description: '歯科充填用材料Ⅰ - 単純なもの（110円）',
      material_type: '充填１用材料'
    },
    {
      code: '140100120',
      name: '複合レジン系（複雑なもの）',
      points: 29,
      description: '歯科充填用材料Ⅰ - 複雑なもの（290円）',
      material_type: '充填１用材料'
    },
    // 歯科充填用材料Ⅱ（充填２＝歯面処理なし）
    {
      code: '140100210',
      name: '複合レジン系（単純なもの）',
      points: 4,
      description: '歯科充填用材料Ⅱ - 単純なもの（40円）',
      material_type: '充填２用材料'
    },
    {
      code: '140100220',
      name: '複合レジン系（複雑なもの）',
      points: 11,
      description: '歯科充填用材料Ⅱ - 複雑なもの（110円）',
      material_type: '充填２用材料'
    },
  ]

  for (const material of materials) {
    const { error } = await supabase
      .from('treatment_codes')
      .upsert({
        code: material.code,
        name: material.name,
        category: '材料',
        points: material.points,
        inclusion_rules: [],
        exclusion_rules: {
          same_day: [],
          same_month: [],
          simultaneous: [],
          same_site: [],
          same_week: []
        },
        frequency_limits: [],
        effective_from: '2025-01-01',
        requires_documents: [],
        metadata: {
          pdf_reference: '特定保険医療材料及びその材料価格.pdf Page 3, M009',
          section: '第12部 歯冠修復及び欠損補綴',
          sub_category: '特定保険医療材料',
          material_type: material.material_type,
          description: material.description,
          calculation: '材料価格 ÷ 10円 = 点数'
        }
      }, {
        onConflict: 'code'
      })

    if (error) {
      console.error(`❌ ${material.name} の更新失敗:`, error)
    } else {
      console.log(`✅ ${material.name}: ${material.points}点 (${material.material_type})`)
    }
  }

  console.log('\n✨ 材料代の更新完了！')
  console.log('\n【正確な材料価格】')
  console.log('歯科充填用材料Ⅰ（充填１用）:')
  console.log('  - 単純なもの: 11点（110円）')
  console.log('  - 複雑なもの: 29点（290円）')
  console.log('\n歯科充填用材料Ⅱ（充填２用）:')
  console.log('  - 単純なもの: 4点（40円）')
  console.log('  - 複雑なもの: 11点（110円）')
}

main()
