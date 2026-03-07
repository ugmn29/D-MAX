import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_PUBLIC_PATHS = ['/admin/login', '/api/admin/auth']

// 医院管理者(adminロール)のみアクセス可能なパス
const CLINIC_ADMIN_ONLY_PATHS = [
  '/settings',
  '/analytics',
  '/training/clinic/analytics',
  '/training/clinic/settings',
]

const PUBLIC_PATHS = [
  '/login',
  '/questionnaire',
  '/liff',
  '/web-booking',
  '/clinic',
  '/training/patient',
  '/api/line',
  '/api/questionnaires',
  '/api/auth',
  '/api/tracking-tags',
  '/api/speech-to-text',
  // Web予約ページが使用するAPI
  '/api/clinic/settings',
  '/api/clinic/info',
  '/api/clinics',
  '/api/treatment-menus',
  '/api/staff',
  '/api/appointments',
  '/api/staff-shifts',
  '/api/patients',
  '/api/patient-web-booking-settings',
  '/api/web-booking-tokens',
  '/api/web-booking',
  '/api/units',
  '/api/staff-unit-priorities',
  '/api/tracking/save-acquisition',
  '/api/r',
  // 問診票ページが使用するAPI
  '/api/questionnaire-responses',
  // トレーニング患者ページが使用するAPI
  '/api/training',
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
}

function isClinicAdminOnlyPath(pathname: string): boolean {
  return CLINIC_ADMIN_ONLY_PATHS.some(p => pathname.startsWith(p))
}

// JWTペイロードからroleを取得（署名検証なし・ルーティング目的のみ）
// ※API内でverifyAuth()による完全な検証を行うため安全
function getRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded))
    return (payload.role as string) || null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静的ファイルは除外
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // LIFFページへのアクセスの場合、ngrok警告をスキップするヘッダーを追加
  if (pathname.startsWith('/liff/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('ngrok-skip-browser-warning', 'true')

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    response.headers.set('ngrok-skip-browser-warning', 'true')
    return response
  }

  // 管理者ルートの認証（/admin/*）
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    // ログインページとログインAPIは公開
    if (ADMIN_PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    // 管理者セッションCookieの確認
    const adminSession = request.cookies.get('__admin_session')?.value
    const adminSecret = process.env.ADMIN_SESSION_SECRET
    if (!adminSession || !adminSecret || adminSession !== adminSecret) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // 公開ルートは認証チェックをスキップ
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // 保護ルート: セッションCookieの確認
  const session = request.cookies.get('__session')?.value

  if (!session) {
    // セッションがない場合はログインページへリダイレクト
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 医院管理者専用パスのロールチェック
  if (isClinicAdminOnlyPath(pathname)) {
    const role = getRoleFromToken(session)
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // セッションCookieが存在する場合はアクセスを許可
  // （詳細なトークン検証はAuthProviderとAPIルートで行う）
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
