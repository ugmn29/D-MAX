'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Printer, X, FileText, AlertCircle, Phone, Mail, FileCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'
import { CollaborationInquiryData } from '@/types/medical-information-letter'

interface CollaborationInquiryFormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

const initialFormData: Omit<CollaborationInquiryData, 'documentType'> = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),

  // 患者基本情報
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  address: '',
  phone: '',

  // 照会先情報
  requestedInstitution: '',
  requestedDoctor: '',
  requestedInstitutionType: '医科機関',

  // 照会内容
  inquiryType: '文書',
  inquiryPurpose: '',
  systemicManagementReason: '',
  diagnosis: '',
  treatmentPolicy: '',

  // 求める情報
  requestedInformation: [],
  requestedInformationDetail: '',

  remarks: '',

  // 紹介元情報
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  dentistName: ''
}

const INFORMATION_TYPES = [
  '検査結果',
  '投薬内容',
  '服用薬の情報',
  '血液検査データ',
  '画像診断結果',
  '処方薬詳細',
  'アレルギー情報',
  '既往歴',
  '現病歴',
  '治療経過'
]

// 定型文テンプレート
const INQUIRY_TEMPLATES = [
  {
    id: 'extraction',
    name: '抜歯の可否確認',
    inquiryPurpose: '抜歯処置を予定しているため、全身状態の確認と抜歯の可否についてご教示をお願いいたします。',
    systemicManagementReason: '患者様は抗凝固薬を服用中であり、観血的処置である抜歯を行うにあたり、全身的管理が必要と判断いたしました。出血リスクの評価と、必要に応じた休薬や代替療法についてご指導をいただきたく存じます。',
    treatmentPolicy: '残根状態の歯牙の抜歯を予定しております。全身状態を確認の上、安全に処置を行いたいと考えております。',
    requestedInformation: ['投薬内容', '血液検査データ', '処方薬詳細'],
    requestedInformationDetail: `・現在服用中の抗凝固薬・抗血小板薬の種類と用量
・最近の血液検査データ（PT-INR値、血小板数等）
・抜歯時の休薬の必要性について
・代替療法の検討が必要な場合はその内容
・その他、抜歯時の注意事項`
  },
  {
    id: 'implant',
    name: 'インプラント治療の可否確認',
    inquiryPurpose: 'インプラント治療を希望されており、全身状態の確認とインプラント治療の可否についてご教示をお願いいたします。',
    systemicManagementReason: '患者様は糖尿病・骨粗鬆症の既往があり、インプラント治療を行うにあたり、全身的管理が必要と判断いたしました。特に骨代謝や創傷治癒への影響、BP製剤の使用歴について確認が必要です。',
    treatmentPolicy: '欠損部位へのインプラント埋入を検討しております。全身状態を確認の上、治療の可否を判断したいと考えております。',
    requestedInformation: ['投薬内容', '血液検査データ', '処方薬詳細', '既往歴', '治療経過'],
    requestedInformationDetail: `・糖尿病のコントロール状態（HbA1c値等）
・骨粗鬆症治療薬（BP製剤等）の使用歴と現在の投薬状況
・その他インプラント治療に影響を及ぼす可能性のある疾患・投薬
・インプラント治療の可否についてのご意見
・治療を行う場合の注意事項`
  },
  {
    id: 'medication_change',
    name: '薬剤変更・休薬の依頼',
    inquiryPurpose: '歯科治療を安全に行うため、服用中の薬剤の変更または一時的な休薬についてご検討をお願いいたします。',
    systemicManagementReason: '患者様は抗凝固薬を長期服用中であり、今後予定している観血的処置（抜歯、歯周外科等）において出血のリスクが高いと判断いたしました。処置を安全に行うため、薬剤の調整についてご相談させていただきたく存じます。',
    treatmentPolicy: '観血的処置を予定しております。出血リスクを最小限にするため、薬剤の調整をご検討いただきたいと考えております。',
    requestedInformation: ['投薬内容', '処方薬詳細'],
    requestedInformationDetail: `・現在の抗凝固薬・抗血小板薬の種類と用量
・処置前の休薬の可否と期間
・代替薬への変更の可否
・休薬が困難な場合の対応方法
・処置後の投薬再開のタイミング`
  },
  {
    id: 'medication_status',
    name: '服薬状況の確認',
    inquiryPurpose: '患者様の服薬状況を正確に把握し、安全な歯科治療を提供するため、現在の投薬内容についてご教示をお願いいたします。',
    systemicManagementReason: '患者様は複数の医療機関を受診されており、全ての服用薬を正確に把握する必要があると判断いたしました。特に歯科治療に影響を及ぼす可能性のある薬剤について確認が必要です。',
    treatmentPolicy: '全身状態を考慮した適切な歯科治療を提供したいと考えております。',
    requestedInformation: ['投薬内容', '服用薬の情報', '処方薬詳細', 'アレルギー情報'],
    requestedInformationDetail: `・現在処方されている全ての薬剤の名称と用量
・服薬のコンプライアンス状況
・薬物アレルギーの有無
・歯科治療において注意すべき薬剤の有無
・薬剤の相互作用について留意すべき事項`
  },
  {
    id: 'general_condition',
    name: '全身状態の確認',
    inquiryPurpose: '患者様の全身状態を把握し、安全な歯科治療を提供するため、現在の病状と治療状況についてご教示をお願いいたします。',
    systemicManagementReason: '患者様は全身疾患の既往があり、歯科治療を行うにあたり、現在の病状と治療状況を正確に把握する必要があると判断いたしました。',
    treatmentPolicy: '全身状態を十分に考慮した上で、適切な歯科治療を提供したいと考えております。',
    requestedInformation: ['検査結果', '投薬内容', '既往歴', '現病歴', '治療経過'],
    requestedInformationDetail: `・現在の病状とコントロール状態
・最近の検査データ（血液検査、画像検査等）
・現在の治療内容と投薬状況
・歯科治療において注意すべき事項
・歯科治療の可否についてのご意見`
  },
  {
    id: 'perioperative_management',
    name: '周術期の管理についての相談',
    inquiryPurpose: '歯科の観血的処置を予定しており、周術期の全身管理についてご指導をお願いいたします。',
    systemicManagementReason: '患者様は心疾患・糖尿病等の全身疾患を有しており、観血的処置を安全に行うため、周術期の全身管理が必要と判断いたしました。',
    treatmentPolicy: '抜歯または歯周外科処置を予定しております。周術期の管理方法についてご指導いただきたいと考えております。',
    requestedInformation: ['投薬内容', '血液検査データ', '治療経過'],
    requestedInformationDetail: `・術前に中止すべき薬剤の有無と期間
・術中・術後の感染予防について（抗菌薬の予防投与等）
・血糖コントロールへの影響と対策
・循環器系への配慮事項
・その他周術期管理において注意すべき事項`
  },
  {
    id: 'bisphosphonate',
    name: 'BP製剤使用患者の治療相談',
    inquiryPurpose: '患者様がビスフォスフォネート製剤を使用中であり、歯科治療（特に抜歯等の観血処置）の可否と注意事項についてご教示をお願いいたします。',
    systemicManagementReason: '患者様は骨粗鬆症の治療でビスフォスフォネート製剤を使用中であり、顎骨�壊死のリスクがあるため、観血的処置を行う前に詳細な情報確認が必要と判断いたしました。',
    treatmentPolicy: '抜歯が必要な状態ですが、BP製剤の影響を考慮し、慎重に判断したいと考えております。',
    requestedInformation: ['投薬内容', '処方薬詳細', '治療経過'],
    requestedInformationDetail: `・使用中のBP製剤の種類（経口/注射）
・投与期間と累積投与量
・休薬の可否と期間
・骨密度の現状と治療の必要性
・歯科処置を行う場合の注意事項とリスク管理方法`
  }
]

