'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, CheckCircle, AlertCircle, Settings } from 'lucide-react'

interface SystemSettings {
  issuer_company_name: string
  issuer_postal_code: string
  issuer_prefecture: string
  issuer_city: string
  issuer_address_line: string
  issuer_phone: string
  issuer_registration_number: string
  sms_unit_price_jpy: number
}

const DEFAULT_SETTINGS: SystemSettings = {
  issuer_company_name: '',
  issuer_postal_code: '',
  issuer_prefecture: '',
  issuer_city: '',
  issuer_address_line: '',
  issuer_phone: '',
  issuer_registration_number: '',
  sms_unit_price_jpy: 10,
}

export default function AdminSettingsPage() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [sysSettings, setSysSettings] = useState<SystemSettings>(DEFAULT_SETTINGS)
  const [sysSaving, setSysSaving] = useState(false)
  const [sysSaved, setSysSaved] = useState(false)
  const [sysError, setSysError] = useState('')

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setSysSettings(prev => ({ ...prev, ...data }))
        }
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードと確認用パスワードが一致しません')
      return
    }
    if (newPassword.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'パスワードの変更に失敗しました')
        return
      }
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setLoading(false)
    }
  }

  const handleSysSettingsSave = async () => {
    setSysSaving(true)
    setSysError('')
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sysSettings),
      })
      const data = await res.json()
      if (!res.ok) {
        setSysError(data.error || '保存に失敗しました')
        return
      }
      setSysSaved(true)
      setTimeout(() => setSysSaved(false), 2000)
    } catch {
      setSysError('サーバーに接続できません')
    } finally {
      setSysSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理者設定</h1>
        <p className="text-sm text-gray-500 mt-1">管理者アカウントの設定を変更します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4 text-blue-600" />
            パスワード変更
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">管理者メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@d-smart.jp"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">現在のパスワード</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">新しいパスワード（8文字以上）</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                パスワードを変更しました
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '変更中...' : 'パスワードを変更'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* システム設定（請求書発行者情報・SMS単価） */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="w-4 h-4 text-blue-600" />
            システム設定
          </CardTitle>
          <p className="text-sm text-gray-500">請求書・領収書の発行者情報とSMS単価を設定します</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>発行者名（会社名）</Label>
              <Input
                value={sysSettings.issuer_company_name}
                onChange={e => setSysSettings(p => ({ ...p, issuer_company_name: e.target.value }))}
                placeholder="株式会社D-MAX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>郵便番号</Label>
              <Input
                value={sysSettings.issuer_postal_code}
                onChange={e => setSysSettings(p => ({ ...p, issuer_postal_code: e.target.value }))}
                placeholder="000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>都道府県</Label>
              <Input
                value={sysSettings.issuer_prefecture}
                onChange={e => setSysSettings(p => ({ ...p, issuer_prefecture: e.target.value }))}
                placeholder="東京都"
              />
            </div>
            <div className="space-y-1.5">
              <Label>市区町村</Label>
              <Input
                value={sysSettings.issuer_city}
                onChange={e => setSysSettings(p => ({ ...p, issuer_city: e.target.value }))}
                placeholder="渋谷区"
              />
            </div>
            <div className="space-y-1.5">
              <Label>番地・建物名</Label>
              <Input
                value={sysSettings.issuer_address_line}
                onChange={e => setSysSettings(p => ({ ...p, issuer_address_line: e.target.value }))}
                placeholder="1-2-3 ○○ビル"
              />
            </div>
            <div className="space-y-1.5">
              <Label>電話番号</Label>
              <Input
                value={sysSettings.issuer_phone}
                onChange={e => setSysSettings(p => ({ ...p, issuer_phone: e.target.value }))}
                placeholder="03-0000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>適格請求書登録番号（任意）</Label>
              <Input
                value={sysSettings.issuer_registration_number}
                onChange={e => setSysSettings(p => ({ ...p, issuer_registration_number: e.target.value }))}
                placeholder="T1234567890123"
              />
            </div>
            <div className="space-y-1.5">
              <Label>SMS送信料（¥/通）</Label>
              <Input
                type="number"
                min={0}
                value={sysSettings.sms_unit_price_jpy}
                onChange={e => setSysSettings(p => ({ ...p, sms_unit_price_jpy: Number(e.target.value) }))}
              />
            </div>
          </div>

          {sysError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {sysError}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={handleSysSettingsSave} disabled={sysSaving}>
              {sysSaving ? '保存中...' : '保存'}
            </Button>
            {sysSaved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                保存しました
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
