'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Save, Upload } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

interface ConnectionSettingsTabProps {
  clinicId: string
}

export function ConnectionSettingsTab({ clinicId }: ConnectionSettingsTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState({
    email: {
      enabled: false,
      smtpServer: '',
      smtpPort: 587,
      username: '',
      password: '',
      fromEmail: ''
    },
    sms: {
      enabled: false,
      provider: '',
      apiKey: '',
      fromNumber: ''
    },
    line: {
      enabled: false,
      channelId: '',
      channelSecret: '',
      accessToken: '',
      webhookUrl: ''
    }
  })

  useEffect(() => {
    loadSettings()
  }, [clinicId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const clinicSettings = await getClinicSettings(clinicId)

      setSettings(clinicSettings.notificationConnection || {
        email: {
          enabled: false,
          smtpServer: '',
          smtpPort: 587,
          username: '',
          password: '',
          fromEmail: ''
        },
        sms: {
          enabled: false,
          provider: '',
          apiKey: '',
          fromNumber: ''
        },
        line: {
          enabled: false,
          channelId: '',
          channelSecret: '',
          accessToken: '',
          webhookUrl: ''
        }
      })
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // APIエンドポイント経由で保存
      const response = await fetch('/api/clinic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          setting_key: 'notificationConnection',
          setting_value: settings
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存に失敗しました')
      }

      const result = await response.json()
      console.log('保存成功:', result)
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">接続設定</h2>
          <p className="text-gray-600">メール・SMS・LINE APIの接続設定を行います</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* メール設定 */}
        <Card>
          <CardHeader>
            <CardTitle>メール通知設定</CardTitle>
            <CardDescription>SMTP経由でメール通知を送信します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="email_enabled"
                checked={settings.email.enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    email: { ...prev.email, enabled: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="email_enabled" className="font-medium">
                メール通知を有効にする
              </Label>
            </div>

            {settings.email.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="smtp_server">SMTPサーバー</Label>
                  <Input
                    id="smtp_server"
                    value={settings.email.smtpServer}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpServer: e.target.value }
                      }))
                    }
                    placeholder="例: smtp.gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp_port">SMTPポート</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, smtpPort: parseInt(e.target.value) || 587 }
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email_username">ユーザー名</Label>
                  <Input
                    id="email_username"
                    value={settings.email.username}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, username: e.target.value }
                      }))
                    }
                    placeholder="例: your-email@gmail.com"
                  />
                </div>
                <div>
                  <Label htmlFor="email_password">パスワード</Label>
                  <Input
                    id="email_password"
                    type="password"
                    value={settings.email.password}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, password: e.target.value }
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="from_email">送信者メールアドレス</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.email.fromEmail}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, fromEmail: e.target.value }
                      }))
                    }
                    placeholder="例: noreply@yourclinic.com"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SMS設定 */}
        <Card>
          <CardHeader>
            <CardTitle>SMS通知設定</CardTitle>
            <CardDescription>
              SMS通知の契約および配信費用は、本システムの月額利用料とは別に、クリニック側の負担となります。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="sms_enabled"
                checked={settings.sms.enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    sms: { ...prev.sms, enabled: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="sms_enabled" className="font-medium">
                SMS通知を有効にする
              </Label>
            </div>

            {settings.sms.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="sms_provider">SMSプロバイダー</Label>
                  <select
                    id="sms_provider"
                    value={settings.sms.provider}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, provider: e.target.value }
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">プロバイダーを選択</option>
                    <option value="twilio">Twilio</option>
                    <option value="aws_sns">AWS SNS</option>
                    <option value="other">その他</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="sms_api_key">APIキー</Label>
                  <Input
                    id="sms_api_key"
                    type="password"
                    value={settings.sms.apiKey}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, apiKey: e.target.value }
                      }))
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="sms_from_number">送信者番号</Label>
                  <Input
                    id="sms_from_number"
                    value={settings.sms.fromNumber}
                    onChange={(e) =>
                      setSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, fromNumber: e.target.value }
                      }))
                    }
                    placeholder="例: +81-90-1234-5678"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LINE設定 */}
        <Card>
          <CardHeader>
            <CardTitle>LINE公式アカウント設定</CardTitle>
            <CardDescription>
              LINE通知の契約および配信費用は、本システムの月額利用料とは別に、クリニック側の負担となります。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="line_enabled"
                checked={settings.line.enabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({
                    ...prev,
                    line: { ...prev.line, enabled: checked as boolean }
                  }))
                }
              />
              <Label htmlFor="line_enabled" className="font-medium">
                LINE通知を有効にする
              </Label>
            </div>

            {settings.line.enabled && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="line_channel_id">チャンネルID</Label>
                    <Input
                      id="line_channel_id"
                      value={settings.line.channelId}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          line: { ...prev.line, channelId: e.target.value }
                        }))
                      }
                      placeholder="例: 1234567890"
                    />
                  </div>
                  <div>
                    <Label htmlFor="line_channel_secret">チャンネルシークレット</Label>
                    <Input
                      id="line_channel_secret"
                      type="password"
                      value={settings.line.channelSecret}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          line: { ...prev.line, channelSecret: e.target.value }
                        }))
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="line_access_token">アクセストークン</Label>
                    <Textarea
                      id="line_access_token"
                      value={settings.line.accessToken}
                      onChange={(e) =>
                        setSettings(prev => ({
                          ...prev,
                          line: { ...prev.line, accessToken: e.target.value }
                        }))
                      }
                      rows={3}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Webhook URL</h4>
                  <code className="block bg-white px-3 py-2 rounded border border-blue-200 text-sm font-mono">
                    https://your-domain.com/api/line/webhook
                  </code>
                  <p className="text-sm text-blue-700 mt-2">
                    この URL を LINE Developers コンソールの Webhook URL に設定してください。
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">リッチメニュー設定</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    患者連携前・連携後のリッチメニュー画像をアップロードしてください（推奨サイズ: 2500x1686px）
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 mb-1">連携前メニュー</p>
                      <p className="text-xs text-gray-500 mb-3">クリックしてアップロード</p>
                      <Button variant="outline" size="sm">
                        画像を選択
                      </Button>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 mb-1">連携後メニュー</p>
                      <p className="text-xs text-gray-500 mb-3">クリックしてアップロード</p>
                      <Button variant="outline" size="sm">
                        画像を選択
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
