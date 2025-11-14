/**
 * CR充填の材料代（M100）を追加
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🦷 CR充填の材料代を追加します...\n')

  // 一般的なCR材料の材料代
  const materials = [
    {
      code: '140100010',
      name: 'コンポジットレジン（単色）',
      points: 50,
      description: '一般的なCR材料（約500円）'
    },
    {
      code: '140100020',
      name: 'コンポジットレジン（多色）',
      points: 80,
      description: '高品質CR材料（約800円）'
    },
    {
      code: '140100030',
      name: 'フロアブルレジン',
      points: 60,
      description: 'フロアブルタイプ（約600円）'
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
          pdf_reference: 'Page 74, M100',
          section: '第12部 歯冠修復及び欠損補綴',
          sub_category: '特定保険医療材料',
          material_type: 'CR充填材料',
          description: material.description,
          calculation: '材料価格 ÷ 10円 = 点数'
        }
      }, {
        onConflict: 'code'
      })

    if (error) {
      console.error(`❌ ${material.name} の追加失敗:`, error)
    } else {
      console.log(`✅ ${material.name}: ${material.points}点`)
    }
  }

  console.log('\n✨ 材料代の追加完了！')
}

main()
