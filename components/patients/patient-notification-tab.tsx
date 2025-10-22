'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Bell,
  Calendar,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Edit,
  Trash2,
  X,
  Stethoscope,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  getPatientNotificationSchedules,
  createNotificationSchedule,
  updateNotificationSchedule,
  deleteNotificationSchedule
} from '@/lib/api/notification-schedules'
import {
  getPatientNotificationPreferences,
  upsertPatientNotificationPreferences
} from '@/lib/api/patient-notification-preferences'
import { getTreatmentMenus } from '@/lib/api/treatment'
import { getPatientById } from '@/lib/api/patients'
import { getStaff } from '@/lib/api/staff'
import { getNotificationTemplatesByType } from '@/lib/api/notification-templates'
import type {
  PatientNotificationSchedule,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationTemplate
} from '@/types/notification'
import type { TreatmentMenu } from '@/types/database'

interface PatientNotificationTabProps {
  patientId: string
  clinicId: string
}

export function PatientNotificationTab({ patientId, clinicId }: PatientNotificationTabProps) {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<PatientNotificationSchedule[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formType, setFormType] = useState<'treatment_reminder' | 'periodic_checkup'>('treatment_reminder')

  // 通知受信設定
  const [preferences, setPreferences] = useState({
    appointment_reminder: true,
    periodic_checkup: true,
    treatment_reminder: true,
    appointment_change: true,
    custom: true
  })
  const [savingPreferences, setSavingPreferences] = useState(false)

  // フォームデータ
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedTreatmentMenu1, setSelectedTreatmentMenu1] = useState<string>('none')
  const [selectedTreatmentMenu2, setSelectedTreatmentMenu2] = useState<string>('none')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [webBookingEnabled, setWebBookingEnabled] = useState(false)
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>('line')

  // マスターデータ
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenu[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [preferredContactMethod, setPreferredContactMethod] = useState<NotificationChannel>('line')

  // 診療メニュー2の候補（診療メニュー1に紐づく）
  const [availableMenus2, setAvailableMenus2] = useState<TreatmentMenu[]>([])
  const [openMenu2, setOpenMenu2] = useState(false)

  // 診療メニュー1が変更されたら、診療メニュー2の候補を更新し、自動的に開く
  useEffect(() => {
    if (selectedTreatmentMenu1 && selectedTreatmentMenu1 !== 'none') {
      const filtered = treatmentMenus.filter(menu => menu.parent_id === selectedTreatmentMenu1)
      setAvailableMenus2(filtered)
      setSelectedTreatmentMenu2('none') // リセット

      // 子メニューがある場合は自動的に診療メニュー2を開く
      if (filtered.length > 0) {
        setTimeout(() => {
          setOpenMenu2(true)
        }, 100) // 少し遅延させてスムーズに
      }
    } else {
      setAvailableMenus2([])
      setSelectedTreatmentMenu2('none')
      setOpenMenu2(false)
    }
  }, [selectedTreatmentMenu1, treatmentMenus])

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [patientId, clinicId])

  // 基本情報タブでの設定変更を検知して再読み込み
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('通知設定が更新されました。再読み込みします。')
      loadData()
    }

    window.addEventListener('notificationPreferencesUpdated', handleNotificationUpdate)

    return () => {
      window.removeEventListener('notificationPreferencesUpdated', handleNotificationUpdate)
    }
  }, [patientId, clinicId])

  const loadData = async () => {
    try {
      setLoading(true)

      // 患者の通知スケジュールを取得
      const schedulesData = await getPatientNotificationSchedules(patientId)
      setSchedules(schedulesData)

      // 患者の希望連絡方法を取得
      const patient = await getPatientById(clinicId, patientId)
      if (patient && (patient as any).preferred_contact_method) {
        setPreferredContactMethod((patient as any).preferred_contact_method)
        setNotificationChannel((patient as any).preferred_contact_method)
      }

      // 治療メニューを取得
      const menusData = await getTreatmentMenus(clinicId)
      setTreatmentMenus(menusData)

      // スタッフを取得
      const staffData = await getStaff(clinicId)
      setStaff(staffData)

      // 通知受信設定を取得
      const preferencesData = await getPatientNotificationPreferences(patientId, clinicId)
      if (preferencesData) {
        setPreferences({
          appointment_reminder: preferencesData.appointment_reminder,
          periodic_checkup: preferencesData.periodic_checkup,
          treatment_reminder: preferencesData.treatment_reminder,
          appointment_change: preferencesData.appointment_change,
          custom: preferencesData.custom
        })
      }

    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // テンプレート読み込み（通知タイプ変更時）
  useEffect(() => {
    if (formType) {
      loadTemplates(formType)
    }
  }, [formType, clinicId])

  const loadTemplates = async (notificationType: NotificationType) => {
    try {
      const templatesData = await getNotificationTemplatesByType(clinicId, notificationType)
      setTemplates(templatesData)

      // 最初のテンプレートを選択
      if (templatesData.length > 0) {
        setSelectedTemplate(templatesData[0].id)
      }
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error)
    }
  }

  // 通知作成
  const handleCreate = async () => {
    try {
      const template = templates.find(t => t.id === selectedTemplate)
      if (!template) {
        alert('テンプレートを選択してください')
        return
      }

      // 治療メニューIDは診療メニュー2があればそれを、なければ診療メニュー1を使用
      const treatmentMenuId = selectedTreatmentMenu2 !== 'none'
        ? selectedTreatmentMenu2
        : (selectedTreatmentMenu1 !== 'none' ? selectedTreatmentMenu1 : undefined)

      await createNotificationSchedule({
        patient_id: patientId,
        clinic_id: clinicId,
        template_id: selectedTemplate,
        notification_type: formType,
        treatment_menu_id: treatmentMenuId,
        timing_value: template.default_timing_value || 3,
        timing_unit: template.default_timing_unit || 'months',
        send_channel: notificationChannel,
        web_booking_menu_ids: webBookingEnabled ? template.default_web_booking_menu_ids || [] : undefined,
        web_booking_staff_ids: selectedStaffIds.length > 0 ? selectedStaffIds : undefined,
        custom_message: getMessageForChannel(template, notificationChannel)
      })

      alert('通知スケジュールを作成しました')
      setShowCreateForm(false)
      loadData()
    } catch (error) {
      console.error('通知作成エラー:', error)
      alert('通知スケジュールの作成に失敗しました')
    }
  }

  // チャネル別メッセージ取得
  const getMessageForChannel = (template: NotificationTemplate, channel: NotificationChannel): string => {
    switch (channel) {
      case 'line':
        return template.line_message || template.message_template
      case 'email':
        return template.email_message || template.message_template
      case 'sms':
        return template.sms_message || template.message_template
      default:
        return template.message_template
    }
  }

  // 通知削除
  const handleDelete = async (scheduleId: string) => {
    if (!confirm('この通知スケジュールを削除しますか？')) return

    try {
      await deleteNotificationSchedule(scheduleId)
      alert('通知スケジュールを削除しました')
      loadData()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // 通知受信設定を更新
  const handlePreferenceChange = async (key: keyof typeof preferences, value: boolean) => {
    try {
      setSavingPreferences(true)
      const newPreferences = { ...preferences, [key]: value }
      setPreferences(newPreferences)

      await upsertPatientNotificationPreferences(patientId, clinicId, newPreferences)
    } catch (error) {
      console.error('受信設定の更新エラー:', error)
      // エラー時は元に戻す
      setPreferences(preferences)
    } finally {
      setSavingPreferences(false)
    }
  }

  // ステータス別グループ化
  const groupedSchedules = {
    scheduled: schedules.filter(s => s.status === 'scheduled'),
    sent: schedules.filter(s => s.status === 'sent'),
    completed: schedules.filter(s => s.status === 'completed'),
    cancelled: schedules.filter(s => s.status === 'cancelled'),
    failed: schedules.filter(s => s.status === 'failed')
  }

  // ステータスバッジ
  const StatusBadge = ({ status }: { status: NotificationStatus }) => {
    const statusConfig = {
      scheduled: { label: '送信予定', color: 'bg-blue-100 text-blue-800' },
      sent: { label: '送信済み', color: 'bg-green-100 text-green-800' },
      completed: { label: '完了', color: 'bg-purple-100 text-purple-800' },
      cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800' },
      failed: { label: '失敗', color: 'bg-red-100 text-red-800' }
    }

    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  // チャネルアイコン
  const ChannelIcon = ({ channel }: { channel: NotificationChannel }) => {
    switch (channel) {
      case 'line':
        return <MessageSquare className="w-4 h-4 text-green-600" />
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />
      case 'sms':
        return <Smartphone className="w-4 h-4 text-orange-600" />
    }
  }

  // 通知タイプアイコン
  const NotificationTypeIcon = ({ type }: { type: NotificationType }) => {
    switch (type) {
      case 'treatment_reminder':
        return <Stethoscope className="w-5 h-5 text-blue-600" />
      case 'periodic_checkup':
        return <Activity className="w-5 h-5 text-green-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 通知受信設定 */}
      <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">通知受信設定</h4>
              {savingPreferences && (
                <span className="text-xs text-gray-500">保存中...</span>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="appointment_reminder"
                  checked={preferences.appointment_reminder}
                  onCheckedChange={(checked) => handlePreferenceChange('appointment_reminder', checked as boolean)}
                  disabled={savingPreferences}
                />
                <Label htmlFor="appointment_reminder" className="cursor-pointer font-normal">
                  予約リマインド通知を受け取る
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="periodic_checkup"
                  checked={preferences.periodic_checkup}
                  onCheckedChange={(checked) => handlePreferenceChange('periodic_checkup', checked as boolean)}
                  disabled={savingPreferences}
                />
                <Label htmlFor="periodic_checkup" className="cursor-pointer font-normal">
                  定期検診リマインド通知を受け取る
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="treatment_reminder"
                  checked={preferences.treatment_reminder}
                  onCheckedChange={(checked) => handlePreferenceChange('treatment_reminder', checked as boolean)}
                  disabled={savingPreferences}
                />
                <Label htmlFor="treatment_reminder" className="cursor-pointer font-normal">
                  治療リマインド通知を受け取る
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="appointment_change"
                  checked={preferences.appointment_change}
                  onCheckedChange={(checked) => handlePreferenceChange('appointment_change', checked as boolean)}
                  disabled={savingPreferences}
                />
                <Label htmlFor="appointment_change" className="cursor-pointer font-normal">
                  予約変更通知を受け取る
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom"
                  checked={preferences.custom}
                  onCheckedChange={(checked) => handlePreferenceChange('custom', checked as boolean)}
                  disabled={savingPreferences}
                />
                <Label htmlFor="custom" className="cursor-pointer font-normal">
                  カスタム通知を受け取る
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">通知設定</h3>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFormType('treatment_reminder')
              setShowCreateForm(true)
              setWebBookingEnabled(false)
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            治療リマインド
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFormType('periodic_checkup')
              setShowCreateForm(true)
              setWebBookingEnabled(true)
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            定期検診
          </Button>
        </div>
      </div>

      {/* 作成フォーム */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">
                {formType === 'treatment_reminder' ? '治療リマインド' : '定期検診リマインド'}を追加
              </h4>
              <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* テンプレート選択 */}
            <div>
              <Label>通知テンプレート</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="テンプレートを選択" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.default_timing_value && template.default_timing_unit && (
                        <span className="text-gray-500 ml-2">
                          ({template.default_timing_value}
                          {template.default_timing_unit === 'days' && '日後'}
                          {template.default_timing_unit === 'weeks' && '週間後'}
                          {template.default_timing_unit === 'months' && 'ヶ月後'})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 診療メニュー選択（治療リマインドのみ） - 横並び */}
            {formType === 'treatment_reminder' && (
              <div className="grid grid-cols-2 gap-4">
                {/* 診療メニュー1 */}
                <div>
                  <Label>診療メニュー1（任意）</Label>
                  <Select value={selectedTreatmentMenu1} onValueChange={setSelectedTreatmentMenu1}>
                    <SelectTrigger>
                      <SelectValue placeholder="診療メニュー1を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">選択しない</SelectItem>
                      {treatmentMenus.filter(menu => !menu.parent_id).map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 診療メニュー2（診療メニュー1が選択されたら自動的に開く） */}
                <div>
                  <Label>診療メニュー2（任意）</Label>
                  <Select
                    value={selectedTreatmentMenu2}
                    onValueChange={setSelectedTreatmentMenu2}
                    disabled={selectedTreatmentMenu1 === 'none' || availableMenus2.length === 0}
                    open={openMenu2}
                    onOpenChange={setOpenMenu2}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedTreatmentMenu1 === 'none'
                          ? 'まず診療メニュー1を選択'
                          : availableMenus2.length === 0
                          ? '該当する診療メニュー2なし'
                          : '診療メニュー2を選択'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">選択しない</SelectItem>
                      {availableMenus2.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>
                          {menu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* スタッフ選択（複数選択可能） */}
            <div>
              <Label>担当スタッフ（複数選択可）</Label>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto space-y-2 bg-white">
                {staff.length === 0 ? (
                  <p className="text-sm text-gray-500">スタッフが登録されていません</p>
                ) : (
                  staff.map((s) => (
                    <div key={s.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`staff-${s.id}`}
                        checked={selectedStaffIds.includes(s.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStaffIds([...selectedStaffIds, s.id])
                          } else {
                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== s.id))
                          }
                        }}
                      />
                      <Label
                        htmlFor={`staff-${s.id}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {s.name}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 通知チャネル */}
            <div>
              <Label>通知チャネル</Label>
              <Select value={notificationChannel} onValueChange={(v) => setNotificationChannel(v as NotificationChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="email">メール</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                デフォルト: {preferredContactMethod === 'line' ? 'LINE' : preferredContactMethod === 'email' ? 'メール' : 'SMS'}
              </p>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="outline" onClick={() => setShowCreateForm(false)}>
                キャンセル
              </Button>
              <Button size="sm" onClick={handleCreate}>
                作成
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 送信予定 */}
      {groupedSchedules.scheduled.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">送信予定 ({groupedSchedules.scheduled.length}件)</h4>
          <div className="space-y-2">
            {groupedSchedules.scheduled.map((schedule) => (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <NotificationTypeIcon type={schedule.notification_type} />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h5 className="font-medium">
                            {schedule.notification_type === 'treatment_reminder' ? '治療リマインド' : '定期検診リマインド'}
                          </h5>
                          <StatusBadge status={schedule.status} />
                        </div>
                        {schedule.treatment_name && (
                          <p className="text-sm text-gray-600 mb-1">{schedule.treatment_name}</p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(schedule.send_datetime), 'yyyy/MM/dd HH:mm', { locale: ja })}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ChannelIcon channel={schedule.send_channel} />
                            <span>
                              {schedule.send_channel === 'line' ? 'LINE' : schedule.send_channel === 'email' ? 'メール' : 'SMS'}
                            </span>
                          </div>
                          {schedule.web_booking_enabled && (
                            <Badge variant="outline" className="text-xs">Web予約リンク付き</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(schedule.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 送信済み */}
      {groupedSchedules.sent.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">送信済み ({groupedSchedules.sent.length}件)</h4>
          <div className="space-y-2">
            {groupedSchedules.sent.map((schedule) => (
              <Card key={schedule.id} className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <NotificationTypeIcon type={schedule.notification_type} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-sm">
                          {schedule.notification_type === 'treatment_reminder' ? '治療リマインド' : '定期検診リマインド'}
                        </h5>
                        <StatusBadge status={schedule.status} />
                      </div>
                      <div className="text-xs text-gray-500">
                        送信日時: {schedule.sent_at && format(new Date(schedule.sent_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* データなし */}
      {schedules.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>通知設定はありません</p>
          <p className="text-sm mt-1">上のボタンから通知を作成できます</p>
        </div>
      )}
    </div>
  )
}
