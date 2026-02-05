import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p))
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

  // セッションCookieが存在する場合はアクセスを許可
  // （詳細なトークン検証はAuthProviderとAPIルートで行う）
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
