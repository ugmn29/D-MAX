'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getTreatmentMenus } from '@/lib/api/treatment'
import { getStaff } from '@/lib/api/staff'
import { getClinicSettings, getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { TreatmentMenu } from '@/types/database'
import { TimeWarningModal } from '@/components/ui/time-warning-modal'
import { validateAppointmentTime, TimeValidationResult } from '@/lib/utils/time-validation'

interface AppointmentFormProps {
  clinicId: string
  selectedDate: string
  selectedTime?: string
  onSave: (appointmentData: any) => void
  onCancel: () => void
}

interface TreatmentMenuHierarchy {
  level1: TreatmentMenu[]
  level2: TreatmentMenu[]
  level3: TreatmentMenu[]
}

export function AppointmentForm({ clinicId, selectedDate, selectedTime, onSave, onCancel }: AppointmentFormProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 診療メニュー階層
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenuHierarchy>({
    level1: [],
    level2: [],
    level3: []
  })
  
  // スタッフ一覧
  const [staff, setStaff] = useState<any[]>([])
  
  // 予約データ
  const [appointmentData, setAppointmentData] = useState({
    patient_name: '',
    patient_name_kana: '',
    patient_phone: '',
    patient_email: '',
    start_time: selectedTime || '09:00',
    end_time: '',
    menu1_id: '',
    menu2_id: '',
    menu3_id: '',
    staff1_id: '',
    unit_id: '',
    notes: ''
  })
  
  // 選択されたメニュー階層
  const [selectedMenu1, setSelectedMenu1] = useState<TreatmentMenu | null>(null)
  const [selectedMenu2, setSelectedMenu2] = useState<TreatmentMenu | null>(null)
  const [selectedMenu3, setSelectedMenu3] = useState<TreatmentMenu | null>(null)

  // 警告モーダル関連の状態
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [timeValidation, setTimeValidation] = useState<TimeValidationResult | null>(null)
  const [pendingAppointmentData, setPendingAppointmentData] = useState<any>(null)

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [menusData, staffData] = await Promise.all([
          getTreatmentMenus(clinicId),
          getStaff(clinicId)
        ])
        
        // メニューを階層別に分類
        const level1 = menusData.filter(menu => menu.level === 1)
        const level2 = menusData.filter(menu => menu.level === 2)
        const level3 = menusData.filter(menu => menu.level === 3)
        
        setTreatmentMenus({ level1, level2, level3 })
        setStaff(staffData)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [clinicId])

  // メニュー1選択時の処理
  const handleMenu1Change = (menuId: string) => {
    const menu = treatmentMenus.level1.find(m => m.id === menuId)
    setSelectedMenu1(menu || null)
    setSelectedMenu2(null)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu1_id: menuId,
      menu2_id: '',
      menu3_id: ''
    }))
  }

  // メニュー2選択時の処理
  const handleMenu2Change = (menuId: string) => {
    const menu = treatmentMenus.level2.find(m => m.id === menuId)
    setSelectedMenu2(menu || null)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu2_id: menuId,
      menu3_id: ''
    }))
  }

  // メニュー3選択時の処理
  const handleMenu3Change = (menuId: string) => {
    const menu = treatmentMenus.level3.find(m => m.id === menuId)
    setSelectedMenu3(menu || null)
    setAppointmentData(prev => ({
      ...prev,
      menu3_id: menuId
    }))
  }

  // 診療時間の自動計算
  useEffect(() => {
    const calculateEndTime = () => {
      const startTime = appointmentData.start_time
      let duration = 30 // デフォルト30分

      // 選択されたメニューの標準時間を使用
      if (selectedMenu3?.standard_duration) {
        duration = selectedMenu3.standard_duration
      } else if (selectedMenu2?.standard_duration) {
        duration = selectedMenu2.standard_duration
      } else if (selectedMenu1?.standard_duration) {
        duration = selectedMenu1.standard_duration
      }

      const [hours, minutes] = startTime.split(':').map(Number)
      const startMinutes = hours * 60 + minutes
      const endMinutes = startMinutes + duration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60

      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      setAppointmentData(prev => ({ ...prev, end_time: endTime }))
    }

    if (appointmentData.start_time) {
      calculateEndTime()
    }
  }, [appointmentData.start_time, selectedMenu1, selectedMenu2, selectedMenu3])

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 時間検証を実行
      const validationResult = await validateAppointmentTimeForSave()
      
      if (!validationResult.isValid) {
        // 警告が必要な場合はモーダルを表示
        setTimeValidation(validationResult)
        setPendingAppointmentData({
          ...appointmentData,
          date: selectedDate,
          clinic_id: clinicId
        })
        setShowWarningModal(true)
        return
      }
      
      // 検証OKの場合は直接保存
      await onSave({
        ...appointmentData,
        date: selectedDate,
        clinic_id: clinicId
      })
    } catch (error) {
      console.error('予約保存エラー:', error)
    } finally {
      setSaving(false)
    }
  }

  // 時間検証を実行
  const validateAppointmentTimeForSave = async (): Promise<TimeValidationResult> => {
    try {
      const selectedDateObj = new Date(selectedDate)
      const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      
      const [businessHours, breakTimes] = await Promise.all([
        getBusinessHours(clinicId),
        getBreakTimes(clinicId)
      ])
      
      const dayBusinessHours = businessHours[dayOfWeek] || { isOpen: false, timeSlots: [] }
      const dayBreakTimes = breakTimes[dayOfWeek] || null
      
      return validateAppointmentTime(
        appointmentData.start_time,
        appointmentData.end_time,
        dayBusinessHours,
        dayBreakTimes,
        dayOfWeek
      )
    } catch (error) {
      console.error('時間検証エラー:', error)
      // エラーの場合は警告なしで通す
      return { isValid: true, isBreakTime: false, isOutsideBusinessHours: false }
    }
  }

  // 警告モーダルでの確定処理
  const handleConfirmSave = async () => {
    try {
      setSaving(true)
      setShowWarningModal(false)
      
      if (pendingAppointmentData) {
        await onSave(pendingAppointmentData)
        setPendingAppointmentData(null)
      }
    } catch (error) {
      console.error('予約保存エラー:', error)
    } finally {
      setSaving(false)
    }
  }

  // 警告モーダルを閉じる
  const handleCloseWarningModal = () => {
    setShowWarningModal(false)
    setTimeValidation(null)
    setPendingAppointmentData(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
      </div>
    )
  }

  return (
    <>
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>新規予約作成</CardTitle>
        <p className="text-sm text-gray-600">
          {selectedDate} {appointmentData.start_time}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 患者情報 */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">患者情報</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patient_name">患者名</Label>
              <Input
                id="patient_name"
                value={appointmentData.patient_name}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, patient_name: e.target.value }))}
                placeholder="例: 田中太郎"
              />
            </div>
            <div>
              <Label htmlFor="patient_name_kana">フリガナ</Label>
              <Input
                id="patient_name_kana"
                value={appointmentData.patient_name_kana}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, patient_name_kana: e.target.value }))}
                placeholder="例: タナカタロウ"
              />
            </div>
            <div>
              <Label htmlFor="patient_phone">電話番号</Label>
              <Input
                id="patient_phone"
                value={appointmentData.patient_phone}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, patient_phone: e.target.value }))}
                placeholder="例: 03-1234-5678"
              />
            </div>
            <div>
              <Label htmlFor="patient_email">メールアドレス</Label>
              <Input
                id="patient_email"
                type="email"
                value={appointmentData.patient_email}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, patient_email: e.target.value }))}
                placeholder="例: tanaka@example.com"
              />
            </div>
          </div>
        </div>

        {/* 診療メニュー */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">診療メニュー</h3>
          <div className="space-y-4">
            {/* レベル1（大分類） */}
            <div>
              <Label>大分類</Label>
              <Select value={appointmentData.menu1_id} onValueChange={handleMenu1Change}>
                <SelectTrigger>
                  <SelectValue placeholder="大分類を選択" />
                </SelectTrigger>
                <SelectContent>
                  {treatmentMenus.level1.map(menu => (
                    <SelectItem key={menu.id} value={menu.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: menu.color }}
                        />
                        <span>{menu.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* レベル2（中分類） */}
            {selectedMenu1 && (
              <div>
                <Label>中分類</Label>
                <Select value={appointmentData.menu2_id} onValueChange={handleMenu2Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="中分類を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentMenus.level2
                      .filter(menu => menu.parent_id === selectedMenu1.id)
                      .map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: menu.color }}
                            />
                            <span>{menu.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* レベル3（詳細） */}
            {selectedMenu2 && (
              <div>
                <Label>詳細</Label>
                <Select value={appointmentData.menu3_id} onValueChange={handleMenu3Change}>
                  <SelectTrigger>
                    <SelectValue placeholder="詳細を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {treatmentMenus.level3
                      .filter(menu => menu.parent_id === selectedMenu2.id)
                      .map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: menu.color }}
                            />
                            <span>{menu.name}</span>
                            {menu.standard_duration && (
                              <span className="text-xs text-gray-500">
                                ({menu.standard_duration}分)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* 担当者・時間 */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">担当者・時間</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <Input
                id="start_time"
                type="time"
                value={appointmentData.start_time}
                onChange={(e) => setAppointmentData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <Input
                id="end_time"
                type="time"
                value={appointmentData.end_time}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>担当者</Label>
              <Select value={appointmentData.staff1_id} onValueChange={(value) => setAppointmentData(prev => ({ ...prev, staff1_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="担当者を選択" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} {member.position?.name && `(${member.position.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 備考 */}
        <div>
          <Label htmlFor="notes">備考</Label>
          <Input
            id="notes"
            value={appointmentData.notes}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="備考があれば入力してください"
          />
        </div>

        {/* ボタン */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !appointmentData.patient_name || !appointmentData.start_time}
          >
            {saving ? '保存中...' : '予約作成'}
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* 時間警告モーダル */}
    {timeValidation && (
      <TimeWarningModal
        isOpen={showWarningModal}
        onClose={handleCloseWarningModal}
        onConfirm={handleConfirmSave}
        isBreakTime={timeValidation.isBreakTime}
        isOutsideBusinessHours={timeValidation.isOutsideBusinessHours}
        warningMessage={timeValidation.warningMessage || ''}
        startTime={appointmentData.start_time}
        endTime={appointmentData.end_time}
      />
    )}
  </>
  )
}
