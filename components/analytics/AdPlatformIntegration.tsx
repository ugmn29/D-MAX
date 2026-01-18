'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Settings,
  TrendingUp,
  DollarSign
} from 'lucide-react'

interface AdPlatformIntegrationProps {
  clinicId: string
}

interface PlatformConfig {
  id: string
  name: string
  icon: string
  description: string
  connected: boolean
  lastSync?: string
  spend?: number
  conversions?: number
  setupUrl: string
  fields: { key: string; label: string; placeholder: string; type?: string }[]
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🔍',
    description: 'Google広告の広告費・コンバージョンを自動取得',
    connected: false,
    setupUrl: 'https://ads.google.com/aw/overview',
    fields: [
      { key: 'customer_id', label: 'カスタマーID', placeholder: '123-456-7890' },
      { key: 'api_key', label: 'API認証キー', placeholder: '', type: 'password' },
    ],
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads (Facebook/Instagram)',
    icon: '📘',
    description: 'Facebook・Instagram広告の広告費・リーチを自動取得',
    connected: false,
    setupUrl: 'https://business.facebook.com/adsmanager',
    fields: [
      { key: 'ad_account_id', label: '広告アカウントID', placeholder: 'act_123456789' },
      { key: 'access_token', label: 'アクセストークン', placeholder: '', type: 'password' },
    ],
  },
  {
    id: 'line_ads',
    name: 'LINE Ads',
    icon: '💚',
    description: 'LINE広告の広告費・友だち追加数を自動取得',
    connected: false,
    setupUrl: 'https://admanager.line.biz/',
    fields: [
      { key: 'account_id', label: 'アカウントID', placeholder: '' },
      { key: 'api_key', label: 'APIキー', placeholder: '', type: 'password' },
    ],
  },
  {
    id: 'yahoo_ads',
    name: 'Yahoo! 広告',
    icon: '🔴',
    description: 'Yahoo!広告の広告費・クリック数を自動取得',
    connected: false,
    setupUrl: 'https://ads.yahoo.co.jp/',
    fields: [
      { key: 'account_id', label: 'アカウントID', placeholder: '' },
      { key: 'api_key', label: 'APIキー', placeholder: '', type: 'password' },
    ],
  },
]

export default function AdPlatformIntegration({ clinicId }: AdPlatformIntegrationProps) {
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(PLATFORMS)
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})
  const [syncing, setSyncing] = useState<string | null>(null)
  const [autoSync, setAutoSync] = useState(true)

  const handleConnect = async (platformId: string) => {
    setSyncing(platformId)
    // 実際はAPIに接続処理を送信
    await new Promise(resolve => setTimeout(resolve, 2000))

    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? {
            ...p,
            connected: true,
            lastSync: new Date().toLocaleString('ja-JP'),
            spend: Math.floor(Math.random() * 100000) + 50000,
            conversions: Math.floor(Math.random() * 50) + 10,
          }
        : p
    ))
    setSyncing(null)
    setExpandedPlatform(null)
  }

  const handleDisconnect = (platformId: string) => {
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, connected: false, lastSync: undefined, spend: undefined, conversions: undefined }
        : p
    ))
  }

  const handleSync = async (platformId: string) => {
    setSyncing(platformId)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setPlatforms(prev => prev.map(p =>
      p.id === platformId
        ? { ...p, lastSync: new Date().toLocaleString('ja-JP') }
        : p
    ))
    setSyncing(null)
  }

  const connectedCount = platforms.filter(p => p.connected).length
  const totalSpend = platforms.reduce((sum, p) => sum + (p.spend || 0), 0)
  const totalConversions = platforms.reduce((sum, p) => sum + (p.conversions || 0), 0)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            広告プラットフォーム連携
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            各広告プラットフォームと連携して広告費・効果を自動取得します
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
            <span className="text-sm">自動同期</span>
          </div>
        </div>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">接続済みプラットフォーム</p>
                <p className="text-2xl font-bold">{connectedCount}/{platforms.length}</p>
              </div>
              <Link2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今月の広告費（合計）</p>
                <p className="text-2xl font-bold">¥{totalSpend.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">今月のCV（合計）</p>
                <p className="text-2xl font-bold">{totalConversions}件</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* プラットフォーム一覧 */}
      <div className="space-y-4">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={platform.connected ? 'border-green-200' : ''}
          >
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{platform.name}</h3>
                      {platform.connected ? (
                        <Badge className="bg-green-100 text-green-700">接続済み</Badge>
                      ) : (
                        <Badge variant="outline">未接続</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>

                    {platform.connected && (
                      <div className="mt-3 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">最終同期</p>
                          <p className="text-sm font-medium">{platform.lastSync}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">今月の広告費</p>
                          <p className="text-sm font-medium">¥{platform.spend?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">今月のCV</p>
                          <p className="text-sm font-medium">{platform.conversions}件</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {platform.connected ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(platform.id)}
                        disabled={syncing === platform.id}
                      >
                        <RefreshCw className={`w-4 h-4 mr-1 ${syncing === platform.id ? 'animate-spin' : ''}`} />
                        同期
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedPlatform(
                          expandedPlatform === platform.id ? null : platform.id
                        )}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        設定
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setExpandedPlatform(
                        expandedPlatform === platform.id ? null : platform.id
                      )}
                    >
                      接続する
                    </Button>
                  )}
                </div>
              </div>

              {/* 展開時の設定フォーム */}
              {expandedPlatform === platform.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-4">
                    {platform.fields.map((field) => (
                      <div key={field.key}>
                        <Label>{field.label}</Label>
                        <Input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={formData[platform.id]?.[field.key] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [platform.id]: {
                              ...(prev[platform.id] || {}),
                              [field.key]: e.target.value,
                            }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={platform.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {platform.name}の管理画面を開く
                      </a>

                      <div className="flex gap-2">
                        {platform.connected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDisconnect(platform.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1 text-red-500" />
                            接続解除
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          disabled={syncing === platform.id}
                        >
                          {syncing === platform.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              接続中...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              {platform.connected ? '再接続' : '接続'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 手動入力の案内 */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription className="text-sm">
          <strong>APIキーの取得方法:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Google Ads:</strong> Google Ads API Centerでプロジェクトを作成し、APIキーを取得</li>
            <li><strong>Meta Ads:</strong> Meta for Developersでアプリを作成し、アクセストークンを取得</li>
            <li><strong>LINE Ads:</strong> LINE Developers Consoleで認証情報を取得</li>
          </ul>
          <p className="mt-2">
            API連携が難しい場合は、「広告費管理」タブから手動で広告費を入力することもできます。
          </p>
        </AlertDescription>
      </Alert>

      {/* 手動入力カード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">広告費の手動入力</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            API連携を使わず、手動で広告費を入力することもできます。
          </p>
          <Button variant="outline">
            広告費管理画面を開く
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
