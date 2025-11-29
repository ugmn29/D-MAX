'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Printer, X, FileText, AlertCircle, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'
import { CollaborationResponseData } from '@/types/medical-information-letter'

interface CollaborationResponseFormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

// 定型文テンプレート
const RESPONSE_TEMPLATES = [
  {
    id: 'perioperative_dental_info',
    name: '周術期口腔機能管理の情報提供',
    chiefComplaint: '歯科治療のため当院通院中',
    dentalDiagnosis: '慢性歯周炎\n多数歯う蝕',
    dentalFindings: '歯周ポケット4mm以上の部位が複数あり、歯肉からの出血を認めます。\nう蝕により残根状態の歯が複数あります。\nプラークコントロールは不良な状態です。',
    dentalTreatmentStatus: '現在、歯周基本治療を実施中です。\nスケーリング・ルートプレーニングを行い、歯周組織の改善を図っております。\n残根歯については、全身状態を考慮しながら抜歯を予定しております。',
    treatmentHistory: '約3ヶ月前より歯周病治療のため通院を開始いたしました。\n口腔衛生指導とスケーリングを継続的に実施しております。',
    medications: '現在、歯科からの処方薬はございません。',
    examResults: 'パノラマX線写真にて、複数歯に歯槽骨吸収像を認めます。\n歯周ポケット検査：4mm以上の部位が約40%',
    precautions: '・術前・術後の口腔ケアを徹底し、口腔内細菌の減少を図ります\n・全身麻酔や鎮静下での処置の際は、誤嚥性肺炎のリスクに注意が必要です\n・抗凝固薬服用中の場合、観血的処置時の出血リスクがあります\n・免疫抑制状態では感染リスクが高まるため、より慎重な口腔管理が必要です'
  },
  {
    id: 'anticoagulant_response',
    name: '抗凝固薬に関する回答',
    chiefComplaint: '歯科治療のため当院通院中',
    dentalDiagnosis: '残根（〇〇部）',
    dentalFindings: '〇〇部に残根があり、周囲歯肉に軽度の炎症を認めます。',
    dentalTreatmentStatus: '残根の抜歯が必要な状態です。\n抗凝固薬服用中とのことで、主治医の先生にご相談の上、安全に処置を行いたいと考えております。',
    treatmentHistory: '保存不可能と判断し、抜歯を予定しております。',
    medications: '歯科からの処方薬はございません。',
    examResults: 'パノラマX線写真にて残根を確認しております。',
    precautions: '・抗凝固薬服用中のため、抜歯時の出血リスクについて評価が必要です\n・PT-INR値が治療域内であれば、休薬せずに抜歯可能な場合が多いとされています\n・必要に応じて局所止血処置（縫合、止血剤の使用等）を行います\n・術後の止血確認を十分に行い、出血時の対応について患者様にもご説明いたします'
  },
  {
    id: 'diabetes_dental_care',
    name: '糖尿病患者の歯科管理状況',
    chiefComplaint: '歯肉の腫れと出血',
    dentalDiagnosis: '糖尿病性歯周炎（重度）',
    dentalFindings: '歯周ポケット6mm以上の部位が多数あり、排膿を認める部位もあります。\n歯肉は全体的に腫脹し、易出血性です。\n歯の動揺も認めます。',
    dentalTreatmentStatus: '歯周基本治療を実施中です。\n徹底した口腔清掃指導を行い、スケーリング・ルートプレーニングを継続しております。\n血糖コントロールの状態を確認しながら、必要に応じて外科的処置も検討しております。',
    treatmentHistory: '2ヶ月前より歯周病治療を開始いたしました。\n口腔衛生状態は徐々に改善傾向にあります。',
    medications: '抗菌薬の短期投与を検討する場合があります（急性炎症時）。',
    examResults: 'パノラマX線写真にて、広範囲に歯槽骨吸収を認めます。\n歯周ポケット検査：平均5.2mm',
    precautions: '・歯周病と糖尿病は相互に悪影響を及ぼすため、継続的な歯科管理が重要です\n・血糖コントロール不良時は感染リスクが高く、創傷治癒も遅延します\n・HbA1c 7%未満を目標に、医科歯科連携による管理が望ましいと考えます\n・低血糖発作のリスクに注意し、治療時間帯にも配慮しております'
  },
  {
    id: 'cancer_treatment_dental',
    name: 'がん治療前の歯科管理',
    chiefComplaint: 'がん治療前の歯科チェック',
    dentalDiagnosis: '慢性歯周炎\nう蝕（複数歯）\n感染源となりうる病巣の存在',
    dentalFindings: '歯周ポケット4mm以上の部位が複数あります。\n〇〇部にう蝕を認め、打診痛があります。\n智歯周囲炎のリスクがある埋伏智歯があります。',
    dentalTreatmentStatus: 'がん治療開始前に、感染源となりうる病巣の治療を優先的に行っております。\n重度う蝕歯の抜歯、歯周病の急性期治療を実施中です。\n口腔衛生指導を徹底し、がん治療中の口腔トラブル予防に努めております。',
    treatmentHistory: '治療開始1ヶ月前より、集中的に歯科治療を実施しております。\n感染源除去と口腔環境の改善を進めております。',
    medications: '抗菌薬、鎮痛薬を一時的に処方する場合があります。',
    examResults: 'パノラマX線写真、デンタルX線写真にて、保存不可能歯を確認しております。',
    precautions: '・化学療法開始前に、感染源となりうる歯は可能な限り除去することが望ましいです\n・治療中は骨髄抑制による易感染性、易出血性に注意が必要です\n・口腔粘膜炎の予防・管理のため、継続的な口腔ケアを実施いたします\n・緊急時以外の観血的処置は、血球数の回復を待って行うことが推奨されます'
  },
  {
    id: 'general_dental_status',
    name: '一般的な歯科治療状況の報告',
    chiefComplaint: '歯科治療のため通院中',
    dentalDiagnosis: 'う蝕（〇〇部）\n歯周炎',
    dentalFindings: '〇〇部にう蝕を認めます。\n全体的に軽度から中等度の歯周炎を認めます。\n現時点で急性症状はございません。',
    dentalTreatmentStatus: 'う蝕治療および歯周病治療を計画的に実施しております。\n現在、大きな問題なく治療が進行しております。',
    treatmentHistory: '定期的に歯科治療を受けられており、口腔内の状態は安定しております。',
    medications: '現在、歯科からの処方薬はございません。',
    examResults: 'パノラマX線写真、口腔内写真にて経過観察中です。',
    precautions: '・現時点で、医科治療に影響を及ぼすような口腔内の問題はございません\n・継続的な歯科管理により、口腔内環境の維持に努めております\n・全身麻酔や手術を予定される場合は、事前にご連絡いただければ幸いです'
  }
]

