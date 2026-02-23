'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { QrCode, Download, Copy, CheckCircle, Globe, Calendar, ExternalLink, Plus, Trash2, RefreshCw } from 'lucide-react'

interface QRCodeGeneratorProps {
  clinicId: string
  clinicSlug?: string
}

interface SavedQR {
  id: string
  label: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  generated_url: string
  qr_code_url: string | null
  created_at: string | null
}

const LINK_DESTINATIONS = [
  {
    id: 'hp_top',
    label: 'ホームページ（トップ）',
    description: 'HPを見てもらってから予約',
    icon: Globe,
    getUrl: (hpBaseUrl: string) => hpBaseUrl,
  },
  {
    id: 'hp_booking',
    label: 'ホームページ（予約ページ）',
    description: 'HPの予約ページに直接飛ばす',
    icon: Calendar,
    getUrl: (hpBaseUrl: string) => `${hpBaseUrl}/booking`,
  },
  {
    id: 'dmax_booking',
    label: 'DAX予約システム',
    description: 'DAXのWeb予約に直接飛ばす',
    icon: Calendar,
    getUrl: (_: string, dmaxBaseUrl: string, clinicSlug?: string, clinicId?: string) =>
      clinicSlug ? `${dmaxBaseUrl}/clinic/${clinicSlug}/booking` : `${dmaxBaseUrl}/web-booking?clinic_id=${clinicId}`,
  },
  {
    id: 'custom',
    label: 'カスタムURL',
    description: '任意のURLを指定',
    icon: ExternalLink,
    getUrl: () => '',
  },
]

