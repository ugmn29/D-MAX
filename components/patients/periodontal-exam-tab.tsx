'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { PeriodontalGrid } from './periodontal-grid'
import { PeriodontalInputPanel } from './periodontal-input-panel'

interface PeriodontalExamTabProps {
  patientId: string
}

// 歯番号（FDI表記）
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// 測定方式
type MeasurementType = '6point' | '4point' | '1point'

// 入力位置
interface InputPosition {
  row: number  // 0=上顎頬側, 1=上顎舌側, 2=下顎舌側, 3=下顎頬側
  toothIndex: number  // 0-15（歯のインデックス）
  point: number  // 0=遠心, 1=中央, 2=近心
}

export function PeriodontalExamTab({ patientId }: PeriodontalExamTabProps) {
  const [measurementType, setMeasurementType] = useState<MeasurementType>('6point')

  // 歯周検査データ
  const [ppdData, setPpdData] = useState<Record<string, number>>({})
  const [mobilityData, setMobilityData] = useState<Record<string, number>>({})
  const [plaqueData, setPlaqueData] = useState<Record<string, boolean>>({})
  const [bopData, setBopData] = useState<Record<string, boolean>>({})
  const [pusData, setPusData] = useState<Record<string, boolean>>({})
  const [missingTeeth, setMissingTeeth] = useState<Set<number>>(new Set()) // 欠損歯

  // 現在の入力位置
  const [currentPos, setCurrentPos] = useState<InputPosition>({
    row: 0,
    toothIndex: 0,
    point: 0,
  })

  // 位置から歯番号とキーを取得
  const getToothAndKey = useCallback((pos: InputPosition): { toothNumber: number; key: string } => {
    const teeth = pos.row < 2 ? UPPER_TEETH : LOWER_TEETH
    const toothNumber = teeth[pos.toothIndex]

    // ポジション名を決定
    let positionName = ''
    if (pos.row === 0) {
      // 上顎頬側
      positionName = ['db', 'b', 'mb'][pos.point]
    } else if (pos.row === 1) {
      // 上顎舌側
      positionName = ['dl', 'l', 'ml'][pos.point]
    } else if (pos.row === 2) {
      // 下顎舌側
      positionName = ['dl', 'l', 'ml'][pos.point]
    } else {
      // 下顎頬側
      positionName = ['db', 'b', 'mb'][pos.point]
    }

    return { toothNumber, key: `${toothNumber}_${positionName}` }
  }, [])

  // 次の位置に移動（ジグザグ入力）
  const moveToNext = useCallback(() => {
    setCurrentPos((prev) => {
      let { row, toothIndex, point } = prev

      // 6点法の場合
      point++
      if (point >= 3) {
        point = 0

        // 次の歯へ
        // 1行目（左→右）: toothIndex 0→15
        // 2行目（右→左）: toothIndex 15→0
        // 3行目（左→右）: toothIndex 0→15
        // 4行目（右→左）: toothIndex 15→0

        if (row === 0) {
          // 1行目: 左→右
          toothIndex++
          if (toothIndex >= 16) {
            toothIndex = 15
            row = 1
          }
        } else if (row === 1) {
          // 2行目: 右→左
          toothIndex--
          if (toothIndex < 0) {
            toothIndex = 0
            row = 2
          }
        } else if (row === 2) {
          // 3行目: 左→右
          toothIndex++
          if (toothIndex >= 16) {
            toothIndex = 15
            row = 3
          }
        } else if (row === 3) {
          // 4行目: 右→左
          toothIndex--
          // 最後まで到達
        }
      }

      // 欠損歯はスキップ
      const { toothNumber } = getToothAndKey({ row, toothIndex, point })
      if (missingTeeth.has(toothNumber)) {
        return moveToNext.call(null, { row, toothIndex, point } as InputPosition)
      }

      return { row, toothIndex, point }
    })
  }, [missingTeeth, getToothAndKey])

  // 数値入力ハンドラ
  const handleNumberInput = useCallback((value: number) => {
    const { key } = getToothAndKey(currentPos)
    setPpdData((prev) => ({ ...prev, [key]: value }))

    // 自動で次へ移動
    moveToNext()
  }, [currentPos, getToothAndKey, moveToNext])

  // 特殊入力ハンドラ
  const handleSpecialInput = useCallback((type: 'bop' | 'pus' | 'skip') => {
    if (type === 'skip') {
      moveToNext()
    } else if (type === 'bop') {
      const { key } = getToothAndKey(currentPos)
      setBopData((prev) => ({ ...prev, [key]: true }))
    } else if (type === 'pus') {
      const { key } = getToothAndKey(currentPos)
      setPusData((prev) => ({ ...prev, [key]: true }))
    }
  }, [currentPos, getToothAndKey, moveToNext])

  // ナビゲーションハンドラ
  const handleNavigate = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    setCurrentPos((prev) => {
      let { row, toothIndex, point } = prev

      if (direction === 'left') {
        point--
        if (point < 0) {
          point = 2
          toothIndex--
          if (toothIndex < 0) toothIndex = 0
        }
      } else if (direction === 'right') {
        point++
        if (point >= 3) {
          point = 0
          toothIndex++
          if (toothIndex >= 16) toothIndex = 15
        }
      } else if (direction === 'up') {
        row--
        if (row < 0) row = 0
      } else if (direction === 'down') {
        row++
        if (row > 3) row = 3
      }

      return { row, toothIndex, point }
    })
  }, [])

  // セルクリックハンドラ
  const handleCellClick = useCallback((row: number, col: number) => {
    // TODO: rowとcolから適切な位置を計算
    setCurrentPos({ row, toothIndex: Math.floor(col / 3), point: col % 3 })
  }, [])

  // 統計計算
  const calculateStats = useCallback(() => {
    const totalTeeth = UPPER_TEETH.length + LOWER_TEETH.length - missingTeeth.size
    const totalPoints = totalTeeth * 6

    // BOP率
    const bopCount = Object.values(bopData).filter(Boolean).length
    const bopRate = totalPoints > 0 ? (bopCount / totalPoints * 100).toFixed(1) : '0.0'

    // PPD≧4mm率
    const deepPocketCount = Object.values(ppdData).filter((v) => v >= 4).length
    const deepPocketRate = totalPoints > 0 ? (deepPocketCount / totalPoints * 100).toFixed(1) : '0.0'

    // PCR率
    const plaqueCount = Object.values(plaqueData).filter(Boolean).length
    const pcrRate = totalTeeth > 0 ? (plaqueCount / totalTeeth * 100).toFixed(1) : '0.0'

    return { pcrRate, bopRate, deepPocketRate }
  }, [ppdData, bopData, plaqueData, missingTeeth])

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">歯周検査</h2>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">前回値コピー</Button>
          <Button variant="outline">設定</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">完了</Button>
        </div>
      </div>

      {/* 測定方式切り替え */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setMeasurementType('6point')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            measurementType === '6point'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          6点法
        </button>
        <button
          onClick={() => setMeasurementType('4point')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            measurementType === '4point'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          4点法
        </button>
        <button
          onClick={() => setMeasurementType('1point')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            measurementType === '1point'
              ? 'border-blue-500 text-blue-600 font-medium'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          1点法
        </button>
      </div>

      {/* メインコンテンツ: 左側グリッド、右側入力パネル */}
      <div className="grid grid-cols-[1fr_auto] gap-6">
        {/* 左側: 歯周検査グリッドと統計 */}
        <div className="space-y-4">
          {/* 歯周検査グリッド */}
          <PeriodontalGrid
            measurementType={measurementType}
            ppdData={ppdData}
            mobilityData={mobilityData}
            plaqueData={plaqueData}
            missingTeeth={missingTeeth}
            currentPosition={{ row: currentPos.row, col: currentPos.toothIndex * 3 + currentPos.point }}
            onCellClick={handleCellClick}
          />

          {/* 統計表示 */}
          <div className="grid grid-cols-3 gap-4 bg-slate-100 p-4 rounded-lg">
            <div className="bg-white rounded border-2 border-slate-300 p-3">
              <div className="text-sm font-bold text-gray-700">PCR値</div>
              <div className="text-3xl font-bold text-gray-900">{stats.pcrRate}%</div>
            </div>
            <div className="bg-white rounded border-2 border-slate-300 p-3">
              <div className="text-sm font-bold text-gray-700">BOP値</div>
              <div className="text-3xl font-bold text-gray-900">{stats.bopRate}%</div>
            </div>
            <div className="bg-white rounded border-2 border-slate-300 p-3">
              <div className="text-sm font-bold text-gray-700">PPD≧4mm</div>
              <div className="text-3xl font-bold text-gray-900">{stats.deepPocketRate}%</div>
            </div>
          </div>
        </div>

        {/* 右側: 入力パネル（テンキー） */}
        <div className="w-[400px]">
          <PeriodontalInputPanel
            onNumberInput={handleNumberInput}
            onSpecialInput={handleSpecialInput}
            onNavigate={handleNavigate}
          />
        </div>
      </div>
    </div>
  )
}
