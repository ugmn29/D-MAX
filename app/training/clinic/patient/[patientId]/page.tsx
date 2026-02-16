'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Patient } from '@/types/database'
import { getPatientById } from '@/lib/api/patients'
import TrainingFlowChart from '@/components/training/TrainingFlowChart'
import TrainingProgressChart from '@/components/training/TrainingProgressChart'
import PatientIssuesTab from '@/components/training/PatientIssuesTab'
import VisitEvaluationTab from '@/components/training/VisitEvaluationTab'
import { Dumbbell, TrendingUp, AlertTriangle, ClipboardCheck } from 'lucide-react'
import { useClinicId } from '@/hooks/use-clinic-id'

interface Training {
  id: string
  training_name: string
  description: string
  category: string
  instructions?: string[]
  precautions?: string[]
}

interface MenuTraining {
  id: string
  sort_order: number
  action_seconds: number
  rest_seconds: number
  sets: number
  auto_progress: boolean
  training?: Training
}

interface TrainingMenu {
  id: string
  menu_name: string
  prescribed_at: string
  is_active: boolean
  menu_trainings?: MenuTraining[]
}

interface TrainingRecord {
  id: string
  training_id: string
  performed_at: string
  completed: boolean
  interrupted: boolean
  time_of_day: string
  actual_duration_seconds: number
  training?: Training
}

export default function PatientDetailPage() {
  const clinicId = useClinicId()
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [activeMenu, setActiveMenu] = useState<TrainingMenu | null>(null)
  const [menuHistory, setMenuHistory] = useState<TrainingMenu[]>([])
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'visit-evaluation' | 'training' | 'progress' | 'issues'>('visit-evaluation')
  const [showResetModal, setShowResetModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [patientId])

  const handleResetPassword = async () => {
    if (!confirm('このパスワードをリセットしますか？\nリセット後は生年月日でログインできるようになります。')) {
      return
    }

    try {
      const response = await fetch('/api/training/patient/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      })

      const data = await response.json()

      if (response.ok) {
        alert('パスワードをリセットしました。\n患者さんは生年月日でログインできます。')
        setShowResetModal(false)
        loadData() // 患者情報を再読み込み
      } else {
        alert(data.error || 'パスワードのリセットに失敗しました')
      }
    } catch (error) {
      console.error('パスワードリセットエラー:', error)
      alert('エラーが発生しました')
    }
  }

  const loadData = async () => {
    try {
      // 患者情報を取得
      const patientData = await getPatientById(clinicId, patientId)
      setPatient(patientData)

      // UUID形式かチェック
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)

      if (!isUUID) {
        // モックモード: localStorageから取得
        console.log('モックモード: localStorageからトレーニングメニューを取得')
        const mockMenus = JSON.parse(localStorage.getItem('mock_training_menus') || '[]')
        const mockMenuTrainings = JSON.parse(localStorage.getItem('mock_menu_trainings') || '[]')
        const mockRecords = JSON.parse(localStorage.getItem('mock_training_records') || '[]')

        // トレーニング情報をAPI経由で取得
        const trainingsResponse = await fetch(`/api/training/clinic/patient-data?patientId=${patientId}&type=trainings-data`)
        const trainingsResult = await trainingsResponse.json()
        const trainingsData = trainingsResult.data || []

        const patientActiveMenu = mockMenus.find((m: any) => m.patient_id === patientId && m.is_active)

        if (patientActiveMenu) {
          const menuTrainingsWithDetails = mockMenuTrainings
            .filter((mt: any) => mt.menu_id === patientActiveMenu.id)
            .map((mt: any) => ({
              ...mt,
              training: trainingsData.find((t: any) => t.id === mt.training_id)
            }))
            .sort((a: any, b: any) => a.sort_order - b.sort_order)

          setActiveMenu({
            ...patientActiveMenu,
            menu_trainings: menuTrainingsWithDetails
          })
        }

        // トレーニング実施記録を取得（モックモード）
        const patientRecords = mockRecords
          .filter((r: any) => r.patient_id === patientId)
          .map((r: any) => ({
            ...r,
            training: trainingsData.find((t: any) => t.id === r.training_id)
          }))
          .sort((a: any, b: any) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())

        setTrainingRecords(patientRecords)
      } else {
        // データベースモード - アクティブなメニューを取得
        const menuResponse = await fetch(`/api/training/clinic/patient-data?patientId=${patientId}&type=active-menu`)
        const menuResult = await menuResponse.json()

        if (menuResponse.ok && menuResult.data) {
          setActiveMenu(menuResult.data)
        }

        // メニュー履歴を取得（過去の非アクティブなメニュー）
        const historyResponse = await fetch(`/api/training/clinic/patient-data?patientId=${patientId}&type=menu-history`)
        const historyResult = await historyResponse.json()

        if (historyResponse.ok && historyResult.data) {
          setMenuHistory(historyResult.data)
        }

        // トレーニング実施記録を取得（データベースモード）
        const recordsResponse = await fetch(`/api/training/clinic/patient-data?patientId=${patientId}&type=training-records&limit=50`)
        const recordsResult = await recordsResponse.json()

        if (recordsResponse.ok && recordsResult.data) {
          setTrainingRecords(recordsResult.data)
        }
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ヘッダー - 固定 */}
      <header className="bg-white shadow-sm flex-shrink-0">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic/patients')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.last_name} {patient.first_name}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">
                  患者番号: {patient.patient_number}
                </p>
                {(patient as any).password_set && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    パスワード設定済み
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              {(patient as any).password_set && (
                <button
                  onClick={() => setShowResetModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  パスワードリセット
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* タブナビゲーション - 固定 */}
      <div className="bg-gray-50 px-6 py-4 flex-shrink-0">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('visit-evaluation')}
              className={`px-6 py-2 font-medium text-base transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'visit-evaluation'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              来院時評価
            </button>
            <button
              onClick={() => setActiveTab('training')}
              className={`px-6 py-2 font-medium text-base transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'training'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              トレーニング管理
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`px-6 py-2 font-medium text-base transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'progress'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              進捗グラフ
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`px-6 py-2 font-medium text-base transition-colors whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'issues'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              課題
            </button>
          </div>
        </div>
      </div>

      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* 来院時評価タブ */}
        {activeTab === 'visit-evaluation' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <VisitEvaluationTab
              patientId={patientId}
              patientName={`${patient.last_name} ${patient.first_name}`}
            />
          </div>
        )}

        {/* トレーニング管理タブ */}
        {activeTab === 'training' && (
          <div className="bg-white rounded-xl shadow-sm p-4 h-full">
            <TrainingFlowChart patientId={patientId} clinicId={clinicId} />
          </div>
        )}

        {/* 進捗グラフタブ */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <TrainingProgressChart patientId={patientId} />
          </div>
        )}

        {/* 課題タブ */}
        {activeTab === 'issues' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <PatientIssuesTab patientId={patientId} />
          </div>
        )}
      </div>

      {/* パスワードリセット確認モーダル */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              パスワードをリセット
            </h3>
            <p className="text-gray-600 mb-6">
              この患者のパスワードをリセットします。<br />
              リセット後は生年月日でログインできるようになります。
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>患者:</strong> {patient.last_name} {patient.first_name}<br />
                <strong>患者番号:</strong> {patient.patient_number}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
