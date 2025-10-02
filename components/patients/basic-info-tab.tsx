'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Users,
  Edit,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'
import { calculateAge } from '@/lib/utils/date'
import { Patient } from '@/types/database'
import { getLinkedQuestionnaireResponse } from '@/lib/api/questionnaires'
import { getStaff, Staff } from '@/lib/api/staff'
import { PATIENT_ICONS, PatientIcon } from '@/lib/constants/patient-icons'

interface BasicInfoTabProps {
  patientId: string
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
  patient_number: number
}

export function BasicInfoTab({ patientId }: BasicInfoTabProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // 編集用の状態
  const [editData, setEditData] = useState({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    address: '', // 統合された住所フィールド
    allergies: '',
    medical_history: '',
    special_notes: '',
    primary_doctor: '',
    assigned_dh: ''
  })

  // 選択されたアイコン
  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([])

  // 患者IDが変わったらローカルストレージからアイコンを読み込む
  useEffect(() => {
    if (patientId) {
      const savedIcons = localStorage.getItem(`patient_icons_${patientId}`)
      if (savedIcons) {
        try {
          const iconIds = JSON.parse(savedIcons)
          setSelectedIconIds(iconIds)
        } catch (e) {
          console.error('アイコンデータの読み込みエラー:', e)
        }
      }
    }
  }, [patientId])

  // アイコンが変更されたらローカルストレージに保存
  useEffect(() => {
    if (patientId && selectedIconIds.length >= 0) {
      localStorage.setItem(`patient_icons_${patientId}`, JSON.stringify(selectedIconIds))
    }
  }, [patientId, selectedIconIds])

  // 保険証情報
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo[]>([])
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  
  // スタッフ情報
  const [staff, setStaff] = useState<Staff[]>([])
  const [doctors, setDoctors] = useState<Staff[]>([])
  const [dentalHygienists, setDentalHygienists] = useState<Staff[]>([])

  // 患者データを読み込み
  useEffect(() => {
    console.log('BasicInfoTab: コンポーネントがマウントされました', { patientId })
    loadPatientData()
    loadStaffData()
  }, [patientId])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

      // 実際の患者データを取得
      const { getPatientById } = await import('@/lib/api/patients')
      const patientData = await getPatientById(DEMO_CLINIC_ID, patientId)

      if (!patientData) {
        console.error('患者データが見つかりません:', patientId)
        setLoading(false)
        return
      }

      console.log('BasicInfoTab: 患者データを取得しました', patientData)

      // 問診票の情報を取得（住所、アレルギー、既往歴）
      try {
        const questionnaireResponse = await getLinkedQuestionnaireResponse(patientId)
        if (questionnaireResponse) {
          const responseData = questionnaireResponse.response_data
          console.log('問診票データ全体:', responseData)

          // 問診票から住所情報を抽出（複数のキーパターンに対応）
          let postalCode = ''
          let address = ''

          // 郵便番号を検索
          for (const key in responseData) {
            const value = responseData[key]
            // 郵便番号形式（XXX-XXXX または XXXXXXX）をチェック
            if (typeof value === 'string' && /^\d{3}-?\d{4}$/.test(value.replace('-', ''))) {
              postalCode = value
              console.log('郵便番号を検出:', { key, value })
              break
            }
          }

          // 住所を検索（郵便番号の次の項目、または特定のキー）
          address = responseData.patient_address || responseData.address || responseData['q1-9'] || ''

          // 郵便番号と住所を統合
          const fullAddress = [postalCode, address]
            .filter(part => part && part.trim() !== '')
            .join(' ')

          // 統合された住所を患者データに反映
          if (fullAddress) {
            patientData.address = fullAddress
          }

          // アレルギー情報を取得
          let allergiesInfo = ''
          if (responseData.allergies) {
            allergiesInfo = responseData.allergies
          } else if (responseData['q1-19'] === 'ある' && responseData['q1-19b']) {
            allergiesInfo = responseData['q1-19b']
          } else if (responseData['q1-19'] === 'ない') {
            allergiesInfo = 'なし'
          }

          if (allergiesInfo) {
            patientData.allergies = allergiesInfo
          }

          // 既往歴（持病・通院中の病気）を取得
          let medicalHistoryInfo = ''
          if (responseData.medical_history) {
            medicalHistoryInfo = responseData.medical_history
          } else if (responseData['q1-23'] === 'ある' && responseData['q1-23b']) {
            // q1-23bが配列の場合は結合
            if (Array.isArray(responseData['q1-23b'])) {
              medicalHistoryInfo = responseData['q1-23b'].join('、')
            } else {
              medicalHistoryInfo = responseData['q1-23b']
            }
          } else if (responseData['q1-23'] === 'ない') {
            medicalHistoryInfo = 'なし'
          }

          if (medicalHistoryInfo) {
            patientData.medical_history = medicalHistoryInfo
          }

          console.log('問診票から情報を取得:', {
            postalCode,
            address,
            fullAddress,
            allergies: allergiesInfo,
            medicalHistory: medicalHistoryInfo,
            keys: Object.keys(responseData)
          })
        }
      } catch (questionnaireError) {
        console.log('問診票の情報取得エラー（無視）:', questionnaireError)
        // 問診票の取得に失敗しても患者データの読み込みは続行
      }

      setPatient(patientData)
      setEditData({
        last_name: patientData.last_name,
        first_name: patientData.first_name,
        last_name_kana: patientData.last_name_kana || '',
        first_name_kana: patientData.first_name_kana || '',
        birth_date: patientData.birth_date || '',
        gender: patientData.gender || '',
        phone: patientData.phone || '',
        email: patientData.email || '',
        address: patientData.address || '',
        allergies: patientData.allergies || '',
        medical_history: patientData.medical_history || '',
        special_notes: '',
        primary_doctor: '',
        assigned_dh: ''
      })
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStaffData = async () => {
    try {
      const staffData = await getStaff('clinic-1')
      setStaff(staffData)
      
      // 歯科医師をフィルタリング（役職名で判定）
      const doctorsList = staffData.filter(member => {
        // position.name（役職名）で判定
        const positionName = (member as any).position?.name || ''
        const roleName = member.role || ''
        
        // 役職名またはroleに「医師」「ドクター」「doctor」が含まれる場合
        return positionName.includes('歯科医師') || 
               positionName.includes('医師') || 
               positionName.includes('ドクター') || 
               positionName.toLowerCase().includes('doctor') ||
               roleName.toLowerCase() === 'doctor' || 
               roleName.includes('医師') || 
               roleName.includes('ドクター')
      })
      setDoctors(doctorsList)
      
      // 歯科衛生士をフィルタリング（役職名で判定）
      const dhList = staffData.filter(member => {
        // position.name（役職名）で判定
        const positionName = (member as any).position?.name || ''
        const roleName = member.role || ''
        
        // 役職名またはroleに「衛生士」「DH」「hygienist」が含まれる場合
        return positionName.includes('歯科衛生士') || 
               positionName.includes('衛生士') || 
               positionName.includes('DH') || 
               positionName.toLowerCase().includes('hygienist') ||
               roleName.toLowerCase() === 'hygienist' || 
               roleName.includes('衛生士') || 
               roleName.includes('DH')
      })
      setDentalHygienists(dhList)
      
      console.log('スタッフデータを読み込み:', {
        total: staffData.length,
        doctors: doctorsList.length,
        dentalHygienists: dhList.length,
        staffDetails: staffData.map(s => ({ 
          name: s.name, 
          role: s.role, 
          position_id: s.position_id,
          position_name: (s as any).position?.name || 'なし'
        }))
      })
      
      // デバッグ用のアラート（開発中のみ）
      if (staffData.length === 0) {
        console.warn('スタッフデータが空です')
      } else {
        console.log('全スタッフデータ:', staffData)
      }
      if (doctorsList.length === 0) {
        console.warn('歯科医師が見つかりません')
        console.log('フィルタリング前のスタッフ:', staffData.map(s => ({
          name: s.name,
          role: s.role,
          position_name: (s as any).position?.name,
          position_id: s.position_id
        })))
      } else {
        console.log('見つかった歯科医師:', doctorsList)
      }
      if (dhList.length === 0) {
        console.warn('歯科衛生士が見つかりません')
      } else {
        console.log('見つかった歯科衛生士:', dhList)
      }
    } catch (error) {
      console.error('スタッフデータの読み込みエラー:', error)
    }
  }

  const handleSave = async () => {
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      console.log('患者データを保存:', editData)
      setIsEditing(false)
    } catch (error) {
      console.error('保存エラー:', error)
    }
  }

  const handleCancel = () => {
    if (patient) {
      setEditData({
        last_name: patient.last_name,
        first_name: patient.first_name,
        last_name_kana: patient.last_name_kana,
        first_name_kana: patient.first_name_kana,
        birth_date: patient.birth_date,
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        allergies: patient.allergies || '',
        medical_history: patient.medical_history || '',
        special_notes: '',
        primary_doctor: '',
        assigned_dh: ''
      })
    }
    setIsEditing(false)
  }

  if (loading) {
    return <div className="flex justify-center py-8">読み込み中...</div>
  }

  if (!patient) {
    return <div className="text-center py-8 text-gray-500">患者データが見つかりません</div>
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">基本情報</h3>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                キャンセル
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          )}
        </div>
      </div>

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
            <div className="space-y-4">
              {/* 氏名（漢字） */}
              <div>
                <Label htmlFor="full_name">氏名</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-lg font-medium">
                      {editData.last_name} {editData.first_name}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 氏名（フリガナ） */}
              <div>
                <Label htmlFor="full_name_kana">氏名（フリガナ）</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.last_name_kana} {editData.first_name_kana}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">生年月日</Label>
                {isEditing ? (
                  <div>
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.birth_date ? editData.birth_date.replace(/-/g, '/') : '--'}
                      {editData.birth_date && (
                        <span className="ml-2">
                          ({calculateAge(editData.birth_date)}歳)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="gender">性別</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.gender === 'male' ? '男性' : editData.gender === 'female' ? '女性' : '--'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">電話番号</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.phone || '--'}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.email || '--'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="address">住所</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  placeholder="住所を入力してください"
                  className="min-h-[80px]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {editData.address || '--'}
                  </div>
                </div>
              )}
            </div>

            {/* 家族連携 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">家族連携</Label>
                <Button size="sm" variant="outline" disabled={!isEditing}>
                  <Plus className="w-4 h-4 mr-2" />
                  家族を追加
                </Button>
              </div>
              <div className="space-y-3 max-h-[120px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
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
                      {isEditing && (
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-800 h-6 w-6 p-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 担当者設定 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_doctor">主担当医</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.primary_doctor ? 
                        doctors.find(d => d.id === editData.primary_doctor)?.name || '--' 
                        : '--'
                      }
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="assigned_dh">主担当DH</Label>
                {isEditing ? (
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
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="text-sm text-gray-600">
                      {editData.assigned_dh ? 
                        dentalHygienists.find(dh => dh.id === editData.assigned_dh)?.name || '--' 
                        : '--'
                      }
                    </div>
                  </div>
                )}
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
              {isEditing ? (
                <Textarea
                  id="medical_history"
                  value={editData.medical_history}
                  onChange={(e) => setEditData({ ...editData, medical_history: e.target.value })}
                  placeholder="既往歴を入力してください"
                  className="h-[80px] resize-none overflow-y-auto"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {editData.medical_history || '--'}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="medications">服用薬</Label>
              {isEditing ? (
                <Textarea
                  id="medications"
                  value={editData.medications}
                  onChange={(e) => setEditData({ ...editData, medications: e.target.value })}
                  placeholder="現在服用中の薬を入力してください"
                  className="h-[80px] resize-none overflow-y-auto"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {editData.medications || '--'}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="allergies">アレルギー（必須確認項目）</Label>
              {isEditing ? (
                <Textarea
                  id="allergies"
                  value={editData.allergies}
                  onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
                  placeholder="アレルギー情報を入力してください"
                  className="h-[80px] resize-none overflow-y-auto"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {editData.allergies || '--'}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="special_notes">特記事項</Label>
              
              {/* アイコン選択UI（常に表示・編集可能） */}
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

              {isEditing ? (
                <Textarea
                  id="special_notes"
                  value={editData.special_notes}
                  onChange={(e) => setEditData({ ...editData, special_notes: e.target.value })}
                  placeholder="その他の特記事項を入力してください"
                  className="min-h-[100px]"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-600">
                    {editData.special_notes || '--'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
