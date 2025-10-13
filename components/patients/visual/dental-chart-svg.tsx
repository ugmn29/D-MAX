'use client'

import { ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

interface ToothData {
  status?: ToothStatus
  cariesLevel?: CariesLevel
  restorationType?: RestorationType
  materialType?: MaterialType
}

interface DentalChartSVGProps {
  toothData: Record<number, ToothData>
  selectedTeeth: Set<number>
  onToothClick: (toothNumber: number) => void
}

// 各歯の中心座標とサイズ（SVG画像に合わせて調整）
const toothPositions: Record<number, { x: number; y: number; width: number; height: number }> = {
  // 上顎右
  18: { x: 64, y: 65, width: 26, height: 70 },
  17: { x: 96, y: 65, width: 26, height: 70 },
  16: { x: 128, y: 65, width: 26, height: 70 },
  15: { x: 156, y: 65, width: 22, height: 70 },
  14: { x: 184, y: 65, width: 22, height: 70 },
  13: { x: 209, y: 65, width: 20, height: 70 },
  12: { x: 234, y: 65, width: 16, height: 70 },
  11: { x: 256, y: 65, width: 16, height: 70 },
  // 上顎左
  21: { x: 288, y: 65, width: 16, height: 70 },
  22: { x: 310, y: 65, width: 16, height: 70 },
  23: { x: 336, y: 65, width: 20, height: 70 },
  24: { x: 360, y: 65, width: 22, height: 70 },
  25: { x: 388, y: 65, width: 22, height: 70 },
  26: { x: 416, y: 65, width: 26, height: 70 },
  27: { x: 448, y: 65, width: 26, height: 70 },
  28: { x: 480, y: 65, width: 26, height: 70 },
  // 下顎右
  48: { x: 64, y: 365, width: 26, height: 70 },
  47: { x: 96, y: 365, width: 26, height: 70 },
  46: { x: 128, y: 365, width: 26, height: 70 },
  45: { x: 156, y: 365, width: 22, height: 70 },
  44: { x: 184, y: 365, width: 22, height: 70 },
  43: { x: 209, y: 365, width: 20, height: 70 },
  42: { x: 234, y: 365, width: 16, height: 70 },
  41: { x: 256, y: 365, width: 16, height: 70 },
  // 下顎左
  31: { x: 288, y: 365, width: 16, height: 70 },
  32: { x: 310, y: 365, width: 16, height: 70 },
  33: { x: 336, y: 365, width: 20, height: 70 },
  34: { x: 360, y: 365, width: 22, height: 70 },
  35: { x: 388, y: 365, width: 22, height: 70 },
  36: { x: 416, y: 365, width: 26, height: 70 },
  37: { x: 448, y: 365, width: 26, height: 70 },
  38: { x: 480, y: 365, width: 26, height: 70 },
}

// 色を取得
function getToothColor(data?: ToothData): string {
  if (!data || data.status === 'healthy') return 'transparent'
  if (data.status === 'missing') return 'white'
  if (data.status === 'extraction_required') return 'rgba(255, 235, 59, 0.5)'
  if (data.status === 'unerupted') return 'rgba(224, 224, 224, 0.6)'

  if (data.status === 'caries') {
    switch (data.cariesLevel) {
      case 'CO': return 'rgba(255, 249, 196, 0.5)'
      case 'C1': return 'rgba(255, 224, 130, 0.5)'
      case 'C2': return 'rgba(255, 183, 77, 0.5)'
      case 'C3': return 'rgba(255, 152, 0, 0.5)'
      case 'C4': return 'rgba(244, 67, 54, 0.5)'
      default: return 'transparent'
    }
  }

  if (data.status === 'restoration') {
    switch (data.materialType) {
      case 'ceramic': return 'rgba(179, 229, 252, 0.6)'
      case 'metal': return 'rgba(189, 189, 189, 0.6)'
      case 'cad': return 'rgba(200, 230, 201, 0.6)'
      case 'hr': return 'rgba(225, 190, 231, 0.6)'
      default: return 'rgba(179, 229, 252, 0.6)'
    }
  }

  return 'transparent'
}

export function DentalChartSVG({ toothData, selectedTeeth, onToothClick }: DentalChartSVGProps) {
  const allTeeth = Object.keys(toothPositions).map(Number)

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200 relative">
      <div className="relative w-full max-w-5xl mx-auto">
        {/* ベースのSVG画像 */}
        <svg viewBox="0 0 544 500" className="w-full">
          <image href="/images/dental-chart-base.svg" width="544" height="500" />

          {/* 各歯のインタラクティブレイヤー */}
          {allTeeth.map(toothNumber => {
            const pos = toothPositions[toothNumber]
            const data = toothData[toothNumber]
            const color = getToothColor(data)

            return (
              <g
                key={toothNumber}
                onClick={() => onToothClick(toothNumber)}
                className="cursor-pointer"
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
              >
                {/* 色のオーバーレイ */}
                {color !== 'transparent' && (
                  <>
                    {data?.status === 'restoration' && data.restorationType === 'inlay' ? (
                      // インレー: 中心部分のみ
                      <rect
                        x={pos.x - pos.width * 0.25}
                        y={pos.y - pos.height * 0.25}
                        width={pos.width * 0.5}
                        height={pos.height * 0.5}
                        fill={color}
                        rx="2"
                      />
                    ) : data?.status === 'missing' ? (
                      // 欠損: 白 + ×
                      <>
                        <rect
                          x={pos.x - pos.width / 2}
                          y={pos.y - pos.height / 2}
                          width={pos.width}
                          height={pos.height}
                          fill="white"
                        />
                        <text
                          x={pos.x}
                          y={pos.y + 6}
                          fontSize="20"
                          textAnchor="middle"
                          fill="#ccc"
                          fontWeight="bold"
                        >
                          ×
                        </text>
                      </>
                    ) : (
                      // その他: 全体
                      <rect
                        x={pos.x - pos.width / 2}
                        y={pos.y - pos.height / 2}
                        width={pos.width}
                        height={pos.height}
                        fill={color}
                        style={{ mixBlendMode: 'multiply' }}
                      />
                    )}
                  </>
                )}

                {/* 選択状態 */}
                {selectedTeeth.has(toothNumber) && (
                  <rect
                    x={pos.x - pos.width / 2 - 2}
                    y={pos.y - pos.height / 2 - 2}
                    width={pos.width + 4}
                    height={pos.height + 4}
                    fill="none"
                    stroke="#2196F3"
                    strokeWidth="2.5"
                    rx="3"
                  />
                )}

                {/* ホバー効果 */}
                <rect
                  x={pos.x - pos.width / 2}
                  y={pos.y - pos.height / 2}
                  width={pos.width}
                  height={pos.height}
                  fill="transparent"
                  className="hover:fill-blue-200 hover:fill-opacity-20 transition-all"
                />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
