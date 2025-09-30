'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Save, User, Heart, Users } from 'lucide-react'
import { Patient } from '@/types/database'
import { calculateAge } from '@/lib/utils/date'
import { getLinkedQuestionnaireResponse } from '@/lib/api/questionnaires'
import { getStaff, Staff } from '@/lib/api/staff'
import { PATIENT_ICONS } from '@/lib/constants/patient-icons'

interface PatientEditModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient | null
  onSave?: (patientData: any) => void
}

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
    allergies: '',
    medical_history: '',
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

  // 患者データが変更されたら編集データを更新
  useEffect(() => {
    if (patient) {
      loadPatientData()
      loadStaffData()
      loadPatientIcons()
    }
  }, [patient])

  const loadPatientData = async () => {
    if (!patient) return

    // 問診票から住所情報を取得
    let fullAddress = patient.address || ''
    try {
      const questionnaireResponse = await getLinkedQuestionnaireResponse(patient.id)
      if (questionnaireResponse) {
        const responseData = questionnaireResponse.response_data
        
        const postalCode = responseData.postal_code || responseData['q1-5'] || ''
        const prefecture = responseData.prefecture || responseData['q1-6'] || ''
        const city = responseData.city || responseData['q1-7'] || ''
        const addressLine = responseData.address_line || responseData['q1-8'] || ''
        
        fullAddress = [postalCode, prefecture, city, addressLine]
          .filter(part => part && part.trim() !== '')
          .join(' ')
      }
    } catch (error) {
      console.log('問診票の住所情報取得エラー（無視）:', error)
    }

    setEditData({
      last_name: patient.last_name,
      first_name: patient.first_name,
      last_name_kana: patient.last_name_kana,
      first_name_kana: patient.first_name_kana,
      birth_date: patient.birth_date,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email || '',
      address: fullAddress,
      allergies: patient.allergies || '',
      medical_history: patient.medical_history || '',
      special_notes: '',
      primary_doctor: '',
      assigned_dh: ''
    })
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

  const handleSave = async () => {
    if (!patient) return

    try {
      setSaving(true)
      
      // アイコンをローカルストレージに保存
      localStorage.setItem(`patient_icons_${patient.id}`, JSON.stringify(selectedIconIds))
      
      // 患者データを保存
      console.log('患者データを保存:', editData)
      
      // 親コンポーネントのコールバックを呼び出し
      if (onSave) {
        onSave(editData)
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
                  <Label htmlFor="allergies">アレルギー（必須確認項目）</Label>
                  <Textarea
                    id="allergies"
                    value={editData.allergies}
                    onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
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
                    placeholder="既往歴を入力してください"
                    className="min-h-[100px]"
                  />
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

            {/* 担当者設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
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
