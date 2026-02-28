'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell, ArrowLeft, AlertCircle } from 'lucide-react'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState('info')
  const [targetAll, setTargetAll] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [startAt, setStartAt] = useState(() => {
    const d = new Date()
    d.setMinutes(0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [endAt, setEndAt] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    d.setMinutes(0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('タイトルと本文は必須です')
      return
    }
    if (new Date(startAt) >= new Date(endAt)) {
      setError('終了日時は開始日時より後に設定してください')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          type,
          target_all: targetAll,
          target_clinic_ids: [],
          is_active: isActive,
          start_at: new Date(startAt).toISOString(),
          end_at: new Date(endAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || '作成に失敗しました')
      }
      router.push('/admin/announcements')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/announcements')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          一覧へ戻る
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          お知らせ作成
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">お知らせ内容</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="title">タイトル *</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="メンテナンスのお知らせ"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">本文 *</Label>
              <textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="お知らせの詳細内容を入力してください"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>種別</Label>
              <div className="flex gap-3">
                {[
                  { value: 'info', label: 'お知らせ' },
                  { value: 'warning', label: '警告' },
                  { value: 'maintenance', label: 'メンテナンス' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={() => setType(opt.value)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startAt">表示開始日時 *</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={startAt}
                  onChange={e => setStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endAt">表示終了日時 *</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={endAt}
                  onChange={e => setEndAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetAll}
                  onChange={e => setTargetAll(e.target.checked)}
                  className="accent-blue-600"
                />
                <span className="text-sm">全クリニックに表示</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="accent-blue-600"
                />
                <span className="text-sm">有効（今すぐ表示）</span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? '作成中...' : '作成する'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/admin/announcements')}>
                キャンセル
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
