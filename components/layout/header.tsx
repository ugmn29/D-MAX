'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Calendar, Users, Settings, BarChart3, Menu, MousePointerClick, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnnouncementBanner } from './announcement-banner'

const navigation = [
  { name: 'カレンダー', href: '/', icon: Calendar },
  { name: '患者管理', href: '/patients', icon: Users },
  { name: 'Web予約', href: '/web-booking', icon: MousePointerClick },
  { name: '分析', href: '/analytics', icon: BarChart3 },
  { name: '設定', href: '/settings', icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-shikabot-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-shikabot-primary-dark">HubDent</h1>
              <span className="ml-2 text-sm text-gray-600 hidden sm:block">
                歯科医院管理システム
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
                      ? "bg-shikabot-light-blue text-shikabot-primary-dark"
                      : "text-gray-700 hover:text-shikabot-primary-dark hover:bg-gray-50"
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
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* お知らせバナー */}
      <AnnouncementBanner />

      {/* モバイルドロワー */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="font-bold text-lg text-shikabot-primary-dark">HubDent</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 py-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 text-base transition-colors',
                      isActive
                        ? 'bg-shikabot-light-blue text-shikabot-primary-dark font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}