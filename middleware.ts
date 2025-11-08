import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // LIFFページへのアクセスの場合、ngrok警告をスキップするヘッダーを追加
  if (request.nextUrl.pathname.startsWith('/liff/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('ngrok-skip-browser-warning', 'true')

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // レスポンスヘッダーにも追加
    response.headers.set('ngrok-skip-browser-warning', 'true')

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/liff/:path*',
}
