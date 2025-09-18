'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  Search,
  Plus,
  Settings
} from 'lucide-react'

// 仮の予約データ
const mockAppointments = [
  {
    id: '1',
    patient_name: '田中 太郎',
    patient_id: '1',
    date: '2024-09-18',
    start_time: '09:00',
    end_time: '09:30',
    menu: 'う蝕治療',
    staff: '田中先生',
    status: '予約済み',
    unit: 'チェア1'
  },
  {
    id: '2',
    patient_name: '佐藤 花子',
    patient_id: '2',
    date: '2024-09-18',
    start_time: '10:00',
    end_time: '10:30',
    menu: '定期検診',
    staff: '佐藤DH',
    status: '診療中',
    unit: 'チェア2'
  },
  {
    id: '3',
    patient_name: '山田 次郎',
    patient_id: '3',
    date: '2024-09-18',
    start_time: '14:00',
    end_time: '14:45',
    menu: 'クリーニング',
    staff: '田中先生',
    status: '来院済み',
    unit: 'チェア1'
  },
  {
    id: '4',
    patient_name: '鈴木 美咲',
    patient_id: '4',
    date: '2024-09-19',
    start_time: '11:00',
    end_time: '11:30',
    menu: '矯正相談',
    staff: '山田先生',
    status: '予約済み',
    unit: 'チェア3'
  }
]

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const MONTHS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
]

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    '予約済み': 'bg-blue-100 text-blue-800 border-blue-200',
    '来院済み': 'bg-green-100 text-green-800 border-green-200',
    '診療中': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    '会計': 'bg-purple-100 text-purple-800 border-purple-200',
    '終了': 'bg-gray-100 text-gray-800 border-gray-200',
    'キャンセル': 'bg-red-100 text-red-800 border-red-200'
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [appointments, setAppointments] = useState(mockAppointments)
  const [searchQuery, setSearchQuery] = useState('')

  // 選択された日付の予約を取得
  const selectedDateAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date)
    return appointmentDate.toDateString() === selectedDate.toDateString()
  })

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    setSelectedDate(newDate)
  }

  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    setSelectedDate(newDate)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              予約カレンダー
            </h1>
            <p className="text-gray-600">
              {selectedDate.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode('day')}>
              日
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('week')}>
              週
            </Button>
            <Button variant="outline" size="sm" onClick={() => setViewMode('month')}>
              月
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新規予約
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左カラム: ミニカレンダー・検索 */}
          <div className="space-y-4">
            {/* ナビゲーション */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="sm" onClick={goToPrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-medium">
                    {currentDate.getFullYear()}年 {MONTHS[currentDate.getMonth()]}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={goToNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday} className="w-full">
                  今日
                </Button>
              </CardContent>
            </Card>

            {/* 検索 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">患者検索</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="患者名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 今日の統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">今日の状況</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">総予約数</span>
                  <span className="font-bold text-lg">{selectedDateAppointments.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">来院済み</span>
                  <span className="font-bold text-green-600">
                    {selectedDateAppointments.filter(a => a.status === '来院済み').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">診療中</span>
                  <span className="font-bold text-yellow-600">
                    {selectedDateAppointments.filter(a => a.status === '診療中').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">予約済み</span>
                  <span className="font-bold text-blue-600">
                    {selectedDateAppointments.filter(a => a.status === '予約済み').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム: 予約一覧 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {selectedDate.toLocaleDateString('ja-JP', {
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })} の予約
                  </span>
                  <span className="text-sm font-normal text-gray-500">
                    {selectedDateAppointments.length}件
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">この日は予約がありません</p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      新規予約を作成
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateAppointments
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <p className="font-bold text-lg">
                                  {appointment.start_time}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {appointment.end_time}
                                </p>
                              </div>
                              <div className="border-l border-gray-300 pl-4">
                                <p className="font-medium text-lg">
                                  {appointment.patient_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {appointment.menu}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                  <User className="w-3 h-3" />
                                  <span>{appointment.staff}</span>
                                  <span>•</span>
                                  <span>{appointment.unit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}