'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Link2,
  Copy,
  CheckCircle,
  Globe,
  Calendar,
  ExternalLink,
  Youtube,
  Instagram,
  Facebook,
  MessageCircle,
  MapPin,
  Music2,
  Twitter,
  Linkedin
} from 'lucide-react'

interface SNSLinkGeneratorProps {
  clinicId: string
  clinicSlug?: string
}

// SNSプラットフォームのプリセット
const SNS_PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    description: 'プロフィール欄のリンク',
    icon: Instagram,
    defaultMedium: 'social',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    placements: [
      { id: 'profile', label: 'プロフィール欄', campaign: 'profile' },
      { id: 'story_highlight', label: 'ストーリーズハイライト', campaign: 'story_highlight' },
      { id: 'post', label: '投稿（キャプション）', campaign: 'post' },
      { id: 'reel', label: 'リール', campaign: 'reel' },
      { id: 'story_link', label: 'ストーリーリンク', campaign: 'story_link' },
    ],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    description: '概要欄・コメント欄のリンク',
    icon: Youtube,
    defaultMedium: 'social',
    color: 'bg-red-600',
    placements: [
      { id: 'channel_about', label: 'チャンネル概要', campaign: 'channel_about' },
      { id: 'video_description', label: '動画説明欄', campaign: 'video_description' },
      { id: 'pinned_comment', label: '固定コメント', campaign: 'pinned_comment' },
      { id: 'end_screen', label: '終了画面', campaign: 'end_screen' },
      { id: 'card', label: 'カード', campaign: 'card' },
    ],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    description: 'ページ・投稿のリンク',
    icon: Facebook,
    defaultMedium: 'social',
    color: 'bg-blue-600',
    placements: [
      { id: 'page_about', label: 'ページ基本情報', campaign: 'page_about' },
      { id: 'post', label: '投稿', campaign: 'post' },
      { id: 'story', label: 'ストーリー', campaign: 'story' },
      { id: 'messenger', label: 'Messenger', campaign: 'messenger' },
    ],
  },
  {
    id: 'line',
    label: 'LINE公式アカウント',
    description: 'リッチメニュー・メッセージ内リンク',
    icon: MessageCircle,
    defaultMedium: 'social',
    color: 'bg-green-500',
    placements: [
      { id: 'rich_menu', label: 'リッチメニュー', campaign: 'rich_menu' },
      { id: 'message', label: 'メッセージ配信', campaign: 'message' },
      { id: 'greeting', label: 'あいさつメッセージ', campaign: 'greeting' },
      { id: 'auto_reply', label: '自動応答', campaign: 'auto_reply' },
      { id: 'voom', label: 'LINE VOOM', campaign: 'voom' },
    ],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    description: 'プロフィール欄のリンク',
    icon: Music2,
    defaultMedium: 'social',
    color: 'bg-black',
    placements: [
      { id: 'profile', label: 'プロフィール欄', campaign: 'profile' },
      { id: 'video_caption', label: '動画キャプション', campaign: 'video_caption' },
      { id: 'comment', label: 'コメント', campaign: 'comment' },
    ],
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    description: 'プロフィール・ツイート内リンク',
    icon: Twitter,
    defaultMedium: 'social',
    color: 'bg-gray-900',
    placements: [
      { id: 'profile', label: 'プロフィール欄', campaign: 'profile' },
      { id: 'tweet', label: 'ツイート/ポスト', campaign: 'tweet' },
      { id: 'pinned_tweet', label: '固定ツイート', campaign: 'pinned_tweet' },
      { id: 'dm', label: 'DM自動返信', campaign: 'dm' },
    ],
  },
  {
    id: 'google_business',
    label: 'Googleビジネスプロフィール',
    description: 'MEO対策・マップからの流入',
    icon: MapPin,
    defaultMedium: 'organic',
    color: 'bg-blue-500',
    placements: [
      { id: 'website', label: 'ウェブサイトURL', campaign: 'website' },
      { id: 'booking', label: '予約リンク', campaign: 'booking' },
      { id: 'post', label: '投稿', campaign: 'post' },
      { id: 'product', label: '商品/サービス', campaign: 'product' },
    ],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    description: 'プロフィール・投稿のリンク',
    icon: Linkedin,
    defaultMedium: 'social',
    color: 'bg-blue-700',
    placements: [
      { id: 'profile', label: 'プロフィール欄', campaign: 'profile' },
      { id: 'post', label: '投稿', campaign: 'post' },
      { id: 'company_page', label: '会社ページ', campaign: 'company_page' },
    ],
  },
  {
    id: 'other_website',
    label: 'その他Webサイト',
    description: '外部サイトからのリンク',
    icon: Globe,
    defaultMedium: 'referral',
    color: 'bg-gray-600',
    placements: [
      { id: 'banner', label: 'バナー広告', campaign: 'banner' },
      { id: 'text_link', label: 'テキストリンク', campaign: 'text_link' },
      { id: 'blog', label: 'ブログ記事', campaign: 'blog' },
      { id: 'partner', label: '提携サイト', campaign: 'partner' },
    ],
  },
  {
    id: 'custom',
    label: 'カスタム',
    description: '任意のソースを指定',
    icon: ExternalLink,
    defaultMedium: 'referral',
    color: 'bg-gray-400',
    placements: [],
  },
]

