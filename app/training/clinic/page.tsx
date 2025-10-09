'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ClinicTrainingPage() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    todayCompleted: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // TODO: 実際の統計データを取得
      setStats({
        totalPatients: 0,
        activePatients: 0,
        todayCompleted: 0
      })
    } catch (error) {
      console.error('統計データ取得エラー:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            口腔機能トレーニング管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">医院スタッフ用</p>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* メインメニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 患者管理 */}
          <button
            onClick={() => router.push('/training/clinic/patients')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">患者管理</h3>
            <p className="text-sm text-gray-600">
              患者の登録・編集・削除、トレーニング履歴の確認
            </p>
          </button>

          {/* トレーニング一覧 */}
          <button
            onClick={() => router.push('/training/clinic/trainings')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">🏋️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">トレーニング一覧</h3>
            <p className="text-sm text-gray-600">
              全トレーニング項目の確認・編集
            </p>
          </button>

          {/* 分析 */}
          <button
            onClick={() => router.push('/training/clinic/analytics')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">分析</h3>
            <p className="text-sm text-gray-600">
              トレーニング実施状況の分析・レポート
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
