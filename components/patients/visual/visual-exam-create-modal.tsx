'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { DentalChart } from './dental-chart'
import { VisualInputPanel } from './visual-input-panel'
import type { VisualToothData, ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

// 永久歯の歯番号（32本）
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

// 乳歯の歯番号（20本）- FDI方式
const DECIDUOUS_TEETH = [
  55, 54, 53, 52, 51,  // 上顎右
  61, 62, 63, 64, 65,  // 上顎左
  85, 84, 83, 82, 81,  // 下顎左
  71, 72, 73, 74, 75,  // 下顎右
]

// 全ての歯番号（永久歯 + 乳歯）
const ALL_TEETH = [...PERMANENT_TEETH, ...DECIDUOUS_TEETH]

// 永久歯の入力順序（左から右へジグザグ：上顎右→上顎左→下顎左→下顎右）
const PERMANENT_INPUT_ORDER = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48,
]

// 乳歯の入力順序（上顎右→上顎左→下顎左→下顎右）
const DECIDUOUS_INPUT_ORDER = [
  55, 54, 53, 52, 51, 61, 62, 63, 64, 65,
  75, 74, 73, 72, 71, 81, 82, 83, 84, 85,
]

// FDI歯番号を表示用文字列に変換
const toothNumberToDisplay = (toothNumber: number): string => {
  // 乳歯のマッピング
  const deciduousMap: Record<number, string> = {
    55: 'E', 54: 'D', 53: 'C', 52: 'B', 51: 'A',
    61: 'A', 62: 'B', 63: 'C', 64: 'D', 65: 'E',
    85: 'E', 84: 'D', 83: 'C', 82: 'B', 81: 'A',
    71: 'A', 72: 'B', 73: 'C', 74: 'D', 75: 'E',
  }

  if (deciduousMap[toothNumber]) {
    return deciduousMap[toothNumber]
  }

  // 永久歯は末尾の数字のみ表示（例: 18 → 8, 21 → 1）
  return String(toothNumber % 10)
}

// 歯が永久歯かどうかを判定
const isPermanentTooth = (toothNumber: number): boolean => {
  return PERMANENT_TEETH.includes(toothNumber)
}

// 歯が乳歯かどうかを判定
const isDeciduousTooth = (toothNumber: number): boolean => {
  return DECIDUOUS_TEETH.includes(toothNumber)
}

interface VisualExamCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (toothData: VisualToothData[]) => void
  initialData?: VisualToothData[]
  patientAge?: number | null
}

