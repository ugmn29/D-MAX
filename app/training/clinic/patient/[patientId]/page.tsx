'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/database'
import { getPatientById } from '@/lib/api/patients'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

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
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [activeMenu, setActiveMenu] = useState<TrainingMenu | null>(null)
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'menu' | 'records'>('menu')
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
      const patientData = await getPatientById(DEMO_CLINIC_ID, patientId)
      setPatient(patientData)

      // UUID形式かチェック
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId)

      if (!isUUID) {
        // モックモード: localStorageから取得
        console.log('モックモード: localStorageからトレーニングメニューを取得')
        const mockMenus = JSON.parse(localStorage.getItem('mock_training_menus') || '[]')
        const mockMenuTrainings = JSON.parse(localStorage.getItem('mock_menu_trainings') || '[]')
        const mockRecords = JSON.parse(localStorage.getItem('mock_training_records') || '[]')

        const patientActiveMenu = mockMenus.find((m: any) => m.patient_id === patientId && m.is_active)

        if (patientActiveMenu) {
          // トレーニング情報を取得
          const { data: trainingsData } = await supabase
            .from('trainings')
            .select('*')
            .eq('is_deleted', false)

          const menuTrainingsWithDetails = mockMenuTrainings
            .filter((mt: any) => mt.menu_id === patientActiveMenu.id)
            .map((mt: any) => ({
              ...mt,
              training: trainingsData?.find((t: any) => t.id === mt.training_id)
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
            training: trainingsData?.find((t: any) => t.id === r.training_id)
          }))
          .sort((a: any, b: any) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())

        setTrainingRecords(patientRecords)
      } else {
        // データベースモード
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
          // sort_orderでソート
          const sortedMenuTrainings = (menuData.menu_trainings || []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          )
          setActiveMenu({
            ...menuData,
            menu_trainings: sortedMenuTrainings
          })
        }

        // トレーニング実施記録を取得（データベースモード）
        const { data: recordsData, error: recordsError } = await supabase
          .from('training_records')
          .select(`
            *,
            training:trainings(*)
          `)
          .eq('patient_id', patientId)
          .order('performed_at', { ascending: false })
          .limit(50)

        if (!recordsError && recordsData) {
          setTrainingRecords(recordsData)
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic/patients')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.last_name} {patient.first_name}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                患者番号: {patient.patient_number}
                {(patient as any).password_set && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    パスワード設定済み
                  </span>
                )}
              </p>
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
              <button
                onClick={() => router.push(`/training/clinic/prescribe/${patientId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                新しいメニューを処方
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* タブナビゲーション */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'menu'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              処方メニュー
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'records'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              実施記録 ({trainingRecords.length})
            </button>
          </div>
        </div>

        {/* 処方メニュータブ */}
        {activeTab === 'menu' && (
          <>
            {activeMenu ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {activeMenu.menu_name || '処方メニュー'}
                </h2>
                <span className="px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                  処方中
                </span>
              </div>
              <p className="text-sm text-gray-500">
                処方日: {new Date(activeMenu.prescribed_at).toLocaleDateString('ja-JP')}
              </p>
            </div>

            {/* トレーニングリスト */}
            <div className="space-y-4">
              {activeMenu.menu_trainings && activeMenu.menu_trainings.length > 0 ? (
                activeMenu.menu_trainings.map((mt, index) => (
                  <div
                    key={mt.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {mt.training?.training_name || 'トレーニング名'}
                        </h3>
                        {mt.training?.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {mt.training.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500 mb-3">
                          <span>{mt.action_seconds}秒</span>
                          <span>×</span>
                          <span>{mt.sets}セット</span>
                          <span>休憩: {mt.rest_seconds}秒</span>
                        </div>

                        {/* 練習手順 */}
                        {mt.training?.instructions && mt.training.instructions.length > 0 && (
                          <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                            <div className="text-xs font-bold text-blue-900 mb-2">練習手順</div>
                            <ol className="space-y-1">
                              {mt.training.instructions.map((instruction, idx) => (
                                <li key={idx} className="text-xs text-gray-800">
                                  {idx + 1}. {instruction}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 注意事項 */}
                        {mt.training?.precautions && mt.training.precautions.length > 0 && (
                          <div className="mt-3 bg-orange-50 p-3 rounded-lg">
                            <div className="text-xs font-bold text-orange-900 mb-2">注意事項</div>
                            <ul className="space-y-1">
                              {mt.training.precautions.map((precaution, idx) => (
                                <li key={idx} className="text-xs text-gray-800">
                                  • {precaution}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  トレーニングが登録されていません
                </p>
              )}
            </div>
          </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-gray-600 mb-4">
                  現在処方されているトレーニングメニューはありません
                </p>
                <button
                  onClick={() => router.push(`/training/clinic/prescribe/${patientId}`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  トレーニングメニューを処方する
                </button>
              </div>
            )}
          </>
        )}

        {/* 実施記録タブ */}
        {activeTab === 'records' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {trainingRecords.length > 0 ? (
              <div className="space-y-4">
                {trainingRecords.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {record.training?.training_name || 'トレーニング'}
                          </h3>
                          {record.completed ? (
                            <span className="px-2 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                              完了
                            </span>
                          ) : record.interrupted ? (
                            <span className="px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-100 rounded-full">
                              中断
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full">
                              未完了
                            </span>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span>
                            {new Date(record.performed_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <span>
                            {new Date(record.performed_at).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {record.time_of_day && (
                            <span>
                              {record.time_of_day === 'morning' && '朝'}
                              {record.time_of_day === 'afternoon' && '昼'}
                              {record.time_of_day === 'evening' && '夕'}
                              {record.time_of_day === 'night' && '夜'}
                            </span>
                          )}
                          {record.actual_duration_seconds && (
                            <span>実施時間: {Math.floor(record.actual_duration_seconds / 60)}分{record.actual_duration_seconds % 60}秒</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">実施記録がありません</p>
                <p className="text-sm text-gray-500 mt-2">
                  患者さんがトレーニングを実施すると、ここに記録が表示されます
                </p>
              </div>
            )}
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
