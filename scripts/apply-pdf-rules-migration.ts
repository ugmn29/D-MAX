#!/usr/bin/env npx tsx
/**
 * PDFルールマイグレーションを直接実行するスクリプト
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function main() {
  console.log('=' .repeat(80));
  console.log('PDFルールマイグレーションを実行');
  console.log('=' .repeat(80));

  const additionRules = {
    treatment: rulesData.rules.treatment_additions,
    surgery: rulesData.rules.surgery_additions,
    crown: rulesData.rules.crown_additions,
  };

  let updateCount = 0;
  let errorCount = 0;

  // 1. 抜髄（単根管）
  console.log('\n[1/10] 抜髄（単根管）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            conditional_points: {
              after_pulp_preservation_3months: 42,
              after_direct_pulp_protection_1month: 80
            },
            conditions: [
              '歯髄温存療法を行った日から起算して3月以内の場合は42点',
              '直接歯髄保護処置を行った日から起算して1月以内の場合は80点'
            ]
          },
          addition_rules: additionRules.treatment
        }
      })
      .ilike('name', '%抜髄%')
      .ilike('name', '%単根管%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 2. 抜髄（2根管）
  console.log('\n[2/10] 抜髄（2根管）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            conditional_points: {
              after_pulp_preservation_3months: 234,
              after_direct_pulp_protection_1month: 272
            },
            conditions: [
              '歯髄温存療法を行った日から起算して3月以内の場合は234点',
              '直接歯髄保護処置を行った日から起算して1月以内の場合は272点'
            ]
          },
          addition_rules: additionRules.treatment
        }
      })
      .ilike('name', '%抜髄%')
      .ilike('name', '%2根管%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 3. 抜髄（3根管以上）
  console.log('\n[3/10] 抜髄（3根管以上）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            conditional_points: {
              after_pulp_preservation_3months: 408,
              after_direct_pulp_protection_1month: 446
            },
            conditions: [
              '歯髄温存療法を行った日から起算して3月以内の場合は408点',
              '直接歯髄保護処置を行った日から起算して1月以内の場合は446点'
            ]
          },
          addition_rules: additionRules.treatment
        }
      })
      .ilike('name', '%抜髄%')
      .ilike('name', '%3根管%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 4. 抜歯（前歯）
  console.log('\n[4/10] 抜歯（前歯）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            additions: {
              difficult_extraction: 210
            },
            conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点']
          },
          addition_rules: additionRules.surgery
        }
      })
      .ilike('name', '%抜歯%')
      .ilike('name', '%前歯%')
      .not('name', 'ilike', '%埋伏%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 5. 抜歯（臼歯）
  console.log('\n[5/10] 抜歯（臼歯）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            additions: {
              difficult_extraction: 210
            },
            conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点']
          },
          addition_rules: additionRules.surgery
        }
      })
      .ilike('name', '%抜歯%')
      .ilike('name', '%臼歯%')
      .not('name', 'ilike', '%埋伏%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 6. 抜歯（埋伏歯）
  console.log('\n[6/10] 抜歯（埋伏歯）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            additions: {
              mandibular_impacted: 120
            },
            conditions: [
              '完全埋伏歯（骨性）又は水平埋伏智歯に限り算定',
              '下顎完全埋伏智歯（骨性）又は下顎水平埋伏智歯の場合 +120点'
            ]
          },
          addition_rules: additionRules.surgery
        }
      })
      .ilike('name', '%抜歯%')
      .ilike('name', '%埋伏%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 7. 歯髄保護処置（歯髄温存療法）
  console.log('\n[7/10] 歯髄保護処置（歯髄温存療法）を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯につき',
            conditions: ['経過観察中のう蝕処置は所定点数に含まれる']
          },
          addition_rules: additionRules.treatment
        }
      })
      .ilike('name', '%歯髄%温存%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 8. う蝕処置
  console.log('\n[8/10] う蝕処置を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          detailed_rules: {
            unit: '1歯1回につき',
            inclusions: ['貼薬', '仮封', '特定薬剤'],
            note: '貼薬、仮封及び特定薬剤の費用並びに特定保険医療材料料は、所定点数に含まれる'
          },
          addition_rules: additionRules.treatment
        }
      })
      .or('name.ilike.%う蝕%処置%,name.ilike.%う窩%処置%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 9. 充填関連
  console.log('\n[9/10] 充填関連を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          addition_rules: additionRules.treatment
        }
      })
      .or('name.ilike.%充填%,name.ilike.%CR%,name.ilike.%レジン%充%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  // 10. 根管治療関連
  console.log('\n[10/10] 根管治療関連を更新中...');
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .update({
        metadata: {
          addition_rules: additionRules.treatment
        }
      })
      .or('name.ilike.%根管%,name.ilike.%感染根管%')
      .select();

    if (error) throw error;
    updateCount += data?.length || 0;
    console.log(`  ✓ ${data?.length || 0}件更新`);
  } catch (error: any) {
    console.error(`  ✗ エラー:`, error.message);
    errorCount++;
  }

  console.log('\n' + '='.repeat(80));
  console.log('マイグレーション完了');
  console.log('='.repeat(80));
  console.log(`更新成功: ${updateCount}件`);
  console.log(`エラー: ${errorCount}件`);

  if (updateCount > 0) {
    console.log('\n✓ データベースへの統合が完了しました！');
    console.log('次のステップ: アプリケーションコードの更新');
  }
}

main().catch((error) => {
  console.error('致命的エラー:', error);
  process.exit(1);
});
