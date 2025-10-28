'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  MessageCircle,
  Calendar,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

declare global {
  interface Window {
    liff: any
  }
}

export default function InitialLinkPage() {
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [invitationCode, setInvitationCode] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [patientName, setPatientName] = useState<string | null>(null)

  // LIFF初期化
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDKが読み込まれているか確認
        if (typeof window !== 'undefined' && window.liff) {
          const liffId = process.env.NEXT_PUBLIC_LIFF_ID_INITIAL_LINK

          if (!liffId) {
            setError('LIFF IDが設定されていません。管理者にお問い合わせください。')
            return
          }

          await window.liff.init({ liffId })

          if (window.liff.isLoggedIn()) {
            // ユーザー情報を取得
            const profile = await window.liff.getProfile()
            setLineUserId(profile.userId)
            setLiffReady(true)
          } else {
            // ログインしていない場合はLINEログイン
            window.liff.login()
          }
        } else {
          setError('LIFF SDKの読み込みに失敗しました。ページを再読み込みしてください。')
        }
      } catch (err) {
        console.error('LIFF初期化エラー:', err)
        setError('初期化に失敗しました。ページを再読み込みしてください。')
      }
    }

    initializeLiff()
  }, [])

  // 招待コードをフォーマット（自動でハイフンを挿入）
  const formatInvitationCode = (value: string) => {
    // 英数字のみを抽出
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase()

    // 4文字目の後にハイフンを挿入
    if (cleaned.length <= 4) {
      return cleaned
    } else {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`
    }
  }

  // 生年月日をフォーマット（自動でスラッシュを挿入）
  const formatBirthDate = (value: string) => {
    // 数字のみを抽出
    const cleaned = value.replace(/[^0-9]/g, '')

    // YYYY/MM/DD形式にフォーマット
    if (cleaned.length <= 4) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 4)}/${cleaned.slice(4)}`
    } else {
      return `${cleaned.slice(0, 4)}/${cleaned.slice(4, 6)}/${cleaned.slice(6, 8)}`
    }
  }

  // 連携処理
  const handleLink = async () => {
    if (!lineUserId) {
      setError('LINE User IDが取得できませんでした')
      return
    }

    if (!invitationCode || invitationCode.length < 9) {
      setError('招待コードを正しく入力してください（例: AB12-CD34）')
      return
    }

    if (!birthDate || birthDate.length !== 10) {
      setError('生年月日を正しく入力してください（例: 1990/01/01）')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 生年月日をYYYY-MM-DD形式に変換
      const formattedBirthDate = birthDate.replace(/\//g, '-')

      const response = await fetch('/api/line/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          invitation_code: invitationCode,
          birth_date: formattedBirthDate
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setPatientName(data.linkage.patient.name)

        // 3秒後にLIFFを閉じる
        setTimeout(() => {
          if (window.liff) {
            window.liff.closeWindow()
          }
        }, 3000)
      } else {
        setError(data.error || '連携に失敗しました')
      }
    } catch (err) {
      console.error('連携エラー:', err)
      setError('連携処理中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // LIFF読み込み中
  if (!liffReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              <p className="text-gray-600">初期化中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 連携成功画面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">連携完了！</h2>
              <p className="text-gray-600">
                {patientName}様のアカウントと<br />
                LINEを連携しました
              </p>
              <div className="pt-4 text-sm text-gray-500">
                このウィンドウは自動的に閉じます
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // メイン画面
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto max-w-md p-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            初回登録
          </h1>
          <p className="text-gray-600 text-sm">
            クリニックから受け取った招待コードを入力してください
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">連携情報を入力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 招待コード入力 */}
            <div className="space-y-2">
              <Label htmlFor="invitation-code">招待コード</Label>
              <Input
                id="invitation-code"
                type="text"
                placeholder="AB12-CD34"
                value={invitationCode}
                onChange={(e) => {
                  const formatted = formatInvitationCode(e.target.value)
                  setInvitationCode(formatted)
                }}
                maxLength={9}
                className="text-lg tracking-wider font-mono text-center"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                8桁の英数字（ハイフンは自動で挿入されます）
              </p>
            </div>

            {/* 生年月日入力 */}
            <div className="space-y-2">
              <Label htmlFor="birth-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                生年月日
              </Label>
              <Input
                id="birth-date"
                type="text"
                placeholder="1990/01/01"
                value={birthDate}
                onChange={(e) => {
                  const formatted = formatBirthDate(e.target.value)
                  setBirthDate(formatted)
                }}
                maxLength={10}
                className="text-lg text-center"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                本人確認のため、生年月日を入力してください
              </p>
            </div>

            {/* 連携ボタン */}
            <Button
              onClick={handleLink}
              disabled={loading || !invitationCode || !birthDate}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  連携中...
                </>
              ) : (
                '連携する'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 案内 */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">招待コードをお持ちでない方</p>
                <p className="text-xs">
                  受付スタッフに「LINE連携したい」とお伝えください。
                  招待コードを発行いたします。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
