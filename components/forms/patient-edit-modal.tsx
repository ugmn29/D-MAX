'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, User, Heart, Users, Plus, Trash2, Bell, Search } from 'lucide-react'
import { Patient } from '@/types/database'
import { calculateAge } from '@/lib/utils/date'
import { getLinkedQuestionnaireResponse } from '@/lib/api/questionnaires'
import { getStaff, Staff } from '@/lib/api/staff'
import { getPatients, updatePatient } from '@/lib/api/patients'
import { PATIENT_ICONS } from '@/lib/constants/patient-icons'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getPatientNotificationPreferences,
  upsertPatientNotificationPreferences
} from '@/lib/api/patient-notification-preferences'
import {
  getPatientWebBookingSettings,
  upsertPatientWebBookingSettings
} from '@/lib/api/patient-web-booking-settings'

interface PatientEditModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  onSave?: (patientData: any) => void
}

interface InsuranceInfo {
  id: string
  insurance_number: string
  symbol_number: string
  burden_ratio: number
  is_primary: boolean
}

interface FamilyMember {
  id: string
  name: string
  relation: string
  patient_number: string
}

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export function PatientEditModal({ isOpen, onClose, patient, onSave }: PatientEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [editData, setEditData] = useState({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    visit_reason: '', // 来院理由
    allergies: '',
    medical_history: '',
    medications: '',
    special_notes: '',
    primary_doctor: '',
    assigned_dh: ''
  })

  // 選択されたアイコン
  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([])

  // スタッフ情報
  const [staff, setStaff] = useState<Staff[]>([])
  const [doctors, setDoctors] = useState<Staff[]>([])
  const [dentalHygienists, setDentalHygienists] = useState<Staff[]>([])

  // 家族連携
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [familyCandidates, setFamilyCandidates] = useState<FamilyMember[]>([])
  const [showFamilyCandidates, setShowFamilyCandidates] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])

  // 保険情報
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo[]>([])

  // 通知受信設定
  const [notificationPreferences, setNotificationPreferences] = useState({
    appointment_reminder: true,
    periodic_checkup: true,
    treatment_reminder: true,
    appointment_change: true,
    custom: true
  })
  const [savingPreferences, setSavingPreferences] = useState(false)

  // Web予約設定
  const [webBookingSettings, setWebBookingSettings] = useState({
    web_booking_enabled: true,
    web_cancel_enabled: true,
    web_reschedule_enabled: true,
    web_cancel_limit: null as number | null,
    cancel_deadline_hours: null as number | null,
    max_concurrent_bookings: null as number | null
  })

  // 患者データが変更されたら編集データを更新
  useEffect(() => {
    if (patient) {
      loadPatientData()
      loadStaffData()
      loadPatientIcons()
      searchFamilyCandidates()
    }
  }, [patient])

  // 他のコンポーネントでの通知設定変更を検知
  useEffect(() => {
    const handleNotificationUpdate = async (event: any) => {
      if (!patient) return
      console.log('PatientEditModal: 通知設定が更新されました')
      // 通知設定を再読み込み
      try {
        const preferencesData = await getPatientNotificationPreferences(patient.id, DEMO_CLINIC_ID)
        if (preferencesData) {
          setNotificationPreferences({
            appointment_reminder: preferencesData.appointment_reminder,
            periodic_checkup: preferencesData.periodic_checkup,
            treatment_reminder: preferencesData.treatment_reminder,
            appointment_change: preferencesData.appointment_change,
            custom: preferencesData.custom
          })
        }
      } catch (error) {
        console.error('通知設定の再読み込みエラー:', error)
      }
    }

    window.addEventListener('notificationPreferencesUpdated', handleNotificationUpdate)
    return () => {
      window.removeEventListener('notificationPreferencesUpdated', handleNotificationUpdate)
    }
  }, [patient])

  const loadPatientData = async () => {
    if (!patient) return

    // 問診票から情報を取得（住所、来院理由、アレルギー、既往歴、服用薬）
    let fullAddress = patient.address || ''
    let visitReasonInfo = ''
    let allergiesInfo = patient.allergies || ''
    let medicalHistoryInfo = patient.medical_history || ''
    let medicationsInfo = patient.medications || ''

    try {
      const questionnaireResponse = await getLinkedQuestionnaireResponse(patient.id)
      if (questionnaireResponse) {
        const responseData = questionnaireResponse.response_data
        console.log('PatientEditModal: 問診票データ全体:', responseData)

        // 住所情報を取得
        let postalCode = ''
        let address = ''

        // 郵便番号を検索
        for (const key in responseData) {
          const value = responseData[key]
          if (typeof value === 'string' && /^\d{3}-?\d{4}$/.test(value.replace('-', ''))) {
            postalCode = value
            break
          }
        }

        address = responseData.patient_address || responseData.address || responseData['q1-9'] || ''

        const addressParts = [postalCode, address].filter(part => part && part.trim() !== '')
        if (addressParts.length > 0) {
          fullAddress = addressParts.join(' ')
        }

        // 来院理由を取得（q1-11）
        if (responseData['q1-11']) {
          if (Array.isArray(responseData['q1-11'])) {
            visitReasonInfo = responseData['q1-11'].join('、')
          } else {
            visitReasonInfo = responseData['q1-11']
          }
        }

        // アレルギー情報を取得
        if (responseData.allergies) {
          allergiesInfo = responseData.allergies
        } else if (responseData['q1-19'] === 'ある' && responseData['q1-19b']) {
          allergiesInfo = responseData['q1-19b']
        } else if (responseData['q1-19'] === 'ない') {
          allergiesInfo = 'なし'
        }

        // 既往歴を取得
        if (responseData.medical_history) {
          medicalHistoryInfo = responseData.medical_history
        } else if (responseData['q1-23'] === 'ある' && responseData['q1-23b']) {
          if (Array.isArray(responseData['q1-23b'])) {
            medicalHistoryInfo = responseData['q1-23b'].join('、')
          } else {
            medicalHistoryInfo = responseData['q1-23b']
          }
        } else if (responseData['q1-23'] === 'ない') {
          medicalHistoryInfo = 'なし'
        }

        // 服用薬情報を取得
        let medicationsInfo = ''
        if (responseData.medications) {
          medicationsInfo = responseData.medications
        } else if (responseData['q1-24'] === 'ある' && responseData['q1-24b']) {
          if (Array.isArray(responseData['q1-24b'])) {
            medicationsInfo = responseData['q1-24b'].join('、')
          } else {
            medicationsInfo = responseData['q1-24b']
          }
        } else if (responseData['q1-24'] === 'ない') {
          medicationsInfo = 'なし'
        }

        console.log('PatientEditModal: 問診票から取得:', {
          address: fullAddress,
          allergies: allergiesInfo,
          medicalHistory: medicalHistoryInfo
        })
      }
    } catch (error) {
      console.log('問診票の情報取得エラー（無視）:', error)
    }

    setEditData({
      last_name: patient.last_name,
      first_name: patient.first_name,
      last_name_kana: patient.last_name_kana || '',
      first_name_kana: patient.first_name_kana || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: fullAddress,
      visit_reason: visitReasonInfo,
      allergies: allergiesInfo,
      medical_history: medicalHistoryInfo,
      medications: medicationsInfo,
      special_notes: '',
      primary_doctor: '',
      assigned_dh: ''
    })

    // 通知受信設定を読み込む
    try {
      const preferencesData = await getPatientNotificationPreferences(patient.id, DEMO_CLINIC_ID)
      if (preferencesData) {
        setNotificationPreferences({
          appointment_reminder: preferencesData.appointment_reminder,
          periodic_checkup: preferencesData.periodic_checkup,
          treatment_reminder: preferencesData.treatment_reminder,
          appointment_change: preferencesData.appointment_change,
          custom: preferencesData.custom
        })
      }
    } catch (preferencesError) {
      console.log('通知設定の取得エラー（デフォルト値を使用）:', preferencesError)
    }

    // Web予約設定を読み込む
    try {
      const webBookingData = await getPatientWebBookingSettings(patient.id, DEMO_CLINIC_ID)
      if (webBookingData) {
        setWebBookingSettings({
          web_booking_enabled: webBookingData.web_booking_enabled,
          web_cancel_enabled: webBookingData.web_cancel_enabled,
          web_reschedule_enabled: webBookingData.web_reschedule_enabled,
          web_cancel_limit: webBookingData.web_cancel_limit,
          cancel_deadline_hours: webBookingData.cancel_deadline_hours,
          max_concurrent_bookings: webBookingData.max_concurrent_bookings
        })
      }
    } catch (webBookingError) {
      console.log('Web予約設定の取得エラー（デフォルト値を使用）:', webBookingError)
    }
  }

  const loadPatientIcons = () => {
    if (!patient) return
    
    const savedIcons = localStorage.getItem(`patient_icons_${patient.id}`)
    if (savedIcons) {
      try {
        const iconIds = JSON.parse(savedIcons)
        setSelectedIconIds(iconIds)
      } catch (e) {
        console.error('アイコンデータの読み込みエラー:', e)
      }
    }
  }

  const loadStaffData = async () => {
    try {
      const staffData = await getStaff('clinic-1')
      setStaff(staffData)
      
      // 歯科医師をフィルタリング
      const doctorsList = staffData.filter(member => {
        const positionName = (member as any).position?.name || ''
        const roleName = member.role || ''
        
        return positionName.includes('歯科医師') || 
               positionName.includes('医師') || 
               positionName.includes('ドクター') || 
               positionName.toLowerCase().includes('doctor') ||
               roleName.toLowerCase() === 'doctor' || 
               roleName.includes('医師') || 
               roleName.includes('ドクター')
      })
      setDoctors(doctorsList)
      
      // 歯科衛生士をフィルタリング
      const dhList = staffData.filter(member => {
        const positionName = (member as any).position?.name || ''
        const roleName = member.role || ''
        
        return positionName.includes('歯科衛生士') || 
               positionName.includes('衛生士') || 
               positionName.includes('DH') || 
               positionName.toLowerCase().includes('hygienist') ||
               roleName.toLowerCase() === 'hygienist' || 
               roleName.includes('衛生士') || 
               roleName.includes('DH')
      })
      setDentalHygienists(dhList)
    } catch (error) {
      console.error('スタッフデータの読み込みエラー:', error)
    }
  }

  // 家族候補を検索（住所・電話番号一致）
  const searchFamilyCandidates = async () => {
    if (!patient) return

    try {
      const { getPatients } = await import('@/lib/api/patients')
      const allPatients = await getPatients(DEMO_CLINIC_ID)

      // 現在の患者と既に連携済みの家族を除外
      const linkedIds = [patient.id, ...familyMembers.map(f => f.id)]

      const candidates = allPatients
        .filter(p => !linkedIds.includes(p.id))
        .filter(p => {
          // 住所または電話番号が一致する患者を候補とする
          const addressMatch = editData.address && p.address &&
                               editData.address.trim() !== '' &&
                               p.address.includes(editData.address.split(' ')[0])
          const phoneMatch = editData.phone && p.phone &&
                            editData.phone === p.phone
          return addressMatch || phoneMatch
        })
        .map(p => ({
          id: p.id,
          name: `${p.last_name} ${p.first_name}`,
          relation: '', // デフォルトは空
          patient_number: p.patient_number || ''
        }))

      setFamilyCandidates(candidates)
    } catch (error) {
      console.error('家族候補の検索エラー:', error)
    }
  }

  // 患者検索
  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { getPatients } = await import('@/lib/api/patients')
      const allPatients = await getPatients(DEMO_CLINIC_ID)

      // 現在の患者と既に連携済みの家族を除外
      const linkedIds = [patient!.id, ...familyMembers.map(f => f.id)]

      const results = allPatients.filter(p => {
        if (linkedIds.includes(p.id)) return false

        const fullName = `${p.last_name} ${p.first_name}`.toLowerCase()
        const fullNameKana = `${p.last_name_kana} ${p.first_name_kana}`.toLowerCase()
        const searchLower = query.toLowerCase()

        return fullName.includes(searchLower) ||
               fullNameKana.includes(searchLower) ||
               (p.patient_number && p.patient_number.includes(query))
      })

      setSearchResults(results)
    } catch (error) {
      console.error('患者検索エラー:', error)
      setSearchResults([])
    }
  }

  // 検索クエリの変更ハンドラ
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    searchPatients(query)
  }

  // 家族を連携
  const linkFamilyMember = (patient: Patient, relation: string = '家族') => {
    const newMember: FamilyMember = {
      id: patient.id,
      name: `${patient.last_name} ${patient.first_name}`,
      relation,
      patient_number: patient.patient_number || ''
    }

    setFamilyMembers([...familyMembers, newMember])
    setSearchQuery('')
    setSearchResults([])
    setFamilyCandidates(familyCandidates.filter(c => c.id !== patient.id))
  }

  // 家族連携を解除
  const unlinkFamilyMember = (memberId: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== memberId))
    // 解除後に候補を再検索
    searchFamilyCandidates()
  }

  // 通知受信設定を即座に更新
  const handlePreferenceChange = async (key: keyof typeof notificationPreferences, value: boolean) => {
    if (!patient) return

    try {
      setSavingPreferences(true)
      const newPreferences = { ...notificationPreferences, [key]: value }
      setNotificationPreferences(newPreferences)

      // 即座にデータベースに保存
      await upsertPatientNotificationPreferences(patient.id, DEMO_CLINIC_ID, newPreferences)
      console.log('通知受信設定の保存に成功しました')

      // 他のコンポーネントに更新を通知
      window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', {
        detail: { patientId: patient.id, preferences: newPreferences }
      }))
    } catch (error) {
      console.error('通知受信設定の更新エラー:', error)
      // エラー時は元に戻す
      setNotificationPreferences(notificationPreferences)
      alert('通知受信設定の保存に失敗しました')
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleSave = async () => {
    if (!patient) return

    try {
      setSaving(true)

      // アイコンをローカルストレージに保存
      localStorage.setItem(`patient_icons_${patient.id}`, JSON.stringify(selectedIconIds))

      // 患者データを保存（アイコンと家族情報を含む）
      const patientDataToSave = {
        ...editData,
        patient_icons: selectedIconIds,
        family_members: familyMembers.map(f => f.id)
      }

      console.log('患者データを保存:', patientDataToSave)

      // updatePatient APIを直接呼び出し
      await updatePatient(DEMO_CLINIC_ID, patient.id, patientDataToSave)
      console.log('患者情報の保存に成功しました')

      // 通知受信設定は既にチェックボックスの変更時に保存されているのでここでは保存しない

      // Web予約設定を保存
      try {
        await upsertPatientWebBookingSettings(patient.id, DEMO_CLINIC_ID, webBookingSettings)
        console.log('Web予約設定の保存に成功しました')

        // 他のコンポーネントに更新を通知
        window.dispatchEvent(new CustomEvent('webBookingSettingsUpdated', {
          detail: { patientId: patient.id, settings: webBookingSettings }
        }))
      } catch (webBookingError) {
        console.error('Web予約設定の保存エラー:', webBookingError)
        // エラーでも患者データの保存は続行
      }

      // 親コンポーネントのコールバックを呼び出し
      if (onSave) {
        onSave(patientDataToSave)
      }

      onClose()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('患者情報の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">患者基本情報編集</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 患者データ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <User className="w-5 h-5 mr-2" />
                  患者データ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {/* 氏名（漢字） */}
                  <div>
                    <Label htmlFor="full_name">氏名</Label>
                    <Input
                      id="full_name"
                      placeholder="例: 福永 真大"
                      value={`${editData.last_name} ${editData.first_name}`}
                      onChange={(e) => {
                        const fullName = e.target.value
                        const parts = fullName.split(' ')
                        if (parts.length >= 2) {
                          setEditData({ 
                            ...editData, 
                            last_name: parts[0],
                            first_name: parts.slice(1).join(' ')
                          })
                        } else {
                          setEditData({ 
                            ...editData, 
                            last_name: fullName,
                            first_name: ''
                          })
                        }
                      }}
                    />
                  </div>
                  
                  {/* 氏名（フリガナ） */}
                  <div>
                    <Label htmlFor="full_name_kana">氏名（フリガナ）</Label>
                    <Input
                      id="full_name_kana"
                      placeholder="例: フクナガ シンダイ"
                      value={`${editData.last_name_kana} ${editData.first_name_kana}`}
                      onChange={(e) => {
                        const fullNameKana = e.target.value
                        const parts = fullNameKana.split(' ')
                        if (parts.length >= 2) {
                          setEditData({ 
                            ...editData, 
                            last_name_kana: parts[0],
                            first_name_kana: parts.slice(1).join(' ')
                          })
                        } else {
                          setEditData({ 
                            ...editData, 
                            last_name_kana: fullNameKana,
                            first_name_kana: ''
                          })
                        }
                      }}
                    />
                  </div>
                  
                  {/* 生年月日と性別 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birth_date">生年月日</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={editData.birth_date}
                        onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {calculateAge(editData.birth_date)}歳
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="gender">性別</Label>
                      <Select
                        value={editData.gender}
                        onValueChange={(value) => setEditData({ ...editData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="性別を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                          <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 電話番号とメールアドレス */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">電話番号</Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">住所</Label>
                  <Textarea
                    id="address"
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    placeholder="住所を入力してください"
                    className="min-h-[80px]"
                  />
                </div>

                {/* 来院理由（読み取り専用） */}
                <div>
                  <Label htmlFor="visit_reason">来院理由</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.visit_reason || '--'}
                    </div>
                  </div>
                </div>

                {/* 家族連携 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">家族連携</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFamilyCandidates(!showFamilyCandidates)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      家族を追加
                      {familyCandidates.length > 0 && ` (候補: ${familyCandidates.length})`}
                    </Button>
                  </div>

                  {/* 検索UI */}
                  {showFamilyCandidates && (
                    <div className="mb-3 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="患者名または診察券番号で検索"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* 検索結果 */}
                      {searchResults.length > 0 && (
                        <div className="max-h-[150px] overflow-y-auto border rounded-lg bg-white">
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                              onClick={() => linkFamilyMember(result)}
                            >
                              <p className="text-sm font-medium">
                                {result.last_name} {result.first_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                患者番号: {result.patient_number || '--'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 住所・電話番号一致の候補 */}
                      {familyCandidates.length > 0 && searchQuery === '' && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-800 mb-2">
                            住所または電話番号が一致する患者:
                          </p>
                          <div className="space-y-1">
                            {familyCandidates.map((candidate) => (
                              <div
                                key={candidate.id}
                                className="flex items-center justify-between p-1.5 bg-white rounded cursor-pointer hover:bg-blue-100"
                                onClick={() => {
                                  const patientToLink: Patient = {
                                    id: candidate.id,
                                    last_name: candidate.name.split(' ')[0],
                                    first_name: candidate.name.split(' ')[1] || '',
                                    last_name_kana: '',
                                    first_name_kana: '',
                                    patient_number: candidate.patient_number,
                                    clinic_id: DEMO_CLINIC_ID,
                                    created_at: '',
                                    updated_at: ''
                                  } as Patient
                                  linkFamilyMember(patientToLink)
                                }}
                              >
                                <span className="text-xs">{candidate.name}</span>
                                <span className="text-xs text-gray-500">
                                  {candidate.patient_number}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 連携済み家族リスト */}
                  <div className="space-y-2 max-h-[120px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {familyMembers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-sm">連携された家族はいません</p>
                    ) : (
                      familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded bg-white">
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">
                              {member.relation} | 患者番号: {member.patient_number}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-800"
                            onClick={() => unlinkFamilyMember(member.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            解除
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 担当者設定 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_doctor">主担当医</Label>
                    <Select
                      value={editData.primary_doctor}
                      onValueChange={(value) => setEditData({ ...editData, primary_doctor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="主担当医を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.length > 0 ? (
                          doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} ({doctor.role})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-doctors" disabled>
                            歯科医師が登録されていません
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="assigned_dh">主担当DH</Label>
                    <Select
                      value={editData.assigned_dh}
                      onValueChange={(value) => setEditData({ ...editData, assigned_dh: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="主担当DHを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {dentalHygienists.length > 0 ? (
                          dentalHygienists.map((dh) => (
                            <SelectItem key={dh.id} value={dh.id}>
                              {dh.name} ({dh.role})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-dh" disabled>
                            歯科衛生士が登録されていません
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 医療情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Heart className="w-5 h-5 mr-2" />
                  医療情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="medical_history">既往歴</Label>
                  <Textarea
                    id="medical_history"
                    value={editData.medical_history}
                    onChange={(e) => setEditData({ ...editData, medical_history: e.target.value })}
                    placeholder="既往歴を入力してください"
                    className="h-[80px] resize-none overflow-y-auto"
                  />
                </div>

                <div>
                  <Label htmlFor="medications">服用薬</Label>
                  <Textarea
                    id="medications"
                    value={editData.medications}
                    onChange={(e) => setEditData({ ...editData, medications: e.target.value })}
                    placeholder="現在服用中の薬を入力してください"
                    className="h-[80px] resize-none overflow-y-auto"
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">アレルギー（必須確認項目）</Label>
                  <Textarea
                    id="allergies"
                    value={editData.allergies}
                    onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
                    placeholder="アレルギー情報を入力してください"
                    className="h-[80px] resize-none overflow-y-auto"
                  />
                </div>

                {/* 通知受信設定 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>通知受信設定</Label>
                    {savingPreferences && (
                      <span className="text-xs text-gray-500">保存中...</span>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notif_appointment_reminder"
                        checked={notificationPreferences.appointment_reminder}
                        onCheckedChange={(checked) => handlePreferenceChange('appointment_reminder', checked as boolean)}
                        disabled={savingPreferences}
                      />
                      <Label htmlFor="notif_appointment_reminder" className="cursor-pointer font-normal text-sm">
                        予約リマインド通知を受け取る
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notif_periodic_checkup"
                        checked={notificationPreferences.periodic_checkup}
                        onCheckedChange={(checked) => handlePreferenceChange('periodic_checkup', checked as boolean)}
                        disabled={savingPreferences}
                      />
                      <Label htmlFor="notif_periodic_checkup" className="cursor-pointer font-normal text-sm">
                        定期検診リマインド通知を受け取る
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notif_treatment_reminder"
                        checked={notificationPreferences.treatment_reminder}
                        onCheckedChange={(checked) => handlePreferenceChange('treatment_reminder', checked as boolean)}
                        disabled={savingPreferences}
                      />
                      <Label htmlFor="notif_treatment_reminder" className="cursor-pointer font-normal text-sm">
                        治療リマインド通知を受け取る
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notif_appointment_change"
                        checked={notificationPreferences.appointment_change}
                        onCheckedChange={(checked) => handlePreferenceChange('appointment_change', checked as boolean)}
                        disabled={savingPreferences}
                      />
                      <Label htmlFor="notif_appointment_change" className="cursor-pointer font-normal text-sm">
                        予約変更通知を受け取る
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notif_custom"
                        checked={notificationPreferences.custom}
                        onCheckedChange={(checked) => handlePreferenceChange('custom', checked as boolean)}
                        disabled={savingPreferences}
                      />
                      <Label htmlFor="notif_custom" className="cursor-pointer font-normal text-sm">
                        カスタム通知を受け取る
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Web予約設定 */}
                <div>
                  <Label>Web予約設定</Label>
                  <div className="p-3 bg-gray-50 rounded-md space-y-3">
                    {/* 基本設定 */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="web_booking_enabled_modal"
                          checked={webBookingSettings.web_booking_enabled}
                          onCheckedChange={(checked) => setWebBookingSettings({
                            ...webBookingSettings,
                            web_booking_enabled: checked as boolean
                          })}
                        />
                        <Label htmlFor="web_booking_enabled_modal" className="cursor-pointer font-normal text-sm">
                          Web予約を許可する
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="web_cancel_enabled_modal"
                          checked={webBookingSettings.web_cancel_enabled}
                          onCheckedChange={(checked) => setWebBookingSettings({
                            ...webBookingSettings,
                            web_cancel_enabled: checked as boolean
                          })}
                        />
                        <Label htmlFor="web_cancel_enabled_modal" className="cursor-pointer font-normal text-sm">
                          Webキャンセルを許可する
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="web_reschedule_enabled_modal"
                          checked={webBookingSettings.web_reschedule_enabled}
                          onCheckedChange={(checked) => setWebBookingSettings({
                            ...webBookingSettings,
                            web_reschedule_enabled: checked as boolean
                          })}
                        />
                        <Label htmlFor="web_reschedule_enabled_modal" className="cursor-pointer font-normal text-sm">
                          Web日程変更を許可する
                        </Label>
                      </div>
                    </div>

                    {/* 制限設定 */}
                    <div className="border-t pt-3 space-y-3">
                      <div>
                        <Label htmlFor="web_cancel_limit_modal" className="text-sm">月間キャンセル回数制限</Label>
                        <select
                          id="web_cancel_limit_modal"
                          value={webBookingSettings.web_cancel_limit === null ? 'unlimited' : webBookingSettings.web_cancel_limit}
                          onChange={(e) => setWebBookingSettings({
                            ...webBookingSettings,
                            web_cancel_limit: e.target.value === 'unlimited' ? null : parseInt(e.target.value)
                          })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="unlimited">無制限</option>
                          <option value="1">1回</option>
                          <option value="2">2回</option>
                          <option value="3">3回</option>
                          <option value="5">5回</option>
                          <option value="10">10回</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="cancel_deadline_hours_modal" className="text-sm">キャンセル可能期限</Label>
                        <select
                          id="cancel_deadline_hours_modal"
                          value={webBookingSettings.cancel_deadline_hours === null ? 'no_limit' : webBookingSettings.cancel_deadline_hours}
                          onChange={(e) => setWebBookingSettings({
                            ...webBookingSettings,
                            cancel_deadline_hours: e.target.value === 'no_limit' ? null : parseInt(e.target.value)
                          })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="no_limit">制限なし</option>
                          <option value="1">1時間前まで</option>
                          <option value="3">3時間前まで</option>
                          <option value="6">6時間前まで</option>
                          <option value="12">12時間前まで</option>
                          <option value="24">24時間前まで</option>
                          <option value="48">48時間前まで</option>
                          <option value="72">72時間前まで</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="max_concurrent_bookings_modal" className="text-sm">同時予約可能件数</Label>
                        <select
                          id="max_concurrent_bookings_modal"
                          value={webBookingSettings.max_concurrent_bookings === null ? 'unlimited' : webBookingSettings.max_concurrent_bookings}
                          onChange={(e) => setWebBookingSettings({
                            ...webBookingSettings,
                            max_concurrent_bookings: e.target.value === 'unlimited' ? null : parseInt(e.target.value)
                          })}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="unlimited">無制限</option>
                          <option value="1">1件</option>
                          <option value="2">2件</option>
                          <option value="3">3件</option>
                          <option value="5">5件</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="special_notes">特記事項</Label>

                  {/* アイコン選択UI */}
                  <div className="mb-3">
                    <Label className="text-sm text-gray-600 mb-2 block">該当するアイコンを選択</Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                      {PATIENT_ICONS.filter(icon => icon.enabled).map(iconData => {
                        const IconComponent = iconData.icon
                        const isSelected = selectedIconIds.includes(iconData.id)
                        return (
                          <button
                            key={iconData.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedIconIds(prev => prev.filter(id => id !== iconData.id))
                              } else {
                                setSelectedIconIds(prev => [...prev, iconData.id])
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
                              isSelected
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                            <span className="text-sm">{iconData.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <Textarea
                    id="special_notes"
                    value={editData.special_notes}
                    onChange={(e) => setEditData({ ...editData, special_notes: e.target.value })}
                    placeholder="その他の特記事項を入力してください"
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-2 mt-6 pt-6 border-t border-gray-200">
            <Button onClick={onClose} variant="outline">
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
