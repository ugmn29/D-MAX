# PDF保険点数ルール 使用ガイド

## 📋 概要

このガイドでは、PDFから抽出した保険点数ルールをアプリケーションで使用する方法を説明します。

---

## 🚀 セットアップ手順

### 1. データベースマイグレーションの実行

以下のいずれかの方法でマイグレーションを実行してください。

#### オプションA: Supabase Dashboard（推奨）

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. 左メニューから **SQL Editor** を選択
4. **New query** をクリック
5. [supabase/migrations/2025-11-12_add_pdf_detailed_rules.sql](../supabase/migrations/2025-11-12_add_pdf_detailed_rules.sql) の内容をコピー&ペースト
6. **Run** をクリック

#### オプションB: psqlコマンド

```bash
# DATABASE_URLを環境変数に設定
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# マイグレーション実行
psql $DATABASE_URL < supabase/migrations/2025-11-12_add_pdf_detailed_rules.sql
```

#### オプションC: TypeScriptスクリプト（ネットワーク接続が安定している場合）

```bash
# 環境変数を読み込んで実行
source .env.local && npx tsx scripts/apply-pdf-rules-migration.ts
```

### 2. 更新の確認

マイグレーション実行後、以下のSQLで確認：

```sql
-- 更新された診療行為を確認
SELECT
  code,
  name,
  points,
  metadata->'detailed_rules' as detailed_rules,
  metadata->'addition_rules' as addition_rules
FROM treatment_codes
WHERE metadata->'detailed_rules' IS NOT NULL
ORDER BY code
LIMIT 10;
```

---

## 💡 使用方法

### 1. 基本的な点数計算（加算なし）

既存の方法と同じです：

```typescript
import { calculateInsurancePoints } from '@/lib/api/emr';

const treatments = [
  { code: 'I005-1', points: 230, count: 1 }, // 抜髄（単根管）
  { code: 'J000-2', points: 155, count: 1 }  // 抜歯（前歯）
];

const total = calculateInsurancePoints(treatments);
console.log(`合計点数: ${total}点`); // 385点
```

### 2. 加算ルールを適用した点数計算

新しい関数を使用します：

```typescript
import { calculatePointsWithAdditions, getTreatmentDetailedRules } from '@/lib/api/emr';

// 診療行為の詳細ルールを取得
const treatmentId = 'xxx-xxx-xxx'; // 診療行為ID
const metadata = await getTreatmentDetailedRules(treatmentId);

if (metadata?.addition_rules) {
  // 加算条件を指定
  const context = {
    patientAge: 5,              // 5歳の患者
    isHoliday: false,
    isOvertime: true,           // 時間外診療
    isMidnight: false,
    isHomeVisit: false,
    isDifficultPatient: false,
    basePoints: 230             // 基本点数
  };

  // 加算ルールを適用して計算
  const result = calculatePointsWithAdditions(
    230,  // 基本点数
    metadata.addition_rules,
    context
  );

  console.log(`基本点数: 230点`);
  console.log(`合計点数: ${result.total}点`);
  console.log(`適用された加算:`);
  result.appliedAdditions.forEach(add => {
    console.log(`  - ${add.type}: +${add.points}点`);
  });
}
```

**出力例：**
```
基本点数: 230点
合計点数: 407点
適用された加算:
  - 年齢加算(6歳未満): +115点
  - 時間外加算: +92点
```

### 3. 電子カルテUIでの使用例

