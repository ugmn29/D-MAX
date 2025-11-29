'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react'

interface TrackingTagsSettingsProps {
  clinicId: string
}

interface TrackingTags {
  gtm_container_id: string
  gtm_enabled: boolean
  ga4_measurement_id: string
  ga4_enabled: boolean
  google_ads_conversion_id: string
  google_ads_conversion_label: string
  google_ads_enabled: boolean
  meta_pixel_id: string
  meta_pixel_enabled: boolean
  clarity_project_id: string
  clarity_enabled: boolean
  yahoo_ads_account_id: string
  yahoo_ads_enabled: boolean
  line_tag_id: string
  line_tag_enabled: boolean
}

export default function TrackingTagsSettings({ clinicId }: TrackingTagsSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tags, setTags] = useState<TrackingTags>({
    gtm_container_id: '',
    gtm_enabled: false,
    ga4_measurement_id: '',
    ga4_enabled: false,
    google_ads_conversion_id: '',
    google_ads_conversion_label: '',
    google_ads_enabled: false,
    meta_pixel_id: '',
    meta_pixel_enabled: false,
    clarity_project_id: '',
    clarity_enabled: false,
    yahoo_ads_account_id: '',
    yahoo_ads_enabled: false,
    line_tag_id: '',
    line_tag_enabled: false
  })

  useEffect(() => {
    loadTags()
  }, [clinicId])

  const loadTags = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/tracking-tags?clinic_id=${clinicId}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data) {
          setTags({
            gtm_container_id: json.data.gtm_container_id || '',
            gtm_enabled: json.data.gtm_enabled || false,
            ga4_measurement_id: json.data.ga4_measurement_id || '',
            ga4_enabled: json.data.ga4_enabled || false,
            google_ads_conversion_id: json.data.google_ads_conversion_id || '',
            google_ads_conversion_label: json.data.google_ads_conversion_label || '',
            google_ads_enabled: json.data.google_ads_enabled || false,
            meta_pixel_id: json.data.meta_pixel_id || '',
            meta_pixel_enabled: json.data.meta_pixel_enabled || false,
            clarity_project_id: json.data.clarity_project_id || '',
            clarity_enabled: json.data.clarity_enabled || false,
            yahoo_ads_account_id: json.data.yahoo_ads_account_id || '',
            yahoo_ads_enabled: json.data.yahoo_ads_enabled || false,
            line_tag_id: json.data.line_tag_id || '',
            line_tag_enabled: json.data.line_tag_enabled || false
          })
        }
      }
    } catch (error) {
      console.error('タグ設定取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/tracking-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          ...tags
        })
      })

      if (!res.ok) throw new Error('保存失敗')

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('タグ設定保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('クリップボードにコピーしました')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const enabledCount = [
    tags.gtm_enabled,
    tags.ga4_enabled,
    tags.google_ads_enabled,
    tags.meta_pixel_enabled,
    tags.clarity_enabled,
    tags.yahoo_ads_enabled,
    tags.line_tag_enabled
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* ステータスサマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">有効なタグ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {enabledCount} / 7
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">ステータス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${enabledCount > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {enabledCount > 0 ? '設定済み' : '未設定'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">推奨設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              GTM + GA4 + 広告タグ
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 保存完了メッセージ */}
      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            トラッキングタグ設定を保存しました
          </AlertDescription>
        </Alert>
      )}

      {/* Google Tag Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Tag Manager</CardTitle>
              <p className="text-sm text-gray-600 mt-1">すべてのタグを一元管理（推奨）</p>
            </div>
            <Switch
              checked={tags.gtm_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, gtm_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gtm_container_id">コンテナID</Label>
            <div className="flex gap-2">
              <Input
                id="gtm_container_id"
                value={tags.gtm_container_id}
                onChange={(e) => setTags({ ...tags, gtm_container_id: e.target.value })}
                placeholder="GTM-XXXXXXX"
                disabled={!tags.gtm_enabled}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://tagmanager.google.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例: GTM-XXXXXXX（7桁の英数字）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics 4 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Analytics 4</CardTitle>
              <p className="text-sm text-gray-600 mt-1">詳細なユーザー行動分析</p>
            </div>
            <Switch
              checked={tags.ga4_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, ga4_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ga4_measurement_id">測定ID</Label>
            <div className="flex gap-2">
              <Input
                id="ga4_measurement_id"
                value={tags.ga4_measurement_id}
                onChange={(e) => setTags({ ...tags, ga4_measurement_id: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                disabled={!tags.ga4_enabled}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://analytics.google.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例: G-XXXXXXXXXX（G- + 10桁の英数字）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google 広告</CardTitle>
              <p className="text-sm text-gray-600 mt-1">コンバージョントラッキング</p>
            </div>
            <Switch
              checked={tags.google_ads_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, google_ads_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="google_ads_conversion_id">コンバージョンID</Label>
            <Input
              id="google_ads_conversion_id"
              value={tags.google_ads_conversion_id}
              onChange={(e) => setTags({ ...tags, google_ads_conversion_id: e.target.value })}
              placeholder="AW-XXXXXXXXX"
              disabled={!tags.google_ads_enabled}
            />
            <p className="text-xs text-gray-500 mt-1">
              例: AW-123456789
            </p>
          </div>
          <div>
            <Label htmlFor="google_ads_conversion_label">コンバージョンラベル</Label>
            <Input
              id="google_ads_conversion_label"
              value={tags.google_ads_conversion_label}
              onChange={(e) => setTags({ ...tags, google_ads_conversion_label: e.target.value })}
              placeholder="xxxxxxxxxxxxxxxxxxx"
              disabled={!tags.google_ads_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* META Pixel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>META Pixel</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Facebook/Instagram広告トラッキング</p>
            </div>
            <Switch
              checked={tags.meta_pixel_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, meta_pixel_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meta_pixel_id">Pixel ID</Label>
            <div className="flex gap-2">
              <Input
                id="meta_pixel_id"
                value={tags.meta_pixel_id}
                onChange={(e) => setTags({ ...tags, meta_pixel_id: e.target.value })}
                placeholder="1234567890123456"
                disabled={!tags.meta_pixel_enabled}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://business.facebook.com/events_manager', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例: 1234567890123456（16桁の数字）
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Microsoft Clarity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Microsoft Clarity</CardTitle>
              <p className="text-sm text-gray-600 mt-1">ヒートマップ・セッションレコーディング</p>
            </div>
            <Switch
              checked={tags.clarity_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, clarity_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clarity_project_id">Project ID</Label>
            <div className="flex gap-2">
              <Input
                id="clarity_project_id"
                value={tags.clarity_project_id}
                onChange={(e) => setTags({ ...tags, clarity_project_id: e.target.value })}
                placeholder="abcd1234ef"
                disabled={!tags.clarity_enabled}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open('https://clarity.microsoft.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例: abcd1234ef（10桁の英数字）
            </p>
          </div>
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <strong>Microsoft Clarityとは？</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ユーザーの行動を可視化（ヒートマップ）</li>
                <li>実際の操作を録画（セッションレコーディング）</li>
                <li>クリック、スクロール、マウス移動を記録</li>
                <li>完全無料・無制限</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Yahoo広告 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Yahoo!広告</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Yahoo!検索広告トラッキング</p>
            </div>
            <Switch
              checked={tags.yahoo_ads_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, yahoo_ads_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="yahoo_ads_account_id">アカウントID</Label>
            <Input
              id="yahoo_ads_account_id"
              value={tags.yahoo_ads_account_id}
              onChange={(e) => setTags({ ...tags, yahoo_ads_account_id: e.target.value })}
              placeholder="Yahoo広告アカウントID"
              disabled={!tags.yahoo_ads_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* LINE Tag */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>LINE Tag</CardTitle>
              <p className="text-sm text-gray-600 mt-1">LINE広告トラッキング</p>
            </div>
            <Switch
              checked={tags.line_tag_enabled}
              onCheckedChange={(checked) => setTags({ ...tags, line_tag_enabled: checked })}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="line_tag_id">LINE Tag ID</Label>
            <Input
              id="line_tag_id"
              value={tags.line_tag_id}
              onChange={(e) => setTags({ ...tags, line_tag_id: e.target.value })}
              placeholder="LINE Tag ID"
              disabled={!tags.line_tag_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadTags}>
          リセット
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* 設定ガイド */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>設定後の確認:</strong> タグが正しく動作しているか、Google Tag Assistant や META Pixel Helper などのブラウザ拡張機能で確認してください。
          詳細な設定手順は<a href="/docs/GTM_SETUP_GUIDE.md" className="text-blue-600 underline" target="_blank">設定ガイド</a>をご確認ください。
        </AlertDescription>
      </Alert>
    </div>
  )
}
