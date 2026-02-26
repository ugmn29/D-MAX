import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const size = parseInt(request.nextUrl.searchParams.get('size') || '192')
  const radius = Math.round(size * 0.2)
  const fontSize = Math.round(size * 0.55)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          D
        </span>
      </div>
    ),
    { width: size, height: size }
  )
}
