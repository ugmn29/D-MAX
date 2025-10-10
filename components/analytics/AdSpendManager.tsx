'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface AdSpendRecord {
  id: string
  clinic_id: string
  ad_platform: string
  campaign_name: string | null
  spend_date: string
  amount: number
  currency: string
  notes: string | null
  created_at: string
  updated_at: string
}

interface AdSpendManagerProps {
  clinicId: string
  startDate?: string
  endDate?: string
}

const AD_PLATFORMS = [
  { value: 'google_ads', label: 'Google広告' },
  { value: 'meta_ads', label: 'META広告 (Facebook/Instagram)' },
  { value: 'yahoo_ads', label: 'Yahoo広告' },
  { value: 'tiktok', label: 'TikTok広告' },
  { value: 'line_ads', label: 'LINE広告' },
  { value: 'other', label: 'その他' }
]

export default function AdSpendManager({ clinicId, startDate, endDate }: AdSpendManagerProps) {
  const [records, setRecords] = useState<AdSpendRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AdSpendRecord | null>(null)
  const [formData, setFormData] = useState({
    ad_platform: 'google_ads',
    campaign_name: '',
    spend_date: new Date().toISOString().split('T')[0],
    amount: '',
    currency: 'JPY',
    notes: ''
  })

  useEffect(() => {
    loadRecords()
  }, [clinicId, startDate, endDate])

  const loadRecords = async () => {
    try {
      setLoading(true)
      let url = `/api/ad-spend?clinic_id=${clinicId}`
      if (startDate) url += `&start_date=${startDate}`
      if (endDate) url += `&end_date=${endDate}`

      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setRecords(json.data || [])
      }
    } catch (error) {
      console.error('広告費データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingRecord) {
        // 更新
        const res = await fetch('/api/ad-spend', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRecord.id,
            ...formData,
            amount: Number(formData.amount)
          })
        })
        if (!res.ok) throw new Error('更新失敗')
      } else {
        // 新規作成
        const res = await fetch('/api/ad-spend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinic_id: clinicId,
            ...formData,
            amount: Number(formData.amount)
          })
        })
        if (!res.ok) throw new Error('作成失敗')
      }

      // フォームをリセット
      setFormData({
        ad_platform: 'google_ads',
        campaign_name: '',
        spend_date: new Date().toISOString().split('T')[0],
        amount: '',
        currency: 'JPY',
        notes: ''
      })
      setEditingRecord(null)
      setShowForm(false)
      loadRecords()
    } catch (error) {
      console.error('広告費保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  const handleEdit = (record: AdSpendRecord) => {
    setEditingRecord(record)
    setFormData({
      ad_platform: record.ad_platform,
      campaign_name: record.campaign_name || '',
      spend_date: record.spend_date,
      amount: record.amount.toString(),
      currency: record.currency,
      notes: record.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この広告費記録を削除しますか？')) return

    try {
      const res = await fetch(`/api/ad-spend?id=${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('削除失敗')
      loadRecords()
    } catch (error) {
      console.error('広告費削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRecord(null)
    setFormData({
      ad_platform: 'google_ads',
      campaign_name: '',
      spend_date: new Date().toISOString().split('T')[0],
      amount: '',
      currency: 'JPY',
      notes: ''
    })
  }

  // プラットフォーム別に集計
  const platformTotals = records.reduce((acc, record) => {
    const platform = record.ad_platform
    if (!acc[platform]) {
      acc[platform] = 0
    }
    acc[platform] += Number(record.amount)
    return acc
  }, {} as Record<string, number>)

  const totalSpend = Object.values(platformTotals).reduce((sum, amount) => sum + amount, 0)

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総広告費</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ¥{totalSpend.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">記録数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {records.length}件
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">プラットフォーム数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Object.keys(platformTotals).length}個
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 広告費記録 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>広告費記録</CardTitle>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              {showForm ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  キャンセル
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  記録を追加
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* フォーム */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4 border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ad_platform">広告プラットフォーム *</Label>
                  <Select
                    value={formData.ad_platform}
                    onValueChange={(value) => setFormData({ ...formData, ad_platform: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AD_PLATFORMS.map(platform => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="spend_date">日付 *</Label>
                  <Input
                    id="spend_date"
                    type="date"
                    value={formData.spend_date}
                    onChange={(e) => setFormData({ ...formData, spend_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="amount">金額 (円) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="10000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="campaign_name">キャンペーン名</Label>
                  <Input
                    id="campaign_name"
                    value={formData.campaign_name}
                    onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
                    placeholder="例: 2025年1月キャンペーン"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">メモ</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="備考や詳細を記入"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingRecord ? '更新' : '追加'}
                </Button>
              </div>
            </form>
          )}

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">日付</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">プラットフォーム</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">キャンペーン</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">金額</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">メモ</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      読み込み中...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      広告費記録がありません
                    </td>
                  </tr>
                ) : (
                  records.map(record => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{record.spend_date}</td>
                      <td className="px-4 py-3 text-sm">
                        {AD_PLATFORMS.find(p => p.value === record.ad_platform)?.label || record.ad_platform}
                      </td>
                      <td className="px-4 py-3 text-sm">{record.campaign_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ¥{Number(record.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
