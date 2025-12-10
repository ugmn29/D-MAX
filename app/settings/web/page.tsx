'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Plus, Trash2, Edit3, Settings, ArrowRight, Stethoscope, Copy, ExternalLink } from 'lucide-react'
import { getClinicSettings, setClinicSetting, getClinic } from '@/lib/api/clinic'
import { getTreatmentMenus, updateTreatmentMenu } from '@/lib/api/treatment'
import { getStaff } from '@/lib/api/staff'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function WebReservationSettingsPage() {
  // デバッグ: ファイルが読み込まれているか確認
  console.log('🔍 WebReservationSettingsPage component loaded at:', new Date().toISOString())
  
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clinic, setClinic] = useState<any>(null)

  // Web予約設定
  const [webSettings, setWebSettings] = useState({
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
    flow: {
      initialSelection: true,
      menuSelection: true,
      calendarDisplay: true,
      patientInfo: true,
      confirmation: true
    }
  })

  // 診療メニューとスタッフ
  const [treatmentMenus, setTreatmentMenus] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])

  // Web予約メニュー
  const [webBookingMenus, setWebBookingMenus] = useState<any[]>([])

  // タブ状態
  const [activeTab, setActiveTab] = useState<'basic' | 'flow' | 'menu'>('flow')

  // プレビュータブ状態（初診/再診）
  const [previewTab, setPreviewTab] = useState<'new' | 'returning'>('new')

  // ダイアログ状態
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCancelPolicyDialogOpen, setIsCancelPolicyDialogOpen] = useState(false)
  const [tempCancelPolicyText, setTempCancelPolicyText] = useState('')
  const [newWebMenu, setNewWebMenu] = useState({
    treatment_menu_id: '',
    duration: 30,
    staff_ids: [] as string[],
    allow_new_patient: true,
    allow_returning: true,
    steps: [] as any[]
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [clinicData, settings, menus, staffData] = await Promise.all([
          getClinic(DEMO_CLINIC_ID),
          getClinicSettings(DEMO_CLINIC_ID),
          getTreatmentMenus(DEMO_CLINIC_ID),
          getStaff(DEMO_CLINIC_ID)
        ])

        setClinic(clinicData)

        const defaultWebReservation = {
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
          flow: {
            initialSelection: true,
            menuSelection: true,
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
          ...defaultWebReservation,
          ...(settings.web_reservation || {}),
          // 古いテキストの場合は新しいデフォルトに置き換え
          cancelPolicyText: shouldUpdateCancelPolicy ? defaultWebReservation.cancelPolicyText : (savedCancelPolicyText || defaultWebReservation.cancelPolicyText)
        }

        setWebSettings(webReservation)
        setWebBookingMenus(webReservation.booking_menus || [])

        // レベル1の診療メニューのみ表示
        setTreatmentMenus(menus.filter(menu => menu.level === 1))
        setStaff(staffData)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Web予約メニューを追加
  const handleAddWebMenu = () => {
    console.log('🔴🔴🔴 handleAddWebMenu が呼ばれました！', {
      treatment_menu_id: newWebMenu.treatment_menu_id,
      staff_ids: newWebMenu.staff_ids,
      duration: newWebMenu.duration
    })

    if (!newWebMenu.treatment_menu_id) {
      alert('診療メニューを選択してください')
      return
    }
    if (newWebMenu.staff_ids.length === 0) {
      alert('担当者を選択してください')
      return
    }

    const menu = treatmentMenus.find(m => m.id === newWebMenu.treatment_menu_id)
    if (!menu) return

    // 診療メニュー1に紐づく診療メニュー2, 3を自動的にstepsに追加
    const autoSteps: any[] = []
    if (menu.menu2_id) {
      const menu2 = treatmentMenus.find(m => m.id === menu.menu2_id)
      if (menu2) {
        autoSteps.push({
          id: `step_${Date.now()}_2`,
          step_order: 1,
          menu_id: menu.menu2_id,
          staff_assignments: newWebMenu.staff_ids.map((staffId, index) => ({
            staff_id: staffId,
            priority: index + 1
          }))
        })
      }
    }
    if (menu.menu3_id) {
      const menu3 = treatmentMenus.find(m => m.id === menu.menu3_id)
      if (menu3) {
        autoSteps.push({
          id: `step_${Date.now()}_3`,
          step_order: 2,
          menu_id: menu.menu3_id,
          staff_assignments: newWebMenu.staff_ids.map((staffId, index) => ({
            staff_id: staffId,
            priority: index + 1
          }))
        })
      }
    }

    console.log('🔍 診療メニュー自動ステップ生成:', {
      selectedMenuId: menu.id,
      selectedMenuName: menu.name,
      menu2_id: menu.menu2_id,
      menu3_id: menu.menu3_id,
      autoSteps
    })

    const webMenu = {
      id: `web_${Date.now()}`,
      treatment_menu_id: newWebMenu.treatment_menu_id,
      treatment_menu_name: menu.name,
      treatment_menu_color: menu.color,
      duration: newWebMenu.duration,
      staff_ids: newWebMenu.staff_ids,
      allow_new_patient: newWebMenu.allow_new_patient,
      allow_returning: newWebMenu.allow_returning,
      steps: autoSteps // 自動生成されたstepsを使用
    }

    setWebBookingMenus([...webBookingMenus, webMenu])
    setIsAddDialogOpen(false)
    setNewWebMenu({
      treatment_menu_id: '',
      duration: 30,
      staff_ids: [],
      allow_new_patient: true,
      allow_returning: true,
      steps: []
    })
  }

  // Web予約メニューを削除
  const handleRemoveWebMenu = (id: string) => {
    setWebBookingMenus(webBookingMenus.filter(m => m.id !== id))
  }

  // スタッフ選択の切り替え
  const toggleStaffSelection = (staffId: string) => {
    setNewWebMenu(prev => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(staffId)
        ? prev.staff_ids.filter(id => id !== staffId)
        : [...prev.staff_ids, staffId]
    }))
  }

  // キャンセルポリシー編集ダイアログを開く
  const handleOpenCancelPolicyDialog = () => {
    setTempCancelPolicyText(webSettings.cancelPolicyText)
    setIsCancelPolicyDialogOpen(true)
  }

  // キャンセルポリシーを保存
  const handleSaveCancelPolicy = () => {
    setWebSettings(prev => ({
      ...prev,
      cancelPolicyText: tempCancelPolicyText
    }))
    setIsCancelPolicyDialogOpen(false)
  }

  // キャンセルポリシー編集をキャンセル
  const handleCancelPolicyDialogClose = () => {
    setIsCancelPolicyDialogOpen(false)
  }

  // 保存処理
  const handleSave = async () => {
    console.log('🔵 handleSave呼び出し開始', {
      webSettings,
      webBookingMenus,
      isEnabled: webSettings.isEnabled
    })
    let saveSuccessful = false
    try {
      setSaving(true)
      console.log('🔵 saving状態をtrueに設定')
      const settingsToSave = {
        ...webSettings,
        booking_menus: webBookingMenus
      }
      console.log('🔵 保存するデータ:', settingsToSave)
      await setClinicSetting(DEMO_CLINIC_ID, 'web_reservation', settingsToSave)
      console.log('🔵 setClinicSetting完了 - 保存成功')
      saveSuccessful = true
    } catch (error) {
      console.error('🔴 保存エラー:', error)
      alert('保存に失敗しました: ' + (error instanceof Error ? error.message : String(error)))
      return
    } finally {
      setSaving(false)
      console.log('🔵 saving状態をfalseに設定')
    }

    // 保存成功後の処理（別のtry-catchで囲む）
    if (saveSuccessful) {
      console.log('✅ 保存完了 - アラート表示')
      alert('設定を保存しました')
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
              <div className="flex items-center space-x-4">
                {/* Web予約URL */}
                {clinic?.slug && (
                  <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                      <a
                        href={`${window.location.origin}/web-booking?clinic=${clinic.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        {`${window.location.origin}/web-booking?clinic=${clinic.slug}`}
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/web-booking?clinic=${clinic.slug}`)
                        alert('URLをコピーしました')
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="URLをコピー"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>

            {/* サブタブナビゲーション */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'basic'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                基本設定
              </button>
              <button
                onClick={() => setActiveTab('flow')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'flow'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowRight className="w-4 h-4 inline mr-2" />
                フロー設定
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  activeTab === 'menu'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Stethoscope className="w-4 h-4 inline mr-2" />
                メニュー設定
              </button>
            </div>

            {/* 基本設定タブ */}
            {activeTab === 'basic' && (
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
                  </>
                )}

                {/* Web予約ページ設定 */}
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
            )}

            {/* フロー設定タブ */}
            {activeTab === 'flow' && (
              <Card>
              <CardHeader>
                <CardTitle>予約フロー設定</CardTitle>
                <p className="text-sm text-gray-600">予約フローの各ステップを設定します</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* キャンセルポリシー設定 */}
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="flow_cancel_policy"
                      checked={webSettings.showCancelPolicy}
                      onCheckedChange={(checked) => 
                        setWebSettings(prev => ({
                          ...prev,
                          showCancelPolicy: checked as boolean
                        }))
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="flow_cancel_policy" className="font-medium">
                          キャンセルポリシー表示
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleOpenCancelPolicyDialog}
                          className="p-1 h-auto"
                        >
                          <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500">
                        予約フローの最初にキャンセルポリシーを表示する
                      </p>
                    </div>
                  </div>
                  
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
                        患者が初診か再診かを選択するステップ<br/>
                        <span className="text-xs">※再診の場合は診察券番号・電話番号・メールアドレスのいずれか + 生年月日で患者認証を行います</span>
                      </p>

                      {/* フロー図 - インタラクティブなプレビュー */}
                      {webSettings.flow.initialSelection && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-3">👇 選択後のフロー（プレビュー）</div>

                          {/* タブ切り替え */}
                          <div className="flex space-x-2 mb-4">
                            <button
                              onClick={() => setPreviewTab('new')}
                              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                                previewTab === 'new'
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-semibold">初診</div>
                                <div className="text-xs mt-0.5 opacity-90">初めてご来院される方</div>
                              </div>
                            </button>
                            <button
                              onClick={() => setPreviewTab('returning')}
                              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                                previewTab === 'returning'
                                  ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-semibold">再診</div>
                                <div className="text-xs mt-0.5 opacity-90">過去にご来院されたことがある方</div>
                              </div>
                            </button>
                          </div>

                          {/* 初診フロー */}
                          {previewTab === 'new' && (
                            <div className="bg-white rounded-lg p-4 border-2 border-blue-400 shadow-sm">
                              <div className="text-center font-semibold text-blue-700 mb-4 pb-3 border-b-2 border-blue-200 text-lg">
                                初診の予約フロー
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-center space-x-3 p-2 rounded bg-blue-50">
                                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                  <div className="text-sm font-medium">診療メニュー選択</div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-blue-50">
                                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                  <div className="text-sm font-medium">日時選択</div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-blue-50">
                                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                                  <div>
                                    <div className="text-sm font-medium">患者情報入力</div>
                                    <div className="text-xs text-gray-500 ml-1 mt-0.5">名前・電話番号・メールアドレス等</div>
                                  </div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-blue-50">
                                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                                  <div className="text-sm font-medium">確認・確定</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 再診フロー */}
                          {previewTab === 'returning' && (
                            <div className="bg-white rounded-lg p-4 border-2 border-green-400 shadow-sm">
                              <div className="text-center font-semibold text-green-700 mb-4 pb-3 border-b-2 border-green-200 text-lg">
                                再診の予約フロー
                              </div>
                              <div className="space-y-2.5">
                                <div className="flex items-center space-x-3 p-2 rounded bg-green-50">
                                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                                  <div>
                                    <div className="text-sm font-medium">患者認証</div>
                                    <div className="text-xs text-gray-500 ml-1 mt-0.5">診察券番号・電話番号・メールアドレスのいずれか + 生年月日</div>
                                  </div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-green-50">
                                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                                  <div className="text-sm font-medium">診療メニュー選択</div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-green-50">
                                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                                  <div className="text-sm font-medium">日時選択</div>
                                </div>
                                <div className="ml-3 text-gray-400 text-xl">↓</div>
                                <div className="flex items-center space-x-3 p-2 rounded bg-green-50">
                                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shrink-0">4</div>
                                  <div>
                                    <div className="text-sm font-medium">確認・確定</div>
                                    <div className="text-xs text-gray-500 ml-1 mt-0.5">※患者情報入力はスキップ（認証済みのため）</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
            )}

            {/* メニュー設定タブ */}
            {activeTab === 'menu' && webSettings.isEnabled && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Web予約メニュー</CardTitle>
                      <p className="text-sm text-gray-600">
                        Web予約で公開する診療メニューを追加します
                      </p>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      メニューを追加
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {webBookingMenus.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Web予約メニューが登録されていません。「メニューを追加」ボタンから追加してください。
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {webBookingMenus.map(menu => (
                        <div key={menu.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                              {/* メニュー名とカラー */}
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-6 h-6 rounded"
                                  style={{ backgroundColor: menu.treatment_menu_color || '#bfbfbf' }}
                                />
                                <h4 className="font-medium text-lg">
                                  {menu.treatment_menu_name}
                                  {menu.steps && menu.steps.length > 0 && (
                                    <>
                                      {menu.steps.map((step: any) => {
                                        const stepMenu = treatmentMenus.find(m => m.id === step.menu_id)
                                        return stepMenu ? ` > ${stepMenu.name}` : ''
                                      })}
                                    </>
                                  )}
                                </h4>
                              </div>

                              {/* 診療時間 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">診療時間:</span>
                                <span>{menu.duration}分</span>
                              </div>

                              {/* 担当者 */}
                              <div className="flex items-start space-x-2 text-sm text-gray-600">
                                <span className="font-medium">担当者:</span>
                                <div className="flex flex-col gap-1">
                                  {menu.staff_ids.map((staffId: string, index: number) => {
                                    const s = staff.find(st => st.id === staffId)
                                    return s ? (
                                      <div key={staffId} className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">ステップ{index + 1}:</span>
                                        <span className="bg-gray-100 px-2 py-1 rounded">
                                          {s.name}
                                        </span>
                                      </div>
                                    ) : null
                                  })}
                                </div>
                              </div>

                              {/* 受付可能な患者 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">受付:</span>
                                <span>
                                  {menu.allow_new_patient && menu.allow_returning && '初診・再診'}
                                  {menu.allow_new_patient && !menu.allow_returning && '初診のみ'}
                                  {!menu.allow_new_patient && menu.allow_returning && '再診のみ'}
                                  {!menu.allow_new_patient && !menu.allow_returning && 'なし'}
                                </span>
                              </div>
                            </div>

                            {/* 削除ボタン */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveWebMenu(menu.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Web予約メニュー追加ダイアログ */}
            <Modal
              isOpen={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              title="Web予約メニューを追加"
              size="large"
            >
              <div className="space-y-6">
                {/* 診療メニュー選択 */}
                <div>
                  <Label htmlFor="treatment_menu">診療メニュー</Label>
                  <Select
                    value={newWebMenu.treatment_menu_id}
                    onValueChange={(value) =>
                      setNewWebMenu(prev => ({ ...prev, treatment_menu_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="診療メニューを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentMenus.map(menu => (
                        <SelectItem key={menu.id} value={menu.id}>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: menu.color || '#bfbfbf' }}
                            />
                            <span>{menu.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 診療時間 */}
                <div>
                  <Label htmlFor="duration">診療時間（分）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="300"
                    value={newWebMenu.duration}
                    onChange={(e) =>
                      setNewWebMenu(prev => ({
                        ...prev,
                        duration: parseInt(e.target.value) || 30
                      }))
                    }
                    className="max-w-xs"
                  />
                </div>

                {/* 担当者選択 */}
                <div>
                  <Label className="mb-2 block">担当者（複数選択可）</Label>
                  <div className="grid grid-cols-3 gap-2 border rounded-lg p-3">
                    {staff.map(s => (
                      <div key={s.id} className="flex items-center space-x-2 min-w-0">
                        <Checkbox
                          id={`new_menu_staff_${s.id}`}
                          checked={newWebMenu.staff_ids.includes(s.id)}
                          onCheckedChange={() => toggleStaffSelection(s.id)}
                          className="shrink-0"
                        />
                        <Label htmlFor={`new_menu_staff_${s.id}`} className="text-sm truncate cursor-pointer">
                          {s.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 受付可能な患者 */}
                <div>
                  <Label className="mb-2 block">受付可能な患者</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new_menu_allow_new"
                        checked={newWebMenu.allow_new_patient}
                        onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_new_patient: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor="new_menu_allow_new">初診</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new_menu_allow_returning"
                        checked={newWebMenu.allow_returning}
                        onCheckedChange={(checked) =>
                          setNewWebMenu(prev => ({
                            ...prev,
                            allow_returning: checked as boolean
                          }))
                        }
                      />
                      <Label htmlFor="new_menu_allow_returning">再診</Label>
                    </div>
                  </div>
                </div>

                {/* 診療ステップ（複数メニュー対応） */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>診療ステップ（診療メニュー2, 3を追加）</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStep = {
                          id: `step_${Date.now()}`,
                          step_order: newWebMenu.steps.length + 1,
                          menu_id: '',
                          staff_assignments: newWebMenu.staff_ids.map((staffId, index) => ({
                            staff_id: staffId,
                            priority: index + 1
                          }))
                        }
                        setNewWebMenu(prev => ({
                          ...prev,
                          steps: [...prev.steps, newStep]
                        }))
                      }}
                    >
                      + ステップを追加
                    </Button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {newWebMenu.steps.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        診療メニュー2以降が必要な場合は「+ ステップを追加」ボタンをクリック
                      </p>
                    ) : (
                      newWebMenu.steps.map((step, index) => (
                        <div key={step.id} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="font-semibold">ステップ {index + 2}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewWebMenu(prev => ({
                                  ...prev,
                                  steps: prev.steps.filter(s => s.id !== step.id)
                                }))
                              }}
                            >
                              削除
                            </Button>
                          </div>
                          <Select
                            value={step.menu_id}
                            onValueChange={(value) => {
                              setNewWebMenu(prev => ({
                                ...prev,
                                steps: prev.steps.map(s =>
                                  s.id === step.id ? { ...s, menu_id: value } : s
                                )
                              }))
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="診療メニューを選択" />
                            </SelectTrigger>
                            <SelectContent>
                              {treatmentMenus.map(menu => (
                                <SelectItem key={menu.id} value={menu.id}>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className="w-4 h-4 rounded"
                                      style={{ backgroundColor: menu.color || '#bfbfbf' }}
                                    />
                                    <span>{menu.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleAddWebMenu}>
                    追加
                  </Button>
                </div>
              </div>
            </Modal>

            {/* キャンセルポリシー編集ダイアログ */}
            <Modal
              isOpen={isCancelPolicyDialogOpen}
              onClose={handleCancelPolicyDialogClose}
              title="キャンセルポリシー編集"
              size="large"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancel_policy_text">キャンセルポリシーテキスト</Label>
                  <Textarea
                    id="cancel_policy_text"
                    value={tempCancelPolicyText}
                    onChange={(e) => setTempCancelPolicyText(e.target.value)}
                    rows={12}
                    className="mt-2"
                    placeholder="キャンセルポリシーの内容を入力してください"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    患者に表示されるキャンセルポリシーの内容を編集できます
                  </p>
                </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={handleCancelPolicyDialogClose}>
                    キャンセル
                  </Button>
                  <Button onClick={handleSaveCancelPolicy}>
                    保存
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
