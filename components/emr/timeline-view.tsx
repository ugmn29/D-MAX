/**
 * カルテタイムライン表示コンポーネント（Dentis風・常時展開型）
 * Timeline View Component for Medical Records (Always Expanded)
 */

'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, Pill, Stethoscope, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { EMRInputModal } from './emr-input-modal'

interface TimelineEntry {
  id: string
  visit_date: string
  visit_type: string
  diseases: Array<{
    disease_code_id: string
    disease_code?: string
    disease_name?: string
    tooth_numbers?: string[]
    onset_date?: string
    is_primary?: boolean
    status?: string
    notes?: string
  }>
  treatments: Array<{
    treatment_code_id: string
    treatment_code?: string
    treatment_name?: string
    tooth_numbers?: string[]
    quantity?: number
    points?: number
    notes?: string
    required_fields?: Record<string, any>
  }>
  prescriptions: Array<{
    medicine_code_id: string
    medicine_name?: string
    quantity?: number
    dosage?: string
    days?: number
    notes?: string
  }>
  subjective: string
  objective: string
  assessment: string
  plan: string
  total_points: number
  created_by_name?: string
  created_at: string
}

interface TimelineViewProps {
  patientId: string
  clinicId: string
  onRecordClick?: (recordId: string) => void
}

