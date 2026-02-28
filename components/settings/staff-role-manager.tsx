'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export function StaffRoleManager() {
  const { clinicId, staff, loading: authLoading } = useAuth()
  const currentStaffId = staff?.id
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>スタッフ権限管理</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-500">
          スタッフごとにアクセス権限を設定します。医院管理者は設定・分析ページにアクセスできます。
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
  )
}
