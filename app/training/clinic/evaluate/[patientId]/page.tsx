'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/database'
import { Training } from '@/types/training'
import { EvaluationInput } from '@/types/evaluation'
import { getPatientById } from '@/lib/api/patients'
import IssueAnalysisModal from '@/components/training/IssueAnalysisModal'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface MenuTraining {
  id: string
  training_id: string
  sort_order: number
  training?: Training
}

interface ActiveMenu {
  id: string
  menu_name: string | null
  menu_trainings: MenuTraining[]
}

interface EvaluationState {
  [training_id: string]: {
    menu_training_id: string
    evaluation_level: 1 | 2 | 3 | null
    comment: string
  }
}

export default function EvaluatePage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      // 患者情報を取得
      const patientData = await getPatientById(DEMO_CLINIC_ID, patientId)
      setPatient(patientData)

      // アクティブなメニューを取得
      const { data: menuData, error } = await supabase
        .from('training_menus')
        .select(`
          *,
          menu_trainings(
            *,
            training:trainings(*)
          )
        `)
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('メニュー取得エラー:', error)
      } else if (menuData) {
        const sortedMenuTrainings = (menuData.menu_trainings || []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        )
        setActiveMenu({
          ...menuData,
          menu_trainings: sortedMenuTrainings,
        })

        // 評価状態を初期化
        const initialEvaluations: EvaluationState = {}
        sortedMenuTrainings.forEach((mt: MenuTraining) => {
          initialEvaluations[mt.training_id] = {
            menu_training_id: mt.id,
            evaluation_level: null,
            comment: '',
          }
        })
        setEvaluations(initialEvaluations)
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEvaluationChange = (
    training_id: string,
    level: 1 | 2 | 3
  ) => {
    setEvaluations((prev) => ({
      ...prev,
      [training_id]: {
        ...prev[training_id],
        evaluation_level: level,
      },
    }))
  }

  const handleCommentChange = (training_id: string, comment: string) => {
    setEvaluations((prev) => ({
      ...prev,
      [training_id]: {
        ...prev[training_id],
        comment,
      },
    }))
  }

  const handleSave = async () => {
    if (!activeMenu || !patient) return

    // 評価レベルが設定されているものだけを抽出
    const evaluationInputs: EvaluationInput[] = Object.entries(evaluations)
      .filter(([_, ev]) => ev.evaluation_level !== null)
      .map(([training_id, ev]) => ({
        training_id,
        menu_training_id: ev.menu_training_id,
        evaluation_level: ev.evaluation_level!,
        comment: ev.comment || undefined,
      }))

    if (evaluationInputs.length === 0) {
      alert('少なくとも1つのトレーニングを評価してください')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/training/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          clinic_id: DEMO_CLINIC_ID,
          menu_id: activeMenu.id,
          evaluations: evaluationInputs,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setAnalysisResult(result.data)
        setShowIssueModal(true)
      } else {
        alert(result.error || '評価の保存に失敗しました')
      }
    } catch (error) {
      console.error('評価保存エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">患者が見つかりません</div>
      </div>
    )
  }

  if (!activeMenu) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <button
              onClick={() => router.push(`/training/clinic/patient/${patientId}`)}
              className="text-blue-600 hover:text-blue-700 mb-2"
            >
              ← 戻る
            </button>
            <h1 className="text-2xl font-bold text-gray-900">来院時評価</h1>
            <p className="text-sm text-gray-500 mt-1">
              {patient.last_name} {patient.first_name}さん
            </p>
          </div>
        </header>
        <div className="px-6 py-8 text-center">
          <p className="text-gray-600 mb-4">
            処方されているトレーニングがありません
          </p>
          <p className="text-sm text-gray-500 mb-4">
            トレーニング管理タブから処方を行ってください
          </p>
          <button
            onClick={() => router.push(`/training/clinic/patient/${patientId}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            患者詳細に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push(`/training/clinic/patient/${patientId}`)}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">来院時評価</h1>
              <p className="text-sm text-gray-500 mt-1">
                {patient.last_name} {patient.first_name}さん | 評価日:{' '}
                {new Date().toLocaleDateString('ja-JP')}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '評価を保存して課題を分析'}
            </button>
          </div>
        </div>
      </header>

      {/* メニュー情報 */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">現在のメニュー:</span>{' '}
          {activeMenu.menu_name || '処方メニュー'}
        </p>
      </div>

      {/* 評価フォーム */}
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="space-y-6">
          {activeMenu.menu_trainings.map((mt, index) => {
            const training = mt.training
            if (!training) return null

            const evaluation = evaluations[training.id]

            return (
              <div
                key={mt.id}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {training.training_name}
                    </h3>
                    {training.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {training.description}
                      </p>
                    )}

                    {/* 評価基準 */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-xs font-bold text-gray-700 mb-2">
                        評価基準
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 font-semibold">❌ レベル1:</span>
                          <span className="text-gray-700">
                            {training.evaluation_level_1_criteria ||
                              training.evaluation_level_1_label ||
                              'できなかった'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-600 font-semibold">⚠️ レベル2:</span>
                          <span className="text-gray-700">
                            {training.evaluation_level_2_criteria ||
                              training.evaluation_level_2_label ||
                              'まあまあできた'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-semibold">✅ レベル3:</span>
                          <span className="text-gray-700">
                            {training.evaluation_level_3_criteria ||
                              training.evaluation_level_3_label ||
                              'できた'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 評価ボタン */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        評価
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEvaluationChange(training.id, 1)}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                            evaluation?.evaluation_level === 1
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                          }`}
                        >
                          <div className="text-lg">❌</div>
                          <div className="text-sm font-medium mt-1">
                            {training.evaluation_level_1_label || 'できなかった'}
                          </div>
                        </button>
                        <button
                          onClick={() => handleEvaluationChange(training.id, 2)}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                            evaluation?.evaluation_level === 2
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300'
                          }`}
                        >
                          <div className="text-lg">⚠️</div>
                          <div className="text-sm font-medium mt-1">
                            {training.evaluation_level_2_label || 'まあまあできた'}
                          </div>
                        </button>
                        <button
                          onClick={() => handleEvaluationChange(training.id, 3)}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                            evaluation?.evaluation_level === 3
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                          }`}
                        >
                          <div className="text-lg">✅</div>
                          <div className="text-sm font-medium mt-1">
                            {training.evaluation_level_3_label || 'できた'}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* コメント */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        コメント（任意）
                      </label>
                      <textarea
                        value={evaluation?.comment || ''}
                        onChange={(e) =>
                          handleCommentChange(training.id, e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="特記事項があれば記入してください"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 保存ボタン（下部） */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? '保存中...' : '評価を保存して課題を分析'}
          </button>
        </div>
      </div>

      {/* 課題分析モーダル */}
      {showIssueModal && analysisResult && (
        <IssueAnalysisModal
          patientId={patientId}
          clinicId={DEMO_CLINIC_ID}
          analysisResult={analysisResult}
          onClose={() => {
            setShowIssueModal(false)
            router.push(`/training/clinic/patient/${patientId}`)
          }}
        />
      )}
    </div>
  )
}
