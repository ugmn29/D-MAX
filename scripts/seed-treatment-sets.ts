/**
 * 処置セットと必須記載項目のシードデータ投入
 * Seed Treatment Sets and Required Fields
 *
 * 厚生局の保険点数表に基づいた処置セットと必須記載項目を投入
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTreatmentSets() {
  console.log('🦷 処置セット・必須記載項目のシードデータ投入開始\n')
  console.log('='.repeat(70))

  // 1. 処置セット定義
  const treatmentSets = [
    {
      code: 'SET_PULPECTOMY',
      name: '抜髄セット',
      description: '歯髄炎・C3に対する抜髄処置の標準セット',
      category: '歯内療法',
      display_order: 1
    },
    {
      code: 'SET_INFECTED_ROOT_CANAL',
      name: '感染根管セット',
      description: '根尖性歯周炎に対する感染根管処置の標準セット',
      category: '歯内療法',
      display_order: 2
    },
    {
      code: 'SET_FILLING',
      name: '充填セット',
      description: 'C1/C2に対する充填処置の標準セット',
      category: '充填',
      display_order: 3
    },
    {
      code: 'SET_EXTRACTION',
      name: '抜歯セット',
      description: '抜歯処置の標準セット',
      category: '抜歯',
      display_order: 4
    },
    {
      code: 'SET_SCALING',
      name: 'スケーリングセット',
      description: '歯周病に対するスケーリング・歯周基本治療セット',
      category: '歯周治療',
      display_order: 5
    }
  ]

  console.log('\n📦 処置セットマスタを投入中...')
  for (const set of treatmentSets) {
    const { data, error } = await supabase
      .from('treatment_sets')
      .upsert(set, { onConflict: 'code' })
      .select()
      .single()

    if (error) {
      console.error(`  ❌ ${set.name} の投入失敗:`, error.message)
    } else {
      console.log(`  ✅ ${set.name} (${set.code})`)
    }
  }

  // 2. 各セットの構成要素を投入
  console.log('\n📋 処置セットの構成要素を投入中...')

  // 抜髄セット（実際のコードに更新）
  await addSetItems('SET_PULPECTOMY', [
    { code: '309002110', name: '抜髄（単根管）', required: false, order: 1, default_selected: false, notes: '単根管の場合' },
    { code: '309002210', name: '抜髄（２根管）', required: false, order: 2, default_selected: false, notes: '２根管の場合' },
    { code: '309002310', name: '抜髄（３根管以上）', required: false, order: 3, default_selected: false, notes: '３根管以上の場合' },
    { code: '309003310', name: '根管貼薬（単根管）', required: false, order: 4, default_selected: true, notes: '抜髄後の基本処置' },
    { code: '309003410', name: '根管貼薬（２根管）', required: false, order: 5, default_selected: false },
    { code: '309003510', name: '根管貼薬（３根管以上）', required: false, order: 6, default_selected: false }
  ])

  // 感染根管セット（該当する処置がないため、根管貼薬で代用）
  await addSetItems('SET_INFECTED_ROOT_CANAL', [
    { code: '309003310', name: '根管貼薬（単根管）', required: false, order: 1, default_selected: false },
    { code: '309003410', name: '根管貼薬（２根管）', required: false, order: 2, default_selected: false },
    { code: '309003510', name: '根管貼薬（３根管以上）', required: false, order: 3, default_selected: false }
  ])

  // 充填セット（CR充填を形成料・充填料・材料代に分離）
  await addSetItems('SET_FILLING', [
    // 形成料
    { code: '140000310', name: '窩洞形成（単純なもの）', required: false, order: 1, default_selected: true, notes: '形成料：60点' },
    { code: '140000410', name: '窩洞形成（複雑なもの）', required: false, order: 2, default_selected: false, notes: '形成料：86点' },

    // 充填料（CR充填）
    { code: '140009110', name: '充填１（単純なもの）※CR', required: false, order: 3, default_selected: true, notes: 'CR充填料：106点' },
    { code: '140009210', name: '充填１（複雑なもの）※CR', required: false, order: 4, default_selected: false, notes: 'CR充填料：158点' },
    { code: '140009310', name: '充填２（単純なもの）', required: false, order: 5, default_selected: false, notes: '充填料：59点' },
    { code: '140009410', name: '充填２（複雑なもの）', required: false, order: 6, default_selected: false, notes: '充填料：107点' },

    // 形成・充填一体
    { code: '140000210', name: 'う蝕歯即時充填形成', required: false, order: 7, default_selected: false, notes: '形成+充填：128点' },

    // 前処置
    { code: '309000110', name: 'う蝕処置', required: false, order: 8, default_selected: true, notes: '充填前の処置：18点' }
  ])

  // 抜歯セット
  await addSetItems('SET_EXTRACTION', [
    { code: '310000110', name: '抜歯（乳歯）', required: false, order: 1, default_selected: false },
    { code: '310000210', name: '抜歯（前歯）', required: false, order: 2, default_selected: false },
    { code: '310000310', name: '抜歯（臼歯）', required: false, order: 3, default_selected: false },
    { code: '310034470', name: '難抜歯加算', required: false, order: 4, default_selected: false, notes: '骨の開削や歯根分離が必要な場合' }
  ])

  // スケーリングセット
  await addSetItems('SET_SCALING', [
    { code: '309004810', name: 'スケーリング', required: true, order: 1 },
    { code: '309004970', name: '１／３顎加算（スケーリング）', required: false, order: 2, notes: '実施部位に応じて追加' }
  ])

  // 3. 必須記載項目を投入
  console.log('\n📝 処置の必須記載項目を投入中...')

  const requiredFields = [
    // 抜髄（単根管）
    {
      treatment_code: '309002110',
      field_name: '麻酔方法',
      field_type: 'select',
      field_options: { options: ['浸潤麻酔', '伝達麻酔', '表面麻酔'] },
      is_required: false,
      placeholder: '麻酔方法を選択',
      display_order: 1
    },
    {
      treatment_code: '309002110',
      field_name: '特記事項',
      field_type: 'text',
      is_required: false,
      placeholder: '特記事項があれば入力',
      help_text: '出血状況、患者の反応など',
      display_order: 2
    },

    // 抜髄（２根管）
    {
      treatment_code: '309002210',
      field_name: '麻酔方法',
      field_type: 'select',
      field_options: { options: ['浸潤麻酔', '伝達麻酔', '表面麻酔'] },
      is_required: false,
      placeholder: '麻酔方法を選択',
      display_order: 1
    },
    {
      treatment_code: '309002210',
      field_name: '特記事項',
      field_type: 'text',
      is_required: false,
      placeholder: '特記事項があれば入力',
      display_order: 2
    },

    // 抜髄（３根管以上）
    {
      treatment_code: '309002310',
      field_name: '麻酔方法',
      field_type: 'select',
      field_options: { options: ['浸潤麻酔', '伝達麻酔', '表面麻酔'] },
      is_required: false,
      placeholder: '麻酔方法を選択',
      display_order: 1
    },
    {
      treatment_code: '309002310',
      field_name: '根管数',
      field_type: 'select',
      field_options: { options: ['3根管', '4根管', '5根管以上'] },
      is_required: false,
      placeholder: '根管数を選択',
      help_text: '3根管以上の場合の詳細',
      display_order: 2
    },

    // 抜歯（乳歯）
    {
      treatment_code: '310000110',
      field_name: '抜歯理由',
      field_type: 'select',
      field_options: {
        options: ['残根', '動揺度大', '予後不良', '矯正治療', '晩期残存', 'その他']
      },
      is_required: true,
      placeholder: '抜歯理由を選択',
      help_text: '保険算定上、理由の記載が必要です',
      display_order: 1
    },

    // 抜歯（前歯）
    {
      treatment_code: '310000210',
      field_name: '抜歯理由',
      field_type: 'select',
      field_options: {
        options: ['残根', '動揺度大', '予後不良', '矯正治療', '埋伏', '智歯周囲炎', 'その他']
      },
      is_required: true,
      placeholder: '抜歯理由を選択',
      help_text: '保険算定上、理由の記載が必要です',
      display_order: 1
    },

    // 抜歯（臼歯）
    {
      treatment_code: '310000310',
      field_name: '抜歯理由',
      field_type: 'select',
      field_options: {
        options: ['残根', '動揺度大', '予後不良', '矯正治療', '埋伏', '智歯周囲炎', 'その他']
      },
      is_required: true,
      placeholder: '抜歯理由を選択',
      help_text: '保険算定上、理由の記載が必要です',
      display_order: 1
    },

    // 難抜歯加算
    {
      treatment_code: '310034470',
      field_name: '難抜歯の理由',
      field_type: 'select',
      field_options: {
        options: ['骨の開削を要する', '歯根分離を要する', '完全埋伏', '水平埋伏', '骨性癒着']
      },
      is_required: true,
      placeholder: '難抜歯の理由を選択',
      help_text: '難抜歯算定の根拠となる理由を選択',
      display_order: 1
    },

    // スケーリング 1/3顎加算
    {
      treatment_code: '309004970',
      field_name: '実施部位',
      field_type: 'select',
      field_options: { options: ['上顎右', '上顎前', '上顎左', '下顎右', '下顎前', '下顎左'] },
      is_required: true,
      placeholder: '実施部位を選択',
      help_text: '1/3顎単位での算定',
      display_order: 1
    },

    // う蝕処置
    {
      treatment_code: '309000110',
      field_name: 'う蝕の程度',
      field_type: 'select',
      field_options: { options: ['C1', 'C2', 'C3', 'C4'] },
      is_required: false,
      placeholder: 'う蝕の程度を選択',
      display_order: 1
    }
  ]

  for (const field of requiredFields) {
    const { error } = await supabase
      .from('treatment_required_fields')
      .upsert(field, { onConflict: 'treatment_code,field_name' })

    if (error) {
      console.error(`  ❌ ${field.treatment_code} - ${field.field_name}:`, error.message)
    } else {
      console.log(`  ✅ ${field.treatment_code} - ${field.field_name}`)
    }
  }

  // 4. 病名→処置セットマッピング
  console.log('\n🔗 病名→処置セットマッピングを投入中...')

  const mappings = [
    // う蝕第3度 → 抜髄セット
    { disease_pattern: 'う蝕第３度', set_code: 'SET_PULPECTOMY', priority: 10 },
    // 歯髄炎 → 抜髄セット
    { disease_pattern: '歯髄炎', set_code: 'SET_PULPECTOMY', priority: 10 },
    // 根尖性歯周炎 → 感染根管セット
    { disease_pattern: '根尖', set_code: 'SET_INFECTED_ROOT_CANAL', priority: 10 },
    // う蝕第2度 → 充填セット
    { disease_pattern: 'う蝕第２度', set_code: 'SET_FILLING', priority: 10 },
    // 残根 → 抜歯セット
    { disease_pattern: '残根', set_code: 'SET_EXTRACTION', priority: 10 },
    // 歯周病 → スケーリングセット
    { disease_pattern: '歯周', set_code: 'SET_SCALING', priority: 10 }
  ]

  // 病名コードを検索してマッピング
  for (const mapping of mappings) {
    const { data: diseases } = await supabase
      .from('disease_codes')
      .select('code')
      .ilike('name', `%${mapping.disease_pattern}%`)
      .limit(5)

    const { data: setData } = await supabase
      .from('treatment_sets')
      .select('id')
      .eq('code', mapping.set_code)
      .single()

    if (diseases && setData) {
      for (const disease of diseases) {
        await supabase
          .from('disease_treatment_set_mapping')
          .upsert({
            disease_code: disease.code,
            set_id: setData.id,
            priority: mapping.priority
          }, { onConflict: 'disease_code,set_id' })
      }
      console.log(`  ✅ ${mapping.disease_pattern} → ${mapping.set_code} (${diseases.length}件)`)
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log('✅ シードデータ投入完了\n')
}

async function addSetItems(setCode: string, items: any[]) {
  const { data: setData } = await supabase
    .from('treatment_sets')
    .select('id')
    .eq('code', setCode)
    .single()

  if (!setData) {
    console.error(`  ❌ セット ${setCode} が見つかりません`)
    return
  }

  for (const item of items) {
    // まず treatment_codes からコードの存在を確認
    const { data: treatment } = await supabase
      .from('treatment_codes')
      .select('code, name')
      .eq('code', item.code)
      .single()

    if (!treatment) {
      console.log(`  ⚠️  処置コード ${item.code} がtreatment_codesに存在しません（スキップ）`)
      continue
    }

    const { error } = await supabase
      .from('treatment_set_items')
      .insert({
        set_id: setData.id,
        treatment_code: item.code,
        is_required: item.required,
        display_order: item.order,
        default_selected: item.default_selected !== false,
        notes: item.notes
      })

    if (error && !error.message.includes('duplicate')) {
      console.error(`  ❌ ${item.name}:`, error.message)
    } else {
      console.log(`  ✅ ${setCode}: ${treatment.name}`)
    }
  }
}

seedTreatmentSets()
