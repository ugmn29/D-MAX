import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/line/conversation-states?lineUserId=xxx
 * 対話状態を取得
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

    const state = await prisma.line_conversation_states.findUnique({
      where: {
        line_user_id: lineUserId
      }
    })

    if (!state) {
      return NextResponse.json(null)
    }

    const stateWithStringDates = convertDatesToStrings(state, ['created_at', 'updated_at', 'expires_at'])

    return NextResponse.json(stateWithStringDates)
  } catch (error) {
    console.error('対話状態取得エラー:', error)
    return NextResponse.json(
      { error: '対話状態の取得に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/line/conversation-states
 * 対話状態を作成/更新（upsert）
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { lineUserId, state, context, expires_at } = body

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      )
    }

    const stateData: any = {
      line_user_id: lineUserId,
      updated_at: new Date()
    }

    if (state !== undefined) stateData.state = state
    if (context !== undefined) stateData.context = context
    if (expires_at !== undefined) stateData.expires_at = expires_at ? new Date(expires_at) : null

    const result = await prisma.line_conversation_states.upsert({
      where: {
        line_user_id: lineUserId
      },
      update: stateData,
      create: {
        ...stateData,
        created_at: new Date()
      }
    })

    const resultWithStringDates = convertDatesToStrings(result, ['created_at', 'updated_at', 'expires_at'])

    return NextResponse.json(resultWithStringDates)
  } catch (error) {
    console.error('対話状態更新エラー:', error)
    return NextResponse.json(
      { error: '対話状態の更新に失敗しました' },
      { status: 500 }
    )
  }
}
