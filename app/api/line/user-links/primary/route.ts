import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/line/user-links/primary?lineUserId=xxx
 * プライマリ患者を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const lineUserId = searchParams.get('lineUserId')

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      )
    }

    // プライマリ患者を取得
    let primaryLink = await prisma.line_user_links.findFirst({
      where: {
        line_user_id: lineUserId,
        is_primary: true
      }
    })

    // プライマリがない場合、最初に連携した患者を返す
    if (!primaryLink) {
      primaryLink = await prisma.line_user_links.findFirst({
        where: {
          line_user_id: lineUserId
        },
        orderBy: {
          linked_at: 'asc'
        }
      })
    }

    if (!primaryLink) {
      return NextResponse.json(null)
    }

    const linkWithStringDates = convertDatesToStrings(primaryLink, ['created_at', 'updated_at', 'linked_at', 'last_selected_at', 'last_interaction_at'])

    return NextResponse.json(linkWithStringDates)
  } catch (error) {
    console.error('プライマリ患者取得エラー:', error)
    return NextResponse.json(null)
  }
}
