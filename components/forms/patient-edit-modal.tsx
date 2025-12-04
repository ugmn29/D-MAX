'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, User, Heart, Bell, Plus, Trash2, Search } from 'lucide-react'
import { Patient } from '@/types/database'
import { calculateAge } from '@/lib/utils/date'
import { getLinkedQuestionnaireResponse } from '@/lib/api/questionnaires'
import { getStaff, Staff } from '@/lib/api/staff'
import { getPatients, updatePatient, getPatientById } from '@/lib/api/patients'
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
import { getPatientIcons, upsertPatientIcons } from '@/lib/api/patient-icons'
import { LineLinkageSection } from '@/components/patients/line-linkage-section'

interface PatientEditModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  clinicId: string
  onSave?: (patientData: any) => void
}

interface FamilyMember {
  id: string
  name: string
  relation: string
  patient_number: string
  last_name: string
  first_name: string
  address?: string
  phone?: string
}

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export function PatientEditModal({ isOpen, onClose, patient, clinicId, onSave }: PatientEditModalProps) {
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
    visit_reason: '',
    preferred_contact_method: '',
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

  // 通知受信設定
  const [notificationPreferences, setNotificationPreferences] = useState({
    appointment_reminder: true,
    periodic_checkup: true,
    treatment_reminder: true,
    appointment_change: true,
    custom: true
  })

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

  const loadPatientData = async () => {
    if (!patient) return

    // patientプロップから直接データを使用（基本情報タブと同じデータを表示）
    setEditData({
      last_name: patient.last_name,
      first_name: patient.first_name,
      last_name_kana: patient.last_name_kana || '',
      first_name_kana: patient.first_name_kana || '',
      birth_date: patient.birth_date || '',
      gender: patient.gender || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      visit_reason: (patient as any).visit_reason || '',
      preferred_contact_method: (patient as any).preferred_contact_method || '',
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || '',
      medications: (patient as any).medications || '',
      special_notes: (patient as any).special_notes || '',
      primary_doctor: (patient as any).primary_doctor_id || '',
      assigned_dh: (patient as any).primary_hygienist_id || ''
    })

    // 通知受信設定を読み込む
    try {
      const preferencesData = await getPatientNotificationPreferences(patient.id, clinicId)
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
      const webBookingData = await getPatientWebBookingSettings(patient.id, clinicId)
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

  const loadPatientIcons = async () => {
    if (!patient) return

    try {
      const patientIconsData = await getPatientIcons(patient.id, clinicId)
      if (patientIconsData?.icon_ids) {
        setSelectedIconIds(patientIconsData.icon_ids)
      }
    } catch (error) {
      console.error('患者アイコンの読み込みエラー:', error)
    }
  }

  const toggleIcon = (iconId: string) => {
    setSelectedIconIds(prev => {
      if (prev.includes(iconId)) {
        return prev.filter(id => id !== iconId)
      } else {
        return [...prev, iconId]
      }
    })
  }

  const loadStaffData = async () => {
    try {
      const staffData = await getStaff(clinicId)
      setStaff(staffData)

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

  const searchFamilyCandidates = async () => {
    if (!patient) return

    try {
      const allPatients = await getPatients(clinicId)
      const linkedIds = [patient.id, ...familyMembers.map(f => f.id)]

      const candidates = allPatients
        .filter(p => !linkedIds.includes(p.id))
        .filter(p => {
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
          last_name: p.last_name,
          first_name: p.first_name,
          relation: '',
          patient_number: p.patient_number || '',
          address: p.address,
          phone: p.phone
        }))

      setFamilyCandidates(candidates)
    } catch (error) {
      console.error('家族候補の検索エラー:', error)
    }
  }

  const searchPatients = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const allPatients = await getPatients(clinicId)
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

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    searchPatients(query)
  }

  const linkFamilyMember = (selectedPatient: Patient | FamilyMember, relation: string = '家族') => {
    const newMember: FamilyMember = {
      id: selectedPatient.id,
      name: 'name' in selectedPatient ? selectedPatient.name : `${selectedPatient.last_name} ${selectedPatient.first_name}`,
      last_name: 'last_name' in selectedPatient ? selectedPatient.last_name : '',
      first_name: 'first_name' in selectedPatient ? selectedPatient.first_name : '',
      relation,
      patient_number: 'patient_number' in selectedPatient ? (selectedPatient.patient_number || '') : '',
      address: 'address' in selectedPatient ? selectedPatient.address : undefined,
      phone: 'phone' in selectedPatient ? selectedPatient.phone : undefined
    }

    setFamilyMembers([...familyMembers, newMember])
    setSearchQuery('')
    setSearchResults([])
    setFamilyCandidates(familyCandidates.filter(c => c.id !== selectedPatient.id))
  }

  const unlinkFamilyMember = (memberId: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== memberId))
    searchFamilyCandidates()
  }

  const handleSave = async () => {
    if (!patient) return

    try {
      setSaving(true)

      // 患者アイコンを保存
      console.log('患者アイコン保存開始:', { patientId: patient.id, clinicId, selectedIconIds })
      try {
        const result = await upsertPatientIcons(patient.id, clinicId, selectedIconIds)
        console.log('患者アイコン保存成功:', result)
      } catch (iconError) {
        console.error('患者アイコンの保存エラー:', iconError)
        // このエラーは致命的ではないので続行
      }

      // 患者データを保存
      const patientDataToSave = {
        ...editData
      }

      // データベースに存在しないフィールドを削除
      delete (patientDataToSave as any).patient_icons
      delete (patientDataToSave as any).family_members

      await updatePatient(clinicId, patient.id, patientDataToSave)

      // 通知受信設定を保存
      try {
        await upsertPatientNotificationPreferences(patient.id, clinicId, notificationPreferences)
      } catch (notifError) {
        console.error('通知受信設定の保存エラー（無視）:', notifError)
        // このエラーは致命的ではないので続行
      }

      // Web予約設定を保存
      try {
        await upsertPatientWebBookingSettings(patient.id, clinicId, webBookingSettings)
      } catch (webError) {
        console.error('Web予約設定の保存エラー（無視）:', webError)
        // このエラーは致命的ではないので続行
      }

      // 他のコンポーネントに患者データ更新を通知
      const event = new CustomEvent('patientDataUpdated', {
        detail: { patientId: patient.id, clinicId }
      })
      window.dispatchEvent(event)

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
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold">患者基本情報編集</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 患者データと医療情報 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 患者データ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  患者データ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 氏名と��りがな */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {/* 住所 */}
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

                {/* 来院理由と希望連絡方法 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="visit_reason">来院理由</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm text-gray-600">
                        {editData.visit_reason || '--'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="preferred_contact_method">希望連絡方法</Label>
                    <Select
                      value={editData.preferred_contact_method}
                      onValueChange={(value) =>
                        setEditData({ ...editData, preferred_contact_method: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">指定なし</SelectItem>
                        <SelectItem value="line">LINE</SelectItem>
                        <SelectItem value="email">メール</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
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

                  {/* 家族候補リスト */}
                  {showFamilyCandidates && (
                    <div className="mb-3 space-y-3 border rounded-lg p-3 bg-blue-50">
                      {/* 検索窓 */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="患者名または診察券番号で検索"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          className="pl-10 bg-white"
                        />
                      </div>

                      {/* 検索結果 */}
                      {searchQuery && (
                        <div className="space-y-2">
                          {searchResults.length > 0 ? (
                            <>
                              <p className="text-sm font-medium text-blue-900">
                                検索結果（{searchResults.length}件）
                              </p>
                              {searchResults.map((candidate) => (
                                <div
                                  key={candidate.id}
                                  className="flex items-center justify-between p-2 border rounded bg-white hover:bg-green-50 cursor-pointer transition-colors"
                                >
                                  <div onClick={() => linkFamilyMember(candidate)} className="flex-1">
                                    <p className="font-medium text-sm">
                                      {candidate.last_name} {candidate.first_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      患者番号: {candidate.patient_number || '--'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {candidate.address && `住所: ${candidate.address}`}
                                      {candidate.phone && ` / 電話: ${candidate.phone}`}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => linkFamilyMember(candidate)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    連携
                                  </Button>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              該当する患者が見つかりません
                            </p>
                          )}
                        </div>
                      )}

                      {/* 住所・電話番号一致の候補 */}
                      {!searchQuery && familyCandidates.length > 0 && (
                        <>
                          <p className="text-sm font-medium text-blue-900">
                            同じ住所または電話番号の患者（候補: {familyCandidates.length}件）
                          </p>
                          {familyCandidates.map((candidate) => (
                            <div
                              key={candidate.id}
                              className="flex items-center justify-between p-2 border rounded bg-white hover:bg-green-50 cursor-pointer transition-colors"
                            >
                              <div onClick={() => linkFamilyMember(candidate)} className="flex-1">
                                <p className="font-medium text-sm">
                                  {candidate.last_name} {candidate.first_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  患者番号: {candidate.patient_number || '--'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {candidate.address && `住所: ${candidate.address}`}
                                  {candidate.phone && ` / 電話: ${candidate.phone}`}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => linkFamilyMember(candidate)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                連携
                              </Button>
                            </div>
                          ))}
                        </>
                      )}

                      {!searchQuery && familyCandidates.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          同じ住所または電話番号を持つ患者が見つかりません
                        </p>
                      )}
                    </div>
                  )}

                  {/* 連携済み家族リスト */}
                  <div className="space-y-3 max-h-[120px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {familyMembers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 text-sm">連携された家族はいません</p>
                    ) : (
                      familyMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded bg-white">
                          <div>
                            <p className="font-medium text-sm">{member.name}</p>
                            <p className="text-xs text-gray-500">
                              {member.relation && `${member.relation} | `}患者番号: {member.patient_number}
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
                <CardTitle className="flex items-center">
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

                <div>
                  <Label htmlFor="special_notes">特記事項</Label>

                  {/* アイコン選択UI */}
                  <div className="mb-3">
                    <Label className="text-sm text-gray-600 mb-2 block">該当するアイコンを選択</Label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg">
                      {PATIENT_ICONS.filter(icon => icon.enabled).map(iconData => {
                        const IconComponent = iconData.icon
                        const isSelected = selectedIconIds.includes(iconData.id)
                        return (
                          <button
                            key={iconData.id}
                            type="button"
                            onClick={() => toggleIcon(iconData.id)}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border transition-colors ${
                              isSelected
                                ? 'bg-yellow-100 border-yellow-500 text-yellow-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                            title={iconData.title}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span className="text-xs truncate max-w-[100px]">{iconData.title}</span>
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

          {/* 通知・予約設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                通知・予約設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 通知受信設定 */}
              <div className="p-4 border border-gray-200 rounded-lg bg-blue-50/30">
                <Label className="text-base font-semibold text-gray-800 mb-3 block">通知受信設定</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notif_appointment_reminder_modal"
                      checked={notificationPreferences.appointment_reminder}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        appointment_reminder: checked as boolean
                      })}
                    />
                    <Label htmlFor="notif_appointment_reminder_modal" className="cursor-pointer font-normal text-sm">
                      予約リマインド通知を受け取る
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notif_periodic_checkup_modal"
                      checked={notificationPreferences.periodic_checkup}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        periodic_checkup: checked as boolean
                      })}
                    />
                    <Label htmlFor="notif_periodic_checkup_modal" className="cursor-pointer font-normal text-sm">
                      定期検診リマインド通知を受け取る
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notif_treatment_reminder_modal"
                      checked={notificationPreferences.treatment_reminder}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        treatment_reminder: checked as boolean
                      })}
                    />
                    <Label htmlFor="notif_treatment_reminder_modal" className="cursor-pointer font-normal text-sm">
                      治療リマインド通知を受け取る
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notif_appointment_change_modal"
                      checked={notificationPreferences.appointment_change}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        appointment_change: checked as boolean
                      })}
                    />
                    <Label htmlFor="notif_appointment_change_modal" className="cursor-pointer font-normal text-sm">
                      予約変更通知を受け取る
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notif_custom_modal"
                      checked={notificationPreferences.custom}
                      onCheckedChange={(checked) => setNotificationPreferences({
                        ...notificationPreferences,
                        custom: checked as boolean
                      })}
                    />
                    <Label htmlFor="notif_custom_modal" className="cursor-pointer font-normal text-sm">
                      カスタム通知を受け取る
                    </Label>
                  </div>
                </div>
              </div>

              {/* Web予約設定とLINE連携 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Web予約設定 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-green-50/30">
                  <Label className="text-base font-semibold text-gray-800 mb-3 block">Web予約設定</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 基本設定 */}
                    <div className="space-y-3">
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
                    <div className="space-y-3">
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

                {/* LINE連携 */}
                <div className="p-4 border border-gray-200 rounded-lg bg-purple-50/30">
                  <Label className="text-base font-semibold text-gray-800 mb-3 block">LINE連携</Label>
                  <div>
                    <LineLinkageSection patientId={patient?.id || ''} clinicId={clinicId} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-2 pt-6 border-t border-gray-200">
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
