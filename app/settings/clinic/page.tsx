'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import { getClinic, getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

const WEEKDAYS = [
  { id: 'monday', name: '月曜日' },
  { id: 'tuesday', name: '火曜日' },
  { id: 'wednesday', name: '水曜日' },
  { id: 'thursday', name: '木曜日' },
  { id: 'friday', name: '金曜日' },
  { id: 'saturday', name: '土曜日' },
  { id: 'sunday', name: '日曜日' }
]

const TIME_SLOT_OPTIONS = [
  { value: 10, label: '10分' },
  { value: 15, label: '15分' },
  { value: 20, label: '20分' },
  { value: 30, label: '30分' },
  { value: 60, label: '60分' }
]

export default function ClinicSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // クリニック情報
  const [clinicInfo, setClinicInfo] = useState({
    name: '',
    name_kana: '',
    website_url: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line: '',
    phone: ''
  })
  
  // 診療時間設定
  const [businessHours, setBusinessHours] = useState<Record<string, { isOpen: boolean; start: string; end: string }>>({})
  const [breakTimes, setBreakTimes] = useState<Record<string, { start: string; end: string }>>({})
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15)
  
  // 休診日設定
  const [holidays, setHolidays] = useState<string[]>([])

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [clinic, settings] = await Promise.all([
          getClinic(DEMO_CLINIC_ID),
          getClinicSettings(DEMO_CLINIC_ID)
        ])
        
        if (clinic) {
          setClinicInfo({
            name: clinic.name || '',
            name_kana: clinic.name_kana || '',
            website_url: clinic.website_url || '',
            postal_code: clinic.postal_code || '',
            prefecture: clinic.prefecture || '',
            city: clinic.city || '',
            address_line: clinic.address_line || '',
            phone: clinic.phone || ''
          })
          
          setBusinessHours(clinic.business_hours || {})
          setBreakTimes(clinic.break_times || {})
          setTimeSlotMinutes(clinic.time_slot_minutes || 15)
        }
        
        // 休診日設定を読み込み
        const holidaySettings = settings.holidays || []
        setHolidays(holidaySettings)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // クリニック情報を保存
      await setClinicSetting(DEMO_CLINIC_ID, 'clinic_info', clinicInfo)
      await setClinicSetting(DEMO_CLINIC_ID, 'business_hours', businessHours)
      await setClinicSetting(DEMO_CLINIC_ID, 'break_times', breakTimes)
      await setClinicSetting(DEMO_CLINIC_ID, 'time_slot_minutes', timeSlotMinutes)
      await setClinicSetting(DEMO_CLINIC_ID, 'holidays', holidays)
      
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 診療時間の変更
  const handleBusinessHoursChange = (day: string, field: string, value: any) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // 休憩時間の変更
  const handleBreakTimesChange = (day: string, field: string, value: string) => {
    setBreakTimes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

  // 休診日の変更
  const handleHolidayChange = (day: string, checked: boolean) => {
    if (checked) {
      setHolidays(prev => [...prev, day])
    } else {
      setHolidays(prev => prev.filter(d => d !== day))
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* 左サイドバー */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">クリニック設定</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">クリニック設定</div>
                <div className="text-sm text-blue-600">クリニックの基本情報と診療時間の設定</div>
              </div>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">クリニック設定</h2>
                <p className="text-gray-600">クリニックの基本情報と診療時間を設定します</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* クリニック情報 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>クリニック情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">クリニック名（正式名称）</Label>
                    <Input
                      id="name"
                      value={clinicInfo.name}
                      onChange={(e) => setClinicInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="例: 田中歯科医院"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_kana">クリニック名（ふりがな）</Label>
                    <Input
                      id="name_kana"
                      value={clinicInfo.name_kana}
                      onChange={(e) => setClinicInfo(prev => ({ ...prev, name_kana: e.target.value }))}
                      placeholder="例: たなかしかいいん"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="website_url">ホームページURL</Label>
                  <Input
                    id="website_url"
                    value={clinicInfo.website_url}
                    onChange={(e) => setClinicInfo(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="例: https://example.com"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="postal_code">郵便番号</Label>
                    <Input
                      id="postal_code"
                      value={clinicInfo.postal_code}
                      onChange={(e) => setClinicInfo(prev => ({ ...prev, postal_code: e.target.value }))}
                      placeholder="例: 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prefecture">都道府県</Label>
                    <Input
                      id="prefecture"
                      value={clinicInfo.prefecture}
                      onChange={(e) => setClinicInfo(prev => ({ ...prev, prefecture: e.target.value }))}
                      placeholder="例: 東京都"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">市区町村</Label>
                    <Input
                      id="city"
                      value={clinicInfo.city}
                      onChange={(e) => setClinicInfo(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="例: 渋谷区"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address_line">住所（番地・建物名）</Label>
                  <Input
                    id="address_line"
                    value={clinicInfo.address_line}
                    onChange={(e) => setClinicInfo(prev => ({ ...prev, address_line: e.target.value }))}
                    placeholder="例: 1-2-3 田中ビル 2F"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">電話番号</Label>
                  <Input
                    id="phone"
                    value={clinicInfo.phone}
                    onChange={(e) => setClinicInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="例: 03-1234-5678"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 診療時間設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>診療時間設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>1コマ時間</Label>
                    <Select
                      value={timeSlotMinutes.toString()}
                      onValueChange={(value) => setTimeSlotMinutes(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOT_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {WEEKDAYS.map(day => (
                    <div key={day.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`open_${day.id}`}
                            checked={businessHours[day.id]?.isOpen || false}
                            onCheckedChange={(checked) => 
                              handleBusinessHoursChange(day.id, 'isOpen', checked)
                            }
                          />
                          <Label htmlFor={`open_${day.id}`} className="font-medium">
                            {day.name}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`holiday_${day.id}`}
                            checked={holidays.includes(day.id)}
                            onCheckedChange={(checked) => 
                              handleHolidayChange(day.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`holiday_${day.id}`} className="text-sm text-gray-600">
                            休診日
                          </Label>
                        </div>
                      </div>
                      
                      {businessHours[day.id]?.isOpen && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`start_${day.id}`}>開始時間</Label>
                            <Input
                              id={`start_${day.id}`}
                              type="time"
                              value={businessHours[day.id]?.start || '09:00'}
                              onChange={(e) => 
                                handleBusinessHoursChange(day.id, 'start', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`end_${day.id}`}>終了時間</Label>
                            <Input
                              id={`end_${day.id}`}
                              type="time"
                              value={businessHours[day.id]?.end || '18:00'}
                              onChange={(e) => 
                                handleBusinessHoursChange(day.id, 'end', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`break_start_${day.id}`}>休憩開始</Label>
                            <Input
                              id={`break_start_${day.id}`}
                              type="time"
                              value={breakTimes[day.id]?.start || '12:00'}
                              onChange={(e) => 
                                handleBreakTimesChange(day.id, 'start', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`break_end_${day.id}`}>休憩終了</Label>
                            <Input
                              id={`break_end_${day.id}`}
                              type="time"
                              value={breakTimes[day.id]?.end || '13:00'}
                              onChange={(e) => 
                                handleBreakTimesChange(day.id, 'end', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
