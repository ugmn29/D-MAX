import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// 来院済みとみなすステータス（Prisma enum keys）
const VISITED_STATUSES = ['CHECKED_IN', 'IN_TREATMENT', 'PAYMENT', 'COMPLETED']

// コホート追跡オフセット（ヶ月）
const COHORT_OFFSETS = [1, 2, 3, 6]

function toYearMonth(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function addMonths(yearMonth: string, offset: number): string {
  const [y, m] = yearMonth.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + offset, 1))
  return toYearMonth(d)
}

// GET /api/analytics/retention?clinic_id=xxx&start_date=yyyy-mm-dd&end_date=yyyy-mm-dd
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'clinic_id, start_date, end_date are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()
    const cohortStart = new Date(start_date)
    const cohortEnd = new Date(end_date)

    // リターン追跡のためにクエリ範囲を最大オフセット分延長
    const queryEnd = new Date(cohortEnd)
    queryEnd.setMonth(queryEnd.getMonth() + Math.max(...COHORT_OFFSETS) + 1)

    // 来院済み予約を全件取得（コホート開始日以降）
    const allVisits = await prisma.appointments.findMany({
      where: {
        clinic_id,
        status: { in: VISITED_STATUSES as any[] },
        is_block: false,
        appointment_date: {
          gte: cohortStart,
          lte: queryEnd,
        },
      },
      select: {
        patient_id: true,
        appointment_date: true,
      },
      orderBy: { appointment_date: 'asc' },
    })

    // 患者ごとの来院月セットを構築
    const patientVisitMonths = new Map<string, Set<string>>()
    const patientFirstVisit = new Map<string, string>() // patient_id -> yearMonth

    allVisits.forEach(visit => {
      const ym = toYearMonth(visit.appointment_date)
      if (!patientVisitMonths.has(visit.patient_id)) {
        patientVisitMonths.set(visit.patient_id, new Set())
      }
      patientVisitMonths.get(visit.patient_id)!.add(ym)
    })

    // 各患者の最初の来院月を特定（クエリはstart_date以降なので要追加チェック）
    // コホート開始日以前の初診も拾うため、別途早期の来院を取得する
    const allEarliestVisits = await prisma.appointments.findMany({
      where: {
        clinic_id,
        status: { in: VISITED_STATUSES as any[] },
        is_block: false,
        appointment_date: { lt: cohortStart },
        patient_id: { in: Array.from(patientVisitMonths.keys()) },
      },
      select: {
        patient_id: true,
        appointment_date: true,
      },
      orderBy: { appointment_date: 'asc' },
    })

    // 期間より前に来院歴がある患者を除外（真の初診患者のみをコホートに含める）
    const patientsWithPriorVisit = new Set<string>()
    allEarliestVisits.forEach(visit => {
      patientsWithPriorVisit.add(visit.patient_id)
    })

    // コホート月ごとに患者を振り分け（初診患者のみ）
    const cohorts = new Map<string, string[]>() // yearMonth -> patient_ids

    allVisits.forEach(visit => {
      const ym = toYearMonth(visit.appointment_date)
      const visitDate = visit.appointment_date

      // このレコードが患者の最初の来院かチェック
      if (patientFirstVisit.has(visit.patient_id)) return // 既に最初の来院を記録済み
      if (patientsWithPriorVisit.has(visit.patient_id)) return // 事前来院歴あり → コホート除外
      if (visitDate < cohortStart || visitDate > cohortEnd) return // コホート期間外

      patientFirstVisit.set(visit.patient_id, ym)
      if (!cohorts.has(ym)) cohorts.set(ym, [])
      cohorts.get(ym)!.push(visit.patient_id)
    })

    // コホートデータを構築
    const cohortRows = Array.from(cohorts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([cohortMonth, patientIds]) => {
        const initialCount = patientIds.length

        const months = COHORT_OFFSETS.map(offset => {
          const targetMonth = addMonths(cohortMonth, offset)
          // そのコホートの将来月に来院した患者数
          const returnCount = patientIds.filter(pid => {
            const visits = patientVisitMonths.get(pid)
            return visits?.has(targetMonth) ?? false
          }).length

          return {
            month_offset: offset,
            count: returnCount,
            rate: initialCount > 0 ? (returnCount / initialCount) * 100 : 0,
          }
        })

        return {
          cohort_month: cohortMonth,
          initial_count: initialCount,
          months,
        }
      })

    // 全体サマリー
    const totalInitial = cohortRows.reduce((s, r) => s + r.initial_count, 0)
    const summaryMonths = COHORT_OFFSETS.map(offset => {
      const row = cohortRows.find(r => r.months.find(m => m.month_offset === offset))
      const totalReturn = cohortRows.reduce((s, r) => {
        const m = r.months.find(m => m.month_offset === offset)
        return s + (m?.count ?? 0)
      }, 0)
      return {
        month_offset: offset,
        count: totalReturn,
        rate: totalInitial > 0 ? (totalReturn / totalInitial) * 100 : 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        cohorts: cohortRows,
        summary: {
          total_initial: totalInitial,
          months: summaryMonths,
        },
        offsets: COHORT_OFFSETS,
      },
    })
  } catch (error) {
    console.error('[リテンション分析API] エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
