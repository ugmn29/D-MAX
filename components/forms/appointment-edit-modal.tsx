'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { parseDBDate } from '@/lib/utils/date'
import { 
  Search, 
  UserPlus, 
  Edit, 
  Clock, 
  Calendar,
  User,
  Phone,
  Trash2,
  Copy,
  X
} from 'lucide-react'
import { getPatients, createPatient } from '@/lib/api/patients'
import { getTreatmentMenus } from '@/lib/api/treatment'
import { getStaff } from '@/lib/api/staff'
import { getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { Patient, TreatmentMenu, Staff } from '@/types/database'
import { TimeWarningModal } from '@/components/ui/time-warning-modal'
import { validateAppointmentTime, TimeValidationResult } from '@/lib/utils/time-validation'

interface WorkingStaff {
  staff: {
    id: string
    name: string
    position: string
  }
  shift_pattern: any
  is_holiday: boolean
}

interface AppointmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: string
  selectedDate: string
  selectedTime: string
  selectedStaffIndex?: number
  selectedTimeSlots?: string[]
  timeSlotMinutes?: number
  workingStaff?: WorkingStaff[]
  onSave: (appointmentData: any) => void
}

interface PatientSearchResult extends Patient {
  displayName: string
}

export function AppointmentEditModal({ 
  isOpen, 
  onClose, 
  clinicId, 
  selectedDate, 
  selectedTime,
  selectedStaffIndex,
  selectedTimeSlots = [],
  timeSlotMinutes = 15,
  workingStaff = [],
  onSave 
}: AppointmentEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // 患者検索
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  
  // 診療メニュー
  const [treatmentMenus, setTreatmentMenus] = useState<TreatmentMenu[]>([])
  const [selectedMenu1, setSelectedMenu1] = useState<TreatmentMenu | null>(null)
  const [selectedMenu2, setSelectedMenu2] = useState<TreatmentMenu | null>(null)
  const [selectedMenu3, setSelectedMenu3] = useState<TreatmentMenu | null>(null)
  const [showMenuModal, setShowMenuModal] = useState(false)
  
  // スタッフ
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  
  // 時間変換のヘルパー関数
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + minute
  }

  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  // 初期予約時間の計算
  const getInitialAppointmentData = useCallback(() => {
    console.log('getInitialAppointmentData called with:', { selectedTimeSlots, timeSlotMinutes, selectedTime })
    
    // 複数選択された時間範囲がある場合は、その範囲を設定
    if (selectedTimeSlots.length > 0) {
      const startTime = selectedTimeSlots[0]
      // 選択されたスロット数に基づいて終了時間を計算
      const totalSlots = selectedTimeSlots.length
      const totalDuration = totalSlots * timeSlotMinutes
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = startMinutes + totalDuration
      const endTime = minutesToTime(endMinutes)
      
      console.log('Calculated for multi-select:', { 
        startTime, 
        endTime, 
        totalSlots, 
        totalDuration, 
        timeSlotMinutes,
        selectedTimeSlots 
      })
      
      return {
        start_time: startTime,
        end_time: endTime,
        duration: totalDuration,
        menu1_id: '',
        menu2_id: '',
        menu3_id: '',
        staff1_id: '',
        staff2_id: '',
        staff3_id: '',
        notes: ''
      }
    } else {
      // 単一選択の場合は従来通り
      const defaultEndTimeMinutes = timeToMinutes(selectedTime) + timeSlotMinutes
      const defaultEndTime = minutesToTime(defaultEndTimeMinutes)
      
      console.log('Calculated for single-select:', { selectedTime, defaultEndTime, timeSlotMinutes })
      
      return {
        start_time: selectedTime,
        end_time: defaultEndTime,
        duration: timeSlotMinutes,
        menu1_id: '',
        menu2_id: '',
        menu3_id: '',
        staff1_id: '',
        staff2_id: '',
        staff3_id: '',
        notes: ''
      }
    }
  }, [selectedTimeSlots, timeSlotMinutes, selectedTime])

  // 予約データ
  const [appointmentData, setAppointmentData] = useState(getInitialAppointmentData())

  // 警告モーダル関連の状態
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [timeValidation, setTimeValidation] = useState<TimeValidationResult | null>(null)
  const [pendingAppointmentData, setPendingAppointmentData] = useState<any>(null)

  // モーダルが開かれた時に予約データを再初期化
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened or dependencies changed, re-initializing appointmentData')
      setAppointmentData(getInitialAppointmentData())
    }
  }, [isOpen, getInitialAppointmentData])

  // 選択されたスタッフインデックスに基づいて担当者を自動選択
  useEffect(() => {
    if (isOpen && selectedStaffIndex !== undefined && workingStaff.length > 0) {
      const selectedStaffMember = workingStaff[selectedStaffIndex]
      if (selectedStaffMember) {
        // workingStaffからStaffオブジェクトに変換
        const staffObject: Staff = {
          id: selectedStaffMember.staff.id,
          name: selectedStaffMember.staff.name,
          position: selectedStaffMember.staff.position,
          email: '',
          phone: '',
          created_at: '',
          updated_at: ''
        }
        setSelectedStaff([staffObject])
        console.log('自動選択された担当者:', staffObject)
        console.log('selectedStaffIndex:', selectedStaffIndex)
        console.log('workingStaff:', workingStaff)
      }
    } else if (isOpen && selectedStaffIndex === undefined) {
      // 空のセルをクリックした場合は担当者をクリア
      setSelectedStaff([])
      console.log('担当者をクリア（空のセル選択）')
    }
  }, [isOpen, selectedStaffIndex, workingStaff])
  
  // 新規患者データ
  const [newPatientData, setNewPatientData] = useState({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: '' as 'male' | 'female' | 'other' | ''
  })

  // データ読み込み
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, clinicId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [menusData, staffData] = await Promise.all([
        getTreatmentMenus(clinicId),
        getStaff(clinicId)
      ])
      
      setTreatmentMenus(menusData)
      setStaff(staffData)
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 患者検索
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const patients = await getPatients(clinicId)
      const filtered = patients
        .filter(patient => patient.is_registered) // 本登録済みのみ
        .filter(patient => 
          patient.patient_number?.toString().includes(query) ||
          `${patient.last_name} ${patient.first_name}`.includes(query) ||
          `${patient.last_name_kana} ${patient.first_name_kana}`.includes(query)
        )
        .map(patient => ({
          ...patient,
          displayName: `${patient.patient_number} - ${patient.last_name} ${patient.first_name}`
        }))
      
      setSearchResults(filtered)
    } catch (error) {
      console.error('患者検索エラー:', error)
    }
  }

  // 患者選択
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchQuery('')
    setSearchResults([])
  }


  // 診療メニュー階層の取得
  const getMenuLevel1 = () => treatmentMenus.filter(menu => menu.level === 1)
  const getMenuLevel2 = () => {
    if (!selectedMenu1) return []
    return treatmentMenus.filter(menu => menu.level === 2 && menu.parent_id === selectedMenu1.id)
  }
  const getMenuLevel3 = () => {
    if (!selectedMenu2) return []
    return treatmentMenus.filter(menu => menu.level === 3 && menu.parent_id === selectedMenu2.id)
  }

  // メニュー選択
  const handleMenu1Select = (menu: TreatmentMenu) => {
    setSelectedMenu1(menu)
    setSelectedMenu2(null)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu1_id: menu.id,
      menu2_id: '',
      menu3_id: ''
    }))
  }

  const handleMenu2Select = (menu: TreatmentMenu) => {
    setSelectedMenu2(menu)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu2_id: menu.id,
      menu3_id: ''
    }))
  }

  const handleMenu3Select = (menu: TreatmentMenu) => {
    setSelectedMenu3(menu)
    setAppointmentData(prev => ({
      ...prev,
      menu3_id: menu.id
    }))
    setShowMenuModal(false)
  }

  // 時間設定
  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleHourChange = (field: 'start_time' | 'end_time', hour: string) => {
    const currentTime = appointmentData[field]
    const [_, minutes] = currentTime.split(':')
    const newTime = `${hour}:${minutes}`
    
    setAppointmentData(prev => {
      const updatedData = { ...prev, [field]: newTime }
      
      // 開始時間または終了時間が変更された場合、継続時間を再計算
      const startMinutes = timeToMinutes(updatedData.start_time)
      const endMinutes = timeToMinutes(updatedData.end_time)
      const newDuration = endMinutes - startMinutes
      
      return { ...updatedData, duration: newDuration }
    })
  }

  const handleMinuteChange = (field: 'start_time' | 'end_time', minute: string) => {
    const currentTime = appointmentData[field]
    const [hours, _] = currentTime.split(':')
    const newTime = `${hours}:${minute}`
    
    setAppointmentData(prev => {
      const updatedData = { ...prev, [field]: newTime }
      
      // 開始時間または終了時間が変更された場合、継続時間を再計算
      const startMinutes = timeToMinutes(updatedData.start_time)
      const endMinutes = timeToMinutes(updatedData.end_time)
      const newDuration = endMinutes - startMinutes
      
      return { ...updatedData, duration: newDuration }
    })
  }

  const handleDurationChange = (duration: number) => {
    const startTime = appointmentData.start_time
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + duration
    const endTime = minutesToTime(endMinutes)
    
    setAppointmentData(prev => ({
      ...prev,
      duration,
      end_time: endTime
    }))
  }

  // 予約保存
  const handleSave = async () => {
    try {
      setSaving(true)
      
      let patientToUse = selectedPatient
      
      // 新規患者フォームが表示されている場合は、まず患者を作成
      if (showNewPatientForm) {
        if (!newPatientData.last_name || !newPatientData.first_name || !newPatientData.phone) {
          alert('患者情報を入力してください')
          return
        }
        
        // 新規患者を作成
        patientToUse = await createPatient(clinicId, {
          ...newPatientData,
          is_registered: false // 仮登録
        })
        
        setSelectedPatient(patientToUse)
        setShowNewPatientForm(false)
      }
      
      if (!patientToUse) {
        alert('患者を選択してください')
        return
      }

      const appointment = {
        patient_id: patientToUse.id,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
        menu2_id: appointmentData.menu2_id || selectedMenu2?.id || '',
        menu3_id: appointmentData.menu3_id || selectedMenu3?.id || '',
        staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
        staff2_id: appointmentData.staff2_id,
        staff3_id: appointmentData.staff3_id,
        notes: appointmentData.notes,
        status: '予約済み'
      }

      // 時間検証を実行
      const validationResult = await validateAppointmentTimeForSave()
      
      if (!validationResult.isValid) {
        // 警告が必要な場合はモーダルを表示
        setTimeValidation(validationResult)
        setPendingAppointmentData(appointment)
        setShowWarningModal(true)
        return
      }
      
      // 検証OKの場合は直接保存
      onSave(appointment)
      onClose()
    } catch (error) {
      console.error('予約保存エラー:', error)
      alert('予約の保存に失敗しました')
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
      setShowWarningModal(false)
      
      if (pendingAppointmentData) {
        onSave(pendingAppointmentData)
        onClose()
        setPendingAppointmentData(null)
      }
    } catch (error) {
      console.error('予約保存エラー:', error)
    }
  }

  // 警告モーダルを閉じる
  const handleCloseWarningModal = () => {
    setShowWarningModal(false)
    setTimeValidation(null)
    setPendingAppointmentData(null)
  }

  // モーダルリセット
  const handleClose = () => {
    setSelectedPatient(null)
    setSearchQuery('')
    setSearchResults([])
    setShowNewPatientForm(false)
    setSelectedMenu1(null)
    setSelectedMenu2(null)
    setSelectedMenu3(null)
    setSelectedStaff([])
    setNewPatientData({
      last_name: '',
      first_name: '',
      last_name_kana: '',
      first_name_kana: '',
      phone: '',
      email: '',
      birth_date: '',
      gender: ''
    })
    setAppointmentData({
      start_time: selectedTime,
      end_time: '',
      duration: 60,
      menu1_id: '',
      menu2_id: '',
      menu3_id: '',
      staff1_id: '',
      staff2_id: '',
      staff3_id: '',
      notes: ''
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[95vh] overflow-y-auto">
        {/* コンテンツ */}
        <div className="p-6">
          {/* 閉じるボタン */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex h-[600px]">
            {/* 左カラム: 患者情報と予約履歴 */}
            <div className="w-1/2 pr-6 border-r border-gray-200 flex flex-col">
              {/* 患者情報 */}
              <div className="mb-6">
                
                  {/* 患者検索 */}
                <div className="mb-4">
                  {!showNewPatientForm && (
                    <div className="flex space-x-2 mb-3 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="ID/名"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            handleSearch(e.target.value)
                          }}
                          className="pl-10 h-10"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setShowNewPatientForm(true)}
                        className="px-4 h-10"
                      >
                        新規
                      </Button>
                    </div>
                  )}
                  
                  {/* 検索結果 */}
                  {searchResults.length > 0 && (
                    <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md mb-3">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium text-sm">{patient.displayName}</div>
                          <div className="text-xs text-gray-500">
                            {patient.phone} | {patient.birth_date ? `${new Date().getFullYear() - new Date(patient.birth_date).getFullYear()}歳` : '年齢不明'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 選択された患者情報 */}
                  {selectedPatient ? (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={`${selectedPatient.last_name} ${selectedPatient.first_name}`}
                          className="text-lg font-medium border-none bg-transparent p-0 h-auto"
                          readOnly
                        />
                        <Button variant="ghost" size="sm" className="p-1">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        ID: {selectedPatient.patient_number} 年齢: {selectedPatient.birth_date ? `${new Date().getFullYear() - new Date(selectedPatient.birth_date).getFullYear()}歳` : '--歳'} 生年月日: {selectedPatient.birth_date || '--'} 性別: {selectedPatient.gender === 'male' ? '男性' : selectedPatient.gender === 'female' ? '女性' : '--'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        <span className="flex-1">{selectedPatient.phone}</span>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {/* 新規患者フォーム */}
                  {showNewPatientForm && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-3">
                      <div className="text-sm font-medium mb-3">新規患者登録</div>
                      <div className="space-y-3">
                        {/* 1行目: 姓名 */}
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="姓"
                            value={newPatientData.last_name}
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, last_name: e.target.value }))}
                            className="text-sm h-10"
                          />
                          <Input
                            placeholder="名"
                            value={newPatientData.first_name}
                            onChange={(e) => setNewPatientData(prev => ({ ...prev, first_name: e.target.value }))}
                            className="text-sm h-10"
                          />
                        </div>
                        {/* 2行目: 電話番号 */}
                        <Input
                          placeholder="電話番号"
                          value={newPatientData.phone}
                          onChange={(e) => setNewPatientData(prev => ({ ...prev, phone: e.target.value }))}
                          className="text-sm h-10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 予約履歴 - 左下の1/2に配置 */}
              <div className="mt-auto h-1/2 flex flex-col">
                <h3 className="text-lg font-medium mb-4">予約履歴</h3>
                <div className="border border-gray-200 rounded-md flex-1 flex flex-col">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
                      <div>予約日時</div>
                      <div>担当</div>
                      <div>メニュー</div>
                      <div>キャンセル</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
                    {selectedPatient ? (
                      // 仮の予約履歴データ（実際のデータは今後実装）
                      [
                        { date: '2025/09/26(金)', time: '09:00', staff: '福永', menu: '定期健診', hasStaff: true },
                        { date: '2025/09/19(金)', time: '09:00', staff: '福永', menu: '定期健診', hasStaff: true },
                        { date: '2025/09/12(金)', time: '16:00', staff: '未設定', menu: '診療', hasStaff: false },
                        { date: '2025/09/11(木)', time: '11:00', staff: '福永', menu: '定期健診', hasStaff: true }
                      ].map((appointment, index) => (
                        <div key={index} className="px-4 py-3">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div className="text-gray-900">{appointment.date} {appointment.time}</div>
                            <div>
                              {appointment.hasStaff ? (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                  {appointment.staff}
                                </span>
                              ) : (
                                <span className="text-gray-500">{appointment.staff}</span>
                              )}
                            </div>
                            <div className="text-gray-900">{appointment.menu}</div>
                            <div>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 p-1">
                                ×
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        患者を選択すると予約履歴が表示されます
                      </div>
                    )}
                  </div>
                </div>
                {selectedPatient && (
                  <div className="mt-4">
                    <Button variant="destructive" className="w-full">
                      × 予約をキャンセル
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* 右カラム: 予約設定 */}
            <div className="w-1/2 pl-6">
              <div className="space-y-6">
                {/* 予約日時 */}
                <div>
                  <div className="text-2xl font-bold text-gray-800 mb-4">
                    {format(parseDBDate(selectedDate), 'yyyy/MM/dd(eee)', { locale: ja })}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={appointmentData.start_time?.split(':')[0] || ''} onValueChange={(value) => handleHourChange('start_time', value)}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-sm">時</span>
                    <Select value={appointmentData.start_time?.split(':')[1] || ''} onValueChange={(value) => handleMinuteChange('start_time', value)}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 / timeSlotMinutes }, (_, i) => {
                          const minute = (i * timeSlotMinutes).toString().padStart(2, '0')
                          return (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-sm">分</span>
                    <span className="text-sm">~</span>
                    <Select value={appointmentData.end_time?.split(':')[0] || ''} onValueChange={(value) => handleHourChange('end_time', value)}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-sm">時</span>
                    <Select value={appointmentData.end_time?.split(':')[1] || ''} onValueChange={(value) => handleMinuteChange('end_time', value)}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 / timeSlotMinutes }, (_, i) => {
                          const minute = (i * timeSlotMinutes).toString().padStart(2, '0')
                          return (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-sm">分</span>
                    <Select value={appointmentData.duration?.toString() || ''} onValueChange={(value) => handleDurationChange(Number(value))}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[15, 30, 45, 60, 90, 120].map(duration => (
                          <SelectItem key={duration} value={duration.toString()}>
                            {duration}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* メニュー選択 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMenuModal(true)}
                    className="w-24 h-10 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    メニュー
                  </button>
                  {selectedMenu3 && (
                    <div className="text-gray-600 font-medium">
                      : {selectedMenu3.name}
                    </div>
                  )}
                  {selectedMenu2 && !selectedMenu3 && (
                    <div className="text-gray-600 font-medium">
                      : {selectedMenu2.name}
                    </div>
                  )}
                  {selectedMenu1 && !selectedMenu2 && !selectedMenu3 && (
                    <div className="text-gray-600 font-medium">
                      : {selectedMenu1.name}
                    </div>
                  )}
                </div>

                {/* 担当者選択 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowStaffModal(true)}
                    className="w-24 h-10 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    スタッフ
                  </button>
                  {selectedStaff.length > 0 && (
                    <div className="text-gray-600 font-medium">
                      : {selectedStaff[0].name}
                    </div>
                  )}
                </div>

                {/* メモ */}
                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">メモ</Label>
                  <Textarea
                    id="notes"
                    placeholder="メモを入力..."
                    value={appointmentData.notes}
                    onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline">
                    <Copy className="w-4 h-4 mr-1" />
                    コピー
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={saving || (!selectedPatient && !showNewPatientForm)}
                  >
                    {saving ? '登録中...' : '登録'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 診療メニュー選択モーダル */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMenuModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">診療メニュー選択</h3>
              
              <div className="space-y-4">
                {/* レベル1 */}
                <div>
                  <Label className="font-medium">診療1</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {getMenuLevel1().map((menu) => (
                      <Button
                        key={menu.id}
                        variant={selectedMenu1?.id === menu.id ? "default" : "outline"}
                        onClick={() => handleMenu1Select(menu)}
                        className="justify-start"
                      >
                        {menu.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* レベル2 */}
                {selectedMenu1 && (
                  <div>
                    <Label className="font-medium">診療2</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {getMenuLevel2().map((menu) => (
                        <Button
                          key={menu.id}
                          variant={selectedMenu2?.id === menu.id ? "default" : "outline"}
                          onClick={() => handleMenu2Select(menu)}
                          className="justify-start"
                        >
                          {menu.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* レベル3 */}
                {selectedMenu2 && (
                  <div>
                    <Label className="font-medium">診療3</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {getMenuLevel3().map((menu) => (
                        <Button
                          key={menu.id}
                          variant={selectedMenu3?.id === menu.id ? "default" : "outline"}
                          onClick={() => handleMenu3Select(menu)}
                          className="justify-start"
                        >
                          {menu.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowMenuModal(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 担当者選択モーダル */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowStaffModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">担当者選択</h3>
              
              <div className="space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={member.id}
                      checked={selectedStaff.some(s => s.id === member.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStaff(prev => [...prev, member])
                        } else {
                          setSelectedStaff(prev => prev.filter(s => s.id !== member.id))
                        }
                      }}
                    />
                    <Label htmlFor={member.id} className="flex-1">
                      {member.name} ({member.position})
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowStaffModal(false)}>
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

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
