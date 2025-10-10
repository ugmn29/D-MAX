'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Users, Settings, BarChart3, Menu, MousePointerClick } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'カレンダー', href: '/', icon: Calendar },
  { name: '患者管理', href: '/patients', icon: Users },
  { name: 'Web予約', href: '/web-booking', icon: MousePointerClick },
  { name: '分析', href: '/analytics', icon: BarChart3 },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-dmax-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-dmax-primary-dark">D-MAX</h1>
              <span className="ml-2 text-sm text-gray-600 hidden sm:block">
                歯科医院向け予約・サブカルテアプリ
              </span>
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors touch-target",
                    isActive
                      ? "bg-dmax-light-blue text-dmax-primary-dark"
                      : "text-gray-700 hover:text-dmax-primary-dark hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* ユーザー情報・設定 */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              今日: {new Date().toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </Button>

            {/* モバイルメニューボタン */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}