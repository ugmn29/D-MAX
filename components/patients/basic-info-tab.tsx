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
      // TODO: 実際のAPI呼び出しに置き換え
      const mockPatient: Patient = {
        id: patientId,
        clinic_id: '11111111-1111-1111-1111-111111111111',
        patient_number: 1,
        last_name: '福永',
        first_name: '真大',
        last_name_kana: 'フクナガ',
        first_name_kana: 'シンダイ',
        birth_date: '1995-02-09',
        gender: 'male',
        phone: '08014103036',
        email: '',
        postal_code: '',
        prefecture: '',
        city: '',
        address_line: '',
        allergies: '',
        medical_history: '',
        is_registered: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // 問診票の住所情報を取得
      try {
        const questionnaireResponse = await getLinkedQuestionnaireResponse(patientId)
        if (questionnaireResponse) {
          const responseData = questionnaireResponse.response_data
          
          // 問診票から住所情報を抽出
          const postalCode = responseData.postal_code || responseData['q1-5'] || ''
          const prefecture = responseData.prefecture || responseData['q1-6'] || ''
          const city = responseData.city || responseData['q1-7'] || ''
          const addressLine = responseData.address_line || responseData['q1-8'] || ''
          
          // 住所情報を統合
          const fullAddress = [postalCode, prefecture, city, addressLine]
            .filter(part => part && part.trim() !== '')
            .join(' ')
          
          // 統合された住所を患者データに反映
          mockPatient.address = fullAddress
          
          console.log('問診票から住所情報を取得（統合）:', {
            postalCode,
            prefecture,
            city,
            addressLine,
            fullAddress
          })
        }
      } catch (questionnaireError) {
        console.log('問診票の住所情報取得エラー（無視）:', questionnaireError)
        // 問診票の取得に失敗しても患者データの読み込みは続行
      }
      
      setPatient(mockPatient)
      setEditData({
        last_name: mockPatient.last_name,
        first_name: mockPatient.first_name,
        last_name_kana: mockPatient.last_name_kana,
        first_name_kana: mockPatient.first_name_kana,
        birth_date: mockPatient.birth_date,
        gender: mockPatient.gender,
        phone: mockPatient.phone,
        email: mockPatient.email || '',
        address: mockPatient.address || '',
        allergies: mockPatient.allergies || '',
        medical_history: mockPatient.medical_history || '',
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last_name">姓</Label>
                <Input
                  id="last_name"
                  value={editData.last_name}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="first_name">名</Label>
                <Input
                  id="first_name"
                  value={editData.first_name}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="last_name_kana">姓（フリガナ）</Label>
                <Input
                  id="last_name_kana"
                  value={editData.last_name_kana}
                  onChange={(e) => setEditData({ ...editData, last_name_kana: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="first_name_kana">名（フリガナ）</Label>
                <Input
                  id="first_name_kana"
                  value={editData.first_name_kana}
                  onChange={(e) => setEditData({ ...editData, first_name_kana: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="birth_date">生年月日</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={editData.birth_date}
                  onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })}
                  disabled={!isEditing}
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
                  disabled={!isEditing}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">住所</Label>
              <Textarea
                id="address"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="住所を入力してください"
                className="min-h-[80px]"
              />
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
              <Label htmlFor="allergies">アレルギー（必須確認項目）</Label>
              <Textarea
                id="allergies"
                value={editData.allergies}
                onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
                disabled={!isEditing}
                placeholder="アレルギー情報を入力してください"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="medical_history">既往歴</Label>
              <Textarea
                id="medical_history"
                value={editData.medical_history}
                onChange={(e) => setEditData({ ...editData, medical_history: e.target.value })}
                disabled={!isEditing}
                placeholder="既往歴を入力してください"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="special_notes">特記事項</Label>
              
              {/* 選択されたアイコンを表示 */}
              {selectedIconIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
                  {selectedIconIds.map(iconId => {
                    const iconData = PATIENT_ICONS.find(i => i.id === iconId)
                    if (!iconData) return null
                    const IconComponent = iconData.icon
                    return (
                      <Badge
                        key={iconId}
                        variant="outline"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-xs">{iconData.title}</span>
                        {isEditing && (
                          <button
                            onClick={() => setSelectedIconIds(prev => prev.filter(id => id !== iconId))}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* 編集モード時: アイコン選択UI */}
              {isEditing && (
                <div className="mb-3">
                  <Label className="text-sm text-gray-600 mb-2 block">アイコンを選択</Label>
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
                          className={`flex items-center gap-1 px-3 py-2 rounded-md border transition-colors ${
                            isSelected
                              ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-xs">{iconData.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Textarea
                id="special_notes"
                value={editData.special_notes}
                onChange={(e) => setEditData({ ...editData, special_notes: e.target.value })}
                disabled={!isEditing}
                placeholder="その他の特記事項を入力してください"
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* 担当者設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              担当者設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_doctor">主担当医</Label>
              <Select
                value={editData.primary_doctor}
                onValueChange={(value) => setEditData({ ...editData, primary_doctor: value })}
                disabled={!isEditing}
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
                      歯科医師が登録されていません (編集モードで確認)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isEditing && (
                <p className="text-sm text-gray-500 mt-1">編集ボタンを押して選択してください</p>
              )}
            </div>

            <div>
              <Label htmlFor="assigned_dh">主担当DH</Label>
              <Select
                value={editData.assigned_dh}
                onValueChange={(value) => setEditData({ ...editData, assigned_dh: value })}
                disabled={!isEditing}
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
                      歯科衛生士が登録されていません (編集モードで確認)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isEditing && (
                <p className="text-sm text-gray-500 mt-1">編集ボタンを押して選択してください</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 家族連携 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                家族連携
              </div>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                家族を追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {familyMembers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">連携された家族はいません</p>
              ) : (
                familyMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">
                        {member.relation} | 患者番号: {member.patient_number}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
