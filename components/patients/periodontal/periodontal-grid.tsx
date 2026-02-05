'use client'

import { useState } from 'react'

interface PeriodontalGridProps {
  measurementType: '6point' | '4point' | '1point'
  ppdData: Record<string, number>
  mobilityData: Record<string, number>
  plaqueData: Record<string, boolean>
  bopData: Record<string, boolean>
  missingTeeth: Set<number>
  currentPosition: { row: number; toothIndex: number; point: number }
  onCellClick: (row: number, toothIndex: number, point?: number) => void
  onPlaqueToggle: (toothNumber: number, area: 'top' | 'right' | 'bottom' | 'left') => void
}

// 歯番号（FDI表記）- 画面表示順序（左から右）
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// 親知らず（デフォルトで除外する歯）
const WISDOM_TEETH = new Set([18, 28, 38, 48])

export function PeriodontalGrid({
  measurementType,
  ppdData,
  mobilityData,
  plaqueData,
  bopData,
  missingTeeth,
  currentPosition,
  onCellClick,
  onPlaqueToggle,
}: PeriodontalGridProps) {

  // セルの値を取得
  const getCellValue = (toothNumber: number, position: string): string => {
    const key = `${toothNumber}_${position}`
    const value = ppdData[key]?.toString() || ''
    return value
  }

  // 動揺度を取得
  const getMobility = (toothNumber: number): string => {
    return mobilityData[toothNumber]?.toString() || '0'
  }

  // プラークを取得（部位ごと）
  const hasPlaque = (toothNumber: number, area: 'top' | 'right' | 'bottom' | 'left'): boolean => {
    const key = `${toothNumber}_${area}`
    return plaqueData[key] || false
  }

  // BOPを取得
  const hasBOP = (toothNumber: number, position: string): boolean => {
    const key = `${toothNumber}_${position}`
    return bopData[key] || false
  }

  // 欠損歯かどうか
  const isMissing = (toothNumber: number): boolean => {
    return missingTeeth.has(toothNumber)
  }

  // 現在選択中のセルかどうか（測定方式に応じて判定）
  const isCurrentCell = (row: number, toothIndex: number, pointIndex: number): boolean => {
    return (
      currentPosition.row === row &&
      currentPosition.toothIndex === toothIndex &&
      currentPosition.point === pointIndex
    )
  }

  // 歯のビジュアル（PC行 - X字型4分割）
  const renderToothVisual = (toothNumber: number) => {
    if (isMissing(toothNumber)) {
      // 欠損歯: 斜線
      return (
        <div className="w-full h-[63px] bg-gray-200 relative overflow-hidden">
          <svg className="w-full h-full">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="#9CA3AF" strokeWidth="1" />
          </svg>
        </div>
      )
    }

    // 各部位のプラーク状態を取得
    const hasTopPlaque = hasPlaque(toothNumber, 'top')
    const hasRightPlaque = hasPlaque(toothNumber, 'right')
    const hasBottomPlaque = hasPlaque(toothNumber, 'bottom')
    const hasLeftPlaque = hasPlaque(toothNumber, 'left')

    return (
      <div className="w-full h-[63px] relative bg-white">
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* X字の分割線 */}
          <line x1="0" y1="0" x2="100" y2="100" stroke="#9CA3AF" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#9CA3AF" strokeWidth="1" vectorEffect="non-scaling-stroke" />

          {/* 上の三角形 */}
          <polygon
            points="0,0 100,0 50,50"
            fill={hasTopPlaque ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => onPlaqueToggle(toothNumber, 'top')}
          />

          {/* 右の三角形 */}
          <polygon
            points="100,0 100,100 50,50"
            fill={hasRightPlaque ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => onPlaqueToggle(toothNumber, 'right')}
          />

          {/* 下の三角形 */}
          <polygon
            points="100,100 0,100 50,50"
            fill={hasBottomPlaque ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => onPlaqueToggle(toothNumber, 'bottom')}
          />

          {/* 左の三角形 */}
          <polygon
            points="0,100 0,0 50,50"
            fill={hasLeftPlaque ? '#f472b6' : 'transparent'}
            className="cursor-pointer hover:fill-pink-200 transition-colors"
            onClick={() => onPlaqueToggle(toothNumber, 'left')}
          />
        </svg>
      </div>
    )
  }

  // PPD入力セル（1点・4点・6点法に対応）
  const renderPPDCells = (toothNumber: number, side: 'buccal' | 'lingual', isLowerJaw: boolean = false, row: number, toothIdx: number) => {
    // 1点法: 1セルのみ（縦2倍）
    if (measurementType === '1point') {
      const position = side === 'buccal' ? 'b' : 'l'
      const value = getCellValue(toothNumber, position)
      const isSelected = isCurrentCell(row, toothIdx, 0)
      const bop = hasBOP(toothNumber, position)

      if (isMissing(toothNumber)) {
        return (
          <div className="w-full h-12 bg-slate-400"></div>
        )
      }

      // 背景色の優先順位: BOP > 選択中 > デフォルト
      let bgClass = 'bg-white'
      if (bop) {
        bgClass = 'bg-red-300'
      } else if (isSelected) {
        bgClass = 'bg-blue-200'
      }

      const textClass = bop ? 'text-red-900 font-bold' : ''

      return (
        <div
          onClick={() => onCellClick(row, toothIdx, 0)}
          className={`w-full h-12 flex items-center justify-center text-sm cursor-pointer hover:bg-blue-50 ${bgClass} ${textClass}`}
        >
          {value}
        </div>
      )
    }

    // 4点法の場合、舌側は中央のみ
    const is4PointLingual = measurementType === '4point' && side === 'lingual'

    // 測定点の定義（データキー用）
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
      const value = getCellValue(toothNumber, 'l')
      const isSelected = isCurrentCell(row, toothIdx, 1)
      const bop = hasBOP(toothNumber, 'l')

      // 背景色の優先順位: BOP > 選択中 > デフォルト
      let bgClass = 'bg-white'
      if (bop) {
        bgClass = 'bg-red-300'
      } else if (isSelected) {
        bgClass = 'bg-blue-200'
      }

      const textClass = bop ? 'text-red-900 font-bold' : ''

      return (
        <div className="grid grid-cols-3 gap-0 w-full">
          {/* 遠心: グレーアウト */}
          <div className="h-6 bg-gray-200 border-r border-gray-400"></div>

          {/* 中央: 入力可能 */}
          <div
            onClick={() => onCellClick(row, toothIdx, 1)}
            className={`h-6 border-r border-gray-400 flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50 ${bgClass} ${textClass}`}
          >
            {value}
          </div>

          {/* 近心: グレーアウト */}
          <div className="h-6 bg-gray-200"></div>
        </div>
      )
    }

    // 通常の3点表示（6点法）
    return (
      <div className="flex w-full h-[21px]">
        {positions.map((pos, idx) => {
          const value = getCellValue(toothNumber, pos)
          const bop = hasBOP(toothNumber, pos)

          // 右から左の行では、近心(point 2)→中央(point 1)→遠心(point 0)の順に入力
          // セルは 遠心(idx 0)→中央(idx 1)→近心(idx 2)の順に表示
          // よって: idx 0(遠心)→point 0, idx 1(中央)→point 1, idx 2(近心)→point 2
          // でも入力は point 2→1→0 なので、idx 2が最初にハイライトされる
          const pointForCheck = (row === 1 || row === 3) ? idx : idx
          const isSelected = isCurrentCell(row, toothIdx, pointForCheck)

          // 背景色の優先順位: BOP > 選択中 > PPD>=4 > デフォルト
          let bgClass = 'bg-white'
          if (bop) {
            bgClass = 'bg-red-300'
          } else if (isSelected) {
            bgClass = 'bg-blue-200'
          } else if (value && parseInt(value) >= 4) {
            bgClass = 'bg-red-100'
          }

          const textClass = bop ? 'text-red-900 font-bold' : (value && parseInt(value) >= 4 ? 'text-red-700 font-bold' : '')

          return (
            <div
              key={idx}
              onClick={() => onCellClick(row, toothIdx, idx)}
              className={`flex-1 h-full flex items-center justify-center text-xs cursor-pointer hover:bg-blue-50 ${bgClass} ${textClass} ${
                idx < 2 ? 'border-r border-gray-400' : ''
              }`}
            >
              {value}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="bg-white p-1 rounded-lg overflow-auto h-full">
      <table className="border-collapse table-fixed text-sm w-full">
        <colgroup>
          <col className="w-14" />
          {Array(8).fill(0).map((_, i) => <col key={`upper-left-${i}`} className="w-[63px]" />)}
          <col className="w-3" />
          {Array(8).fill(0).map((_, i) => <col key={`upper-right-${i}`} className="w-[63px]" />)}
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
                <div className={`w-full h-[21px] flex items-center justify-center text-xs ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {UPPER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-[21px] flex items-center justify-center text-xs ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
          </tr>

          {/* EPP行 - 1点法は1行、それ以外は2行 */}
          {measurementType === '1point' ? (
            // 1点法: EPP 1行のみ
            <tr>
              <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                EPP
              </td>
              {UPPER_TEETH.slice(0, 8).map((tooth, idx) => (
                <td key={tooth} className="border border-gray-400 p-0 bg-white">
                  {renderPPDCells(tooth, 'buccal', false, 0, idx)}
                </td>
              ))}
              <td className="bg-white w-1"></td>
              {UPPER_TEETH.slice(8).map((tooth, idx) => (
                <td key={tooth} className="border border-gray-400 p-0 bg-white">
                  {renderPPDCells(tooth, 'buccal', false, 0, 8 + idx)}
                </td>
              ))}
            </tr>
          ) : (
            // 4点法・6点法: EPP 2行
            <>
              {/* EPP頬側 (1行目) */}
              <tr>
                <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                  EPP
                </td>
                {UPPER_TEETH.slice(0, 8).map((tooth, idx) => (
                  <td key={tooth} className="border border-gray-400 p-0 bg-white">
                    {renderPPDCells(tooth, 'buccal', false, 0, idx)}
                  </td>
                ))}
                <td className="bg-white w-1"></td>
                {UPPER_TEETH.slice(8).map((tooth, idx) => (
                  <td key={tooth} className="border border-gray-400 p-0 bg-white">
                    {renderPPDCells(tooth, 'buccal', false, 0, 8 + idx)}
                  </td>
                ))}
              </tr>

              {/* EPP舌側 (2行目) - 右から左に入力 */}
              <tr>
                <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                  EPP
                </td>
                {UPPER_TEETH.slice(0, 8).map((tooth, idx) => {
                  // 画面左側: idx=0(歯18)はtoothIndex=0, idx=7(歯11)はtoothIndex=7（右から左の後半）
                  const toothIdx = idx
                  return (
                    <td key={tooth} className="border border-gray-400 p-0 bg-white">
                      {renderPPDCells(tooth, 'lingual', false, 1, toothIdx)}
                    </td>
                  )
                })}
                <td className="bg-white w-1"></td>
                {UPPER_TEETH.slice(8).map((tooth, idx) => {
                  // 画面右側: idx=0(歯21)はtoothIndex=8, idx=7(歯28)はtoothIndex=15（右から左の前半）
                  const toothIdx = 8 + idx
                  return (
                    <td key={tooth} className="border border-gray-400 p-0 bg-white">
                      {renderPPDCells(tooth, 'lingual', false, 1, toothIdx)}
                    </td>
                  )
                })}
              </tr>
            </>
          )}

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

          {/* EPP行 - 1点法は1行、それ以外は2行 */}
          {measurementType === '1point' ? (
            // 1点法: EPP 1行のみ
            <tr>
              <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                EPP
              </td>
              {LOWER_TEETH.slice(0, 8).map((tooth, idx) => (
                <td key={tooth} className="border border-gray-400 p-0 bg-white">
                  {renderPPDCells(tooth, 'buccal', true, 1, idx)}
                </td>
              ))}
              <td className="bg-white w-1"></td>
              {LOWER_TEETH.slice(8).map((tooth, idx) => (
                <td key={tooth} className="border border-gray-400 p-0 bg-white">
                  {renderPPDCells(tooth, 'buccal', true, 1, 8 + idx)}
                </td>
              ))}
            </tr>
          ) : (
            // 4点法・6点法: EPP 2行
            <>
              {/* EPP舌側 (1行目) */}
              <tr>
                <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                  EPP
                </td>
                {LOWER_TEETH.slice(0, 8).map((tooth, idx) => (
                  <td key={tooth} className="border border-gray-400 p-0 bg-white">
                    {renderPPDCells(tooth, 'lingual', true, 2, idx)}
                  </td>
                ))}
                <td className="bg-white w-1"></td>
                {LOWER_TEETH.slice(8).map((tooth, idx) => (
                  <td key={tooth} className="border border-gray-400 p-0 bg-white">
                    {renderPPDCells(tooth, 'lingual', true, 2, 8 + idx)}
                  </td>
                ))}
              </tr>

              {/* EPP頬側 (2行目) - 右から左に入力 */}
              <tr>
                <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
                  EPP
                </td>
                {LOWER_TEETH.slice(0, 8).map((tooth, idx) => {
                  // 画面左側: idx=0(歯48)はtoothIndex=0, idx=7(歯41)はtoothIndex=7（右から左の後半）
                  const toothIdx = idx
                  return (
                    <td key={tooth} className="border border-gray-400 p-0 bg-white">
                      {renderPPDCells(tooth, 'buccal', true, 3, toothIdx)}
                    </td>
                  )
                })}
                <td className="bg-white w-1"></td>
                {LOWER_TEETH.slice(8).map((tooth, idx) => {
                  // 画面右側: idx=0(歯31)はtoothIndex=8, idx=7(歯38)はtoothIndex=15（右から左の前半）
                  const toothIdx = 8 + idx
                  return (
                    <td key={tooth} className="border border-gray-400 p-0 bg-white">
                      {renderPPDCells(tooth, 'buccal', true, 3, toothIdx)}
                    </td>
                  )
                })}
              </tr>
            </>
          )}

          {/* TM行 */}
          <tr>
            <td className="bg-white border border-gray-400 px-2 py-1 text-xs font-medium text-center">
              TM
            </td>
            {LOWER_TEETH.slice(0, 8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-[21px] flex items-center justify-center text-xs ${
                  isMissing(tooth) ? 'bg-gray-200' : 'bg-white hover:bg-blue-50 cursor-pointer'
                }`}>
                  {!isMissing(tooth) && getMobility(tooth)}
                </div>
              </td>
            ))}
            <td className="bg-white w-1"></td>
            {LOWER_TEETH.slice(8).map((tooth) => (
              <td key={tooth} className="border border-gray-400 p-0 bg-white">
                <div className={`w-full h-[21px] flex items-center justify-center text-xs ${
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
