'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PatientSettingsPage() {
  const router = useRouter()
  const [patientData, setPatientData] = useState<any>(null)
  const [passwordSet, setPasswordSet] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    // ログインチェック
    const token = localStorage.getItem('training_token')
    const patient = localStorage.getItem('patient_data')

    if (!token || !patient) {
      router.push('/training/patient/login')
      return
    }

    const data = JSON.parse(patient)
    setPatientData(data)
    setPasswordSet(data.passwordSet || false)
  }, [])

  const handleSetPassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('パスワードが一致しません')
      return
    }

    if (newPassword.length < 6) {
      alert('パスワードは6文字以上で設定してください')
      return
    }

    try {
      const response = await fetch('/api/training/patient/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientData.id,
          password: newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('パスワードを設定しました')
        setPasswordSet(true)
        setShowPasswordModal(false)
        setNewPassword('')
        setConfirmPassword('')

        // ローカルストレージの患者データを更新
        const updatedPatientData = { ...patientData, passwordSet: true }
        localStorage.setItem('patient_data', JSON.stringify(updatedPatientData))
        setPatientData(updatedPatientData)
      } else {
        alert(data.error || 'パスワードの設定に失敗しました')
      }
    } catch (error) {
      console.error('パスワード設定エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('training_token')
    localStorage.removeItem('patient_data')
    router.push('/training/patient/login')
  }

  if (!patientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/training/patient/home')}
              className="mr-3 text-blue-600"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-900">設定</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* アカウント情報 */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">アカウント情報</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">患者番号</span>
              <span className="font-medium">{patientData.patientNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">氏名</span>
              <span className="font-medium">{patientData.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-gray-600">ログイン方法</span>
              <span className="font-medium">
                {passwordSet ? 'パスワード' : '生年月日'}
              </span>
            </div>
          </div>
        </div>

        {/* パスワード設定 */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">セキュリティ</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {passwordSet
                  ? 'パスワードを変更できます'
                  : 'パスワードを設定すると、生年月日の代わりにパスワードでログインできます'}
              </p>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {passwordSet ? 'パスワードを変更' : 'パスワードを設定'}
              </button>
            </div>
          </div>
        </div>

        {/* アカウント管理 */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">アカウント管理</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/training/patient/account-switch')}
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center justify-between"
            >
              <span>アカウントを切り替え</span>
              <span className="text-gray-400">→</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 flex items-center justify-between text-red-600"
            >
              <span>ログアウト</span>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* アプリ情報 */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">アプリ情報</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between items-center py-2">
              <span>バージョン</span>
              <span>1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* パスワード設定モーダル */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {passwordSet ? 'パスワード変更' : 'パスワード設定'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新しいパスワード
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6文字以上"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード確認
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="もう一度入力"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSetPassword}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ナビゲーション */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-around">
          <button
            onClick={() => router.push('/training/patient/home')}
            className="flex flex-col items-center text-gray-600 hover:text-gray-900"
          >
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
          <button className="flex flex-col items-center text-blue-600">
            <span className="text-2xl mb-1">⚙️</span>
            <span className="text-xs">設定</span>
          </button>
        </div>
      </div>
    </div>
  )
}
