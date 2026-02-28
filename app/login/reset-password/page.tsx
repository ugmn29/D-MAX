'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { getFirebaseAuth } from '@/lib/firebase-client'
import { sendPasswordResetEmail } from 'firebase/auth'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const auth = getFirebaseAuth()
      if (!auth) throw new Error('auth/unavailable')
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
        // Don't reveal if email exists or not for security
        setSent(true)
      } else if (code === 'auth/too-many-requests') {
        setError('リクエストが多すぎます。しばらくしてからお試しください')
      } else {
        setError('メール送信に失敗しました。もう一度お試しください')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">D</span>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">パスワードリセット</CardTitle>
          <p className="text-sm text-gray-500 mt-1">登録済みのメールアドレスにリセットリンクを送信します</p>
        </CardHeader>
        <CardContent className="pt-4">
          {sent ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">メールを送信しました</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <strong>{email}</strong> にパスワードリセットのメールを送信しました。<br />
                    メール内のリンクからパスワードを再設定してください。
                  </p>
                </div>
                <p className="text-xs text-gray-400">メールが届かない場合は、迷惑メールフォルダをご確認ください</p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ログインページへ戻る
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">メールアドレス</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@clinic.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitting || !email.trim()}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    送信中...
                  </div>
                ) : (
                  'リセットメールを送信'
                )}
              </Button>

              <Link href="/login" className="block text-center">
                <span className="text-xs text-blue-500 hover:text-blue-700 hover:underline">
                  ログインページへ戻る
                </span>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
