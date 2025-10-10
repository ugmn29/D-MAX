'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, ExternalLink, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClientURLGeneratorProps {
  clinicId: string
}

export default function ClientURLGenerator({ clinicId }: ClientURLGeneratorProps) {
  const [clinicSlug, setClinicSlug] = useState('')
  const [clinicName, setClinicName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadClinicData()
  }, [clinicId])

  const loadClinicData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/clinics/${clinicId}`)
      if (res.ok) {
        const data = await res.json()
        setClinicSlug(data.slug || '')
        setClinicName(data.name || '')
      }
    } catch (error) {
      console.error('クリニック情報取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSlug = async () => {
    if (!clinicSlug) {
      alert('URLスラッグを入力してください')
      return
    }

    // スラッグのバリデーション（英数字とハイフンのみ）
    if (!/^[a-z0-9-]+$/.test(clinicSlug)) {
      alert('URLスラッグは英小文字、数字、ハイフンのみ使用できます')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/clinics/${clinicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: clinicSlug })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '保存に失敗しました')
      }

      alert('URLスラッグを保存しました')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <div>読み込み中...</div>
  }

  const baseURL = typeof window !== 'undefined' ? window.location.origin : 'https://dmax.com'
  const bookingURL = clinicSlug ? `${baseURL}/clinic/${clinicSlug}/booking` : ''
  const embedCode = clinicSlug
    ? `<a href="${bookingURL}?utm_source=hp&utm_medium=button&utm_campaign=top" class="booking-button">予約する</a>`
    : ''

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>クライアント専用URL設定</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            各クライアント専用の予約URLを生成します
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clinicName">クリニック名</Label>
            <Input
              id="clinicName"
              value={clinicName}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="clinicSlug">URLスラッグ *</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="clinicSlug"
                  value={clinicSlug}
                  onChange={(e) => setClinicSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="tanaka-dental"
                />
                <p className="text-xs text-gray-500 mt-1">
                  英小文字、数字、ハイフンのみ（例: tanaka-dental）
                </p>
              </div>
              <Button onClick={handleSaveSlug} disabled={saving || !clinicSlug}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          {clinicSlug && (
            <>
              <div className="border-t pt-4 mt-4">
                <Label>生成された予約URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={bookingURL} readOnly className="bg-gray-50" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(bookingURL)}
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(bookingURL, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>クライアントのHPに貼るコード</Label>
                <div className="mt-2 p-3 bg-gray-900 text-gray-100 rounded font-mono text-xs overflow-x-auto">
                  <pre>{embedCode}</pre>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(embedCode)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  コードをコピー
                </Button>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertDescription>
                  <strong>使い方:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li>上記のURLをクライアントに共有</li>
                    <li>クライアントのHPに「予約する」ボタンを設置し、このURLをリンク先に設定</li>
                    <li>UTMパラメータ付きなので、HP経由の予約を正確に追跡できます</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
