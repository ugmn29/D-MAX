'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getClinicSettings, getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { formatDateForDB } from '@/lib/utils/date'
import { getTreatmentMenus } from '@/lib/api/treatment'
import { getStaff } from '@/lib/api/staff'
import { createAppointment } from '@/lib/api/appointments'
import { getWeeklySlots, getWeeklySlotsForReschedule } from '@/lib/api/web-booking'
import { getUnits, getStaffUnitPriorities } from '@/lib/api/units'
import { authenticateReturningPatient, getPatientById } from '@/lib/api/patients'
import { getPatientWebBookingSettings } from '@/lib/api/patient-web-booking-settings'
import { validateWebBookingToken, markTokenAsUsed } from '@/lib/api/web-booking-tokens'
import { Calendar, Clock, User, CheckCircle, ChevronLeft, ChevronRight, Phone } from 'lucide-react'
import { format, addDays, addWeeks, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import { trackPageView, trackButtonClick, trackFormSubmit } from '@/lib/tracking/funnel-tracker'
import { captureAndStoreUTMData, getStoredUTMData } from '@/lib/tracking/utm-tracker'

// デフォルトのクリニックID（searchParamsで上書き可能）
const DEFAULT_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface WebBookingSettings {
  isEnabled: boolean
  reservationPeriod: number
  allowCurrentTime: boolean
  openAllSlots: boolean
  allowStaffSelection: boolean
  webPageUrl: string
  showCancelPolicy: boolean
  cancelPolicyText: string
  patientInfoFields: {
    phoneRequired: boolean
    phoneEnabled: boolean
    emailRequired: boolean
    emailEnabled: boolean
  }
  flow: {
    initialSelection: boolean
    menuSelection: boolean
    staffSelection: boolean
    calendarDisplay: boolean
    patientInfo: boolean
    confirmation: boolean
  }
}

interface QuestionnaireSettings {
  isEnabled: boolean
  sendTiming: string
  validPeriod: number
  templates: {
    standard: boolean
    child: boolean
    orthodontic: boolean
    custom: boolean
  }
}

function WebBookingPageInner() {
  const searchParams = useSearchParams()
  const clinicIdParam = searchParams.get('clinic_id')
  const clinicSlugParam = searchParams.get('clinic')
  const [resolvedClinicId, setResolvedClinicId] = useState<string>(clinicIdParam || DEFAULT_CLINIC_ID)
  const clinicId = resolvedClinicId
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [webSettings, setWebSettings] = useState<WebBookingSettings | null>(null)
  const [questionnaireSettings, setQuestionnaireSettings] = useState<QuestionnaireSettings | null>(null)
  const [webBookingMenus, setWebBookingMenus] = useState<any[]>([]) // Web予約メニュー
  const [treatmentMenus, setTreatmentMenus] = useState<any[]>([]) // 全診療メニュー（参照用）
  const [staff, setStaff] = useState<any[]>([]) // スタッフ一覧（参照用）
  const [workingStaff, setWorkingStaff] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [bookingCompleted, setBookingCompleted] = useState(false) // 予約完了状態
  const [weekStartDate, setWeekStartDate] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d }) // 今日始まり
  const [timeSlotMinutes, setTimeSlotMinutes] = useState<number>(15)
  const [businessHours, setBusinessHours] = useState<any>({})
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([])

  // ユニット関連
  const [clinicUnits, setClinicUnits] = useState<any[]>([])
  const [staffUnitPrioritiesData, setStaffUnitPrioritiesData] = useState<any[]>([])

  // トークンベースWeb予約用のstate
  const [tokenData, setTokenData] = useState<any>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string>('')

  // 再診患者認証用のstate
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authenticatedPatient, setAuthenticatedPatient] = useState<any>(null)
  const [authError, setAuthError] = useState<string>('')
  const [clinicPhone, setClinicPhone] = useState<string>('')
  const [authData, setAuthData] = useState({
    patientNumber: '',
    phone: '',
    email: '',
    birthYear: '',
    birthMonth: '',
    birthDay: ''
  })

  // セクションへの参照
  const menuSectionRef = useRef<HTMLDivElement>(null)
  const staffSectionRef = useRef<HTMLDivElement>(null)
  const calendarSectionRef = useRef<HTMLDivElement>(null)
  const patientInfoSectionRef = useRef<HTMLDivElement>(null)
  const confirmationSectionRef = useRef<HTMLDivElement>(null)
  const authSectionRef = useRef<HTMLDivElement>(null)

  // 予約データ
  const [bookingData, setBookingData] = useState({
    isNewPatient: true,
    selectedMenu: '',
    selectedDate: '',
    selectedTime: '',
    selectedStaff: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientRequest: '' // ご要望・ご相談など
  })

  // スムーズスクロール関数
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      const yOffset = -20 // ヘッダーからの余白
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // ページビュートラッキング
  useEffect(() => {
    // URLのUTMパラメータをsessionStorageに保存してからトラッキング
    captureAndStoreUTMData()
    trackPageView(clinicId, 'LANDING', {
      page: 'web-booking',
      has_utm: getStoredUTMData() !== null
    })
  }, [])

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // slugが指定されている場合、APIでclinic_idを解決
        let effectiveClinicId = clinicId
        if (clinicSlugParam && !clinicIdParam) {
          try {
            const slugRes = await fetch(`/api/clinics/by-slug/${clinicSlugParam}`)
            if (slugRes.ok) {
              const clinicData = await slugRes.json()
              if (clinicData?.id) {
                effectiveClinicId = clinicData.id
                setResolvedClinicId(clinicData.id)
              }
            }
          } catch (e) {
            console.error('クリニックslug解決エラー:', e)
          }
        }

        const [settings, menus, staffData, clinic, unitsData, staffUnitPriorities] = await Promise.all([
          getClinicSettings(effectiveClinicId),
          getTreatmentMenus(effectiveClinicId),
          getStaff(effectiveClinicId),
          getBusinessHours(effectiveClinicId),
          getUnits(effectiveClinicId),
          getStaffUnitPriorities(effectiveClinicId)
        ])

        console.log('Web予約: 取得した設定', settings)
        console.log('Web予約: 取得した診療時間', clinic)

        const defaultSettings = {
          isEnabled: false,
          reservationPeriod: 30,
          allowCurrentTime: true,
          openAllSlots: false,
          allowStaffSelection: true,
          webPageUrl: '',
          showCancelPolicy: false,
          cancelPolicyText: `◆当院のキャンセルポリシー◆

数ある歯科医院の中から〇〇歯科・矯正歯科をお選びいただき誠にありがとうございます。
当クリニックでは患者さま一人一人により良い医療を提供するため、30〜45分の長い治療時間を確保してお待ちしております。尚かつ適切な処置時間を確保するために予約制となっております。

予約時間に遅れての来院は十分な時間が確保できず、予定通りの処置が行えない場合があります。
また、予定時間に遅れが生じる事で、次に来院予定の患者さまに多大なご迷惑をおかけする恐れがありますので、予約時間前の来院にご協力をお願い致します。
止むを得ず遅れる場合や、体調不良などでキャンセルを希望される場合は早めのご連絡をお願い致します。
予約の際には確実に来院できる日にちと時間をご確認下さい。`,
          acceptNewPatient: true,
          acceptReturningPatient: true,
          patientInfoFields: {
            phoneRequired: true,
            phoneEnabled: true,
            emailRequired: false,
            emailEnabled: true
          },
          flow: {
            initialSelection: true,
            menuSelection: true,
            staffSelection: false,
            calendarDisplay: true,
            patientInfo: true,
            confirmation: true
          }
        }

        // 既存設定とマージ
        // 古いキャンセルポリシーテキスト（駒沢公園通り）を検出して新しいテキストに置き換え
        const savedCancelPolicyText = settings.web_reservation?.cancelPolicyText
        const shouldUpdateCancelPolicy = savedCancelPolicyText && savedCancelPolicyText.includes('駒沢公園通り')

        const webReservation = {
          ...defaultSettings,
          ...(settings.web_reservation || {}),
          // 古いテキストの場合は新しいデフォルトに置き換え
          cancelPolicyText: shouldUpdateCancelPolicy ? defaultSettings.cancelPolicyText : (savedCancelPolicyText || defaultSettings.cancelPolicyText)
        }

        console.log('🔍 Web予約設定の読み込み:', {
          hasWebReservationSettings: !!settings.web_reservation,
          isEnabled: webReservation.isEnabled,
          fullWebReservation: webReservation,
          rawSettings: settings.web_reservation
        })

        setWebSettings(webReservation)

        // Web予約メニューを取得（booking_menusがあればそれを使用、なければ全メニュー）
        const bookingMenus = (webReservation.booking_menus || []).map(menu => {
          // 古い形式のデータ（treatment_menu_level2_id）を新しい形式（steps[].menu_id）に変換
          if (menu.treatment_menu_level2_id && menu.steps && menu.steps.length > 0 && !menu.steps[0].menu_id) {
            console.log('🔄 古い形式のデータを検出、変換中:', {
              menuName: menu.treatment_menu_name,
              treatment_menu_level2_id: menu.treatment_menu_level2_id,
              steps: menu.steps
            })
            // steps[0].menu_idに treatment_menu_level2_id を設定
            menu.steps[0].menu_id = menu.treatment_menu_level2_id
            console.log('✅ 変換完了:', menu.steps[0])
          }

          // stepsが空または存在しない場合、治療メニューのmenu2_id, menu3_idから自動生成
          if (!menu.steps || menu.steps.length === 0) {
            const treatmentMenu = menus.find(m => m.id === menu.treatment_menu_id)
            if (treatmentMenu) {
              const autoSteps = []
              if (treatmentMenu.menu2_id) {
                autoSteps.push({
                  id: `step_auto_2_${Date.now()}`,
                  step_order: 1,
                  menu_id: treatmentMenu.menu2_id,
                  staff_assignments: menu.staff_ids?.map((staffId, index) => ({
                    staff_id: staffId,
                    priority: index + 1
                  })) || []
                })
              }
              if (treatmentMenu.menu3_id) {
                autoSteps.push({
                  id: `step_auto_3_${Date.now()}`,
                  step_order: 2,
                  menu_id: treatmentMenu.menu3_id,
                  staff_assignments: menu.staff_ids?.map((staffId, index) => ({
                    staff_id: staffId,
                    priority: index + 1
                  })) || []
                })
              }
              console.log('🔍 自動ステップ生成:', {
                menuName: menu.treatment_menu_name,
                menu2_id: treatmentMenu.menu2_id,
                menu3_id: treatmentMenu.menu3_id,
                autoSteps
              })
              return { ...menu, steps: autoSteps }
            }
          }
          return menu
        })

        console.log('🔍 Web予約: booking_menusの読み込み:', {
          hasBookingMenus: !!webReservation.booking_menus,
          bookingMenusLength: bookingMenus.length,
          bookingMenus: bookingMenus,
          firstMenu: bookingMenus[0],
          firstMenuSteps: bookingMenus[0]?.steps
        })
        setWebBookingMenus(bookingMenus)

        setQuestionnaireSettings(settings.questionnaire || {
          isEnabled: false,
          sendTiming: 'before_appointment',
          validPeriod: 7,
          templates: {
            standard: true,
            child: false,
            orthodontic: false,
            custom: false
          }
        })

        setTreatmentMenus(menus)
        setStaff(staffData)
        setClinicUnits(unitsData.filter((u: any) => u.is_active !== false))
        setStaffUnitPrioritiesData(staffUnitPriorities)

        // 時間スロット設定と診療時間を保存
        setTimeSlotMinutes(settings.time_slot_minutes || 15)
        setBusinessHours(clinic || {})

        // クリニック電話番号を取得
        try {
          const clinicRes = await fetch(`/api/clinics/${clinicId}`)
          if (clinicRes.ok) {
            const clinicData = await clinicRes.json()
            if (clinicData?.phone) {
              setClinicPhone(clinicData.phone)
            }
          }
        } catch (e) {
          console.error('クリニック電話番号取得エラー:', e)
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 予約変更モードかどうか
  const isRescheduleMode = searchParams.get('reschedule') === 'true'

  // 予約変更用の元の予約情報を保持するstate
  const [originalAppointmentData, setOriginalAppointmentData] = useState<{
    menu1_id?: string | null
    menu2_id?: string | null
    staff_id?: string | null
    duration?: number
  }>({})

  // LINEからのWeb予約処理
  useEffect(() => {
    const fromLine = searchParams.get('from_line')
    const patientId = searchParams.get('patient_id')
    const patientNumber = searchParams.get('patient_number')
    const phone = searchParams.get('phone')
    const birthDate = searchParams.get('birth_date')
    const reschedule = searchParams.get('reschedule') // 予約変更モード
    // 予約変更用: 元の予約情報
    const originalMenu1Id = searchParams.get('menu1_id')
    const originalMenu2Id = searchParams.get('menu2_id')
    const originalStaffId = searchParams.get('staff_id')
    const originalDuration = searchParams.get('duration')

    if (fromLine === 'true' && patientId && patientNumber) {
      const loadLinePatient = async () => {
        try {
          setTokenLoading(true)
          setTokenError('')

          console.log('LINE Web予約: 患者情報読み込み開始', { patientId, patientNumber, reschedule })
          console.log('LINE 予約変更モード: 元の予約情報', {
            menu1_id: originalMenu1Id,
            menu2_id: originalMenu2Id,
            staff_id: originalStaffId,
            duration: originalDuration
          })

          // 患者情報を取得（clinicIdを使用）
          const patient = await getPatientById(clinicId, patientId)
          if (!patient) {
            setTokenError('患者情報が見つかりません。')
            return
          }

          console.log('LINE Web予約: 患者情報取得成功', patient)

          // Web予約設定をチェック（予約変更モードでは reschedule_enabled をチェック）
          const webBookingSettings = await getPatientWebBookingSettings(patient.id, clinicId)
          if (webBookingSettings) {
            if (reschedule === 'true' && !webBookingSettings.web_reschedule_enabled) {
              setTokenError('この患者様はWeb予約変更が制限されています。お電話でご連絡ください。')
              return
            }
            if (reschedule !== 'true' && !webBookingSettings.web_booking_enabled) {
              setTokenError('この患者様はWeb予約が制限されています。お電話でご予約ください。')
              return
            }
          }

          // 認証データをセット（再診患者として扱う）
          const patientBirthDate = patient.date_of_birth || ''
          const [bYear, bMonth, bDay] = patientBirthDate ? patientBirthDate.split('-') : ['', '', '']
          setAuthData({
            patientNumber: patientNumber,
            phone: phone || patient.phone || '',
            email: patient.email || '',
            birthYear: birthDate ? birthDate.split('-')[0] : bYear,
            birthMonth: birthDate ? birthDate.split('-')[1] : bMonth,
            birthDay: birthDate ? birthDate.split('-')[2] : bDay
          })

          // 患者を認証済みとしてセット
          setAuthenticatedPatient(patient)
          setIsAuthenticated(true)

          // 予約変更モードの場合: 元の予約情報を保持
          if (reschedule === 'true') {
            setOriginalAppointmentData({
              menu1_id: originalMenu1Id,
              menu2_id: originalMenu2Id,
              staff_id: originalStaffId,
              duration: originalDuration ? parseInt(originalDuration) : undefined
            })

            // 元の診療メニューを選択状態にする
            if (originalMenu1Id) {
              setBookingData(prev => ({
                ...prev,
                isNewPatient: false,
                patientName: `${patient.last_name} ${patient.first_name}`,
                patientPhone: phone || patient.phone || '',
                patientEmail: patient.email || '',
                selectedMenu: originalMenu1Id,
                selectedStaff: originalStaffId || ''
              }))
            } else {
              setBookingData(prev => ({
                ...prev,
                isNewPatient: false,
                patientName: `${patient.last_name} ${patient.first_name}`,
                patientPhone: phone || patient.phone || '',
                patientEmail: patient.email || ''
              }))
            }

            // 日時選択から開始（ステップ3）
            setCurrentStep(3)
            console.log('LINE 予約変更モード: ステップ3（日時選択）から開始', {
              selectedMenu: originalMenu1Id,
              selectedStaff: originalStaffId
            })
          } else {
            // 通常モード: 予約データを自動設定
            setBookingData(prev => ({
              ...prev,
              isNewPatient: false,
              patientName: `${patient.last_name} ${patient.first_name}`,
              patientPhone: phone || patient.phone || '',
              patientEmail: patient.email || ''
            }))
            // メニュー選択から開始
            setCurrentStep(2)
          }

        } catch (error) {
          console.error('LINE Web予約エラー:', error)
          setTokenError('患者情報の読み込みに失敗しました。')
        } finally {
          setTokenLoading(false)
        }
      }

      loadLinePatient()
      return
    }
  }, [searchParams])

  // 予約変更モード時、元の診療メニューがなければフォールバックでwebBookingMenusから選択
  useEffect(() => {
    if (isRescheduleMode && !bookingData.selectedMenu) {
      // 元の予約にmenu1_idがある場合はそれを使用（すでにLINE読み込み時に設定済み）
      if (originalAppointmentData.menu1_id) {
        console.log('予約変更モード: 元の診療メニューを使用', originalAppointmentData.menu1_id)
        // 既にセット済みなのでスキップ
        return
      }

      // 元のメニューがない場合のみ、webBookingMenusからフォールバック選択
      if (webBookingMenus.length > 0) {
        const returningPatientMenu = webBookingMenus.find(m => m.allow_returning !== false)
        const defaultMenu = returningPatientMenu || webBookingMenus[0]
        console.log('予約変更モード: フォールバックでデフォルトメニュー自動選択', defaultMenu)
        setBookingData(prev => ({
          ...prev,
          selectedMenu: defaultMenu.treatment_menu_id
        }))
      }
    }
  }, [isRescheduleMode, webBookingMenus, bookingData.selectedMenu, originalAppointmentData.menu1_id])

  // トークンベースWeb予約の処理
  useEffect(() => {
    const token = searchParams.get('token')
    const fromLine = searchParams.get('from_line')

    // LINEからの場合は処理しない
    if (fromLine === 'true') return
    if (!token) return

    const validateToken = async () => {
      try {
        setTokenLoading(true)
        setTokenError('')

        console.log('トークンベースWeb予約: トークン検証開始', token)

        // トークンを検証
        const validatedToken = await validateWebBookingToken(token)

        if (!validatedToken) {
          setTokenError('このリンクは無効または期限切れです。')
          return
        }

        console.log('トークンベースWeb予約: トークン検証成功', validatedToken)

        // 患者情報を取得
        const patient = await getPatientById(validatedToken.patient_id)
        if (!patient) {
          setTokenError('患者情報が見つかりません。')
          return
        }

        console.log('トークンベースWeb予約: 患者情報取得成功', patient)

        // Web予約設定をチェック
        const webBookingSettings = await getPatientWebBookingSettings(patient.id, clinicId)
        if (webBookingSettings && !webBookingSettings.web_booking_enabled) {
          setTokenError('この患者様はWeb予約が制限されています。お電話でご予約ください。')
          return
        }

        // トークンデータを保存
        setTokenData(validatedToken)

        // 患者を認証済みとしてセット
        setAuthenticatedPatient(patient)
        setIsAuthenticated(true)

        // 予約データを自動設定
        setBookingData(prev => ({
          ...prev,
          isNewPatient: false,
          selectedMenu: validatedToken.treatment_menu_id || '',
          selectedStaff: validatedToken.staff_ids?.[0] || '',
          patientName: `${patient.last_name} ${patient.first_name}`,
          patientPhone: patient.phone || '',
          patientEmail: patient.email || ''
        }))

        // メニュー選択をスキップしてカレンダー画面に直接遷移
        // （診療メニューが設定されている場合）
        if (validatedToken.treatment_menu_id) {
          setTimeout(() => {
            scrollToSection(calendarSectionRef)
          }, 500)
        }

        console.log('トークンベースWeb予約: 初期設定完了')
      } catch (error) {
        console.error('トークン検証エラー:', error)
        setTokenError('予約リンクの処理中にエラーが発生しました。')
      } finally {
        setTokenLoading(false)
      }
    }

    validateToken()
  }, [searchParams])

  // 週間空き枠を取得
  const loadWeeklySlots = async () => {
    // 予約変更モードの場合は元のメニューIDがなくても所要時間で空き枠取得
    const isRescheduleWithOriginalData = isRescheduleMode && originalAppointmentData.duration

    if (!bookingData.selectedMenu && !isRescheduleWithOriginalData) return

    try {
      let slots

      if (isRescheduleWithOriginalData) {
        // 予約変更モード：Web予約メニュー設定不要の空き枠取得
        console.log('予約変更モード: 専用空き枠取得を使用', {
          duration: originalAppointmentData.duration,
          staffId: originalAppointmentData.staff_id
        })
        slots = await getWeeklySlotsForReschedule(
          clinicId,
          originalAppointmentData.duration || 30,
          originalAppointmentData.staff_id || null,
          weekStartDate
        )
      } else {
        // 通常モード
        slots = await getWeeklySlots(
          clinicId,
          bookingData.selectedMenu,
          bookingData.isNewPatient,
          weekStartDate
        )
      }
      setAvailableSlots(slots)
    } catch (error) {
      console.error('空き枠取得エラー:', error)
      const msg = error instanceof Error ? error.message : String(error)
      alert(`空き枠の取得に失敗しました\n詳細: ${msg}`)
    }
  }

  // 診療メニューや週が変更されたら空き枠を再取得
  useEffect(() => {
    const isRescheduleWithOriginalData = isRescheduleMode && originalAppointmentData.duration
    if (bookingData.selectedMenu || isRescheduleWithOriginalData) {
      loadWeeklySlots()
    }
  }, [bookingData.selectedMenu, bookingData.isNewPatient, weekStartDate, isRescheduleMode, originalAppointmentData.duration])

  // 全時間スロットを生成（診療時間設定から）
  useEffect(() => {
    if (!businessHours || Object.keys(businessHours).length === 0) {
      console.log('Web予約: 診療時間設定が空です', businessHours)
      return
    }

    console.log('Web予約: 診療時間設定:', businessHours)
    console.log('Web予約: timeSlotMinutes:', timeSlotMinutes)

    const timeSlots = new Set<string>()

    // 曜日キーのマッピング（英語 → 英語小文字）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }

    // 1週間分の各曜日について時間スロットを生成
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = addDays(weekStartDate, dayOffset)
      // 英語曜日名を取得（例: "Monday" → "monday"）
      const dayOfWeekLong = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dayKey = dayMapping[dayOfWeekLong] || dayOfWeekLong

      const dayBusinessHours = businessHours[dayKey]

      console.log(`Web予約: ${date.toLocaleDateString()} (${dayKey})`, dayBusinessHours)

      if (dayBusinessHours && dayBusinessHours.isOpen && dayBusinessHours.timeSlots) {
        dayBusinessHours.timeSlots.forEach((slot: any) => {
          const startHour = parseInt(slot.start.split(':')[0])
          const startMinute = parseInt(slot.start.split(':')[1])
          const endHour = parseInt(slot.end.split(':')[0])
          const endMinute = parseInt(slot.end.split(':')[1])

          let currentMinutes = startHour * 60 + startMinute
          const endMinutes = endHour * 60 + endMinute

          while (currentMinutes < endMinutes) {
            const hour = Math.floor(currentMinutes / 60)
            const minute = currentMinutes % 60
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            timeSlots.add(timeString)
            currentMinutes += timeSlotMinutes
          }
        })
      }
    }

    const timeSlotsArray = Array.from(timeSlots).sort()
    console.log('Web予約: 生成された全時間スロット:', timeSlotsArray)
    setAllTimeSlots(timeSlotsArray)
  }, [businessHours, weekStartDate, timeSlotMinutes])

  // 週の移動
  const goToPreviousWeek = () => {
    const newDate = addWeeks(weekStartDate, -1)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // 今日より前には戻れない
    if (newDate >= today) {
      setWeekStartDate(newDate)
    }
  }

  const goToNextWeek = () => {
    const newDate = addWeeks(weekStartDate, 1)
    const today = new Date()
    const maxDate = addDays(today, webSettings?.reservationPeriod || 30)
    // 予約可能期間を超えて進めない
    if (newDate <= maxDate) {
      setWeekStartDate(newDate)
    }
  }

  // ステップ進行
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 再診患者認証処理
  const handleAuthenticate = async () => {
    try {
      setAuthError('')

      // 入力チェック: いずれか1つ + 生年月日
      if (!authData.patientNumber && !authData.phone && !authData.email) {
        setAuthError('診察券番号、電話番号、メールアドレスのいずれか1つを入力してください')
        return
      }

      if (!authData.birthYear || !authData.birthMonth || !authData.birthDay) {
        setAuthError('生年月日を入力してください')
        return
      }

      // 生年月日をYYYY-MM-DD形式に変換
      const birthdate = `${authData.birthYear}-${authData.birthMonth.padStart(2, '0')}-${authData.birthDay.padStart(2, '0')}`

      // 患者認証APIを呼び出し
      const patient = await authenticateReturningPatient(clinicId, {
        patientNumber: authData.patientNumber || undefined,
        phone: authData.phone || undefined,
        email: authData.email || undefined,
        birthdate
      })

      if (patient) {
        // Web予約設定をチェック
        const webBookingSettings = await getPatientWebBookingSettings(patient.id, clinicId)
        if (webBookingSettings && !webBookingSettings.web_booking_enabled) {
          // Web予約が許可されていない
          setAuthError('この患者様はWeb予約が制限されています。お電話でご予約ください。')
          return
        }

        // 認証成功
        setIsAuthenticated(true)
        setAuthenticatedPatient(patient)
        setBookingData(prev => ({
          ...prev,
          patientName: `${patient.last_name || ''} ${patient.first_name || ''}`.trim(),
          patientPhone: patient.phone || '',
          patientEmail: patient.email || ''
        }))
        // メニュー選択へスクロール
        setTimeout(() => scrollToSection(menuSectionRef), 300)
      } else {
        // 認証失敗
        setAuthError('患者情報が見つかりませんでした')
      }
    } catch (error) {
      console.error('認証エラー:', error)
      setAuthError('認証処理中にエラーが発生しました')
    }
  }

  // 日付と時間選択時の処理
  const handleSlotSelect = (date: string, time: string) => {
    setBookingData(prev => ({ ...prev, selectedDate: date, selectedTime: time }))
    // 時間選択イベントをトラッキング
    trackButtonClick(clinicId, 'TIME_SELECTION', `${date} ${time}`, {
      date,
      time,
      menu_id: bookingData.selectedMenu
    })
    // 再診の場合は確認画面へ、初診の場合は患者情報入力へ
    if (!bookingData.isNewPatient && isAuthenticated) {
      setTimeout(() => scrollToSection(confirmationSectionRef), 300)
    } else {
      setTimeout(() => scrollToSection(patientInfoSectionRef), 300)
    }
  }

  // 優先順位順に空いているスタッフを探す関数
  const findAvailableStaff = (
    staffAssignments: any[],
    date: string,
    startTime: string,
    duration: number,
    existingAppointments: any[]
  ) => {
    // 優先順位順にソート
    const sortedAssignments = [...staffAssignments].sort((a, b) =>
      (a.priority || 0) - (b.priority || 0)
    )

    // 各スタッフの空き状況をチェック
    for (const assignment of sortedAssignments) {
      const staffId = assignment.staff_id

      // このスタッフがこの時間に既存予約を持っているかチェック
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = startMinutes + duration

      const hasConflict = existingAppointments.some(apt => {
        if (apt.appointment_date !== date) return false
        // スタッフ未割当の予約は全スタッフの重複として扱う
        const isUnassigned = !apt.staff1_id && !apt.staff2_id && !apt.staff3_id
        if (!isUnassigned && apt.staff1_id !== staffId && apt.staff2_id !== staffId && apt.staff3_id !== staffId) return false

        const aptStart = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
        const aptEnd = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])

        // 重複チェック
        return !(endMinutes <= aptStart || startMinutes >= aptEnd)
      })

      if (!hasConflict) {
        // 空いているスタッフが見つかった
        return assignment
      }
    }

    // 全員埋まっている場合はnull
    return null
  }

  // 予約確定
  const handleConfirmBooking = async () => {
    try {
      // 初診患者の場合、必須フィールドのバリデーション
      if (bookingData.isNewPatient) {
        if (webSettings.patientInfoFields.phoneRequired && !bookingData.patientPhone.trim()) {
          alert('電話番号は必須です。')
          return
        }
        if (webSettings.patientInfoFields.emailRequired && !bookingData.patientEmail.trim()) {
          alert('メールアドレスは必須です。')
          return
        }
        if (!bookingData.patientName.trim()) {
          alert('お名前は必須です。')
          return
        }

        // 電話番号でweb予約NG患者を確認
        if (bookingData.patientPhone.trim()) {
          try {
            const checkRes = await fetch(
              `/api/patients/check-booking-status?phone=${encodeURIComponent(bookingData.patientPhone.trim())}&clinic_id=${clinicId}`
            )
            if (checkRes.ok) {
              const checkData = await checkRes.json()
              if (checkData.blocked) {
                alert('大変申し訳ございませんが、こちらの電話番号ではWeb予約をご利用いただけません。お電話にてご予約ください。')
                return
              }
            }
          } catch (e) {
            console.error('booking status check error:', e)
          }
        }
      }

      // 予約変更モードかどうかで処理を分岐
      const isRescheduleWithOriginalMenu = isRescheduleMode && originalAppointmentData.menu1_id

      // 選択されたメニュー情報を取得
      const selectedWebBookingMenu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
      const selectedMenuData = treatmentMenus.find(m => m.id === bookingData.selectedMenu)

      // 予約変更モードで元の診療メニューがある場合はWebBookingMenusのチェックをスキップ
      if (!isRescheduleWithOriginalMenu) {
        if (!selectedMenuData || !selectedWebBookingMenu) {
          console.error('メニュー情報が見つかりません', {
            selectedMenuId: bookingData.selectedMenu,
            webBookingMenus,
            treatmentMenus
          })
          alert('メニュー情報が見つかりません。')
          return
        }

        console.log('Web予約: 選択されたメニュー', selectedMenuData)
        console.log('Web予約: Web予約メニュー設定', selectedWebBookingMenu)
        console.log('🔍 Web予約: selectedWebBookingMenuの全フィールド:', {
          treatment_menu_id: selectedWebBookingMenu.treatment_menu_id,
          display_order: selectedWebBookingMenu.display_order,
          steps: selectedWebBookingMenu.steps,
          stepsType: typeof selectedWebBookingMenu.steps,
          stepsIsArray: Array.isArray(selectedWebBookingMenu.steps),
          stepsLength: selectedWebBookingMenu.steps?.length,
          allKeys: Object.keys(selectedWebBookingMenu)
        })
      } else {
        console.log('予約変更モード: 元の診療メニューを使用', {
          menu1_id: originalAppointmentData.menu1_id,
          menu2_id: originalAppointmentData.menu2_id,
          staff_id: originalAppointmentData.staff_id,
          duration: originalAppointmentData.duration
        })
      }

      // stepsから複数ステップの情報を取得（予約変更モードでは空）
      const steps = isRescheduleWithOriginalMenu ? [] : (selectedWebBookingMenu?.steps || [])
      console.log('Web予約: ステップ情報', steps)

      // 既存予約を取得（キャンセル除外）- 認証不要の公開API使用
      const apptParams = new URLSearchParams({ clinic_id: clinicId, start_date: bookingData.selectedDate, end_date: bookingData.selectedDate })
      const apptRes = await fetch(`/api/web-booking/appointments?${apptParams.toString()}`)
      const allAppointments = apptRes.ok ? await apptRes.json() : []
      const existingAppointments = allAppointments.filter((apt: any) => apt.status !== 'キャンセル')
      console.log('Web予約: 既存予約データ', existingAppointments.length, '件')

      // 所要時間を決定（予約変更モードでは元の予約の所要時間を優先）
      let duration: number
      if (isRescheduleWithOriginalMenu && originalAppointmentData.duration) {
        duration = originalAppointmentData.duration
      } else if (selectedWebBookingMenu?.duration) {
        duration = selectedWebBookingMenu.duration
      } else if (selectedMenuData?.duration_minutes) {
        duration = selectedMenuData.duration_minutes
      } else {
        duration = 30 // デフォルト30分
      }

      // 所要時間から終了時間を計算
      const [startHour, startMinute] = bookingData.selectedTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = startMinutes + duration
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

      // 患者IDを決定
      let patientId: string

      if (!bookingData.isNewPatient && isAuthenticated && authenticatedPatient) {
        // 再診の場合: 認証済み患者のIDを使用
        patientId = authenticatedPatient.id
        console.log('Web予約: 再診患者として予約', authenticatedPatient)
      } else {
        // 初診の場合: 患者データをデータベースに登録
        const { createPatient } = await import('@/lib/api/patients')
        const nameParts = bookingData.patientName.split(' ')

        const newPatient = await createPatient(clinicId, {
          last_name: nameParts[0] || bookingData.patientName,
          first_name: nameParts[1] || '',
          last_name_kana: '',
          first_name_kana: '',
          phone: bookingData.patientPhone,
          email: bookingData.patientEmail || '',
          birth_date: null,
          gender: null,
          postal_code: null,
          address: null
        })

        console.log('Web予約: 新規患者を登録しました', newPatient)
        patientId = newPatient.id
      }

      // 予約データを作成
      const appointmentData: any = {
        patient_id: patientId,
        appointment_date: bookingData.selectedDate,
        start_time: bookingData.selectedTime,
        end_time: endTime,
        status: '未来院', // 初回ステータスを「未来院」に設定
        memo: isRescheduleMode
          ? `予約変更${bookingData.patientRequest ? `\n\nご要望・ご相談:\n${bookingData.patientRequest}` : ''}`
          : `Web予約${bookingData.isNewPatient ? '(初診)' : '(再診)'}${bookingData.patientRequest ? `\n\nご要望・ご相談:\n${bookingData.patientRequest}` : ''}`
      }

      // 予約変更モードの場合: 元の診療メニューと担当者を引き継ぐ
      if (isRescheduleWithOriginalMenu) {
        // 元の予約から診療メニューを引き継ぐ
        appointmentData.menu1_id = originalAppointmentData.menu1_id
        if (originalAppointmentData.staff_id) {
          appointmentData.staff1_id = originalAppointmentData.staff_id
        } else {
          // 元の予約にstaff_idがない場合、Web予約メニュー設定から自動割り当て
          const rescheduleMenu = webBookingMenus.find(m => m.treatment_menu_id === originalAppointmentData.menu1_id)
          if (rescheduleMenu?.steps?.length > 0 && rescheduleMenu.steps[0].staff_assignments?.length > 0) {
            const autoStaff = findAvailableStaff(
              rescheduleMenu.steps[0].staff_assignments,
              bookingData.selectedDate,
              bookingData.selectedTime,
              duration,
              existingAppointments
            )
            if (autoStaff) {
              appointmentData.staff1_id = autoStaff.staff_id
            } else {
              // フォールバック: 優先度1のスタッフを割り当て
              const fallback = [...rescheduleMenu.steps[0].staff_assignments].sort((a, b) => (a.priority || 0) - (b.priority || 0))[0]
              if (fallback) {
                appointmentData.staff1_id = fallback.staff_id
                console.warn('予約変更: 全スタッフ埋まりのためフォールバック割り当て', fallback.staff_id)
              }
            }
          }
        }
        // menu2_idも元の予約から引き継ぐ
        if (originalAppointmentData.menu2_id) {
          appointmentData.menu2_id = originalAppointmentData.menu2_id
        }
        console.log('予約変更: 元の予約情報を引き継ぎ', {
          menu1_id: appointmentData.menu1_id,
          staff1_id: appointmentData.staff1_id,
          menu2_id: appointmentData.menu2_id
        })
      } else {
        // 通常のWeb予約: 診療メニュー1を設定
        appointmentData.menu1_id = bookingData.selectedMenu

        // staff1_idの割り当て: ユーザー選択 > ステップ0のスタッフ自動割り当て
        if (bookingData.selectedStaff) {
          appointmentData.staff1_id = bookingData.selectedStaff
        } else if (steps.length > 0 && steps[0].staff_assignments?.length > 0) {
          // 最初のステップから空いているスタッフを自動割り当て
          const firstStepStaff = findAvailableStaff(
            steps[0].staff_assignments,
            bookingData.selectedDate,
            bookingData.selectedTime,
            duration,
            existingAppointments
          )
          if (firstStepStaff) {
            appointmentData.staff1_id = firstStepStaff.staff_id
          } else {
            // 全スタッフが埋まっている場合でも、優先度1のスタッフをフォールバックとして割り当て
            const fallbackAssignment = [...steps[0].staff_assignments].sort((a, b) => (a.priority || 0) - (b.priority || 0))[0]
            if (fallbackAssignment) {
              appointmentData.staff1_id = fallbackAssignment.staff_id
              console.warn('Web予約: 全スタッフ埋まりのためフォールバック割り当て', fallbackAssignment.staff_id)
            }
          }
        }
        console.log('Web予約: 診療メニュー1を設定', {
          menu1_id: bookingData.selectedMenu,
          staff1_id: appointmentData.staff1_id
        })

        // stepsがある場合、診療メニュー2, 3を設定（steps[0]はstaff1_idで使用済みなので1から）
        if (steps.length > 1) {
          // 各ステップごとに優先順位順に空いているスタッフを探す
          for (let index = 1; index < steps.length && index < 3; index++) {
            const step = steps[index]
            const menuNumber = index + 1  // steps[1]→menu2, steps[2]→menu3
            const stepMenuId = step.menu_id

            if (!stepMenuId) {
              console.warn(`Web予約: ステップ${index}のmenu_idが未設定です`)
              continue
            }

            // メニューIDを設定
            appointmentData[`menu${menuNumber}_id`] = stepMenuId

            // 優先順位順に空いているスタッフを探す
            if (step.staff_assignments && step.staff_assignments.length > 0) {
              const availableStaff = findAvailableStaff(
                step.staff_assignments,
                bookingData.selectedDate,
                bookingData.selectedTime,
                duration,
                existingAppointments
              )

              if (availableStaff) {
                appointmentData[`staff${menuNumber}_id`] = availableStaff.staff_id
                console.log(`Web予約: 診療メニュー${menuNumber}のスタッフを設定`, {
                  menu_id: stepMenuId,
                  staff_id: availableStaff.staff_id,
                  staff_name: staff.find(s => s.id === availableStaff.staff_id)?.name,
                  priority: availableStaff.priority
                })
              } else {
                // 全員埋まっている場合
                console.error(`Web予約: 診療メニュー${menuNumber}の全スタッフが予約済みです`)
                alert(`診療メニュー${menuNumber}の全スタッフが予約済みです。別の時間をお選びください。`)
                return
              }
            }
          }
        }
      }

      // unit_id自動割り当て: スタッフの優先ユニット → メニュー対象ユニット → 全ユニットの順で空きを探す
      if (!appointmentData.unit_id && clinicUnits.length > 0) {
        const [aptStartH, aptStartM] = bookingData.selectedTime.split(':').map(Number)
        const aptStartMin = aptStartH * 60 + aptStartM
        const aptEndMin = aptStartMin + duration

        // この時間帯に使用中のユニットIDを取得
        const usedUnitIds = new Set(
          existingAppointments
            .filter(apt => {
              if (apt.appointment_date !== bookingData.selectedDate) return false
              if (!(apt as any).unit_id) return false
              const s = parseInt(apt.start_time.split(':')[0]) * 60 + parseInt(apt.start_time.split(':')[1])
              const e = parseInt(apt.end_time.split(':')[0]) * 60 + parseInt(apt.end_time.split(':')[1])
              return !(aptEndMin <= s || aptStartMin >= e)
            })
            .map(apt => (apt as any).unit_id)
        )

        // メニュー設定のユニット対象を決定
        const menuUnitMode = selectedWebBookingMenu?.unit_mode
        const menuUnitIds = selectedWebBookingMenu?.unit_ids || []
        const targetUnits = menuUnitMode === 'specific' && menuUnitIds.length > 0
          ? clinicUnits.filter(u => menuUnitIds.includes(u.id))
          : clinicUnits

        // スタッフの優先ユニットから空きを探す
        let assignedUnitId: string | null = null
        if (appointmentData.staff1_id) {
          const staffPriorities = staffUnitPrioritiesData
            .filter(p => p.staff_id === appointmentData.staff1_id && p.is_active)
            .sort((a, b) => a.priority_order - b.priority_order)

          for (const prio of staffPriorities) {
            if (!usedUnitIds.has(prio.unit_id) && targetUnits.some(u => u.id === prio.unit_id)) {
              assignedUnitId = prio.unit_id
              break
            }
          }
        }

        // スタッフ優先ユニットで見つからない場合、対象ユニットから空きを探す
        if (!assignedUnitId) {
          const availableUnit = targetUnits.find(u => !usedUnitIds.has(u.id))
          if (availableUnit) {
            assignedUnitId = availableUnit.id
          }
        }

        if (assignedUnitId) {
          appointmentData.unit_id = assignedUnitId
          console.log('Web予約: ユニット自動割り当て', assignedUnitId)
        }
      }

      console.log('Web予約: 予約作成データ', appointmentData)
      const createdAppointment = await createAppointment(clinicId, appointmentData)

      // 予約完了イベントをトラッキング
      await trackFormSubmit(clinicId, 'COMPLETE', {
        appointment_id: createdAppointment?.id,
        menu_id: bookingData.selectedMenu,
        is_new_patient: bookingData.isNewPatient
      })

      // 獲得経路データを保存
      const utmData = getStoredUTMData()
      try {
        await fetch('/api/tracking/save-acquisition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patient_id: patientId,
            clinic_id: clinicId,
            utm_data: utmData,
            questionnaire_source: null, // 問診表からの回答は別途設定
            questionnaire_detail: null
          })
        })
      } catch (error) {
        console.error('獲得経路保存エラー:', error)
        // エラーが発生しても予約処理は継続
      }

      // トークンベース予約の場合、トークンを使用済みにマーク
      if (tokenData) {
        try {
          await markTokenAsUsed(tokenData.id)
          console.log('トークンベースWeb予約: トークンを使用済みにマークしました')
        } catch (error) {
          console.error('トークン使用済みマークエラー:', error)
          // エラーが発生しても予約処理は継続
        }
      }

      // 確認メール送信（メールアドレスがある場合）
      if (bookingData.patientEmail.trim()) {
        try {
          const selectedWebMenu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
          const menuName = selectedWebMenu?.display_name || selectedWebMenu?.treatment_menu_name || ''
          await fetch('/api/web-booking/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientEmail: bookingData.patientEmail.trim(),
              patientName: bookingData.patientName,
              clinicName: webSettings.clinicName || '',
              appointmentDate: bookingData.selectedDate,
              appointmentTime: bookingData.selectedTime,
              menuName,
            }),
          })
        } catch (e) {
          console.error('確認メール送信エラー:', e)
          // メール送信失敗は予約完了に影響しない
        }
      }

      // 予約完了画面を表示
      setBookingCompleted(true)

      // 問診表が有効で、予約前に送信する設定の場合
      if (questionnaireSettings?.isEnabled && questionnaireSettings.sendTiming === 'before_appointment') {
        setShowQuestionnaire(true)
      }
    } catch (error) {
      console.error('予約確定エラー:', error)
      alert('予約の確定に失敗しました。')
    }
  }

  // 問診表送信
  const handleSendQuestionnaire = async () => {
    try {
      // 問診表送信の処理
      console.log('問診表送信:', { patient: bookingData.patientName, email: bookingData.patientEmail })
      alert('問診表をお送りしました。ご記入をお願いします。')
      setShowQuestionnaire(false)
    } catch (error) {
      console.error('問診表送信エラー:', error)
      alert('問診表の送信に失敗しました。')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shikabot-primary"></div>
      </div>
    )
  }

  // トークンエラー表示
  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">予約リンクのエラー</h2>
            <p className="text-gray-600 mb-6">
              {tokenError}
            </p>
            <p className="text-sm text-gray-500">
              お手数ですが、クリニックまでお問い合わせください。
            </p>
            {clinicPhone && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-600" />
                  <a href={`tel:${clinicPhone}`} className="text-lg font-semibold text-blue-600">
                    {clinicPhone}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!webSettings?.isEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-4">Web予約は現在利用できません</h2>
            <p className="text-gray-600">
              Web予約機能が無効になっています。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 予約完了画面
  if (bookingCompleted) {
    const selectedMenuData = treatmentMenus.find(m => m.id === bookingData.selectedMenu)
    const selectedStaffData = staff.find(s => s.id === bookingData.selectedStaff)

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-2 border-green-500">
            <CardHeader className="text-center bg-green-50">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">予約が完了しました</CardTitle>
              <p className="text-gray-600 mt-2">ご予約ありがとうございます</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">ご予約内容</h3>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">予約日時</div>
                      <div className="font-medium">{bookingData.selectedDate} {bookingData.selectedTime}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">診療メニュー</div>
                      <div className="font-medium">{selectedMenuData?.name || bookingData.selectedMenu}</div>
                    </div>
                  </div>

                  {bookingData.selectedStaff && selectedStaffData && (
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">担当者</div>
                        <div className="font-medium">{selectedStaffData.name}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">お名前</div>
                      <div className="font-medium">{bookingData.patientName}</div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600">電話番号</div>
                      <div className="font-medium">{bookingData.patientPhone}</div>
                    </div>
                  </div>

                  {bookingData.patientEmail && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">メールアドレス</div>
                        <div className="font-medium">{bookingData.patientEmail}</div>
                      </div>
                    </div>
                  )}

                  {bookingData.patientRequest && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">ご要望・ご相談</div>
                        <div className="font-medium whitespace-pre-wrap">{bookingData.patientRequest}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {bookingData.patientEmail && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    📧 確認メールを <strong>{bookingData.patientEmail}</strong> に送信しました。
                  </p>
                </div>
              )}

              {questionnaireSettings?.isEnabled && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    📋 問診表をメールでお送りします。事前にご記入をお願いいたします。
                  </p>
                </div>
              )}

              <div className="text-center pt-4">
                <Button
                  onClick={() => {
                    setBookingCompleted(false)
                    setBookingData({
                      isNewPatient: true,
                      selectedMenu: '',
                      selectedDate: '',
                      selectedTime: '',
                      selectedStaff: '',
                      patientName: '',
                      patientPhone: '',
                      patientEmail: '',
                      patientRequest: ''
                    })
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  トップに戻る
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          {isRescheduleMode ? (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">予約日時の変更</h1>
              <p className="text-gray-600">新しい日時をお選びください</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Web予約</h1>
              <p className="text-gray-600">簡単にオンラインで予約できます</p>
            </>
          )}
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* キャンセルポリシー表示（予約変更モードでは非表示） */}
          {webSettings.showCancelPolicy && !isRescheduleMode && (
            <Card>
              <CardHeader>
                <CardTitle>医院からのメッセージ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {webSettings.cancelPolicyText}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ1: 初診/再診選択（予約変更モードでは非表示） */}
          {webSettings.flow.initialSelection && !isRescheduleMode && (
            <Card>
              <CardHeader>
                <CardTitle>初診/再診の選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* 初診ボタン - acceptNewPatientがtrueの時のみ表示 */}
                  {webSettings?.acceptNewPatient && (
                    <button
                      onClick={() => {
                        setBookingData(prev => ({ ...prev, isNewPatient: true }))
                        setTimeout(() => scrollToSection(menuSectionRef), 300)
                      }}
                      className={`w-full p-4 border-2 rounded-lg transition-colors ${
                        bookingData.isNewPatient
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-left">
                        <h3 className="font-medium">初診</h3>
                        <p className="text-sm text-gray-600">初めてご来院される方</p>
                      </div>
                    </button>
                  )}

                  {/* 再診ボタン - acceptReturningPatientがtrueの時のみ表示 */}
                  {webSettings?.acceptReturningPatient && (
                    <button
                      onClick={() => {
                        setBookingData(prev => ({ ...prev, isNewPatient: false }))
                        setIsAuthenticated(false)
                        setAuthenticatedPatient(null)
                        setTimeout(() => scrollToSection(authSectionRef), 300)
                      }}
                      className={`w-full p-4 border-2 rounded-lg transition-colors ${
                        !bookingData.isNewPatient
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-left">
                        <h3 className="font-medium">再診</h3>
                        <p className="text-sm text-gray-600">過去にご来院されたことがある方</p>
                      </div>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 再診患者認証画面 */}
          {!bookingData.isNewPatient && !isAuthenticated && (
            <Card ref={authSectionRef}>
              <CardHeader>
                <CardTitle>患者情報の確認</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  以下のいずれか1つと生年月日を入力してください
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 認証情報入力 */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auth_patient_number">診察券番号</Label>
                    <Input
                      id="auth_patient_number"
                      value={authData.patientNumber}
                      onChange={(e) => setAuthData(prev => ({ ...prev, patientNumber: e.target.value }))}
                      placeholder="例: 12345"
                    />
                  </div>

                  <div>
                    <Label htmlFor="auth_phone">電話番号</Label>
                    <Input
                      id="auth_phone"
                      value={authData.phone}
                      onChange={(e) => setAuthData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="例: 03-1234-5678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="auth_email">メールアドレス</Label>
                    <Input
                      id="auth_email"
                      type="email"
                      value={authData.email}
                      onChange={(e) => setAuthData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="例: tanaka@example.com"
                    />
                  </div>

                  {/* 生年月日（年月日別々） */}
                  <div>
                    <Label>生年月日 *</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <Input
                        placeholder="年 (例: 1990)"
                        value={authData.birthYear}
                        onChange={(e) => setAuthData(prev => ({ ...prev, birthYear: e.target.value }))}
                        maxLength={4}
                      />
                      <Input
                        placeholder="月 (例: 01)"
                        value={authData.birthMonth}
                        onChange={(e) => setAuthData(prev => ({ ...prev, birthMonth: e.target.value }))}
                        maxLength={2}
                      />
                      <Input
                        placeholder="日 (例: 01)"
                        value={authData.birthDay}
                        onChange={(e) => setAuthData(prev => ({ ...prev, birthDay: e.target.value }))}
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {authError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 mb-2">{authError}</p>
                    {clinicPhone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-700 mt-2 pt-2 border-t border-red-200">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">お困りの方はお電話ください:</span>
                        <a
                          href={`tel:${clinicPhone.replace(/[^0-9]/g, '')}`}
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          {clinicPhone}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 認証ボタン */}
                <div className="flex justify-center pt-2">
                  <Button onClick={handleAuthenticate} size="lg" className="w-full max-w-xs">
                    ログイン
                  </Button>
                </div>

                {/* 診察券番号がわからない場合 */}
                {clinicPhone && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">診察券番号がわからない方</p>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a
                        href={`tel:${clinicPhone.replace(/[^0-9]/g, '')}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {clinicPhone} にお電話ください
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ステップ2: 診療メニュー選択（予約変更モードでは非表示） */}
          {webSettings.flow.menuSelection && (bookingData.isNewPatient || isAuthenticated) && !isRescheduleMode && (
            <Card ref={menuSectionRef}>
              <CardHeader>
                <CardTitle>診療メニューの選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {webBookingMenus.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>現在、Web予約可能なメニューがありません。</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {webBookingMenus
                      .filter(menu => {
                        // 初診/再診の設定に基づいてフィルタリング
                        if (bookingData.isNewPatient) {
                          return menu.allow_new_patient !== false
                        } else {
                          return menu.allow_returning !== false
                        }
                      })
                      .map(menu => (
                        <button
                          key={menu.id}
                          onClick={() => {
                            setBookingData(prev => ({ ...prev, selectedMenu: menu.treatment_menu_id, selectedStaff: '' }))
                            // メニュー選択イベントをトラッキング
                            trackButtonClick(clinicId, 'MENU_SELECTION', menu.display_name || menu.treatment_menu_name, {
                              menu_id: menu.treatment_menu_id,
                              duration: menu.duration,
                              is_new_patient: bookingData.isNewPatient
                            })
                            // 担当者選択が有効ならそちらへ、なければカレンダーへスクロール
                            setTimeout(() => scrollToSection(webSettings.flow.staffSelection ? staffSectionRef : calendarSectionRef), 300)
                          }}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            bookingData.selectedMenu === menu.treatment_menu_id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {menu.display_name || menu.treatment_menu_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              所要時間: {menu.duration}分
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ステップ2.5: 担当者選択（staffSelection有効時のみ） */}
          {webSettings.flow.staffSelection && bookingData.selectedMenu && !isRescheduleMode && (
            <Card ref={staffSectionRef}>
              <CardHeader>
                <CardTitle>担当者の選択</CardTitle>
                <p className="text-sm text-gray-600">
                  ご希望の担当者を選択してください（「指名なし」も選択できます）
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const selectedWebMenu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
                  const stepStaffIds = selectedWebMenu?.steps?.[0]?.staff_assignments?.map((sa: any) => sa.staff_id) || []
                  const availableStaff = stepStaffIds.length > 0
                    ? staff.filter(s => stepStaffIds.includes(s.id) && s.is_active !== false)
                    : staff.filter(s => s.is_active !== false)
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* 指名なしオプション */}
                      <button
                        onClick={() => {
                          setBookingData(prev => ({ ...prev, selectedStaff: '' }))
                          setTimeout(() => scrollToSection(calendarSectionRef), 300)
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          bookingData.selectedStaff === ''
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">指名なし</h3>
                          <p className="text-sm text-gray-600">自動で担当者を割り当てます</p>
                        </div>
                      </button>
                      {/* スタッフ一覧 */}
                      {availableStaff.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setBookingData(prev => ({ ...prev, selectedStaff: s.id }))
                            setTimeout(() => scrollToSection(calendarSectionRef), 300)
                          }}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            bookingData.selectedStaff === s.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1">{s.name}</h3>
                            {s.position?.name && (
                              <p className="text-sm text-gray-600">{s.position.name}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* ステップ3: カレンダー表示 */}
          {webSettings.flow.calendarDisplay && (bookingData.isNewPatient || isAuthenticated) && (
            <Card ref={calendarSectionRef}>
              <CardHeader>
                <CardTitle>日時選択</CardTitle>
                <p className="text-sm text-gray-600">
                  ⭕️をクリックして予約日時を選択してください
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 週ナビゲーション */}
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousWeek}
                    className="px-2 py-1 text-xs shrink-0"
                    disabled={weekStartDate <= new Date(new Date().setHours(0,0,0,0))}
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    先週
                  </Button>
                  <div className="text-sm font-medium text-center flex-1">
                    {format(weekStartDate, 'MM月dd日', { locale: ja })} - {format(addDays(weekStartDate, 6), 'MM月dd日', { locale: ja })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                    className="px-2 py-1 text-xs shrink-0"
                    disabled={addWeeks(weekStartDate, 1) > addDays(new Date(), webSettings?.reservationPeriod || 30)}
                  >
                    次週
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* デバッグ情報 */}
                {allTimeSlots.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      時間スロットが生成されていません。診療時間設定を確認してください。
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      診療時間設定キー: {Object.keys(businessHours).join(', ')}
                    </p>
                  </div>
                )}

                {/* 1週間分のカレンダー（常に7日分表示、過去日はグレーアウト） */}
                {(() => {
                  const visibleDayOffsets = [0, 1, 2, 3, 4, 5, 6]
                  return (
                <div className="-mx-2 sm:mx-0">
                  {/* ヘッダー（固定） */}
                  <div className="overflow-hidden">
                    <table className="w-full border-collapse text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '40px' }} className="sm:w-16" />
                        {visibleDayOffsets.map(i => <col key={i} />)}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border p-1 sm:p-2 bg-gray-50 font-medium">時間</th>
                          {visibleDayOffsets.map(dayOffset => {
                            const date = addDays(weekStartDate, dayOffset)
                            const dayName = format(date, 'E', { locale: ja })
                            return (
                              <th key={dayOffset} className="border p-1 bg-gray-50 font-medium">
                                <div className="text-[10px] sm:text-xs leading-tight">{dayName}</div>
                                <div className="text-[9px] sm:text-xs text-gray-600">{format(date, 'MM/dd')}</div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* ボディ（スクロール可能） */}
                  <div className="overflow-y-auto max-h-96 scrollbar-hide">
                    <table className="w-full border-collapse text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '40px' }} className="sm:w-16" />
                        {visibleDayOffsets.map(i => <col key={i} />)}
                      </colgroup>
                      <tbody>
                        {/* 時間ごとの行を生成 */}
                        {allTimeSlots.map(time => (
                          <tr key={time}>
                            <td className="border p-0.5 sm:p-1 text-[10px] sm:text-sm text-gray-600 text-center">{time}</td>
                            {visibleDayOffsets.map(dayOffset => {
                              const date = addDays(weekStartDate, dayOffset)
                              const dateString = format(date, 'yyyy-MM-dd')
                              const slot = availableSlots.find(
                                s => s.date === dateString && s.time === time
                              )
                              const isSelected = bookingData.selectedDate === dateString && bookingData.selectedTime === time

                              // 予約可能期間を超えているかチェック
                              const maxDate = addDays(new Date(), webSettings?.reservationPeriod || 30)
                              const isWithinPeriod = date <= maxDate

                              // 現在の日時より過去かどうかをチェック
                              const now = new Date()
                              const [hours, minutes] = time.split(':').map(Number)
                              const slotDateTime = new Date(date)
                              slotDateTime.setHours(hours, minutes, 0, 0)
                              const isPast = slotDateTime < now

                              // スロットが存在しない、または利用不可の場合は❌
                              const isAvailable = slot?.available === true && isWithinPeriod && !isPast

                              return (
                                <td key={dayOffset} className="border p-0.5 sm:p-1">
                                  <button
                                    onClick={() => {
                                      if (isAvailable) {
                                        handleSlotSelect(dateString, time)
                                      }
                                    }}
                                    disabled={!isAvailable}
                                    className={`w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600 text-white'
                                        : isAvailable
                                          ? 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    }`}
                                  >
                                    {isAvailable ? '⭕️' : '❌'}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                  )
                })()}

                {/* 凡例 */}
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">⭕️</span>
                    <span>予約可能</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">❌</span>
                    <span>予約不可</span>
                  </div>
                </div>

                {bookingData.selectedDate && bookingData.selectedTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-900">
                      選択中: {format(parse(bookingData.selectedDate, 'yyyy-MM-dd', new Date()), 'yyyy年MM月dd日(E)', { locale: ja })} {bookingData.selectedTime}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ステップ4: 患者情報入力 */}
          {webSettings.flow.patientInfo && bookingData.isNewPatient && (
            <Card ref={patientInfoSectionRef}>
              <CardHeader>
                <CardTitle>患者情報入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`grid gap-4 ${webSettings?.patientInfoFields?.phoneEnabled ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div>
                    <Label htmlFor="patientName">お名前 *</Label>
                    <Input
                      id="patientName"
                      value={bookingData.patientName}
                      onChange={(e) => setBookingData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="例: 田中太郎"
                    />
                  </div>
                  {webSettings?.patientInfoFields?.phoneEnabled && (
                    <div>
                      <Label htmlFor="patientPhone">
                        電話番号 {webSettings?.patientInfoFields?.phoneRequired ? '*' : ''}
                      </Label>
                      <Input
                        id="patientPhone"
                        value={bookingData.patientPhone}
                        onChange={(e) => {
                          const newPhone = e.target.value
                          setBookingData(prev => ({ ...prev, patientPhone: newPhone }))
                          // 必須項目が全て揃ったら確認セクションへスクロール
                          const nameOk = !!bookingData.patientName.trim()
                          const phoneOk = !webSettings.patientInfoFields.phoneRequired || !!newPhone.trim()
                          const emailOk = !webSettings.patientInfoFields.emailRequired || !!bookingData.patientEmail.trim()
                          if (nameOk && phoneOk && emailOk) {
                            setTimeout(() => scrollToSection(confirmationSectionRef), 500)
                          }
                        }}
                        placeholder="例: 03-1234-5678"
                      />
                    </div>
                  )}
                </div>
                {webSettings?.patientInfoFields?.emailEnabled && (
                  <div>
                    <Label htmlFor="patientEmail">
                      メールアドレス {webSettings?.patientInfoFields?.emailRequired ? '*' : ''}
                    </Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={bookingData.patientEmail}
                      onChange={(e) => {
                        const newEmail = e.target.value
                        setBookingData(prev => ({ ...prev, patientEmail: newEmail }))
                        // 必須項目が全て揃ったら確認セクションへスクロール
                        const nameOk = !!bookingData.patientName.trim()
                        const phoneOk = !webSettings.patientInfoFields.phoneRequired || !!bookingData.patientPhone.trim()
                        const emailOk = !webSettings.patientInfoFields.emailRequired || !!newEmail.trim()
                        if (nameOk && phoneOk && emailOk) {
                          setTimeout(() => scrollToSection(confirmationSectionRef), 500)
                        }
                      }}
                      placeholder="例: tanaka@example.com"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="patientRequest">ご要望・ご相談など（任意）</Label>
                  <textarea
                    id="patientRequest"
                    value={bookingData.patientRequest}
                    onChange={(e) => setBookingData(prev => ({ ...prev, patientRequest: e.target.value }))}
                    placeholder="ご要望やご相談がございましたらご記入ください"
                    className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ5: 確認・確定 */}
          {webSettings.flow.confirmation && (bookingData.isNewPatient || isAuthenticated) &&
            // 初診の場合は必須項目が全て入力されるまで表示しない
            (!bookingData.isNewPatient || (
              bookingData.patientName.trim() &&
              bookingData.selectedDate &&
              bookingData.selectedTime &&
              (!webSettings.patientInfoFields.phoneRequired || bookingData.patientPhone.trim()) &&
              (!webSettings.patientInfoFields.emailRequired || bookingData.patientEmail.trim())
            )) && (
            <Card ref={confirmationSectionRef}>
              <CardHeader>
                <CardTitle>{isRescheduleMode ? '変更内容確認' : '予約内容確認'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">予約日時:</span>
                    <span>{bookingData.selectedDate} {bookingData.selectedTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">診療メニュー:</span>
                    <span>
                      {(() => {
                        // 予約変更モードで元の診療メニューがある場合
                        if (isRescheduleMode && originalAppointmentData.menu1_id) {
                          const menu = treatmentMenus.find(m => m.id === originalAppointmentData.menu1_id)
                          return menu?.name || '（元の予約から引き継ぎ）'
                        }
                        // 通常モード
                        const menu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
                        return menu?.display_name || menu?.treatment_menu_name || ''
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">診療時間:</span>
                    <span>
                      {(() => {
                        // 予約変更モードで元の所要時間がある場合
                        if (isRescheduleMode && originalAppointmentData.duration) {
                          return `${originalAppointmentData.duration}分`
                        }
                        // 通常モード
                        const menu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
                        return menu?.duration ? `${menu.duration}分` : ''
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">患者名:</span>
                    <span>{bookingData.patientName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">電話番号:</span>
                    <span>{bookingData.patientPhone}</span>
                  </div>
                  {!isRescheduleMode && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">診療種別:</span>
                      <span>{bookingData.isNewPatient ? '初診' : '再診'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-center text-sm text-gray-500">
                    上記内容でよろしければボタンを押してください
                  </p>
                  <div className="flex justify-center">
                    <Button onClick={handleConfirmBooking} size="lg" className="w-full max-w-xs">
                      {isRescheduleMode ? '予約を変更する' : '予約を確定する'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 問診表モーダル */}
        {showQuestionnaire && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>問診表の送信</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  予約確定後、問診表をメールでお送りします。
                  ご記入をお願いいたします。
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    <strong>送信先:</strong> {bookingData.patientEmail || 'メールアドレスが未入力です'}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>有効期間:</strong> {questionnaireSettings?.validPeriod || 7}日間
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuestionnaire(false)}
                  >
                    キャンセル
                  </Button>
                  <Button 
                    onClick={handleSendQuestionnaire}
                    disabled={!bookingData.patientEmail}
                  >
                    問診表を送信
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WebBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <WebBookingPageInner />
    </Suspense>
  )
}
