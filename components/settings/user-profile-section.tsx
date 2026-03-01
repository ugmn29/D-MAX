'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

const ROLE_LABELS: Record<string, string> = {
  admin: '医院管理者',
  staff: 'スタッフ',
}

export function UserProfileSection() {
  const { staff, role, signOut } = useAuth()

  const userInitial = staff?.name?.charAt(0) ?? '?'

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
