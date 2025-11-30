'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface Stats {
  totalPatients: number
  activePatients: number
  monthlyPrescriptions: number
  monthlyEvaluations: number
}

interface TrainingStats {
  training_name: string
  prescription_count: number
  level3_count: number
  total_evaluations: number
  achievement_rate: number
}

interface EvaluationDistribution {
  level: number
  count: number
}

interface IssueStats {
  issue_name: string
  patient_count: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'trainings' | 'evaluations' | 'timeline' | 'issues' | 'retention'>('overview')
  const [isLoading, setIsLoading] = useState(true)

  // データ
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    activePatients: 0,
    monthlyPrescriptions: 0,
    monthlyEvaluations: 0
  })
  const [trainingStats, setTrainingStats] = useState<TrainingStats[]>([])
  const [evaluationDist, setEvaluationDist] = useState<EvaluationDistribution[]>([])
  const [issueStats, setIssueStats] = useState<IssueStats[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      // 全体統計
      const { data: patients } = await supabase
        .from('patients')
        .select('id')
        .eq('clinic_id', DEMO_CLINIC_ID)
        .eq('is_deleted', false)

      const { data: activeMenus } = await supabase
        .from('training_menus')
        .select('patient_id')
        .eq('is_active', true)

      // 今月の処方数
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: monthlyMenus } = await supabase
        .from('training_menus')
        .select('id')
        .gte('prescribed_at', startOfMonth.toISOString())

      // 今月の評価数
      const { data: monthlyEvals } = await supabase
        .from('training_evaluations')
        .select('id')
        .gte('evaluated_at', startOfMonth.toISOString())

      setStats({
        totalPatients: patients?.length || 0,
        activePatients: activeMenus?.length || 0,
        monthlyPrescriptions: monthlyMenus?.length || 0,
        monthlyEvaluations: monthlyEvals?.length || 0
      })

      // トレーニング統計
      const { data: allMenuTrainings } = await supabase
        .from('menu_trainings')
        .select(`
          training_id,
          trainings(training_name)
        `)

      const { data: allEvaluations } = await supabase
        .from('training_evaluations')
        .select('training_id, evaluation_level')

      // トレーニング別に集計
      const trainingMap = new Map<string, { name: string, prescriptions: number, level3: number, total: number }>()

      allMenuTrainings?.forEach((mt: any) => {
        const trainingId = mt.training_id
        const trainingName = mt.trainings?.training_name || '不明'
        if (!trainingMap.has(trainingId)) {
          trainingMap.set(trainingId, { name: trainingName, prescriptions: 0, level3: 0, total: 0 })
        }
        trainingMap.get(trainingId)!.prescriptions++
      })

      allEvaluations?.forEach((ev: any) => {
        const trainingId = ev.training_id
        if (trainingMap.has(trainingId)) {
          trainingMap.get(trainingId)!.total++
          if (ev.evaluation_level === 3) {
            trainingMap.get(trainingId)!.level3++
          }
        }
      })

      const trainingStatsArray: TrainingStats[] = Array.from(trainingMap.entries()).map(([id, data]) => ({
        training_name: data.name,
        prescription_count: data.prescriptions,
        level3_count: data.level3,
        total_evaluations: data.total,
        achievement_rate: data.total > 0 ? (data.level3 / data.total) * 100 : 0
      }))

      setTrainingStats(trainingStatsArray)

      // 評価レベル分布
      const distribution = [
        { level: 1, count: 0 },
        { level: 2, count: 0 },
        { level: 3, count: 0 }
      ]

      allEvaluations?.forEach((ev: any) => {
        const idx = distribution.findIndex(d => d.level === ev.evaluation_level)
        if (idx !== -1) distribution[idx].count++
      })

      setEvaluationDist(distribution)

      // 課題統計
      const { data: patientIssues } = await supabase
        .from('patient_issues')
        .select(`
          issue_id,
          issues(issue_name)
        `)

      const issueMap = new Map<string, { name: string, count: number }>()

      patientIssues?.forEach((pi: any) => {
        const issueName = pi.issues?.issue_name || '不明'
        if (!issueMap.has(issueName)) {
          issueMap.set(issueName, { name: issueName, count: 0 })
        }
        issueMap.get(issueName)!.count++
      })

      const issueStatsArray: IssueStats[] = Array.from(issueMap.entries())
        .map(([name, data]) => ({
          issue_name: data.name,
          patient_count: data.count
        }))
        .sort((a, b) => b.patient_count - a.patient_count)

      setIssueStats(issueStatsArray)

    } catch (error) {
      console.error('分析データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">分析</h1>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* タブナビゲーション */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: '全体統計', icon: '📊' },
              { id: 'trainings', label: 'トレーニング実施状況', icon: '🏋️' },
              { id: 'evaluations', label: '評価レベル分布', icon: '📈' },
              { id: 'timeline', label: '時系列', icon: '📅' },
              { id: 'issues', label: '課題分析', icon: '⚠️' },
              { id: 'retention', label: '継続率', icon: '⏱️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 全体統計タブ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">総患者数</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalPatients}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">アクティブ患者</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activePatients}</p>
                  </div>
                  <div className="text-4xl">💪</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">今月の処方数</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.monthlyPrescriptions}</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">今月の評価数</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.monthlyEvaluations}</p>
                  </div>
                  <div className="text-4xl">✅</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* トレーニング実施状況タブ */}
        {activeTab === 'trainings' && (
          <div className="space-y-6">
            {/* よく処方されるトレーニング TOP10 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">よく処方されるトレーニング TOP10</h2>
              <div className="space-y-2">
                {trainingStats
                  .sort((a, b) => b.prescription_count - a.prescription_count)
                  .slice(0, 10)
                  .map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{stat.training_name}</span>
                      </div>
                      <span className="text-blue-600 font-bold">{stat.prescription_count}回</span>
                    </div>
                  ))}
                {trainingStats.length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>

            {/* 達成率の高いトレーニング TOP10 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">達成率の高いトレーニング TOP10</h2>
              <div className="space-y-2">
                {trainingStats
                  .filter(stat => stat.total_evaluations > 0)
                  .sort((a, b) => b.achievement_rate - a.achievement_rate)
                  .slice(0, 10)
                  .map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{stat.training_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          レベル3: {stat.level3_count}/{stat.total_evaluations}回
                        </span>
                        <span className="text-green-600 font-bold">{stat.achievement_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                {trainingStats.filter(s => s.total_evaluations > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>

            {/* 達成率の低いトレーニング ワースト10 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">達成率の低いトレーニング ワースト10</h2>
              <div className="space-y-2">
                {trainingStats
                  .filter(stat => stat.total_evaluations > 0)
                  .sort((a, b) => a.achievement_rate - b.achievement_rate)
                  .slice(0, 10)
                  .map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{stat.training_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                          レベル3: {stat.level3_count}/{stat.total_evaluations}回
                        </span>
                        <span className="text-red-600 font-bold">{stat.achievement_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                {trainingStats.filter(s => s.total_evaluations > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 評価レベル分布タブ */}
        {activeTab === 'evaluations' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">全体の評価レベル分布</h2>
              <div className="space-y-4">
                {evaluationDist.map((dist) => {
                  const total = evaluationDist.reduce((sum, d) => sum + d.count, 0)
                  const percentage = total > 0 ? (dist.count / total) * 100 : 0
                  const color = dist.level === 1 ? 'bg-red-500' : dist.level === 2 ? 'bg-yellow-500' : 'bg-green-500'
                  const textColor = dist.level === 1 ? 'text-red-600' : dist.level === 2 ? 'text-yellow-600' : 'text-green-600'
                  const icon = dist.level === 1 ? '❌' : dist.level === 2 ? '⚠️' : '✅'

                  return (
                    <div key={dist.level}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {icon} レベル{dist.level}
                        </span>
                        <span className={`font-bold ${textColor}`}>
                          {dist.count}回 ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div
                          className={`${color} h-4 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
                {evaluationDist.every(d => d.count === 0) && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>

            {/* トレーニング別評価レベル分布 */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">トレーニング別の評価レベル分布</h2>
              <div className="space-y-4">
                {trainingStats
                  .filter(stat => stat.total_evaluations > 0)
                  .sort((a, b) => b.total_evaluations - a.total_evaluations)
                  .slice(0, 15)
                  .map((stat, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{stat.training_name}</span>
                        <span className="text-sm text-gray-500">総評価: {stat.total_evaluations}回</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">レベル3: {stat.level3_count}回</div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full"
                              style={{ width: `${stat.achievement_rate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {trainingStats.filter(s => s.total_evaluations > 0).length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 時系列タブ */}
        {activeTab === 'timeline' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">時系列データ</h2>
            <p className="text-gray-600">月別の推移グラフなどを表示します（実装予定）</p>
          </div>
        )}

        {/* 課題分析タブ */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">よく検出される課題 TOP10</h2>
              <div className="space-y-2">
                {issueStats.slice(0, 10).map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                      <span className="font-medium text-gray-900">{issue.issue_name}</span>
                    </div>
                    <span className="text-orange-600 font-bold">{issue.patient_count}名</span>
                  </div>
                ))}
                {issueStats.length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 継続率タブ */}
        {activeTab === 'retention' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">トレーニング継続率</h2>
            <p className="text-gray-600">処方から初回評価までの日数、完了までの平均日数などを表示します（実装予定）</p>
          </div>
        )}
      </div>
    </div>
  )
}
