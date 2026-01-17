'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertCircle } from 'lucide-react'
import { TreatmentPlanSplitDialog } from './treatment-plan-split-dialog'
import type { TreatmentPlanProposal } from '@/lib/utils/treatment-plan-generator'

interface TreatmentPlanPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  proposals: TreatmentPlanProposal[]
  onConfirm: (confirmedProposals: TreatmentPlanProposal[], restorationChoices: Record<number, string>, memoInputs: Record<number, string>) => void
  onRestorationSelect?: (toothNumbers: number[], selectedOption: string, selectedLabel: string) => void
  visualExamDate?: string
}

// 歯番号をPalmer記法に変換
const formatToothToPalmer = (toothNumber: number): string => {
  const str = toothNumber.toString()
  if (str.length < 2) return str
  const quadrant = str.charAt(0)
  const toothNum = str.slice(-1)
  switch (quadrant) {
    case '1': return `${toothNum}⏌`
    case '2': return `⎿${toothNum}`
    case '3': return `⎾${toothNum}`
    case '4': return `${toothNum}⏋`
    default: return str
  }
}

export function TreatmentPlanPreviewModal({
  isOpen,
  onClose,
  proposals: initialProposals,
  onConfirm,
  onRestorationSelect,
  visualExamDate,
}: TreatmentPlanPreviewModalProps) {
  console.log('TreatmentPlanPreviewModal received props:', {
    isOpen,
    initialProposals,
    proposalsLength: initialProposals.length
  })

  // 編集可能な提案リスト
  const [proposals, setProposals] = useState<TreatmentPlanProposal[]>(initialProposals)

  // 欠損歯の治療方法選択（提案のインデックス -> 選択された治療方法）
  const [restorationChoices, setRestorationChoices] = useState<Record<number, string>>({})

  // 分割モーダルの状態
  const [splitModalOpen, setSplitModalOpen] = useState(false)
  const [splittingProposalIndex, setSplittingProposalIndex] = useState<number | null>(null)

  // メモ入力（提案のインデックス -> メモ内容）
  const [memoInputs, setMemoInputs] = useState<Record<number, string>>({})

  // propsが変更されたら内部stateを更新
  useEffect(() => {
    console.log('useEffect: initialProposals changed, length =', initialProposals.length)
    setProposals(initialProposals)
    setRestorationChoices({}) // 選択もリセット
    setMemoInputs({}) // メモもリセット
  }, [initialProposals])

  // 提案を削除
  const handleRemove = (index: number) => {
    setProposals(prev => prev.filter((_, i) => i !== index))
  }

  // 欠損歯の治療方法を選択
  const handleRestorationChoice = (proposalIndex: number, value: string, label: string) => {
    setRestorationChoices(prev => ({
      ...prev,
      [proposalIndex]: value,
    }))

    // コールバックが設定されている場合、メモ追記用に呼び出す
    if (onRestorationSelect) {
      const proposal = proposals[proposalIndex]
      if (proposal && proposal.restoration_options) {
        // 選択されたラベル（経過観察の場合は短縮形）
        const displayLabel = value === 'observe' ? '経過観察' : label
        onRestorationSelect(proposal.tooth_numbers, value, displayLabel)
      }
    }
  }

  // メモ入力を更新
  const handleMemoChange = (proposalIndex: number, value: string) => {
    setMemoInputs(prev => ({
      ...prev,
      [proposalIndex]: value,
    }))
  }

  // 対象歯クリックで分割ダイアログを開く
  const handleToothNumbersClick = (index: number) => {
    const proposal = proposals[index]
    // 対象歯が2本以上ある場合のみ分割可能
    if (proposal.tooth_numbers.length < 2) {
      return // 1本のみの場合は何もしない
    }
    setSplittingProposalIndex(index)
    setSplitModalOpen(true)
  }

  // 分割確定
  const handleConfirmSplit = (selectedTeeth: number[]) => {
    if (splittingProposalIndex === null) return

    const originalProposal = proposals[splittingProposalIndex]
    const remainingTeeth = originalProposal.tooth_numbers.filter(
      tooth => !selectedTeeth.includes(tooth)
    )

    if (remainingTeeth.length === 0) {
      alert('元の計画に歯が残りません。全ての歯を選択しないでください')
      return
    }

    // 元の計画の対象歯を更新
    const updatedProposals = [...proposals]
    updatedProposals[splittingProposalIndex] = {
      ...originalProposal,
      tooth_numbers: remainingTeeth
    }

    // 新しい計画を追加
    const newProposal: TreatmentPlanProposal = {
      ...originalProposal,
      tooth_numbers: selectedTeeth
    }

    updatedProposals.splice(splittingProposalIndex + 1, 0, newProposal)

    setProposals(updatedProposals)
    setSplitModalOpen(false)
    setSplittingProposalIndex(null)
  }

  // 確定
  const handleConfirm = () => {
    // 欠損歯の提案で治療方法が未選択のものがないかチェック
    const missingChoices = proposals
      .map((p, index) => ({ proposal: p, index }))
      .filter(({ proposal, index }) =>
        proposal.restoration_options && !restorationChoices[index]
      )

    if (missingChoices.length > 0) {
      alert('欠損歯の治療方法を選択してください')
      return
    }

    onConfirm(proposals, restorationChoices, memoInputs)
  }

  // 優先度のバッジ色
  const getPriorityBadge = (priority: 1 | 2 | 3) => {
    switch (priority) {
      case 1:
        return <Badge className="bg-red-500">高</Badge>
      case 2:
        return <Badge className="bg-yellow-500">中</Badge>
      case 3:
        return <Badge className="bg-gray-400">低</Badge>
    }
  }


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" className="max-w-4xl">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">治療計画プレビュー</h2>
          {visualExamDate && (
            <p className="text-sm text-gray-600 mt-1">
              視診データ（{new Date(visualExamDate).toLocaleDateString('ja-JP')}）から生成
            </p>
          )}
        </div>

        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p>治療計画の提案がありません</p>
            <p className="text-sm mt-1">視診データにう蝕や欠損が見つかりませんでした</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {proposals.map((proposal, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* ヘッダー行 */}
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(proposal.priority)}
                      <span className="font-medium text-gray-900">
                        {proposal.treatment_content}
                      </span>
                    </div>

                    {/* 対象歯 */}
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">対象歯:</span>{' '}
                      {proposal.tooth_numbers.length >= 2 ? (
                        <button
                          onClick={() => handleToothNumbersClick(index)}
                          className="inline-flex flex-wrap gap-1 items-center cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors"
                          title="クリックして分割"
                        >
                          {proposal.tooth_numbers.map((tooth, i) => (
                            <span
                              key={tooth}
                              className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200"
                            >
                              {tooth}
                            </span>
                          ))}
                          <span className="text-xs text-gray-400 ml-1">（クリックで分割）</span>
                        </button>
                      ) : (
                        <span>{proposal.tooth_numbers.join(', ')}番</span>
                      )}
                      {proposal.tooth_position && ` (${proposal.tooth_position})`}
                    </div>

                    {/* 備考 */}
                    {proposal.notes && (
                      <div className="text-sm text-gray-500">
                        {proposal.notes}
                      </div>
                    )}

                    {/* 欠損歯の治療方法選択 */}
                    {proposal.restoration_options && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          治療方法を選択してください
                        </div>
                        <div className="space-y-2">
                          {proposal.restoration_options.map(option => (
                            <label
                              key={option.value}
                              className="flex items-start space-x-3 cursor-pointer"
                            >
                              <input
                                type="radio"
                                name={`restoration-${index}`}
                                value={option.value}
                                checked={restorationChoices[index] === option.value}
                                onChange={() => handleRestorationChoice(index, option.value, option.label)}
                                className="mt-1"
                              />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {option.label}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {option.description}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* メモ入力欄（allow_memoがtrueの場合） */}
                    {proposal.allow_memo && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          メモ（任意）
                        </label>
                        <textarea
                          value={memoInputs[index] || ''}
                          onChange={(e) => handleMemoChange(index, e.target.value)}
                          placeholder="メモを入力（例：根管治療後に抜歯予定、患者への説明済み等）"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    )}
                  </div>

                  {/* ボタン群 */}
                  <div className="ml-3 flex items-center space-x-1">
                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleRemove(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {proposals.length > 0 && `${proposals.length}件の治療計画を登録します`}
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={proposals.length === 0}
            >
              一括登録
            </Button>
          </div>
        </div>
      </div>

      {/* 分割用ダイアログ */}
      {splittingProposalIndex !== null && (
        <TreatmentPlanSplitDialog
          isOpen={splitModalOpen}
          onClose={() => {
            setSplitModalOpen(false)
            setSplittingProposalIndex(null)
          }}
          onConfirm={handleConfirmSplit}
          treatmentContent={proposals[splittingProposalIndex]?.treatment_content || ''}
          availableTeeth={proposals[splittingProposalIndex]?.tooth_numbers || []}
        />
      )}
    </Modal>
  )
}
