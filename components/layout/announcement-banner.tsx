'use client'

import { useState, useEffect } from 'react'
import { X, Info, AlertCircle, Wrench } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
}

const TYPE_CONFIG = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    Icon: Info,
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-800',
    Icon: AlertCircle,
  },
  maintenance: {
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-800',
    Icon: Wrench,
  },
}

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) setAnnouncements(data)
      })
      .catch(() => {})
  }, [])

  const handleDismiss = async (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement_id: id }),
      })
    } catch {}
  }

  const visible = announcements.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div className="border-t">
      {visible.map(a => {
        const cfg = TYPE_CONFIG[a.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info
        const { Icon } = cfg
        return (
          <div key={a.id} className={`${cfg.bg} border-b px-4 py-2.5`}>
            <div className="max-w-7xl mx-auto flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.text}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${cfg.text}`}>{a.title}</p>
                <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{a.content}</p>
              </div>
              <button
                onClick={() => handleDismiss(a.id)}
                className={`p-1 rounded hover:opacity-70 flex-shrink-0 ${cfg.text}`}
                aria-label="閉じる"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
