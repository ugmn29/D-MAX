import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

/**
 * POST /api/questionnaire-responses
 * 問診表の回答を作成
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { questionnaire_id, patient_id, appointment_id, response_data, completed_at } = body

    if (!questionnaire_id || !response_data) {
      return NextResponse.json(
        { error: 'questionnaire_id and response_data are required' },
        { status: 400 }
      )
    }

    const response = await prisma.questionnaire_responses.create({
      data: {
        questionnaire_id,
        patient_id: patient_id || null,
        appointment_id: appointment_id || null,
        response_data,
        completed_at: completed_at || new Date().toISOString()
      }
    })

    const responseWithStringDates = convertDatesToStrings(response, ['created_at', 'updated_at', 'completed_at'])

    return NextResponse.json({ id: response.id, ...responseWithStringDates })
  } catch (error) {
    console.error('問診表回答作成エラー:', error)
    return NextResponse.json(
      { error: '問診表回答の作成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/questionnaire-responses?type=unlinked&clinic_id=xxx
 * 未連携の問診票回答を取得
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const clinicId = searchParams.get('clinic_id')

    if (type === 'unlinked') {
      // 1. patient_idがnullの問診票を取得
      const nullPatientResponses = await prisma.questionnaire_responses.findMany({
        where: {
          patient_id: null
        },
        include: {
          questionnaires: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      // 2. 仮登録患者(is_registered=false)に紐づいている問診票を取得
      const tempPatientResponses = await prisma.questionnaire_responses.findMany({
        where: {
          patient_id: {
            not: null
          },
          patients: {
            is_registered: false
          }
        },
        include: {
          questionnaires: {
            select: {
              id: true,
              name: true
            }
          },
          patients: {
            select: {
              id: true,
              is_registered: true
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      // 3. 両方を結合（重複を除外）
      const allResponses = [
        ...nullPatientResponses,
        ...tempPatientResponses
      ]

      // IDで重複を除外
      const uniqueResponses = Array.from(
        new Map(allResponses.map(r => [r.id, r])).values()
      )

      const mappedResponses = uniqueResponses.map(r => ({
        ...convertDatesToStrings(r, ['created_at', 'updated_at', 'completed_at']),
        questionnaire: r.questionnaires
      }))

      return NextResponse.json(mappedResponses)
    }

    if (type === 'debug') {
      const responses = await prisma.questionnaire_responses.findMany({
        orderBy: { created_at: 'desc' }
      })
      const mapped = responses.map(r => convertDatesToStrings(r, ['created_at', 'updated_at', 'completed_at']))
      return NextResponse.json(mapped)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('問診票回答取得エラー:', error)
    return NextResponse.json(
      { error: '問診票回答の取得に失敗しました' },
      { status: 500 }
    )
  }
}
