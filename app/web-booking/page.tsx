'use client'

import { useState, useEffect, useRef } from 'react'
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
import { getWeeklySlots } from '@/lib/api/web-booking'
import { Calendar, Clock, User, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks } from 'date-fns'
import { ja } from 'date-fns/locale'
import { trackPageView, trackButtonClick, trackFormSubmit } from '@/lib/tracking/funnel-tracker'
import { getStoredUTMData } from '@/lib/tracking/utm-tracker'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

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

export default function WebBookingPage() {
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
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })) // 月曜始まり
  const [timeSlotMinutes, setTimeSlotMinutes] = useState<number>(15)
  const [businessHours, setBusinessHours] = useState<any>({})
  const [allTimeSlots, setAllTimeSlots] = useState<string[]>([])

  // セクションへの参照
  const menuSectionRef = useRef<HTMLDivElement>(null)
  const calendarSectionRef = useRef<HTMLDivElement>(null)
  const patientInfoSectionRef = useRef<HTMLDivElement>(null)
  const confirmationSectionRef = useRef<HTMLDivElement>(null)

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
    // ランディングページビューを記録
    trackPageView(DEMO_CLINIC_ID, 'LANDING', {
      page: 'web-booking',
      has_utm: getStoredUTMData() !== null
    })
  }, [])

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [settings, menus, staffData, clinic] = await Promise.all([
          getClinicSettings(DEMO_CLINIC_ID),
          getTreatmentMenus(DEMO_CLINIC_ID),
          getStaff(DEMO_CLINIC_ID),
          getBusinessHours(DEMO_CLINIC_ID)
        ])

        console.log('Web予約: 取得した設定', settings)
        console.log('Web予約: 取得した診療時間', clinic)

        const webReservation = settings.web_reservation || {
          isEnabled: false,
          reservationPeriod: 30,
          allowCurrentTime: true,
          openAllSlots: false,
          allowStaffSelection: true,
          webPageUrl: '',
          showCancelPolicy: false,
          cancelPolicyText: `◆当院のキャンセルポリシー◆

数ある歯科医院の中から駒沢公園通り　西垣歯科・矯正歯科をお選びいただき誠にありがとうございます。
当クリニックでは患者さま一人一人により良い医療を提供するため、30〜45分の長い治療時間を確保してお待ちしております。尚かつ適切な処置時間を確保するために予約制となっております。

予約時間に遅れての来院は十分な時間が確保できず、予定通りの処置が行えない場合があります。
また、予定時間に遅れが生じる事で、次に来院予定の患者さまに多大なご迷惑をおかけする恐れがありますので、予約時間前の来院にご協力をお願い致します。
止むを得ず遅れる場合や、体調不良などでキャンセルを希望される場合は早めのご連絡をお願い致します。
予約の際には確実に来院できる日にちと時間をご確認下さい。`,
          patientInfoFields: {
            phoneRequired: true,
            phoneEnabled: true,
            emailRequired: false,
            emailEnabled: true
          },
          flow: {
            initialSelection: true,
            menuSelection: true,
            calendarDisplay: true,
            patientInfo: true,
            confirmation: true
          }
        }

        setWebSettings(webReservation)

        // Web予約メニューを取得（booking_menusがあればそれを使用、なければ全メニュー）
        const bookingMenus = webReservation.booking_menus || []
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

        // 時間スロット設定と診療時間を保存
        setTimeSlotMinutes(settings.time_slot_minutes || 15)
        setBusinessHours(clinic || {})
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 週間空き枠を取得
  const loadWeeklySlots = async () => {
    if (!bookingData.selectedMenu) return

    try {
      const slots = await getWeeklySlots(
        DEMO_CLINIC_ID,
        bookingData.selectedMenu,
        bookingData.isNewPatient,
        weekStartDate
      )
      setAvailableSlots(slots)
    } catch (error) {
      console.error('空き枠取得エラー:', error)
      alert('空き枠の取得に失敗しました')
    }
  }

  // 診療メニューや週が変更されたら空き枠を再取得
  useEffect(() => {
    if (bookingData.selectedMenu) {
      loadWeeklySlots()
    }
  }, [bookingData.selectedMenu, bookingData.isNewPatient, weekStartDate])

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
    setWeekStartDate(prev => addWeeks(prev, -1))
  }

  const goToNextWeek = () => {
    setWeekStartDate(prev => addWeeks(prev, 1))
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

  // 日付と時間選択時の処理
  const handleSlotSelect = (date: string, time: string) => {
    setBookingData(prev => ({ ...prev, selectedDate: date, selectedTime: time }))
    // 時間選択イベントをトラッキング
    trackButtonClick(DEMO_CLINIC_ID, 'TIME_SELECTION', `${date} ${time}`, {
      date,
      time,
      menu_id: bookingData.selectedMenu
    })
    setTimeout(() => scrollToSection(patientInfoSectionRef), 300)
  }

  // 予約確定
  const handleConfirmBooking = async () => {
    try {
      // 選択されたメニュー情報を取得（treatmentMenusから取得）
      const selectedMenuData = treatmentMenus.find(m => m.id === bookingData.selectedMenu)
      if (!selectedMenuData) {
        console.error('メニュー情報が見つかりません', {
          selectedMenuId: bookingData.selectedMenu,
          webBookingMenus,
          treatmentMenus
        })
        alert('メニュー情報が見つかりません。')
        return
      }

      console.log('Web予約: 選択されたメニュー', selectedMenuData)

      // 所要時間から終了時間を計算
      const [startHour, startMinute] = bookingData.selectedTime.split(':').map(Number)
      const startMinutes = startHour * 60 + startMinute
      const duration = selectedMenuData.duration || 30 // デフォルト30分
      const endMinutes = startMinutes + duration
      const endHour = Math.floor(endMinutes / 60)
      const endMinute = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`

      // 担当スタッフを決定（選択されていない場合はメニューの担当者から取得）
      let staffId = bookingData.selectedStaff
      if (!staffId && selectedMenuData.steps && selectedMenuData.steps.length > 0) {
        // 最初のステップの担当者を使用
        const firstStep = selectedMenuData.steps[0]
        if (firstStep.staff_assignments && firstStep.staff_assignments.length > 0) {
          staffId = firstStep.staff_assignments[0]
        }
      }

      // Web予約用の仮患者IDを作成
      const tempPatientId = `web-booking-temp-${Date.now()}`

      // 仮患者データをlocalStorageに保存（本登録時に更新するため）
      const { addMockPatient } = await import('@/lib/utils/mock-mode')
      const nameParts = bookingData.patientName.split(' ')
      const tempPatient = {
        id: tempPatientId,
        clinic_id: DEMO_CLINIC_ID,
        last_name: nameParts[0] || '',
        first_name: nameParts[1] || '',
        last_name_kana: '',
        first_name_kana: '',
        phone: bookingData.patientPhone,
        email: bookingData.patientEmail,
        patient_number: null,
        is_registered: false, // 仮登録状態
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      addMockPatient(tempPatient)
      console.log('Web予約: 仮患者データを作成しました', tempPatient)

      // 実際の予約作成APIを呼び出す
      const appointmentData = {
        patient_id: tempPatientId,
        appointment_date: bookingData.selectedDate,
        start_time: bookingData.selectedTime,
        end_time: endTime,
        menu1_id: bookingData.selectedMenu,
        staff1_id: staffId,
        status: '未来院', // 初回ステータスを「未来院」に設定
        notes: `Web予約\n氏名: ${bookingData.patientName}\n電話: ${bookingData.patientPhone}\nメール: ${bookingData.patientEmail}${bookingData.patientRequest ? `\n\nご要望・ご相談:\n${bookingData.patientRequest}` : ''}`,
        is_new_patient: bookingData.isNewPatient
      }

      console.log('Web予約: 予約作成データ', appointmentData)
      const createdAppointment = await createAppointment(DEMO_CLINIC_ID, appointmentData)

      // 予約完了イベントをトラッキング
      await trackFormSubmit(DEMO_CLINIC_ID, 'COMPLETE', {
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
            patient_id: tempPatientId,
            clinic_id: DEMO_CLINIC_ID,
            utm_data: utmData,
            questionnaire_source: null, // 問診表からの回答は別途設定
            questionnaire_detail: null
          })
        })
      } catch (error) {
        console.error('獲得経路保存エラー:', error)
        // エラーが発生しても予約処理は継続
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Web予約</h1>
          <p className="text-gray-600">簡単にオンラインで予約できます</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* キャンセルポリシー表示 */}
          {webSettings.showCancelPolicy && (
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

          {/* ステップ1: 初診/再診選択 */}
          {webSettings.flow.initialSelection && (
            <Card>
              <CardHeader>
                <CardTitle>初診/再診の選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
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
                  <button
                    onClick={() => {
                      setBookingData(prev => ({ ...prev, isNewPatient: false }))
                      setTimeout(() => scrollToSection(menuSectionRef), 300)
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
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ2: 診療メニュー選択 */}
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
                            setBookingData(prev => ({ ...prev, selectedMenu: menu.treatment_menu_id }))
                            // メニュー選択イベントをトラッキング
                            trackButtonClick(DEMO_CLINIC_ID, 'MENU_SELECTION', menu.display_name || menu.treatment_menu_name, {
                              menu_id: menu.treatment_menu_id,
                              duration: menu.duration,
                              is_new_patient: bookingData.isNewPatient
                            })
                            setTimeout(() => scrollToSection(calendarSectionRef), 300)
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

          {/* ステップ3: カレンダー表示 */}
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
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek} className="px-2 py-1 text-xs shrink-0">
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    先週
                  </Button>
                  <div className="text-sm font-medium text-center flex-1">
                    {format(weekStartDate, 'MM月dd日', { locale: ja })} - {format(addDays(weekStartDate, 6), 'MM月dd日', { locale: ja })}
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextWeek} className="px-2 py-1 text-xs shrink-0">
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

                {/* 1週間分のカレンダー */}
                <div className="-mx-2 sm:mx-0">
                  {/* ヘッダー（固定） */}
                  <div className="overflow-hidden">
                    <table className="w-full border-collapse text-xs sm:text-sm" style={{ tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '40px' }} className="sm:w-16" />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="border p-1 sm:p-2 bg-gray-50 font-medium">時間</th>
                          {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                            const date = addDays(weekStartDate, dayOffset)
                            const dateString = format(date, 'yyyy-MM-dd')
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
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                        <col />
                      </colgroup>
                      <tbody>
                        {/* 時間ごとの行を生成 */}
                        {allTimeSlots.map(time => (
                          <tr key={time}>
                            <td className="border p-0.5 sm:p-1 text-[10px] sm:text-sm text-gray-600 text-center">{time}</td>
                            {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                              const date = addDays(weekStartDate, dayOffset)
                              const dateString = format(date, 'yyyy-MM-dd')
                              const slot = availableSlots.find(
                                s => s.date === dateString && s.time === time
                              )
                              const isSelected = bookingData.selectedDate === dateString && bookingData.selectedTime === time

                              // スロットが存在しない、または利用不可の場合は❌
                              const isAvailable = slot?.available === true

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
                      選択中: {format(new Date(bookingData.selectedDate), 'yyyy年MM月dd日(E)', { locale: ja })} {bookingData.selectedTime}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* ステップ4: 患者情報入力 */}
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
                          // 名前と電話番号が両方入力されたら確認セクションへスクロール
                          if (bookingData.patientName && newPhone) {
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
                      onChange={(e) => setBookingData(prev => ({ ...prev, patientEmail: e.target.value }))}
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

          {/* ステップ5: 確認・確定 */}
          <Card ref={confirmationSectionRef}>
              <CardHeader>
                <CardTitle>予約内容確認</CardTitle>
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
                        const menu = webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)
                        return menu?.display_name || menu?.treatment_menu_name || ''
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">診療時間:</span>
                    <span>
                      {webBookingMenus.find(m => m.treatment_menu_id === bookingData.selectedMenu)?.duration || ''}分
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
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">診療種別:</span>
                    <span>{bookingData.isNewPatient ? '初診' : '再診'}</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleConfirmBooking} size="lg" className="w-full max-w-xs">
                    予約確定
                  </Button>
                </div>
              </CardContent>
            </Card>
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
