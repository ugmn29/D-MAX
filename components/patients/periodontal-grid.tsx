'use client'

import { useState } from 'react'

interface PeriodontalGridProps {
  measurementType: '6point' | '4point' | '1point'
  ppdData: Record<string, number>
  mobilityData: Record<string, number>
  plaqueData: Record<string, boolean>
  missingTeeth: Set<number>
  currentPosition: { row: number; col: number }
  onCellClick: (row: number, col: number) => void
}

// 歯番号（FDI表記）- 画面表示順序（左から右）
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

export function PeriodontalGrid({
  measurementType,
  ppdData,
  mobilityData,
  plaqueData,
  missingTeeth,
  currentPosition,
  onCellClick,
}: PeriodontalGridProps) {

  // セルの値を取得
  const getCellValue = (toothNumber: number, position: string): string => {
    const key = `${toothNumber}_${position}`
    return ppdData[key]?.toString() || ''
  }

  // 動揺度を取得
  const getMobility = (toothNumber: number): string => {
    return mobilityData[toothNumber]?.toString() || '0'
  }

  // プラークを取得
  const hasPlaque = (toothNumber: number): boolean => {
    return plaqueData[toothNumber] || false
  }

  // 欠損歯かどうか
  const isMissing = (toothNumber: number): boolean => {
    return missingTeeth.has(toothNumber)
  }

  // 現在選択中のセルかどうか
  const isCurrentCell = (row: number, col: number): boolean => {
    return currentPosition.row === row && currentPosition.col === col
  }

  // 歯のビジュアル（PC行 - X字型4分割）
  const renderToothVisual = (toothNumber: number) => {
    if (isMissing(toothNumber)) {
      // 欠損歯: 斜線
      return (
        <div className="w-full h-10 bg-gray-200 relative overflow-hidden">
          <svg className="w-full h-full">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#9CA3AF" strokeWidth="1" />
          </svg>
        </div>
      )
    }

    // X字型に4分割（上・右・下・左の三角形）
    // TODO: プラークデータ構造を拡張して各部位の付着状態を管理
    const hasPlaqueFull = hasPlaque(toothNumber)

    // 各部位のクリックハンドラ（仮実装）
    const handleAreaClick = (area: 'top' | 'right' | 'bottom' | 'left') => {
      console.log(`Tooth ${toothNumber}, area: ${area}`)
      // TODO: プラークデータを更新
    }

    return (
      <div className="w-full h-10 relative bg-white">
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* X字の分割線 */}
          <line x1="0" y1="0" x2="100" y2="100" stroke="#9CA3AF" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#9CA3AF" strokeWidth="1" vectorEffect="non-scaling-stroke" />

          {/* 上の三角形 */}
          <polygon
            points="0,0 100,0 50,50"
            fill={hasPlaqueFull ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => handleAreaClick('top')}
          />

          {/* 右の三角形 */}
          <polygon
            points="100,0 100,100 50,50"
            fill={hasPlaqueFull ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => handleAreaClick('right')}
          />

          {/* 下の三角形 */}
          <polygon
            points="100,100 0,100 50,50"
            fill={hasPlaqueFull ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => handleAreaClick('bottom')}
          />

          {/* 左の三角形 */}
          <polygon
            points="0,100 0,0 50,50"
            fill={hasPlaqueFull ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => handleAreaClick('left')}
          />
        </svg>
      </div>
    )
  }

  // PPD入力セル（3点 or 4点法の場合は舌側1点）
  const renderPPDCells = (toothNumber: number, side: 'buccal' | 'lingual', isLowerJaw: boolean = false) => {
    // 4点法の場合、舌側は中央のみ
    const is4PointLingual = measurementType === '4point' && side === 'lingual'

    const positions = side === 'buccal'
      ? ['db', 'b', 'mb']  // 遠心・中央・近心
      : ['dl', 'l', 'ml']

    if (isMissing(toothNumber)) {
      if (is4PointLingual) {
        // 4点法舌側: 欠損歯は1セル
        return (
          <div className="w-full h-6 bg-slate-400"></div>
        )
      }
      return (
        <div className="grid grid-cols-3 gap-0 w-full">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="h-6 bg-slate-400 border-r border-gray-400 last:border-r-0"></div>
          ))}
        </div>
      )
    }

    // 4点法の舌側: 中央のみ入力可、近遠心はグレーアウト
    if (is4PointLingual) {
      const key = `${toothNumber}_l`
      const value = getCellValue(toothNumber, 'l')

      return (
        <div className="grid grid-cols-3 gap-0 w-full">
          {/* 遠心: グレーアウト */}
          <div className="h-6 bg-gray-200 border-r border-gray-400"></div>

          {/* 中央: 入力可能 */}
          <div
            onClick={() => onCellClick(0, 1)}
            className={`h-6 bg-white border-r border-gray-400 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50 ${
              value && parseInt(value) >= 4 ? 'bg-red-100 text-red-700 font-bold' : ''
            }`}
          >
            {value}
          </div>

          {/* 近心: グレーアウト */}
          <div className="h-6 bg-gray-200"></div>
        </div>
      )
    }

    // 通常の3点表示
    return (
      <div className="grid grid-cols-3 gap-0 w-full">
        {positions.map((pos, idx) => {
          const key = `${toothNumber}_${pos}`
          const value = getCellValue(toothNumber, pos)
          // TODO: row, colの計算は後で実装
          const isSelected = false

          return (
            <div
              key={idx}
              onClick={() => onCellClick(0, idx)}
              className={`h-6 bg-white border-r border-gray-400 last:border-r-0 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50 ${
                isSelected ? 'bg-blue-200 ring-2 ring-blue-500' : ''
              } ${value && parseInt(value) >= 4 ? 'bg-red-100 text-red-700 font-bold' : ''}`}
            >
              {value}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white p-4 rounded-lg overflow-x-auto">
      <table className="border-collapse table-fixed">
        <colgroup>
          <col className="w-16" /> {/* ラベル列 */}
          {Array(8).fill(0).map((_, i) => <col key={`upper-left-${i}`} className="w-12" />)}
          <col className="w-2" /> {/* 中央分離線 */}
          {Array(8).fill(0).map((_, i) => <col key={`upper-right-${i}`} className="w-12" />)}
        </colgroup>
        <tbody>
          {/* 上顎 */}
          {/* PC行 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              PC
            </td>
            {UPPER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0">
                {renderToothVisual(tooth)}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {UPPER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0">
                {renderToothVisual(tooth)}
              </td>
            ))}
          </tr>

          {/* TM行 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              TM
            </td>
            {UPPER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-6 flex items-center justify-center text-sm ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {UPPER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-6 flex items-center justify-center text-sm ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
          </tr>

          {/* EPP頬側 (1行目) */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              EPP
            </td>
            {UPPER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'buccal')}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {UPPER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'buccal')}
              </td>
            ))}
          </tr>

          {/* EPP舌側 (2行目) */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              EPP
            </td>
            {UPPER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'lingual')}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {UPPER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'lingual')}
              </td>
            ))}
          </tr>

          {/* 上顎歯番号 - 8,7,6,5,4,3,2,1 | 1,2,3,4,5,6,7,8 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center h-6">

            </td>
            {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
              <td key={`upper-${num}`} className="border border-gray-400 bg-blue-50 p-0">
                <div className="w-full h-6 flex items-center justify-center text-xs font-medium text-gray-700">
                  {num}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <td key={`upper-${num}`} className="border border-gray-400 bg-blue-50 p-0">
                <div className="w-full h-6 flex items-center justify-center text-xs font-medium text-gray-700">
                  {num}
                </div>
              </td>
            ))}
          </tr>

          {/* 区切り線 */}
          <tr>
            <td colSpan={17} className="h-4 bg-white"></td>
          </tr>

          {/* 下顎歯番号 - 8,7,6,5,4,3,2,1 | 1,2,3,4,5,6,7,8 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center h-6">

            </td>
            {[8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
              <td key={`lower-${num}`} className="border border-gray-400 bg-blue-50 p-0">
                <div className="w-full h-6 flex items-center justify-center text-xs font-medium text-gray-700">
                  {num}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <td key={`lower-${num}`} className="border border-gray-400 bg-blue-50 p-0">
                <div className="w-full h-6 flex items-center justify-center text-xs font-medium text-gray-700">
                  {num}
                </div>
              </td>
            ))}
          </tr>

          {/* EPP舌側 (1行目) */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              EPP
            </td>
            {LOWER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'lingual', true)}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {LOWER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'lingual', true)}
              </td>
            ))}
          </tr>

          {/* EPP頬側 (2行目) */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              EPP
            </td>
            {LOWER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'buccal', true)}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {LOWER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                {renderPPDCells(tooth, 'buccal', true)}
              </td>
            ))}
          </tr>

          {/* TM行 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              TM
            </td>
            {LOWER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-6 flex items-center justify-center text-sm ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {LOWER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-6 flex items-center justify-center text-sm ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
          </tr>

          {/* PC行 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              PC
            </td>
            {LOWER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0">
                {renderToothVisual(tooth)}
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {LOWER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0">
                {renderToothVisual(tooth)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
