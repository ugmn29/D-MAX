#!/usr/bin/env npx tsx
/**
 * PDFから抽出した詳細ルールをSQLマイグレーションファイルとして生成
 */

import * as fs from 'fs';
import * as path from 'path';

// PDFから抽出したルールを読み込み
const rulesPath = path.join(process.cwd(), 'pdf_detailed_rules.json');
const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

/**
 * JSON を PostgreSQL の JSONB リテラルに変換
 */
function toJsonbLiteral(obj: any): string {
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

/**
 * SQL UPDATE文を生成
 */
function generateUpdateSQL(code: string, namePattern: string, metadata: any): string {
  return `
-- ${code}: ${namePattern}
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral(metadata)}
WHERE name ILIKE '%${namePattern}%'
  AND code ILIKE '%${code}%';
`;
}

function main() {
  console.log('SQL マイグレーションファイルを生成中...');

  const additionRules = {
    treatment: rulesData.rules.treatment_additions,
    surgery: rulesData.rules.surgery_additions,
    crown: rulesData.rules.crown_additions,
  };

  let sql = `-- PDFから抽出した詳細算定ルールの統合
-- 生成日時: ${new Date().toISOString()}
-- ソース: 厚生局　歯科保険点数.pdf

BEGIN;

`;

  // 1. 抜髄（I005）の更新
  sql += `
-- =====================================================
-- 抜髄（I005）の詳細ルール
-- =====================================================

-- 単根管
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
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
  })}
WHERE name ILIKE '%抜髄%' AND name ILIKE '%単根管%';

-- 2根管
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
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
  })}
WHERE name ILIKE '%抜髄%' AND name ILIKE '%2根管%';

-- 3根管以上
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
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
  })}
WHERE name ILIKE '%抜髄%' AND name ILIKE '%3根管%';

`;

  // 2. 抜歯（J000）の更新
  sql += `
-- =====================================================
-- 抜歯手術（J000）の詳細ルール
-- =====================================================

-- 乳歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      conditions: []
    },
    addition_rules: additionRules.surgery
  })}
WHERE name ILIKE '%抜歯%' AND name ILIKE '%乳歯%';

-- 前歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      additions: {
        difficult_extraction: 210
      },
      conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点']
    },
    addition_rules: additionRules.surgery
  })}
WHERE name ILIKE '%抜歯%' AND name ILIKE '%前歯%' AND name NOT ILIKE '%埋伏%';

-- 臼歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      additions: {
        difficult_extraction: 210
      },
      conditions: ['難抜歯加算: 歯根肥大、骨の癒着歯等の場合 +210点']
    },
    addition_rules: additionRules.surgery
  })}
WHERE name ILIKE '%抜歯%' AND name ILIKE '%臼歯%' AND name NOT ILIKE '%埋伏%';

-- 埋伏歯
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
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
  })}
WHERE name ILIKE '%抜歯%' AND name ILIKE '%埋伏%';

`;

  // 3. 歯髄保護処置（I001）の更新
  sql += `
-- =====================================================
-- 歯髄保護処置（I001）の詳細ルール
-- =====================================================

-- 歯髄温存療法
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      conditions: ['経過観察中のう蝕処置は所定点数に含まれる']
    },
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%歯髄%温存%';

-- 直接歯髄保護処置
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      conditions: []
    },
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%直接%歯髄%保護%';

-- 間接歯髄保護処置
UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯につき',
      conditions: []
    },
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%間接%歯髄%保護%';

`;

  // 4. う蝕処置（I000）の更新
  sql += `
-- =====================================================
-- う蝕処置（I000）の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    detailed_rules: {
      unit: '1歯1回につき',
      inclusions: ['貼薬', '仮封', '特定薬剤'],
      note: '貼薬、仮封及び特定薬剤の費用並びに特定保険医療材料料は、所定点数に含まれる'
    },
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%う蝕%処置%' OR name ILIKE '%う窩%処置%';

`;

  // 5. 充填関連の更新（CR充填など）
  sql += `
-- =====================================================
-- 充填関連の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%充填%' OR name ILIKE '%CR%' OR name ILIKE '%レジン%充%';

`;

  // 6. 根管治療関連の更新
  sql += `
-- =====================================================
-- 根管治療関連の詳細ルール
-- =====================================================

UPDATE treatment_codes
SET metadata = COALESCE(metadata, '{}'::jsonb) || ${toJsonbLiteral({
    addition_rules: additionRules.treatment
  })}
WHERE name ILIKE '%根管%' OR name ILIKE '%感染根管%';

`;

  sql += `
COMMIT;

-- 更新結果の確認
SELECT
  code,
  name,
  points,
  metadata->'detailed_rules' as detailed_rules,
  metadata->'addition_rules' as addition_rules
FROM treatment_codes
WHERE metadata->'detailed_rules' IS NOT NULL
ORDER BY code
LIMIT 20;
`;

  // ファイル保存
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const outputPath = path.join(process.cwd(), 'supabase', 'migrations', `${timestamp}_add_pdf_detailed_rules.sql`);

  fs.writeFileSync(outputPath, sql, 'utf-8');

  console.log(`✓ SQLマイグレーションファイルを生成しました:`);
  console.log(`  ${outputPath}`);
  console.log(`\n実行方法:`);
  console.log(`  psql [接続情報] < ${outputPath}`);
  console.log(`  または`);
  console.log(`  npx supabase db push`);
}

main();
