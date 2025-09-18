'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, BarChart3 } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* カレンダー機能 */}
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Calendar className="w-8 h-8 text-dmax-primary mr-3" />
              <CardTitle className="text-lg">予約カレンダー</CardTitle>
            </div>
            <CardDescription>
              日々の予約を効率的に管理し、スタッフの稼働状況を可視化します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• ドラッグ&ドロップによる予約編集</li>
              <li>• リアルタイム同期</li>
              <li>• 複数表示形式対応</li>
            </ul>
          </CardContent>
        </Card>

        {/* 患者管理機能 */}
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Users className="w-8 h-8 text-dmax-primary mr-3" />
              <CardTitle className="text-lg">患者管理</CardTitle>
            </div>
            <CardDescription>
              患者情報を一元管理し、家族連携による効率的な運用を実現します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 診療履歴・治療計画</li>
              <li>• サブカルテ機能</li>
              <li>• 家族連携管理</li>
            </ul>
          </CardContent>
        </Card>

        {/* 経営分析機能 */}
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <BarChart3 className="w-8 h-8 text-dmax-primary mr-3" />
              <CardTitle className="text-lg">経営分析</CardTitle>
            </div>
            <CardDescription>
              リアルタイムKPIとAI改善提案により、経営効率化をサポートします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• マーケティングROI分析</li>
              <li>• AI経営支援</li>
              <li>• スタッフ評価分析</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 今日の状況 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>今日の状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-400">0</div>
              <div className="text-sm text-gray-600">未来院</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">0</div>
              <div className="text-sm text-gray-600">遅刻</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">来院済み</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">0</div>
              <div className="text-sm text-gray-600">診療中</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">0</div>
              <div className="text-sm text-gray-600">会計</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">0</div>
              <div className="text-sm text-gray-600">終了</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}