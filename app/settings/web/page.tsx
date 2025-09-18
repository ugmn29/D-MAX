'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function WebReservationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Web予約設定
  const [webSettings, setWebSettings] = useState({
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

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        
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
      await setClinicSetting(DEMO_CLINIC_ID, 'web_reservation', webSettings)
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
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
              <h1 className="text-xl font-bold text-gray-900">Web予約</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">Web予約</div>
                <div className="text-sm text-blue-600">Web予約システムの設定</div>
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
                <h2 className="text-2xl font-bold text-gray-900">Web予約設定</h2>
                <p className="text-gray-600">Web予約システムの設定を行います</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* 基本設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="is_enabled"
                    checked={webSettings.isEnabled}
                    onCheckedChange={(checked) => 
                      setWebSettings(prev => ({ ...prev, isEnabled: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_enabled" className="font-medium">
                    Web予約機能を有効にする
                  </Label>
                </div>
                
                {webSettings.isEnabled && (
                  <>
                    <div>
                      <Label htmlFor="reservation_period">予約可能期間（日）</Label>
                      <Input
                        id="reservation_period"
                        type="number"
                        min="1"
                        max="365"
                        value={webSettings.reservationPeriod}
                        onChange={(e) => 
                          setWebSettings(prev => ({ 
                            ...prev, 
                            reservationPeriod: parseInt(e.target.value) || 30 
                          }))
                        }
                        className="max-w-xs"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="allow_current_time"
                        checked={webSettings.allowCurrentTime}
                        onCheckedChange={(checked) => 
                          setWebSettings(prev => ({ ...prev, allowCurrentTime: checked as boolean }))
                        }
                      />
                      <Label htmlFor="allow_current_time">
                        現在時刻・日付以降のみ予約可
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="open_all_slots"
                        checked={webSettings.openAllSlots}
                        onCheckedChange={(checked) => 
                          setWebSettings(prev => ({ ...prev, openAllSlots: checked as boolean }))
                        }
                      />
                      <Label htmlFor="open_all_slots">
                        全空き枠開放
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="allow_staff_selection"
                        checked={webSettings.allowStaffSelection}
                        onCheckedChange={(checked) => 
                          setWebSettings(prev => ({ ...prev, allowStaffSelection: checked as boolean }))
                        }
                      />
                      <Label htmlFor="allow_staff_selection">
                        担当者指定を許可
                      </Label>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Web予約ページ設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Web予約ページ設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="web_page_url">予約ページURL</Label>
                  <Input
                    id="web_page_url"
                    value={webSettings.webPageUrl}
                    onChange={(e) => 
                      setWebSettings(prev => ({ ...prev, webPageUrl: e.target.value }))
                    }
                    placeholder="例: https://example.com/reservation"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    患者がアクセスする予約ページのURLを設定してください
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 予約フロー設定 */}
            <Card>
              <CardHeader>
                <CardTitle>予約フロー設定</CardTitle>
                <p className="text-sm text-gray-600">予約フローの各ステップを設定します</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_initial"
                      checked={webSettings.flow.initialSelection}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          flow: { ...prev.flow, initialSelection: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="flow_initial" className="font-medium">
                        初診/再診選択
                      </Label>
                      <p className="text-sm text-gray-500">
                        患者が初診か再診かを選択するステップ
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_menu"
                      checked={webSettings.flow.menuSelection}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          flow: { ...prev.flow, menuSelection: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="flow_menu" className="font-medium">
                        診療メニュー選択
                      </Label>
                      <p className="text-sm text-gray-500">
                        患者が診療メニューを選択するステップ
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_calendar"
                      checked={webSettings.flow.calendarDisplay}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          flow: { ...prev.flow, calendarDisplay: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="flow_calendar" className="font-medium">
                        カレンダー表示
                      </Label>
                      <p className="text-sm text-gray-500">
                        1週間分の空き枠を表示するステップ
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_patient"
                      checked={webSettings.flow.patientInfo}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          flow: { ...prev.flow, patientInfo: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="flow_patient" className="font-medium">
                        患者情報入力
                      </Label>
                      <p className="text-sm text-gray-500">
                        名前・電話番号を入力するステップ（必須）
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_confirmation"
                      checked={webSettings.flow.confirmation}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          flow: { ...prev.flow, confirmation: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="flow_confirmation" className="font-medium">
                        確認・確定
                      </Label>
                      <p className="text-sm text-gray-500">
                        予約内容を確認して確定するステップ
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
