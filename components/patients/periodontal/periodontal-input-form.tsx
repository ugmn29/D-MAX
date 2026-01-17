'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MeasurementType, ExaminationPhase } from '@/lib/api/periodontal-exams'
import { PeriodontalGrid } from './periodontal-grid'
import { PeriodontalInputPanel } from './periodontal-input-panel'
import { PeriodontalFlowCollapsible } from '../periodontal-flow-collapsible'
import { getTreatmentPlans, type TreatmentPlan } from '@/lib/api/treatment-plans'

// 歯番号（FDI表記）
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

// 親知らず（デフォルトで除外する歯）
const WISDOM_TEETH = new Set([18, 28, 38, 48])

// 入力位置
interface InputPosition {
  row: number  // 0=上顎頬側, 1=上顎舌側, 2=下顎舌側, 3=下顎頬側
  toothIndex: number  // 0-15（歯のインデックス）
  point: number  // 0=遠心, 1=中央, 2=近心
}

export interface PeriodontalExamData {
  ppdData: Record<string, number>
  mobilityData: Record<string, number>
  plaqueData: Record<string, boolean>
  bopData: Record<string, boolean>
  pusData: Record<string, boolean>
  missingTeeth: Set<number>
}

interface PeriodontalInputFormProps {
  measurementType: MeasurementType
  initialData?: Partial<PeriodontalExamData>
  onSave: (data: PeriodontalExamData) => void
  onCancel: () => void
  onChangeMethod: () => void
  missingTeeth?: Set<number>
  selectedPhase?: ExaminationPhase
  onPhaseChange?: (phase: ExaminationPhase | undefined) => void
  patientId?: string
  clinicId?: string
}

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export function PeriodontalInputForm({
  measurementType,
  initialData,
  onSave,
  onCancel,
  onChangeMethod,
  missingTeeth: missingTeethFromVisual = new Set(),
  selectedPhase,
  onPhaseChange,
  patientId,
  clinicId,
}: PeriodontalInputFormProps) {
  // 歯周検査データ
  const [ppdData, setPpdData] = useState<Record<string, number>>(initialData?.ppdData || {})
  const [mobilityData, setMobilityData] = useState<Record<string, number>>(initialData?.mobilityData || {})
  const [plaqueData, setPlaqueData] = useState<Record<string, boolean>>(initialData?.plaqueData || {})
  const [bopData, setBopData] = useState<Record<string, boolean>>(initialData?.bopData || {})
  const [pusData, setPusData] = useState<Record<string, boolean>>(initialData?.pusData || {})
  const [missingTeeth, setMissingTeeth] = useState<Set<number>>(() => {
    // 視診データからの欠損歯と初期データを統合
    const combined = new Set(initialData?.missingTeeth || new Set())
    missingTeethFromVisual.forEach(tooth => combined.add(tooth))
    // 親知らずをデフォルトで欠損歯として追加
    WISDOM_TEETH.forEach(tooth => combined.add(tooth))
    return combined
  })

  // 治療計画データ
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)

  // 治療計画を読み込む
  useEffect(() => {
    if (patientId) {
      loadTreatmentPlans()
    }
  }, [patientId])

  const loadTreatmentPlans = async () => {
    if (!patientId) return

    try {
      setLoadingPlans(true)
      const plans = await getTreatmentPlans(clinicId || DEMO_CLINIC_ID, patientId)
      setTreatmentPlans(plans)
    } catch (error) {
      console.error('治療計画の読み込みエラー:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  // プラークデータをトグル
  const togglePlaque = useCallback((toothNumber: number, area: 'top' | 'right' | 'bottom' | 'left') => {
    const key = `${toothNumber}_${area}`
    setPlaqueData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  // 現在の入力位置
  const [currentPos, setCurrentPos] = useState<InputPosition>({
    row: 0,
    toothIndex: 0,
    point: 0,
  })

  // 出血・排膿モード
  const [bopMode, setBopMode] = useState(false)
  const [pusMode, setPusMode] = useState(false)

  // 位置から歯番号とキーを取得
  const getToothAndKey = useCallback((pos: InputPosition): { toothNumber: number; key: string } => {
    // 1点法: row 0=上顎, row 1=下顎
    // 4点法・6点法: row 0,1=上顎, row 2,3=下顎
    const teeth = (measurementType === '1point' && pos.row === 1) || (measurementType !== '1point' && pos.row >= 2)
      ? LOWER_TEETH
      : UPPER_TEETH
    const toothNumber = teeth[pos.toothIndex]

    // ポジション名を決定
    let positionName = ''

    // 1点法の場合
    if (measurementType === '1point') {
      // 1点法は2行のみ: row 0 = 上顎頬側(b), row 1 = 下顎頬側(b)
      positionName = 'b'
    }
    // 4点法・6点法の場合
    else {
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
    }

    return { toothNumber, key: `${toothNumber}_${positionName}` }
  }, [measurementType])

  // 次の位置に移動（ジグザグ入力、測定方式に応じて変化）
  const moveToNext = useCallback(() => {
    setCurrentPos((prev) => {
      let { row, toothIndex, point } = prev

      // 1点法の場合
      if (measurementType === '1point') {
        // 1点法: 各歯1点のみ、pointは常に0
        point = 0

        if (row === 0) {
          // 1行目（上顎）: 左→右 (18→28)
          toothIndex++
          if (toothIndex >= 16) {
            toothIndex = 15  // 下顎の右端（38）から開始
            row = 1
          }
        } else if (row === 1) {
          // 2行目（下顎）: 右→左 (38→31→41→48)
          toothIndex--
          if (toothIndex === 7) {
            // 38-31が終わったら41に移動（skip index 7 here, will be used next iteration）
          }
          // 最後まで到達: toothIndex < 0
        }
      }
      // 4点法の場合
      else if (measurementType === '4point') {
        // 4点法: 頬側3点、舌側1点（中央のみ）
        if (row === 0) {
          // 上顎頬側: 左→右, point 0→1→2
          point++
          if (point >= 3) {
            point = 0
            toothIndex++
            if (toothIndex >= 16) {
              toothIndex = 15
              row = 1
              point = 1 // 舌側は中央のみ
            }
          }
        } else if (row === 1) {
          // 上顎舌側: 右→左, point 1のみ
          point = 1 // 常に中央
          toothIndex--
          if (toothIndex < 0) {
            toothIndex = 0
            row = 2
            point = 1 // 下顎舌側も中央のみ
          }
        } else if (row === 2) {
          // 下顎舌側: 右→左, point 1のみ
          point = 1 // 常に中央
          toothIndex--
          if (toothIndex < 0) {
            toothIndex = 0
            row = 3
            point = 0 // 下顎頬側は左→右なので point=0 から開始
          }
        } else if (row === 3) {
          // 下顎頬側: 左→右, point 0→1→2
          point++
          if (point >= 3) {
            point = 0
            toothIndex++
            // 最後まで到達
          }
        }
      }
      // 6点法の場合
      else {
        // 行ごとに進む方向を決定
        if (row === 0) {
          // 上顎頬側: 左→右, point 0→1→2
          point++
          if (point >= 3) {
            point = 0
            toothIndex++
            if (toothIndex >= 16) {
              toothIndex = 15
              row = 1
              point = 2 // 上顎舌側は右→左なので point=2 から開始
            }
          }
        } else if (row === 1) {
          // 上顎舌側: 右→左, point 2→1→0
          point--
          if (point < 0) {
            point = 2
            toothIndex--
            if (toothIndex < 0) {
              toothIndex = 15
              row = 2
              point = 2 // 下顎舌側は右→左なので point=2 から開始
            }
          }
        } else if (row === 2) {
          // 下顎舌側: 右→左, point 2→1→0
          point--
          if (point < 0) {
            point = 2
            toothIndex--
            if (toothIndex < 0) {
              toothIndex = 0
              row = 3
              point = 0 // 下顎頬側は左→右なので point=0 から開始
            }
          }
        } else if (row === 3) {
          // 下顎頬側: 左→右, point 0→1→2
          point++
          if (point >= 3) {
            point = 0
            toothIndex++
            // 最後まで到達
          }
        }
      }

      return { row, toothIndex, point }
    })
  }, [measurementType])

  // 欠損歯をスキップして次の有効な位置に移動
  const moveToNextValid = useCallback(() => {
    setCurrentPos((prev) => {
      let pos = prev
      let attempts = 0
      const maxAttempts = 100 // 無限ループ防止

      // 欠損歯でない位置が見つかるまでループ
      while (attempts < maxAttempts) {
        // 次の位置を計算
        let { row, toothIndex, point } = pos

        // 1点法の場合
        if (measurementType === '1point') {
          point = 0

          if (row === 0) {
            toothIndex++
            if (toothIndex >= 16) {
              toothIndex = 15  // 下顎の右端（38）から開始
              row = 1
            }
          } else if (row === 1) {
            toothIndex--
            if (toothIndex < 0) {
              // 最後まで到達
              return pos
            }
          }
        }
        // 4点法の場合
        else if (measurementType === '4point') {
          if (row === 0) {
            point++
            if (point >= 3) {
              point = 0
              toothIndex++
              if (toothIndex >= 16) {
                toothIndex = 15
                row = 1
                point = 1
              }
            }
          } else if (row === 1) {
            point = 1
            toothIndex--
            if (toothIndex < 0) {
              toothIndex = 0
              row = 2
              point = 1
            }
          } else if (row === 2) {
            point = 1
            toothIndex--
            if (toothIndex < 0) {
              toothIndex = 0
              row = 3
              point = 0
            }
          } else if (row === 3) {
            point++
            if (point >= 3) {
              point = 0
              toothIndex++
              if (toothIndex >= 16) {
                // 最後まで到達
                return pos
              }
            }
          }
        }
        // 6点法の場合
        else {
          if (row === 0) {
            // 上顎頬側: 左→右
            point++
            if (point >= 3) {
              point = 0
              toothIndex++
              if (toothIndex >= 16) {
                toothIndex = 15
                row = 1
                point = 2
              }
            }
          } else if (row === 1) {
            // 上顎舌側: 右→左
            point--
            if (point < 0) {
              point = 2
              toothIndex--
              if (toothIndex < 0) {
                toothIndex = 15
                row = 2
                point = 2
              }
            }
          } else if (row === 2) {
            // 下顎舌側: 右→左
            point--
            if (point < 0) {
              point = 2
              toothIndex--
              if (toothIndex < 0) {
                toothIndex = 0
                row = 3
                point = 0
              }
            }
          } else if (row === 3) {
            // 下顎頬側: 左→右
            point++
            if (point >= 3) {
              point = 0
              toothIndex++
              if (toothIndex >= 16) {
                // 最後まで到達
                return pos
              }
            }
          }
        }

        pos = { row, toothIndex, point }

        // この位置の歯番号を取得
        // 1点法: row 0=上顎, row 1=下顎
        // 4点法・6点法: row 0,1=上顎, row 2,3=下顎
        const teeth = (measurementType === '1point' && row === 1) || (measurementType !== '1point' && row >= 2)
          ? LOWER_TEETH
          : UPPER_TEETH
        const toothNumber = teeth[toothIndex]

        // 欠損歯でなければこの位置を返す
        if (!missingTeeth.has(toothNumber)) {
          return pos
        }

        attempts++
      }

      // 無限ループ防止で最大試行回数に達した場合
      console.warn('Max attempts reached in moveToNextValid')
      return pos
    })
  }, [missingTeeth, measurementType])

  // 数値入力ハンドラ
  const handleNumberInput = useCallback((value: number) => {
    const { toothNumber, key } = getToothAndKey(currentPos)
    setPpdData((prev) => {
      const newData = { ...prev, [key]: value }
      return newData
    })

    // 欠損歯を自動スキップして次へ移動
    moveToNextValid()
  }, [currentPos, getToothAndKey, moveToNextValid])

  // 出血モードトグル
  const toggleBopMode = useCallback(() => {
    setBopMode((prev) => !prev)
    // 排膿モードを解除
    if (pusMode) setPusMode(false)
  }, [pusMode])

  // 排膿モードトグル
  const togglePusMode = useCallback(() => {
    setPusMode((prev) => !prev)
    // 出血モードを解除
    if (bopMode) setBopMode(false)
  }, [bopMode])

  // 特殊入力ハンドラ（スキップのみ）
  const handleSpecialInput = useCallback((type: 'bop' | 'pus' | 'skip') => {
    if (type === 'skip') {
      moveToNextValid()
    }
  }, [moveToNextValid])

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
  const handleCellClick = useCallback((row: number, toothIndex: number, point: number = 0) => {
    const pos: InputPosition = { row, toothIndex, point }
    const { key } = getToothAndKey(pos)

    // 出血モードまたは排膿モードの場合、対応するデータを記録
    if (bopMode) {
      setBopData((prev) => ({ ...prev, [key]: !prev[key] }))
    } else if (pusMode) {
      setPusData((prev) => ({ ...prev, [key]: !prev[key] }))
    } else {
      // 通常モードの場合は位置を移動
      setCurrentPos(pos)
    }
  }, [bopMode, pusMode, getToothAndKey])

  // 保存ハンドラ
  const handleSave = () => {
    onSave({
      ppdData,
      mobilityData,
      plaqueData,
      bopData,
      pusData,
      missingTeeth,
    })
  }

  return (
    <div className="space-y-4 p-6">
      {/* 検査フェーズ選択と衛生士治療フローを横並び */}
      <div className="flex gap-3">
        {/* 検査フェーズ選択 */}
        {onPhaseChange && (
          <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              検査フェーズ
            </label>
            <div className="grid grid-cols-3 gap-1">
              <Button
                type="button"
                variant={selectedPhase === 'P_EXAM_1' ? 'default' : 'outline'}
                onClick={() => onPhaseChange('P_EXAM_1')}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                P検①
              </Button>
              <Button
                type="button"
                variant={selectedPhase === 'P_EXAM_2' ? 'default' : 'outline'}
                onClick={() => onPhaseChange('P_EXAM_2')}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                P検②
              </Button>
              <Button
                type="button"
                variant={selectedPhase === 'P_EXAM_3' ? 'default' : 'outline'}
                onClick={() => onPhaseChange('P_EXAM_3')}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                P検③
              </Button>
              <Button
                type="button"
                variant={selectedPhase === 'P_EXAM_4' ? 'default' : 'outline'}
                onClick={() => onPhaseChange('P_EXAM_4')}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                P検④
              </Button>
              <Button
                type="button"
                variant={selectedPhase === 'P_EXAM_5' ? 'default' : 'outline'}
                onClick={() => onPhaseChange('P_EXAM_5')}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                P検⑤
              </Button>
              <Button
                type="button"
                variant={!selectedPhase ? 'default' : 'outline'}
                onClick={() => onPhaseChange(undefined)}
                size="sm"
                className="w-full text-xs px-1 py-1 h-7"
              >
                なし
              </Button>
            </div>
          </div>
        )}

        {/* 衛生士治療フロー */}
        {patientId && (
          <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 max-w-xs">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">衛生士治療フロー</h3>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              </div>
            ) : treatmentPlans.length > 0 ? (
              <PeriodontalFlowCollapsible plans={treatmentPlans} />
            ) : (
              <p className="text-xs text-gray-500 text-center py-1">治療計画がありません</p>
            )}
          </div>
        )}
      </div>

      {/* 歯周検査グリッド */}
      <PeriodontalGrid
        measurementType={measurementType}
        ppdData={ppdData}
        mobilityData={mobilityData}
        plaqueData={plaqueData}
        bopData={bopData}
        missingTeeth={missingTeeth}
        currentPosition={{
          row: currentPos.row,
          toothIndex: currentPos.toothIndex,
          point: currentPos.point,
        }}
        onCellClick={handleCellClick}
        onPlaqueToggle={togglePlaque}
      />

      {/* 統計表示は削除 */}

      {/* 入力パネル（テンキー） */}
      <PeriodontalInputPanel
        onNumberInput={handleNumberInput}
        onSpecialInput={handleSpecialInput}
        onNavigate={handleNavigate}
        bopMode={bopMode}
        pusMode={pusMode}
        onToggleBopMode={toggleBopMode}
        onTogglePusMode={togglePusMode}
      />

      {/* ボタン */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onChangeMethod}>
          ← 測定方式変更
        </Button>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
