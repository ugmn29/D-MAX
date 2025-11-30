'use client'

console.log('appointment-logs-tab.tsx: ファイルが読み込まれました')

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
  Trash2,
  Filter,
  ChevronDown
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
  const [filteredLogs, setFilteredLogs] = useState<AppointmentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    console.log('AppointmentLogsTab: useEffectが実行されました', { patientId })
    loadLogs()
  }, [patientId])

  useEffect(() => {
    // フィルタリング処理
    if (filterAction === 'all') {
      setFilteredLogs(logs)
    } else {
      setFilteredLogs(logs.filter(log => log.action === filterAction))
    }
  }, [logs, filterAction])

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
        return <Calendar className="w-5 h-5 text-green-600" />
      case '変更':
        return <Edit className="w-5 h-5 text-blue-600" />
      case 'キャンセル':
        return <X className="w-5 h-5 text-red-600" />
      case '削除':
        return <Trash2 className="w-5 h-5 text-red-600" />
      default:
        return <FileClock className="w-5 h-5 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case '作成':
        return 'border-l-green-500 bg-green-50'
      case '変更':
        return 'border-l-blue-500 bg-blue-50'
      case 'キャンセル':
        return 'border-l-red-500 bg-red-50'
      case '削除':
        return 'border-l-red-600 bg-red-50'
      default:
        return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case '作成':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">新規作成</Badge>
      case '変更':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">更新</Badge>
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
    if (!dateTime) {
      return '-'
    }
    try {
      const date = new Date(dateTime)
      if (isNaN(date.getTime())) {
        return dateTime
      }
      return format(date, 'yyyy年MM月dd日 HH:mm', { locale: ja })
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
      log.before_data?.[field] !== log.after_data?.[field] && !field.endsWith('_name')
    )

    if (changedFields.length === 0) {
      return null
    }

    // 値を表示用に変換する関数
    const getDisplayValue = (value: any, fieldName: string, data: Record<string, any>) => {
      if (fieldName === 'status') return getStatusDisplayName(value)
      if (fieldName.includes('time')) return formatTime(value)

      // スタッフIDの場合は名前を表示
      if (fieldName === 'staff1_id' && data.staff1_name) return data.staff1_name
      if (fieldName === 'staff2_id' && data.staff2_name) return data.staff2_name
      if (fieldName === 'staff3_id' && data.staff3_name) return data.staff3_name

      // メニューIDの場合は名前を表示
      if (fieldName === 'menu1_id' && data.menu1_name) return data.menu1_name
      if (fieldName === 'menu2_id' && data.menu2_name) return data.menu2_name
      if (fieldName === 'menu3_id' && data.menu3_name) return data.menu3_name

      return value
    }

    return (
      <div className="p-3 bg-white rounded-md border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <Edit className="w-4 h-4 mr-1" />
          変更内容
        </h4>
        <div className="space-y-2">
          {changedFields.map((field, index) => {
            const oldValue = log.before_data?.[field]
            const newValue = log.after_data?.[field]

            return (
              <div key={index} className="text-sm border-l-2 border-gray-300 pl-3">
                <span className="font-medium text-gray-700">
                  {getFieldDisplayName(field)}
                </span>
                <div className="mt-1">
                  {oldValue && newValue ? (
                    <div className="flex items-center gap-2 text-gray-700">
                      <span className="text-red-600">{getDisplayValue(oldValue, field, log.before_data)}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-green-600">{getDisplayValue(newValue, field, log.after_data)}</span>
                    </div>
                  ) : oldValue ? (
                    <div className="text-red-600">
                      削除: {getDisplayValue(oldValue, field, log.before_data)}
                    </div>
                  ) : newValue ? (
                    <div className="text-green-600">
                      追加: {getDisplayValue(newValue, field, log.after_data)}
                    </div>
                  ) : null}
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
      <div className="text-center py-12">
        <FileClock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
      <div className="text-center py-12">
        <FileClock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">予約操作ログがありません</h3>
        <p className="text-gray-500">予約を作成・変更すると、ここに履歴が表示されます。</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーとフィルター */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">予約操作履歴</h3>
          <p className="text-sm text-gray-500 mt-1">
            全{logs.length}件の履歴
            {filterAction !== 'all' && ` (フィルタ適用中: ${filteredLogs.length}件)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            フィルター
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">操作種類:</span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFilterAction('all')}
                  variant={filterAction === 'all' ? 'default' : 'outline'}
                  size="sm"
                >
                  すべて
                </Button>
                <Button
                  onClick={() => setFilterAction('作成')}
                  variant={filterAction === '作成' ? 'default' : 'outline'}
                  size="sm"
                  className={filterAction === '作成' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  作成
                </Button>
                <Button
                  onClick={() => setFilterAction('変更')}
                  variant={filterAction === '変更' ? 'default' : 'outline'}
                  size="sm"
                  className={filterAction === '変更' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  変更
                </Button>
                <Button
                  onClick={() => setFilterAction('キャンセル')}
                  variant={filterAction === 'キャンセル' ? 'default' : 'outline'}
                  size="sm"
                  className={filterAction === 'キャンセル' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={() => setFilterAction('削除')}
                  variant={filterAction === '削除' ? 'default' : 'outline'}
                  size="sm"
                  className={filterAction === '削除' ? 'bg-red-700 hover:bg-red-800' : ''}
                >
                  削除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* タイムライン */}
      <div className="relative">
        {/* タイムライン縦線 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* ログエントリ */}
        <div className="space-y-6">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className="relative pl-14">
              {/* タイムラインアイコン */}
              <div className="absolute left-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                {getActionIcon(log.action)}
              </div>

              {/* ログカード */}
              <Card className={`border-l-4 ${getActionColor(log.action)}`}>
                <CardContent className="pt-4">
                  <div className="flex gap-6 items-start">
                    {/* 左側: バッジ、日時、操作者情報と予約情報 */}
                    <div className="flex-1 space-y-3">
                      {/* バッジと日時 */}
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs text-gray-500">
                          {formatDateTime(log.created_at)}
                        </span>
                      </div>
                      {/* 操作者情報 */}
                      {log.operator && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <UserCheck className="w-4 h-4" />
                          <span>操作者: {log.operator.name}</span>
                        </div>
                      )}

                      {/* 予約情報 */}
                      {log.appointment && (
                        <div className="flex items-center gap-4 text-base text-gray-700 font-medium">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            <span>
                              {formatDateTime(log.appointment.start_time)} - {formatTime(log.appointment.end_time)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {getStatusDisplayName(log.appointment.status)}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* 右側: 変更詳細 */}
                    <div className="flex-1">
                      {renderChangeDetails(log)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 && filterAction !== 'all' && (
        <div className="text-center py-8">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">該当する履歴がありません</h3>
          <p className="text-gray-500">フィルター条件を変更してください。</p>
        </div>
      )}
    </div>
  )
}