```typescript
// components/patients/emr-tab.tsx

import { useState, useEffect } from 'react';
import { calculatePointsWithAdditions, getTreatmentDetailedRules } from '@/lib/api/emr';

export function EMRTab({ patient }: { patient: Patient }) {
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentCode | null>(null);
  const [calculatedPoints, setCalculatedPoints] = useState<number>(0);
  const [appliedAdditions, setAppliedAdditions] = useState<any[]>([]);

  // 診療行為が選択されたときに自動計算
  useEffect(() => {
    if (selectedTreatment) {
      calculatePoints();
    }
  }, [selectedTreatment, patient]);

  const calculatePoints = async () => {
    if (!selectedTreatment) return;

    // 詳細ルールを取得
    const metadata = await getTreatmentDetailedRules(selectedTreatment.id);

    if (metadata?.addition_rules) {
      // 現在の診療状況を判定
      const now = new Date();
      const hour = now.getHours();
      const isOvertime = hour < 9 || hour >= 18;
      const isMidnight = hour >= 22 || hour < 6;
      const dayOfWeek = now.getDay();
      const isHoliday = dayOfWeek === 0 || dayOfWeek === 6;

      // 患者年齢を計算
      const birthDate = new Date(patient.birth_date);
      const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // 加算計算
      const result = calculatePointsWithAdditions(
        selectedTreatment.points,
        metadata.addition_rules,
        {
          patientAge: age,
          isHoliday,
          isOvertime,
          isMidnight,
          isHomeVisit: false, // UIで選択可能にする
          isDifficultPatient: false, // UIで選択可能にする
          basePoints: selectedTreatment.points
        }
      );

      setCalculatedPoints(result.total);
      setAppliedAdditions(result.appliedAdditions);
    } else {
      setCalculatedPoints(selectedTreatment.points);
      setAppliedAdditions([]);
    }
  };

  return (
    <div>
      {/* 診療行為選択UI */}
      <TreatmentSelector
        value={selectedTreatment}
        onChange={setSelectedTreatment}
      />

      {/* 点数表示 */}
      {selectedTreatment && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-bold">{selectedTreatment.name}</h3>
          <div className="mt-2">
            <div className="flex justify-between">
              <span>基本点数:</span>
              <span>{selectedTreatment.points}点</span>
            </div>

            {appliedAdditions.length > 0 && (
              <>
                {appliedAdditions.map((add, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-blue-600">
                    <span>{add.type}:</span>
                    <span>+{add.points}点</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>合計点数:</span>
                  <span>{calculatedPoints}点</span>
                </div>
              </>
            )}
          </div>

          {/* 算定条件の表示 */}
          {metadata?.detailed_rules?.conditions && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm">算定条件:</h4>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {metadata.detailed_rules.conditions.map((cond: string, idx: number) => (
                  <li key={idx}>{cond}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. 条件付き点数変動の処理

抜髄などの条件付き点数変動を処理する例：

```typescript
// 抜髄の場合、過去の歯髄保護処置をチェック
const treatmentName = '抜髄（単根管）';
const metadata = await getTreatmentDetailedRules(treatmentId);

if (metadata?.detailed_rules?.conditional_points) {
  // 過去3ヶ月以内に歯髄温存療法を実施したかチェック
  const hasPulpPreservation = await checkPreviousTreatment(
    patientId,
    '歯髄温存療法',
    90 // 3ヶ月 = 90日
  );

  if (hasPulpPreservation) {
    // 減算後の点数を使用
    const reducedPoints = metadata.detailed_rules.conditional_points.after_pulp_preservation_3months;
    console.log(`減算適用: 230点 → ${reducedPoints}点`);
  }
}
```

### 5. 難抜歯加算の適用

```typescript
const treatmentName = '抜歯（前歯）';
const metadata = await getTreatmentDetailedRules(treatmentId);

if (metadata?.detailed_rules?.additions?.difficult_extraction) {
  // UIでユーザーが「難抜歯」にチェックを入れた場合
  const isDifficultExtraction = true; // UI入力値

  if (isDifficultExtraction) {
    const basePoints = 155; // 前歯抜歯の基本点数
    const additionPoints = metadata.detailed_rules.additions.difficult_extraction;
    const total = basePoints + additionPoints;

    console.log(`基本点数: ${basePoints}点`);
    console.log(`難抜歯加算: +${additionPoints}点`);
    console.log(`合計: ${total}点`); // 365点
  }
}
```

---

## 🔍 データ構造

### metadata.detailed_rules

```typescript
{
  unit: string,                    // 算定単位（例: "1歯につき"）
  conditional_points?: {           // 条件付き点数変動
    after_pulp_preservation_3months?: number,
    after_direct_pulp_protection_1month?: number
  },
  additions?: {                    // 特殊加算
    difficult_extraction?: number,
    mandibular_impacted?: number
  },
  conditions: string[],            // 算定条件（文章）
  inclusions?: string[],           // 包括される処置
  note?: string                    // 備考
}
```

### metadata.addition_rules

```typescript
{
  age_based_additions: Array<{
    type: 'under_6_infant' | 'difficult_patient',
    rate: number,              // 加算率（0.5 = 50%）
    description: string
  }>,
  time_based_additions: Array<{
    type: 'holiday' | 'overtime' | 'midnight',
    rate: number,
    description: string
  }>,
  visit_based_additions: Array<{
    type: 'home_visit',
    rate: number,
    description: string
  }>
}
```

---

## ⚠️ 注意事項

### 1. パフォーマンス

- `getTreatmentDetailedRules()`は診療行為選択時に1回だけ呼び出す
- 結果をキャッシュして再利用する

```typescript
const [rulesCache, setRulesCache] = useState<Map<string, any>>(new Map());

