'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  User,
  Calendar,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  FileClock,
  RefreshCw,
  UserCheck,
  CalendarDays,
  Timer,
  Stethoscope,
  MessageSquare,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getAppointmentLogs, AppointmentLog } from '@/lib/api/appointment-logs'

interface AppointmentLogsTabProps {
  patientId: string
}

export function AppointmentLogsTab({ patientId }: AppointmentLogsTabProps) {
  console.log('AppointmentLogsTab: コンポーネントがマウントされました', { patientId })

  const [logs, setLogs] = useState<AppointmentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('AppointmentLogsTab: useEffectが実行されました', { patientId })
    loadLogs()
  }, [patientId])

  const loadLogs = async () => {
    try {
      console.log('予約操作ログ取得開始:', { patientId })
      setLoading(true)
      setError(null)
      const logsData = await getAppointmentLogs(patientId)
      console.log('予約操作ログ取得完了:', { count: logsData.length, logs: logsData })
      setLogs(logsData)
    } catch (error) {
      console.error('予約操作ログの取得エラー:', error)
      setError('予約操作ログの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case '作成':
        return <Calendar className="w-4 h-4 text-green-600" />
      case '変更':
        return <Edit className="w-4 h-4 text-blue-600" />
      case 'キャンセル':
        return <X className="w-4 h-4 text-red-600" />
      case '削除':
        return <Trash2 className="w-4 h-4 text-red-600" />
      default:
        return <FileClock className="w-4 h-4 text-gray-600" />
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case '作成':
        return <Badge variant="default" className="bg-green-100 text-green-800">新規作成</Badge>
      case '変更':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">更新</Badge>
      case 'キャンセル':
        return <Badge variant="destructive">キャンセル</Badge>
      case '削除':
        return <Badge variant="destructive">削除</Badge>
      default:
        return <Badge variant="outline">その他</Badge>
    }
  }

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      'appointment_date': '予約日',
      'start_time': '開始時間',
      'end_time': '終了時間',
      'staff1_id': '担当者1',
      'staff2_id': '担当者2',
      'staff3_id': '担当者3',
      'menu1_id': '治療メニュー1',
      'menu2_id': '治療メニュー2',
      'menu3_id': '治療メニュー3',
      'status': 'ステータス',
      'notes': 'メモ'
    }
    return fieldNames[field] || field
  }

  const getStatusDisplayName = (status: string) => {
    const statusNames: Record<string, string> = {
      '未来院': '未来院',
      '遅刻': '遅刻',
      '来院済み': '来院済み',
      '診療中': '診療中',
      '会計': '会計',
      '終了': '終了',
      'キャンセル': 'キャンセル',
      'scheduled': '予定',
      'completed': '完了',
      'cancelled': 'キャンセル',
      'no_show': '無断欠席'
    }
    return statusNames[status] || status
  }

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })
    } catch (error) {
      console.error('日時フォーマットエラー:', error, dateTime)
      return dateTime
    }
  }

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(`2000-01-01T${timeString}`), 'HH:mm', { locale: ja })
    } catch (error) {
      return timeString
    }
  }

  const renderChangeDetails = (log: AppointmentLog) => {
    if (!log.before_data || !log.after_data) {
      return null
    }

    const changedFields = Object.keys(log.after_data).filter(field => 
      log.before_data?.[field] !== log.after_data?.[field]
    )

    if (changedFields.length === 0) {
      return null
    }

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-700 mb-2">変更内容:</h4>
        <div className="space-y-2">
          {changedFields.map((field, index) => {
            const oldValue = log.before_data?.[field]
            const newValue = log.after_data?.[field]
            
            return (
              <div key={index} className="text-sm">
                <span className="font-medium text-gray-600">
                  {getFieldDisplayName(field)}:
                </span>
                <div className="ml-2 mt-1">
                  {oldValue && (
                    <div className="text-red-600">
                      <span className="text-xs">変更前: </span>
                      {field === 'status' ? getStatusDisplayName(oldValue) : 
                       field.includes('time') ? formatTime(oldValue) : 
                       oldValue}
                    </div>
                  )}
                  {newValue && (
                    <div className="text-green-600">
                      <span className="text-xs">変更後: </span>
                      {field === 'status' ? getStatusDisplayName(newValue) : 
                       field.includes('time') ? formatTime(newValue) : 
                       newValue}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <FileClock className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-600 mb-2">エラーが発生しました</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          再試行
        </Button>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <FileClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">予約操作ログがありません</h3>
        <p className="text-gray-500">この患者の予約操作履歴が見つかりませんでした。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">予約操作ログ</h3>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          更新
        </Button>
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <Card key={log.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getActionIcon(log.action)}
                  <div>
                    <CardTitle className="text-base">
                      {log.action === '作成' && '予約が作成されました'}
                      {log.action === '変更' && '予約が更新されました'}
                      {log.action === 'キャンセル' && '予約がキャンセルされました'}
                      {log.action === '削除' && '予約が削除されました'}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </div>
                {getActionBadge(log.action)}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* 操作者情報 */}
                {log.operator && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserCheck className="w-4 h-4" />
                    <span>操作者: {log.operator.name}</span>
                  </div>
                )}

                {/* 予約情報 */}
                {log.appointment && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      {formatDateTime(log.appointment.start_time)} - {formatTime(log.appointment.end_time)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getStatusDisplayName(log.appointment.status)}
                    </Badge>
                  </div>
                )}

                {/* 変更理由 */}
                {log.reason && (
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MessageSquare className="w-4 h-4 mt-0.5" />
                    <span>理由: {log.reason}</span>
                  </div>
                )}

                {/* 変更詳細 */}
                {renderChangeDetails(log)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
