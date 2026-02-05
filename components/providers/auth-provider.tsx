'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase-client'
import { useRouter, usePathname } from 'next/navigation'

interface StaffInfo {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  clinic_id: string
  position_id?: string
}

interface AuthContextType {
  firebaseUser: User | null
  staff: StaffInfo | null
  clinicId: string | null
  role: 'admin' | 'staff' | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const FALLBACK_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

const PUBLIC_PATHS = [
  '/login',
  '/questionnaire',
  '/liff',
  '/web-booking',
  '/clinic',
  '/training/patient',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function getSecondsUntilMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.floor((midnight.getTime() - now.getTime()) / 1000)
}

function setSessionCookie(token: string) {
  const maxAge = getSecondsUntilMidnight()
  document.cookie = `__session=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function clearSessionCookie() {
  document.cookie = '__session=; path=/; max-age=0'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [staff, setStaff] = useState<StaffInfo | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [role, setRole] = useState<'admin' | 'staff' | null>(null)
  const [loading, setLoading] = useState(true)
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = useCallback(async () => {
    try {
      const auth = getFirebaseAuth()
      if (auth) await firebaseSignOut(auth)
    } catch (error) {
      // ignore
    }
    setFirebaseUser(null)
    setStaff(null)
    setClinicId(null)
    setRole(null)
    clearSessionCookie()
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current)
      midnightTimerRef.current = null
    }
    router.push('/login')
  }, [router])

  // 0時自動ログアウトタイマー
  const setupMidnightTimer = useCallback(() => {
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current)
    }
    const msUntilMidnight = getSecondsUntilMidnight() * 1000
    midnightTimerRef.current = setTimeout(() => {
      handleSignOut()
    }, msUntilMidnight)
  }, [handleSignOut])

  useEffect(() => {
    // Firebase環境変数が未設定の場合はフォールバック
    if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
      setClinicId(FALLBACK_CLINIC_ID)
      setRole('admin')
      setStaff({
        id: 'fallback-staff',
        name: '開発ユーザー',
        email: 'dev@example.com',
        role: 'admin',
        clinic_id: FALLBACK_CLINIC_ID,
      })
      setLoading(false)
      return
    }

    const auth = getFirebaseAuth()
    if (!auth) {
      setClinicId(FALLBACK_CLINIC_ID)
      setRole('admin')
      setStaff({
        id: 'fallback-staff',
        name: '開発ユーザー',
        email: 'dev@example.com',
        role: 'admin',
        clinic_id: FALLBACK_CLINIC_ID,
      })
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user)

        // IDトークンからCustom Claimsを取得
        const tokenResult = await user.getIdTokenResult()
        const claims = tokenResult.claims
        const userClinicId = (claims.clinic_id as string) || FALLBACK_CLINIC_ID
        const userRole = (claims.role as 'admin' | 'staff') || 'staff'
        const userStaffId = (claims.staff_id as string) || ''

        setClinicId(userClinicId)
        setRole(userRole)
        setStaff({
          id: userStaffId,
          name: user.displayName || user.email || '',
          email: user.email || '',
          role: userRole,
          clinic_id: userClinicId,
        })

        // セッションCookieを設定（0時まで有効）
        const token = await user.getIdToken()
        setSessionCookie(token)

        // 0時自動ログアウトタイマーセット
        setupMidnightTimer()
      } else {
        setFirebaseUser(null)
        setStaff(null)
        setClinicId(null)
        setRole(null)
        clearSessionCookie()

        // 保護ルートの場合はログインへリダイレクト
        if (!isPublicPath(pathname)) {
          router.push('/login')
        }
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current)
      }
    }
  }, [pathname, router, setupMidnightTimer])

  // トークンリフレッシュ時にCookieを更新
  useEffect(() => {
    if (!firebaseUser) return

    const refreshInterval = setInterval(async () => {
      try {
        const token = await firebaseUser.getIdToken(true)
        setSessionCookie(token)
      } catch (error) {
        // トークンリフレッシュ失敗時はサインアウト
        handleSignOut()
      }
    }, 30 * 60 * 1000) // 30分ごとにリフレッシュ

    return () => clearInterval(refreshInterval)
  }, [firebaseUser, handleSignOut])

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    if (!auth) throw new Error('Firebase is not configured')
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const token = await credential.user.getIdToken()
    setSessionCookie(token)
  }, [])

  const signOut = useCallback(async () => {
    await handleSignOut()
  }, [handleSignOut])

  return (
    <AuthContext.Provider value={{ firebaseUser, staff, clinicId, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
