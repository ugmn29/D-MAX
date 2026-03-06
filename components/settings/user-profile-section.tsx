'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, LogOut, Mail, Save, X } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

const ROLE_LABELS: Record<string, string> = {
  admin: '医院管理者',
  staff: 'スタッフ',
}

export function UserProfileSection() {
  const { staff, role, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const userInitial = staff?.name?.charAt(0) ?? '?'

  const handleStartEdit = () => {
    setNewEmail(staff?.email ?? '')
    setEditing(true)
    setMessage(null)
  }

  const handleCancel = () => {
    setEditing(false)
    setNewEmail('')
    setMessage(null)
  }

  const handleSave = async () => {
    if (!newEmail) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'メールアドレスの変更に失敗しました' })
      } else {
        setMessage({ type: 'success', text: '変更しました。次回ログイン時から新しいメールアドレスが使えます。' })
        setEditing(false)
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>アカウント情報</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-shikabot-primary text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900">{staff?.name}</p>
            <p className="text-sm text-gray-500 truncate">{staff?.email}</p>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 mt-1 inline-block">
              {ROLE_LABELS[role ?? ''] ?? role}
            </span>
          </div>
        </div>

        {/* メールアドレス変更 */}
        <div className="border-t pt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            ログイン用メールアドレスの変更
          </p>
          {editing ? (
            <div className="space-y-2">
              <input
                type="email"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="新しいメールアドレス"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving} className="flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving} className="flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleStartEdit} className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              メールアドレスを変更
            </Button>
          )}
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
        </div>

        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </CardContent>
    </Card>
  )
}
