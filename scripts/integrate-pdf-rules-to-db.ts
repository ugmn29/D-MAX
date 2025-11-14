#!/usr/bin/env npx tsx
/**
 * PDFから抽出した詳細ルールをデータベースに統合するスクリプト
 *
 * 実行方法: npx tsx scripts/integrate-pdf-rules-to-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('エラー: Supabase環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// PDFから抽出したルールを読み込み
const rulesPath = path.join(process.cwd(), 'pdf_detailed_rules.json');
const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

/**
 * 診療行為コードと詳細ルールのマッピング
 * PDFから手動で抽出した重要な診療行為
 */
const TREATMENT_DETAILED_RULES = {
  // 処置関連
  'I000': {
    name: 'う蝕処置',
    points: 18,
    unit: '1歯1回につき',
    detailed_conditions: {
      inclusions: ['貼薬', '仮封', '特定薬剤'],
      note: '貼薬、仮封及び特定薬剤の費用並びに特定保険医療材料料は、所定点数に含まれる'
    }
  },
  'I001': {
    name: '歯髄保護処置',
    unit: '1歯につき',
    sub_items: [
      {
        code: 'I001-1',
        name: '歯髄温存療法',
        points: 188,
        conditions: ['経過観察中のう蝕処置は所定点数に含まれる']
      },
      {
        code: 'I001-2',
        name: '直接歯髄保護処置',
        points: 150,
        conditions: []
      },
      {
        code: 'I001-3',
        name: '間接歯髄保護処置',
        points: 34,
        conditions: []
      }
    ]
  },
  'I005': {
    name: '抜髄',
    unit: '1歯につき',
    sub_items: [
      {
        code: 'I005-1',
        name: '単根管',
        points: 230,
        conditions: [
          '歯髄温存療法を行った日から起算して3月以内の場合は42点',
          '直接歯髄保護処置を行った日から起算して1月以内の場合は80点'
        ],
        conditional_points: {
          'after_pulp_preservation_3months': 42,
          'after_direct_pulp_protection_1month': 80
        }
      },
      {
        code: 'I005-2',
        name: '2根管',
        points: 422,
        conditions: [
          '歯髄温存療法を行った日から起算して3月以内の場合は234点',
          '直接歯髄保護処置を行った日から起算して1月以内の場合は272点'
        ],
        conditional_points: {
          'after_pulp_preservation_3months': 234,
          'after_direct_pulp_protection_1month': 272
        }
      },
      {
        code: 'I005-3',
        name: '3根管以上',
        points: 596,
        conditions: [
          '歯髄温存療法を行った日から起算して3月以内の場合は408点',
          '直接歯髄保護処置を行った日から起算して1月以内の場合は446点'
        ],
        conditional_points: {
          'after_pulp_preservation_3months': 408,
          'after_direct_pulp_protection_1month': 446
        }
      }
    ]
  },
  // 手術関連
  'J000': {
    name: '抜歯手術',
    unit: '1歯につき',
    sub_items: [
      {
        code: 'J000-1',
        name: '乳歯',
        points: 130,
        conditions: []
      },
      {
        code: 'J000-2',
        name: '前歯',
        points: 155,
        conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点'],
        additions: {
          'difficult_extraction': 210
        }
      },
      {
        code: 'J000-3',
        name: '臼歯',
        points: 265,
        conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点'],
        additions: {
          'difficult_extraction': 210
        }
      },
      {
        code: 'J000-4',
        name: '埋伏歯',
        points: 1054,
        conditions: [
          '完全埋伏歯（骨性）又は水平埋伏智歯に限り算定',
          '下顎完全埋伏智歯（骨性）又は下顎水平埋伏智歯の場合 +120点'
        ],
        additions: {
          'mandibular_impacted': 120
        }
      }
    ]
  },
  'J004': {
    name: '歯根端切除手術',
    unit: '1歯につき',
    sub_items: [
      {
        code: 'J004-1',
        name: '2以外の場合',
        points: 1350,
        conditions: []
      },
      {
        code: 'J004-2',
        name: '歯科用3次元エックス線断層撮影装置及び手術用顕微鏡を用いた場合',
        points: 2000,
        conditions: ['施設基準に適合している保険医療機関に限る']
      }
    ]
  }
};

/**
 * 加算ルールの構造化
 */
interface AdditionRule {
  type: string;
  rate: number;
  description: string;
  conditions?: string[];
}

interface AdditionRules {
  age_based?: AdditionRule[];
  time_based?: AdditionRule[];
  visit_based?: AdditionRule[];
}

/**
 * カテゴリごとの加算ルールをまとめる
 */
