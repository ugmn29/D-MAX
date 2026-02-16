import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UTMCapture } from '@/components/tracking/UTMCapture'
import { DynamicTrackingTags } from '@/components/tracking/DynamicTrackingTags'
import { AuthProvider } from '@/components/providers/auth-provider'
import { StorageVersionChecker } from '@/components/storage-version-checker'

const inter = Inter({ subsets: ['latin'] })

// トラッキング用（Phase 1では維持、将来的にAuthContextから取得）
const TRACKING_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export const metadata: Metadata = {
  title: 'DAX - 歯科医院向け予約・サブカルテアプリ',
  description: '歯科医院の診療予約管理、患者管理、経営分析、マーケティングROI最適化の統合プラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <DynamicTrackingTags clinicId={TRACKING_CLINIC_ID} />
      </head>
      <body className={inter.className}>
        <StorageVersionChecker />
        <AuthProvider>
          <UTMCapture />
          <div className="min-h-screen bg-dmax-background">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
