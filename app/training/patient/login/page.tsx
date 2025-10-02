'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PatientLoginPage() {
  const router = useRouter()
  const [patientNumber, setPatientNumber] = useState('')
  const [credential, setCredential] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/training/auth/patient-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: '11111111-1111-1111-1111-111111111111', // テストクリニックID
          patientNumber: parseInt(patientNumber),
          credential,
          deviceId: getDeviceId()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました')
      }

      if (data.success) {
        // トークンを保存
        localStorage.setItem('training_token', data.token)
        localStorage.setItem('patient_data', JSON.stringify(data.patient))

        // パスワード未設定の場合、設定を促す
        if (!data.patient.passwordSet) {
          // TODO: パスワード設定画面に遷移
          console.log('パスワード設定が必要です')
        }

        // ホーム画面に遷移
        router.push('/training/patient/home')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // デバイスIDを取得（なければ生成）
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`
      localStorage.setItem('device_id', deviceId)
    }
    return deviceId
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* ロゴ・タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              トレーニング
            </h1>
            <p className="text-gray-600">患者ログイン</p>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ログインフォーム */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 患者番号 */}
            <div>
              <label
                htmlFor="patientNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                患者番号
              </label>
              <input
                id="patientNumber"
                type="number"
                value={patientNumber}
                onChange={(e) => setPatientNumber(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="例: 123"
              />
            </div>

            {/* 生年月日 or パスワード */}
            <div>
              <label
                htmlFor="credential"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                生年月日 または パスワード
              </label>
              <input
                id="credential"
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                placeholder="YYYYMMDD または パスワード"
              />
              <p className="mt-2 text-xs text-gray-500">
                生年月日は8桁で入力してください（例: 20150415）
              </p>
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* アカウント切り替え */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/training/patient/account-switch')}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
            >
              別のアカウントでログイン
            </button>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>初めてログインする方は</p>
          <p>患者番号と生年月日を入力してください</p>
        </div>
      </div>
    </div>
  )
}
