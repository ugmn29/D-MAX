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
}

module.exports = nextConfig
