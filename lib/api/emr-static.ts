/**
 * 静的ルールを使用した点数計算（データベース不要）
 */

import { getTreatmentRuleByName } from '@/lib/treatment-rules-static';
import { calculatePointsWithAdditions, CalculationContext } from '@/lib/api/emr';

/**
 * 診療行為名から加算ルールを取得して点数計算
 * データベースアクセス不要
 */
export function calculatePointsWithStaticRules(
  treatmentName: string,
  basePoints: number,
  context: CalculationContext
): { total: number, appliedAdditions: Array<{ type: string, points: number, description: string }> } {
  // 診療行為名からルールを取得
  const rule = getTreatmentRuleByName(treatmentName);

  if (!rule) {
    // ルールが見つからない場合は基本点数のみ
    return {
      total: basePoints,
      appliedAdditions: []
    };
  }

  // 既存の計算関数を使用
  return calculatePointsWithAdditions(
    basePoints,
    rule.addition_rules,
    context
  );
}

/**
 * 使用例：
 *
 * const result = calculatePointsWithStaticRules(
 *   '抜髄（単根管）',
 *   230,
 *   {
 *     patientAge: 5,
 *     isOvertime: true,
 *     basePoints: 230
 *   }
 * );
 *
 * console.log(`合計点数: ${result.total}点`);
 * // → 407点（基本230 + 6歳未満115 + 時間外92）
 */
