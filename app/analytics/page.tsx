'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Target,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react'

// 仮のKPIデータ
const mockKPIs = {
  monthlyRevenue: {
    current: 2850000,
    previous: 2650000,
    growth: 7.5
  },
  appointmentRate: {
    current: 85.2,
    previous: 82.1,
    growth: 3.8
  },
  newPatients: {
    current: 28,
    previous: 22,
    growth: 27.3
  },
  cancellationRate: {
    current: 8.5,
    previous: 12.3,
    growth: -30.9
  },
  averageRevenue: {
    current: 12500,
    previous: 11800,
    growth: 5.9
  },
  recallRate: {
    current: 68.5,
    previous: 64.2,
    growth: 6.7
  }
}

const improvementSuggestions = [
  {
    id: 1,
    type: 'warning',
    title: 'リマインド通知の強化を推奨',
    description: 'キャンセル率が8.5%です。リマインド通知を2日前と当日に送信することで、さらに改善できる可能性があります。',
    impact: '予想キャンセル率改善: 3-5%',
    action: 'リマインド設定を確認'
  },
  {
    id: 2,
    type: 'success',
    title: '新患獲得が好調',
    description: '新患数が前月比27.3%増加しています。現在のマーケティング施策を継続することをお勧めします。',
    impact: 'ROI向上継続',
    action: 'マーケティング予算維持'
  },
  {
    id: 3,
    type: 'info',
    title: 'リコール率向上の余地',
    description: 'リコール率68.5%は業界平均を上回っていますが、75%を目標にさらなる向上が期待できます。',
    impact: '予想収益増加: 月額15-20万円',
    action: 'リコールシステム見直し'
  }
]

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  })
}

function formatGrowth(growth: number): string {
  const prefix = growth >= 0 ? '+' : ''
  return `${prefix}${growth.toFixed(1)}%`
}

function getGrowthColor(growth: number): string {
  if (growth > 0) return 'text-green-600'
  if (growth < 0) return 'text-red-600'
  return 'text-gray-600'
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              経営分析
            </h1>
            <p className="text-gray-600">リアルタイムKPIとAI改善提案による経営サポート</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              期間選択
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              レポート出力
            </Button>
          </div>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">月間売上</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mockKPIs.monthlyRevenue.current)}
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.monthlyRevenue.growth)}`}>
                    {formatGrowth(mockKPIs.monthlyRevenue.growth)} 前月比
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">予約充填率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockKPIs.appointmentRate.current}%
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.appointmentRate.growth)}`}>
                    {formatGrowth(mockKPIs.appointmentRate.growth)} 前月比
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">新患数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockKPIs.newPatients.current}名
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.newPatients.growth)}`}>
                    {formatGrowth(mockKPIs.newPatients.growth)} 前月比
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">キャンセル率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockKPIs.cancellationRate.current}%
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.cancellationRate.growth)}`}>
                    {formatGrowth(mockKPIs.cancellationRate.growth)} 前月比
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">平均診療単価</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(mockKPIs.averageRevenue.current)}
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.averageRevenue.growth)}`}>
                    {formatGrowth(mockKPIs.averageRevenue.growth)} 前月比
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">リコール率</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mockKPIs.recallRate.current}%
                  </p>
                  <p className={`text-sm ${getGrowthColor(mockKPIs.recallRate.growth)}`}>
                    {formatGrowth(mockKPIs.recallRate.growth)} 前月比
                  </p>
                </div>
                <Target className="w-8 h-8 text-teal-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI改善提案 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              AI改善提案
            </CardTitle>
            <p className="text-sm text-gray-600">
              データ分析に基づく具体的な改善アクションを提案します
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {improvementSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    suggestion.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-400'
                      : suggestion.type === 'success'
                      ? 'bg-green-50 border-green-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>予想効果:</strong> {suggestion.impact}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4">
                      {suggestion.action}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* グラフ・詳細分析エリア */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>売上推移</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>グラフ表示エリア</p>
                  <p className="text-sm">(Chart.jsまたはRecharts実装予定)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>スタッフ別生産性</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">田中先生</p>
                    <p className="text-sm text-gray-600">時間あたり売上</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥15,500</p>
                    <p className="text-sm text-green-600">+8.2%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">佐藤DH</p>
                    <p className="text-sm text-gray-600">時間あたり売上</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥8,800</p>
                    <p className="text-sm text-green-600">+12.1%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">山田先生</p>
                    <p className="text-sm text-gray-600">時間あたり売上</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥13,200</p>
                    <p className="text-sm text-red-600">-2.5%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}