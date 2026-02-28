'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, AlertCircle, CheckCircle, Trash2, Database, CreditCard, RefreshCw, FileText } from 'lucide-react'

interface SeedResult {
  success: boolean
  message: string
}

export default function ClinicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [seedResults, setSeedResults] = useState<Record<string, SeedResult> | null>(null)
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
    fetch(`/api/admin/clinics/${id}`)
      .then(r => r.json())
      .then(data => {
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
      })
      .finally(() => setLoading(false))
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

      {/* 基本情報編集 */}
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

      {/* 契約・プラン情報 */}
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
                <Label>プラン名</Label>
                <Input value={form.plan_name} onChange={e => update('plan_name', e.target.value)} placeholder="スタンダード" />
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

      {/* 初期データ投入 */}
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

      {/* 削除 */}
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
    </div>
  )
}
