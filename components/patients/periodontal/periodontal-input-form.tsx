'use client'

import { useState, useCallback, useEffect } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'
import { Button } from '@/components/ui/button'
import { MeasurementType, ExaminationPhase } from '@/lib/api/periodontal-exams'
import { PeriodontalGrid } from './periodontal-grid'
import { PeriodontalInputPanel } from './periodontal-input-panel'
import { PeriodontalFlowCollapsible } from '../periodontal-flow-collapsible'
import { getTreatmentPlans, type TreatmentPlan } from '@/lib/api/treatment-plans'
import { VoiceInputController } from './voice-input-controller'
import type { InputMode, ParsedVoiceData } from '@/lib/utils/voice-recognition-parser'
import { BulkFillConfirmationDialog } from './bulk-fill-confirmation-dialog'

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
  clinicId: clinicIdProp,
}: PeriodontalInputFormProps) {
  const hookClinicId = useClinicId()
  const clinicId = clinicIdProp || hookClinicId
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

  // 音声入力関連
  const [voiceInputMode, setVoiceInputMode] = useState<InputMode>('ppd')
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [showVoiceInput, setShowVoiceInput] = useState(false)

  // 一括入力関連
  const [bulkFillDialog, setBulkFillDialog] = useState<{
    open: boolean
    type: 'ppd' | 'mobility'
    value: number
  }>({ open: false, type: 'ppd', value: 0 })

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
      const plans = await getTreatmentPlans(clinicId, patientId)
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

  // 次の位置を取得（欠損歯をスキップ）
  const getNextPosition = useCallback((pos: InputPosition): InputPosition => {
    let newPos = pos
    let attempts = 0
    const maxAttempts = 100

    while (attempts < maxAttempts) {
      let { row, toothIndex, point } = newPos

      // 1点法の場合
      if (measurementType === '1point') {
        point = 0
        if (row === 0) {
          toothIndex++
          if (toothIndex >= 16) {
            toothIndex = 15
            row = 1
          }
        } else if (row === 1) {
          toothIndex--
          if (toothIndex < 0) {
            return newPos
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
              return newPos
            }
          }
        }
      }
      // 6点法の場合
      else {
        if (row === 0) {
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
          point++
          if (point >= 3) {
            point = 0
            toothIndex++
            if (toothIndex >= 16) {
              return newPos
            }
          }
        }
      }

      newPos = { row, toothIndex, point }

      const teeth = (measurementType === '1point' && row === 1) || (measurementType !== '1point' && row >= 2)
        ? LOWER_TEETH
        : UPPER_TEETH
      const toothNumber = teeth[toothIndex]

      if (!missingTeeth.has(toothNumber)) {
        return newPos
      }

      attempts++
    }

    return newPos
  }, [measurementType, missingTeeth])

  // 音声認識データ処理 - 瞬時にセルに入力
  const handleVoiceDataParsed = useCallback((data: ParsedVoiceData) => {
    console.log('🎤 音声認識データ受信:', data)
    console.log('  📊 受信した値の数:', data.values.length)
    console.log('  📊 値の詳細:', data.values.map(v => `${v.value}(${v.rawToken})`).join(', '))

    // PPDモードの場合、現在位置から連続で値を適用
    if (data.mode === 'ppd') {
      setCurrentPos(prevPos => {
        let pos = { ...prevPos }
        console.log('📍 現在位置:', pos)

        // 全ての更新をまとめて適用するためのオブジェクト
        const updates: Record<string, number> = {}

        for (const value of data.values) {
          console.log('💫 処理中の値:', value)
          if (typeof value.value === 'number') {
            const { toothNumber, key } = getToothAndKey(pos)
            console.log(`✅ セルに入力: ${key} = ${value.value}`)

            // 更新をまとめる
            updates[key] = value.value as number

            // 次の位置に移動
            pos = getNextPosition(pos)
          }
        }

        // 全ての更新を一度に適用
        if (Object.keys(updates).length > 0) {
          console.log('📦 一括更新:', Object.entries(updates).map(([k, v]) => `${k}=${v}`).join(', '))
          setPpdData(prev => ({ ...prev, ...updates }))
        }

        console.log('📍 新しい位置:', pos)
        return pos
      })
    }
    // BOPモードの場合、指定された歯番号と位置に出血を記録
    else if (data.mode === 'bop') {
      for (const value of data.values) {
        if (value.toothNumber) {
          // 位置が指定されている場合は、その位置のみマーク
          if (value.position) {
            const key = `${value.toothNumber}_${value.position}`
            setBopData(prev => ({ ...prev, [key]: true }))
          }
          // 位置が指定されていない場合(1点法)は、全ての測定位置にマーク
          else {
            const allPositions = ['mb', 'b', 'db', 'ml', 'l', 'dl']
            allPositions.forEach(pos => {
              const key = `${value.toothNumber}_${pos}`
              setBopData(prev => ({ ...prev, [key]: true }))
            })
          }
        }
      }
    }
    // 動揺度モードの場合、歯番号と度数を記録
    else if (data.mode === 'mobility') {
      for (const value of data.values) {
        if (value.toothNumber && typeof value.value === 'number') {
          setMobilityData(prev => ({ ...prev, [value.toothNumber!]: value.value as number }))
        }
      }
    }
  }, [getToothAndKey, getNextPosition])

  // 一括入力: PPD
  const handleBulkFillPpd = useCallback((value: number) => {
    setBulkFillDialog({ open: true, type: 'ppd', value })
  }, [])

  // 一括入力: 動揺度
  const handleBulkFillMobility = useCallback((value: number) => {
    setBulkFillDialog({ open: true, type: 'mobility', value })
  }, [])

  // 一括入力の実行
  const executeBulkFill = useCallback(() => {
    const { type, value } = bulkFillDialog

    if (type === 'ppd') {
      // PPDの一括設定
      const updates: Record<string, number> = {}
      const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH]

      allTeeth.forEach(toothNumber => {
        // 欠損歯はスキップ
        if (missingTeeth.has(toothNumber)) return

        // 測定タイプに応じて測定点を設定
        let points: string[] = []
        if (measurementType === '6point') {
          points = ['mb', 'b', 'db', 'ml', 'l', 'dl']
        } else if (measurementType === '4point') {
          points = ['mb', 'db', 'ml', 'dl']
        } else {
          points = ['b'] // 1point
        }

        points.forEach(point => {
          const key = `${toothNumber}_${point}`
          updates[key] = value
        })
      })

      setPpdData(prev => ({ ...prev, ...updates }))
      console.log(`✅ PPD一括入力完了: ${value}mm を ${Object.keys(updates).length}箇所に設定`)
    } else if (type === 'mobility') {
      // 動揺度の一括設定
      const updates: Record<string, number> = {}
      const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH]

      allTeeth.forEach(toothNumber => {
        // 欠損歯はスキップ
        if (missingTeeth.has(toothNumber)) return
        updates[String(toothNumber)] = value
      })

      setMobilityData(prev => ({ ...prev, ...updates }))
      console.log(`✅ 動揺度一括入力完了: ${value}度 を ${Object.keys(updates).length}本の歯に設定`)
    }

    // ダイアログを閉じる
    setBulkFillDialog({ open: false, type: 'ppd', value: 0 })
  }, [bulkFillDialog, missingTeeth, measurementType])

  // 一括入力の影響を受ける箇所数を計算
  const calculateAffectedCount = useCallback(() => {
    const { type } = bulkFillDialog
    const allTeeth = [...UPPER_TEETH, ...LOWER_TEETH]
    const nonMissingTeeth = allTeeth.filter(tooth => !missingTeeth.has(tooth))

    if (type === 'ppd') {
      let pointsPerTooth = 1
      if (measurementType === '6point') {
        pointsPerTooth = 6
      } else if (measurementType === '4point') {
        pointsPerTooth = 4
      }
      return nonMissingTeeth.length * pointsPerTooth
    } else {
      // 動揺度は歯単位
      return nonMissingTeeth.length
    }
  }, [bulkFillDialog, missingTeeth, measurementType])

  return (
    <div className="space-y-2 p-2 h-[calc(98vh-1rem)] flex flex-col">
      {/* 上部コントロールセクション - コンパクト化 */}
      <div className="flex gap-2 items-start flex-shrink-0">
        {/* 左側: 検査フェーズ */}
        <div className="flex-shrink-0">
          {/* 検査フェーズ選択 */}
          {onPhaseChange && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
              <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                検査フェーズ
              </label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={selectedPhase === 'P_EXAM_1' ? 'default' : 'outline'}
                  onClick={() => onPhaseChange('P_EXAM_1')}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  P検①
                </Button>
                <Button
                  type="button"
                  variant={selectedPhase === 'P_EXAM_2' ? 'default' : 'outline'}
                  onClick={() => onPhaseChange('P_EXAM_2')}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  P検②
                </Button>
                <Button
                  type="button"
                  variant={selectedPhase === 'P_EXAM_3' ? 'default' : 'outline'}
                  onClick={() => onPhaseChange('P_EXAM_3')}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  P検③
                </Button>
                <Button
                  type="button"
                  variant={selectedPhase === 'P_EXAM_4' ? 'default' : 'outline'}
                  onClick={() => onPhaseChange('P_EXAM_4')}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  P検④
                </Button>
                <Button
                  type="button"
                  variant={selectedPhase === 'P_EXAM_5' ? 'default' : 'outline'}
                  onClick={() => onPhaseChange('P_EXAM_5')}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  P検⑤
                </Button>
                <Button
                  type="button"
                  variant={!selectedPhase ? 'default' : 'outline'}
                  onClick={() => onPhaseChange(undefined)}
                  size="sm"
                  className="text-[10px] px-2 py-0.5 h-5"
                >
                  なし
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 右側: 衛生士治療フロー + 音声入力 */}
        <div className="flex-1 flex gap-2">
          {/* 衛生士治療フロー */}
          {patientId && (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-md px-2 py-1 flex flex-col overflow-hidden">
              <h3 className="text-[10px] font-semibold text-gray-700 mb-0.5">衛生士治療フロー</h3>
              <div className="min-w-0 overflow-hidden flex items-center h-5">
                {loadingPlans ? (
                  <div className="flex items-center justify-center w-full">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                  </div>
                ) : treatmentPlans.length > 0 ? (
                  <div className="flex gap-1 items-center overflow-x-auto w-full">
                    {treatmentPlans
                      .filter(p => p.status !== 'completed')
                      .slice(0, 5)
                      .map((plan) => (
                        <div
                          key={plan.id}
                          className="flex items-center gap-1 px-1.5 h-5 bg-blue-100 text-blue-700 border border-blue-300 rounded text-[9px] font-medium whitespace-nowrap flex-shrink-0"
                        >
                          <span>{plan.periodontal_phase_label || plan.periodontal_phase}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 text-center w-full">治療計画なし</p>
                )}
              </div>
            </div>
          )}

          {/* 音声入力トグルと音声入力コントローラー */}
          <div className="flex-1 flex gap-2 items-start">
            {/* 音声入力トグルボタン */}
            <Button
              onClick={() => setShowVoiceInput(!showVoiceInput)}
              variant={showVoiceInput ? 'default' : 'outline'}
              size="sm"
              className="text-xs px-2 flex-shrink-0 h-auto py-1"
            >
              {showVoiceInput ? '🎤 ON' : '🎤 OFF'}
            </Button>

            {/* 音声入力セクション */}
            {showVoiceInput && (
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-md p-1.5 flex items-center">
                <VoiceInputController
                  currentMode={voiceInputMode}
                  onModeChange={setVoiceInputMode}
                  onDataParsed={handleVoiceDataParsed}
                  isActive={isVoiceActive}
                  onActiveChange={setIsVoiceActive}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア - 縦配置 */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
        {/* 歯周検査グリッド */}
        <div className="flex-shrink-0 overflow-auto">
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
        </div>

        {/* 入力パネル */}
        <div className="flex-shrink-0">
          <PeriodontalInputPanel
            onNumberInput={handleNumberInput}
            onSpecialInput={handleSpecialInput}
            onNavigate={handleNavigate}
            bopMode={bopMode}
            pusMode={pusMode}
            onToggleBopMode={toggleBopMode}
            onTogglePusMode={togglePusMode}
            onBulkFillPpd={handleBulkFillPpd}
            onBulkFillMobility={handleBulkFillMobility}
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-between flex-shrink-0 pt-3 border-t">
        <Button variant="outline" onClick={onChangeMethod} size="sm" className="h-8">
          ← 測定方式変更
        </Button>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onCancel} size="sm" className="h-8">
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-8" size="sm">
            保存
          </Button>
        </div>
      </div>

      {/* 一括入力確認ダイアログ */}
      <BulkFillConfirmationDialog
        open={bulkFillDialog.open}
        onOpenChange={(open) => setBulkFillDialog(prev => ({ ...prev, open }))}
        onConfirm={executeBulkFill}
        type={bulkFillDialog.type}
        value={bulkFillDialog.value}
        affectedCount={calculateAffectedCount()}
      />
    </div>
  )
}
