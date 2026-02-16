import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * GET /api/questionnaire-responses/patient?patientId=xxx
 * 特定の患者に連携された問診票回答を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      )
    }

    const responses = await prisma.questionnaire_responses.findMany({
      where: {
        patient_id: patientId
      },
      include: {
        questionnaires: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // questionnairesをquestionnaireにマッピング
    const mappedData = responses.map(response => ({
      ...convertDatesToStrings(response, ['created_at', 'updated_at', 'completed_at']),
      questionnaire: response.questionnaires
    }))

    return NextResponse.json(mappedData)
  } catch (error) {
    console.error('連携済み問診票取得エラー:', error)
    return NextResponse.json(
      { error: '連携済み問診票の取得に失敗しました' },
      { status: 500 }
    )
  }
}
