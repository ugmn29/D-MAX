





/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  typescript: {
    // 本番デプロイ時は型チェックを一時的に無効化
    ignoreBuildErrors: true,
  },
  eslint: {
    // 本番デプロイ時はESLintエラーを一時的に無視
    ignoreDuringBuilds: true,
  },
  // セキュリティヘッダー（3省2ガイドライン準拠）
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // ngrok経由でのアクセスを許可
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
          // HSTS: 通信の暗号化を強制
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // クリックジャッキング防止
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // MIMEタイプスニッフィング防止
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // リファラー情報の制限
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // 不要なブラウザ機能の無効化
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP: XSS・インジェクション攻撃防止
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
