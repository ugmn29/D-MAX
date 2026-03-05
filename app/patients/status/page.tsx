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
  FileText,
  Printer,
  List,
  LayoutGrid,
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAppointments, updateAppointmentStatus } from '@/lib/api/appointments'
import { getStaff } from '@/lib/api/staff'
import { Staff } from '@/types/database'
import { startAutoStatusUpdateTimer } from '@/lib/utils/auto-status-update'
import { SubKarteTab } from '@/components/patients/subkarte-tab'
import { useClinicId } from '@/hooks/use-clinic-id'

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

interface DailyBriefingItem {
  id: string
  patient_id: string | null
  start_time: string | null
  end_time: string | null
  status: string | null
  staff1_id: string | null
  staff2_id: string | null
  staff3_id: string | null
  patient: { id: string; last_name: string | null; first_name: string | null; patient_number: number | null } | null
  menu1: { id: string; name: string; color: string | null } | null
  menu2: { id: string; name: string; color: string | null } | null
  menu3: { id: string; name: string; color: string | null } | null
  staff1: { id: string; name: string } | null
  staff2: { id: string; name: string } | null
  staff3: { id: string; name: string } | null
  latest_subkarte: { content: string; created_at: string } | null
}

export default function PatientStatusPage() {
  const clinicId = useClinicId()
  const router = useRouter()
  const [viewTab, setViewTab] = useState<'list' | 'status'>('status')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [appointments, setAppointments] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [selectedPatientName, setSelectedPatientName] = useState<string>('')
  const [showSubKarteModal, setShowSubKarteModal] = useState(false)

  // 一覧ビュー用データ
  const [briefingData, setBriefingData] = useState<DailyBriefingItem[]>([])
  const [briefingLoading, setBriefingLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedDate, selectedStaff])

  useEffect(() => {
    if (viewTab === 'list') {
      loadBriefingData()
    }
  }, [viewTab, selectedDate, selectedStaff])

  // 自動ステータス更新タイマー（30秒ごとに遅刻チェック）
  useEffect(() => {
    const cleanup = startAutoStatusUpdateTimer(
      () => appointments,
      clinicId,
      async () => {
        await loadData()
      }
    )
    return cleanup
  }, [selectedDate, selectedStaff, appointments])

  const loadData = async () => {
    try {
      setLoading(true)
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      const [appointmentsData, staffData] = await Promise.all([
        getAppointments(clinicId, dateString, dateString),
        getStaff(clinicId)
      ])

      let filteredAppointments = appointmentsData

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

  const loadBriefingData = async () => {
    if (!clinicId) return
    try {
      setBriefingLoading(true)
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const res = await fetch(`/api/appointments/daily-briefing?date=${dateString}`)
      const data: DailyBriefingItem[] = await res.json()

      let filtered = Array.isArray(data) ? data : []
      if (selectedStaff !== 'all') {
        filtered = filtered.filter(
          item => item.staff1_id === selectedStaff || item.staff2_id === selectedStaff || item.staff3_id === selectedStaff
        )
      }
      setBriefingData(filtered)
    } catch (error) {
      console.error('一覧データ読み込みエラー:', error)
    } finally {
      setBriefingLoading(false)
    }
  }

  const getStatusCount = (status: string) =>
    appointments.filter(apt => apt.status === status).length

  const getPatientsByStatus = (status: string) =>
    appointments
      .filter(apt => apt.status === status)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(clinicId, appointmentId, newStatus)
      await loadData()
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  const goToPreviousDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }

  const goToNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
  }

  const goToToday = () => setSelectedDate(new Date())

  const handleOpenSubKarte = (patientId: string, patientName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedPatientId(patientId)
    setSelectedPatientName(patientName)
    setShowSubKarteModal(true)
  }

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
      <div className="bg-white border-b border-gray-200 no-print">
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
                <Button variant="outline" size="sm" onClick={goToPreviousDay}>←</Button>
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-md">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-medium">
                    {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday}>本日</Button>
                <Button variant="outline" size="sm" onClick={goToNextDay}>→</Button>
              </div>

              {/* スタッフ選択 */}
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="スタッフを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全スタッフ</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 印刷ボタン（一覧時のみ） */}
              {viewTab === 'list' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="no-print flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  印刷
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">

        {/* ビュー切り替えタブ */}
        <div className="flex items-center gap-2 mb-4 no-print">
          <button
            onClick={() => setViewTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <List className="w-4 h-4" />
            一覧
          </button>
          <button
            onClick={() => setViewTab('status')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewTab === 'status'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            ステータス
          </button>
        </div>

        {/* 一覧ビュー */}
        {viewTab === 'list' && (
          <div className="print-list">
            {/* 印刷用ヘッダー（画面では非表示） */}
            <div className="hidden print:block mb-4">
              <h2 className="text-xl font-bold">
                {format(selectedDate, 'yyyy年MM月dd日(E)', { locale: ja })} 患者一覧
              </h2>
              {selectedStaff !== 'all' && (
                <p className="text-sm text-gray-600">
                  担当: {staff.find(s => s.id === selectedStaff)?.name}
                </p>
              )}
            </div>

            {briefingLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                読み込み中...
              </div>
            ) : briefingData.length === 0 ? (
              <div className="text-center py-16 text-gray-400">この日の予約はありません</div>
            ) : (
              <div className="space-y-3">
                {briefingData.map(item => {
                  const patientName = item.patient
                    ? `${item.patient.last_name ?? ''} ${item.patient.first_name ?? ''}`
                    : '不明'
                  const menus = [item.menu1, item.menu2, item.menu3].filter(Boolean)
                  const subkarteText = item.latest_subkarte?.content ?? null
                  const statusConfig = item.status
                    ? STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
                    : null

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      {/* 1行目: 患者名・時刻・ステータス */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => item.patient?.id && router.push(`/patients/${item.patient.id}`)}
                            className="font-semibold text-blue-600 hover:text-blue-800 text-base no-print"
                          >
                            {patientName}
                          </button>
                          <span className="font-semibold text-base hidden print:inline">{patientName}</span>
                          {item.patient?.patient_number && (
                            <span className="text-xs text-gray-400">（{item.patient.patient_number}番）</span>
                          )}
                          <span className="text-sm text-gray-500">
                            {item.start_time}
                            {item.end_time ? `〜${item.end_time}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {statusConfig && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusConfig.color}`}>
                              {item.status}
                            </span>
                          )}
                          {item.patient?.id && (
                            <button
                              onClick={(e) => handleOpenSubKarte(item.patient!.id, patientName, e)}
                              className="text-gray-400 hover:text-gray-600 transition-colors no-print"
                              title="サブカルテを開く"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 2行目: 今日の診療メニュー */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {menus.length > 0 ? (
                          menus.map((menu, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                              style={
                                menu!.color
                                  ? { backgroundColor: `${menu!.color}20`, borderColor: `${menu!.color}60`, color: menu!.color }
                                  : { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }
                              }
                            >
                              {menu!.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">メニュー未設定</span>
                        )}
                      </div>

                      {/* 3行目: 前回のサブカルテ内容 */}
                      <div className="text-sm text-gray-600 border-t border-gray-100 pt-2 mt-1">
                        <span className="text-xs text-gray-400 font-medium mr-1">前回サブカルテ:</span>
                        {subkarteText ? (
                          <span className="text-gray-700">
                            {subkarteText.length > 100 ? `${subkarteText.substring(0, 100)}…` : subkarteText}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">記録なし</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ステータスビュー（既存） */}
        {viewTab === 'status' && (
          <div className="grid grid-cols-7 gap-6">
            {STATUS_ORDER.map(status => {
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
              const count = getStatusCount(status)
              const patients = getPatientsByStatus(status)

              return (
                <div key={status} className="flex flex-col space-y-3">
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

                  <div className="space-y-3">
                    {patients.length === 0 ? (
                      <div className="text-center py-6 text-sm text-gray-400">
                        該当なし
                      </div>
                    ) : (
                      patients.map(apt => {
                        const patient = apt.patient
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
        )}
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
