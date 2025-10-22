'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Trash2,
  Search
} from 'lucide-react'
import { calculateAge } from '@/lib/utils/date'
import { Patient } from '@/types/database'
import { getLinkedQuestionnaireResponse } from '@/lib/api/questionnaires'
import { getStaff, Staff } from '@/lib/api/staff'
import { PATIENT_ICONS, PatientIcon } from '@/lib/constants/patient-icons'
import { getPatientById, updatePatient } from '@/lib/api/patients'
import {
  getPatientNotificationPreferences,
  upsertPatientNotificationPreferences
} from '@/lib/api/patient-notification-preferences'
import {
  getPatientWebBookingSettings,
  upsertPatientWebBookingSettings,
  PatientWebBookingSettings
} from '@/lib/api/patient-web-booking-settings'

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
    visit_reason: '', // 来院理由
    allergies: '',
    medical_history: '',
    medications: '', // 服用薬
    special_notes: '',
    primary_doctor: '',
    assigned_dh: ''
  })

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

  // 家族連携候補
  const [familyCandidates, setFamilyCandidates] = useState<Patient[]>([])
  const [showFamilyCandidates, setShowFamilyCandidates] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])

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

  // 他のコンポーネントでの通知設定変更を検知
  useEffect(() => {
    const handleNotificationUpdate = async (event: any) => {
      console.log('BasicInfoTab: 通知設定が更新されました')
      // 通知設定を再読み込み
      try {
        const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'
        const preferencesData = await getPatientNotificationPreferences(patientId, DEMO_CLINIC_ID)
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
  }, [patientId])

  // 患者データが読み込まれたら家族候補を検索
  useEffect(() => {
    if (patient) {
      searchFamilyCandidates()
    }
  }, [patient])

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

          // 問診票から情報を抽出
          // 初診問診票の場合:
          // q1-5: 郵便番号
          // q1-6: 住所
          // q1-9: 携帯電話番号
          // q1-10: Eメールアドレス
          // q1-11: 来院のきっかけ（配列）

          const postalCode = responseData['q1-5'] || ''
          const address = responseData['q1-6'] || ''
          const phone = responseData['q1-9'] || ''
          const email = responseData['q1-10'] || ''
          const visitReason = responseData['q1-11'] || []

          // 郵便番号と住所を統合
          const fullAddress = [postalCode, address]
            .filter(part => part && part.trim() !== '')
            .join(' ')

          // 患者データに反映
          if (fullAddress) {
            patientData.address = fullAddress
          }
          if (phone) {
            patientData.phone = phone
          }
          // メールアドレスは明示的に設定（空文字列も含む）
          patientData.email = email

          // 来院理由を患者データに追加（配列を文字列に変換）
          if (Array.isArray(visitReason) && visitReason.length > 0) {
            patientData.visit_reason = visitReason.join('、')
          } else if (typeof visitReason === 'string' && visitReason) {
            // 文字列の場合もサポート
            patientData.visit_reason = visitReason
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

          // 服用薬情報を取得
          let medicationsInfo = ''
          // 問診票の質問を探す（質問テキストで検索）
          for (const key in responseData) {
            const value = responseData[key]
            // 「現在服用しているお薬」の回答をチェック
            if (key.includes('現在服用') || key.includes('薬')) {
              if (value === 'ある' || value === 'あり') {
                // 薬剤名の詳細を探す
                const detailKeys = Object.keys(responseData).filter(k =>
                  k.includes('薬剤名') || k.includes('お薬手帳') || k.includes('点滴') || k.includes('注射')
                )
                if (detailKeys.length > 0) {
                  medicationsInfo = responseData[detailKeys[0]]
                } else {
                  medicationsInfo = 'あり（詳細未記入）'
                }
                break
              } else if (value === 'ない' || value === 'なし') {
                medicationsInfo = 'なし'
                break
              }
            }
          }

          // 代替: responseData.medicationsが存在する場合
          if (!medicationsInfo && responseData.medications) {
            medicationsInfo = responseData.medications
          }

          if (medicationsInfo) {
            patientData.medications = medicationsInfo
          }

          console.log('問診票から情報を取得:', {
            postalCode,
            address,
            fullAddress,
            allergies: allergiesInfo,
            medicalHistory: medicalHistoryInfo,
            medications: medicationsInfo,
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
        visit_reason: (patientData as any).visit_reason || '',
        allergies: patientData.allergies || '',
        medical_history: patientData.medical_history || '',
        medications: (patientData as any).medications || '',
        special_notes: '',
        primary_doctor: '',
        assigned_dh: ''
      })

      // 通知受信設定を読み込む
      try {
        const preferencesData = await getPatientNotificationPreferences(patientId, DEMO_CLINIC_ID)
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
        const webBookingData = await getPatientWebBookingSettings(patientId, DEMO_CLINIC_ID)
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

      // 保存されているアイコンデータを読み込む
      if ((patientData as any).patient_icons) {
        setSelectedIconIds((patientData as any).patient_icons)
        // ローカルストレージにも保存
        localStorage.setItem(`patient_icons_${patientId}`, JSON.stringify((patientData as any).patient_icons))
      } else {
        // データベースに保存されていない場合は、ローカルストレージから読み込む
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

      // 保存されている家族連携データを読み込む
      if ((patientData as any).family_members && Array.isArray((patientData as any).family_members)) {
        setFamilyMembers((patientData as any).family_members)
      }
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

  // 家族候補を検索（住所または電話番号が一致する患者）
  const searchFamilyCandidates = async () => {
    try {
      const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'
      const { getPatients } = await import('@/lib/api/patients')
      const allPatients = await getPatients(DEMO_CLINIC_ID)

      if (!patient) return

      // 既に連携されている家族のIDリスト
      const linkedFamilyIds = familyMembers.map(f => f.id)

      // 住所または電話番号が一致する患者を検索（自分自身と既に連携済みを除く）
      const candidates = allPatients.filter(p => {
        if (p.id === patientId) return false // 自分自身を除外
        if (linkedFamilyIds.includes(p.id)) return false // 既に連携済みを除外

        // 住所が一致（空でない場合）
        const addressMatch = patient.address && p.address && patient.address === p.address

        // 電話番号が一致（空でない場合）
        const phoneMatch = patient.phone && p.phone && patient.phone === p.phone

        return addressMatch || phoneMatch
      })

      setFamilyCandidates(candidates)
    } catch (error) {
      console.error('家族候補の検索エラー:', error)
    }
  }

  // 家族として連携
  const linkFamilyMember = (candidatePatient: Patient) => {
    const newMember: FamilyMember = {
      id: candidatePatient.id,
      name: `${candidatePatient.last_name} ${candidatePatient.first_name}`,
      relation: '', // 関係性は後で編集可能
      patient_number: (candidatePatient as any).patient_number || 0
    }

    setFamilyMembers([...familyMembers, newMember])
    setShowFamilyCandidates(false)

    // 候補リストから削除
    setFamilyCandidates(familyCandidates.filter(c => c.id !== candidatePatient.id))
  }

  // 家族連携を解除
  const unlinkFamilyMember = (memberId: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== memberId))
    // 候補を再検索
    searchFamilyCandidates()
  }

  // 患者を検索（名前または診察券番号）
  const searchPatients = async (query: string) => {
    if (!query || query.trim() === '') {
      setSearchResults([])
      return
    }

    try {
      const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'
      const { getPatients } = await import('@/lib/api/patients')
      const allPatients = await getPatients(DEMO_CLINIC_ID)

      // 既に連携されている家族のIDリスト
      const linkedFamilyIds = familyMembers.map(f => f.id)

      const results = allPatients.filter(p => {
        if (p.id === patientId) return false // 自分自身を除外
        if (linkedFamilyIds.includes(p.id)) return false // 既に連携済みを除外

        const fullName = `${p.last_name}${p.first_name}`.toLowerCase()
        const fullNameKana = `${p.last_name_kana}${p.first_name_kana}`.toLowerCase()
        const patientNumber = String((p as any).patient_number || '')
        const searchLower = query.toLowerCase().replace(/\s+/g, '')

        // 名前、ふりがな、診察券番号で検索
        return (
          fullName.includes(searchLower) ||
          fullNameKana.includes(searchLower) ||
          patientNumber.includes(query)
        )
      })

      setSearchResults(results)
    } catch (error) {
      console.error('患者検索エラー:', error)
    }
  }

  // 検索クエリが変更されたら検索実行
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    searchPatients(value)
  }

  const handleSave = async () => {
    try {
      const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

      // 患者データの更新
      const updateData = {
        ...editData,
        patient_icons: selectedIconIds, // 特記事項アイコンを含める
        family_members: familyMembers // 家族連携を含める
      }

      console.log('患者データを保存:', updateData)

      // 患者データを更新
      await updatePatient(DEMO_CLINIC_ID, patientId, updateData)

      // 通知受信設定を保存
      try {
        await upsertPatientNotificationPreferences(patientId, DEMO_CLINIC_ID, notificationPreferences)
        console.log('通知受信設定の保存に成功しました')

        // 他のコンポーネントに更新を通知
        window.dispatchEvent(new CustomEvent('notificationPreferencesUpdated', {
          detail: { patientId, preferences: notificationPreferences }
        }))
      } catch (preferencesError) {
        console.error('通知受信設定の保存エラー:', preferencesError)
        // エラーでも患者データの保存は続行
      }

      // Web予約設定を保存
      try {
        await upsertPatientWebBookingSettings(patientId, DEMO_CLINIC_ID, webBookingSettings)
        console.log('Web予約設定の保存に成功しました')

        // 他のコンポーネントに更新を通知
        window.dispatchEvent(new CustomEvent('webBookingSettingsUpdated', {
          detail: { patientId, settings: webBookingSettings }
        }))
      } catch (webBookingError) {
        console.error('Web予約設定の保存エラー:', webBookingError)
        // エラーでも患者データの保存は続行
      }

      // ローカルストレージにアイコンを保存
      localStorage.setItem(`patient_icons_${patientId}`, JSON.stringify(selectedIconIds))

      // 患者データを再読み込み
      await loadPatientData()

      setIsEditing(false)
      console.log('患者データの保存に成功しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('患者データの保存に失敗しました')
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
        visit_reason: (patient as any).visit_reason || '',
        allergies: patient.allergies || '',
        medical_history: patient.medical_history || '',
        medications: (patient as any).medications || '',
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
                            <div key={candidate.id} className="flex items-center justify-between p-2 border rounded bg-white hover:bg-green-50 cursor-pointer transition-colors">
                              <div onClick={() => linkFamilyMember(candidate)} className="flex-1">
                                <p className="font-medium text-sm">
                                  {candidate.last_name} {candidate.first_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  患者番号: {(candidate as any).patient_number || '--'}
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
                        <div key={candidate.id} className="flex items-center justify-between p-2 border rounded bg-white hover:bg-green-50 cursor-pointer transition-colors">
                          <div onClick={() => linkFamilyMember(candidate)} className="flex-1">
                            <p className="font-medium text-sm">
                              {candidate.last_name} {candidate.first_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              患者番号: {(candidate as any).patient_number || '--'}
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

            {/* 通知受信設定 */}
            <div>
              <Label>通知受信設定</Label>
              <div className="p-3 bg-gray-50 rounded-md space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_appointment_reminder"
                    checked={notificationPreferences.appointment_reminder}
                    onCheckedChange={(checked) => setNotificationPreferences({
                      ...notificationPreferences,
                      appointment_reminder: checked as boolean
                    })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="notif_appointment_reminder" className="cursor-pointer font-normal text-sm">
                    予約リマインド通知を受け取る
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_periodic_checkup"
                    checked={notificationPreferences.periodic_checkup}
                    onCheckedChange={(checked) => setNotificationPreferences({
                      ...notificationPreferences,
                      periodic_checkup: checked as boolean
                    })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="notif_periodic_checkup" className="cursor-pointer font-normal text-sm">
                    定期検診リマインド通知を受け取る
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_treatment_reminder"
                    checked={notificationPreferences.treatment_reminder}
                    onCheckedChange={(checked) => setNotificationPreferences({
                      ...notificationPreferences,
                      treatment_reminder: checked as boolean
                    })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="notif_treatment_reminder" className="cursor-pointer font-normal text-sm">
                    治療リマインド通知を受け取る
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_appointment_change"
                    checked={notificationPreferences.appointment_change}
                    onCheckedChange={(checked) => setNotificationPreferences({
                      ...notificationPreferences,
                      appointment_change: checked as boolean
                    })}
                    disabled={!isEditing}
                  />
                  <Label htmlFor="notif_appointment_change" className="cursor-pointer font-normal text-sm">
                    予約変更通知を受け取る
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notif_custom"
                    checked={notificationPreferences.custom}
                    onCheckedChange={(checked) => setNotificationPreferences({
                      ...notificationPreferences,
                      custom: checked as boolean
                    })}
                    disabled={!isEditing}
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
                      id="web_booking_enabled"
                      checked={webBookingSettings.web_booking_enabled}
                      onCheckedChange={(checked) => setWebBookingSettings({
                        ...webBookingSettings,
                        web_booking_enabled: checked as boolean
                      })}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="web_booking_enabled" className="cursor-pointer font-normal text-sm">
                      Web予約を許可する
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="web_cancel_enabled"
                      checked={webBookingSettings.web_cancel_enabled}
                      onCheckedChange={(checked) => setWebBookingSettings({
                        ...webBookingSettings,
                        web_cancel_enabled: checked as boolean
                      })}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="web_cancel_enabled" className="cursor-pointer font-normal text-sm">
                      Webキャンセルを許可する
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="web_reschedule_enabled"
                      checked={webBookingSettings.web_reschedule_enabled}
                      onCheckedChange={(checked) => setWebBookingSettings({
                        ...webBookingSettings,
                        web_reschedule_enabled: checked as boolean
                      })}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="web_reschedule_enabled" className="cursor-pointer font-normal text-sm">
                      Web日程変更を許可する
                    </Label>
                  </div>
                </div>

                {/* 制限設定 */}
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <Label htmlFor="web_cancel_limit" className="text-sm">月間キャンセル回数制限</Label>
                    <select
                      id="web_cancel_limit"
                      value={webBookingSettings.web_cancel_limit === null ? 'unlimited' : webBookingSettings.web_cancel_limit}
                      onChange={(e) => setWebBookingSettings({
                        ...webBookingSettings,
                        web_cancel_limit: e.target.value === 'unlimited' ? null : parseInt(e.target.value)
                      })}
                      disabled={!isEditing}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
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
                    <Label htmlFor="cancel_deadline_hours" className="text-sm">キャンセル可能期限</Label>
                    <select
                      id="cancel_deadline_hours"
                      value={webBookingSettings.cancel_deadline_hours === null ? 'no_limit' : webBookingSettings.cancel_deadline_hours}
                      onChange={(e) => setWebBookingSettings({
                        ...webBookingSettings,
                        cancel_deadline_hours: e.target.value === 'no_limit' ? null : parseInt(e.target.value)
                      })}
                      disabled={!isEditing}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
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
                    <Label htmlFor="max_concurrent_bookings" className="text-sm">同時予約可能件数</Label>
                    <select
                      id="max_concurrent_bookings"
                      value={webBookingSettings.max_concurrent_bookings === null ? 'unlimited' : webBookingSettings.max_concurrent_bookings}
                      onChange={(e) => setWebBookingSettings({
                        ...webBookingSettings,
                        max_concurrent_bookings: e.target.value === 'unlimited' ? null : parseInt(e.target.value)
                      })}
                      disabled={!isEditing}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
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
