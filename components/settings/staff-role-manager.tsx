'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

interface StaffMember {
  id: string
  name: string
  email?: string
  role: 'admin' | 'staff' | string
  is_active: boolean
}

const ROLE_LABELS: Record<string, string> = {
  admin: '医院管理者',
  staff: 'スタッフ',
}

const PERMISSION_FEATURES = [
  { key: 'patients', label: '患者管理', description: '患者一覧・ステータス管理ページ', defaultOn: true },
  { key: 'analytics', label: '分析', description: '分析・レポートページ', defaultOn: false },
  { key: 'settings', label: '設定', description: '医院設定ページ', defaultOn: false },
]

export function StaffRoleManager() {
  const { clinicId, staff, loading: authLoading } = useAuth()
  const currentStaffId = staff?.id
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // スタッフ閲覧権限
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    patients: true, analytics: false, settings: false
  })
  const [permSaving, setPermSaving] = useState(false)
  const [permMessage, setPermMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchStaff = useCallback(async () => {
    if (!clinicId) {
      setLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/staff?clinic_id=${clinicId}&active_only=false`)
      if (!res.ok) throw new Error('取得失敗')
      const data = await res.json()
      setStaffList(data)
    } catch {
      setMessage({ type: 'error', text: 'スタッフ一覧の取得に失敗しました' })
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  // 権限設定を読み込み
  useEffect(() => {
    if (!clinicId) return
    fetch(`/api/clinic/settings?clinic_id=${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (data.staff_permissions) {
          setPermissions({ patients: true, analytics: false, settings: false, ...data.staff_permissions })
        }
      })
      .catch(console.error)
  }, [clinicId])

  useEffect(() => {
    if (authLoading) return
    fetchStaff()
  }, [fetchStaff, authLoading])

  const handleRoleChange = async (staffMemberId: string, newRole: 'admin' | 'staff') => {
    setUpdating(staffMemberId)
    setMessage(null)
    try {
      const res = await fetch(`/api/staff/${staffMemberId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'ロールの変更に失敗しました' })
        return
      }
      setStaffList(prev =>
        prev.map(s => (s.id === staffMemberId ? { ...s, role: data.role } : s))
      )
      setMessage({ type: 'success', text: 'ロールを変更しました。対象スタッフは次回ログイン時から反映されます。' })
    } catch {
      setMessage({ type: 'error', text: 'ロールの変更に失敗しました' })
    } finally {
      setUpdating(null)
    }
  }

  const handleSavePermissions = async () => {
    if (!clinicId) return
    setPermSaving(true)
    setPermMessage(null)
    try {
      const res = await fetch('/api/clinic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_id: clinicId, staff_permissions: permissions }),
      })
      if (!res.ok) throw new Error('保存失敗')
      setPermMessage({ type: 'success', text: '権限設定を保存しました' })
      setTimeout(() => setPermMessage(null), 3000)
    } catch {
      setPermMessage({ type: 'error', text: '保存に失敗しました' })
    } finally {
      setPermSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* スタッフ閲覧権限設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>スタッフ閲覧権限設定</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            スタッフ（管理者以外）がアクセスできる機能を設定します。管理者は常にすべての機能にアクセスできます。
          </p>

          <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {PERMISSION_FEATURES.map(feature => (
              <div key={feature.key} className="flex items-center justify-between px-4 py-3 bg-white">
                <div>
                  <p className="text-sm font-medium text-gray-900">{feature.label}</p>
                  <p className="text-xs text-gray-400">{feature.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={permissions[feature.key] !== false}
                    onChange={e => setPermissions(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                  />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-shikabot-primary rounded-full peer peer-checked:bg-shikabot-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
          </div>

          {permMessage && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              permMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {permMessage.type === 'success'
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{permMessage.text}</span>
            </div>
          )}

          <Button onClick={handleSavePermissions} disabled={permSaving} size="sm">
            {permSaving ? '保存中...' : '保存'}
          </Button>
        </CardContent>
      </Card>

      {/* ロール管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>スタッフロール管理</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            スタッフごとにロールを設定します。医院管理者は設定・分析ページに常にアクセスできます。
          </p>

          {message && (
            <div
              className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-shikabot-primary" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
              {staffList.length === 0 && (
                <p className="text-sm text-gray-500 p-4">スタッフが見つかりません</p>
              )}
              {staffList.map(member => {
                const isCurrentUser = member.id === currentStaffId
                const isBusy = updating === member.id

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-4 py-3 bg-white"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                        {!member.is_active && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                            退職
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                            自分
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{member.email}</p>
                      )}
                    </div>

                    <div className="ml-4 flex-shrink-0">
                      {isCurrentUser ? (
                        <span className="text-sm text-gray-400">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      ) : (
                        <div className="relative">
                          <select
                            value={member.role}
                            disabled={isBusy}
                            onChange={e =>
                              handleRoleChange(member.id, e.target.value as 'admin' | 'staff')
                            }
                            className="appearance-none pr-7 pl-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-shikabot-primary focus:border-transparent disabled:opacity-50 cursor-pointer"
                          >
                            <option value="staff">スタッフ</option>
                            <option value="admin">医院管理者</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                          {isBusy && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-md">
                              <div className="animate-spin h-3.5 w-3.5 border-2 border-shikabot-primary border-t-transparent rounded-full" />
                            </div>
                          )}
                        </div>
                      )}
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