export function VisualExamCreateModal({ isOpen, onClose, onSave, initialData, patientAge }: VisualExamCreateModalProps) {
  // 年齢に応じた初期状態を決定する関数
  const getInitialToothStatus = (toothNumber: number, age: number | null): ToothStatus => {
    if (age === null) return 'healthy' // 年齢不明の場合は全て健全

    const isPermanent = isPermanentTooth(toothNumber)
    const isDeciduous = isDeciduousTooth(toothNumber)

    if (age < 6) {
      // 6歳未満：乳歯のみ健全、永久歯は未萌出
      return isDeciduous ? 'healthy' : 'unerupted'
    } else if (age <= 15) {
      // 6〜15歳：乳歯と永久歯の両方が健全
      return 'healthy'
    } else {
      // 15歳以上：永久歯のみ健全、乳歯は「なし」（正常に交換済み）
      return isPermanent ? 'healthy' : 'none'
    }
  }

  // 歯牙データ（歯番号をキーとするマップ）
  const [toothDataMap, setToothDataMap] = useState<Record<number, VisualToothData>>(() => {
    // 初期値：年齢に応じた状態で初期化
    const map: Record<number, VisualToothData> = {}
    ALL_TEETH.forEach(toothNumber => {
      map[toothNumber] = {
        tooth_number: toothNumber,
        status: getInitialToothStatus(toothNumber, patientAge ?? null),
      }
    })
    return map
  })

  // 選択中の歯
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set())

  // initialDataまたはpatientAgeが変更されたときにtoothDataMapを更新
  useEffect(() => {
    console.log('VisualExamCreateModal useEffect:', { initialData: !!initialData, patientAge, isOpen })

    if (initialData && initialData.length > 0) {
      // 編集モード：initialDataをそのまま使用
      console.log('編集モード: initialDataを使用')
      const map: Record<number, VisualToothData> = {}
      initialData.forEach(tooth => {
        map[tooth.tooth_number] = tooth
      })
      setToothDataMap(map)
    } else if (!initialData && isOpen) {
      // 新規作成モード：年齢に応じて初期化
      console.log('新規作成モード: patientAge =', patientAge)
      const map: Record<number, VisualToothData> = {}
      ALL_TEETH.forEach(toothNumber => {
        const status = getInitialToothStatus(toothNumber, patientAge ?? null)
        map[toothNumber] = {
          tooth_number: toothNumber,
          status,
        }
      })
      console.log('初期化されたデータ例（歯番号55）:', map[55])
      console.log('初期化されたデータ例（歯番号18）:', map[18])
      setToothDataMap(map)
    }
  }, [initialData, patientAge, isOpen])

  // 歯をクリック
  const handleToothClick = (toothNumber: number) => {
    // 単一セル選択のみ: 同じセルをクリックした場合は選択解除、違うセルは新規選択
    if (selectedTeeth.has(toothNumber) && selectedTeeth.size === 1) {
      setSelectedTeeth(new Set())
    } else {
      setSelectedTeeth(new Set([toothNumber]))
    }
  }

  // 状態を適用
  const handleApplyStatus = (
    status: ToothStatus,
    cariesLevel?: CariesLevel,
    restorationType?: RestorationType,
    materialType?: MaterialType
  ) => {
    if (selectedTeeth.size === 0) return

    const newToothDataMap = { ...toothDataMap }

    // 選択中の歯が永久歯か乳歯かを判定
    let isPermanent = false
    let isDeciduous = false
    let maxPermanentIndex = -1
    let maxDeciduousIndex = -1

    selectedTeeth.forEach(toothNumber => {
      // 永久歯の場合
      const permanentIndex = PERMANENT_INPUT_ORDER.indexOf(toothNumber)
      if (permanentIndex !== -1) {
        isPermanent = true
        if (permanentIndex > maxPermanentIndex) {
          maxPermanentIndex = permanentIndex
        }
      }

      // 乳歯の場合
      const deciduousIndex = DECIDUOUS_INPUT_ORDER.indexOf(toothNumber)
      if (deciduousIndex !== -1) {
        isDeciduous = true
        if (deciduousIndex > maxDeciduousIndex) {
          maxDeciduousIndex = deciduousIndex
        }
      }

      // データ更新
      newToothDataMap[toothNumber] = {
        ...newToothDataMap[toothNumber],
        status,
        caries_level: status === 'caries' ? cariesLevel : undefined,
        restoration_type: status === 'restoration' ? restorationType : undefined,
        material_type: status === 'restoration' ? materialType : undefined,
      }
    })

    setToothDataMap(newToothDataMap)

    // 次の歯を自動選択
    // 永久歯と乳歯が混在している場合は、最後に選択した方のモードで続行
    if (isPermanent && isDeciduous) {
      // 最後に選択した歯を判定
      const lastSelectedTooth = Array.from(selectedTeeth).pop()
      if (lastSelectedTooth && isPermanentTooth(lastSelectedTooth)) {
        isPermanent = true
        isDeciduous = false
      } else {
        isPermanent = false
        isDeciduous = true
      }
    }

    if (isPermanent) {
      // 永久歯モード
      const nextIndex = maxPermanentIndex + 1
      if (nextIndex < PERMANENT_INPUT_ORDER.length) {
        const nextTooth = PERMANENT_INPUT_ORDER[nextIndex]
        setSelectedTeeth(new Set([nextTooth]))
      } else {
        setSelectedTeeth(new Set())
      }
    } else if (isDeciduous) {
      // 乳歯モード
      const nextIndex = maxDeciduousIndex + 1
      if (nextIndex < DECIDUOUS_INPUT_ORDER.length) {
        const nextTooth = DECIDUOUS_INPUT_ORDER[nextIndex]
        setSelectedTeeth(new Set([nextTooth]))
      } else {
        setSelectedTeeth(new Set())
      }
    }
  }

  // 選択解除
  const handleClearSelection = () => {
    setSelectedTeeth(new Set())
  }

  // 保存
  const handleSave = () => {
    // 全ての歯データを保存（健全も含む）
    const toothDataArray = ALL_TEETH.map(toothNumber => toothDataMap[toothNumber])
    onSave(toothDataArray)
    handleClose()
  }

  // キャンセル
  const handleClose = () => {
    // 状態をリセット
    setSelectedTeeth(new Set())
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="large" className="max-w-[98vw] h-[92vh]">
      <div className="h-full flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-5 pb-20 space-y-4">
          {/* 歯列図 */}
          <DentalChart
            toothData={toothDataMap}
            selectedTeeth={selectedTeeth}
            onToothClick={handleToothClick}
          />

          {/* 入力パネル */}
          <VisualInputPanel
            selectedTeeth={selectedTeeth}
            onApplyStatus={handleApplyStatus}
            onClearSelection={handleClearSelection}
          />
        </div>

        {/* ボタン（右下端に絶対配置） */}
        <div className="absolute bottom-0 right-0 flex items-center justify-end space-x-3 p-4 bg-white">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            保存
          </Button>
        </div>
      </div>
    </Modal>
  )
}
