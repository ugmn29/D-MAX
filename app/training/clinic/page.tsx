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
        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">総患者数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">アクティブ患者</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activePatients}</p>
              </div>
              <div className="text-4xl">💪</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">本日の完了</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayCompleted}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

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

          {/* トレーニング処方 */}
          <button
            onClick={() => router.push('/training/clinic/prescribe')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">トレーニング処方</h3>
            <p className="text-sm text-gray-600">
              患者へのトレーニングメニュー設定・変更
            </p>
          </button>

          {/* テンプレート管理 */}
          <button
            onClick={() => router.push('/training/clinic/templates')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">テンプレート管理</h3>
            <p className="text-sm text-gray-600">
              よく使うトレーニングメニューのテンプレート作成
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

          {/* 設定 */}
          <button
            onClick={() => router.push('/settings')}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">設定</h3>
            <p className="text-sm text-gray-600">
              システム設定・スタッフ管理
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