export function CollaborationInquiryForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: CollaborationInquiryFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<typeof INQUIRY_TEMPLATES>([])

  useEffect(() => {
    loadPatientData()
    loadTemplates()
  }, [patientId])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/document-templates?documentType=' + encodeURIComponent('診療情報等連携共有料1'))
      if (response.ok) {
        const dbTemplates = await response.json()
        const formattedTemplates = dbTemplates.map((t: any) => ({
          id: t.template_key,
          name: t.template_name,
          ...t.template_data
        }))
        setTemplates(formattedTemplates.length > 0 ? formattedTemplates : INQUIRY_TEMPLATES)
      } else {
        setTemplates(INQUIRY_TEMPLATES)
      }
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error)
      setTemplates(INQUIRY_TEMPLATES)
    }
  }

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<CollaborationInquiryData>
      setFormData(prev => ({ ...prev, ...content }))
      setAutoPopulatedFields(new Set())
    }
  }, [document])

  const loadPatientData = async () => {
    try {
      setLoading(true)

      // 患者情報と医院情報を並行して取得
      const [patientResponse, clinicResponse] = await Promise.all([
        fetch(`/api/patients/${patientId}`),
        fetch(`/api/clinics/${clinicId}`)
      ])

      if (!patientResponse.ok) throw new Error('患者情報の取得に失敗しました')
      const patient = await patientResponse.json()

      let clinic = null
      if (clinicResponse.ok) {
        clinic = await clinicResponse.json()
      }

      const autoFields = new Set<string>()
      const updates: Partial<typeof initialFormData> = {}

      if (patient.patient_number) {
        updates.patientNumber = String(patient.patient_number)
        autoFields.add('patientNumber')
      }

      if (patient.last_name && patient.first_name) {
        updates.patientName = `${patient.last_name} ${patient.first_name}`
        autoFields.add('patientName')
      }

      if (patient.last_name_kana && patient.first_name_kana) {
        updates.patientNameKana = `${patient.last_name_kana} ${patient.first_name_kana}`
        autoFields.add('patientNameKana')
      }

      if (patient.gender) {
        updates.gender = patient.gender === 'male' ? '男性' : patient.gender === 'female' ? '女性' : 'その他'
        autoFields.add('gender')
      }

      if (patient.birth_date) {
        updates.birthDate = patient.birth_date
        autoFields.add('birthDate')

        const birthDate = new Date(patient.birth_date)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        updates.age = `${age}歳`
        autoFields.add('age')
      }

      if (patient.address_line) {
        updates.address = patient.address_line
        autoFields.add('address')
      }

      if (patient.phone) {
        updates.phone = patient.phone
        autoFields.add('phone')
      }

      // 既往歴の自動入力（診断名や照会理由の参考情報として）
      if (patient.medical_history && patient.medical_history !== 'なし') {
        // 既往歴情報を照会目的や全身的管理が必要な理由に活用できるよう保持
        // 必要に応じてユーザーが編集可能
        const medicalHistoryNote = `【患者の既往歴】${patient.medical_history}`
        // remarksフィールドに追加（自動入力として）
        if (!updates.remarks) {
          updates.remarks = medicalHistoryNote
          autoFields.add('remarks')
        }
      }

      // 服用薬の自動入力（照会内容の重要情報として）
      if ((patient as any).medications && (patient as any).medications !== 'なし') {
        // 服用薬情報を照会の重要情報として保持
        const medicationsNote = `【現在の服用薬】${(patient as any).medications}`
        // remarksフィールドに追加
        if (updates.remarks) {
          updates.remarks += `\n\n${medicationsNote}`
        } else {
          updates.remarks = medicationsNote
          autoFields.add('remarks')
        }
      }

      // 医院情報の自動入力
      if (clinic) {
        if (clinic.name) {
          updates.clinicName = clinic.name
          autoFields.add('clinicName')
        }

        // 住所の組み立て
        const addressParts = []
        if (clinic.prefecture) addressParts.push(clinic.prefecture)
        if (clinic.city) addressParts.push(clinic.city)
        if (clinic.address_line) addressParts.push(clinic.address_line)
        if (addressParts.length > 0) {
          updates.clinicAddress = addressParts.join('')
          autoFields.add('clinicAddress')
        }

        if (clinic.phone) {
          updates.clinicPhone = clinic.phone
          autoFields.add('clinicPhone')
        }

        // 歯科医師名は設定から取得する必要があるため、ここでは空のまま
        // 必要に応じて後で追加
      }

      setFormData(prev => ({ ...prev, ...updates }))
      setAutoPopulatedFields(autoFields)
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof initialFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleInformationType = (type: string) => {
    setFormData(prev => {
      const current = prev.requestedInformation || []
      const updated = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
      return { ...prev, requestedInformation: updated }
    })
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setFormData(prev => ({
      ...prev,
      inquiryPurpose: template.inquiryPurpose,
      systemicManagementReason: template.systemicManagementReason,
      treatmentPolicy: template.treatmentPolicy,
      requestedInformation: template.requestedInformation,
      requestedInformationDetail: template.requestedInformationDetail
    }))
    setSelectedTemplate(templateId)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `診療情報等連携共有料1 - ${formData.patientName || '患者名未設定'} → ${formData.requestedInstitution || '照会先未設定'}`

      const fullData: CollaborationInquiryData = {
        ...formData,
        documentType: '診療情報等連携共有料1'
      }

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '診療情報提供書' as const,
        document_subtype: '診療情報等連携共有料1',
        title,
        content: fullData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: fullData,
          document_subtype: '診療情報等連携共有料1'
        })
      } else {
        await createMedicalDocument(params)
      }

      onSave()
    } catch (error) {
      console.error('文書の保存エラー:', error)
      alert('文書の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) {
      alert('印刷ウィンドウを開けませんでした')
      return
    }

    const inquiryTypeIcon = {
      '文書': '📄',
      '電話': '📞',
      'メール': '📧',
      'FAX': '📠'
    }[formData.inquiryType] || '📄'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>診療情報提供書</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'MS PGothic', sans-serif; font-size: 8pt; line-height: 1.3; }
          h1 { text-align: center; font-size: 14pt; margin-bottom: 3px; border-bottom: 2px solid #2563eb; padding-bottom: 5px; }
          .subtitle { text-align: center; font-size: 9pt; color: #666; margin-bottom: 15px; }
          h2 { font-size: 9pt; background-color: #eff6ff; padding: 2px 8px; margin-top: 6px; margin-bottom: 0; }
          .section { margin-bottom: 6px; }
          .field { margin-bottom: 4px; }
          .label { font-weight: bold; font-size: 8pt; }
          .value { font-size: 8pt; margin-left: 3px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .full-width { grid-column: 1 / -1; }
          .text-content { white-space: pre-wrap; padding: 2px 8px; background-color: #fafafa; min-height: 20px; font-size: 8pt; line-height: 1.3; }
          .notice { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 8px; margin: 10px 0; border-radius: 5px; }
          .checkbox-list { margin-left: 15px; }
          .checkbox-item { margin: 3px 0; }
        </style>
      </head>
      <body>
        <h1>診療情報提供書</h1>

        <div style="text-align: right; margin-bottom: 5px;">
          <span style="font-size: 8pt;">作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span>
        </div>

        <h2>照会先情報</h2>
        <div class="section">
          <div class="field"><span class="label">照会先機関名：</span><span class="value">${formData.requestedInstitution}</span></div>
          <div class="field"><span class="label">担当医師・薬剤師：</span><span class="value">${formData.requestedDoctor} 先生</span></div>
        </div>

        <h2>患者情報</h2>
        <div class="section">
          <div class="field"><span class="label">患者氏名：</span><span class="value">${formData.patientName} (${formData.patientNameKana})</span></div>
          <div class="field">
            <span class="label">生年月日：</span><span class="value">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span>
            <span style="font-weight: bold; margin-left: 8px; font-size: 8pt;">性別：</span><span style="display: inline-block; font-size: 8pt;">${formData.gender}</span>
            <span style="font-weight: bold; margin-left: 8px; font-size: 8pt;">電話番号：</span><span style="display: inline-block; font-size: 8pt;">${formData.phone}</span>
          </div>
          <div class="field"><span class="label">住所：</span><span class="value">${formData.address}</span></div>
        </div>

        ${formData.inquiryPurpose ? `<h2>照会目的</h2><div class="text-content">${formData.inquiryPurpose}</div>` : ''}

        ${formData.systemicManagementReason ? `<h2>全身的管理が必要な理由</h2><div class="text-content">${formData.systemicManagementReason}</div>` : ''}

        ${formData.diagnosis ? `<h2>傷病名</h2><div class="text-content">${formData.diagnosis}</div>` : ''}

        ${formData.treatmentPolicy ? `<h2>歯科治療方針</h2><div class="text-content">${formData.treatmentPolicy}</div>` : ''}

        ${formData.remarks ? `<h2>備考</h2><div class="text-content">${formData.remarks}</div>` : ''}

        <h2>照会元歯科医療機関</h2>
        <div class="section">
          <div class="field"><span class="label">医療機関名：</span><span class="value">${formData.clinicName}</span></div>
          <div class="field"><span class="label">所在地：</span><span class="value">${formData.clinicAddress}</span></div>
          <div class="field"><span class="label">電話番号：</span><span class="value">${formData.clinicPhone}</span></div>
          <div class="field"><span class="label">担当歯科医師：</span><span class="value">${formData.dentistName}</span></div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 9pt;">
          <p>ご多忙の折恐縮ですが、ご教示のほど何卒よろしくお願い申し上げます。</p>
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const isAutoPopulated = (field: keyof typeof initialFormData) => autoPopulatedFields.has(field)

  if (loading) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500">患者データを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">診療情報等連携共有料1（歯科→医科・薬局）</h3>
            <p className="text-sm text-gray-600">B011-1 120点 - 医科機関・薬局への情報提供依頼（3月に1回）</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? '保存中...' : '保存'}
          </Button>
          <Button onClick={onCancel} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-2" />
            閉じる
          </Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">黄色の背景は患者情報から自動入力された項目です</p>
          <p className="mt-1">※ 照会は文書・電話・メール・FAXで可能ですが、回答は必ず文書で受け取る必要があります</p>
        </div>
      </div>

      {/* テンプレート選択 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            定型文テンプレート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>照会の目的から選択してください</Label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  className={`justify-start h-auto py-3 ${
                    selectedTemplate === template.id
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'hover:bg-blue-50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold text-sm">{template.name}</div>
                  </div>
                </Button>
              ))}
            </div>
            {selectedTemplate && (
              <p className="text-xs text-gray-600 bg-white p-2 rounded border">
                ✓ テンプレートが適用されました。必要に応じて内容を編集してください。
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* 左カラム */}
        <div className="space-y-6">
          {/* 照会先情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">照会先情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>照会先機関名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.requestedInstitution}
                  onChange={(e) => handleChange('requestedInstitution', e.target.value)}
                  placeholder="例: ○○内科クリニック / ○○薬局"
                />
              </div>
              <div className="space-y-2">
                <Label>担当医師・薬剤師名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.requestedDoctor}
                  onChange={(e) => handleChange('requestedDoctor', e.target.value)}
                  placeholder="例: 田中太郎"
                />
              </div>
            </CardContent>
          </Card>

          {/* 患者基本情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">患者基本情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>作成日</Label>
                <Input type="date" value={formData.documentDate} onChange={(e) => handleChange('documentDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>患者番号</Label>
                <Input value={formData.patientNumber} onChange={(e) => handleChange('patientNumber', e.target.value)} className={isAutoPopulated('patientNumber') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="space-y-2">
                <Label>患者氏名</Label>
                <Input value={formData.patientName} onChange={(e) => handleChange('patientName', e.target.value)} className={isAutoPopulated('patientName') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="space-y-2">
                <Label>フリガナ</Label>
                <Input value={formData.patientNameKana} onChange={(e) => handleChange('patientNameKana', e.target.value)} className={isAutoPopulated('patientNameKana') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>性別</Label>
                  <Input value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className={isAutoPopulated('gender') ? 'bg-yellow-50' : ''} />
                </div>
                <div className="space-y-2">
                  <Label>年齢</Label>
                  <Input value={formData.age} onChange={(e) => handleChange('age', e.target.value)} className={isAutoPopulated('age') ? 'bg-yellow-50' : ''} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>生年月日</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} className={isAutoPopulated('birthDate') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="space-y-2">
                <Label>住所</Label>
                <Input value={formData.address} onChange={(e) => handleChange('address', e.target.value)} className={isAutoPopulated('address') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={isAutoPopulated('phone') ? 'bg-yellow-50' : ''} />
              </div>
            </CardContent>
          </Card>

          {/* 照会元医療機関情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">照会元歯科医療機関情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>医療機関名</Label>
                <Input value={formData.clinicName} onChange={(e) => handleChange('clinicName', e.target.value)} placeholder="例: デモ歯科医院" />
              </div>
              <div className="space-y-2">
                <Label>所在地</Label>
                <Input value={formData.clinicAddress} onChange={(e) => handleChange('clinicAddress', e.target.value)} placeholder="医院の住所を入力" />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={formData.clinicPhone} onChange={(e) => handleChange('clinicPhone', e.target.value)} placeholder="例: 03-1234-5678" />
              </div>
              <div className="space-y-2">
                <Label>担当歯科医師</Label>
                <Input value={formData.dentistName} onChange={(e) => handleChange('dentistName', e.target.value)} placeholder="例: 福永" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム - 照会内容 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">照会内容</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>照会目的 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.inquiryPurpose}
                  onChange={(e) => handleChange('inquiryPurpose', e.target.value)}
                  rows={3}
                  placeholder="例: 抜歯を予定しているため、全身状態の確認が必要です"
                />
              </div>
              <div className="space-y-2">
                <Label>全身的管理が必要な理由 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.systemicManagementReason}
                  onChange={(e) => handleChange('systemicManagementReason', e.target.value)}
                  rows={4}
                  placeholder="例: 抗凝固薬服用中のため、観血的処置前に投薬内容の確認が必要"
                />
              </div>
              <div className="space-y-2">
                <Label>傷病名（歯科）</Label>
                <Textarea
                  value={formData.diagnosis}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  rows={2}
                  placeholder="例: 右側下顎第一大臼歯 残根"
                />
              </div>
              <div className="space-y-2">
                <Label>歯科治療方針</Label>
                <Textarea
                  value={formData.treatmentPolicy}
                  onChange={(e) => handleChange('treatmentPolicy', e.target.value)}
                  rows={3}
                  placeholder="例: 抜歯を予定しています"
                />
              </div>
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
