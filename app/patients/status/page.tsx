'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Calendar,
  ArrowLeft,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAppointments, updateAppointmentStatus } from '@/lib/api/appointments'
import { getStaff } from '@/lib/api/staff'
import { Staff } from '@/types/database'
import { startAutoStatusUpdateTimer } from '@/lib/utils/auto-status-update'
import { SubKarteTab } from '@/components/patients/subkarte-tab'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

// ステータス定義
const STATUS_CONFIG = {
  '未来院': { color: 'bg-gray-100 text-gray-800 border-gray-300', nextStatus: '遅刻' },
  '遅刻': { color: 'bg-orange-100 text-orange-800 border-orange-300', nextStatus: '来院済み' },
  '来院済み': { color: 'bg-blue-100 text-blue-800 border-blue-300', nextStatus: '診療中' },
  '診療中': { color: 'bg-purple-100 text-purple-800 border-purple-300', nextStatus: '会計' },
  '会計': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', nextStatus: '終了' },
  '終了': { color: 'bg-green-100 text-green-800 border-green-300', nextStatus: null },
  'キャンセル': { color: 'bg-red-100 text-red-800 border-red-300', nextStatus: null }
}

const STATUS_ORDER = ['未来院', '遅刻', '来院済み', '診療中', '会計', '終了', 'キャンセル']

export default function PatientStatusPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('')
  const [showSubKarteModal, setShowSubKarteModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedStaff])

  // 自動ステータス更新タイマー（30秒ごとに遅刻チェック）
  useEffect(() => {
    const cleanup = startAutoStatusUpdateTimer(
      () => appointments,
      DEMO_CLINIC_ID,
      async () => {
        // ステータス更新後、予約データを再読み込み
        await loadData()
      }
    )

    // コンポーネントのアンマウント時にタイマーをクリア
    return cleanup
  }, [selectedDate, selectedStaff, appointments])

  const loadData = async () => {
    try {
      setLoading(true)
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      const [appointmentsData, staffData] = await Promise.all([
        getAppointments(DEMO_CLINIC_ID, dateString, dateString),
        getStaff(DEMO_CLINIC_ID)
      ])

      // キャンセルを含むすべての予約を表示
      let filteredAppointments = appointmentsData

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

  // サブカルテモーダルを開く
  const handleOpenSubKarte = (patientId: string, patientName: string, e: React.MouseEvent) => {
    e.stopPropagation() // カード全体のクリックイベントを止める
    setSelectedPatientId(patientId)
    setSelectedPatientName(patientName)
    setShowSubKarteModal(true)
  }

  // サブカルテモーダルを閉じる
  const handleCloseSubKarte = () => {
    setShowSubKarteModal(false)
    setSelectedPatientId(null)
    setSelectedPatientName('')
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
        <div className="grid grid-cols-7 gap-6">
          {STATUS_ORDER.map(status => {
            const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            const count = getStatusCount(status)
            const patients = getPatientsByStatus(status)

            return (
              <div key={status} className="flex flex-col space-y-3">
                {/* ステータスカード */}
                <Card className="flex-shrink-0">
                  <CardHeader className="flex items-center justify-center h-20">
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="text-lg font-semibold text-gray-700">
                        {status}
                      </CardTitle>
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                    </div>
                  </CardHeader>
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
                      // menu1, menu2, menu3のいずれかから診療メニュー名を取得
                      const treatmentName = apt.menu1?.name || apt.menu2?.name || apt.menu3?.name || '未設定'

                      return (
                        <Card
                          key={apt.id}
                          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/patients/${patient?.id}`)}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium text-sm text-blue-600 hover:text-blue-800">
                                {patient?.last_name} {patient?.first_name}
                              </div>
                              <button
                                onClick={(e) => handleOpenSubKarte(patient?.id, `${patient?.last_name} ${patient?.first_name}`, e)}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                                title="サブカルテを開く"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                {apt.start_time}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {treatmentName}
                              </div>
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

      {/* サブカルテモーダル */}
      <Dialog open={showSubKarteModal} onOpenChange={setShowSubKarteModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>サブカルテ - {selectedPatientName}</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <SubKarteTab patientId={selectedPatientId} layout="vertical" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}