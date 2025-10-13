'use client'

import type { ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

interface ToothOverlayProps {
  status: ToothStatus
  cariesLevel?: CariesLevel
  restorationType?: RestorationType
  materialType?: MaterialType
}

// 材料の色を取得
function getMaterialColor(material?: MaterialType): string {
  switch (material) {
    case 'ceramic': return '#B3E5FC' // 水色
    case 'metal': return '#BDBDBD'   // グレー
    case 'cad': return '#C8E6C9'     // 緑
    case 'hr': return '#E1BEE7'      // 紫
    default: return '#B3E5FC'
  }
}

// う蝕レベルの色を取得
function getCariesColor(level?: CariesLevel): string {
  switch (level) {
    case 'CO': return '#FFF9C4'  // 薄黄色
    case 'C1': return '#FFE082'  // 薄オレンジ
    case 'C2': return '#FFB74D'  // オレンジ
    case 'C3': return '#FF9800'  // 濃オレンジ
    case 'C4': return '#F44336'  // 赤
    default: return '#FFF9C4'
  }
}

export function ToothOverlay({ status, cariesLevel, restorationType, materialType }: ToothOverlayProps) {
  // 健全歯: 何も表示しない
  if (status === 'healthy') {
    return null
  }

  // 欠損: 白で塗りつぶし + 薄い×マーク
  if (status === 'missing') {
    return (
      <div className="absolute inset-0 bg-white flex items-center justify-center">
        <span className="text-2xl text-gray-300 font-bold">×</span>
      </div>
    )
  }

  // 要抜歯: 薄い黄色 + △マーク
  if (status === 'extraction_required') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundColor: '#FFEB3B',
          opacity: 0.5,
        }}
      >
        <span className="text-2xl text-gray-700 font-bold">△</span>
      </div>
    )
  }

  // 未萌出: 薄いグレー + ▲マーク
  if (status === 'unerupted') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          backgroundColor: '#E0E0E0',
          opacity: 0.6,
        }}
      >
        <span className="text-xl text-gray-500 font-bold">▲</span>
      </div>
    )
  }

  // う蝕: 歯全体に半透明の色
  if (status === 'caries') {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: getCariesColor(cariesLevel),
          opacity: 0.5,
          mixBlendMode: 'multiply',
        }}
      />
    )
  }

  // 補綴物
  if (status === 'restoration') {
    const color = getMaterialColor(materialType)

    // インレー: 中心部60%のみ
    if (restorationType === 'inlay') {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            style={{
              width: '60%',
              height: '60%',
              backgroundColor: color,
              opacity: 0.6,
              mixBlendMode: 'multiply',
              borderRadius: '4px',
            }}
          />
        </div>
      )
    }

    // クラウン: 歯全体
    if (restorationType === 'crown') {
      return (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: color,
            opacity: 0.6,
            mixBlendMode: 'multiply',
          }}
        />
      )
    }

    // ブリッジ: 歯全体（横に繋がる表現は親コンポーネントで処理）
    if (restorationType === 'bridge') {
      return (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: color,
            opacity: 0.6,
            mixBlendMode: 'multiply',
          }}
        />
      )
    }
  }

  return null
}
