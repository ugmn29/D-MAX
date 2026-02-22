import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

interface FunnelStepData {
  step_number: number
  step_name: string
  step_label: string
  session_count: number
  drop_off_count: number
  drop_off_rate: number
  conversion_rate: number
}

const FUNNEL_STEP_LABELS: Record<number, { name: string; label: string }> = {
  1: { name: 'landing', label: 'ランディング' },
  2: { name: 'date_selection', label: '日付選択' },
  3: { name: 'time_selection', label: '時間選択' },
  4: { name: 'menu_selection', label: 'メニュー選択' },
  5: { name: 'patient_info', label: '患者情報入力' },
  6: { name: 'complete', label: '予約完了' },
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // ファネルイベントを取得
    const funnelWhere: any = { clinic_id }
    if (start_date) {
      funnelWhere.event_timestamp = { ...funnelWhere.event_timestamp, gte: new Date(start_date) }
    }
    if (end_date) {
      funnelWhere.event_timestamp = { ...funnelWhere.event_timestamp, lte: new Date(end_date) }
    }

    const data = await prisma.web_booking_funnel_events.findMany({
      where: funnelWhere,
      orderBy: { event_timestamp: 'asc' },
    })

    // セッションごとに到達したステップを集計
    const sessionSteps = new Map<string, Set<number>>()

    data?.forEach((event) => {
      if (!sessionSteps.has(event.session_id)) {
        sessionSteps.set(event.session_id, new Set())
      }
      sessionSteps.get(event.session_id)!.add(event.step_number)
    })

    // 各ステップに到達したセッション数をカウント
    const stepCounts = new Map<number, number>()
    for (let step = 1; step <= 6; step++) {
      stepCounts.set(step, 0)
    }

    sessionSteps.forEach((steps) => {
      steps.forEach((stepNum) => {
        stepCounts.set(stepNum, stepCounts.get(stepNum)! + 1)
      })
    })

    // ファネルデータを構築
    const funnelData: FunnelStepData[] = []
    const totalSessions = stepCounts.get(1) || 0

    for (let step = 1; step <= 6; step++) {
      const currentCount = stepCounts.get(step) || 0
      const nextCount = stepCounts.get(step + 1) || 0
      const dropOffCount = currentCount - nextCount

      const stepInfo = FUNNEL_STEP_LABELS[step]

      funnelData.push({
        step_number: step,
        step_name: stepInfo.name,
        step_label: stepInfo.label,
        session_count: currentCount,
        drop_off_count: dropOffCount,
        drop_off_rate: currentCount > 0 ? (dropOffCount / currentCount) * 100 : 0,
        conversion_rate: totalSessions > 0 ? (currentCount / totalSessions) * 100 : 0,
      })
    }

    // 流入元別のファネル分析（utm_source + utm_medium で区別）
    const sourceSessionSteps = new Map<string, Map<string, Set<number>>>()
    const sourceMetaMap = new Map<string, { utm_source: string; utm_medium: string }>()

    data?.forEach((event) => {
      const utmSource = event.utm_source || 'organic'
      const utmMedium = event.utm_medium || 'direct'
      const sourceKey = `${utmSource}/${utmMedium}`
      if (!sourceSessionSteps.has(sourceKey)) {
        sourceSessionSteps.set(sourceKey, new Map())
        sourceMetaMap.set(sourceKey, { utm_source: utmSource, utm_medium: utmMedium })
      }
      const sourceSessions = sourceSessionSteps.get(sourceKey)!
      if (!sourceSessions.has(event.session_id)) {
        sourceSessions.set(event.session_id, new Set())
      }
      sourceSessions.get(event.session_id)!.add(event.step_number)
    })

    const funnelBySource = Array.from(sourceSessionSteps.entries()).map(
      ([sourceKey, sessions]) => {
        const meta = sourceMetaMap.get(sourceKey)!
        const sourceStepCounts = new Map<number, number>()
        for (let step = 1; step <= 6; step++) {
          sourceStepCounts.set(step, 0)
        }

        sessions.forEach((steps) => {
          steps.forEach((stepNum) => {
            sourceStepCounts.set(stepNum, sourceStepCounts.get(stepNum)! + 1)
          })
        })

        const sourceTotalSessions = sourceStepCounts.get(1) || 0
        const completedSessions = sourceStepCounts.get(6) || 0

        return {
          source: sourceKey,
          utm_source: meta.utm_source,
          utm_medium: meta.utm_medium,
          total_sessions: sourceTotalSessions,
          completed_sessions: completedSessions,
          completion_rate:
            sourceTotalSessions > 0
              ? (completedSessions / sourceTotalSessions) * 100
              : 0,
          step_counts: Array.from(sourceStepCounts.entries()).map(
            ([step, count]) => ({
              step,
              count,
              conversion_rate:
                sourceTotalSessions > 0 ? (count / sourceTotalSessions) * 100 : 0,
            })
          ),
        }
      }
    )

    funnelBySource.sort((a, b) => b.total_sessions - a.total_sessions)

    return NextResponse.json({
      success: true,
      data: {
        overall_funnel: funnelData,
        total_sessions: totalSessions,
        completed_sessions: stepCounts.get(6) || 0,
        overall_completion_rate:
          totalSessions > 0 ? ((stepCounts.get(6) || 0) / totalSessions) * 100 : 0,
        funnel_by_source: funnelBySource,
      },
    })
  } catch (error) {
    console.error('ファネル分析APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
