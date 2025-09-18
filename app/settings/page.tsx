'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Building2,
  Calendar,
  Users,
  Stethoscope,
  MessageSquare,
  Globe,
  Bell,
  Database,
  BarChart3,
  Clock
} from 'lucide-react'

const settingCategories = [
  {
    id: 'clinic',
    name: 'クリニック設定',
    icon: Building2,
    description: 'クリニックの基本情報と診療時間の設定',
    items: ['基本情報', '診療時間', '休診日設定']
  },
  {
    id: 'calendar',
    name: 'カレンダー表示設定',
    icon: Calendar,
    description: 'カレンダーの表示形式とレイアウトの設定',
    items: ['表示項目', 'グリッド設定', '色設定', 'セル表示設定']
  },
  {
    id: 'staff',
    name: 'スタッフ・ユニット',
    icon: Users,
    description: 'スタッフとユニット（診療台）の管理',
    items: ['スタッフ管理', 'ユニット管理', '役職設定']
  },
  {
    id: 'treatment',
    name: '診療メニュー',
    icon: Stethoscope,
    description: '診療メニューの3階層設定',
    items: ['大分類', '中分類', '詳細設定']
  },
  {
    id: 'questionnaire',
    name: '問診表',
    icon: MessageSquare,
    description: 'Web問診表の設定と管理',
    items: ['問診設定', 'テンプレート管理', '送信タイミング']
  },
  {
    id: 'web',
    name: 'Web予約',
    icon: Globe,
    description: 'Web予約システムの設定',
    items: ['予約設定', '予約ページ', '診療メニュー設定']
  },
  {
    id: 'notification',
    name: '通知設定',
    icon: Bell,
    description: 'メール・SMS・LINE通知の設定',
    items: ['通知設定', '送信失敗管理', 'リマインド設定']
  },
  {
    id: 'master',
    name: 'マスタ設定',
    icon: Database,
    description: '特記事項アイコンや基本データの管理',
    items: ['患者特記事項', 'キャンセル種類', '支払い設定']
  },
  {
    id: 'analytics',
    name: '分析設定',
    icon: BarChart3,
    description: '経営分析とレポートの設定',
    items: ['KPI設定', 'スタッフ評価', 'マーケティング設定']
  }
]

export default function SettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2" />
            設定
          </h1>
          <p className="text-gray-600">D-MAXシステムの各種設定を管理します</p>
        </div>

        {/* 設定カテゴリ一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Icon className="w-5 h-5 mr-2 text-dmax-primary" />
                    {category.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.items.map((item, index) => (
                      <li key={index} className="text-sm text-gray-500 flex items-center">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    設定を開く
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* クイック設定 */}
        <Card>
          <CardHeader>
            <CardTitle>クイック設定</CardTitle>
            <p className="text-sm text-gray-600">よく使用される設定への素早いアクセス</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-dmax-primary" />
                  <p className="font-medium">診療時間</p>
                  <p className="text-xs text-gray-500">営業時間の変更</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-dmax-primary" />
                  <p className="font-medium">スタッフ</p>
                  <p className="text-xs text-gray-500">スタッフ情報管理</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-dmax-primary" />
                  <p className="font-medium">通知</p>
                  <p className="text-xs text-gray-500">リマインド設定</p>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Globe className="w-6 h-6 mx-auto mb-2 text-dmax-primary" />
                  <p className="font-medium">Web予約</p>
                  <p className="text-xs text-gray-500">予約ページ設定</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* システム情報 */}
        <Card>
          <CardHeader>
            <CardTitle>システム情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">バージョン</p>
                <p className="font-medium">D-MAX v1.0.0</p>
              </div>
              <div>
                <p className="text-gray-600">最終更新</p>
                <p className="font-medium">2024年9月18日</p>
              </div>
              <div>
                <p className="text-gray-600">ストレージ使用量</p>
                <p className="font-medium">2.1GB / 10GB</p>
              </div>
              <div>
                <p className="text-gray-600">データベース</p>
                <p className="font-medium">正常</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}