'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getClinicSettings, getBusinessHours, getBreakTimes } from '@/lib/api/clinic'
import { getTreatmentMenus } from '@/lib/api/treatment'
import { getStaff } from '@/lib/api/staff'
import { createAppointment } from '@/lib/api/appointments'
import { Calendar, Clock, User, CheckCircle } from 'lucide-react'

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

  // 空き枠を取得
  const loadAvailableSlots = async (date: string) => {
    try {
      const staffData = await getStaff(DEMO_CLINIC_ID)
      setWorkingStaff(staffData)
      
      // 診療時間と休憩時間を取得
      const [businessHours, breakTimes] = await Promise.all([
        getBusinessHours(DEMO_CLINIC_ID),
        getBreakTimes(DEMO_CLINIC_ID)
      ])
      
      const selectedDate = new Date(date)
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dayHours = businessHours[dayOfWeek]
      const dayBreaks = breakTimes[dayOfWeek]
      
      // 空き枠データを生成
      const slots = []
      const startHour = 9
      const endHour = 18
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          
          // 診療時間外かどうかをチェック
          const isOutsideBusinessHours = !dayHours?.isOpen || !dayHours?.timeSlots || 
            !dayHours.timeSlots.some((slot: any) => {
              const timeMinutes = hour * 60 + minute
              const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1])
              const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1])
              return timeMinutes >= startMinutes && timeMinutes < endMinutes
            })
          
          // 休憩時間かどうかをチェック
          const isBreakTime = dayBreaks?.start && dayBreaks?.end && (() => {
            const timeMinutes = hour * 60 + minute
            const breakStartMinutes = parseInt(dayBreaks.start.split(':')[0]) * 60 + parseInt(dayBreaks.start.split(':')[1])
            const breakEndMinutes = parseInt(dayBreaks.end.split(':')[0]) * 60 + parseInt(dayBreaks.end.split(':')[1])
            return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes
          })()
          
          // 診療時間外または休憩時間の場合は予約不可
          const available = !isOutsideBusinessHours && !isBreakTime && Math.random() > 0.3
          
          slots.push({
            time,
            available,
            isBreakTime,
            isOutsideBusinessHours,
            staff: staffData.map(s => s.name)
          })
        }
      }
      
      setAvailableSlots(slots)
    } catch (error) {
      console.error('空き枠取得エラー:', error)
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

  // 日付選択時の処理
  const handleDateSelect = (date: string) => {
    setBookingData(prev => ({ ...prev, selectedDate: date }))
    loadAvailableSlots(date)
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>希望日</Label>
                  <Input
                    type="date"
                    value={bookingData.selectedDate}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + webSettings.reservationPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  />
                </div>
                
                {bookingData.selectedDate && (
                  <div>
                    <Label>希望時間</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (slot.available && !slot.isBreakTime && !slot.isOutsideBusinessHours) {
                              setBookingData(prev => ({ ...prev, selectedTime: slot.time }))
                            }
                          }}
                          disabled={!slot.available || slot.isBreakTime || slot.isOutsideBusinessHours}
                          className={`p-2 text-sm rounded ${
                            slot.isBreakTime
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : slot.isOutsideBusinessHours
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : slot.available
                                  ? bookingData.selectedTime === slot.time
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-green-100 rounded"></div>
                        <span>空きあり</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-100 rounded"></div>
                        <span>予約済み</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span>休憩時間</span>
                      </div>
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
