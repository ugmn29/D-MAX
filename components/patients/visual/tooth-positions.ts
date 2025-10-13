// 歯列図画像上の各歯の位置とサイズを定義
// 画像サイズ: 約500px × 250px と仮定（実際の画像に合わせて調整）

export interface ToothPosition {
  toothNumber: number
  x: number // 左からの位置（%）
  y: number // 上からの位置（%）
  width: number // 幅（%）
  height: number // 高さ（%）
  position: 'upper' | 'lower'
}

// 上顎の歯の位置（右から左：18-11, 21-28）
// 画像の上段
const upperTeethPositions: ToothPosition[] = [
  // 右上（18-11）
  { toothNumber: 18, x: 2, y: 2, width: 5.5, height: 35, position: 'upper' },
  { toothNumber: 17, x: 8, y: 2, width: 5.5, height: 35, position: 'upper' },
  { toothNumber: 16, x: 14, y: 2, width: 5.5, height: 35, position: 'upper' },
  { toothNumber: 15, x: 20, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 14, x: 26, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 13, x: 32, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 12, x: 38, y: 2, width: 4.5, height: 35, position: 'upper' },
  { toothNumber: 11, x: 43.5, y: 2, width: 4.5, height: 35, position: 'upper' },

  // 左上（21-28）
  { toothNumber: 21, x: 52, y: 2, width: 4.5, height: 35, position: 'upper' },
  { toothNumber: 22, x: 57.5, y: 2, width: 4.5, height: 35, position: 'upper' },
  { toothNumber: 23, x: 63, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 24, x: 69, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 25, x: 75, y: 2, width: 5, height: 35, position: 'upper' },
  { toothNumber: 26, x: 81, y: 2, width: 5.5, height: 35, position: 'upper' },
  { toothNumber: 27, x: 87, y: 2, width: 5.5, height: 35, position: 'upper' },
  { toothNumber: 28, x: 93, y: 2, width: 5.5, height: 35, position: 'upper' },
]

// 下顎の歯の位置（右から左：48-41, 31-38）
// 画像の下段
const lowerTeethPositions: ToothPosition[] = [
  // 右下（48-41）
  { toothNumber: 48, x: 2, y: 63, width: 5.5, height: 35, position: 'lower' },
  { toothNumber: 47, x: 8, y: 63, width: 5.5, height: 35, position: 'lower' },
  { toothNumber: 46, x: 14, y: 63, width: 5.5, height: 35, position: 'lower' },
  { toothNumber: 45, x: 20, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 44, x: 26, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 43, x: 32, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 42, x: 38, y: 63, width: 4.5, height: 35, position: 'lower' },
  { toothNumber: 41, x: 43.5, y: 63, width: 4.5, height: 35, position: 'lower' },

  // 左下（31-38）
  { toothNumber: 31, x: 52, y: 63, width: 4.5, height: 35, position: 'lower' },
  { toothNumber: 32, x: 57.5, y: 63, width: 4.5, height: 35, position: 'lower' },
  { toothNumber: 33, x: 63, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 34, x: 69, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 35, x: 75, y: 63, width: 5, height: 35, position: 'lower' },
  { toothNumber: 36, x: 81, y: 63, width: 5.5, height: 35, position: 'lower' },
  { toothNumber: 37, x: 87, y: 63, width: 5.5, height: 35, position: 'lower' },
  { toothNumber: 38, x: 93, y: 63, width: 5.5, height: 35, position: 'lower' },
]

// 全ての歯の位置情報
export const toothPositions: ToothPosition[] = [
  ...upperTeethPositions,
  ...lowerTeethPositions,
]

// 歯番号から位置情報を取得
export function getToothPosition(toothNumber: number): ToothPosition | undefined {
  return toothPositions.find(pos => pos.toothNumber === toothNumber)
}
