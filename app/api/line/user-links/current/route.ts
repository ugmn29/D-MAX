import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/line/user-links/current?lineUserId=xxx
 * 現在選択中の患者を取得
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

    // 対話状態から現在の患者IDを取得
    const state = await prisma.line_conversation_states.findUnique({
      where: {
        line_user_id: lineUserId
      },
      select: {
        context: true
      }
    })

    if (state?.context && typeof state.context === 'object' && 'selectedPatientId' in state.context) {
      return NextResponse.json({ patientId: (state.context as any).selectedPatientId })
    }

    // コンテキストにない場合、プライマリ患者を取得
    let primaryLink = await prisma.line_user_links.findFirst({
      where: {
        line_user_id: lineUserId,
        is_primary: true
      },
      select: {
        patient_id: true
      }
    })

    if (!primaryLink) {
      primaryLink = await prisma.line_user_links.findFirst({
        where: {
          line_user_id: lineUserId
        },
        orderBy: {
          linked_at: 'asc'
        },
        select: {
          patient_id: true
        }
      })
    }

    return NextResponse.json({ patientId: primaryLink?.patient_id || null })
  } catch (error) {
    console.error('現在の患者取得エラー:', error)
    return NextResponse.json({ patientId: null })
  }
}
