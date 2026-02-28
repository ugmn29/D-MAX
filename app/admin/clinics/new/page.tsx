'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Building2, AlertCircle } from 'lucide-react'

export default function NewClinicPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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
  })

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'クリニックの作成に失敗しました')
        return
      }
      router.push(`/admin/clinics/${data.id}`)
    } catch {
      setError('サーバーに接続できません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/clinics" className="flex items-center gap-1.5 text-gray-500">
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">新規クリニック作成</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4 text-blue-600" />
            基本情報
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">クリニック名 <span className="text-red-500">*</span></Label>
                <Input id="name" value={form.name} onChange={e => update('name', e.target.value)} required placeholder="〇〇歯科クリニック" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="slug">スラッグ（URL識別子） <span className="text-red-500">*</span></Label>
                <Input id="slug" value={form.slug} onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} required placeholder="example-dental" />
                <p className="text-xs text-gray-400">英数字・ハイフンのみ。一意である必要があります</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="info@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">電話番号</Label>
                <Input id="phone" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="03-0000-0000" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="hp_url">WebサイトURL</Label>
                <Input id="hp_url" value={form.hp_url} onChange={e => update('hp_url', e.target.value)} placeholder="https://example-dental.jp" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postal_code">郵便番号</Label>
                <Input id="postal_code" value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="000-0000" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prefecture">都道府県</Label>
                <Input id="prefecture" value={form.prefecture} onChange={e => update('prefecture', e.target.value)} placeholder="東京都" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">市区町村</Label>
                <Input id="city" value={form.city} onChange={e => update('city', e.target.value)} placeholder="渋谷区" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address_line">番地・建物名</Label>
                <Input id="address_line" value={form.address_line} onChange={e => update('address_line', e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="status">ステータス</Label>
                <select
                  id="status"
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '作成中...' : 'クリニックを作成'}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/clinics">キャンセル</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
