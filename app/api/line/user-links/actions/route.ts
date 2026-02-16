import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST /api/line/user-links/actions
 * LINE連携の各種アクション（患者切り替え、ブロック状態更新など）
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { action, lineUserId, patientId, isBlocked } = body

    if (!action || !lineUserId) {
      return NextResponse.json(
        { error: 'action and lineUserId are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'switch-patient':
        // 患者切り替え
        if (!patientId) {
          return NextResponse.json(
            { error: 'patientId is required for switch-patient action' },
            { status: 400 }
          )
        }

        const link = await prisma.line_user_links.findFirst({
          where: {
            line_user_id: lineUserId,
            patient_id: patientId
          }
        })

        if (!link) {
          return NextResponse.json(
            { error: '該当の連携が見つかりません' },
            { status: 404 }
          )
        }

        // last_selected_at を更新
        await prisma.line_user_links.update({
          where: {
            id: link.id
          },
          data: {
            last_selected_at: new Date(),
            updated_at: new Date()
          }
        })

        // 対話状態のコンテキストを更新
        await prisma.line_conversation_states.upsert({
          where: {
            line_user_id: lineUserId
          },
          update: {
            context: {
              selectedPatientId: patientId
            },
            updated_at: new Date()
          },
          create: {
            line_user_id: lineUserId,
            state: 'idle',
            context: {
              selectedPatientId: patientId
            },
            created_at: new Date(),
            updated_at: new Date()
          }
        })

        return NextResponse.json({ success: true })

      case 'update-block-status':
        // ブロック状態を更新
        if (!patientId || isBlocked === undefined) {
          return NextResponse.json(
            { error: 'patientId and isBlocked are required for update-block-status action' },
            { status: 400 }
          )
        }

        await prisma.line_user_links.updateMany({
          where: {
            line_user_id: lineUserId,
            patient_id: patientId
          },
          data: {
            is_blocked: isBlocked,
            updated_at: new Date()
          }
        })

        return NextResponse.json({ success: true })

      case 'update-last-interaction':
        // 最終やり取り日時を更新
        if (!patientId) {
          return NextResponse.json(
            { error: 'patientId is required for update-last-interaction action' },
            { status: 400 }
          )
        }

        await prisma.line_user_links.updateMany({
          where: {
            line_user_id: lineUserId,
            patient_id: patientId
          },
          data: {
            last_interaction_at: new Date(),
            updated_at: new Date()
          }
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('LINE連携アクションエラー:', error)
    return NextResponse.json(
      { error: 'アクションの実行に失敗しました' },
      { status: 500 }
    )
  }
}
