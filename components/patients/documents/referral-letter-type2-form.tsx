'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Save, Printer, X, Search, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'
import { ReferralLetterType2Data } from '@/types/medical-information-letter'

interface ReferralLetterType2FormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

const initialFormData: Omit<ReferralLetterType2Data, 'documentType'> = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  address: '',
  phone: '',

  patientRequest: '',
  requestedDate: format(new Date(), 'yyyy-MM-dd'),
  consultationPurpose: '',

  chiefComplaint: '',
  diagnosis: '',
  diseaseStage: '',
  presentIllness: '',
  pastMedicalHistory: '',
  familyHistory: '',

  currentTreatmentPlan: '',
  treatmentOptions: '',
  treatmentHistory: '',
  medications: '',

  examResults: '',
  imageInformation: '',

  remarks: '',

  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  dentistName: ''
}

export function ReferralLetterType2Form({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: ReferralLetterType2FormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPatientData()
  }, [patientId])

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<ReferralLetterType2Data>
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

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `診療情報提供料(II) - ${formData.patientName || '患者名未設定'} - セカンドオピニオン`

      const fullData: ReferralLetterType2Data = {
        ...formData,
        documentType: '診療情報提供料(II)'
      }

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '診療情報提供書' as const,
        document_subtype: '診療情報提供料(II)',
        title,
        content: fullData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: fullData,
          document_subtype: '診療情報提供料(II)'
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
        <title>診療情報提供書（II）セカンドオピニオン</title>
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
          .notice { background-color: #fef3c7; border: 2px solid #f59e0b; padding: 8px; margin: 8px 0; border-radius: 5px; font-size: 8pt; }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 3px;">
          <span style="font-size: 8pt;">作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span>
        </div>

        <h1>診療情報提供書（セカンドオピニオン用）</h1>

        <div class="notice">
          <strong>患者申し出記録:</strong> ${formData.patientRequest}<br>
          <strong>申し出日:</strong> ${formData.requestedDate ? format(new Date(formData.requestedDate), 'yyyy年MM月dd日', { locale: ja }) : ''}
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

        ${formData.consultationPurpose ? `<h2>相談目的</h2><div class="text-content">${formData.consultationPurpose}</div>` : ''}

        ${formData.diagnosis ? `<h2>確定診断名</h2><div class="text-content">${formData.diagnosis}</div>` : ''}

        ${formData.diseaseStage ? `<h2>病期・ステージ</h2><div class="text-content">${formData.diseaseStage}</div>` : ''}

        ${formData.chiefComplaint ? `<h2>主訴</h2><div class="text-content">${formData.chiefComplaint}</div>` : ''}

        ${formData.presentIllness ? `<h2>現病歴</h2><div class="text-content">${formData.presentIllness}</div>` : ''}

        ${formData.pastMedicalHistory ? `<h2>既往歴</h2><div class="text-content">${formData.pastMedicalHistory}</div>` : ''}

        ${formData.familyHistory ? `<h2>家族歴</h2><div class="text-content">${formData.familyHistory}</div>` : ''}

        ${formData.currentTreatmentPlan ? `<h2>現在の治療方針</h2><div class="text-content">${formData.currentTreatmentPlan}</div>` : ''}

        ${formData.treatmentOptions ? `<h2>治療選択肢</h2><div class="text-content">${formData.treatmentOptions}</div>` : ''}

        ${formData.treatmentHistory ? `<h2>治療歴</h2><div class="text-content">${formData.treatmentHistory}</div>` : ''}

        ${formData.medications ? `<h2>現在の投薬内容</h2><div class="text-content">${formData.medications}</div>` : ''}

        ${formData.examResults ? `<h2>検査結果</h2><div class="text-content">${formData.examResults}</div>` : ''}

        ${formData.imageInformation ? `<h2>画像情報</h2><div class="text-content">${formData.imageInformation}</div>` : ''}

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
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500">患者データを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3">
          <Search className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">診療情報提供料（II）- セカンドオピニオン</h3>
            <p className="text-sm text-gray-600">B010 500点 - セカンドオピニオンのための情報提供</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
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

      <div className="grid grid-cols-2 gap-6">
        {/* 左カラム */}
        <div className="space-y-6">
          {/* セカンドオピニオン特有情報 */}
          <Card>
            <CardHeader><CardTitle className="text-base">セカンドオピニオン申し出情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>患者の申し出内容 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.patientRequest} onChange={(e) => handleChange('patientRequest', e.target.value)} rows={3} placeholder="患者または家族からセカンドオピニオンを求めたい旨の申し出内容を記載" />
              </div>
              <div className="space-y-2">
                <Label>申し出があった日</Label>
                <Input type="date" value={formData.requestedDate} onChange={(e) => handleChange('requestedDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>相談目的 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.consultationPurpose} onChange={(e) => handleChange('consultationPurpose', e.target.value)} rows={3} placeholder="どのような助言を求めているか記載" />
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
                <Input value={formData.clinicName} onChange={(e) => handleChange('clinicName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>所在地</Label>
                <Input value={formData.clinicAddress} onChange={(e) => handleChange('clinicAddress', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>電話番号</Label>
                <Input value={formData.clinicPhone} onChange={(e) => handleChange('clinicPhone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>担当歯科医師</Label>
                <Input value={formData.dentistName} onChange={(e) => handleChange('dentistName', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム - 診療情報 */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">診断・病歴情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>確定診断名 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.diagnosis} onChange={(e) => handleChange('diagnosis', e.target.value)} rows={2} placeholder="主病名・副病名を記載" />
              </div>
              <div className="space-y-2">
                <Label>病期・ステージ</Label>
                <Input value={formData.diseaseStage} onChange={(e) => handleChange('diseaseStage', e.target.value)} placeholder="該当する場合に記載" />
              </div>
              <div className="space-y-2">
                <Label>主訴</Label>
                <Textarea value={formData.chiefComplaint} onChange={(e) => handleChange('chiefComplaint', e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>現病歴</Label>
                <Textarea value={formData.presentIllness} onChange={(e) => handleChange('presentIllness', e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>既往歴</Label>
                <Textarea value={formData.pastMedicalHistory} onChange={(e) => handleChange('pastMedicalHistory', e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>家族歴</Label>
                <Textarea value={formData.familyHistory} onChange={(e) => handleChange('familyHistory', e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">治療計画・経過</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>現在の治療方針 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.currentTreatmentPlan} onChange={(e) => handleChange('currentTreatmentPlan', e.target.value)} rows={4} placeholder="現在提案している治療方針を記載" />
              </div>
              <div className="space-y-2">
                <Label>治療選択肢 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.treatmentOptions} onChange={(e) => handleChange('treatmentOptions', e.target.value)} rows={4} placeholder="考えられる治療選択肢とそれぞれのメリット・デメリットを記載" />
              </div>
              <div className="space-y-2">
                <Label>治療歴</Label>
                <Textarea value={formData.treatmentHistory} onChange={(e) => handleChange('treatmentHistory', e.target.value)} rows={4} placeholder="これまでの治療内容の詳細を記載" />
              </div>
              <div className="space-y-2">
                <Label>現在の投薬内容</Label>
                <Textarea value={formData.medications} onChange={(e) => handleChange('medications', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">検査・画像情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>検査結果の詳細 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.examResults} onChange={(e) => handleChange('examResults', e.target.value)} rows={5} placeholder="実施した検査項目・検査日・結果の詳細を記載" />
              </div>
              <div className="space-y-2">
                <Label>画像情報 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.imageInformation} onChange={(e) => handleChange('imageInformation', e.target.value)} rows={4} placeholder="レントゲン、CT、MRI等の撮影日・読影所見を記載" />
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
