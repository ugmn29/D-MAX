import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <div className="min-h-screen bg-dmax-background">
          {children}
        </div>
      </body>
    </html>
  )
}