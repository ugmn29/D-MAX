'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, Edit2, Save, X, CheckCircle, Copy, ExternalLink } from 'lucide-react'

interface AdSourcesManagerProps {
  clinicId: string
}

interface AdSource {
  id: string
  clinic_id: string | null
  name: string
  category: string
  utm_source: string
  utm_medium: string
  description: string
  is_system: boolean
  is_active: boolean
  sort_order: number
}

const CATEGORIES = [
  '検索広告',
  'マップ・ローカル',
  'SNS広告',
  'オフライン',
  'オーガニック',
  'その他',
]

export default function AdSourcesManager({ clinicId }: AdSourcesManagerProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sources, setSources] = useState<AdSource[]>([])
  const [sourcesByCategory, setSourcesByCategory] = useState<Record<string, AdSource[]>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<AdSource>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSource, setNewSource] = useState<Partial<AdSource>>({
    name: '',
    category: '検索広告',
    utm_source: '',
    utm_medium: '',
    description: '',
  })

  useEffect(() => {
    loadSources()
  }, [clinicId])

  const loadSources = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/ad-sources?clinic_id=${clinicId}`)
      if (res.ok) {
        const json = await res.json()
        setSources(json.data.sources || [])
        setSourcesByCategory(json.data.by_category || {})
      }
    } catch (error) {
      console.error('広告媒体取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newSource.name || !newSource.utm_source) {
      alert('名前とUTM Sourceは必須です')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/ad-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinic_id: clinicId,
          ...newSource,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || '追加に失敗しました')
        return
      }

      setShowAddForm(false)
      setNewSource({
        name: '',
        category: '検索広告',
        utm_source: '',
        utm_medium: '',
        description: '',
      })
      loadSources()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('広告媒体追加エラー:', error)
      alert('追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    try {
      setSaving(true)
      const res = await fetch('/api/ad-sources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...editForm,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || '更新に失敗しました')
        return
      }

      setEditingId(null)
      setEditForm({})
      loadSources()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('広告媒体更新エラー:', error)
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return

    try {
      const res = await fetch(`/api/ad-sources?id=${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || '削除に失敗しました')
        return
      }

      loadSources()
    } catch (error) {
      console.error('広告媒体削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const copyUTMUrl = (source: AdSource) => {
    const baseUrl = `${window.location.origin}/web-booking`
    const params = new URLSearchParams({
      clinic_id: clinicId,
      utm_source: source.utm_source,
      utm_medium: source.utm_medium || 'none',
    })
    const url = `${baseUrl}?${params.toString()}`
    navigator.clipboard.writeText(url)
    alert('URLをコピーしました')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 保存完了メッセージ */}
      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            保存しました
          </AlertDescription>
        </Alert>
      )}

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総媒体数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sources.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">システム標準</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {sources.filter(s => s.is_system).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">カスタム追加</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sources.filter(s => !s.is_system).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 追加ボタン */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="w-4 h-4 mr-2" />
          広告媒体を追加
        </Button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">新しい広告媒体を追加</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>媒体名 *</Label>
                <Input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="例: リスティング広告（特別キャンペーン）"
                />
              </div>
              <div>
                <Label>カテゴリ *</Label>
                <Select
                  value={newSource.category}
                  onValueChange={(value) => setNewSource({ ...newSource, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>UTM Source *</Label>
                <Input
                  value={newSource.utm_source}
                  onChange={(e) => setNewSource({ ...newSource, utm_source: e.target.value })}
                  placeholder="例: campaign_202601"
                />
                <p className="text-xs text-gray-500 mt-1">URLパラメータで使用（英数字・アンダースコアのみ）</p>
              </div>
              <div>
                <Label>UTM Medium</Label>
                <Input
                  value={newSource.utm_medium}
                  onChange={(e) => setNewSource({ ...newSource, utm_medium: e.target.value })}
                  placeholder="例: cpc, social, qr"
                />
              </div>
              <div className="md:col-span-2">
                <Label>説明</Label>
                <Input
                  value={newSource.description}
                  onChange={(e) => setNewSource({ ...newSource, description: e.target.value })}
                  placeholder="この媒体の説明（任意）"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                キャンセル
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? '保存中...' : '追加'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* カテゴリ別一覧 */}
      {CATEGORIES.map(category => {
        const categorySources = sourcesByCategory[category] || []
        if (categorySources.length === 0) return null

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categorySources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-4 border rounded-lg ${
                      source.is_system ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    {editingId === source.id ? (
                      // 編集モード
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label>媒体名</Label>
                            <Input
                              value={editForm.name || source.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>UTM Source</Label>
                            <Input
                              value={editForm.utm_source || source.utm_source}
                              onChange={(e) => setEditForm({ ...editForm, utm_source: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(null)
                              setEditForm({})
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdate(source.id)}
                            disabled={saving}
                          >
                            <Save className="w-4 h-4 mr-1" />
                            保存
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // 表示モード
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{source.name}</span>
                            {source.is_system && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                システム
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <code className="bg-gray-100 px-1 rounded">
                              utm_source={source.utm_source}
                            </code>
                            {source.utm_medium && (
                              <code className="bg-gray-100 px-1 rounded ml-2">
                                utm_medium={source.utm_medium}
                              </code>
                            )}
                          </div>
                          {source.description && (
                            <p className="text-xs text-gray-400 mt-1">{source.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyUTMUrl(source)}
                            title="URLをコピー"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {!source.is_system && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(source.id)
                                  setEditForm({
                                    name: source.name,
                                    utm_source: source.utm_source,
                                    utm_medium: source.utm_medium,
                                  })
                                }}
                                title="編集"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(source.id, source.name)}
                                className="text-red-500 hover:text-red-700"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* 使い方ガイド */}
      <Alert>
        <AlertDescription>
          <strong>使い方:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
            <li>広告のリンク先URLに <code className="bg-gray-100 px-1 rounded">?utm_source=xxx&utm_medium=yyy</code> を追加してください</li>
            <li>チラシのQRコードは「QRコード生成」タブで作成できます</li>
            <li>システム標準の媒体は編集・削除できません</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
