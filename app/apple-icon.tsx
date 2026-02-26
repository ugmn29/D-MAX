import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          D
        </span>
      </div>
    ),
    { ...size }
  )
}
