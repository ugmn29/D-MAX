'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Plus, Pencil, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface Plan {
  id: string
  name: string
  monthly_fee: number
  description: string | null
  is_active: boolean
  sort_order: number
}

const emptyForm = { name: '', monthly_fee: '', description: '', is_active: true, sort_order: '0' }

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/plans')
    const data = await res.json()
    if (Array.isArray(data)) setPlans(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const startNew = () => {
    setEditingId('new')
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id)
    setForm({
      name: plan.name,
      monthly_fee: String(plan.monthly_fee),
      description: plan.description || '',
      is_active: plan.is_active,
      sort_order: String(plan.sort_order),
    })
    setError('')
    setSuccess('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError('')
  }

  const handleSave = async () => {
    if (!form.name || !form.monthly_fee) {
      setError('プラン名と月額は必須です')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        name: form.name,
        monthly_fee: Number(form.monthly_fee),
        description: form.description || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      }
      const url = editingId === 'new' ? '/api/admin/plans' : `/api/admin/plans/${editingId}`
      const method = editingId === 'new' ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '保存に失敗しました'); return }
      setSuccess('保存しました')
      setEditingId(null)
      await fetchPlans()
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPlans(prev => prev.filter(p => p.id !== id))
        setSuccess('削除しました')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setDeleting(null)
    }
  }

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">プラン管理</h1>
          <p className="text-sm text-gray-500 mt-1">契約プランの種別と月額を設定します</p>
        </div>
        {editingId !== 'new' && (
          <Button size="sm" onClick={startNew} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            新規プラン
          </Button>
        )}
      </div>

      {success && !editingId && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* 新規作成フォーム */}
      {editingId === 'new' && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              新規プラン作成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlanForm form={form} update={update} error={error} saving={saving} onSave={handleSave} onCancel={cancelEdit} />
          </CardContent>
        </Card>
      )}

      {/* プラン一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4 text-green-600" />
            プラン一覧
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              読み込み中...
            </div>
          ) : plans.length === 0 && editingId !== 'new' ? (
            <div className="px-4 py-10 text-center text-gray-400">
              プランがまだ登録されていません
            </div>
          ) : (
            <div className="divide-y">
              {plans.map(plan => (
                <div key={plan.id}>
                  {editingId === plan.id ? (
                    <div className="p-4">
                      <PlanForm form={form} update={update} error={error} saving={saving} onSave={handleSave} onCancel={cancelEdit} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{plan.name}</span>
                            {!plan.is_active && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">無効</span>
                            )}
                          </div>
                          {plan.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-900">
                          ¥{plan.monthly_fee.toLocaleString('ja-JP')}
                          <span className="text-sm font-normal text-gray-400">/月</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => startEdit(plan)} className="h-8 w-8 p-0">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan.id, plan.name)}
                            disabled={deleting === plan.id}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {deleting === plan.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PlanForm({
  form,
  update,
  error,
  saving,
  onSave,
  onCancel,
}: {
  form: typeof emptyForm & { is_active: boolean }
  update: (key: string, val: any) => void
  error: string
  saving: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>プラン名 <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="スタンダード" />
        </div>
        <div className="space-y-1.5">
          <Label>月額（円） <span className="text-red-500">*</span></Label>
          <Input
            type="number"
            value={form.monthly_fee}
            onChange={e => update('monthly_fee', e.target.value)}
            placeholder="29800"
          />
        </div>
        <div className="space-y-1.5">
          <Label>表示順</Label>
          <Input
            type="number"
            value={form.sort_order}
            onChange={e => update('sort_order', e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>説明（任意）</Label>
          <Input value={form.description} onChange={e => update('description', e.target.value)} placeholder="基本機能をすべて含むプラン" />
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={e => update('is_active', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="is_active" className="cursor-pointer">有効（クリニック割り当て可能）</Label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          キャンセル
        </Button>
      </div>
    </div>
  )
}
