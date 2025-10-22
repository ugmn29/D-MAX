'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAppointments } from '@/lib/api/appointments'

interface Appointment {
  id: string
  patient_id: string
  staff_id: string
  treatment_menu_id: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  created_at: string
  updated_at: string
  // 関連データ
  patient?: {
    id: string
    last_name: string
    first_name: string
    last_name_kana?: string
    first_name_kana?: string
    phone?: string
    email?: string
  }
  staff?: {
    id: string
    name: string
  }
  treatment_menu?: {
    id: string
    name: string
    duration: number
    price: number
  }
}

interface AppointmentsTabProps {
  patientId: string
}

// 仮の予約データ
const mockAppointments: Appointment[] = [
  {
    id: 'appointment-1',
    patient_id: 'patient_1758761433598_0zkows4d7',
    staff_id: 'staff-1',
    treatment_menu_id: 'treatment-1',
    start_time: '2024-01-20T10:00:00Z',
    end_time: '2024-01-20T11:00:00Z',
    status: 'completed',
    notes: '定期検診',
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-20T11:00:00Z',
    patient: {
      id: 'patient_1758761433598_0zkows4d7',
      last_name: '福永',
      first_name: '真大',
      last_name_kana: 'フクナガ',
      first_name_kana: 'シンダイ',
      phone: '08014103036',
      email: 'fukunaga@example.com'
    },
    staff: {
      id: 'staff-1',
      name: '福永先生'
    },
    treatment_menu: {
      id: 'treatment-1',
      name: '定期検診',
      duration: 60,
      price: 3000
    }
  },
  {
    id: 'appointment-2',
    patient_id: 'patient_1758761433598_0zkows4d7',
    staff_id: 'staff-2',
    treatment_menu_id: 'treatment-2',
    start_time: '2024-01-25T14:00:00Z',
    end_time: '2024-01-25T15:30:00Z',
    status: 'scheduled',
    notes: '虫歯治療',
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z',
    patient: {
      id: 'patient_1758761433598_0zkows4d7',
      last_name: '福永',
      first_name: '真大',
      last_name_kana: 'フクナガ',
      first_name_kana: 'シンダイ',
      phone: '08014103036',
      email: 'fukunaga@example.com'
    },
    staff: {
      id: 'staff-2',
      name: '田中先生'
    },
    treatment_menu: {
      id: 'treatment-2',
      name: '虫歯治療',
      duration: 90,
      price: 5000
    }
  }
]

export function AppointmentsTab({ patientId }: AppointmentsTabProps) {
  console.log('AppointmentsTab: コンポーネントが初期化されました', { patientId })
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('AppointmentsTab: コンポーネントがマウントされました', { patientId })
    loadAppointments()
  }, [patientId])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('AppointmentsTab: 予約履歴を読み込み中', { patientId })
      
      // 予約編集モーダルと同じ方法で予約データを取得
      const allAppointments = await getAppointments('clinic-1')
      console.log('AppointmentsTab: 取得した全予約データ:', allAppointments)
      
      // この患者の予約履歴をフィルタリング（予約編集モーダルと同じロジック）
      const patientAppointments = allAppointments.filter(apt => 
        apt.patient_id === patientId
      )
      console.log('AppointmentsTab: 患者の予約履歴:', patientAppointments)
      
      setAppointments(patientAppointments)
    } catch (error) {
      console.error('予約履歴の取得エラー:', error)
      setError('予約履歴の取得に失敗しました')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'no_show':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-blue-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
      case 'cancelled':
        return <Badge variant="destructive">キャンセル</Badge>
      case 'no_show':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">無断欠席</Badge>
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">予定</Badge>
    }
  }

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch (error) {
      console.error('日時フォーマットエラー:', error, dateTime)
      return dateTime
    }
  }

  console.log('AppointmentsTab: レンダリング状態', { loading, appointmentsCount: appointments.length, patientId, error })

  if (loading) {
    return <div className="text-center py-8 text-gray-500">読み込み中...</div>
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <h3 className="text-lg font-medium mb-2">エラーが発生しました</h3>
        <p className="text-sm">{error}</p>
        <p className="text-xs text-gray-400 mt-2">患者ID: {patientId}</p>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">予約履歴がありません</h3>
        <p className="text-gray-500">この患者の予約履歴が見つかりませんでした。</p>
        <p className="text-sm text-gray-400 mt-2">患者ID: {patientId}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">予約履歴</h3>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          新規予約
        </Button>
      </div>

      {/* 予約編集モーダルと同じ表示形式 */}
      <div className="border border-gray-200 rounded-md bg-white">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
            <div>予約日時</div>
            <div>担当</div>
            <div>メニュー</div>
            <div>メモ</div>
          </div>
        </div>
        <div 
          className="overflow-y-auto"
          style={{
            maxHeight: '400px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6'
          }}
        >
          {appointments.length > 0 ? (
            appointments
              .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()) // 新しい順にソート
              .map((appointment, index) => {
                const appointmentDate = new Date(appointment.appointment_date)
                const formattedDate = format(appointmentDate, 'yyyy/MM/dd(E)', { locale: ja })
                const staffName = (appointment as any).staff1?.name || (appointment as any).staff2?.name || (appointment as any).staff3?.name || '未設定'
                const menuName = (appointment as any).menu1?.name || (appointment as any).menu2?.name || (appointment as any).menu3?.name || '未設定'
                const hasStaff = staffName !== '未設定'
                
                return (
                  <div key={appointment.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-gray-900">
                        <div className="flex items-start justify-between">
                          <div>
                            <div>{formattedDate}</div>
                            <div className="flex items-center gap-2">
                              <span>{appointment.start_time}</span>
                              {appointment.status === 'cancelled' && (
                                <span className="text-red-600" style={{ fontSize: "10px" }}>キャンセル</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-hidden">
                        <div
                          className="break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.2',
                            maxHeight: '2.4em'
                          }}
                        >
                          {hasStaff ? (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {staffName}
                            </span>
                          ) : (
                            <span className="text-gray-500">{staffName}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-900 overflow-hidden">
                        <div
                          className="break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.2',
                            maxHeight: '2.4em'
                          }}
                        >
                          {menuName}
                        </div>
                      </div>
                      <div className="text-gray-500 overflow-hidden">
                        <div
                          className="break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.2',
                            maxHeight: '2.4em'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: (appointment as any).memo || '-'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              予約履歴がありません
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
