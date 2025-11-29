'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Printer, X, FileText, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'
import { ReferralLetterType1Data } from '@/types/medical-information-letter'

interface ReferralLetterType1FormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

const initialFormData: Omit<ReferralLetterType1Data, 'documentType'> = {
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

  // 紹介先情報
  referToInstitution: '',
  referToDoctor: '',
  referToDepartment: '',

  // 医療情報
  chiefComplaint: '',
  diagnosis: '',
  referralReason: '',
  presentIllness: '',
  pastMedicalHistory: '',
  familyHistory: '',
  clinicalSummary: '',
  treatmentHistory: '',
  medications: '',
  examResults: '',
  requestedExam: '',
  remarks: '',

  // 紹介元情報
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  dentistName: ''
}

// 定型文テンプレート
const REFERRAL_TEMPLATES = [
  {
    id: 'impacted_wisdom_tooth',
    name: '親知らず抜歯依頼',
    referToDepartment: '口腔外科',
    diagnosis: '智歯周囲炎\n埋伏智歯',
    chiefComplaint: '右下奥歯の痛みと腫れ',
    referralReason: '下顎智歯（右側第三大臼歯）が水平埋伏しており、周囲組織に炎症を繰り返しているため、抜歯が必要と判断いたしました。当院での処置は困難なため、貴院での抜歯をお願いいたします。',
    presentIllness: '2ヶ月前より右下奥歯の痛みと腫れを繰り返しております。パノラマX線写真にて右側下顎智歯が水平埋伏していることを確認いたしました。',
    clinicalSummary: '智歯周囲の歯肉は腫脹し、軽度の発赤を認めます。開口障害は認めません。',
    requestedExam: '抜歯処置をお願いいたします。必要に応じてCT撮影による下歯槽神経との位置関係の確認をお願いいたします。'
  },
  {
    id: 'mri_tmj',
    name: 'MRI撮影依頼（顎関節症）',
    referToDepartment: '放射線科・口腔外科',
    diagnosis: '顎関節症',
    chiefComplaint: '口を開けると顎が痛い、カクカク音がする',
    referralReason: '顎関節部の疼痛とクリック音を認め、顎関節症と診断いたしました。関節円板の転位の有無および顎関節の詳細な評価のため、MRI撮影をお願いいたします。',
    presentIllness: '3ヶ月前より開口時の顎関節部痛とクリック音が出現しました。徐々に症状が増悪し、食事にも支障をきたすようになりました。',
    clinicalSummary: '最大開口量：35mm（制限あり）\n開口時に両側顎関節部にクリック音を認めます。\n左側顎関節部に圧痛を認めます。',
    treatmentHistory: 'スプリント療法を開始しましたが、症状の改善が乏しく、精査が必要と判断いたしました。',
    requestedExam: '顎関節MRI撮影（開口位・閉口位）をお願いいたします。関節円板の転位の有無、関節腔の状態、骨変形の有無について評価をお願いいたします。'
  },
  {
    id: 'hypertension_consultation',
    name: '高血圧疑い（内科紹介）',
    referToDepartment: '内科・循環器内科',
    diagnosis: '高血圧症疑い',
    chiefComplaint: '歯科治療前の血圧測定にて高値を認める',
    referralReason: '歯科治療に際して血圧測定を実施したところ、複数回にわたり収縮期血圧160mmHg以上の高値を認めました。ご本人は高血圧の既往を認識しておらず、精査・加療が必要と判断いたしました。',
    presentIllness: '当院での血圧測定（安静時）：\n1回目 165/95 mmHg\n2回目 170/100 mmHg\n3回目 162/98 mmHg\n\nご本人は自覚症状に乏しく、これまで血圧を測定する機会がなかったとのことです。',
    clinicalSummary: '頭痛、めまい、動悸などの自覚症状は特に訴えておりません。',
    pastMedicalHistory: '特記すべき既往歴なし',
    requestedExam: '高血圧症の精査・診断および治療をお願いいたします。血圧コントロール後、歯科治療を再開したいと考えております。'
  },
  {
    id: 'diabetes_consultation',
    name: '糖尿病疑い（内科紹介）',
    referToDepartment: '内科・糖尿病内科',
    diagnosis: '糖尿病疑い\n重度歯周炎',
    chiefComplaint: '歯肉の腫れ、出血、口渇感',
    referralReason: '重度歯周炎の患者様で、治療経過が不良であり、口渇感・多飲多尿などの症状を認めます。糖尿病の可能性を考慮し、精査をお願いいたします。',
    presentIllness: '広範囲の重度歯周炎があり、歯周基本治療を実施しておりますが、治療に対する反応が悪く、歯肉の腫脹・出血が持続しております。\n\nご本人より、最近口が渇く、水をよく飲む、トイレが近い、という訴えがありました。',
    clinicalSummary: '全顎的に歯周ポケット6mm以上の部位が多数あり、排膿を認める部位もあります。創傷治癒が遅延している印象です。',
    pastMedicalHistory: '家族歴：母親が糖尿病',
    requestedExam: '糖尿病の精査（HbA1c、血糖値測定等）をお願いいたします。糖尿病と診断された場合は、医科歯科連携による管理を行いたいと考えております。'
  },
  {
    id: 'allergic_rhinitis',
    name: 'アレルギー性鼻炎疑い（耳鼻科紹介）',
    referToDepartment: '耳鼻咽喉科',
    diagnosis: 'アレルギー性鼻炎疑い\n口呼吸',
    chiefComplaint: '口が乾く、いびき、鼻づまり',
    referralReason: '慢性的な鼻閉により口呼吸が習慣化しており、口腔乾燥症状が顕著です。アレルギー性鼻炎の可能性が高く、精査・加療をお願いいたします。',
    presentIllness: '幼少期より鼻づまりがあり、常に口呼吸をしているとのことです。朝起きると口がカラカラに乾いており、喉も痛いとのことです。いびきも指摘されているとのことです。',
    clinicalSummary: '口腔粘膜の乾燥が著明で、う蝕リスクが高い状態です。舌苔の付着も認めます。',
    treatmentHistory: '口腔乾燥に対して、保湿剤の使用を指導しておりますが、根本的な改善には鼻呼吸の確立が必要と考えます。',
    requestedExam: 'アレルギー性鼻炎の精査・診断および治療をお願いいたします。鼻閉の改善により、口呼吸から鼻呼吸への移行を図りたいと考えております。'
  },
  {
    id: 'preoperative_dental_care',
    name: '便宜抜歯（術前口腔ケア）',
    referToDepartment: '口腔外科',
    diagnosis: '保存不可能歯（複数歯）\n慢性歯周炎',
    chiefComplaint: '他院での手術予定があり、事前の歯科治療を依頼された',
    referralReason: '患者様は〇〇病院にて全身麻酔下での手術が予定されており、術前の口腔環境整備が必要とのことで当院を受診されました。保存不可能な残根歯が複数あり、感染源除去のための抜歯が必要ですが、抗凝固薬服用中であるため、貴院での処置をお願いいたします。',
    presentIllness: '〇〇病院での手術予定日：〇月〇日\n現在、抗凝固薬（ワーファリン/DOAC）を服用中です。',
    clinicalSummary: '保存不可能な残根歯：〇〇部、〇〇部、〇〇部\n歯周ポケット6mm以上の部位が多数あり、術前の口腔ケアが必要です。',
    requestedExam: '抗凝固薬管理下での抜歯処置および周術期口腔機能管理をお願いいたします。手術予定日までに感染源の除去と口腔環境の改善を図りたいと考えております。',
    remarks: '手術予定の主治医：〇〇病院 〇〇科 〇〇先生'
  }
]

