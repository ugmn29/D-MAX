'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, AlertCircle, CheckCircle, Trash2, Database, CreditCard, RefreshCw, FileText, UserPlus, Users, Upload, Pencil, X } from 'lucide-react'

interface SeedResult {
  success: boolean
  message: string
}

interface PlanMaster {
  id: string
  name: string
  monthly_fee: number
  is_active: boolean
}

export default function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'basic' | 'contract' | 'staff' | 'setup' | 'danger'>('basic')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [trainingSeedLoading, setTrainingSeedLoading] = useState(false)
  const [trainingSeedResult, setTrainingSeedResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [seedResults, setSeedResults] = useState<Record<string, SeedResult> | null>(null)
  const [plans, setPlans] = useState<PlanMaster[]>([])
  const [staffList, setStaffList] = useState<{ id: string; name: string; email: string | null; role: string; is_active: boolean }[]>([])
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'admin' })
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffSuccess, setStaffSuccess] = useState('')
  const [passwordSetupLink, setPasswordSetupLink] = useState('')
  const [staffEmailSent, setStaffEmailSent] = useState<boolean | null>(null)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'admin' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [form, setForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line: '',
    hp_url: '',
    status: 'active',
    plan_name: '',
    monthly_fee: '' as any,
    contract_start: '',
    billing_email: '',
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/clinics/${id}`).then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()),
      fetch(`/api/admin/clinics/${id}/staff`).then(r => r.json()),
    ]).then(([data, planData, staffData]) => {
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        email: data.email || '',
        phone: data.phone || '',
        postal_code: data.postal_code || '',
        prefecture: data.prefecture || '',
        city: data.city || '',
        address_line: data.address_line || '',
        hp_url: data.hp_url || '',
        status: data.status || 'active',
        plan_name: data.plan_name || '',
        monthly_fee: data.monthly_fee ?? '',
        contract_start: data.contract_start || '',
        billing_email: data.billing_email || '',
      })
      if (Array.isArray(planData)) setPlans(planData.filter((p: PlanMaster) => p.is_active))
      if (Array.isArray(staffData)) setStaffList(staffData)
    }).finally(() => setLoading(false))
  }, [id])

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaveSuccess(false)
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/clinics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '保存に失敗しました'); return }
      setSaveSuccess(true)
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('このクリニックを削除しますか？この操作は取り消せません。')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/clinics/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/admin/clinics')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setDeleting(false)
    }
  }

  const handleSeed = async () => {
    if (!confirm('初期データを投入しますか？既存データは変更されません。')) return
    setSeeding(true)
    setSeedResults(null)
    try {
      const res = await fetch(`/api/admin/clinics/${id}/seed`, { method: 'POST' })
      const data = await res.json()
      setSeedResults(data.results || {})
    } catch {
      setError('初期データ投入に失敗しました')
    } finally {
      setSeeding(false)
    }
  }

  const handleTrainingSeed = async () => {
    if (!confirm('デフォルトトレーニングを追加しますか？既存のトレーニングは変更されません。')) return
    setTrainingSeedLoading(true)
    setTrainingSeedResult(null)
    try {
      const res = await fetch('/api/training/clinic/seed', { method: 'POST' })
      const data = await res.json()
      setTrainingSeedResult({ success: data.success, message: data.message || 'エラーが発生しました' })
    } catch {
      setTrainingSeedResult({ success: false, message: 'サーバーに接続できません' })
    } finally {
      setTrainingSeedLoading(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setStaffError('')
    setStaffSuccess('')
    setStaffEmailSent(null)
    setStaffSaving(true)
    try {
      const res = await fetch(`/api/admin/clinics/${id}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      })
      const data = await res.json()
      if (!res.ok) { setStaffError(data.error || '作成に失敗しました'); return }
      setStaffSuccess(`アカウントを作成しました（${data.staff?.email}）`)
      setPasswordSetupLink(data.passwordSetupLink || '')
      setStaffEmailSent(data.emailSent ?? null)
      setStaffForm({ name: '', email: '', role: 'admin' })
      const updated = await fetch(`/api/admin/clinics/${id}/staff`).then(r => r.json())
      if (Array.isArray(updated)) setStaffList(updated)
    } catch {
      setStaffError('サーバーに接続できません')
    } finally {
      setStaffSaving(false)
    }
  }

  const handleStartEdit = (s: { id: string; name: string; email: string | null; role: string }) => {
    setEditingStaffId(s.id)
    setEditForm({ name: s.name, email: s.email || '', role: s.role })
    setEditError('')
  }

  const handleEditStaff = async (staffId: string) => {
    setEditSaving(true)
    setEditError('')
    try {
      const res = await fetch(`/api/admin/clinics/${id}/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) { setEditError(data.error || '更新に失敗しました'); return }
      setEditingStaffId(null)
      const updated = await fetch(`/api/admin/clinics/${id}/staff`).then(r => r.json())
      if (Array.isArray(updated)) setStaffList(updated)
    } catch {
      setEditError('サーバーに接続できません')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!window.confirm(`「${name}」のアカウントを完全に削除しますか？\nこの操作は取り消せません。`)) return
    try {
      const res = await fetch(`/api/admin/clinics/${id}/staff/${staffId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '削除に失敗しました')
        return
      }
      const updated = await fetch(`/api/admin/clinics/${id}/staff`).then(r => r.json())
      if (Array.isArray(updated)) setStaffList(updated)
    } catch {
      alert('サーバーに接続できません')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        読み込み中...
      </div>
    )
  }

  const seedCategories: Record<string, string> = {
    cancel_reasons: 'キャンセル理由',
    notification_templates: '通知テンプレート',
    questionnaires: '問診票',
    training: 'トレーニングメニュー',
  }

  const tabs = [
    { id: 'basic', label: '基本情報', icon: Building2 },
    { id: 'contract', label: '契約・プラン', icon: FileText },
    { id: 'staff', label: 'スタッフ', icon: Users },
    { id: 'setup', label: '初期設定', icon: Database },
    { id: 'danger', label: '危険な操作', icon: Trash2 },
  ] as const

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clinics" className="flex items-center gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            一覧に戻る
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{form.name || 'クリニック詳細'}</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/clinics/${id}/billing`} className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4" />
            請求管理
          </Link>
        </Button>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-1 border-b overflow-x-auto">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => { setActiveTab(tabId); setError(''); setSaveSuccess(false) }}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tabId
                ? tabId === 'danger'
                  ? 'border-red-500 text-red-600'
                  : 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="mt-2">
        {activeTab === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 text-blue-600" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label>クリニック名</Label>
                    <Input value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>スラッグ</Label>
                    <Input value={form.slug} onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>メールアドレス</Label>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>電話番号</Label>
                    <Input value={form.phone} onChange={e => update('phone', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>WebサイトURL</Label>
                    <Input value={form.hp_url} onChange={e => update('hp_url', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>郵便番号</Label>
                    <Input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>都道府県</Label>
                    <Input value={form.prefecture} onChange={e => update('prefecture', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>市区町村</Label>
                    <Input value={form.city} onChange={e => update('city', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>番地・建物名</Label>
                    <Input value={form.address_line} onChange={e => update('address_line', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>ステータス</Label>
                    <select
                      value={form.status}
                      onChange={e => update('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="active">稼働中</option>
                      <option value="trial">トライアル</option>
                      <option value="suspended">停止中</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    保存しました
                  </div>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? '保存中...' : '変更を保存'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'contract' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="w-4 h-4 text-purple-600" />
                契約・プラン情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>プラン</Label>
                    {plans.length > 0 ? (
                      <select
                        value={form.plan_name}
                        onChange={e => {
                          const selected = plans.find(p => p.name === e.target.value)
                          update('plan_name', e.target.value)
                          if (selected) update('monthly_fee', String(selected.monthly_fee))
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="">—プランを選択—</option>
                        {plans.map(p => (
                          <option key={p.id} value={p.name}>{p.name} (¥{p.monthly_fee.toLocaleString('ja-JP')})</option>
                        ))}
                      </select>
                    ) : (
                      <Input value={form.plan_name} onChange={e => update('plan_name', e.target.value)} placeholder="スタンダード" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>月額（円）</Label>
                    <Input
                      type="number"
                      value={form.monthly_fee}
                      onChange={e => update('monthly_fee', e.target.value)}
                      placeholder="29800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>契約開始日</Label>
                    <Input type="date" value={form.contract_start} onChange={e => update('contract_start', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>請求先メール</Label>
                    <Input type="email" value={form.billing_email} onChange={e => update('billing_email', e.target.value)} placeholder={form.email} />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}
                {saveSuccess && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    保存しました
                  </div>
                )}

                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? '保存中...' : '変更を保存'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'staff' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-indigo-600" />
                スタッフアカウント
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {staffList.length > 0 && (
                <div className="border rounded-md divide-y text-sm">
                  {staffList.map(s => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between px-3 py-2">
                        <div>
                          <span className="font-medium text-gray-900">{s.name}</span>
                          <span className="text-gray-500 ml-2">{s.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${s.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {s.role === 'admin' ? '管理者' : 'スタッフ'}
                          </span>
                          {!s.is_active && <span className="text-xs text-gray-400">無効</span>}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(s)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
                            title="編集"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(s.id, s.name)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {editingStaffId === s.id && (
                        <div className="px-3 py-3 bg-blue-50 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">名前</Label>
                              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">権限</Label>
                              <select
                                value={editForm.role}
                                onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                              >
                                <option value="admin">管理者</option>
                                <option value="staff">スタッフ</option>
                              </select>
                            </div>
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">メールアドレス</Label>
                              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
                            </div>
                          </div>
                          {editError && (
                            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {editError}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" disabled={editSaving} onClick={() => handleEditStaff(s.id)}>
                              {editSaving ? '保存中...' : '保存'}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingStaffId(null)}>
                              <X className="w-3.5 h-3.5 mr-1" />
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-3 border rounded-md p-3 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  新規アカウント作成
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">名前</Label>
                    <Input value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="院長名" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">権限</Label>
                    <select
                      value={staffForm.role}
                      onChange={e => setStaffForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="admin">管理者</option>
                      <option value="staff">スタッフ</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">メールアドレス</Label>
                    <Input type="email" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="clinic@example.com" required />
                  </div>
                </div>
                {staffError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {staffError}
                  </div>
                )}
                {staffSuccess && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {staffSuccess}
                    </div>
                    {staffEmailSent === true && (
                      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        パスワード設定メールを送信しました
                      </div>
                    )}
                    {passwordSetupLink && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                        <p className="text-xs text-gray-700 font-medium">パスワード設定リンク（フォールバック）</p>
                        <p className="text-xs text-gray-500">
                          {staffEmailSent === false
                            ? 'メール送信に失敗しました。以下のリンクを手動で送付してください。'
                            : 'メールが届かない場合は以下のリンクをコピーして送付してください。'}
                        </p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={passwordSetupLink}
                            className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 truncate"
                          />
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(passwordSetupLink) }}
                            className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 whitespace-nowrap"
                          >
                            コピー
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button type="submit" disabled={staffSaving} size="sm" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {staffSaving ? '作成中...' : 'アカウントを作成'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'setup' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4 text-green-600" />
                  初期データ投入
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  このクリニックにデフォルトのマスタデータを投入します。既存のデータは変更されません。
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                  <div>・ キャンセル理由</div>
                  <div>・ 通知テンプレート（5件）</div>
                  <div>・ 問診票（3種）</div>
                  <div>・ トレーニングメニュー（31件）</div>
                </div>

                {seedResults && (
                  <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                    {Object.entries(seedCategories).map(([key, label]) => {
                      const r = seedResults[key]
                      if (!r) return null
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {r.success
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <AlertCircle className="w-4 h-4 text-red-500" />}
                          <span className="font-medium">{label}</span>
                          <span className="text-gray-500">{r.message}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="w-full flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  {seeding ? '投入中...' : '初期データを投入する'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Database className="w-4 h-4 text-blue-600" />
                  デフォルトトレーニング追加
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  全クリニック共通のデフォルトトレーニングに新規追加分を反映します。既存のトレーニングは変更されません。
                </p>
                {trainingSeedResult && (
                  <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${trainingSeedResult.success ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                    {trainingSeedResult.success
                      ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    {trainingSeedResult.message}
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={handleTrainingSeed}
                  disabled={trainingSeedLoading}
                  className="w-full flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  {trainingSeedLoading ? '追加中...' : 'デフォルトトレーニングを追加する'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-4 h-4 text-orange-600" />
                  患者データ移行
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  他社システムから患者データをCSVで一括インポートします。
                </p>
                <Button variant="outline" asChild className="w-full flex items-center gap-2">
                  <Link href={`/admin/clinics/${id}/import`}>
                    <RefreshCw className="w-4 h-4" />
                    データ移行ページへ
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'danger' && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-700">
                <Trash2 className="w-4 h-4" />
                危険な操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                クリニックを削除すると、関連するすべてのデータが失われます。この操作は取り消せません。
              </p>
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? '削除中...' : 'このクリニックを削除'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