export function TimelineView({ patientId, clinicId, onRecordClick }: TimelineViewProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showInputModal, setShowInputModal] = useState(false)

  useEffect(() => {
    loadTimeline()
  }, [patientId])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/timeline`)
      if (response.ok) {
        const data = await response.json()
        console.log('タイムラインデータ:', data)
        setEntries(data)
      }
    } catch (error) {
      console.error('タイムライン読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVisitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: '初診',
      regular: '再診',
      emergency: '緊急',
      home_visit: '訪問診療'
    }
    return labels[type] || type
  }

  const formatToothNumbers = (toothNumbers?: string[]) => {
    if (!toothNumbers || toothNumbers.length === 0) return ''
    return toothNumbers.join(', ')
  }

  const handleSaveNewRecord = async (data: any) => {
    console.log('新規カルテ保存:', data)

    try {
      // clinic_idを追加
      const recordData = {
        ...data,
        clinic_id: clinicId,
      }

      const response = await fetch(`/api/patients/${patientId}/medical-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('保存エラー:', errorData)
        alert('カルテの保存に失敗しました')
        return
      }

      const result = await response.json()
      console.log('保存成功:', result)

      // タイムラインを再読み込み
      await loadTimeline()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('カルテの保存中にエラーが発生しました')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
        読み込み中...
      </div>
    )
  }

  // 同じ日付でグループ化
  const groupedEntries = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.visit_date), 'yyyy-MM-dd')
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(entry)
    return acc
  }, {} as Record<string, TimelineEntry[]>)

  return (
    <div className="space-y-0">
      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>診療記録がありません</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-black">
          {/* 2号用紙ヘッダー */}
          <div className="border-b-2 border-black bg-gray-100 p-2">
            <h2 className="text-center font-bold text-lg">診療録（2号用紙）</h2>
          </div>

          {/* 診療記録一覧（横罫線形式・日付でグループ化） */}
          {Object.entries(groupedEntries).map(([dateKey, dateEntries]) => {
            // 同じ日付の全てのエントリーを統合
            const allDiseases = dateEntries.flatMap(e => e.diseases || [])
            const allTreatments = dateEntries.flatMap(e => e.treatments || [])
            const allPrescriptions = dateEntries.flatMap(e => e.prescriptions || [])
            const totalPoints = dateEntries.reduce((sum, e) => sum + (e.total_points || 0), 0)

            // 最初のエントリーから日付情報を取得
            const firstEntry = dateEntries[0]

            // 病名と処置を組み合わせて行を作成
            // 病名と処置の最大数を取得
            const maxRows = Math.max(allDiseases.length, allTreatments.length, allPrescriptions.length, 1)

            return (
              <div key={dateKey} className="print:break-inside-avoid">
                {/* 各行を表示 */}
                {Array.from({ length: maxRows }).map((_, rowIdx) => {
                  const disease = allDiseases[rowIdx]
                  const treatment = allTreatments[rowIdx]
                  const prescription = allPrescriptions[rowIdx]
                  const isFirstRow = rowIdx === 0
                  const isLastRow = rowIdx === maxRows - 1

                  return (
                    <div key={rowIdx} className="flex border-b border-gray-300">
                      {/* 左側：日付・種別・担当（最初の行のみ） */}
                      <div className="flex-shrink-0 w-32 border-r border-gray-300 p-2">
                        {isFirstRow && (
                          <>
                            <div className="text-sm font-bold">
                              {format(new Date(firstEntry.visit_date), 'M/d(E)', { locale: ja })}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {getVisitTypeLabel(firstEntry.visit_type)}
                            </div>
                          </>
                        )}
                      </div>

                      {/* 病名列 */}
                      <div className="w-64 border-r border-gray-300 p-2">
                        {disease && (
                          <div className="text-sm">
                            <span className="font-medium">
                              {disease.disease_name || disease.disease_code || '病名'}
                            </span>
                            {disease.is_primary && (
                              <span className="ml-1 text-xs text-red-600">(主)</span>
                            )}
                            {disease.tooth_numbers && disease.tooth_numbers.length > 0 && (
                              <span className="ml-2 text-gray-600">
                                {formatToothNumbers(disease.tooth_numbers)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 処置列 */}
                      <div className="flex-1 border-r border-gray-300 p-2">
                        {treatment && (
                          <div className="text-sm">
                            <span className="font-medium">
                              {treatment.treatment_name || treatment.treatment_code || '処置'}
                            </span>
                            {treatment.tooth_numbers && treatment.tooth_numbers.length > 0 && (
                              <span className="ml-2 text-gray-600">
                                {formatToothNumbers(treatment.tooth_numbers)}
                              </span>
                            )}
                            {treatment.quantity && treatment.quantity > 1 && (
                              <span className="ml-2 text-gray-600">
                                ×{treatment.quantity}
                              </span>
                            )}
                          </div>
                        )}
                        {prescription && (
                          <div className="text-sm mt-1">
                            <span className="font-medium">
                              Rx: {prescription.medicine_name || prescription.medicine_code_id}
                            </span>
                            {prescription.dosage && (
                              <span className="ml-2 text-gray-600">
                                {prescription.dosage}
                              </span>
                            )}
                            {prescription.days && (
                              <span className="ml-2 text-gray-600">
                                {prescription.days}日分
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 右側：点数（最初の行のみ） */}
                      <div className="flex-shrink-0 w-20 p-2 text-right">
                        {isFirstRow && totalPoints > 0 && (
                          <div className="text-sm font-semibold">
                            {totalPoints}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* SOAP記録（最後に追加） */}
                {dateEntries.some(e => e.subjective || e.objective || e.assessment || e.plan) && (
                  <div className="flex border-b border-gray-300">
                    <div className="flex-shrink-0 w-32 border-r border-gray-300 p-2"></div>
                    <div className="flex-1 border-r border-gray-300 p-2 col-span-2">
                      {dateEntries.map((entry, entryIdx) => {
                        const entryHasSOAP = entry.subjective || entry.objective || entry.assessment || entry.plan
                        if (!entryHasSOAP) return null

                        return (
                          <div key={entryIdx} className="text-sm space-y-1">
                            {entry.subjective && (
                              <div><span className="font-semibold">S:</span> {entry.subjective}</div>
                            )}
                            {entry.objective && (
                              <div><span className="font-semibold">O:</span> {entry.objective}</div>
                            )}
                            {entry.assessment && (
                              <div><span className="font-semibold">A:</span> {entry.assessment}</div>
                            )}
                            {entry.plan && (
                              <div><span className="font-semibold">P:</span> {entry.plan}</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex-shrink-0 w-20 p-2"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 新規カルテ入力ボタン */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowInputModal(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">新規カルテ入力</span>
        </button>
      </div>

      {/* EMR Input Modal */}
      <EMRInputModal
        isOpen={showInputModal}
        onClose={() => setShowInputModal(false)}
        patientId={patientId}
        clinicId={clinicId}
        onSave={handleSaveNewRecord}
      />
    </div>
  )
}