const getRules = async (treatmentId: string) => {
  if (rulesCache.has(treatmentId)) {
    return rulesCache.get(treatmentId);
  }

  const rules = await getTreatmentDetailedRules(treatmentId);
  setRulesCache(new Map(rulesCache.set(treatmentId, rules)));
  return rules;
};
```

### 2. エラーハンドリング

```typescript
try {
  const result = calculatePointsWithAdditions(basePoints, additionRules, context);
  // 処理...
} catch (error) {
  console.error('点数計算エラー:', error);
  // フォールバック: 基本点数のみ使用
  return basePoints;
}
```

### 3. マイグレーション実行の確認

アプリケーション起動時にルールが存在するか確認：

```typescript
// lib/api/emr.ts に追加
export async function checkRulesAvailability(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('metadata')
      .not('metadata->detailed_rules', 'is', null)
      .limit(1);

    return !error && data && data.length > 0;
  } catch (error) {
    console.error('ルール確認エラー:', error);
    return false;
  }
}
```

### 4. 段階的な展開

最初は一部の診療行為のみで新機能を有効化：

```typescript
const ENABLED_TREATMENTS = [
  '抜髄', '抜歯', '充填', '根管治療'
];

const shouldUseAdvancedCalculation = (treatmentName: string) => {
  return ENABLED_TREATMENTS.some(t => treatmentName.includes(t));
};
```

---

## 📊 テスト例

```typescript
// __tests__/emr-calculations.test.ts

import { calculatePointsWithAdditions } from '@/lib/api/emr';

describe('点数計算（加算ルール適用）', () => {
  const mockAdditionRules = {
    age_based_additions: [
      { type: 'under_6_infant', rate: 0.5, description: '6歳未満加算' }
    ],
    time_based_additions: [
      { type: 'overtime', rate: 0.4, description: '時間外加算' }
    ],
    visit_based_additions: [
      { type: 'home_visit', rate: 0.5, description: '訪問診療加算' }
    ]
  };

  test('年齢加算（6歳未満）が正しく適用される', () => {
    const result = calculatePointsWithAdditions(
      230,  // 基本点数
      mockAdditionRules,
      {
        patientAge: 5,
        basePoints: 230
      }
    );

    expect(result.total).toBe(345); // 230 + 115
    expect(result.appliedAdditions).toHaveLength(1);
    expect(result.appliedAdditions[0].type).toBe('年齢加算(6歳未満)');
  });

  test('時間外加算が正しく適用される', () => {
    const result = calculatePointsWithAdditions(
      230,
      mockAdditionRules,
      {
        patientAge: 30,
        isOvertime: true,
        basePoints: 230
      }
    );

    expect(result.total).toBe(322); // 230 + 92
  });

  test('複数の加算が同時に適用される', () => {
    const result = calculatePointsWithAdditions(
      230,
      mockAdditionRules,
      {
        patientAge: 5,
        isHomeVisit: true,
        basePoints: 230
      }
    );

    expect(result.total).toBe(460); // 230 + 115 + 115
    expect(result.appliedAdditions).toHaveLength(2);
  });
});
```

---

## 🚀 次のステップ

1. **マイグレーション実行** - まだの場合は実行してください
2. **UIの更新** - 加算条件を選択・表示するUIを追加
3. **テストの実装** - 上記のテストを参考に実装
4. **段階的な展開** - 一部の診療行為から開始
5. **フィードバック収集** - 実際の使用感を確認

---

**作成日**: 2025年11月12日
**バージョン**: 1.0
