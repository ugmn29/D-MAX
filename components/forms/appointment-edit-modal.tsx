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
  X,
  FileText,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { getPatients, createPatient } from '@/lib/api/patients'
import { getTreatmentMenus } from '@/lib/api/treatment'
import Link from 'next/link'
import { getStaff } from '@/lib/api/staff'
import { getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { getAppointments, updateAppointment } from '@/lib/api/appointments'
import { getUnits, getStaffUnitPriorities, Unit, StaffUnitPriority } from '@/lib/api/units'
import { logAppointmentChange, logAppointmentCreation } from '@/lib/api/appointment-logs'
import { getUnlinkedQuestionnaireResponses, linkQuestionnaireResponseToPatient, unlinkQuestionnaireResponse, QuestionnaireResponse, debugQuestionnaireResponses } from '@/lib/api/questionnaires'
import { MOCK_MODE, initializeMockData } from '@/lib/utils/mock-mode'
import { Patient, TreatmentMenu, Staff } from '@/types/database'
import { TimeWarningModal } from '@/components/ui/time-warning-modal'
import { validateAppointmentTime, TimeValidationResult } from '@/lib/utils/time-validation'
import { CancelReasonModal } from '@/components/ui/cancel-reason-modal'
import { HierarchicalMenu } from '@/components/ui/hierarchical-menu'
import { PATIENT_ICONS } from '@/lib/constants/patient-icons'
import { SubKarteTab } from '@/components/patients/subkarte-tab'
import { PatientEditModal } from '@/components/forms/patient-edit-modal'

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
  selectedUnitIndex?: number
  selectedTimeSlots?: string[]
  timeSlotMinutes?: number
  workingStaff?: WorkingStaff[]
  units?: Unit[]
  editingAppointment?: any
  onSave: (appointmentData: any) => void
  onUpdate?: (appointmentData: any) => void
  onCopyAppointment?: (appointment: any) => void
  onAppointmentCancel?: () => void // 予約キャンセル成功後のコールバック
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
  selectedUnitIndex,
  selectedTimeSlots = [], 
  timeSlotMinutes = 15, 
  workingStaff = [],
  units = [],
  editingAppointment,
  onSave,
  onUpdate,
  onCopyAppointment,
  onAppointmentCancel
}: AppointmentEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState<any[]>([])
  
  // タブ管理
  const [activeTab, setActiveTab] = useState<'appointment' | 'subkarte'>('appointment')
  
  // モーダルが開かれたときにタブをリセット
  useEffect(() => {
    if (isOpen) {
      setActiveTab('appointment')
    }
  }, [isOpen])
  
  // 患者編集モーダル
  const [showPatientEditModal, setShowPatientEditModal] = useState(false)
  
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
  const [hoveredMenu1, setHoveredMenu1] = useState<string | null>(null)
  const [showSubMenus, setShowSubMenus] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // スタッフ
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Staff[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  
  // ユニット
  const [localUnits, setLocalUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<StaffUnitPriority[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  
  // propsのunitsとローカルのunitsを統合
  const allUnits = units.length > 0 ? units : localUnits
  
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

  // キャンセルモーダル関連の状態
  const [showCancelModal, setShowCancelModal] = useState(false)

  // 本登録モーダル関連の状態
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationStep, setRegistrationStep] = useState<'select' | 'questionnaire' | 'insurance'>('select')
  const [unlinkedQuestionnaires, setUnlinkedQuestionnaires] = useState<QuestionnaireResponse[]>([])
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null)
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false)

  // 未連携問診票を取得
  const fetchUnlinkedQuestionnaires = async () => {
    if (!clinicId) return
    
    console.log('未連携問診票取得開始:', { clinicId })
    
    // デバッグ：現在の配列状態を確認
    console.log('デバッグ: 取得前の配列状態')
    debugQuestionnaireResponses()
    
    setLoadingQuestionnaires(true)
    try {
      const responses = await getUnlinkedQuestionnaireResponses(clinicId)
      console.log('未連携問診票取得結果:', { 
        count: responses.length, 
        responses: responses.map(r => ({
          id: r.id,
          name: r.response_data.patient_name || r.response_data['q1-1'],
          phone: r.response_data.patient_phone || r.response_data['q1-10']
        }))
      })
      setUnlinkedQuestionnaires(responses)
    } catch (error) {
      console.error('未連携問診票の取得エラー:', error)
    } finally {
      setLoadingQuestionnaires(false)
    }
  }

  // 問診票を患者に紐付け
  const linkQuestionnaireToPatient = async () => {
    if (!selectedQuestionnaireId || !selectedPatient) return
    
    try {
      // 選択された問診票のデータを取得
      const selectedQuestionnaire = unlinkedQuestionnaires.find(q => q.id === selectedQuestionnaireId)
      if (!selectedQuestionnaire) {
        alert('問診票データが見つかりません')
        return
      }

      const responseData = selectedQuestionnaire.response_data
      
      // 問診票から患者情報を抽出
      const patientName = responseData.patient_name || responseData['q1-1'] || ''
      const patientNameKana = responseData.patient_name_kana || responseData['q1-2'] || ''
      const gender = responseData['q1-3'] || ''
      const birthDate = responseData['q1-4'] || ''
      const phone = responseData.patient_phone || responseData['q1-10'] || ''
      const email = responseData.patient_email || responseData['q1-11'] || ''
      
      // 名前を姓と名に分割
      const nameParts = patientName.split(' ')
      const lastName = nameParts[0] || ''
      const firstName = nameParts.slice(1).join(' ') || ''
      
      // フリガナを姓と名に分割
      const kanaParts = patientNameKana.split(' ')
      const lastNameKana = kanaParts[0] || ''
      const firstNameKana = kanaParts.slice(1).join(' ') || ''
      
      // 性別を変換
      let genderValue: 'male' | 'female' | 'other' = 'other'
      if (gender === '男' || gender === 'male') {
        genderValue = 'male'
      } else if (gender === '女' || gender === 'female') {
        genderValue = 'female'
      }
      
      // 患者情報を更新
      const updatedPatient = {
        ...selectedPatient,
        last_name: lastName,
        first_name: firstName,
        last_name_kana: lastNameKana,
        first_name_kana: firstNameKana,
        gender: genderValue,
        birth_date: birthDate,
        phone: phone,
        email: email,
        is_registered: true // 本登録済みに更新
      }
      
      // 患者情報を更新
      try {
        if (MOCK_MODE) {
          // 本登録時にIDを割り振る
          const { generatePatientNumber } = await import('@/lib/api/patients')
          const patientNumber = await generatePatientNumber(clinicId)

          // モックモードではlocalStorageに保存
          const { updateMockPatient, getMockPatients } = await import('@/lib/utils/mock-mode')

          // 更新前の患者データを確認
          const beforePatients = getMockPatients()
          console.log('本登録前の患者一覧:', beforePatients.map(p => ({ id: p.id, name: `${p.last_name} ${p.first_name}`, is_registered: p.is_registered })))
          console.log('更新対象の患者ID:', selectedPatient.id)

          const updated = updateMockPatient(selectedPatient.id, {
            last_name: lastName,
            first_name: firstName,
            last_name_kana: lastNameKana,
            first_name_kana: firstNameKana,
            gender: genderValue,
            birth_date: birthDate,
            phone: phone,
            email: email,
            patient_number: patientNumber,
            is_registered: true
          })

          // 更新後の患者データを確認
          const afterPatients = getMockPatients()
          console.log('本登録後の患者一覧:', afterPatients.map(p => ({ id: p.id, name: `${p.last_name} ${p.first_name}`, is_registered: p.is_registered })))
          console.log('モックモード: 患者情報をlocalStorageに保存（ID割り振り）', updated)

          if (!updated) {
            console.error('患者の更新に失敗しました。患者が見つかりません:', selectedPatient.id)
            alert('患者情報の更新に失敗しました。患者が見つかりません。')
            return
          }

          setSelectedPatient(updated)
        } else {
          // 本登録時にIDを割り振る
          const { generatePatientNumber } = await import('@/lib/api/patients')
          const patientNumber = await generatePatientNumber(clinicId)

          // 本番モードではデータベースに保存
          const { updatePatient } = await import('@/lib/api/patients')
          const updated = await updatePatient(clinicId, selectedPatient.id, {
            last_name: lastName,
            first_name: firstName,
            last_name_kana: lastNameKana,
            first_name_kana: firstNameKana,
            gender: genderValue,
            birth_date: birthDate,
            phone: phone,
            email: email,
            patient_number: patientNumber,
            is_registered: true
          })

          // 状態も更新
          setSelectedPatient(updated)
        }
      } catch (error) {
        console.error('患者情報の更新エラー:', error)
        alert('患者情報の更新に失敗しました')
        return
      }
      
      await linkQuestionnaireResponseToPatient(
        selectedQuestionnaireId,
        selectedPatient.id,
        editingAppointment?.id
      )
      
      // 患者情報を再取得して表示を更新
      try {
        const { getPatients } = await import('@/lib/api/patients')
        const updatedPatients = await getPatients(clinicId)
        const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id)
        if (updatedPatient) {
          setSelectedPatient(updatedPatient)
          console.log('患者情報を再取得して表示を更新:', updatedPatient)
          
          // 強制的にコンポーネントを再レンダリング
          setTimeout(() => {
            console.log('患者情報の表示更新完了:', updatedPatient)
            // 状態を強制的に更新
            setSelectedPatient({ ...updatedPatient })
          }, 100)
        }
      } catch (error) {
        console.error('患者情報の再取得エラー:', error)
      }
      
      // 予約データも更新して患者情報を反映
      if (editingAppointment && updatedPatient) {
        try {
          const { updateAppointment } = await import('@/lib/api/appointments')
          await updateAppointment(editingAppointment.id, {
            patient_id: updatedPatient.id
          })
          console.log('予約データに患者情報を反映しました')
        } catch (error) {
          console.error('予約データの更新エラー:', error)
        }
      }

      alert('問診票を患者に紐付けました。患者情報が自動更新されました。')
      setShowRegistrationModal(false)

      // モーダルは閉じずに患者情報の表示を更新
      console.log('問診票連携完了: モーダルを開いたまま患者情報を更新')
    } catch (error) {
      console.error('問診票紐付けエラー:', error)
      alert('問診票の紐付けに失敗しました')
    }
  }

  // 問診票の連携を解除する関数
  const unlinkQuestionnaireFromPatient = async () => {
    if (!selectedPatient) {
      alert('患者が選択されていません')
      return
    }

    try {
      console.log('問診票連携解除開始:', { selectedPatient: selectedPatient.id })
      
      // 連携されている問診票のIDを取得（実際の実装では患者に紐づいている問診票を特定する必要があります）
      // ここでは簡易的に最後に連携された問診票を解除
      const linkedQuestionnaireId = selectedPatient.linked_questionnaire_id
      if (!linkedQuestionnaireId) {
        alert('連携されている問診票が見つかりません')
        return
      }

      // 問診票の連携を解除
      await unlinkQuestionnaireResponse(linkedQuestionnaireId)
      
      // 患者情報を元に戻す（仮登録状態に戻す）
      const revertedPatient = {
        ...selectedPatient,
        is_registered: false,
        linked_questionnaire_id: null
      }
      
      // 患者情報を更新
      if (MOCK_MODE) {
        const { updateMockPatient } = await import('@/lib/utils/mock-mode')
        updateMockPatient(selectedPatient.id, {
          is_registered: false,
          linked_questionnaire_id: null
        })
        setSelectedPatient(revertedPatient)
      }
      
      alert('問診票の連携を解除しました。患者情報が仮登録状態に戻りました。')
      
      // 未連携問診票を再取得
      await fetchUnlinkedQuestionnaires()
      
    } catch (error) {
      console.error('問診票連携解除エラー:', error)
      alert('問診票の連携解除に失敗しました')
    }
  }

  // モーダルが開かれた時に予約データを再初期化
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened or dependencies changed, re-initializing appointmentData')
      if (editingAppointment) {
        console.log('既存の予約データを設定:', editingAppointment)
        
        // end_timeが設定されていない場合（コピー時など）は初期データから計算
        const initialData = getInitialAppointmentData()
        
        // 既存の予約データを設定
        setAppointmentData({
          start_time: editingAppointment.start_time || initialData.start_time,
          end_time: editingAppointment.end_time || initialData.end_time,
          duration: editingAppointment.duration || initialData.duration,
          menu1_id: editingAppointment.menu1_id || '',
          menu2_id: editingAppointment.menu2_id || '',
          menu3_id: editingAppointment.menu3_id || '',
          staff1_id: editingAppointment.staff1_id || '',
          staff2_id: editingAppointment.staff2_id || '',
          staff3_id: editingAppointment.staff3_id || '',
          notes: editingAppointment.notes || ''
        })
        
        // 既存の患者を設定
        console.log('モーダル: editingAppointmentの内容:', editingAppointment)
        console.log('モーダル: editingAppointment.patient:', editingAppointment.patient)
        console.log('モーダル: editingAppointment.patient_id:', editingAppointment.patient_id)
        
        if (editingAppointment.patient) {
          // 患者情報が直接含まれている場合（コピー時など）は、それを使用
          console.log('コピー元の患者情報を設定:', editingAppointment.patient)
          setSelectedPatient(editingAppointment.patient)
          console.log('selectedPatientに設定完了:', editingAppointment.patient)
          
          // 本登録済みの患者の場合のみ最新情報を再取得
          if (editingAppointment.patient.is_registered) {
            const refreshPatientInfo = async () => {
              try {
                console.log('本登録済み患者情報の再取得開始:', editingAppointment.patient.id)
                const { getPatients } = await import('@/lib/api/patients')
                const updatedPatients = await getPatients(clinicId)
                
                const updatedPatient = updatedPatients.find(p => p.id === editingAppointment.patient.id)
                if (updatedPatient) {
                  setSelectedPatient(updatedPatient)
                  console.log('患者情報を最新の状態で再取得:', updatedPatient)
                }
              } catch (error) {
                console.error('患者情報の再取得エラー:', error)
                // エラーの場合は元の患者情報を使用（既に設定済み）
              }
            }
            refreshPatientInfo()
          }
        } else if (editingAppointment.patient_id) {
          // patient_idのみの場合は再取得が必要
          const refreshPatientInfo = async () => {
            try {
              const { getPatients } = await import('@/lib/api/patients')
              const updatedPatients = await getPatients(clinicId)
              const updatedPatient = updatedPatients.find(p => p.id === editingAppointment.patient_id)
              if (updatedPatient) {
                setSelectedPatient(updatedPatient)
                console.log('患者情報を取得:', updatedPatient)
              }
            } catch (error) {
              console.error('患者情報の取得エラー:', error)
            }
          }
          refreshPatientInfo()
        }
        
        // 既存のメニューを設定
        if (editingAppointment.menu1) {
          setSelectedMenu1(editingAppointment.menu1)
        }
        if (editingAppointment.menu2) {
          setSelectedMenu2(editingAppointment.menu2)
        }
        if (editingAppointment.menu3) {
          setSelectedMenu3(editingAppointment.menu3)
        }
      } else {
        setAppointmentData(getInitialAppointmentData())
      }
    }
  }, [isOpen, getInitialAppointmentData, editingAppointment])

  // 選択されたスタッフインデックスまたはユニットインデックスに基づいて自動選択
  useEffect(() => {
    if (isOpen) {
      // スタッフが選択された場合
      if (selectedStaffIndex !== undefined && workingStaff.length > 0) {
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
          
          // スタッフ選択時にユニットを自動割り当て
          const autoAssignUnit = async () => {
            if (appointmentData.start_time && appointmentData.end_time) {
              const autoUnit = await getAutoAssignedUnit(
                staffObject.id,
                selectedDate,
                appointmentData.start_time,
                appointmentData.end_time
              )
              if (autoUnit) {
                setSelectedUnit(autoUnit)
                setAppointmentData(prev => ({
                  ...prev,
                  unit_id: autoUnit.id
                }))
                console.log('自動割り当てされたユニット:', autoUnit)
              } else {
                console.log('ユニットの自動割り当てに失敗（全ユニット埋まり）')
              }
            }
          }
          autoAssignUnit()
        }
      }
      // ユニットが選択された場合
      else if (selectedUnitIndex !== undefined && allUnits.length > 0) {
        const selectedUnitMember = allUnits[selectedUnitIndex]
        if (selectedUnitMember) {
          setSelectedUnit(selectedUnitMember)
          setAppointmentData(prev => ({
            ...prev,
            unit_id: selectedUnitMember.id
          }))
          console.log('自動選択されたユニット:', selectedUnitMember)
          console.log('selectedUnitIndex:', selectedUnitIndex)
          console.log('allUnits:', allUnits)
          
          // ユニット選択時にスタッフをクリア（ユニット優先）
          setSelectedStaff([])
        }
      }
      // どちらも選択されていない場合
      else {
        setSelectedStaff([])
        setSelectedUnit(null)
        setAppointmentData(prev => ({
          ...prev,
          unit_id: ''
        }))
        console.log('担当者とユニットをクリア（空のセル選択）')
      }
    }
  }, [isOpen, selectedStaffIndex, selectedUnitIndex, workingStaff, allUnits, appointmentData.start_time, appointmentData.end_time, selectedDate])

  // 患者が選択された時に予約履歴を取得
  useEffect(() => {
    const loadPatientAppointments = async () => {
      if (selectedPatient && isOpen) {
        try {
          console.log('患者の予約履歴を取得:', selectedPatient.id)
          const appointments = await getAppointments(clinicId)
          console.log('取得した全予約:', appointments)
          
          // 選択された患者の予約のみをフィルタリング
          const patientAppointments = appointments.filter(apt => 
            apt.patient_id === selectedPatient.id
          )
          console.log('患者の予約履歴:', patientAppointments)
          
          setPatientAppointments(patientAppointments)
        } catch (error) {
          console.error('予約履歴の取得エラー:', error)
          setPatientAppointments([])
        }
      } else {
        setPatientAppointments([])
      }
    }

    loadPatientAppointments()
  }, [selectedPatient, isOpen, clinicId])
  
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

  // クリーンアップ処理
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // デバッグ: モックデータの初期化を確認
      console.log('診療メニュー: loadData開始')
      console.log('診療メニュー: モックデータ初期化前')
      
      // localStorageをクリアして強制初期化
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mock_treatment_menus')
        console.log('診療メニュー: localStorageをクリアしました')
      }
      
      initializeMockData()
      console.log('診療メニュー: モックデータ初期化後')
      
      const [menusData, staffData, unitsData, prioritiesData] = await Promise.all([
        getTreatmentMenus(clinicId),
        getStaff(clinicId),
        getUnits(clinicId),
        getStaffUnitPriorities(clinicId)
      ])
      
      console.log('診療メニュー: データ読み込み完了', { 
        menusData: menusData.length, 
        level1: menusData.filter(m => m.level === 1).length,
        level2: menusData.filter(m => m.level === 2).length,
        menusData 
      })
      
      // デバッグ: 各レベルのメニューを詳細表示
      const level1Menus = menusData.filter(m => m.level === 1)
      const level2Menus = menusData.filter(m => m.level === 2)
      console.log('診療メニュー: Level 1メニュー', level1Menus)
      console.log('診療メニュー: Level 2メニュー', level2Menus)
      
      // デバッグ: menu-1のサブメニューを確認
      const menu1SubMenus = level2Menus.filter(m => m.parent_id === 'menu-1')
      console.log('診療メニュー: menu-1のサブメニュー', menu1SubMenus)
      
      setTreatmentMenus(menusData)
      setStaff(staffData)
      setLocalUnits(unitsData)
      setStaffUnitPriorities(prioritiesData)
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

  // 診療時間の総合計を計算
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0
    
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(`2000-01-01T${endTime}:00`)
    
    const diffMs = end.getTime() - start.getTime()
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    
    return diffMinutes
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

  // ユニット関連の関数
  const getAutoAssignedUnit = async (staffId: string, date: string, startTime: string, endTime: string): Promise<Unit | null> => {
    try {
      // 1. スタッフの優先ユニットを取得
      const staffPriorities = staffUnitPriorities.filter(p => p.staff_id === staffId)
      const sortedPriorities = staffPriorities.sort((a, b) => a.priority_order - b.priority_order)
      
      // 2. 各優先ユニットの空き状況をチェック
      for (const priority of sortedPriorities) {
        const isAvailable = await checkUnitAvailability(priority.unit_id, date, startTime, endTime)
        if (isAvailable) {
          const unit = allUnits.find(u => u.id === priority.unit_id)
          if (unit) return unit
        }
      }
      
      // 3. 優先ユニットが全て埋まっている場合は、他の空いているユニットを探す
      for (const unit of allUnits) {
        if (unit.is_active) {
          const isAvailable = await checkUnitAvailability(unit.id, date, startTime, endTime)
          if (isAvailable) return unit
        }
      }
      
      return null // 全てのユニットが埋まっている
    } catch (error) {
      console.error('ユニット自動割り当てエラー:', error)
      return null
    }
  }

  const checkUnitAvailability = async (unitId: string, date: string, startTime: string, endTime: string): Promise<boolean> => {
    try {
      // 既存予約との重複チェック
      const appointments = await getAppointments(clinicId, date, date)
      const conflictingAppointments = appointments.filter(apt => 
        apt.unit_id === unitId &&
        apt.status !== 'キャンセル' &&
        !(apt.end_time <= startTime || apt.start_time >= endTime)
      )
      
      return conflictingAppointments.length === 0
    } catch (error) {
      console.error('ユニット空き状況チェックエラー:', error)
      return false
    }
  }

  const getAvailableUnits = async (date: string, startTime: string, endTime: string): Promise<Unit[]> => {
    const availableUnits: Unit[] = []
    
    for (const unit of allUnits) {
      if (unit.is_active) {
        const isAvailable = await checkUnitAvailability(unit.id, date, startTime, endTime)
        if (isAvailable) {
          availableUnits.push(unit)
        }
      }
    }
    
    return availableUnits
  }

  const handleUnitSelect = (unit: Unit) => {
    setSelectedUnit(unit)
    setAppointmentData(prev => ({
      ...prev,
      unit_id: unit.id
    }))
    setShowUnitModal(false)
  }

  // ユニットモーダルが開かれた時に空き状況をチェック
  useEffect(() => {
    const checkAvailableUnits = async () => {
      if (showUnitModal && appointmentData.start_time && appointmentData.end_time) {
        const available = await getAvailableUnits(
          selectedDate,
          appointmentData.start_time,
          appointmentData.end_time
        )
        setAvailableUnits(available)
      }
    }
    
    checkAvailableUnits()
  }, [showUnitModal, selectedDate, appointmentData.start_time, appointmentData.end_time])

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
    // 診療1のみ選択した場合はモーダルを閉じる
    setShowMenuModal(false)
  }

  const handleMenu2Select = (menu: TreatmentMenu) => {
    setSelectedMenu2(menu)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu2_id: menu.id,
      menu3_id: ''
    }))
    // 診療2選択時は診療1+2の表示でモーダルを閉じる
    setShowMenuModal(false)
  }

  const handleMenu3Select = (menu: TreatmentMenu) => {
    setSelectedMenu3(menu)
    setAppointmentData(prev => ({
      ...prev,
      menu3_id: menu.id
    }))
    setShowMenuModal(false)
  }

  // ホバー時の小メニュー表示（デバウンス処理付き）
  const handleMenu1Hover = (menuId: string | null) => {
    console.log('診療メニュー: ホバー検知', { menuId, treatmentMenus: treatmentMenus.length })
    
    // 既存のタイムアウトをクリア
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    
    if (menuId) {
      // ホバー開始時は即座に表示
      setHoveredMenu1(menuId)
      setShowSubMenus(true)
      console.log('診療メニュー: ホバー開始', { menuId, showSubMenus: true })
      
      // サブメニューの存在確認
      const subMenus = getMenuLevel2().filter(menu => menu.parent_id === menuId)
      console.log('診療メニュー: サブメニュー確認', { menuId, subMenus: subMenus.length, subMenus })
    } else {
      // ホバー終了時は少し遅延して非表示（マウスが一時的に外れても震えないように）
      const timeout = setTimeout(() => {
        setHoveredMenu1(null)
        setShowSubMenus(false)
        console.log('診療メニュー: ホバー終了')
      }, 150) // 150msの遅延
      setHoverTimeout(timeout)
    }
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
      
      const finalData = { ...updatedData, duration: newDuration }
      
      // 既存の予約を編集している場合は即座にカレンダーを更新
      if (editingAppointment && onUpdate) {
        onUpdate({
          ...finalData,
          patient_id: editingAppointment.patient_id,
          menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
          menu2_id: appointmentData.menu2_id || selectedMenu2?.id || '',
          menu3_id: appointmentData.menu3_id || selectedMenu3?.id || '',
          staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
          staff2_id: appointmentData.staff2_id,
          staff3_id: appointmentData.staff3_id,
          notes: appointmentData.notes,
          status: editingAppointment.status
        })
      }
      
      return finalData
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
      
      const finalData = { ...updatedData, duration: newDuration }
      
      // 既存の予約を編集している場合は即座にカレンダーを更新
      if (editingAppointment && onUpdate) {
        onUpdate({
          ...finalData,
          patient_id: editingAppointment.patient_id,
          menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
          menu2_id: appointmentData.menu2_id || selectedMenu2?.id || '',
          menu3_id: appointmentData.menu3_id || selectedMenu3?.id || '',
          staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
          staff2_id: appointmentData.staff2_id,
          staff3_id: appointmentData.staff3_id,
          notes: appointmentData.notes,
          status: editingAppointment.status
        })
      }
      
      return finalData
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
      
      // 既存の予約を編集する場合は、新規患者作成をスキップ
      if (!editingAppointment) {
        // 新規患者フォームが表示されている場合は、まず患者を作成
        if (showNewPatientForm) {
          if (!newPatientData.last_name || !newPatientData.first_name || !newPatientData.phone) {
            alert('患者情報を入力してください')
            return
          }
          
          // 新規患者を作成（IDを連番で1から振る）
          const { generatePatientNumber } = await import('@/lib/api/patients')
          const patientNumber = await generatePatientNumber(clinicId)
          
          patientToUse = await createPatient(clinicId, {
            ...newPatientData,
            patient_number: patientNumber,
            is_registered: false // 仮登録
          })
          
          setSelectedPatient(patientToUse)
          setShowNewPatientForm(false)
        }
        
        if (!patientToUse) {
          alert('患者を選択してください')
          return
        }
      }

      const appointment = {
        patient_id: editingAppointment ? editingAppointment.patient_id : patientToUse.id,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
        menu2_id: appointmentData.menu2_id || selectedMenu2?.id || '',
        menu3_id: appointmentData.menu3_id || selectedMenu3?.id || '',
        staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
        staff2_id: appointmentData.staff2_id,
        staff3_id: appointmentData.staff3_id,
        notes: appointmentData.notes,
        status: editingAppointment ? editingAppointment.status : '予約済み'
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
      
      // 検証OKの場合は保存
      if (editingAppointment && editingAppointment.id) {
        // 既存の予約を更新
        const oldData = {
          start_time: editingAppointment.start_time,
          end_time: editingAppointment.end_time,
          staff1_id: editingAppointment.staff1_id,
          menu1_id: editingAppointment.menu1_id,
          status: editingAppointment.status,
          memo: editingAppointment.memo
        }
        
        await updateAppointment(editingAppointment.id, appointment)
        console.log('既存予約を更新:', editingAppointment.id, appointment)
        
        // 予約変更ログを記録
        try {
          await logAppointmentChange(
            editingAppointment.id,
            editingAppointment.patient_id,
            oldData,
            appointment,
            'system', // 実際の実装では現在のスタッフIDを取得
            '予約情報を更新しました'
          )
        } catch (error) {
          console.error('予約変更ログの記録に失敗:', error)
          // ログ記録の失敗は予約操作を止めない
        }
      } else {
        // 新規予約を作成
        const newAppointmentId = await onSave(appointment)
        
        // 新規予約作成ログを記録
        if (newAppointmentId) {
          try {
            await logAppointmentCreation(
              newAppointmentId,
              patientToUse.id,
              appointment,
              'system' // 実際の実装では現在のスタッフIDを取得
            )
          } catch (error) {
            console.error('予約作成ログの記録に失敗:', error)
            // ログ記録の失敗は予約操作を止めない
          }
        } else {
          console.warn('予約IDが取得できなかったため、ログを作成できませんでした')
        }
      }
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
        if (editingAppointment && editingAppointment.id) {
          // 既存の予約を更新
          const oldData = {
            start_time: editingAppointment.start_time,
            end_time: editingAppointment.end_time,
            staff1_id: editingAppointment.staff1_id,
            menu1_id: editingAppointment.menu1_id,
            status: editingAppointment.status,
            memo: editingAppointment.memo
          }
          
          await updateAppointment(editingAppointment.id, pendingAppointmentData)
          console.log('既存予約を更新（警告後）:', editingAppointment.id, pendingAppointmentData)
          
          // 予約変更ログを記録
          try {
            await logAppointmentChange(
              editingAppointment.id,
              editingAppointment.patient_id,
              oldData,
              pendingAppointmentData,
              'system',
              '予約情報を更新しました（警告後）'
            )
          } catch (error) {
            console.error('予約変更ログの記録に失敗:', error)
          }
        } else {
          // 新規予約を作成
          const newAppointmentId = await onSave(pendingAppointmentData)
          
          // 新規予約作成ログを記録
          if (newAppointmentId) {
            try {
              await logAppointmentCreation(
                newAppointmentId,
                selectedPatient?.id || '',
                pendingAppointmentData,
                'system'
              )
            } catch (error) {
              console.error('予約作成ログの記録に失敗:', error)
            }
          } else {
            console.warn('予約IDが取得できなかったため、ログを作成できませんでした（警告後）')
          }
        }
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 h-[750px] overflow-hidden">
        {/* コンテンツ */}
        <div className="p-6 h-full flex flex-col">
          {/* 閉じるボタン */}
          <div className="flex justify-end mb-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-1 min-h-0">
            {/* 左カラム: 患者情報と予約履歴 */}
            <div className="w-1/2 pr-6 border-r border-gray-200 flex flex-col min-h-0">
              {/* 患者情報 */}
              <div className="mb-6 flex-shrink-0">
                
                  {/* 患者検索 */}
                <div className="mb-4">
                  {/* 既存予約編集時は患者検索を非表示 */}
                  {!editingAppointment && !showNewPatientForm && (
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
                  {!editingAppointment && searchResults.length > 0 && (
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
                    <div className="p-4 border border-gray-100 rounded-md bg-blue-50">
                      {/* 患者名（本登録済みの場合のみクリック可能） */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          {selectedPatient.is_registered ? (
                            <Link href={`/patients/${selectedPatient.id}`} className="flex-1">
                              <div className="w-full p-3 text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-blue-300 cursor-pointer transition-colors">
                                {`${selectedPatient.last_name} ${selectedPatient.first_name}${(selectedPatient.last_name_kana || selectedPatient.first_name_kana) ? ` (${selectedPatient.last_name_kana} ${selectedPatient.first_name_kana})` : ''}`}
                              </div>
                            </Link>
                          ) : (
                            <div className="flex-1">
                              <div className="w-full p-3 text-lg font-medium text-gray-900 bg-white border border-gray-300 rounded-md">
                                {`${selectedPatient.last_name} ${selectedPatient.first_name}${(selectedPatient.last_name_kana || selectedPatient.first_name_kana) ? ` (${selectedPatient.last_name_kana} ${selectedPatient.first_name_kana})` : ''}`}
                              </div>
                            </div>
                          )}
                          {!selectedPatient.is_registered && (
                            <Button 
                              onClick={() => setShowRegistrationModal(true)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-200 h-10 px-3"
                            >
                              本登録
                            </Button>
                          )}
                        </div>
                        {selectedPatient.is_registered && (
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => setShowPatientEditModal(true)}
                              variant="ghost" 
                              size="sm" 
                              className="p-1"
                              title="患者情報を編集"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* 患者詳細情報 */}
                      <div className="text-sm text-gray-600 mb-2 flex flex-wrap gap-1">
                        {/* 本登録済みの患者のみIDを表示 */}
                        {selectedPatient.is_registered && selectedPatient.patient_number && (
                          <div className="bg-gray-100 px-2 py-1 rounded">
                            ID: {selectedPatient.patient_number}
                          </div>
                        )}
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          年齢: {selectedPatient.birth_date ? `${new Date().getFullYear() - new Date(selectedPatient.birth_date).getFullYear()}歳` : '--歳'}
                        </div>
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          生年月日: {selectedPatient.birth_date ? selectedPatient.birth_date.replace(/-/g, '/') : '--'}
                        </div>
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          性別: {selectedPatient.gender === 'male' ? '男性' : selectedPatient.gender === 'female' ? '女性' : '--'}
                        </div>
                        {/* 仮登録の場合はステータスを表示 */}
                        {!selectedPatient.is_registered && (
                          <div className="bg-yellow-100 px-2 py-1 rounded text-yellow-800">
                            仮登録
                          </div>
                        )}
                      </div>
                      
                      {/* 電話番号とアイコン */}
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded flex items-center w-fit">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>電話: {selectedPatient.phone}</span>
                        </div>
                        
                        {/* 患者の特記事項アイコン */}
                        {(() => {
                          // ローカルストレージから患者のアイコンIDを取得
                          const patientIconsData = localStorage.getItem(`patient_icons_${selectedPatient.id}`)
                          if (!patientIconsData) return null
                          
                          try {
                            const iconIds: string[] = JSON.parse(patientIconsData)
                            if (iconIds.length === 0) return null
                            
                            return (
                              <div className="flex items-center gap-1 flex-wrap">
                                {iconIds.map(iconId => {
                                  const iconData = PATIENT_ICONS.find(i => i.id === iconId)
                                  if (!iconData) return null
                                  const IconComponent = iconData.icon
                                  return (
                                    <div
                                      key={iconId}
                                      title={iconData.title}
                                    >
                                      <IconComponent className="w-4 h-4 text-gray-700" />
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          } catch (e) {
                            return null
                          }
                        })()}
                      </div>
                      
                    </div>
                  ) : null}

                  {/* 新規患者フォーム */}
                  {showNewPatientForm && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-3">
                      <div className="text-sm font-medium mb-3">新規患者登録</div>
                      <div className="space-y-3">
                        {/* 1行目: 名前 */}
                        <Input
                          placeholder="名前"
                          value={`${newPatientData.last_name} ${newPatientData.first_name}`.trim()}
                          onChange={(e) => {
                            const fullName = e.target.value
                            const nameParts = fullName.split(' ')
                            const lastName = nameParts[0] || ''
                            const firstName = nameParts.slice(1).join(' ') || ''
                            setNewPatientData(prev => ({ 
                              ...prev, 
                              last_name: lastName,
                              first_name: firstName
                            }))
                          }}
                          className="text-sm h-10"
                        />
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

              {/* 予約履歴 - 患者情報のすぐ下に配置 */}
              <div className="mt-1 flex-1 flex flex-col bg-gray-50 border border-gray-100 rounded-md p-4 min-h-0">
                <h3 className="text-base font-medium mb-4 flex-shrink-0">予約履歴</h3>
                <div className="border border-gray-200 rounded-md flex-1 flex flex-col bg-white min-h-0">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-shrink-0">
                    <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
                      <div>予約日時</div>
                      <div>担当</div>
                      <div>メニュー</div>
                      <div>キャンセル</div>
                    </div>
                  </div>
                  <div 
                    className="divide-y divide-gray-200 flex-1 overflow-y-auto min-h-0"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#d1d5db #f3f4f6'
                    }}
                  >
                    {selectedPatient ? (
                      patientAppointments.length > 0 ? (
                        patientAppointments
                          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()) // 新しい順にソート
                          .map((appointment, index) => {
                            const appointmentDate = new Date(appointment.appointment_date)
                            const formattedDate = format(appointmentDate, 'yyyy/MM/dd(E)', { locale: ja })
                            const staffName = (appointment as any).staff1?.name || (appointment as any).staff2?.name || (appointment as any).staff3?.name || '未設定'
                            const menuName = (appointment as any).menu1?.name || (appointment as any).menu2?.name || (appointment as any).menu3?.name || '診療メニュー'
                            const hasStaff = staffName !== '未設定'
                            
                            return (
                              <div key={appointment.id || index} className="px-4 py-3">
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div className="text-gray-900">
                                    {formattedDate} {appointment.start_time}
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
                                  <div className="text-gray-500">
                                    -
                                  </div>
                                </div>
                              </div>
                            )
                          })
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          予約履歴がありません
                        </div>
                      )
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        患者を選択すると予約履歴が表示されます
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 右カラム: タブ付き予約設定 */}
            <div className="w-1/2 pl-6 flex flex-col min-h-0">
              {/* タブヘッダー */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('appointment')}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'appointment'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  予約日時
                </button>
                <button
                  onClick={() => setActiveTab('subkarte')}
                  disabled={!selectedPatient || !selectedPatient.is_registered}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'subkarte'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : selectedPatient && selectedPatient.is_registered
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  サブカルテ
                </button>
              </div>

              {/* タブコンテンツ */}
              {activeTab === 'appointment' ? (
                <div className="space-y-6 flex-1 overflow-y-auto">
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
                    <Select 
                      value={calculateDuration(appointmentData.start_time, appointmentData.end_time).toString()} 
                      onValueChange={(value) => {
                        const duration = Number(value)
                        const startTime = appointmentData.start_time
                        const startMinutes = timeToMinutes(startTime)
                        const endMinutes = startMinutes + duration
                        const endTime = minutesToTime(endMinutes)
                        
                        setAppointmentData(prev => {
                          const updatedData = {
                            ...prev,
                            duration,
                            end_time: endTime
                          }
                          
                          // 既存の予約を編集している場合は即座にカレンダーを更新
                          if (editingAppointment && onUpdate) {
                            onUpdate({
                              ...updatedData,
                              patient_id: editingAppointment.patient_id,
                              menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
                              menu2_id: appointmentData.menu2_id || selectedMenu2?.id || '',
                              menu3_id: appointmentData.menu3_id || selectedMenu3?.id || '',
                              staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
                              staff2_id: appointmentData.staff2_id,
                              staff3_id: appointmentData.staff3_id,
                              notes: appointmentData.notes,
                              status: editingAppointment.status
                            })
                          }
                          
                          return updatedData
                        })
                      }}
                    >
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => {
                          const duration = (i + 1) * timeSlotMinutes
                          return (
                            <SelectItem key={duration} value={duration.toString()}>
                              {duration}
                            </SelectItem>
                          )
                        })}
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
                  <div className="text-gray-600 font-medium">
                    : {selectedMenu1?.name || selectedMenu2?.name || selectedMenu3?.name || '未選択'}
                    {selectedMenu2 && (
                      <span className="ml-1">/{selectedMenu2.name}</span>
                    )}
                    {selectedMenu3 && (
                      <span className="ml-1">/{selectedMenu3.name}</span>
                    )}
                  </div>
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

                {/* ユニット選択 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowUnitModal(true)}
                    className="w-24 h-10 flex items-center justify-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    ユニット
                  </button>
                  {selectedUnit && (
                    <div className="text-gray-600 font-medium">
                      : {selectedUnit.name}
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
                  <Button 
                    variant="outline"
                    onClick={() => {
                      if (editingAppointment && onCopyAppointment) {
                        onCopyAppointment(editingAppointment)
                        onClose()
                      }
                    }}
                    disabled={!editingAppointment}
                  >
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
                
                  {/* 予約キャンセルボタン */}
                  <div className="flex justify-end pt-2">
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setShowCancelModal(true)}
                      disabled={!editingAppointment}
                    >
                      予約キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                /* サブカルテタブ */
                <div className="flex-1 overflow-hidden">
                  {selectedPatient && selectedPatient.is_registered ? (
                    <SubKarteTab patientId={selectedPatient.id} layout="horizontal" />
                  ) : selectedPatient && !selectedPatient.is_registered ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">仮登録の患者です</p>
                        <p className="text-sm">本登録後にサブカルテが利用可能になります</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      患者を選択してください
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 診療メニュー選択モーダル */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowMenuModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-[800px] h-[500px] mx-4 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">診療メニュー選択</h3>
              
              <div className="h-[400px] overflow-y-auto">
                <HierarchicalMenu
                  level1Menus={getMenuLevel1()}
                  level2Menus={treatmentMenus.filter(menu => menu.level === 2)}
                  level3Menus={treatmentMenus.filter(menu => menu.level === 3)}
                  selectedMenu1={selectedMenu1}
                  selectedMenu2={selectedMenu2}
                  selectedMenu3={selectedMenu3}
                  onMenu1Select={(menu) => {
                    setSelectedMenu1(menu)
                    setSelectedMenu2(null)
                    setSelectedMenu3(null)
                    setAppointmentData(prev => ({
                      ...prev,
                      menu1_id: menu.id,
                      menu2_id: '',
                      menu3_id: ''
                    }))
                    // 診療メニュー1を選択した場合は、サブメニューが表示されるまで少し待ってからモーダルを閉じる
                    setTimeout(() => {
                      setShowMenuModal(false)
                    }, 500)
                  }}
                  onMenu2Select={(menu) => {
                    setSelectedMenu2(menu)
                    setSelectedMenu3(null)
                    setAppointmentData(prev => ({
                      ...prev,
                      menu2_id: menu.id,
                      menu3_id: ''
                    }))
                    // 診療メニュー2を選択した場合はモーダルを閉じる
                    setTimeout(() => {
                      setShowMenuModal(false)
                    }, 300)
                  }}
                  onMenu3Select={(menu) => {
                    setSelectedMenu3(menu)
                    setAppointmentData(prev => ({
                      ...prev,
                      menu3_id: menu.id
                    }))
                    // 診療メニュー3を選択した場合はモーダルを閉じる
                    setTimeout(() => {
                      setShowMenuModal(false)
                    }, 300)
                  }}
                />
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
              
              <div className="space-y-4">
                {(() => {
                  // スタッフを役職ごとにグループ化
                  const groupedStaff = staff.reduce((groups, member) => {
                    const positionName = typeof member.position === 'object' 
                      ? member.position?.name || '未設定' 
                      : member.position || '未設定'
                    
                    if (!groups[positionName]) {
                      groups[positionName] = []
                    }
                    groups[positionName].push(member)
                    return groups
                  }, {} as Record<string, typeof staff>)

                  return Object.entries(groupedStaff).map(([positionName, members]) => (
                    <div key={positionName} className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                        {positionName}
                      </div>
                      <div className="space-y-2 ml-2">
                        {members.map((member) => (
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
                              {member.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                })()}
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

    {/* キャンセル理由選択モーダル */}
    {editingAppointment && (
      <CancelReasonModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        appointmentId={editingAppointment.id}
        patientName={selectedPatient ? `${selectedPatient.last_name} ${selectedPatient.first_name}` : '患者情報なし'}
        appointmentTime={`${appointmentData.start_time} - ${appointmentData.end_time}`}
        onCancelSuccess={() => {
          setShowCancelModal(false)
          onClose()
          // キャンセル成功後にカレンダーを再読み込み
          onAppointmentCancel?.()
        }}
      />
    )}

    {/* 本登録モーダル */}
    {showRegistrationModal && selectedPatient && (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">本登録</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowRegistrationModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 患者情報 */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">患者情報</h3>
              <p className="text-lg font-medium">
                {selectedPatient.last_name} {selectedPatient.first_name}
              </p>
              <p className="text-sm text-gray-600">
                {selectedPatient.phone}
              </p>
            </div>

            {/* 連携選択 */}
            {registrationStep === 'select' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">連携する情報を選択してください</h3>
                
                <Button
                  onClick={() => {
                    console.log('問診票選択ボタンクリック')
                    setRegistrationStep('questionnaire')
                    fetchUnlinkedQuestionnaires()
                  }}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-3"
                >
                  <FileText className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">問診票を連携</div>
                    <div className="text-sm opacity-90">患者の問診票を選択して連携</div>
                  </div>
                </Button>

                <Button
                  onClick={() => setRegistrationStep('insurance')}
                  className="w-full h-16 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-3"
                >
                  <CreditCard className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-medium">保険証を連携</div>
                    <div className="text-sm opacity-90">保険証をスキャンして情報を取得</div>
                  </div>
                </Button>
              </div>
            )}

            {/* 問診票選択 */}
            {registrationStep === 'questionnaire' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegistrationStep('select')}
                  >
                    ← 戻る
                  </Button>
                  <h3 className="text-lg font-medium text-gray-900">問診票を選択</h3>
                </div>
                
                {loadingQuestionnaires ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">問診票を読み込み中...</p>
                  </div>
                ) : unlinkedQuestionnaires.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>未連携の問診票がありません</p>
                    <p className="text-sm">患者が問診票を提出していません</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {unlinkedQuestionnaires.map((response) => {
                      const responseData = response.response_data
                      const name = responseData.patient_name || responseData['q1-1'] || '名前不明'
                      const phone = responseData.patient_phone || responseData['q1-10'] || ''
                      const completedDate = response.completed_at ? 
                        new Date(response.completed_at).toLocaleDateString('ja-JP') : '不明'
                      
                      return (
                        <div
                          key={response.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedQuestionnaireId === response.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedQuestionnaireId(response.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-gray-900">
                                  {name || '名前不明'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                電話: {phone || '未記入'}
                              </p>
                              <p className="text-xs text-gray-500">
                                回答日: {completedDate}
                              </p>
                            </div>
                            <div className="ml-4">
                              {selectedQuestionnaireId === response.id && (
                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 保険証スキャン */}
            {registrationStep === 'insurance' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRegistrationStep('select')}
                  >
                    ← 戻る
                  </Button>
                  <h3 className="text-lg font-medium text-gray-900">保険証をスキャン</h3>
                </div>
                
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>保険証スキャン機能は開発中です</p>
                  <p className="text-sm">保険証リーダーとの連携を準備中</p>
                </div>
              </div>
            )}

            {/* フッター */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowRegistrationModal(false)}
              >
                キャンセル
              </Button>
              {registrationStep === 'questionnaire' && selectedQuestionnaireId && (
                <Button
                  onClick={linkQuestionnaireToPatient}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  問診票を紐付け
                </Button>
              )}
              {registrationStep === 'insurance' && (
                <Button
                  onClick={() => {
                    // TODO: 保険証OCR処理
                    alert('保険証機能は開発中です')
                    setShowRegistrationModal(false)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  保険証を読み取り
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ユニット選択モーダル */}
    {showUnitModal && (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">ユニット選択</h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {allUnits.filter(unit => unit.is_active).map((unit) => {
                const isAvailable = availableUnits.some(availableUnit => availableUnit.id === unit.id)
                
                return (
                  <button
                    key={unit.id}
                    onClick={() => handleUnitSelect(unit)}
                    disabled={!isAvailable}
                    className={`w-full p-3 text-left border rounded-lg transition-colors ${
                      selectedUnit?.id === unit.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : isAvailable
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="font-medium">{unit.name}</div>
                    {!isAvailable && (
                      <div className="text-xs text-gray-400 mt-1">予約済み</div>
                    )}
                  </button>
                )
              })}
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              ※ 予約済みのユニットは選択できません
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 患者基本情報編集モーダル */}
    <PatientEditModal
      isOpen={showPatientEditModal}
      onClose={() => setShowPatientEditModal(false)}
      patient={selectedPatient}
      onSave={(patientData) => {
        console.log('患者情報を更新:', patientData)
        // TODO: 患者情報の更新API呼び出し
        // 選択中の患者情報を更新
        if (selectedPatient) {
          setSelectedPatient({
            ...selectedPatient,
            ...patientData
          })
        }
      }}
    />
  </>
  )
}
