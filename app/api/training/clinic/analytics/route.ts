import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET /api/training/clinic/analytics?clinic_id=xxx
// トレーニング分析データを取得
export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(req.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    // 全体統計
    const patients = await prisma.patients.findMany({
      where: { clinic_id: clinicId, is_deleted: false },
      select: { id: true },
    })

    const activeMenus = await prisma.training_menus.findMany({
      where: { is_active: true },
      select: { patient_id: true },
    })

    // 今月の処方数
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyMenus = await prisma.training_menus.findMany({
      where: {
        prescribed_at: { gte: startOfMonth },
      },
      select: { id: true },
    })

    // 今月の評価数
    const monthlyEvals = await prisma.training_evaluations.findMany({
      where: {
        evaluated_at: { gte: startOfMonth },
      },
      select: { id: true },
    })

    const stats = {
      totalPatients: patients.length,
      activePatients: activeMenus.length,
      monthlyPrescriptions: monthlyMenus.length,
      monthlyEvaluations: monthlyEvals.length,
    }

    // トレーニング統計
    const allMenuTrainings = await prisma.menu_trainings.findMany({
      include: {
        trainings: {
          select: { training_name: true },
        },
      },
    })

    const allEvaluations = await prisma.training_evaluations.findMany({
      select: {
        training_id: true,
        evaluation_level: true,
      },
    })

    // トレーニング別に集計
    const trainingMap = new Map<string, { name: string; prescriptions: number; level3: number; total: number }>()

    allMenuTrainings.forEach((mt) => {
      const trainingId = mt.training_id
      const trainingName = mt.trainings?.training_name || '不明'
      if (!trainingMap.has(trainingId)) {
        trainingMap.set(trainingId, { name: trainingName, prescriptions: 0, level3: 0, total: 0 })
      }
      trainingMap.get(trainingId)!.prescriptions++
    })

    allEvaluations.forEach((ev) => {
      const trainingId = ev.training_id
      if (trainingMap.has(trainingId)) {
        trainingMap.get(trainingId)!.total++
        if (ev.evaluation_level === 3) {
          trainingMap.get(trainingId)!.level3++
        }
      }
    })

    const trainingStats = Array.from(trainingMap.entries()).map(([id, data]) => ({
      training_name: data.name,
      prescription_count: data.prescriptions,
      level3_count: data.level3,
      total_evaluations: data.total,
      achievement_rate: data.total > 0 ? (data.level3 / data.total) * 100 : 0,
    }))

    // 評価レベル分布
    const distribution = [
      { level: 1, count: 0 },
      { level: 2, count: 0 },
      { level: 3, count: 0 },
    ]

    allEvaluations.forEach((ev) => {
      const idx = distribution.findIndex((d) => d.level === ev.evaluation_level)
      if (idx !== -1) distribution[idx].count++
    })

    // 課題統計
    const patientIssueRecords = await prisma.patient_issue_records.findMany({
      include: {
        patient_issues: {
          select: { name: true },
        },
      },
    })

    const issueMap = new Map<string, { name: string; count: number }>()

    patientIssueRecords.forEach((pi) => {
      const issueName = pi.patient_issues?.name || '不明'
      if (!issueMap.has(issueName)) {
        issueMap.set(issueName, { name: issueName, count: 0 })
      }
      issueMap.get(issueName)!.count++
    })

    const issueStats = Array.from(issueMap.entries())
      .map(([name, data]) => ({
        issue_name: data.name,
        patient_count: data.count,
      }))
      .sort((a, b) => b.patient_count - a.patient_count)

    return NextResponse.json({
      stats,
      trainingStats,
      evaluationDist: distribution,
      issueStats,
    })
  } catch (error: any) {
    console.error('分析データ取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
