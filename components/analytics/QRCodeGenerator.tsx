'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Download, Copy, CheckCircle } from 'lucide-react'

interface QRCodeGeneratorProps {
  clinicId: string
  clinicSlug?: string
}

export default function QRCodeGenerator({ clinicId, clinicSlug }: QRCodeGeneratorProps) {
  const [source, setSource] = useState('posting')
  const [medium, setMedium] = useState('offline')
  const [campaign, setCampaign] = useState('')
  const [customSource, setCustomSource] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  const baseURL = typeof window !== 'undefined' ? window.location.origin : 'https://dmax.com'
  const bookingURL = clinicSlug
    ? `${baseURL}/clinic/${clinicSlug}/booking`
    : `${baseURL}/web-booking`

  const generateTrackingURL = () => {
    const params = new URLSearchParams()
    const finalSource = source === 'custom' ? customSource : source

    if (finalSource) params.append('utm_source', finalSource)
    if (medium) params.append('utm_medium', medium)
    if (campaign) params.append('utm_campaign', campaign)

    return `${bookingURL}?${params.toString()}`
  }

  const generateQRCode = async () => {
    setLoading(true)
    const trackingURL = generateTrackingURL()

    // QRコード生成API (無料のqrserver.com APIを使用)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingURL)}`

    setQrCodeUrl(qrApiUrl)
    setLoading(false)
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return

    const finalSource = source === 'custom' ? customSource : source
    const filename = `qr_${finalSource}_${campaign || 'default'}.png`

    // 高解像度版をダウンロード
    const highResUrl = qrCodeUrl.replace('300x300', '1000x1000')

    const link = document.createElement('a')
    link.href = highResUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyURL = () => {
    navigator.clipboard.writeText(generateTrackingURL())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trackingURL = generateTrackingURL()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QRコード生成
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            チラシ・看板用のUTMパラメータ付きQRコードを生成します
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 流入元 (Source) */}
          <div>
            <Label htmlFor="source">流入元 (Source) *</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="posting">ポスティングチラシ</SelectItem>
                <SelectItem value="signboard">看板</SelectItem>
                <SelectItem value="flyer">店頭チラシ</SelectItem>
                <SelectItem value="referral_card">紹介カード</SelectItem>
                <SelectItem value="dm">ダイレクトメール</SelectItem>
                <SelectItem value="magazine">雑誌広告</SelectItem>
                <SelectItem value="newspaper">新聞広告</SelectItem>
                <SelectItem value="event">イベント</SelectItem>
                <SelectItem value="custom">カスタム</SelectItem>
              </SelectContent>
            </Select>
            {source === 'custom' && (
              <Input
                value={customSource}
                onChange={(e) => setCustomSource(e.target.value)}
                placeholder="カスタム流入元を入力"
                className="mt-2"
              />
            )}
          </div>

          {/* メディア (Medium) */}
          <div>
            <Label htmlFor="medium">メディア (Medium) *</Label>
            <Select value={medium} onValueChange={setMedium}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">オフライン</SelectItem>
                <SelectItem value="print">印刷物</SelectItem>
                <SelectItem value="qr">QRコード</SelectItem>
                <SelectItem value="card">カード</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* キャンペーン (Campaign) */}
          <div>
            <Label htmlFor="campaign">キャンペーン名 (Campaign)</Label>
            <Input
              id="campaign"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="例: 2025spring, shibuya_202501"
            />
            <p className="text-xs text-gray-500 mt-1">
              配布エリアや時期を入れると分析しやすいです
            </p>
          </div>

          {/* 生成されるURL */}
          <div>
            <Label>生成されるURL</Label>
            <div className="flex gap-2 mt-2">
              <Input value={trackingURL} readOnly className="bg-gray-50 text-xs" />
              <Button
                variant="outline"
                size="icon"
                onClick={copyURL}
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* QRコード生成ボタン */}
          <Button
            onClick={generateQRCode}
            disabled={loading || !source || (source === 'custom' && !customSource)}
            className="w-full"
          >
            {loading ? 'QRコード生成中...' : 'QRコード生成'}
          </Button>

          {/* QRコードプレビュー */}
          {qrCodeUrl && (
            <div className="border-t pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 border-2 border-gray-300 rounded-lg">
                  <img src={qrCodeUrl} alt="QRコード" className="w-64 h-64" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadQRCode} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    高解像度でダウンロード (1000x1000)
                  </Button>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-sm">
                    <strong>使い方:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>QRコードをダウンロード</li>
                      <li>チラシ・看板のデザインに配置</li>
                      <li>印刷して配布</li>
                      <li>アナリティクス画面で流入数を確認</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* 活用例 */}
          <Alert>
            <AlertDescription className="text-sm">
              <strong>活用例:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><strong>ポスティングチラシ</strong>: エリア別にキャンペーン名を変更（shibuya_2025q1, meguro_2025q1）</li>
                <li><strong>駅前看板</strong>: 看板の場所をキャンペーン名に（station_a, station_b）</li>
                <li><strong>紹介カード</strong>: 月別にキャンペーン名を変更（referral_202501, referral_202502）</li>
                <li><strong>店頭チラシ</strong>: 配布場所をキャンペーン名に（counter, waitingroom）</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