const initialFormData: Omit<CollaborationResponseData, 'documentType'> = {
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

  // 依頼元情報
  requestingInstitution: '',
  requestingDoctor: '',
  requestedDate: format(new Date(), 'yyyy-MM-dd'),

  // 歯科診療情報
  chiefComplaint: '',
  dentalDiagnosis: '',
  dentalFindings: '',
  dentalTreatmentStatus: '',
  treatmentHistory: '',
  medications: '',
  examResults: '',
  precautions: '',

  remarks: '',

  // 回答元情報
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  dentistName: ''
}

export function CollaborationResponseForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: CollaborationResponseFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templates, setTemplates] = useState<typeof RESPONSE_TEMPLATES>([])

  useEffect(() => {
    loadPatientData()
    loadTemplates()
  }, [patientId])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/document-templates?documentType=' + encodeURIComponent('診療情報等連携共有料2'))
      if (response.ok) {
        const dbTemplates = await response.json()
        const formattedTemplates = dbTemplates.map((t: any) => ({
          id: t.template_key,
          name: t.template_name,
          ...t.template_data
        }))
        setTemplates(formattedTemplates.length > 0 ? formattedTemplates : RESPONSE_TEMPLATES)
      } else {
        setTemplates(RESPONSE_TEMPLATES)
      }
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error)
      setTemplates(RESPONSE_TEMPLATES)
    }
  }

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<CollaborationResponseData>
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

      // 既往歴の自動入力（回答内容として重要）
      if (patient.medical_history && patient.medical_history !== 'なし') {
        // 留意事項・注意事項に既往歴を追加
        const medicalHistoryNote = `【患者の既往歴】\n${patient.medical_history}\n\n上記既往歴を踏まえた歯科治療を実施しております。`
        if (!updates.precautions) {
          updates.precautions = medicalHistoryNote
          autoFields.add('precautions')
        }
      }

      // 服用薬の自動入力（処方内容として重要）
      if ((patient as any).medications && (patient as any).medications !== 'なし') {
        // medicationsフィールドに患者の服用薬情報を記載
        const medicationsNote = `【患者が医科で処方されている薬剤】\n${(patient as any).medications}\n\n※歯科からの追加処方はございません。`
        if (!updates.medications) {
          updates.medications = medicationsNote
          autoFields.add('medications')
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
      chiefComplaint: template.chiefComplaint,
      dentalDiagnosis: template.dentalDiagnosis,
      dentalFindings: template.dentalFindings,
      dentalTreatmentStatus: template.dentalTreatmentStatus,
      treatmentHistory: template.treatmentHistory,
      medications: template.medications,
      examResults: template.examResults,
      precautions: template.precautions
    }))
    setSelectedTemplate(templateId)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `診療情報等連携共有料2 - ${formData.patientName || '患者名未設定'} → ${formData.requestingInstitution || '依頼元未設定'}`

      const fullData: CollaborationResponseData = {
        ...formData,
        documentType: '診療情報等連携共有料2'
      }

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '診療情報提供書' as const,
        document_subtype: '診療情報等連携共有料2',
        title,
        content: fullData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: fullData,
          document_subtype: '診療情報等連携共有料2'
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
        <title>診療情報提供書（歯科→医科への回答）</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'MS PGothic', sans-serif; font-size: 8pt; line-height: 1.3; }
          h1 { text-align: center; font-size: 14pt; margin-bottom: 3px; border-bottom: 2px solid #16a34a; padding-bottom: 5px; }
          .subtitle { text-align: center; font-size: 9pt; color: #666; margin-bottom: 15px; }
          h2 { font-size: 9pt; background-color: #f0fdf4; padding: 2px 8px; margin-top: 6px; margin-bottom: 0; }
          .section { margin-bottom: 6px; }
          .field { margin-bottom: 4px; }
          .label { font-weight: bold; font-size: 8pt; }
          .value { font-size: 8pt; margin-left: 3px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .full-width { grid-column: 1 / -1; }
          .text-content { white-space: pre-wrap; padding: 2px 8px; background-color: #fafafa; min-height: 20px; font-size: 8pt; line-height: 1.3; }
          .notice { background-color: #dbeafe; border: 2px solid #3b82f6; padding: 8px; margin: 8px 0; border-radius: 5px; font-size: 8pt; }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 3px;">
          <span style="font-size: 8pt;">作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span>
        </div>

        <h1>診療情報提供書（医科からの依頼への回答）</h1>

        <div class="notice">
          <strong>依頼元医療機関:</strong> ${formData.requestingInstitution}<br>
          <strong>依頼元医師:</strong> ${formData.requestingDoctor} 先生<br>
          <strong>依頼を受けた日:</strong> ${formData.requestedDate ? format(new Date(formData.requestedDate), 'yyyy年MM月dd日', { locale: ja }) : ''}
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

        ${formData.chiefComplaint ? `<h2>主訴</h2><div class="text-content">${formData.chiefComplaint}</div>` : ''}

        ${formData.dentalDiagnosis ? `<h2>歯科診断名</h2><div class="text-content">${formData.dentalDiagnosis}</div>` : ''}

        ${formData.dentalFindings ? `<h2>口腔内所見</h2><div class="text-content">${formData.dentalFindings}</div>` : ''}

        ${formData.dentalTreatmentStatus ? `<h2>歯科治療状況</h2><div class="text-content">${formData.dentalTreatmentStatus}</div>` : ''}

        ${formData.treatmentHistory ? `<h2>治療経過</h2><div class="text-content">${formData.treatmentHistory}</div>` : ''}

        ${formData.medications ? `<h2>処方内容（歯科）</h2><div class="text-content">${formData.medications}</div>` : ''}

        ${formData.examResults ? `<h2>歯科検査結果</h2><div class="text-content">${formData.examResults}</div>` : ''}

        ${formData.precautions ? `<h2>留意事項・注意事項</h2><div class="text-content">${formData.precautions}</div>` : ''}

        ${formData.remarks ? `<h2>備考</h2><div class="text-content">${formData.remarks}</div>` : ''}

        <h2>回答元歯科医療機関</h2>
        <div class="section">
          <div class="field"><span class="label">医療機関名：</span><span class="value">${formData.clinicName}</span></div>
          <div class="field"><span class="label">所在地：</span><span class="value">${formData.clinicAddress}</span></div>
          <div class="field"><span class="label">電話番号：</span><span class="value">${formData.clinicPhone}</span></div>
          <div class="field"><span class="label">担当歯科医師：</span><span class="value">${formData.dentistName}</span></div>
        </div>

        <div style="margin-top: 20px; text-align: center; font-size: 9pt;">
          <p>ご多忙の折恐縮ですが、ご査収のほど何卒よろしくお願い申し上げます。</p>
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
      <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <Send className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">診療情報等連携共有料2（医科からの依頼への回答）</h3>
            <p className="text-sm text-gray-600">B011-2 120点 - 医科機関からの依頼に応答（3月に1回）</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
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
          <p className="mt-1">※ 医科機関からの依頼に対して、歯科診療情報を文書で提供する際に使用します</p>
        </div>
      </div>

      {/* テンプレート選択 */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            定型文テンプレート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>回答内容から選択してください</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {templates.map((template) => (
                <Button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  variant={selectedTemplate === template.id ? 'default' : 'outline'}
                  className={`justify-start h-auto py-3 ${
                    selectedTemplate === template.id
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'hover:bg-green-50'
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
          {/* 依頼元情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">依頼元医療機関情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>依頼元医療機関名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.requestingInstitution}
                  onChange={(e) => handleChange('requestingInstitution', e.target.value)}
                  placeholder="例: ○○総合病院"
                />
              </div>
              <div className="space-y-2">
                <Label>依頼元医師名 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.requestingDoctor}
                  onChange={(e) => handleChange('requestingDoctor', e.target.value)}
                  placeholder="例: 山田太郎"
                />
              </div>
              <div className="space-y-2">
                <Label>依頼を受けた日</Label>
                <Input
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) => handleChange('requestedDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 患者基本情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">患者基本情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>回答書作成日</Label>
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

          {/* 回答元医療機関情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">回答元歯科医療機関情報</CardTitle></CardHeader>
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

        {/* 右カラム - 歯科診療情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">歯科診療情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>主訴</Label>
                <Textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => handleChange('chiefComplaint', e.target.value)}
                  rows={2}
                  placeholder="患者の主な訴えを記載"
                />
              </div>
              <div className="space-y-2">
                <Label>歯科診断名 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.dentalDiagnosis}
                  onChange={(e) => handleChange('dentalDiagnosis', e.target.value)}
                  rows={2}
                  placeholder="例: 慢性歯周炎、歯肉炎など"
                />
              </div>
              <div className="space-y-2">
                <Label>口腔内所見 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.dentalFindings}
                  onChange={(e) => handleChange('dentalFindings', e.target.value)}
                  rows={4}
                  placeholder="口腔内の状態、歯の欠損状況、歯周病の状態など"
                />
              </div>
              <div className="space-y-2">
                <Label>歯科治療状況 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.dentalTreatmentStatus}
                  onChange={(e) => handleChange('dentalTreatmentStatus', e.target.value)}
                  rows={4}
                  placeholder="現在行っている治療内容、今後の治療計画など"
                />
              </div>
              <div className="space-y-2">
                <Label>治療経過</Label>
                <Textarea
                  value={formData.treatmentHistory}
                  onChange={(e) => handleChange('treatmentHistory', e.target.value)}
                  rows={4}
                  placeholder="これまでの治療の経過を記載"
                />
              </div>
              <div className="space-y-2">
                <Label>処方内容（歯科）</Label>
                <Textarea
                  value={formData.medications}
                  onChange={(e) => handleChange('medications', e.target.value)}
                  rows={3}
                  placeholder="歯科で処方している薬剤があれば記載"
                />
              </div>
              <div className="space-y-2">
                <Label>歯科検査結果</Label>
                <Textarea
                  value={formData.examResults}
                  onChange={(e) => handleChange('examResults', e.target.value)}
                  rows={4}
                  placeholder="パノラマX線写真、歯周病検査結果など"
                />
              </div>
              <div className="space-y-2">
                <Label>留意事項・注意事項 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.precautions}
                  onChange={(e) => handleChange('precautions', e.target.value)}
                  rows={4}
                  placeholder="医科治療において留意すべき口腔内の問題点や、全身管理上の注意点など"
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
