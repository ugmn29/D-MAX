'use client'

import { useState, useEffect, useRef } from 'react'
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

  // 入力フィールドのref
  const invitationInputRef = useRef<HTMLInputElement>(null)

  // 生の招待コード入力値（フォーマットなし）
  const [rawInvitationCode, setRawInvitationCode] = useState('')

  // LIFF SDKをロード
  useEffect(() => {
    // LIFF SDKスクリプトを動的に追加
    const script = document.createElement('script')
    script.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      // クリーンアップ
      document.head.removeChild(script)
    }
  }, [])

  // LIFF初期化
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDKが読み込まれるまで待機（最大10秒でタイムアウト）
        const checkLiff = () => {
          return new Promise((resolve, reject) => {
            let attempts = 0
            const maxAttempts = 100 // 10秒 (100ms * 100)

            const check = () => {
              attempts++

              if (typeof window !== 'undefined' && window.liff) {
                resolve(true)
              } else if (attempts >= maxAttempts) {
                reject(new Error('LIFF SDKの読み込みがタイムアウトしました'))
              } else {
                setTimeout(check, 100)
              }
            }
            check()
          })
        }

        await checkLiff()

        // LIFF IDを取得（設定画面の値 > 環境変数の順で優先）
        let liffId = process.env.NEXT_PUBLIC_LIFF_ID_INITIAL_LINK

        // localStorageから設定画面の値を取得
        try {
          const savedSettings = localStorage.getItem('notificationSettings')
          if (savedSettings) {
            const settings = JSON.parse(savedSettings)
            if (settings.line?.liff_id_initial_link) {
              liffId = settings.line.liff_id_initial_link
            }
          }
        } catch (e) {
          console.error('localStorage読み込みエラー:', e)
        }

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          setLiffReady(false)
          return
        }

        await window.liff.init({ liffId })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          setLiffReady(true)
        } else {
          window.liff.login()
        }
      } catch (err: any) {
        console.error('LIFF初期化エラー:', err)
        setError(`初期化失敗: ${err.message || 'Unknown error'}`)
        setLiffReady(false)
      }
    }

    initializeLiff()
  }, [])

  // 招待コードの入力ハンドラー（フォーマットなし・シンプル方式）
  const handleInvitationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value

    // 英数字とハイフンのみ許可、大文字に変換、8文字+ハイフン1つまで
    const cleaned = rawInput.replace(/[^A-Z0-9-]/gi, '').toUpperCase().slice(0, 9)

    // そのまま保存（フォーマットしない）
    setRawInvitationCode(cleaned)
  }

  // 生年月日の入力ハンドラー
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value

    // 数字のみを抽出（スラッシュは除外）
    const onlyDigits = rawInput.replace(/[^0-9]/g, '')

    // 8文字まで制限
    const limited = onlyDigits.slice(0, 8)

    // フォーマット: YYYY/MM/DD
    let formatted = limited
    if (limited.length > 6) {
      formatted = `${limited.slice(0, 4)}/${limited.slice(4, 6)}/${limited.slice(6)}`
    } else if (limited.length > 4) {
      formatted = `${limited.slice(0, 4)}/${limited.slice(4)}`
    }

    // 値を設定（Reactが自動的に重複を処理）
    setBirthDate(formatted)
  }

  // 連携処理
  const handleLink = async () => {
    if (!lineUserId) {
      setError('LINE User IDが取得できませんでした')
      return
    }

    // 招待コードのフォーマット（ハイフンを除去して8文字チェック）
    const codeOnly = rawInvitationCode.replace(/-/g, '')
    if (!codeOnly || codeOnly.length !== 8) {
      setError('招待コードを8桁で入力してください（例: AB12CD34 または AB12-CD34）')
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

      // 招待コードを正規化（ハイフンを除去）
      const normalizedCode = rawInvitationCode.replace(/-/g, '')

      const response = await fetch('/api/line/link-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          invitation_code: normalizedCode,
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
      <>
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                {error ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-red-600" />
                    <p className="text-red-600 font-bold">エラーが発生しました</p>
                    <p className="text-sm text-gray-600 text-center whitespace-pre-wrap">{error}</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    <p className="text-gray-600">初期化中...</p>
                  </>
                )}

                {/* デバッグ情報を表示 */}
                {debugInfo.length > 0 && (
                  <div className="w-full mt-4 p-3 bg-gray-100 rounded text-xs text-left">
                    <p className="font-bold mb-2">デバッグ情報:</p>
                    {debugInfo.map((info, i) => (
                      <div key={i} className="text-gray-700 font-mono">{info}</div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  // 連携成功画面
  if (success) {
    return (
      <>
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
      </>
    )
  }

  // メイン画面
  return (
    <>
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
                ref={invitationInputRef}
                id="invitation-code"
                type="text"
                inputMode="text"
                placeholder="AB12-CD34 または AB12CD34"
                value={rawInvitationCode}
                onChange={handleInvitationCodeChange}
                maxLength={9}
                className="text-lg tracking-wider font-mono text-center"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                8桁の英数字を入力してください（ハイフンあり・なし両方OK）
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
                inputMode="numeric"
                placeholder="1990/01/01"
                value={birthDate}
                onChange={handleBirthDateChange}
                maxLength={10}
                className="text-lg text-center"
                disabled={loading}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                本人確認のため、生年月日を入力してください
              </p>
            </div>

            {/* 連携ボタン */}
            <Button
              onClick={handleLink}
              disabled={loading || !rawInvitationCode || !birthDate}
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
    </>
  )
}
