import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UTMCapture } from '@/components/tracking/UTMCapture'
import { DynamicTrackingTags } from '@/components/tracking/DynamicTrackingTags'

const inter = Inter({ subsets: ['latin'] })

// 仮のクリニックID（本番環境では認証情報から取得）
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export const metadata: Metadata = {
  title: 'D-MAX - 歯科医院向け予約・サブカルテアプリ',
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
        <DynamicTrackingTags clinicId={DEMO_CLINIC_ID} />
      </head>
      <body className={inter.className}>
        <UTMCapture />
        <div className="min-h-screen bg-dmax-background">
          {children}
        </div>
      </body>
    </html>
  )
}
