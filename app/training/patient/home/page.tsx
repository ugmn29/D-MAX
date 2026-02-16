'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Training {
  id: string
  training_name: string
  action_seconds: number
  rest_seconds: number
  sets: number
  completed: boolean
  locked: boolean
  sort_order: number
}

export default function PatientHomePage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [patientData, setPatientData] = useState<any>(null)

  useEffect(() => {
    // ログインチェック
    const token = localStorage.getItem('training_token')
    const patient = localStorage.getItem('patient_data')

    if (!token || !patient) {
      router.push('/training/patient/login')
      return
    }

    setPatientData(JSON.parse(patient))
    loadTodaysTrainings()
    loadStreak()
  }, [])

  const loadTodaysTrainings = async () => {
    try {
      const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')

      const response = await fetch(`/api/training/patient/menu?patientId=${patient.id}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('メニュー取得エラー:', data)
        setTrainings([])
        return
      }

      setTrainings(data.trainings || [])
    } catch (error) {
      console.error('エラー:', error)
      setTrainings([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadStreak = async () => {
    try {
      const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')

      const response = await fetch(`/api/training/patient/streak?patientId=${patient.id}`)
      const data = await response.json()

      if (response.ok) {
        setStreak(data.streak || 0)
      }
    } catch (error) {
      console.error('ストリーク取得エラー:', error)
      setStreak(0)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('training_token')
    localStorage.removeItem('patient_data')
    router.push('/training/patient/login')
  }

  const startTraining = (training: Training) => {
    if (training.locked) return

    router.push(`/training/patient/exercise?id=${training.id}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {patientData?.name}さん
            </h1>
            <p className="text-sm text-gray-500">患者番号: {patientData?.patientNumber}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ストリーク表示 */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">連続達成</p>
              <p className="text-4xl font-bold">{streak}日</p>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
          {streak === 0 && (
            <p className="mt-4 text-sm opacity-90">
              さあ、今日から始めよう！
            </p>
          )}
        </div>

        {/* 全完了メッセージ */}
        {trainings.length > 0 && trainings.every(t => t.completed) && (
          <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-8 mb-6 text-white text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">
              今日のトレーニングは修了です！
            </h2>
            <p className="text-lg opacity-90 mb-1">
              お疲れ様でした
            </p>
            <p className="text-sm opacity-80">
              よく頑張りました！また明日も続けましょう💪
            </p>
          </div>
        )}

        {/* 今日のトレーニング */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            今日のトレーニング
          </h2>

          {trainings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <p className="text-gray-600">
                まだトレーニングが設定されていません。<br />
                歯医者さんに確認してください。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainings.map((training, index) => (
                <button
                  key={training.id}
                  onClick={() => startTraining(training)}
                  disabled={training.locked}
                  className={`w-full text-left bg-white rounded-xl p-4 transition-all ${
                    training.completed
                      ? 'opacity-60'
                      : training.locked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* 番号 */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                          training.completed
                            ? 'bg-green-500 text-white'
                            : training.locked
                            ? 'bg-gray-300 text-gray-500'
                            : 'bg-blue-500 text-white'
                        }`}
                      >
                        {training.completed ? '✓' : index + 1}
                      </div>

                      {/* トレーニング名 */}
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {training.training_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {training.action_seconds}秒 × {training.sets}セット
                        </p>
                      </div>
                    </div>

                    {/* ステータス */}
                    <div>
                      {training.completed ? (
                        <span className="text-green-600 text-sm font-medium">
                          完了
                        </span>
                      ) : training.locked ? (
                        <span className="text-gray-400 text-2xl">🔒</span>
                      ) : (
                        <span className="text-blue-600 text-xl">→</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ナビゲーション */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex justify-around">
            <button className="flex flex-col items-center text-blue-600">
              <span className="text-2xl mb-1">🏠</span>
              <span className="text-xs">ホーム</span>
            </button>
            <button
              onClick={() => router.push('/training/patient/progress')}
              className="flex flex-col items-center text-gray-600 hover:text-gray-900"
            >
              <span className="text-2xl mb-1">📅</span>
              <span className="text-xs">進捗</span>
            </button>
            <button
              onClick={() => router.push('/training/patient/settings')}
              className="flex flex-col items-center text-gray-600 hover:text-gray-900"
            >
              <span className="text-2xl mb-1">⚙️</span>
              <span className="text-xs">設定</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
