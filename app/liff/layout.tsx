import { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'LINE連携 - DAX',
  description: 'LINEとクリニックの連携',
}

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* LIFF SDK読み込み */}
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  )
}
