'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAppointments, updateAppointmentStatus } from '@/lib/api/appointments'
import { getStaff } from '@/lib/api/staff'
import { Staff } from '@/types/database'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

// ステータス定義
const STATUS_CONFIG = {
  '未来院': { color: 'bg-gray-100 text-gray-800 border-gray-300', nextStatus: '遅刻' },
  '遅刻': { color: 'bg-orange-100 text-orange-800 border-orange-300', nextStatus: '来院済み' },
  '来院済み': { color: 'bg-blue-100 text-blue-800 border-blue-300', nextStatus: '診療中' },
  '診療中': { color: 'bg-purple-100 text-purple-800 border-purple-300', nextStatus: '会計' },
  '会計': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', nextStatus: '終了' },
  '終了': { color: 'bg-green-100 text-green-800 border-green-300', nextStatus: null }
}

const STATUS_ORDER = ['未来院', '遅刻', '来院済み', '診療中', '会計', '終了']

export default function PatientStatusPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedStaff])

  const loadData = async () => {
    try {
      setLoading(true)
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      const [appointmentsData, staffData] = await Promise.all([
        getAppointments(DEMO_CLINIC_ID, dateString, dateString),
        getStaff(DEMO_CLINIC_ID)
      ])

      // キャンセルを除外
      let filteredAppointments = appointmentsData.filter(apt => apt.status !== 'キャンセル')

      // スタッフフィルタ
      if (selectedStaff !== 'all') {
        filteredAppointments = filteredAppointments.filter(
          apt => apt.staff1_id === selectedStaff || apt.staff2_id === selectedStaff || apt.staff3_id === selectedStaff
        )
      }

      setAppointments(filteredAppointments)
      setStaff(staffData)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // ステータス別の件数を取得
  const getStatusCount = (status: string) => {
    return appointments.filter(apt => apt.status === status).length
  }

  // ステータス別の患者リストを取得
  const getPatientsByStatus = (status: string) => {
    return appointments
      .filter(apt => apt.status === status)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  // ステータス変更
  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(DEMO_CLINIC_ID, appointmentId, newStatus)
      await loadData()
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  // 日付変更
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">患者ステータス管理</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* 日付選択 */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                  ←
                </Button>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-md">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">
                    {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  本日
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextDay}>
                  →
                </Button>
              </div>

              {/* スタッフ選択 */}
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="スタッフを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全スタッフ</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* ステータスカードと患者リストを縦に配置 */}
        <div className="grid grid-cols-6 gap-6">
          {STATUS_ORDER.map(status => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            const count = getStatusCount(status)
            const patients = getPatientsByStatus(status)

            return (
              <div key={status} className="flex flex-col space-y-3">
                {/* ステータスカード */}
                <Card className="flex-shrink-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {status}
                      </CardTitle>
                      {config.nextStatus && (
                        <button
                          onClick={() => {
                            // このステータスの患者を次のステータスに一括変更
                            const currentPatients = getPatientsByStatus(status)
                            currentPatients.forEach(apt => {
                              handleStatusChange(apt.id, config.nextStatus!)
                            })
                          }}
                          className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-600 transition-colors"
                          title={`${config.nextStatus}に進む`}
                        >
                          {config.nextStatus.charAt(0)}
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{count}</div>
                  </CardContent>
                </Card>

                {/* 患者リスト */}
                <div className="space-y-3">
                  {patients.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      該当なし
                    </div>
                  ) : (
                    patients.map(apt => {
                      const patient = apt.patient
                      const staffName = apt.staff1?.name || apt.staff2?.name || apt.staff3?.name || '未設定'

                      return (
                        <Card
                          key={apt.id}
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                          onClick={() => router.push(`/patients/${patient?.id}`)}
                        >
                          {/* ステータスアイコン（右上） */}
                          {(() => {
                            const currentStatus = apt.status
                            const nextStatus = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]?.nextStatus
                            const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]
                            const buttonColor = statusConfig?.color.split(' ')[0] || 'bg-gray-500'
                            const textColor = statusConfig?.color.split(' ')[1] || 'text-gray-800'
                            
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (nextStatus) {
                                    handleStatusChange(apt.id, nextStatus)
                                  }
                                }}
                                className={`absolute top-2 right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors z-10 ${
                                  nextStatus 
                                    ? `${buttonColor} ${textColor} hover:opacity-80 cursor-pointer` 
                                    : `${buttonColor} ${textColor} cursor-default`
                                }`}
                                title={nextStatus ? `${nextStatus}に進む (現在: ${currentStatus})` : `現在: ${currentStatus} (最終ステータス)`}
                              >
                                {currentStatus[0]}
                              </button>
                            )
                          })()}
                          
                          <div className="space-y-3 pr-8">
                            <div className="font-medium text-sm text-blue-600 hover:text-blue-800">
                              {patient?.last_name} {patient?.first_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {apt.start_time}
                            </div>
                            <div className="text-xs text-gray-600">
                              {staffName}
                            </div>
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}