export function ReferralLetterType1Form({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: ReferralLetterType1FormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<typeof REFERRAL_TEMPLATES>([])

  useEffect(() => {
    loadPatientData()
    loadTemplates()
  }, [patientId])

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<ReferralLetterType1Data>
      setFormData(prev => ({ ...prev, ...content }))
      setAutoPopulatedFields(new Set())
    }
  }, [document])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/document-templates?documentType=' + encodeURIComponent('診療情報提供料(I)'))
      if (response.ok) {
        const dbTemplates = await response.json()
        // DBのテンプレートをハードコードされたテンプレートの形式に変換
        const formattedTemplates = dbTemplates.map((t: any) => ({
          id: t.template_key,
          name: t.template_name,
          ...t.template_data
        }))
        // DBテンプレートがあればそれを使用、なければハードコードのテンプレートをフォールバック
        setTemplates(formattedTemplates.length > 0 ? formattedTemplates : REFERRAL_TEMPLATES)
      } else {
        // エラー時はハードコードのテンプレートを使用
        setTemplates(REFERRAL_TEMPLATES)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      // エラー時はハードコードのテンプレートを使用
      setTemplates(REFERRAL_TEMPLATES)
    }
  }

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

      // 患者番号
      if (patient.patient_number) {
        updates.patientNumber = String(patient.patient_number)
        autoFields.add('patientNumber')
      }

      // 患者氏名
      if (patient.last_name && patient.first_name) {
        updates.patientName = `${patient.last_name} ${patient.first_name}`
        autoFields.add('patientName')
      }

      // 患者氏名（カナ）
      if (patient.last_name_kana && patient.first_name_kana) {
        updates.patientNameKana = `${patient.last_name_kana} ${patient.first_name_kana}`
        autoFields.add('patientNameKana')
      }

      // 性別
      if (patient.gender) {
        updates.gender = patient.gender === 'male' ? '男性' : patient.gender === 'female' ? '女性' : 'その他'
        autoFields.add('gender')
      }

      // 生年月日と年齢
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

      // 住所
      if (patient.address_line) {
        updates.address = patient.address_line
        autoFields.add('address')
      }

      // 電話番号
      if (patient.phone) {
        updates.phone = patient.phone
        autoFields.add('phone')
      }

      // 既往歴の自動入力
      if (patient.medical_history && patient.medical_history !== 'なし') {
        updates.pastMedicalHistory = patient.medical_history
        autoFields.add('pastMedicalHistory')
      }

      // 服用薬の自動入力
      if ((patient as any).medications && (patient as any).medications !== 'なし') {
        updates.medications = (patient as any).medications
        autoFields.add('medications')
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
      }

      setFormData(prev => ({ ...prev, ...updates }))
      setAutoPopulatedFields(autoFields)
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof typeof initialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    setFormData(prev => ({
      ...prev,
      referToDepartment: template.referToDepartment,
      diagnosis: template.diagnosis,
      chiefComplaint: template.chiefComplaint,
      referralReason: template.referralReason,
      presentIllness: template.presentIllness,
      clinicalSummary: template.clinicalSummary,
      treatmentHistory: template.treatmentHistory || '',
      pastMedicalHistory: template.pastMedicalHistory || '',
      requestedExam: template.requestedExam,
      remarks: template.remarks || ''
    }))
    setSelectedTemplate(templateId)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `診療情報提供料(I) - ${formData.patientName || '患者名未設定'} → ${formData.referToInstitution || '紹介先未設定'}`

      const fullData: ReferralLetterType1Data = {
        ...formData,
        documentType: '診療情報提供料(I)'
      }

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '診療情報提供書' as const,
        document_subtype: '診療情報提供料(I)',
        title,
        content: fullData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: fullData,
          document_subtype: '診療情報提供料(I)'
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>診療情報提供書（I）</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'MS PGothic', sans-serif; font-size: 8pt; line-height: 1.3; }
          h1 { text-align: center; font-size: 14pt; margin-bottom: 3px; border-bottom: 2px solid #333; padding-bottom: 5px; }
          .subtitle { text-align: center; font-size: 9pt; color: #666; margin-bottom: 15px; }
          h2 { font-size: 9pt; background-color: #f0f0f0; padding: 2px 8px; margin-top: 6px; margin-bottom: 0; }
          .section { margin-bottom: 6px; }
          .field { margin-bottom: 4px; }
          .label { font-weight: bold; font-size: 8pt; }
          .value { font-size: 8pt; margin-left: 3px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .full-width { grid-column: 1 / -1; }
          .text-content { white-space: pre-wrap; padding: 2px 8px; background-color: #fafafa; font-size: 8pt; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 3px;">
          <span style="font-size: 8pt;">作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span>
        </div>

        <h1>診療情報提供書</h1>

        <h2>紹介先</h2>
        <div class="section">
          <div class="field"><span class="label">紹介先医療機関：</span><span class="value">${formData.referToInstitution}</span></div>
          <div class="field"><span class="label">紹介先医師：</span><span class="value">${formData.referToDoctor} 先生</span></div>
          <div class="field"><span class="label">診療科：</span><span class="value">${formData.referToDepartment}</span></div>
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

        ${formData.diagnosis ? `<h2>傷病名</h2><div class="text-content">${formData.diagnosis}</div>` : ''}

        ${formData.chiefComplaint ? `<h2>主訴</h2><div class="text-content">${formData.chiefComplaint}</div>` : ''}

        ${formData.referralReason ? `<h2>紹介目的</h2><div class="text-content">${formData.referralReason}</div>` : ''}

        ${formData.presentIllness ? `<h2>現病歴</h2><div class="text-content">${formData.presentIllness}</div>` : ''}

        ${formData.pastMedicalHistory ? `<h2>既往歴</h2><div class="text-content">${formData.pastMedicalHistory}</div>` : ''}

        ${formData.familyHistory ? `<h2>家族歴</h2><div class="text-content">${formData.familyHistory}</div>` : ''}

        ${formData.clinicalSummary ? `<h2>症状経過</h2><div class="text-content">${formData.clinicalSummary}</div>` : ''}

        ${formData.treatmentHistory ? `<h2>治療経過</h2><div class="text-content">${formData.treatmentHistory}</div>` : ''}

        ${formData.medications ? `<h2>投薬内容</h2><div class="text-content">${formData.medications}</div>` : ''}

        ${formData.examResults ? `<h2>検査結果</h2><div class="text-content">${formData.examResults}</div>` : ''}

        ${formData.requestedExam ? `<h2>依頼事項</h2><div class="text-content">${formData.requestedExam}</div>` : ''}

        ${formData.remarks ? `<h2>備考</h2><div class="text-content">${formData.remarks}</div>` : ''}

        <h2>紹介元医療機関</h2>
        <div class="section">
          <div class="field"><span class="label">医療機関名：</span><span class="value">${formData.clinicName}</span></div>
          <div class="field"><span class="label">所在地：</span><span class="value">${formData.clinicAddress}</span></div>
          <div class="field"><span class="label">電話番号：</span><span class="value">${formData.clinicPhone}</span></div>
          <div class="field"><span class="label">担当歯科医師：</span><span class="value">${formData.dentistName}</span></div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 9pt;">
          <p>ご多忙の折恐縮ですが、ご高診のほど何卒よろしくお願い申し上げます。</p>
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
            <h3 className="text-lg font-semibold text-gray-900">診療情報提供料（I）</h3>
            <p className="text-sm text-gray-600">B009 250点 - 他医療機関への患者紹介</p>
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
        </div>
      </div>

      {/* テンプレート選択 */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            定型文テンプレート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>紹介の目的から選択してください</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
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
          {/* 紹介先情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">紹介先情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>紹介先医療機関 <span className="text-red-500">*</span></Label>
                <Input value={formData.referToInstitution} onChange={(e) => handleChange('referToInstitution', e.target.value)} placeholder="例: ○○大学病院" />
              </div>
              <div className="space-y-2">
                <Label>紹介先医師 <span className="text-red-500">*</span></Label>
                <Input value={formData.referToDoctor} onChange={(e) => handleChange('referToDoctor', e.target.value)} placeholder="例: 山田太郎" />
              </div>
              <div className="space-y-2">
                <Label>診療科</Label>
                <Input value={formData.referToDepartment} onChange={(e) => handleChange('referToDepartment', e.target.value)} placeholder="例: 口腔外科" />
              </div>
            </CardContent>
          </Card>

          {/* 患者基本情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">患者基本情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>文書作成日</Label>
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

          {/* 紹介元医療機関情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">紹介元医療機関情報</CardTitle></CardHeader>
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

        {/* 右カラム - 診療情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">診療情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>傷病名 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.diagnosis} onChange={(e) => handleChange('diagnosis', e.target.value)} rows={2} placeholder="主病名を記載" />
              </div>
              <div className="space-y-2">
                <Label>主訴</Label>
                <Textarea value={formData.chiefComplaint} onChange={(e) => handleChange('chiefComplaint', e.target.value)} rows={2} placeholder="患者の主な訴えを記載" />
              </div>
              <div className="space-y-2">
                <Label>紹介目的 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.referralReason} onChange={(e) => handleChange('referralReason', e.target.value)} rows={3} placeholder="紹介の目的・理由を記載" />
              </div>
              <div className="space-y-2">
                <Label>現病歴</Label>
                <Textarea value={formData.presentIllness} onChange={(e) => handleChange('presentIllness', e.target.value)} rows={4} placeholder="現在の病気の経過を記載" />
              </div>
              <div className="space-y-2">
                <Label>既往歴</Label>
                <Textarea value={formData.pastMedicalHistory} onChange={(e) => handleChange('pastMedicalHistory', e.target.value)} rows={3} placeholder="過去の病気や手術歴を記載" />
              </div>
              <div className="space-y-2">
                <Label>家族歴</Label>
                <Textarea value={formData.familyHistory} onChange={(e) => handleChange('familyHistory', e.target.value)} rows={2} placeholder="家族の病歴（関連がある場合）" />
              </div>
              <div className="space-y-2">
                <Label>症状経過</Label>
                <Textarea value={formData.clinicalSummary} onChange={(e) => handleChange('clinicalSummary', e.target.value)} rows={4} placeholder="症状の経過を記載" />
              </div>
              <div className="space-y-2">
                <Label>治療経過</Label>
                <Textarea value={formData.treatmentHistory} onChange={(e) => handleChange('treatmentHistory', e.target.value)} rows={4} placeholder="これまでの治療内容を記載" />
              </div>
              <div className="space-y-2">
                <Label>投薬内容</Label>
                <Textarea value={formData.medications} onChange={(e) => handleChange('medications', e.target.value)} rows={3} placeholder="現在の投薬内容を記載" />
              </div>
              <div className="space-y-2">
                <Label>検査結果</Label>
                <Textarea value={formData.examResults} onChange={(e) => handleChange('examResults', e.target.value)} rows={4} placeholder="検査結果の要約を記載" />
              </div>
              <div className="space-y-2">
                <Label>依頼事項</Label>
                <Textarea value={formData.requestedExam} onChange={(e) => handleChange('requestedExam', e.target.value)} rows={3} placeholder="依頼する検査や治療内容を記載" />
              </div>
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