export default function QRCodeGenerator({ clinicId, clinicSlug }: QRCodeGeneratorProps) {
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // モーダル内のフォーム状態
  const [destination, setDestination] = useState('dmax_booking')
  const [hpBaseUrl, setHpBaseUrl] = useState('https://fuku-dental.com')
  const [customUrl, setCustomUrl] = useState('')
  const [source, setSource] = useState('posting')
  const [medium, setMedium] = useState('QR')
  const [campaign, setCampaign] = useState('')
  const [customSource, setCustomSource] = useState('')
  const [label, setLabel] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const dmaxBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dmax.com'

  useEffect(() => {
    loadSavedQRs()
  }, [clinicId])

  const loadSavedQRs = async () => {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/analytics/generated-links?clinic_id=${clinicId}&link_type=qr_code&limit=100`)
      if (res.ok) {
        const json = await res.json()
        setSavedQRs(json.data || [])
      }
    } finally {
      setLoadingList(false)
    }
  }

  const getBaseUrl = () => {
    if (destination === 'custom') return customUrl
    const dest = LINK_DESTINATIONS.find(d => d.id === destination)
    if (!dest) return ''
    return dest.getUrl(hpBaseUrl, dmaxBaseUrl, clinicSlug, clinicId)
  }

  const generateTrackingURL = () => {
    const baseUrl = getBaseUrl()
    if (!baseUrl) return ''
    const params = new URLSearchParams()
    const finalSource = source === 'custom' ? customSource : source
    if (finalSource) params.append('utm_source', finalSource)
    if (medium) params.append('utm_medium', medium)
    if (campaign) params.append('utm_campaign', campaign)
    const paramString = params.toString()
    return paramString ? `${baseUrl}?${paramString}` : baseUrl
  }

  const handleGeneratePreview = async () => {
    setGenerating(true)
    const trackingURL = generateTrackingURL()
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(trackingURL)}`
    setQrCodeUrl(qrApiUrl)
    setGenerating(false)
  }

  const handleSave = async () => {
    if (!qrCodeUrl) return
    setSaving(true)
    try {
      const trackingURL = generateTrackingURL()
      const finalSource = source === 'custom' ? customSource : source
      await fetch('/api/analytics/generated-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          link_type: 'qr_code',
          generated_url: trackingURL,
          destination_url: getBaseUrl(),
          utm_source: finalSource,
          utm_medium: medium,
          utm_campaign: campaign || null,
          label: label || `${finalSource}${campaign ? ` / ${campaign}` : ''}`,
          qr_code_url: qrCodeUrl,
        }),
      })
      await loadSavedQRs()
      setModalOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このQRコードを削除しますか？')) return
    await fetch(`/api/analytics/generated-links?id=${id}`, { method: 'DELETE' })
    setSavedQRs(prev => prev.filter(q => q.id !== id))
  }

  const handleDownload = (qr: SavedQR) => {
    if (!qr.qr_code_url) return
    const highResUrl = qr.qr_code_url.replace('300x300', '1000x1000')
    const filename = `qr_${qr.utm_source || 'unknown'}_${qr.utm_campaign || 'default'}.png`
    const link = document.createElement('a')
    link.href = highResUrl
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyUrl = (qr: SavedQR) => {
    navigator.clipboard.writeText(qr.generated_url)
    setCopiedId(qr.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const resetForm = () => {
    setDestination('dmax_booking')
    setSource('posting')
    setMedium('QR')
    setCampaign('')
    setCustomSource('')
    setCustomUrl('')
    setLabel('')
    setQrCodeUrl('')
  }

  const trackingURL = generateTrackingURL()
  const canGenerate = source && (source !== 'custom' || customSource) && (destination !== 'custom' || customUrl)

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QRコード管理
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">UTMパラメータ付きQRコードの作成・管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSavedQRs} disabled={loadingList}>
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-1" />
            新規追加
          </Button>
        </div>
      </div>

      {/* QRコード一覧 */}
      <Card>
        <CardContent className="p-0">
          {loadingList ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />読み込み中...
            </div>
          ) : savedQRs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <QrCode className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">QRコードがありません</p>
              <p className="text-xs mt-1">「新規追加」ボタンから作成してください</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">QRコード</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">名前 / 設定</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-600">作成日</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {savedQRs.map((qr) => (
                  <tr key={qr.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {qr.qr_code_url ? (
                        <img src={qr.qr_code_url} alt="QR" className="w-14 h-14 border rounded" />
                      ) : (
                        <div className="w-14 h-14 border rounded bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{qr.label || '（名前なし）'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                        {qr.utm_source && <span>流入元: <span className="font-medium">{qr.utm_source}</span></span>}
                        {qr.utm_medium && <span>/ {qr.utm_medium}</span>}
                        {qr.utm_campaign && <span className="text-blue-600">/ {qr.utm_campaign}</span>}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{qr.generated_url}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {qr.created_at ? new Date(qr.created_at).toLocaleDateString('ja-JP') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyUrl(qr)} title="URLをコピー">
                          {copiedId === qr.id
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <Copy className="w-4 h-4 text-gray-500" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(qr)} disabled={!qr.qr_code_url} title="ダウンロード">
                          <Download className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(qr.id)} title="削除">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 新規追加モーダル */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              新しいQRコードを作成
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 名前（ラベル） */}
            <div>
              <Label>名前（任意）</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="例: 渋谷チラシ2025年春" className="mt-1" />
              <p className="text-xs text-gray-400 mt-0.5">一覧で識別しやすい名前をつけてください</p>
            </div>

            {/* リンク先 */}
            <div>
              <Label>リンク先 *</Label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_DESTINATIONS.map(dest => (
                    <SelectItem key={dest.id} value={dest.id}>
                      <div className="flex items-center gap-2">
                        <dest.icon className="w-4 h-4" />
                        <span>{dest.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(destination === 'hp_top' || destination === 'hp_booking') && (
                <Input value={hpBaseUrl} onChange={e => setHpBaseUrl(e.target.value)} placeholder="https://example.com" className="mt-2" />
              )}
              {destination === 'custom' && (
                <Input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="https://example.com/landing" className="mt-2" />
              )}
            </div>

            {/* 流入元 */}
            <div>
              <Label>流入元 (utm_source) *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="mt-1">
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
                <Input value={customSource} onChange={e => setCustomSource(e.target.value)} placeholder="カスタム流入元" className="mt-2" />
              )}
            </div>

            {/* メディア */}
            <div>
              <Label>メディア (utm_medium)</Label>
              <Select value={medium} onValueChange={setMedium}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QR">QRコード</SelectItem>
                  <SelectItem value="offline">オフライン</SelectItem>
                  <SelectItem value="print">印刷物</SelectItem>
                  <SelectItem value="card">カード</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* キャンペーン */}
            <div>
              <Label>キャンペーン名 (utm_campaign)</Label>
              <Input value={campaign} onChange={e => setCampaign(e.target.value)} placeholder="例: shibuya_2025q1, 院内_202502" className="mt-1" />
              <p className="text-xs text-gray-400 mt-0.5">配布エリアや時期を入れると分析しやすいです</p>
            </div>

            {/* URL確認 */}
            <div>
              <Label>生成されるURL</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all border">
                {trackingURL || '（リンク先と流入元を設定してください）'}
              </div>
            </div>

            {/* QRコードプレビュー */}
            <div>
              <Button variant="outline" className="w-full" onClick={handleGeneratePreview} disabled={!canGenerate || generating}>
                {generating ? 'プレビュー生成中...' : 'QRコードをプレビュー'}
              </Button>
              {qrCodeUrl && (
                <div className="flex justify-center mt-3">
                  <div className="bg-white p-3 border-2 border-gray-200 rounded-lg">
                    <img src={qrCodeUrl} alt="QRコードプレビュー" className="w-40 h-40" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>キャンセル</Button>
            <Button onClick={handleSave} disabled={!qrCodeUrl || saving}>
              {saving ? '保存中...' : '保存する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