function categorizeAdditionRules(): Record<string, AdditionRules> {
  return {
    'treatment': {
      age_based: rulesData.rules.treatment_additions.age_based_additions,
      time_based: rulesData.rules.treatment_additions.time_based_additions,
      visit_based: rulesData.rules.treatment_additions.visit_based_additions,
    },
    'surgery': {
      age_based: rulesData.rules.surgery_additions.age_based_additions,
      time_based: rulesData.rules.surgery_additions.time_based_additions,
      visit_based: rulesData.rules.surgery_additions.visit_based_additions,
    },
    'crown': {
      age_based: rulesData.rules.crown_additions.age_based_additions,
      time_based: rulesData.rules.crown_additions.time_based_additions,
      visit_based: rulesData.rules.crown_additions.visit_based_additions,
    }
  };
}

/**
 * コードからカテゴリを判定
 */
function getCategoryFromCode(code: string): string {
  if (code.startsWith('I0')) return 'treatment';
  if (code.startsWith('J0')) return 'surgery';
  if (code.startsWith('M0')) return 'crown';
  return 'other';
}

/**
 * メイン処理
 */
async function main() {
  console.log('=' .repeat(80));
  console.log('PDFから抽出した詳細ルールをデータベースに統合');
  console.log('=' .repeat(80));

  const additionRules = categorizeAdditionRules();

  let updateCount = 0;
  let errorCount = 0;

  // 各診療行為コードに対して処理
  for (const [baseCode, details] of Object.entries(TREATMENT_DETAILED_RULES)) {
    console.log(`\n処理中: ${baseCode} - ${details.name}`);

    // カテゴリ判定
    const category = getCategoryFromCode(baseCode);
    const categoryRules = additionRules[category] || {};

    // sub_itemsがある場合は各サブアイテムを処理
    if ('sub_items' in details && details.sub_items) {
      for (const subItem of details.sub_items) {
        const fullCode = subItem.code;

        // データベースから既存レコードを取得
        const { data: existing, error: fetchError } = await supabase
          .from('treatment_codes')
          .select('*')
          .ilike('code', `%${baseCode}%`)
          .limit(10);

        if (fetchError) {
          console.error(`  エラー (取得): ${fullCode}`, fetchError.message);
          errorCount++;
          continue;
        }

        if (!existing || existing.length === 0) {
          console.log(`  スキップ: ${fullCode} (データベースに存在しません)`);
          continue;
        }

        // マッチするレコードを更新
        for (const record of existing) {
          const metadata = record.metadata || {};

          // 詳細ルールを追加
          const updatedMetadata = {
            ...metadata,
            detailed_rules: {
              unit: details.unit,
              conditions: subItem.conditions || [],
              conditional_points: subItem.conditional_points || null,
              additions: subItem.additions || null,
              pdf_source: '厚生局　歯科保険点数.pdf',
              extraction_date: rulesData.extraction_date,
            },
            addition_rules: {
              age_based: categoryRules.age_based || [],
              time_based: categoryRules.time_based || [],
              visit_based: categoryRules.visit_based || [],
            }
          };

          // 更新実行
          const { error: updateError } = await supabase
            .from('treatment_codes')
            .update({ metadata: updatedMetadata })
            .eq('id', record.id);

          if (updateError) {
            console.error(`  エラー (更新): ${record.code}`, updateError.message);
            errorCount++;
          } else {
            console.log(`  ✓ 更新成功: ${record.code} (${record.name})`);
            updateCount++;
          }
        }
      }
    } else {
      // sub_itemsがない場合は直接処理
      const { data: existing, error: fetchError } = await supabase
        .from('treatment_codes')
        .select('*')
        .eq('code', baseCode)
        .single();

      if (fetchError || !existing) {
        console.log(`  スキップ: ${baseCode} (データベースに存在しません)`);
        continue;
      }

      const metadata = existing.metadata || {};

      const updatedMetadata = {
        ...metadata,
        detailed_rules: {
          unit: details.unit,
          conditions: (details as any).detailed_conditions || {},
          pdf_source: '厚生局　歯科保険点数.pdf',
          extraction_date: rulesData.extraction_date,
        },
        addition_rules: {
          age_based: categoryRules.age_based || [],
          time_based: categoryRules.time_based || [],
          visit_based: categoryRules.visit_based || [],
        }
      };

      const { error: updateError } = await supabase
        .from('treatment_codes')
        .update({ metadata: updatedMetadata })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`  エラー (更新): ${baseCode}`, updateError.message);
        errorCount++;
      } else {
        console.log(`  ✓ 更新成功: ${baseCode} (${existing.name})`);
        updateCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('統合完了');
  console.log('='.repeat(80));
  console.log(`更新成功: ${updateCount}件`);
  console.log(`エラー: ${errorCount}件`);
}

// 実行
main().catch((error) => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