// リンク先のプリセット
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

interface GeneratedLink {
  platform: string
  platformLabel: string
  placementLabel: string
  destination: string
  url: string
  createdAt: Date
}

export default function SNSLinkGenerator({ clinicId, clinicSlug }: SNSLinkGeneratorProps) {
  const [platform, setPlatform] = useState('instagram')
  const [placement, setPlacement] = useState('profile')
  const [customSource, setCustomSource] = useState('')
  const [customPlacement, setCustomPlacement] = useState('')
  const [destination, setDestination] = useState('hp_top')
  const [hpBaseUrl, setHpBaseUrl] = useState('https://fuku-dental.com')
  const [customUrl, setCustomUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [generatedLinks, setGeneratedLinks] = useState<GeneratedLink[]>([])

  const dmaxBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dmax.com'

  // クリニック設定からHP URLを取得（将来的にはDBから取得）
  useEffect(() => {
    // TODO: クリニック設定からHP URLを取得
  }, [clinicId])

  // プラットフォーム変更時にplacementをリセット
  useEffect(() => {
    const selectedPlatform = SNS_PLATFORMS.find(p => p.id === platform)
    if (selectedPlatform && selectedPlatform.placements.length > 0) {
      setPlacement(selectedPlatform.placements[0].id)
    } else {
      setPlacement('')
    }
  }, [platform])

  const getBaseUrl = () => {
    if (destination === 'custom') {
      return customUrl
    }
    const dest = LINK_DESTINATIONS.find(d => d.id === destination)
    if (!dest) return ''
    return dest.getUrl(hpBaseUrl, dmaxBaseUrl, clinicSlug, clinicId)
  }

  const getSelectedPlatform = () => SNS_PLATFORMS.find(p => p.id === platform)

  const getSelectedPlacement = () => {
    const selectedPlatform = getSelectedPlatform()
    if (!selectedPlatform) return null
    return selectedPlatform.placements.find(p => p.id === placement)
  }

  const getCampaignValue = () => {
    if (platform === 'custom') {
      return customPlacement || 'custom'
    }
    const selectedPlacement = getSelectedPlacement()
    return selectedPlacement?.campaign || placement
  }

  const generateTrackingURL = () => {
    const baseUrl = getBaseUrl()
    if (!baseUrl) return ''

    const params = new URLSearchParams()
    const selectedPlatform = getSelectedPlatform()
    const finalSource = platform === 'custom' ? customSource : platform
    const campaignValue = getCampaignValue()

    if (finalSource) params.append('utm_source', finalSource)
    if (selectedPlatform) params.append('utm_medium', selectedPlatform.defaultMedium)
    if (campaignValue) params.append('utm_campaign', campaignValue)

    const paramString = params.toString()
    return paramString ? `${baseUrl}?${paramString}` : baseUrl
  }

  const copyURL = () => {
    const url = generateTrackingURL()
    if (!url) return

    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    // 生成履歴に追加
    const selectedPlatform = getSelectedPlatform()
    const selectedPlacement = getSelectedPlacement()
    const placementLabel = platform === 'custom'
      ? customPlacement || 'カスタム'
      : selectedPlacement?.label || ''
    const newLink: GeneratedLink = {
      platform: platform === 'custom' ? customSource : platform,
      platformLabel: platform === 'custom'
        ? customSource
        : (selectedPlatform?.label || platform),
      placementLabel: placementLabel,
      destination: destination,
      url: url,
      createdAt: new Date(),
    }
    setGeneratedLinks(prev => [newLink, ...prev.slice(0, 9)]) // 最新10件を保持
  }

  const trackingURL = generateTrackingURL()
  const selectedPlatform = getSelectedPlatform()

  const isValid = () => {
    if (platform === 'custom' && !customSource) return false
    if (destination === 'custom' && !customUrl) return false
    if ((destination === 'hp_top' || destination === 'hp_booking') && !hpBaseUrl) return false
    return true
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            SNS/Web用トラッキングリンク生成
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            SNSプロフィール欄やWebサイトに設置するUTMパラメータ付きリンクを生成します
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* プラットフォーム選択 */}
          <div>
            <Label>設置場所（プラットフォーム） *</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNS_PLATFORMS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <p.icon className="w-4 h-4" />
                      <span>{p.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlatform && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedPlatform.description}
              </p>
            )}
          </div>

          {/* カスタムソース入力 */}
          {platform === 'custom' && (
            <div className="space-y-4">
              <div>
                <Label>カスタムソース名 *</Label>
                <Input
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="例: partner_site, email_signature"
                />
              </div>
              <div>
                <Label>設置場所の詳細</Label>
                <Input
                  value={customPlacement}
                  onChange={(e) => setCustomPlacement(e.target.value)}
                  placeholder="例: header_banner, footer_link"
                />
              </div>
            </div>
          )}

          {/* 設置場所の詳細選択 */}
          {platform !== 'custom' && selectedPlatform && selectedPlatform.placements.length > 0 && (
            <div>
              <Label>設置場所の詳細 *</Label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedPlatform.placements.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                同じプラットフォーム内でも設置場所によって効果が異なります
              </p>
            </div>
          )}

          {/* リンク先選択 */}
          <div>
            <Label>リンク先 *</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINK_DESTINATIONS.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>
                    <div className="flex items-center gap-2">
                      <dest.icon className="w-4 h-4" />
                      <span>{dest.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {LINK_DESTINATIONS.find(d => d.id === destination)?.description}
            </p>
          </div>

          {/* HP URL設定 */}
          {(destination === 'hp_top' || destination === 'hp_booking') && (
            <div>
              <Label>ホームページURL</Label>
              <Input
                value={hpBaseUrl}
                onChange={(e) => setHpBaseUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          )}

          {/* カスタムURL入力 */}
          {destination === 'custom' && (
            <div>
              <Label>カスタムURL *</Label>
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/landing"
              />
            </div>
          )}

          {/* 生成されるURL */}
          <div>
            <Label>生成されるURL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={trackingURL}
                readOnly
                className="bg-gray-50 text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyURL}
                disabled={!isValid()}
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* コピーボタン */}
          <Button
            onClick={copyURL}
            disabled={!isValid()}
            className="w-full"
          >
            <Copy className="w-4 h-4 mr-2" />
            リンクをコピー
          </Button>

          {/* 使い方説明 */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <strong>使い方:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>プラットフォームとリンク先を選択</li>
                <li>生成されたURLをコピー</li>
                <li>各SNSのプロフィール欄やリンク設定に貼り付け</li>
                <li>アナリティクス画面で流入数を確認</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* 生成履歴 */}
      {generatedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">最近生成したリンク</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{link.platformLabel}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {link.placementLabel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{link.url}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(link.url)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 活用例 */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>プラットフォーム別活用例:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Instagram</strong>: プロフィールの「ウェブサイト」欄に設定</li>
            <li><strong>YouTube</strong>: チャンネル概要欄・動画説明欄に記載</li>
            <li><strong>LINE公式</strong>: リッチメニューのボタンリンクに設定</li>
            <li><strong>Googleビジネス</strong>: ウェブサイトURLに設定してMEO効果を測定</li>
            <li><strong>TikTok</strong>: プロフィールのウェブサイト欄に設定</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
