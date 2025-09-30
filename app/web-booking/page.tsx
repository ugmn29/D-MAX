'use client'

import { useState, useEffect } from 'react'
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

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface WebBookingSettings {
  isEnabled: boolean
  reservationPeriod: number
  allowCurrentTime: boolean
  openAllSlots: boolean
  allowStaffSelection: boolean
  webPageUrl: string
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
  const [treatmentMenus, setTreatmentMenus] = useState<any[]>([])
  const [workingStaff, setWorkingStaff] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [weekStartDate, setWeekStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })) // 月曜始まり

  // 予約データ
  const [bookingData, setBookingData] = useState({
    isNewPatient: true,
    selectedMenu: '',
    selectedDate: '',
    selectedTime: '',
    selectedStaff: '',
    patientName: '',
    patientPhone: '',
    patientEmail: ''
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [settings, menus] = await Promise.all([
          getClinicSettings(DEMO_CLINIC_ID),
          getTreatmentMenus(DEMO_CLINIC_ID)
        ])
        
        setWebSettings(settings.web_reservation || {
          isEnabled: false,
          reservationPeriod: 30,
          allowCurrentTime: true,
          openAllSlots: false,
          allowStaffSelection: true,
          webPageUrl: '',
          flow: {
            initialSelection: true,
            menuSelection: true,
            calendarDisplay: true,
            patientInfo: true,
            confirmation: true
          }
        })
        
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
        
        setTreatmentMenus(menus.filter(menu => menu.level === 1)) // 大分類のみ
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
    if (bookingData.selectedMenu && currentStep === 3) {
      loadWeeklySlots()
    }
  }, [bookingData.selectedMenu, bookingData.isNewPatient, weekStartDate, currentStep])

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
  }

  // 予約確定
  const handleConfirmBooking = async () => {
    try {
      // 実際の予約作成APIを呼び出す
      const appointmentData = {
        patient_id: 'temp-patient-id', // 実際の実装では患者IDを取得
        appointment_date: bookingData.selectedDate,
        start_time: bookingData.selectedTime,
        end_time: bookingData.selectedTime, // 実際の実装では終了時間を計算
        menu1_id: bookingData.selectedMenu,
        staff_id: bookingData.selectedStaff,
        // その他の必要なフィールドを追加
      }
      await createAppointment(DEMO_CLINIC_ID, appointmentData)
      
      // 問診表が有効で、予約前に送信する設定の場合
      if (questionnaireSettings?.isEnabled && questionnaireSettings.sendTiming === 'before_appointment') {
        setShowQuestionnaire(true)
      } else {
        alert('予約を確定しました。確認メールをお送りします。')
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Web予約</h1>
          <p className="text-gray-600">簡単にオンラインで予約できます</p>
        </div>

        {/* ステップインジケーター */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 5 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* ステップ1: 初診/再診選択 */}
          {currentStep === 1 && webSettings.flow.initialSelection && (
            <Card>
              <CardHeader>
                <CardTitle>初診/再診の選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setBookingData(prev => ({ ...prev, isNewPatient: true }))
                      nextStep()
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="font-medium">初診</h3>
                      <p className="text-sm text-gray-600">初めてご来院される方</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setBookingData(prev => ({ ...prev, isNewPatient: false }))
                      nextStep()
                    }}
                    className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
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
          {currentStep === 2 && webSettings.flow.menuSelection && (
            <Card>
              <CardHeader>
                <CardTitle>診療メニューの選択</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>診療メニュー</Label>
                  <Select value={bookingData.selectedMenu} onValueChange={(value) => setBookingData(prev => ({ ...prev, selectedMenu: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="診療メニューを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentMenus.map(menu => (
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
                <div className="flex justify-end">
                  <Button onClick={nextStep} disabled={!bookingData.selectedMenu}>
                    次へ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ3: カレンダー表示 */}
          {currentStep === 3 && webSettings.flow.calendarDisplay && (
            <Card>
              <CardHeader>
                <CardTitle>日時選択</CardTitle>
                <p className="text-sm text-gray-600">
                  ⭕️をクリックして予約日時を選択してください
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 週ナビゲーション */}
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    前の週
                  </Button>
                  <div className="text-sm font-medium">
                    {format(weekStartDate, 'yyyy年MM月dd日', { locale: ja })} - {format(addDays(weekStartDate, 6), 'MM月dd日', { locale: ja })}
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextWeek}>
                    次の週
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* 1週間分のカレンダー */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-50 text-sm font-medium w-20">時間</th>
                        {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                          const date = addDays(weekStartDate, dayOffset)
                          const dateString = format(date, 'yyyy-MM-dd')
                          const dayName = format(date, 'E', { locale: ja })
                          return (
                            <th key={dayOffset} className="border p-2 bg-gray-50 text-sm font-medium">
                              <div>{dayName}</div>
                              <div className="text-xs text-gray-600">{format(date, 'MM/dd')}</div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 時間ごとの行を生成 */}
                      {Array.from(new Set(availableSlots.map(s => s.time)))
                        .sort()
                        .map(time => (
                          <tr key={time}>
                            <td className="border p-2 text-sm text-gray-600 text-center">{time}</td>
                            {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                              const date = addDays(weekStartDate, dayOffset)
                              const dateString = format(date, 'yyyy-MM-dd')
                              const slot = availableSlots.find(
                                s => s.date === dateString && s.time === time
                              )
                              const isSelected = bookingData.selectedDate === dateString && bookingData.selectedTime === time

                              return (
                                <td key={dayOffset} className="border p-1">
                                  <button
                                    onClick={() => {
                                      if (slot?.available) {
                                        handleSlotSelect(dateString, time)
                                      }
                                    }}
                                    disabled={!slot?.available}
                                    className={`w-full h-10 flex items-center justify-center text-lg font-bold rounded transition-colors ${
                                      isSelected
                                        ? 'bg-blue-600 text-white'
                                        : slot?.available
                                          ? 'bg-green-50 text-green-600 hover:bg-green-100 cursor-pointer'
                                          : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                                    }`}
                                  >
                                    {slot?.available ? '⭕️' : '❌'}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
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

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    戻る
                  </Button>
                  <Button onClick={nextStep} disabled={!bookingData.selectedDate || !bookingData.selectedTime}>
                    次へ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ4: 患者情報入力 */}
          {currentStep === 4 && webSettings.flow.patientInfo && (
            <Card>
              <CardHeader>
                <CardTitle>患者情報入力</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">お名前 *</Label>
                    <Input
                      id="patientName"
                      value={bookingData.patientName}
                      onChange={(e) => setBookingData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="例: 田中太郎"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientPhone">電話番号 *</Label>
                    <Input
                      id="patientPhone"
                      value={bookingData.patientPhone}
                      onChange={(e) => setBookingData(prev => ({ ...prev, patientPhone: e.target.value }))}
                      placeholder="例: 03-1234-5678"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="patientEmail">メールアドレス</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={bookingData.patientEmail}
                    onChange={(e) => setBookingData(prev => ({ ...prev, patientEmail: e.target.value }))}
                    placeholder="例: tanaka@example.com"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    戻る
                  </Button>
                  <Button onClick={nextStep} disabled={!bookingData.patientName || !bookingData.patientPhone}>
                    次へ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ステップ5: 確認・確定 */}
          {currentStep === 5 && webSettings.flow.confirmation && (
            <Card>
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
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    戻る
                  </Button>
                  <Button onClick={handleConfirmBooking}>
                    予約確定
                  </Button>
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
