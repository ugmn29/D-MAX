import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * QRコード・リンクのタップ追跡リダイレクトAPI
 * クリック数を記録してから目的地URLへリダイレクトする
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clinicId = searchParams.get('clinic_id')
  const utmSource = searchParams.get('utm_source')
  const utmMedium = searchParams.get('utm_medium')
  const utmCampaign = searchParams.get('utm_campaign')
  const dest = searchParams.get('dest')

  if (!dest) {
    return NextResponse.json({ error: 'dest is required' }, { status: 400 })
  }

  // クリックカウントをインクリメント（失敗してもリダイレクトは行う）
  if (clinicId) {
    try {
      const prisma = getPrismaClient()
      await prisma.generated_links_history.updateMany({
        where: {
          clinic_id: clinicId,
          link_type: 'qr_code',
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
        },
        data: {
          click_count: { increment: 1 },
          last_clicked_at: new Date(),
        },
      })
    } catch (error) {
      console.error('[/api/r] Failed to increment click count:', error)
    }
  }

  // 飛び先URLにUTMパラメータを付加してリダイレクト
  const buildDestUrl = () => {
    const utmParts: string[] = []
    if (utmSource) utmParts.push(`utm_source=${encodeURIComponent(utmSource)}`)
    if (utmMedium) utmParts.push(`utm_medium=${encodeURIComponent(utmMedium)}`)
    if (utmCampaign) utmParts.push(`utm_campaign=${encodeURIComponent(utmCampaign)}`)
    if (utmParts.length === 0) return dest
    const separator = dest.includes('?') ? '&' : '?'
    return `${dest}${separator}${utmParts.join('&')}`
  }

  return NextResponse.redirect(buildDestUrl())
}
