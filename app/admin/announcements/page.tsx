'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus, Pencil, Trash2, RefreshCw, AlertCircle, Info, Wrench } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  target_all: boolean
  target_clinic_ids: string[]
  is_active: boolean
  start_at: string
  end_at: string
  created_at: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; Icon: typeof Info }> = {
  info: { label: 'お知らせ', color: 'text-blue-700 bg-blue-50 border-blue-200', Icon: Info },
  warning: { label: '警告', color: 'text-yellow-700 bg-yellow-50 border-yellow-200', Icon: AlertCircle },
  maintenance: { label: 'メンテナンス', color: 'text-orange-700 bg-orange-50 border-orange-200', Icon: Wrench },
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      if (res.ok) setAnnouncements(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`「${title}」を削除しますか？`)) return
    setDeleting(id)
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const handleToggle = async (a: Announcement) => {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !a.is_active }),
    })
    setAnnouncements(prev => prev.map(item => item.id === a.id ? { ...item, is_active: !item.is_active } : item))
  }

  const now = new Date()

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            お知らせ管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">クリニックへのお知らせを管理します</p>
        </div>
        <Link href="/admin/announcements/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新規作成
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-700">
            お知らせ一覧（{announcements.length}件）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              読み込み中...
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">お知らせはありません</p>
          ) : (
            <div className="divide-y">
              {announcements.map(a => {
                const isExpired = new Date(a.end_at) < now
                const isScheduled = new Date(a.start_at) > now
                return (
                  <div key={a.id} className="py-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TypeBadge type={a.type} />
                        {isExpired && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">期限切れ</span>
                        )}
                        {isScheduled && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">予定</span>
                        )}
                        {!a.is_active && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">無効</span>
                        )}
                        {a.target_all ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">全クリニック</span>
                        ) : (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{a.target_clinic_ids.length}クリニック</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(a.start_at)} 〜 {formatDate(a.end_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(a)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          a.is_active
                            ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            : 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                        }`}
                      >
                        {a.is_active ? '無効化' : '有効化'}
                      </button>
                      <Link href={`/admin/announcements/${a.id}/edit`}>
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(a.id, a.title)}
                        disabled={deleting === a.id}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
