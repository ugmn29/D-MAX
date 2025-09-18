'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function NotificationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState({
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
      accessToken: ''
    },
    reminders: {
      beforeAppointment: 24,
      afterBooking: 0,
      noShow: 0
    },
    failureManagement: {
      enabled: true,
      retryAttempts: 3,
      retryInterval: 60
    }
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        
        setNotificationSettings(settings.notifications || {
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
            accessToken: ''
          },
          reminders: {
            beforeAppointment: 24,
            afterBooking: 0,
            noShow: 0
          },
          failureManagement: {
            enabled: true,
            retryAttempts: 3,
            retryInterval: 60
          }
        })
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)
      await setClinicSetting(DEMO_CLINIC_ID, 'notifications', notificationSettings)
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* 左サイドバー */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">通知設定</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">通知設定</div>
                <div className="text-sm text-blue-600">メール・SMS・LINE通知の設定</div>
              </div>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">通知設定</h2>
                <p className="text-gray-600">メール・SMS・LINE通知の設定を行います</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* メール通知設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>メール通知設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="email_enabled"
                    checked={notificationSettings.email.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        email: { ...prev.email, enabled: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="email_enabled" className="font-medium">
                    メール通知を有効にする
                  </Label>
                </div>
                
                {notificationSettings.email.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp_server">SMTPサーバー</Label>
                      <Input
                        id="smtp_server"
                        value={notificationSettings.email.smtpServer}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.email.smtpPort}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.email.username}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.email.password}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.email.fromEmail}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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

            {/* SMS通知設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>SMS通知設定</CardTitle>
                <p className="text-sm text-gray-600">
                  SMS通知の契約および配信費用は、本システムの月額利用料とは別に、クリニック側の負担となります。
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="sms_enabled"
                    checked={notificationSettings.sms.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        sms: { ...prev.sms, enabled: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="sms_enabled" className="font-medium">
                    SMS通知を有効にする
                  </Label>
                </div>
                
                {notificationSettings.sms.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sms_provider">SMSプロバイダー</Label>
                      <select
                        id="sms_provider"
                        value={notificationSettings.sms.provider}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.sms.apiKey}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.sms.fromNumber}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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

            {/* LINE通知設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>LINE通知設定</CardTitle>
                <p className="text-sm text-gray-600">
                  LINE通知の契約および配信費用は、本システムの月額利用料とは別に、クリニック側の負担となります。
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="line_enabled"
                    checked={notificationSettings.line.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        line: { ...prev.line, enabled: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="line_enabled" className="font-medium">
                    LINE通知を有効にする
                  </Label>
                </div>
                
                {notificationSettings.line.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="line_channel_id">チャンネルID</Label>
                      <Input
                        id="line_channel_id"
                        value={notificationSettings.line.channelId}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
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
                        value={notificationSettings.line.channelSecret}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
                            ...prev,
                            line: { ...prev.line, channelSecret: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="line_access_token">アクセストークン</Label>
                      <Input
                        id="line_access_token"
                        type="password"
                        value={notificationSettings.line.accessToken}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
                            ...prev,
                            line: { ...prev.line, accessToken: e.target.value }
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* リマインド設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>リマインド設定</CardTitle>
                <p className="text-sm text-gray-600">通知の送信タイミングを設定します</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reminder_before">予約前（時間）</Label>
                    <Input
                      id="reminder_before"
                      type="number"
                      min="0"
                      max="168"
                      value={notificationSettings.reminders.beforeAppointment}
                      onChange={(e) => 
                        setNotificationSettings(prev => ({
                          ...prev,
                          reminders: { ...prev.reminders, beforeAppointment: parseInt(e.target.value) || 24 }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminder_after">予約後（時間）</Label>
                    <Input
                      id="reminder_after"
                      type="number"
                      min="0"
                      max="168"
                      value={notificationSettings.reminders.afterBooking}
                      onChange={(e) => 
                        setNotificationSettings(prev => ({
                          ...prev,
                          reminders: { ...prev.reminders, afterBooking: parseInt(e.target.value) || 0 }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="reminder_noshow">無断キャンセル後（時間）</Label>
                    <Input
                      id="reminder_noshow"
                      type="number"
                      min="0"
                      max="168"
                      value={notificationSettings.reminders.noShow}
                      onChange={(e) => 
                        setNotificationSettings(prev => ({
                          ...prev,
                          reminders: { ...prev.reminders, noShow: parseInt(e.target.value) || 0 }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 送信失敗管理 */}
            <Card>
              <CardHeader>
                <CardTitle>送信失敗管理</CardTitle>
                <p className="text-sm text-gray-600">送信失敗時の再送信設定を行います</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="failure_enabled"
                    checked={notificationSettings.failureManagement.enabled}
                    onCheckedChange={(checked) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        failureManagement: { ...prev.failureManagement, enabled: checked as boolean }
                      }))
                    }
                  />
                  <Label htmlFor="failure_enabled" className="font-medium">
                    送信失敗管理を有効にする
                  </Label>
                </div>
                
                {notificationSettings.failureManagement.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="retry_attempts">再送信回数</Label>
                      <Input
                        id="retry_attempts"
                        type="number"
                        min="1"
                        max="10"
                        value={notificationSettings.failureManagement.retryAttempts}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
                            ...prev,
                            failureManagement: { ...prev.failureManagement, retryAttempts: parseInt(e.target.value) || 3 }
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="retry_interval">再送信間隔（分）</Label>
                      <Input
                        id="retry_interval"
                        type="number"
                        min="1"
                        max="1440"
                        value={notificationSettings.failureManagement.retryInterval}
                        onChange={(e) => 
                          setNotificationSettings(prev => ({
                            ...prev,
                            failureManagement: { ...prev.failureManagement, retryInterval: parseInt(e.target.value) || 60 }
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
