'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Calendar, Users, Settings, BarChart3, Menu, MousePointerClick, X, LogOut, Lock, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { AnnouncementBanner } from './announcement-banner'
import { useAuth } from '@/components/providers/auth-provider'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase-client'

const navigation = [
  { name: 'カレンダー', href: '/', icon: Calendar, adminOnly: false },
  { name: '患者管理', href: '/patients', icon: Users, adminOnly: false },
  { name: 'Web予約', href: '/web-booking', icon: MousePointerClick, adminOnly: false },
  { name: '分析', href: '/analytics', icon: BarChart3, adminOnly: true },
  { name: '設定', href: '/settings', icon: Settings, adminOnly: true },
]

export function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const { role, staff, firebaseUser, signOut } = useAuth()

  const visibleNavigation = navigation.filter(item => !item.adminOnly || role === 'admin')

  // パスワード変更フォームの状態
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const openPasswordModal = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwError('')
    setPwSuccess(false)
    setShowPasswordModal(true)
    setUserMenuOpen(false)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    if (newPassword.length < 6) { setPwError('新しいパスワードは6文字以上にしてください'); return }
    if (newPassword !== confirmPassword) { setPwError('新しいパスワードが一致しません'); return }
    if (!firebaseUser?.email) { setPwError('ユーザー情報が取得できません'); return }
    setPwSubmitting(true)
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword)
      await reauthenticateWithCredential(firebaseUser, credential)
      await updatePassword(firebaseUser, newPassword)
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      const code = err?.code || ''
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwError('現在のパスワードが正しくありません')
      } else {
        setPwError('パスワードの変更に失敗しました')
      }
    } finally {
      setPwSubmitting(false)
    }
  }

  const userInitial = staff?.name?.charAt(0) ?? '?'

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
            {visibleNavigation.map((item) => {
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

          {/* 右側: 日付・ユーザーメニュー */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              今日: {new Date().toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </Button>

            {/* ユーザーメニュー */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-shikabot-primary text-white flex items-center justify-center text-xs font-bold">
                  {userInitial}
                </div>
                <span className="text-sm text-gray-700 max-w-24 truncate hidden lg:block">{staff?.name ?? ''}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{staff?.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{staff?.email}</p>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded mt-1.5 inline-block",
                        role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'
                      )}>
                        {role === 'admin' ? '医院管理者' : 'スタッフ'}
                      </span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={openPasswordModal}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Lock className="w-4 h-4 mr-2 text-gray-400" />
                        パスワード変更
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut() }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        ログアウト
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

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
              {visibleNavigation.map((item) => {
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
            {/* モバイル: ユーザー情報・操作 */}
            <div className="border-t border-gray-200 p-4 space-y-1">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 mb-1">
                <div className="w-8 h-8 rounded-full bg-shikabot-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{staff?.name}</p>
                  <p className="text-xs text-gray-400 truncate">{role === 'admin' ? '医院管理者' : 'スタッフ'}</p>
                </div>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); openPasswordModal() }}
                className="flex items-center gap-3 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <Lock className="w-4 h-4 text-gray-400" />
                パスワード変更
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); signOut() }}
                className="flex items-center gap-3 w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
              >
                <LogOut className="w-4 h-4" />
                ログアウト
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* パスワード変更モーダル */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <h2 className="text-base font-semibold text-gray-900">パスワード変更</h2>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="px-6 py-5 space-y-4">
              {pwError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  パスワードを変更しました
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="hdr-cur-pw" className="text-sm">現在のパスワード</Label>
                <Input id="hdr-cur-pw" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hdr-new-pw" className="text-sm">新しいパスワード</Label>
                <Input id="hdr-new-pw" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                <p className="text-xs text-gray-400">6文字以上</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hdr-conf-pw" className="text-sm">新しいパスワード（確認）</Label>
                <Input id="hdr-conf-pw" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPasswordModal(false)}>
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1" disabled={pwSubmitting || !currentPassword || !newPassword || !confirmPassword}>
                  {pwSubmitting ? '変更中...' : '変更する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
