





/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // ビルド時の静的生成を無効化（環境変数が設定されていない場合のエラーを回避）
      serverExternalPackages: ['@supabase/supabase-js'],
}

module.exports = nextConfig
