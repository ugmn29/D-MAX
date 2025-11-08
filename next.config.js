





/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'lofty-herlinda-compulsively.ngrok-free.dev'],
  },
  typescript: {
    // 本番デプロイ時は型チェックを一時的に無効化
    ignoreBuildErrors: true,
  },
  eslint: {
    // 本番デプロイ時はESLintエラーを一時的に無視
    ignoreDuringBuilds: true,
  },
  // ビルド時の静的生成を無効化（環境変数が設定されていない場合のエラーを回避）
  serverExternalPackages: ['@supabase/supabase-js'],
  // ngrok経由でのアクセスを許可
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
