'use client'

import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">分析</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-gray-600">分析機能は準備中です</p>
        </div>
      </div>
    </div>
  )
}
