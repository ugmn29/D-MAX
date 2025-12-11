'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
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
  CheckCircle,
  Type,
  Highlighter,
  FileCode,
  Info
} from 'lucide-react'
import { getPatients, createPatient } from '@/lib/api/patients'
import { PatientForm } from '@/components/patients/patient-form'
import { getTreatmentMenus } from '@/lib/api/treatment'
import Link from 'next/link'
import { getStaff } from '@/lib/api/staff'
import { getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { getAppointments, updateAppointment } from '@/lib/api/appointments'
import { getMemoTemplates, MemoTemplate } from '@/lib/api/memo-templates'
import { getUnits, getStaffUnitPriorities, Unit, StaffUnitPriority } from '@/lib/api/units'
import { logAppointmentChange, logAppointmentCreation } from '@/lib/api/appointment-logs'
import { createAutoNotificationsForAppointment } from '@/lib/api/auto-notification'
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
import { PatientNotificationTab } from '@/components/patients/patient-notification-tab'

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
  onJumpToDate?: (date: string) => void // カレンダーの日付を変更するコールバック
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
  onAppointmentCancel,
  onJumpToDate
}: AppointmentEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patientAppointments, setPatientAppointments] = useState<any[]>([])
  
  // タブ管理
  const [activeTab, setActiveTab] = useState<'appointment' | 'subkarte' | 'notifications'>('appointment')

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
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)
  
  // ユニット
  const [localUnits, setLocalUnits] = useState<Unit[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<StaffUnitPriority[]>([])
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])

  // 常に最新のユニットデータを使用（モーダル内で読み込む）
  const allUnits = localUnits
  
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
        menu1_id: null,
        menu2_id: null,
        menu3_id: null,
        staff1_id: null,
        staff2_id: null,
        staff3_id: null,
        memo: ''
      }
    } else {
      // 単一選択の場合は従来通り
      const defaultEndTimeMinutes = timeToMinutes(selectedTime) + timeSlotMinutes
      const defaultEndTime = minutesToTime(defaultEndTimeMinutes)
      
      
      return {
        start_time: selectedTime,
        end_time: defaultEndTime,
        duration: timeSlotMinutes,
        menu1_id: null,
        menu2_id: null,
        menu3_id: null,
        staff1_id: null,
        staff2_id: null,
        staff3_id: null,
        memo: ''
      }
    }
  }, [selectedTimeSlots, timeSlotMinutes, selectedTime])

  // 予約データ
  const [appointmentData, setAppointmentData] = useState(getInitialAppointmentData())
  const memoRef = useRef<HTMLDivElement>(null)

  // メモ欄の書式設定状態
  const [activeTextColor, setActiveTextColor] = useState<string | null>(null)
  const [activeMarkerColor, setActiveMarkerColor] = useState<string | null>(null)

  // メモテンプレート関連
  const [memoTemplates, setMemoTemplates] = useState<MemoTemplate[]>([])
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const savedSelectionRef = useRef<Range | null>(null)

  // メモ欄の内容を初期化
  useEffect(() => {
    if (memoRef.current && isOpen) {
      console.log('メモ欄を初期化:', appointmentData.memo)
      memoRef.current.innerHTML = appointmentData.memo || ''
    }
  }, [appointmentData.memo, isOpen])

  // 警告モーダル関連の状態
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [timeValidation, setTimeValidation] = useState<TimeValidationResult | null>(null)
  const [pendingAppointmentData, setPendingAppointmentData] = useState<any>(null)

  // キャンセルモーダル関連の状態
  const [showCancelModal, setShowCancelModal] = useState(false)

  // メモ全文表示ポップアップ関連の状態
  const [showMemoPopup, setShowMemoPopup] = useState(false)
  const [selectedMemo, setSelectedMemo] = useState<string>('')
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })

  // 本登録モーダル関連の状態
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [useQuestionnaire, setUseQuestionnaire] = useState(true) // 問診票利用設定（初期値true、後でlocalStorageから読み込む）
  const [registrationTab, setRegistrationTab] = useState<'questionnaire' | 'manual'>('questionnaire')
  const [unlinkedQuestionnaires, setUnlinkedQuestionnaires] = useState<QuestionnaireResponse[]>([])
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null)
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false)

  // 問診票利用設定をlocalStorageから読み込む
  useEffect(() => {
    const storedSetting = localStorage.getItem('useQuestionnaire')
    if (storedSetting !== null) {
      const parsedSetting = JSON.parse(storedSetting)
      console.log('問診票利用設定をlocalStorageから読み込み:', parsedSetting)
      setUseQuestionnaire(parsedSetting)
    }
  }, [])

  // 患者データを問診表情報と統合して取得
  const fetchPatientWithQuestionnaireData = async (patientId: string) => {
    if (!clinicId) return null

    try {
      const { getPatientById } = await import('@/lib/api/patients')
      const patientData = await getPatientById(clinicId, patientId)

      if (!patientData) return null

      // 問診票の情報を取得して統合
      try {
        const { getLinkedQuestionnaireResponses, getQuestionnaires } = await import('@/lib/api/questionnaires')
        const questionnaireResponses = await getLinkedQuestionnaireResponses(patientId)

        if (questionnaireResponses && questionnaireResponses.length > 0) {
          const latestResponse = questionnaireResponses[0]
          const responseData = latestResponse.response_data
          const questionnaireId = latestResponse.questionnaire_id

          // 問診票の定義を取得
          const questionnaires = await getQuestionnaires(clinicId)
          const questionnaire = questionnaires.find(q => q.id === questionnaireId)

          if (questionnaire && questionnaire.questions) {
            // linked_fieldに基づいて患者情報を抽出
            questionnaire.questions.forEach((question: any) => {
              const questionId = question.id
              const linkedField = question.linked_field
              const answer = responseData[questionId]

              if (linkedField && answer !== undefined && answer !== null && answer !== '') {
                switch (linkedField) {
                  case 'birth_date':
                    if (!patientData.birth_date) patientData.birth_date = answer
                    break
                  case 'gender':
                    if (!patientData.gender) {
                      let genderValue = answer
                      if (genderValue === '男' || genderValue === '男性' || genderValue === 'male') {
                        genderValue = 'male'
                      } else if (genderValue === '女' || genderValue === '女性' || genderValue === 'female') {
                        genderValue = 'female'
                      } else {
                        genderValue = 'other'
                      }
                      patientData.gender = genderValue
                    }
                    break
                  case 'phone':
                    if (!patientData.phone) patientData.phone = answer
                    break
                  case 'email':
                    if (!patientData.email) patientData.email = answer
                    break
                  case 'address':
                    if (!patientData.address) {
                      const postalCode = (patientData as any).postal_code || ''
                      const fullAddress = postalCode ? `${postalCode} ${answer}` : answer
                      patientData.address = fullAddress
                    }
                    break
                  case 'referral_source':
                    if (!(patientData as any).visit_reason) {
                      if (Array.isArray(answer)) {
                        (patientData as any).visit_reason = answer.join('、')
                      } else {
                        (patientData as any).visit_reason = answer
                      }
                    }
                    break
                  case 'preferred_contact_method':
                    if (!(patientData as any).preferred_contact_method) {
                      let contactMethod = Array.isArray(answer) ? answer[0] : answer
                      if (contactMethod === 'LINE' || contactMethod === 'line') {
                        contactMethod = 'line'
                      } else if (contactMethod === 'メール' || contactMethod === 'Email' || contactMethod === 'email') {
                        contactMethod = 'email'
                      } else if (contactMethod === 'SMS' || contactMethod === 'sms') {
                        contactMethod = 'sms'
                      }
                      (patientData as any).preferred_contact_method = contactMethod
                    }
                    break
                  case 'allergies':
                    if (!patientData.allergies) {
                      if (Array.isArray(answer)) {
                        patientData.allergies = answer.join(', ')
                      } else if (answer === 'ない' || answer === 'なし') {
                        patientData.allergies = 'なし'
                      } else {
                        patientData.allergies = answer
                      }
                    }
                    break
                  case 'medical_history':
                    if (!patientData.medical_history) {
                      if (Array.isArray(answer)) {
                        patientData.medical_history = answer.join('、')
                      } else if (answer === 'ない' || answer === 'なし') {
                        patientData.medical_history = 'なし'
                      } else {
                        patientData.medical_history = answer
                      }
                    }
                    break
                  case 'medications':
                    if (!(patientData as any).medications) {
                      if (Array.isArray(answer)) {
                        (patientData as any).medications = answer.join('、')
                      } else if (answer === 'ない' || answer === 'なし') {
                        (patientData as any).medications = 'なし'
                      } else {
                        (patientData as any).medications = answer
                      }
                    }
                    break
                }
              }
            })
          }
        }
      } catch (error) {
        console.log('問診票の情報取得エラー（無視）:', error)
      }

      // 患者アイコンも取得して統合
      try {
        const { getPatientIcons } = await import('@/lib/api/patient-icons')
        const patientIconsData = await getPatientIcons(patientId, clinicId)
        if (patientIconsData?.icon_ids) {
          (patientData as any).icon_ids = patientIconsData.icon_ids
          console.log('患者アイコンを取得:', patientIconsData.icon_ids)
        }
      } catch (error) {
        console.log('患者アイコンの取得エラー（無視）:', error)
      }

      return patientData
    } catch (error) {
      console.error('患者データ取得エラー:', error)
      return null
    }
  }

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
    if (!selectedQuestionnaireId || !selectedPatient) {
      return
    }

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
      
      // 🔧 FIX: 問診票を先に連携して元のデータを保存
      // データベースの患者情報を更新する前に、元のデータを問診票に保存する必要がある
      console.log('🔧 問診票連携を先に実行（元データ保存のため）')
      await linkQuestionnaireResponseToPatient(
        selectedQuestionnaireId,
        selectedPatient.id,
        editingAppointment?.id
      )

      // 問診票から性別・名前を含む全データを再取得
      const { getPatients } = await import('@/lib/api/patients')
      const updatedPatients = await getPatients(clinicId)
      const linkedPatient = updatedPatients.find(p => p.id === selectedPatient.id)

      console.log('🔍 問診票連携後の患者データ:', {
        linkedPatient_last_name: linkedPatient?.last_name,
        linkedPatient_first_name: linkedPatient?.first_name,
        linkedPatient_gender: linkedPatient?.gender,
        linkedPatient_patient_number: linkedPatient?.patient_number,
        responseData_name: responseData.patient_name || responseData['q1-1'],
        lastName_variable: lastName,
        firstName_variable: firstName
      })

      // 問診票連携で更新された性別を使用（フォールバック付き）
      let genderValue: 'male' | 'female' | 'other' = linkedPatient?.gender || 'other'
      if (gender === '男' || gender === 'male') {
        genderValue = 'male'
      } else if (gender === '女' || gender === 'female') {
        genderValue = 'female'
      }

      // 患者情報を更新（問診票連携で既に更新されたデータを優先）
      const updatedPatient = {
        ...selectedPatient,
        last_name: linkedPatient?.last_name || lastName,
        first_name: linkedPatient?.first_name || firstName,
        last_name_kana: linkedPatient?.last_name_kana || lastNameKana,
        first_name_kana: linkedPatient?.first_name_kana || firstNameKana,
        gender: linkedPatient?.gender || genderValue,  // 問診票の性別を優先
        birth_date: linkedPatient?.birth_date || birthDate,
        phone: linkedPatient?.phone || phone,
        email: linkedPatient?.email || email,
        is_registered: true // 本登録済みに更新
      }

      // 患者情報を更新
      try {
        if (MOCK_MODE) {
          // 本登録時にIDを割り振る（既に患者番号がある場合はそれを使う）
          const { generatePatientNumber } = await import('@/lib/api/patients')
          const patientNumber = linkedPatient?.patient_number || selectedPatient.patient_number || await generatePatientNumber(clinicId)

          // モックモードではlocalStorageに保存
          const { updateMockPatient, getMockPatients } = await import('@/lib/utils/mock-mode')

          // 更新前の患者データを確認
          const beforePatients = getMockPatients()
          console.log('本登録前の患者一覧:', beforePatients.map(p => ({ id: p.id, name: `${p.last_name} ${p.first_name}`, is_registered: p.is_registered })))
          console.log('更新対象の患者ID:', selectedPatient.id)

          // 更新データを構築（問診票連携で既に更新されたデータを優先）
          const updateData: any = {
            last_name: linkedPatient?.last_name || lastName,
            first_name: linkedPatient?.first_name || firstName,
            last_name_kana: linkedPatient?.last_name_kana || lastNameKana,
            first_name_kana: linkedPatient?.first_name_kana || firstNameKana,
            gender: linkedPatient?.gender || genderValue || null,
            birth_date: linkedPatient?.birth_date || birthDate || null,
            phone: linkedPatient?.phone || phone || null,
            email: linkedPatient?.email || email || null,
            is_registered: true
          }

          // patient_numberが未設定の場合のみ追加（問診票連携で既に設定済みかチェック）
          if (!linkedPatient?.patient_number && !selectedPatient.patient_number) {
            updateData.patient_number = patientNumber
          }

          const updated = updateMockPatient(selectedPatient.id, updateData)

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
          // 本登録時にIDを割り振る（既に患者番号がある場合はそれを使う）
          const { generatePatientNumber } = await import('@/lib/api/patients')
          const patientNumber = linkedPatient?.patient_number || selectedPatient.patient_number || await generatePatientNumber(clinicId)

          // 本番モードではデータベースに保存
          const { updatePatient } = await import('@/lib/api/patients')

          // 更新データを構築（問診票連携で既に更新されたデータを優先）
          const updateData: any = {
            last_name: linkedPatient?.last_name || lastName,
            first_name: linkedPatient?.first_name || firstName,
            last_name_kana: linkedPatient?.last_name_kana || lastNameKana,
            first_name_kana: linkedPatient?.first_name_kana || firstNameKana,
            gender: linkedPatient?.gender || genderValue || null,
            birth_date: linkedPatient?.birth_date || birthDate || null,
            phone: linkedPatient?.phone || phone || null,
            email: linkedPatient?.email || email || null,
            is_registered: true
          }

          // patient_numberが未設定の場合のみ追加（問診票連携で既に設定済みかチェック）
          if (!linkedPatient?.patient_number && !selectedPatient.patient_number) {
            updateData.patient_number = patientNumber
          }

          const updated = await updatePatient(clinicId, selectedPatient.id, updateData)

          // 状態も更新
          setSelectedPatient(updated)
        }
      } catch (error) {
        console.error('患者情報の更新エラー:', error)
        alert('患者情報の更新に失敗しました')
        return
      }

      // 患者情報を再取得して表示を更新
      let finalPatient = selectedPatient
      try {
        const { getPatients } = await import('@/lib/api/patients')
        const updatedPatients = await getPatients(clinicId)
        const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id)
        if (updatedPatient) {
          console.log('問診票連携後の患者情報:', {
            id: updatedPatient.id,
            name: `${updatedPatient.last_name} ${updatedPatient.first_name}`,
            is_registered: updatedPatient.is_registered,
            patient_number: updatedPatient.patient_number
          })
          setSelectedPatient(updatedPatient)
          finalPatient = updatedPatient

          // 強制的にコンポーネントを再レンダリング
          setTimeout(() => {
            // 状態を強制的に更新
            setSelectedPatient({ ...updatedPatient })
          }, 100)
        }
      } catch (error) {
        console.error('患者情報の再取得エラー:', error)
      }

      // 予約データも更新して患者情報を反映
      if (editingAppointment && finalPatient) {
        try {
          const { updateAppointment } = await import('@/lib/api/appointments')
          await updateAppointment(editingAppointment.id, {
            patient_id: finalPatient.id
          })
          console.log('予約データに患者情報を反映しました')
        } catch (error) {
          console.error('予約データの更新エラー:', error)
        }
      }

      // 最新の患者情報を取得してselectedPatientを更新
      try {
        const { getPatients } = await import('@/lib/api/patients')
        const updatedPatients = await getPatients(clinicId)
        const updatedPatient = updatedPatients.find(p => p.id === selectedPatient.id)

        if (updatedPatient) {
          // 患者アイコン情報も取得
          const { getPatientIcons } = await import('@/lib/api/patient-icons')
          const patientIconsData = await getPatientIcons(updatedPatient.id, clinicId)

          setSelectedPatient({
            ...updatedPatient,
            icon_ids: patientIconsData?.icon_ids || []
          } as any)
          console.log('問診票連携完了: 患者情報を更新しました', {
            id: updatedPatient.id,
            is_registered: updatedPatient.is_registered,
            patient_number: updatedPatient.patient_number,
            birth_date: updatedPatient.birth_date,
            gender: updatedPatient.gender
          })
        }
      } catch (error) {
        console.error('患者情報の再取得エラー:', error)
        // このエラーは致命的ではないので、処理を続行
      }

      // 未連携問診票リストを再取得して表示を更新
      try {
        const { getUnlinkedQuestionnaireResponses } = await import('@/lib/api/questionnaires')
        const updatedUnlinkedQuestionnaires = await getUnlinkedQuestionnaireResponses(clinicId)
        setUnlinkedQuestionnaires(updatedUnlinkedQuestionnaires)
        console.log('未連携問診票リストを更新しました:', {
          連携前: unlinkedQuestionnaires.length,
          連携後: updatedUnlinkedQuestionnaires.length
        })
      } catch (error) {
        console.error('未連携問診票リストの再取得エラー:', error)
        // このエラーは致命的ではないので、処理を続行
      }

      // onSaveコールバックを呼び出して親コンポーネントを更新
      if (onSave) {
        onSave()
      }

      // 成功メッセージを最後に表示
      alert('問診票を患者に紐付けました。患者情報が自動更新されました。')
      setShowRegistrationModal(false)
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

      // カレンダーに患者データの更新を通知
      window.dispatchEvent(new CustomEvent('patientDataUpdated', {
        detail: { patientId: selectedPatient.id }
      }))
      console.log('📢 patientDataUpdatedイベントを発行しました')

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
          menu1_id: editingAppointment.menu1_id || null,
          menu2_id: editingAppointment.menu2_id || null,
          menu3_id: editingAppointment.menu3_id || null,
          staff1_id: editingAppointment.staff1_id || null,
          staff2_id: editingAppointment.staff2_id || null,
          staff3_id: editingAppointment.staff3_id || null,
          unit_id: editingAppointment.unit_id || null,
          memo: editingAppointment.memo || ''
        })

        // 既存のユニット情報を設定
        // 1. unit_idがある場合はそれを使用
        if (editingAppointment.unit_id && localUnits.length > 0) {
          const unit = localUnits.find(u => u.id === editingAppointment.unit_id)
          if (unit) {
            setSelectedUnit(unit)
            console.log('既存予約のユニット情報を設定（unit_idから）:', unit)
          }
        }
        // 2. unit_idが無く、selectedUnitIndexが渡されている場合はそれを使用
        else if (selectedUnitIndex !== undefined && localUnits.length > 0 && selectedUnitIndex >= 0 && selectedUnitIndex < localUnits.length) {
          const unit = localUnits[selectedUnitIndex]
          if (unit) {
            setSelectedUnit(unit)
            setAppointmentData(prev => ({
              ...prev,
              unit_id: unit.id
            }))
            console.log('既存予約のユニット情報を設定（selectedUnitIndexから）:', unit)
          }
        }

        // 既存の患者を設定
        console.log('モーダル: editingAppointmentの内容:', editingAppointment)
        console.log('モーダル: editingAppointment.patient:', editingAppointment.patient)
        console.log('モーダル: editingAppointment.patient.icon_ids:', (editingAppointment.patient as any)?.icon_ids)
        console.log('モーダル: editingAppointment.patient_id:', editingAppointment.patient_id)

        if (editingAppointment.patient || editingAppointment.patient_id) {
          // 患者情報を取得（初回のみ、再レンダリングを防ぐため）
          const patientId = editingAppointment.patient?.id || editingAppointment.patient_id

          // 既に同じ患者が選択されている場合はスキップ（無限ループ防止）
          if (selectedPatient?.id !== patientId) {
            console.log('患者情報を設定:', patientId)

            // editingAppointment.patientに既にアイコン情報が含まれているはずなので、それをそのまま使用
            if (editingAppointment.patient) {
              setSelectedPatient(editingAppointment.patient)
              console.log('患者情報を設定（アイコン情報含む）:', {
                id: editingAppointment.patient.id,
                name: `${editingAppointment.patient.last_name} ${editingAppointment.patient.first_name}`,
                icon_ids: (editingAppointment.patient as any)?.icon_ids
              })
            } else if (editingAppointment.patient_id) {
              // patient_idのみの場合は、患者情報を取得
              const fetchPatientInfo = async () => {
                try {
                  console.log('患者情報を取得開始:', patientId)
                  const { getPatients } = await import('@/lib/api/patients')
                  const updatedPatients = await getPatients(clinicId)
                  const patient = updatedPatients.find(p => p.id === patientId)

                  if (patient) {
                    // 患者アイコン情報も取得
                    const { getPatientIcons } = await import('@/lib/api/patient-icons')
                    const patientIconsData = await getPatientIcons(patient.id, clinicId)

                    setSelectedPatient({
                      ...patient,
                      icon_ids: patientIconsData?.icon_ids || []
                    } as any)
                    console.log('患者情報を取得完了（アイコン情報含む）:', {
                      id: patient.id,
                      name: `${patient.last_name} ${patient.first_name}`,
                      icon_ids: patientIconsData?.icon_ids
                    })
                  }
                } catch (error) {
                  console.error('患者情報の取得エラー:', error)
                }
              }
              fetchPatientInfo()
            }
          }
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

        // 既存のスタッフを設定
        const staffIds = [
          editingAppointment.staff1_id,
          editingAppointment.staff2_id,
          editingAppointment.staff3_id
        ].filter(Boolean)

        if (staffIds.length > 0 && staff.length > 0) {
          const staffObjects = staffIds
            .map(staffId => staff.find(s => s.id === staffId))
            .filter((s): s is Staff => s !== undefined)

          if (staffObjects.length > 0) {
            setSelectedStaff(staffObjects)
            console.log('既存のスタッフを設定:', staffObjects)
          }
        } else {
          setSelectedStaff([])
        }
      } else {
        setAppointmentData(getInitialAppointmentData())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingAppointment?.id, editingAppointment?.staff1_id, editingAppointment?.staff2_id, editingAppointment?.staff3_id, staff])

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
          // ユニット優先順位を考慮した自動割り当て
          const autoAssignUnitByPriority = async () => {
            const autoUnit = await getAutoAssignedUnitByPriority(
              selectedUnitMember.id,
              selectedDate,
              selectedTime,
              calculateEndTime(selectedTime, timeSlotMinutes * selectedTimeSlots.length)
            )

            if (autoUnit) {
              setSelectedUnit(autoUnit)
              setAppointmentData(prev => ({
                ...prev,
                unit_id: autoUnit.id
              }))
              console.log('自動選択されたユニット:', autoUnit)

              if (autoUnit.id !== selectedUnitMember.id) {
                // 代替ユニットが選択された場合、ユーザーに通知
                console.log(`選択されたユニット(${selectedUnitMember.name})は埋まっているため、${autoUnit.name}に自動変更されました`)
              }
            } else {
              // すべてのユニットが埋まっている場合でも、選択されたユニットを設定（警告表示）
              setSelectedUnit(selectedUnitMember)
              setAppointmentData(prev => ({
                ...prev,
                unit_id: selectedUnitMember.id
              }))
              console.warn('すべてのユニットが埋まっています。重複予約になる可能性があります。')
            }
          }
          autoAssignUnitByPriority()

          // ユニット選択時にスタッフをクリア（ユニット優先）
          setSelectedStaff([])
        }
      }
      // どちらも選択されていない場合（新規予約で空のセルをクリックした場合のみ）
      else if (!editingAppointment) {
        setSelectedStaff([])
        setSelectedUnit(null)
        setAppointmentData(prev => ({
          ...prev,
          unit_id: ''
        }))
        console.log('担当者とユニットをクリア（空のセル選択）')
      }
      // 既存予約の場合は、既にuseEffectの前半で設定されているのでクリアしない
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedStaffIndex, selectedUnitIndex, selectedDate])

  // スタッフ選択が変更されたときに自動的にユニットを割り当て
  useEffect(() => {
    const autoAssignUnitForSelectedStaff = async () => {
      // 既存予約の場合は自動割り当てをスキップ（既にユニット情報が設定されているため）
      if (editingAppointment) {
        return
      }

      // 条件: スタッフが選択されていて、開始・終了時間が設定されている
      if (selectedStaff.length > 0 && appointmentData.start_time && appointmentData.end_time) {
        const primaryStaff = selectedStaff[0] // 主担当スタッフ（最初のスタッフ）

        try {
          const autoUnit = await getAutoAssignedUnit(
            primaryStaff.id,
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
            console.log('スタッフ選択変更により自動割り当てされたユニット:', {
              staff: primaryStaff.name,
              unit: autoUnit.name,
              priority: 'auto-assigned'
            })
          } else {
            console.log('空いているユニットが見つかりませんでした')
          }
        } catch (error) {
          console.error('自動ユニット割り当てエラー:', error)
        }
      }
    }

    // モーダルが開いている場合のみ実行
    if (isOpen) {
      autoAssignUnitForSelectedStaff()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStaff, appointmentData.start_time, appointmentData.end_time, isOpen])

  // 患者の予約履歴を読み込む関数
  const loadPatientAppointments = async () => {
    if (selectedPatient && isOpen) {
      try {
        console.log('患者の予約履歴を取得:', selectedPatient.id)
        const appointments = await getAppointments(clinicId)
        console.log('取得した全予約:', appointments)

        // 選択された患者の予約のみをフィルタリングし、日時順（最新が上）にソート
        const patientAppointments = appointments
          .filter(apt => apt.patient_id === selectedPatient.id)
          .sort((a, b) => {
            // 日付と時刻を組み合わせて比較
            const dateTimeA = `${a.appointment_date} ${a.start_time}`
            const dateTimeB = `${b.appointment_date} ${b.start_time}`
            // 降順（最新が上）
            return dateTimeB.localeCompare(dateTimeA)
          })
        console.log('患者の予約履歴（日時順）:', patientAppointments)

        setPatientAppointments(patientAppointments)
      } catch (error) {
        console.error('予約履歴の取得エラー:', error)
        setPatientAppointments([])
      }
    } else {
      setPatientAppointments([])
    }
  }

  // 患者が選択された時に予約履歴を取得
  useEffect(() => {
    loadPatientAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatient?.id, isOpen, clinicId])

  // メモテンプレートを取得
  useEffect(() => {
    const loadMemoTemplates = async () => {
      try {
        const templates = await getMemoTemplates(clinicId)
        setMemoTemplates(templates)
      } catch (error) {
        console.error('メモテンプレート取得エラー:', error)
      }
    }

    if (isOpen) {
      loadMemoTemplates()
    }
  }, [clinicId, isOpen])

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
  const handlePatientSelect = async (patient: Patient) => {
    // 患者のアイコン情報をデータベースから取得
    const { getPatientIcons } = await import('@/lib/api/patient-icons')
    try {
      const patientIconsData = await getPatientIcons(patient.id, clinicId)
      const patientWithIcons = {
        ...patient,
        icon_ids: patientIconsData?.icon_ids || []
      } as any
      setSelectedPatient(patientWithIcons)
    } catch (error) {
      console.error('患者アイコン取得エラー:', error)
      setSelectedPatient({
        ...patient,
        icon_ids: []
      } as any)
    }
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

  // 開始時刻と時間（分）から終了時刻を計算
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const start = new Date(`2000-01-01T${startTime}:00`)
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    return end.toTimeString().substring(0, 5)
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

  // ユニット優先順位を考慮した自動割り当て（ユニット直接選択時用）
  const getAutoAssignedUnitByPriority = async (
    requestedUnitId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<Unit | null> => {
    try {
      // 1. 選択されたユニットが空いているかチェック
      const requestedUnit = allUnits.find(u => u.id === requestedUnitId)
      if (requestedUnit) {
        const isAvailable = await checkUnitAvailability(requestedUnitId, date, startTime, endTime)
        if (isAvailable) {
          console.log('選択されたユニットが空いています:', requestedUnit.name)
          return requestedUnit
        }
        console.log('選択されたユニットは埋まっています:', requestedUnit.name)
      }

      // 2. 全ユニットをsort_order順にソート
      const sortedUnits = [...allUnits]
        .filter(u => u.is_active && u.id !== requestedUnitId) // 選択されたユニット以外
        .sort((a, b) => a.sort_order - b.sort_order)

      // 3. 優先順位順に空いているユニットを探す
      for (const unit of sortedUnits) {
        const isAvailable = await checkUnitAvailability(unit.id, date, startTime, endTime)
        if (isAvailable) {
          console.log('代替ユニットを自動割り当て:', unit.name, '(優先順位:', unit.sort_order, ')')
          return unit
        }
      }

      console.log('すべてのユニットが埋まっています')
      return null // すべてのユニットが埋まっている
    } catch (error) {
      console.error('ユニット優先順位による自動割り当てエラー:', error)
      return null
    }
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

  // 本登録モーダルが開いた時の処理
  useEffect(() => {
    if (showRegistrationModal) {
      // 問診票利用ON時は問診票連携タブをデフォルト、OFF時は手動入力タブをデフォルト
      if (useQuestionnaire) {
        setRegistrationTab('questionnaire')
        fetchUnlinkedQuestionnaires()
      } else {
        setRegistrationTab('manual')
      }
    }
  }, [showRegistrationModal, useQuestionnaire])

  // 患者アイコン更新イベントをリッスン
  useEffect(() => {
    const handlePatientIconsUpdated = async (event: any) => {
      console.log('予約編集モーダル: patientIconsUpdatedイベントを受信しました', event.detail)
      const { patientId, iconIds } = event.detail
      // 現在選択中の患者のアイコンが更新された場合、selectedPatientを更新
      if (selectedPatient && selectedPatient.id === patientId) {
        setSelectedPatient({
          ...selectedPatient,
          icon_ids: iconIds
        } as any)
        console.log('患者アイコン更新: 予約編集モーダルの患者情報を更新しました', { patientId, iconIds })
      } else {
        console.log('予約編集モーダル: 患者IDが一致しないためスキップ', { selectedPatientId: selectedPatient?.id, eventPatientId: patientId })
      }
    }

    console.log('予約編集モーダル: patientIconsUpdatedイベントリスナーを登録しました', { selectedPatientId: selectedPatient?.id })
    window.addEventListener('patientIconsUpdated', handlePatientIconsUpdated)
    return () => {
      console.log('予約編集モーダル: patientIconsUpdatedイベントリスナーを削除しました')
      window.removeEventListener('patientIconsUpdated', handlePatientIconsUpdated)
    }
  }, [selectedPatient])

  // 患者データ更新イベントをリッスン
  useEffect(() => {
    const handlePatientDataUpdated = async (event: any) => {
      console.log('予約編集モーダル: patientDataUpdatedイベントを受信しました', event.detail)
      const { patientId, clinicId: eventClinicId } = event.detail
      // 現在選択中の患者のデータが更新された場合、最新データを再取得
      if (selectedPatient && selectedPatient.id === patientId) {
        try {
          const { getPatientById } = await import('@/lib/api/patients')
          const updatedPatient = await getPatientById(eventClinicId || clinicId, patientId)
          if (updatedPatient) {
            setSelectedPatient(updatedPatient)
            console.log('患者データ更新: 予約編集モーダルの患者情報を再取得しました', updatedPatient)
          }
        } catch (error) {
          console.error('予約編集モーダル: 患者データの再取得エラー:', error)
        }
      } else {
        console.log('予約編集モーダル: 患者IDが一致しないためスキップ', { selectedPatientId: selectedPatient?.id, eventPatientId: patientId })
      }
    }

    console.log('予約編集モーダル: patientDataUpdatedイベントリスナーを登録しました', { selectedPatientId: selectedPatient?.id })
    window.addEventListener('patientDataUpdated', handlePatientDataUpdated)
    return () => {
      console.log('予約編集モーダル: patientDataUpdatedイベントリスナーを削除しました')
      window.removeEventListener('patientDataUpdated', handlePatientDataUpdated)
    }
  }, [selectedPatient, clinicId])

  // メニュー選択
  const handleMenu1Select = (menu: TreatmentMenu) => {
    setSelectedMenu1(menu)
    setSelectedMenu2(null)
    setSelectedMenu3(null)
    setAppointmentData(prev => ({
      ...prev,
      menu1_id: menu.id,
      menu2_id: null,
      menu3_id: null
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
      menu3_id: null
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
          menu2_id: appointmentData.menu2_id || selectedMenu2?.id || null,
          menu3_id: appointmentData.menu3_id || selectedMenu3?.id || null,
          staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
          staff2_id: appointmentData.staff2_id,
          staff3_id: appointmentData.staff3_id,
          memo: appointmentData.memo,
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
          menu2_id: appointmentData.menu2_id || selectedMenu2?.id || null,
          menu3_id: appointmentData.menu3_id || selectedMenu3?.id || null,
          staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
          staff2_id: appointmentData.staff2_id,
          staff3_id: appointmentData.staff3_id,
          memo: appointmentData.memo,
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

  // メモテンプレートを挿入
  const insertMemoTemplate = (template: MemoTemplate) => {
    if (memoRef.current) {
      // 保存されたカーソル位置を復元
      if (savedSelectionRef.current) {
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(savedSelectionRef.current.cloneRange())
        }
      }

      // カーソル位置を取得
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)

        // テンプレートテキストをスパンで囲む
        const span = document.createElement('span')
        span.style.color = 'rgb(0, 0, 0)'
        span.textContent = template.name

        // カーソル位置に挿入
        range.deleteContents()
        range.insertNode(span)

        // カーソルを挿入したテキストの後ろに移動
        range.setStartAfter(span)
        range.setEndAfter(span)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // カーソル位置が取得できない場合は末尾に追加
        const currentContent = memoRef.current.innerHTML
        const templateText = `<span style="color: rgb(0, 0, 0);">${template.name}</span>`
        memoRef.current.innerHTML = currentContent + templateText
      }

      // appointmentDataも更新
      setAppointmentData(prev => ({
        ...prev,
        memo: memoRef.current!.innerHTML
      }))

      // フォーカスを戻す
      memoRef.current.focus()
    }

    setShowTemplateDropdown(false)
  }

  // 予約保存
  const handleSave = async () => {
    try {
      setSaving(true)

      // メモ欄の現在の内容を取得（onBlurが発火していない場合に備えて）
      const currentMemo = memoRef.current ? memoRef.current.innerHTML : appointmentData.memo
      console.log('保存時のメモ内容:', { currentMemo, fromRef: memoRef.current?.innerHTML, fromState: appointmentData.memo })

      let patientToUse = selectedPatient

      // 既存の予約を編集する場合は、新規患者作成をスキップ
      if (!editingAppointment) {
        // 新規患者フォームが表示されている場合は、まず患者を作成
        if (showNewPatientForm) {
          // 名前と電話番号の必須チェック（first_nameは任意）
          if (!newPatientData.last_name || !newPatientData.phone) {
            alert('患者の名前と電話番号を入力してください')
            return
          }

          // 新規患者を作成（仮登録時は診察券番号を割り振らない）
          patientToUse = await createPatient(clinicId, {
            ...newPatientData,
            patient_number: '', // 仮登録時は空
            is_registered: false // 仮登録
          })

          setSelectedPatient(patientToUse)
          setShowNewPatientForm(false)
        } else if (selectedPatient) {
          // 既存の患者が選択されている場合
          patientToUse = selectedPatient
        }

        // 患者が選択されていない場合はエラー
        if (!patientToUse) {
          alert('患者を選択するか、新規患者を登録してください')
          return
        }
      }

      const appointment = {
        patient_id: editingAppointment ? editingAppointment.patient_id : patientToUse.id,
        start_time: appointmentData.start_time,
        end_time: appointmentData.end_time,
        menu1_id: appointmentData.menu1_id || (selectedMenu1?.id || 'menu-1'),
        menu2_id: appointmentData.menu2_id || selectedMenu2?.id || null,
        menu3_id: appointmentData.menu3_id || selectedMenu3?.id || null,
        staff1_id: selectedStaff.length > 0 ? selectedStaff[0].id : (appointmentData.staff1_id || 'staff-1'),
        staff2_id: selectedStaff.length > 1 ? selectedStaff[1].id : (appointmentData.staff2_id || null),
        staff3_id: selectedStaff.length > 2 ? selectedStaff[2].id : (appointmentData.staff3_id || null),
        unit_id: selectedUnit?.id || appointmentData.unit_id || null,
        memo: currentMemo,
        status: editingAppointment ? editingAppointment.status : '未来院'
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
        // 既存の予約を更新 - onUpdateを使用してカレンダー側の再読み込みも実行
        console.log('既存予約を更新します:', editingAppointment.id, appointment)
        console.log('更新されたメモ:', appointment.memo)

        // onUpdateを呼び出してカレンダー側で処理
        if (onUpdate) {
          await onUpdate(appointment)
          console.log('onUpdate経由で予約を更新しました')
        } else {
          // onUpdateが提供されていない場合は直接更新（後方互換性のため）
          await updateAppointment(editingAppointment.id, appointment)
          console.log('直接updateAppointmentで予約を更新しました')
        }

        // 予約履歴を再読み込み
        await loadPatientAppointments()
        console.log('予約履歴を再読み込みしました')
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

          // 自動通知スケジュールを作成
          try {
            await createAutoNotificationsForAppointment(
              clinicId,
              patientToUse.id,
              selectedDate, // YYYY-MM-DD形式の予約日
              appointment.start_time
            )
            console.log('自動通知スケジュールを作成しました')
          } catch (error) {
            console.error('自動通知スケジュール作成エラー:', error)
            // 自動通知の失敗は予約操作を止めない
          }
        } else {
          console.warn('予約IDが取得できなかったため、ログを作成できませんでした')
        }
      }
      console.log('予約保存完了、モーダルを閉じます')
      onClose()
    } catch (error: any) {
      console.error('予約保存エラー:', error)
      const errorMessage = error?.message || error?.toString() || '予約の保存に失敗しました'
      alert(`予約の保存に失敗しました\n\nエラー詳細: ${errorMessage}`)
    } finally {
      setSaving(false)
      console.log('saving状態をfalseに設定しました')
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
          // 既存の予約を更新 - onUpdateを使用してカレンダー側の再読み込みも実行
          console.log('既存予約を更新（警告後）:', editingAppointment.id, pendingAppointmentData)

          // onUpdateを呼び出してカレンダー側で処理
          if (onUpdate) {
            await onUpdate(pendingAppointmentData)
            console.log('onUpdate経由で予約を更新しました（警告後）')
          } else {
            // onUpdateが提供されていない場合は直接更新（後方互換性のため）
            await updateAppointment(editingAppointment.id, pendingAppointmentData)
            console.log('直接updateAppointmentで予約を更新しました（警告後）')
          }

          // 予約履歴を再読み込み
          await loadPatientAppointments()
          console.log('予約履歴を再読み込みしました（警告後）')
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

            // 自動通知スケジュールを作成
            try {
              await createAutoNotificationsForAppointment(
                clinicId,
                selectedPatient?.id || '',
                selectedDate,
                pendingAppointmentData.start_time
              )
              console.log('自動通知スケジュールを作成しました（警告後）')
            } catch (error) {
              console.error('自動通知スケジュール作成エラー:', error)
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
      memo: ''
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
                              onClick={async () => {
                                // 問診表データを含めた完全な患者データを取得
                                const fullPatientData = await fetchPatientWithQuestionnaireData(selectedPatient.id)
                                if (fullPatientData) {
                                  setSelectedPatient(fullPatientData)
                                }
                                setShowPatientEditModal(true)
                              }}
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
                        {(selectedPatient as any).icon_ids && (selectedPatient as any).icon_ids.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {(selectedPatient as any).icon_ids.map((iconId: string) => {
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
                        )}
                      </div>
                      
                    </div>
                  ) : null}

                  {/* 新規患者フォーム */}
                  {!editingAppointment && showNewPatientForm && (
                    <div className="p-4 border border-gray-200 rounded-md bg-gray-50 mt-3">
                      <div className="text-sm font-medium mb-3">新規患者登録</div>
                      <div className="space-y-3">
                        {/* 1行目: 名前 */}
                        <Input
                          placeholder="名前（例：福永 真大 または ふくなが）"
                          value={`${newPatientData.last_name}${newPatientData.first_name ? ' ' + newPatientData.first_name : ''}`.trim()}
                          onChange={(e) => {
                            const fullName = e.target.value.trim()
                            if (fullName.includes(' ')) {
                              // スペースがある場合は分割
                              const nameParts = fullName.split(/\s+/)
                              const lastName = nameParts[0] || ''
                              const firstName = nameParts.slice(1).join(' ') || ''
                              setNewPatientData(prev => ({ 
                                ...prev, 
                                last_name: lastName,
                                first_name: firstName
                              }))
                            } else {
                              // スペースがない場合は全体をlast_nameとして扱う
                              setNewPatientData(prev => ({ 
                                ...prev, 
                                last_name: fullName,
                                first_name: ''
                              }))
                            }
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
                    <div className="flex gap-2 text-sm font-medium text-gray-600">
                      <div className="w-[130px]">予約日時</div>
                      <div className="w-[80px]">担当</div>
                      <div className="w-[80px]">メニュー</div>
                      <div className="flex-1">メモ</div>
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
                            const isCancelled = appointment.status === 'キャンセル'

                            // デバッグ用ログ
                            if (index === 0) {
                              console.log('予約履歴の最初の予約:', {
                                id: appointment.id,
                                status: appointment.status,
                                isCancelled,
                                statusType: typeof appointment.status
                              })
                            }

                            return (
                              <div key={appointment.id || index} className="px-4 py-3">
                                <div className="flex gap-2 text-sm">
                                  <div
                                    className="w-[130px] text-gray-900 cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                                    onClick={() => {
                                      if (onJumpToDate) {
                                        onJumpToDate(appointment.appointment_date)
                                        onClose()
                                      }
                                    }}
                                    title="クリックしてカレンダーに移動"
                                  >
                                    <div>{formattedDate}</div>
                                    <div className="flex items-center gap-2">
                                      <span>{appointment.start_time}</span>
                                      {isCancelled && (
                                        <span className="text-red-600" style={{ fontSize: "10px" }}>キャンセル</span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-[80px] overflow-hidden">
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
                                  <div className="w-[80px] text-gray-900 overflow-hidden">
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
                                  <div
                                    className="flex-1 text-gray-500 overflow-hidden cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                                    onMouseEnter={(e) => {
                                      if (appointment.memo && appointment.memo !== '-') {
                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                                        setPopupPosition({
                                          top: rect.top + window.scrollY,
                                          left: rect.right + window.scrollX + 10
                                        })
                                        setSelectedMemo(appointment.memo)
                                        setShowMemoPopup(true)
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      setShowMemoPopup(false)
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                    }}
                                    title={appointment.memo ? "ホバーで全文表示" : ""}
                                  >
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
                                        __html: (appointment.memo || '-')
                                          .replace(/<br\s*\/?>/gi, ' ')
                                          .replace(/<\/div>\s*<div>/gi, '<br><br>')
                                          .replace(/<\/?div>/gi, '')
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
                <button
                  onClick={() => setActiveTab('notifications')}
                  disabled={!selectedPatient || !selectedPatient.is_registered}
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    activeTab === 'notifications'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : selectedPatient && selectedPatient.is_registered
                      ? 'text-gray-500 hover:text-gray-700'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  通知設定
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
                              menu2_id: appointmentData.menu2_id || selectedMenu2?.id || null,
                              menu3_id: appointmentData.menu3_id || selectedMenu3?.id || null,
                              staff1_id: appointmentData.staff1_id || (selectedStaff.length > 0 ? selectedStaff[0].id : 'staff-1'),
                              staff2_id: appointmentData.staff2_id,
                              staff3_id: appointmentData.staff3_id,
                              memo: appointmentData.memo,
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
                    : {(() => {
                      // appointmentDataの状態を優先して表示
                      const menu1 = treatmentMenus.find(m => m.id === appointmentData.menu1_id)
                      const menu2 = treatmentMenus.find(m => m.id === appointmentData.menu2_id)
                      const menu3 = treatmentMenus.find(m => m.id === appointmentData.menu3_id)

                      console.log('診療メニュー表示更新:', {
                        appointmentData: {
                          menu1_id: appointmentData.menu1_id,
                          menu2_id: appointmentData.menu2_id,
                          menu3_id: appointmentData.menu3_id
                        },
                        foundMenus: { menu1, menu2, menu3 },
                        selectedMenus: { selectedMenu1, selectedMenu2, selectedMenu3 }
                      })

                      // メニュー1から順番に表示
                      const displayMenu1 = menu1 || selectedMenu1
                      const displayMenu2 = menu2 || selectedMenu2
                      const displayMenu3 = menu3 || selectedMenu3

                      if (!displayMenu1) {
                        return '未選択'
                      }

                      // メニュー1 / メニュー2 / メニュー3 の形式で表示
                      let displayText = displayMenu1.name
                      if (displayMenu2) {
                        displayText += ` / ${displayMenu2.name}`
                      }
                      if (displayMenu3) {
                        displayText += ` / ${displayMenu3.name}`
                      }

                      return displayText
                    })()}
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
                      : {selectedStaff.map(s => s.name).join(' / ')}
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="notes" className="text-sm font-medium">メモ</Label>
                    <div className="flex gap-0.5">
                      {/* テキスト色 */}
                      <button
                        type="button"
                        className={`h-4 w-4 rounded-full border ${activeTextColor === '#dc2626' ? 'border-red-600 border-2' : 'border-gray-300'} flex items-center justify-center text-red-600 hover:bg-red-50`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const selection = window.getSelection()
                          if (selection && selection.toString().length > 0) {
                            // 選択テキストがある場合は即座に色を適用
                            document.execCommand('styleWithCSS', false, 'true')
                            document.execCommand('foreColor', false, '#dc2626')
                          }
                          if (activeTextColor === '#dc2626') {
                            setActiveTextColor(null)
                          } else {
                            setActiveTextColor('#dc2626')
                          }
                        }}
                        title="赤文字"
                      >
                        <Type className="w-2 h-2" />
                      </button>
                      <button
                        type="button"
                        className={`h-4 w-4 rounded-full border ${activeTextColor === '#2563eb' ? 'border-blue-600 border-2' : 'border-gray-300'} flex items-center justify-center text-blue-600 hover:bg-blue-50`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const selection = window.getSelection()
                          if (selection && selection.toString().length > 0) {
                            // 選択テキストがある場合は即座に色を適用
                            document.execCommand('styleWithCSS', false, 'true')
                            document.execCommand('foreColor', false, '#2563eb')
                          }
                          if (activeTextColor === '#2563eb') {
                            setActiveTextColor(null)
                          } else {
                            setActiveTextColor('#2563eb')
                          }
                        }}
                        title="青文字"
                      >
                        <Type className="w-2 h-2" />
                      </button>
                      {/* マーカー */}
                      <button
                        type="button"
                        className={`h-4 w-4 rounded-full border ${activeMarkerColor === '#fef08a' ? 'border-yellow-600 border-2' : 'border-gray-300'} flex items-center justify-center bg-yellow-200 hover:bg-yellow-300`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const selection = window.getSelection()
                          if (selection && selection.toString().length > 0) {
                            // 選択テキストがある場合は即座にマーカーを適用
                            document.execCommand('styleWithCSS', false, 'true')
                            document.execCommand('backColor', false, '#fef08a')
                          }
                          if (activeMarkerColor === '#fef08a') {
                            setActiveMarkerColor(null)
                          } else {
                            setActiveMarkerColor('#fef08a')
                          }
                        }}
                        title="黄色マーカー"
                      >
                        <Highlighter className="w-2 h-2" />
                      </button>
                      <button
                        type="button"
                        className={`h-4 w-4 rounded-full border ${activeMarkerColor === '#bbf7d0' ? 'border-green-600 border-2' : 'border-gray-300'} flex items-center justify-center bg-green-200 hover:bg-green-300`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const selection = window.getSelection()
                          if (selection && selection.toString().length > 0) {
                            // 選択テキストがある場合は即座にマーカーを適用
                            document.execCommand('styleWithCSS', false, 'true')
                            document.execCommand('backColor', false, '#bbf7d0')
                          }
                          if (activeMarkerColor === '#bbf7d0') {
                            setActiveMarkerColor(null)
                          } else {
                            setActiveMarkerColor('#bbf7d0')
                          }
                        }}
                        title="緑色マーカー"
                      >
                        <Highlighter className="w-2 h-2" />
                      </button>
                      <button
                        type="button"
                        className={`h-4 w-4 rounded-full border ${activeMarkerColor === '#fbcfe8' ? 'border-pink-600 border-2' : 'border-gray-300'} flex items-center justify-center bg-pink-200 hover:bg-pink-300`}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          const selection = window.getSelection()
                          if (selection && selection.toString().length > 0) {
                            // 選択テキストがある場合は即座にマーカーを適用
                            document.execCommand('styleWithCSS', false, 'true')
                            document.execCommand('backColor', false, '#fbcfe8')
                          }
                          if (activeMarkerColor === '#fbcfe8') {
                            setActiveMarkerColor(null)
                          } else {
                            setActiveMarkerColor('#fbcfe8')
                          }
                        }}
                        title="ピンク色マーカー"
                      >
                        <Highlighter className="w-2 h-2" />
                      </button>
                      {/* テンプレートボタン */}
                      <div className="relative ml-1">
                        <button
                          type="button"
                          className="h-4 w-4 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            // カーソル位置を保存
                            const selection = window.getSelection()
                            if (selection && selection.rangeCount > 0) {
                              savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
                            }
                          }}
                          onClick={(e) => {
                            e.preventDefault()
                            setShowTemplateDropdown(!showTemplateDropdown)
                          }}
                          title="テンプレート"
                        >
                          <FileCode className="w-2 h-2" />
                        </button>
                        {/* テンプレートドロップダウン */}
                        {showTemplateDropdown && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <div className="py-1">
                              {memoTemplates.length > 0 ? (
                                memoTemplates.map(template => (
                                  <button
                                    key={template.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => insertMemoTemplate(template)}
                                  >
                                    {template.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">
                                  テンプレートがありません
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    ref={memoRef}
                    id="notes"
                    contentEditable
                    suppressContentEditableWarning
                    onBeforeInput={(e: any) => {
                      // 文字入力時のみ色を適用（削除操作は除外）
                      if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
                        return
                      }

                      // 文字入力時のみ色を適用
                      document.execCommand('styleWithCSS', false, 'true')
                      if (activeTextColor) {
                        document.execCommand('foreColor', false, activeTextColor)
                      } else {
                        document.execCommand('foreColor', false, '#000000')
                      }
                      if (activeMarkerColor) {
                        document.execCommand('backColor', false, activeMarkerColor)
                      } else {
                        document.execCommand('backColor', false, 'transparent')
                      }
                    }}
                    onClick={() => {
                      // カーソル位置を保存
                      const selection = window.getSelection()
                      if (selection && selection.rangeCount > 0) {
                        savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
                      }
                    }}
                    onKeyUp={() => {
                      // キー入力後のカーソル位置を保存（Reactの再レンダリングを避けるためrefのみ更新）
                      const selection = window.getSelection()
                      if (selection && selection.rangeCount > 0) {
                        savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
                      }
                    }}
                    onMouseUp={() => {
                      // テキスト選択時に色を適用
                      const selection = window.getSelection()
                      if (selection && selection.toString().length > 0) {
                        document.execCommand('styleWithCSS', false, 'true')
                        if (activeTextColor) {
                          document.execCommand('foreColor', false, activeTextColor)
                        } else {
                          document.execCommand('foreColor', false, '#000000')
                        }
                        if (activeMarkerColor) {
                          document.execCommand('backColor', false, activeMarkerColor)
                        } else {
                          document.execCommand('backColor', false, 'transparent')
                        }
                      }
                      // カーソル位置を保存
                      if (selection && selection.rangeCount > 0) {
                        savedSelectionRef.current = selection.getRangeAt(0).cloneRange()
                      }
                    }}
                    onBlur={(e) => {
                      const html = e.currentTarget.innerHTML
                      console.log('メモブラー:', html)
                      setAppointmentData(prev => ({ ...prev, memo: html }))
                    }}
                    className="mt-1 min-h-[160px] p-3 border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    style={{ maxHeight: '320px', overflowY: 'auto' }}
                  />
                </div>

                {/* アクションボタン */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowCancelModal(true)}
                    disabled={!editingAppointment}
                  >
                    予約キャンセル
                  </Button>
                  <div className="flex space-x-2">
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
                </div>
                </div>
              ) : activeTab === 'subkarte' ? (
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
              ) : (
                /* 通知設定タブ */
                <div className="flex-1 overflow-hidden">
                  {selectedPatient && selectedPatient.is_registered ? (
                    <PatientNotificationTab patientId={selectedPatient.id} clinicId={clinicId} />
                  ) : selectedPatient && !selectedPatient.is_registered ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <p className="mb-2">仮登録の患者です</p>
                        <p className="text-sm">本登録後に通知設定が利用可能になります</p>
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
                  onMenu1Select={async (menu) => {
                    console.log('診療メニュー1選択:', menu)
                    setSelectedMenu1(menu)
                    setSelectedMenu2(null)
                    setSelectedMenu3(null)
                    const newData = {
                      ...appointmentData,
                      menu1_id: menu.id,
                      menu2_id: null,
                      menu3_id: null
                    }
                    setAppointmentData(newData)
                    console.log('診療メニュー1選択後のappointmentData:', newData)

                    // 既存予約の場合はデータベースに即座に保存
                    if (editingAppointment && onUpdate) {
                      try {
                        console.log('診療メニュー1変更: onUpdateに渡すデータ', newData)
                        await onUpdate(newData)
                        console.log('診療メニュー1変更をデータベースに保存しました')
                      } catch (error) {
                        console.error('診療メニュー1保存エラー:', error)
                        console.error('診療メニュー1保存エラー詳細:', JSON.stringify(error, null, 2))
                      }
                    }

                    // 診療メニュー1を選択した場合は、サブメニューが表示されるまで少し待ってからモーダルを閉じる
                    setTimeout(() => {
                      setShowMenuModal(false)
                    }, 500)
                  }}
                  onMenu2Select={async (menu) => {
                    console.log('診療メニュー2選択:', menu)
                    setSelectedMenu2(menu)
                    setSelectedMenu3(null)

                    // メニュー2の親メニュー（メニュー1）を自動的に取得して設定
                    let parentMenu1 = selectedMenu1
                    if (menu.parent_id) {
                      const foundParent = treatmentMenus.find(m => m.id === menu.parent_id)
                      if (foundParent) {
                        console.log('メニュー2の親メニューを自動設定:', foundParent)
                        parentMenu1 = foundParent
                        setSelectedMenu1(foundParent)
                      }
                    }

                    const newData = {
                      ...appointmentData,
                      menu1_id: parentMenu1?.id || null,
                      menu2_id: menu.id,
                      menu3_id: null
                    }
                    setAppointmentData(newData)
                    console.log('診療メニュー2選択後のappointmentData:', newData)

                    // 既存予約の場合はデータベースに即座に保存
                    if (editingAppointment && onUpdate) {
                      try {
                        await onUpdate(newData)
                        console.log('診療メニュー2変更をデータベースに保存しました')
                      } catch (error) {
                        console.error('診療メニュー2保存エラー:', error)
                      }
                    }

                    // 診療メニュー2を選択した場合はモーダルを閉じる
                    setTimeout(() => {
                      setShowMenuModal(false)
                    }, 300)
                  }}
                  onMenu3Select={async (menu) => {
                    console.log('診療メニュー3選択:', menu)
                    setSelectedMenu3(menu)

                    // メニュー3の親メニュー（メニュー2）とその親（メニュー1）を自動的に取得して設定
                    let parentMenu2 = selectedMenu2
                    let parentMenu1 = selectedMenu1

                    if (menu.parent_id) {
                      const foundParent2 = treatmentMenus.find(m => m.id === menu.parent_id)
                      if (foundParent2) {
                        console.log('メニュー3の親メニュー（メニュー2）を自動設定:', foundParent2)
                        parentMenu2 = foundParent2
                        setSelectedMenu2(foundParent2)

                        // さらにメニュー2の親（メニュー1）も取得
                        if (foundParent2.parent_id) {
                          const foundParent1 = treatmentMenus.find(m => m.id === foundParent2.parent_id)
                          if (foundParent1) {
                            console.log('メニュー3の祖父メニュー（メニュー1）を自動設定:', foundParent1)
                            parentMenu1 = foundParent1
                            setSelectedMenu1(foundParent1)
                          }
                        }
                      }
                    }

                    const newData = {
                      ...appointmentData,
                      menu1_id: parentMenu1?.id || null,
                      menu2_id: parentMenu2?.id || null,
                      menu3_id: menu.id
                    }
                    setAppointmentData(newData)
                    console.log('診療メニュー3選択後のappointmentData:', newData)

                    // 既存予約の場合はデータベースに即座に保存
                    if (editingAppointment && onUpdate) {
                      try {
                        await onUpdate(newData)
                        console.log('診療メニュー3変更をデータベースに保存しました')
                      } catch (error) {
                        console.error('診療メニュー3保存エラー:', error)
                      }
                    }

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
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">担当者選択</h3>
                {selectedStaff.length > 0 && (
                  <div className="text-sm font-medium text-gray-900">
                    {selectedStaff.map(s => s.name).join(' / ')}
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {(() => {
                      // 出勤しているスタッフのみをフィルタリング
                      const workingStaffIds = workingStaff.map(ws => ws.staff.id)
                      const availableStaff = staff.filter(member => workingStaffIds.includes(member.id))

                      if (availableStaff.length === 0) {
                        return (
                          <tr>
                            <td colSpan={2} className="text-center py-8 text-gray-500">
                              <p>出勤しているスタッフがいません</p>
                              <p className="text-sm mt-1">選択可能なスタッフがありません</p>
                            </td>
                          </tr>
                        )
                      }

                      // 出勤しているスタッフを役職ごとにグループ化
                      const groupedStaff = availableStaff.reduce((groups, member) => {
                        const positionName = typeof member.position === 'object'
                          ? member.position?.name || '未設定'
                          : member.position || '未設定'
                        const sortOrder = typeof member.position === 'object'
                          ? member.position?.sort_order ?? 999
                          : 999

                        if (!groups[positionName]) {
                          groups[positionName] = { members: [], sortOrder }
                        }
                        groups[positionName].members.push(member)
                        return groups
                      }, {} as Record<string, { members: typeof availableStaff; sortOrder: number }>)

                      // sort_orderで並び替え
                      const sortedPositions = Object.entries(groupedStaff).sort(([, a], [, b]) => a.sortOrder - b.sortOrder)

                      return sortedPositions.map(([positionName, { members }], index) => (
                        <tr
                          key={positionName}
                          className={index !== sortedPositions.length - 1 ? 'border-b border-gray-200' : ''}
                        >
                          {/* 役職名のセル */}
                          <td
                            className="px-4 py-3 bg-gray-50 border-r border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors w-40"
                            onMouseEnter={() => setHoveredPosition(positionName)}
                            onMouseLeave={() => setHoveredPosition(null)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {positionName}
                              </span>
                              {selectedStaff.some(s => {
                                const staffPositionName = typeof s.position === 'object'
                                  ? s.position?.name || '未設定'
                                  : s.position || '未設定'
                                return staffPositionName === positionName
                              }) && (
                                <span className="text-xs text-blue-600 font-medium">
                                  ({selectedStaff.filter(s => {
                                    const staffPositionName = typeof s.position === 'object'
                                      ? s.position?.name || '未設定'
                                      : s.position || '未設定'
                                    return staffPositionName === positionName
                                  }).length})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* スタッフ名のセル（ホバー時のみ表示） */}
                          <td
                            className="px-4 py-3 bg-white"
                            onMouseEnter={() => setHoveredPosition(positionName)}
                            onMouseLeave={() => setHoveredPosition(null)}
                          >
                            {hoveredPosition === positionName && (
                              <div className="flex flex-col gap-1">
                                {members.map((member) => (
                                  <span
                                    key={member.id}
                                    className={`text-sm cursor-pointer hover:underline ${
                                      selectedStaff.some(s => s.id === member.id)
                                        ? 'text-blue-600 font-medium'
                                        : 'text-gray-700'
                                    }`}
                                    onClick={() => {
                                      if (selectedStaff.some(s => s.id === member.id)) {
                                        setSelectedStaff(prev => prev.filter(s => s.id !== member.id))
                                      } else {
                                        setSelectedStaff(prev => [...prev, member])
                                      }
                                    }}
                                  >
                                    {member.name}
                                    {selectedStaff.some(s => s.id === member.id) && ' ✓'}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
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
        existingMemo={appointmentData.memo}
        appointmentData={editingAppointment}
        onCancelSuccess={async () => {
          setShowCancelModal(false)
          // キャンセル成功後に予約履歴を再読み込み
          await loadPatientAppointments()
          onClose()
          // キャンセル成功後にカレンダーを再読み込み
          onAppointmentCancel?.()
        }}
        onCancelAndReschedule={async (appointment) => {
          setShowCancelModal(false)
          // キャンセル成功後に予約履歴を再読み込み
          await loadPatientAppointments()
          // コピー機能を実行
          if (onCopyAppointment) {
            onCopyAppointment(appointment)
          }
          onClose()
          // カレンダーを再読み込み
          onAppointmentCancel?.()
        }}
      />
    )}

    {/* メモ全文表示ポップアップ */}
    {showMemoPopup && (
      <div
        className="fixed z-[70] bg-white rounded-lg shadow-2xl border border-gray-200 px-3 py-2 overflow-y-auto"
        style={{
          top: `${popupPosition.top}px`,
          left: `${popupPosition.left}px`,
          maxWidth: '280px',
          maxHeight: '200px',
          width: '280px'
        }}
        onMouseEnter={() => setShowMemoPopup(true)}
        onMouseLeave={() => setShowMemoPopup(false)}
      >
        <div
          className="text-gray-700 text-xs leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: selectedMemo
              .replace(/<br\s*\/?>/gi, ' ')
              .replace(/<\/div>\s*<div>/gi, '<br><br>')
              .replace(/<\/?div>/gi, '')
          }}
        />
      </div>
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

            {/* タブバー */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex space-x-1">
                {useQuestionnaire && (
                  <button
                    onClick={() => {
                      setRegistrationTab('questionnaire')
                      fetchUnlinkedQuestionnaires()
                    }}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                      registrationTab === 'questionnaire'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    問診票連携
                  </button>
                )}
                <button
                  onClick={() => setRegistrationTab('manual')}
                  className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                    registrationTab === 'manual'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  手動入力
                </button>
              </div>
            </div>

            {/* 問診票連携タブ */}
            {registrationTab === 'questionnaire' && useQuestionnaire && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">問診票を選択</h3>

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
                      console.log('問診票候補表示:', {
                        response_id: response.id,
                        response_data: responseData,
                        response_data_keys: Object.keys(responseData || {}),
                        patient_name: responseData?.patient_name,
                        q1_1: responseData?.['q1-1'],
                        patient_phone: responseData?.patient_phone,
                        q1_10: responseData?.['q1-10']
                      })
                      const name = responseData?.patient_name || responseData?.['q1-1'] || '名前不明'
                      const phone = responseData?.patient_phone || responseData?.['q1-10'] || ''
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

            {/* 手動入力タブ */}
            {registrationTab === 'manual' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">患者情報を入力</h3>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        患者情報を入力して本登録します。診察券番号は自動で採番されます。
                      </p>
                    </div>
                  </div>
                </div>

                <PatientForm
                  initialData={{
                    last_name: selectedPatient.last_name || '',
                    first_name: selectedPatient.first_name || '',
                    phone: selectedPatient.phone || '',
                    email: selectedPatient.email || '',
                  }}
                  onSubmit={async (formData: any) => {
                    try {
                      const { createPatient } = await import('@/lib/api/patients')
                      const { generatePatientNumber, updatePatient } = await import('@/lib/api/patients')

                      // 患者番号を生成
                      const patientNumber = await generatePatientNumber(clinicId)

                      // 既存患者を更新
                      await updatePatient(clinicId, selectedPatient.id, {
                        ...formData,
                        patient_number: patientNumber,
                        is_registered: true
                      })

                      setShowRegistrationModal(false)
                      alert('本登録が完了しました。')

                      // 予約を再読み込み
                      if (onSave) onSave()
                    } catch (error) {
                      console.error('本登録エラー:', error)
                      alert('本登録に失敗しました。')
                    }
                  }}
                  onCancel={() => setShowRegistrationModal(false)}
                  isEditing={false}
                />
              </div>
            )}

            {/* フッター（問診票連携タブのみ） */}
            {registrationTab === 'questionnaire' && (
              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRegistrationModal(false)}
                >
                  キャンセル
                </Button>
                {selectedQuestionnaireId && (
                  <Button
                    onClick={linkQuestionnaireToPatient}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    問診票を紐付け
                  </Button>
                )}
              </div>
            )}
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
      clinicId={clinicId}
      onSave={async (patientData) => {
        console.log('患者情報を更新:', patientData)

        // PatientEditModal内で既にデータベースに保存されているので、
        // ここでは最新の患者情報を取得して状態を更新するだけ
        if (selectedPatient) {
          try {
            const { getPatientById } = await import('@/lib/api/patients')
            const updatedPatient = await getPatientById(clinicId, selectedPatient.id)
            console.log('予約編集モーダル: 再取得した患者データの primary_doctor_id:', (updatedPatient as any).primary_doctor_id)
            console.log('予約編集モーダル: 再取得した患者データの primary_hygienist_id:', (updatedPatient as any).primary_hygienist_id)
            setSelectedPatient(updatedPatient)
            console.log('患者情報を再取得しました:', updatedPatient)
          } catch (error) {
            console.error('患者情報の再取得エラー:', error)
          }
        }
      }}
    />
  </>
  )
}
