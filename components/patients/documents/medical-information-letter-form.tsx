'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Save,
  Printer,
  X,
  FileText,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'

interface MedicalInformationLetterFormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

interface FormData {
  documentDate: string
  patientNumber: string
  patientName: string
  patientNameKana: string
  gender: string
  birthDate: string
  age: string
  address: string
  phone: string
  referToInstitution: string // 紹介先医療機関
  referToDoctor: string // 紹介先医師
  referToDepartment: string // 紹介先診療科
  referralReason: string // 紹介理由
  clinicalSummary: string // 臨床経過
  diagnosis: string // 診断名
  treatmentHistory: string // 治療歴
  medications: string // 投薬内容
  examResults: string // 検査結果
  requestedExam: string // 依頼検査・治療
  remarks: string
  dentistName: string
  dentistLicense: string
  clinicName: string
  clinicAddress: string
  clinicPhone: string
}

const initialFormData: FormData = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  address: '',
  phone: '',
  referToInstitution: '',
  referToDoctor: '',
  referToDepartment: '',
  referralReason: '',
  clinicalSummary: '',
  diagnosis: '',
  treatmentHistory: '',
  medications: '',
  examResults: '',
  requestedExam: '',
  remarks: '',
  dentistName: '',
  dentistLicense: '',
  clinicName: '',
  clinicAddress: '',
  clinicPhone: ''
}

export function MedicalInformationLetterForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: MedicalInformationLetterFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPatientData()
  }, [patientId])

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<FormData>
      setFormData(prev => ({ ...prev, ...content }))
      setAutoPopulatedFields(new Set())
    }
  }, [document])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) throw new Error('患者情報の取得に失敗しました')
      const patient = await response.json()

      const autoFields = new Set<string>()
      const updates: Partial<FormData> = {}

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

      setFormData(prev => ({ ...prev, ...updates }))
      setAutoPopulatedFields(autoFields)
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `診療情報提供書 - ${formData.patientName || '患者名未設定'} → ${formData.referToInstitution || '紹介先未設定'}`
      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '診療情報提供書' as const,
        title,
        content: formData
      }

      if (document) {
        await updateMedicalDocument(document.id, { title, content: formData })
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

  const handleCopyHTML = async () => {
    try {
      const htmlContent = generateHTMLContent()
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([generatePlainText()], { type: 'text/plain' })
        })
      ])
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('コピーエラー:', error)
      alert('コピーに失敗しました')
    }
  }

  const handleCopyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('コピーエラー:', error)
      alert('コピーに失敗しました')
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
        <title>診療情報提供書</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'MS PGothic', sans-serif; font-size: 10pt; line-height: 1.6; }
          h1 { text-align: center; font-size: 16pt; margin-bottom: 20px; }
          h2 { font-size: 12pt; border-bottom: 2px solid #333; margin-top: 20px; margin-bottom: 10px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
          .value { display: inline-block; }
        </style>
      </head>
      <body>
        ${generateHTMLContent()}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const generateHTMLContent = () => {
    return `
      <h1>診療情報提供書</h1>

      <h2>紹介先</h2>
      <div class="field"><span class="label">紹介先医療機関:</span><span class="value">${formData.referToInstitution}</span></div>
      <div class="field"><span class="label">紹介先医師:</span><span class="value">${formData.referToDoctor} 先生</span></div>
      <div class="field"><span class="label">診療科:</span><span class="value">${formData.referToDepartment}</span></div>

      <h2>患者基本情報</h2>
      <div class="field"><span class="label">文書作成日:</span><span class="value">${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">患者番号:</span><span class="value">${formData.patientNumber}</span></div>
      <div class="field"><span class="label">患者氏名:</span><span class="value">${formData.patientName}</span></div>
      <div class="field"><span class="label">フリガナ:</span><span class="value">${formData.patientNameKana}</span></div>
      <div class="field"><span class="label">性別:</span><span class="value">${formData.gender}</span></div>
      <div class="field"><span class="label">生年月日:</span><span class="value">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">年齢:</span><span class="value">${formData.age}</span></div>
      <div class="field"><span class="label">住所:</span><span class="value">${formData.address}</span></div>
      <div class="field"><span class="label">電話番号:</span><span class="value">${formData.phone}</span></div>

      <h2>紹介理由</h2>
      <div class="field">${formData.referralReason}</div>

      <h2>診断名</h2>
      <div class="field">${formData.diagnosis}</div>

      <h2>臨床経過</h2>
      <div class="field">${formData.clinicalSummary}</div>

      <h2>治療歴</h2>
      <div class="field">${formData.treatmentHistory}</div>

      <h2>投薬内容</h2>
      <div class="field">${formData.medications}</div>

      <h2>検査結果</h2>
      <div class="field">${formData.examResults}</div>

      <h2>依頼検査・治療</h2>
      <div class="field">${formData.requestedExam}</div>

      <h2>その他</h2>
      <div class="field"><span class="label">備考:</span><span class="value">${formData.remarks}</span></div>

      <h2>紹介元医療機関</h2>
      <div class="field"><span class="label">医療機関名:</span><span class="value">${formData.clinicName}</span></div>
      <div class="field"><span class="label">所在地:</span><span class="value">${formData.clinicAddress}</span></div>
      <div class="field"><span class="label">電話番号:</span><span class="value">${formData.clinicPhone}</span></div>
      <div class="field"><span class="label">担当歯科医師:</span><span class="value">${formData.dentistName}</span></div>
      <div class="field"><span class="label">歯科医師免許番号:</span><span class="value">${formData.dentistLicense}</span></div>
    `
  }

  const generatePlainText = () => {
    let text = `診療情報提供書\n\n`
    text += `【紹介先】\n`
    text += `紹介先医療機関: ${formData.referToInstitution}\n`
    text += `紹介先医師: ${formData.referToDoctor} 先生\n`
    text += `診療科: ${formData.referToDepartment}\n\n`

    text += `【患者基本情報】\n`
    text += `文書作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `患者番号: ${formData.patientNumber}\n`
    text += `患者氏名: ${formData.patientName}\n`
    text += `フリガナ: ${formData.patientNameKana}\n`
    text += `性別: ${formData.gender}\n`
    text += `生年月日: ${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `年齢: ${formData.age}\n`
    text += `住所: ${formData.address}\n`
    text += `電話番号: ${formData.phone}\n\n`

    text += `【紹介理由】\n${formData.referralReason}\n\n`
    text += `【診断名】\n${formData.diagnosis}\n\n`
    text += `【臨床経過】\n${formData.clinicalSummary}\n\n`
    text += `【治療歴】\n${formData.treatmentHistory}\n\n`
    text += `【投薬内容】\n${formData.medications}\n\n`
    text += `【検査結果】\n${formData.examResults}\n\n`
    text += `【依頼検査・治療】\n${formData.requestedExam}\n\n`
    text += `【その他】\n備考: ${formData.remarks}\n\n`

    text += `【紹介元医療機関】\n`
    text += `医療機関名: ${formData.clinicName}\n`
    text += `所在地: ${formData.clinicAddress}\n`
    text += `電話番号: ${formData.clinicPhone}\n`
    text += `担当歯科医師: ${formData.dentistName}\n`
    text += `歯科医師免許番号: ${formData.dentistLicense}\n`

    return text
  }

  const isAutoPopulated = (field: keyof FormData) => autoPopulatedFields.has(field)

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
      <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">診療情報提供書</h3>
            <p className="text-sm text-gray-600">{document ? '文書を編集中' : '新規文書を作成中'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
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
          <p className="font-medium">黄色の背景は自動入力された項目です</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">紹介先情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>紹介先医療機関</Label>
                <Input value={formData.referToInstitution} onChange={(e) => handleChange('referToInstitution', e.target.value)} placeholder="例: ○○大学病院" />
              </div>
              <div className="space-y-2">
                <Label>紹介先医師</Label>
                <Input value={formData.referToDoctor} onChange={(e) => handleChange('referToDoctor', e.target.value)} placeholder="例: 山田太郎" />
              </div>
              <div className="space-y-2">
                <Label>診療科</Label>
                <Input value={formData.referToDepartment} onChange={(e) => handleChange('referToDepartment', e.target.value)} placeholder="例: 口腔外科" />
              </div>
            </CardContent>
          </Card>

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
              <div className="space-y-2">
                <Label>歯科医師免許番号</Label>
                <Input value={formData.dentistLicense} onChange={(e) => handleChange('dentistLicense', e.target.value)} placeholder="例: 第123456号" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">診療情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>紹介理由</Label>
                <Textarea value={formData.referralReason} onChange={(e) => handleChange('referralReason', e.target.value)} rows={4} placeholder="紹介の理由を記載" />
              </div>
              <div className="space-y-2">
                <Label>診断名</Label>
                <Textarea value={formData.diagnosis} onChange={(e) => handleChange('diagnosis', e.target.value)} rows={3} placeholder="診断名を記載" />
              </div>
              <div className="space-y-2">
                <Label>臨床経過</Label>
                <Textarea value={formData.clinicalSummary} onChange={(e) => handleChange('clinicalSummary', e.target.value)} rows={5} placeholder="これまでの臨床経過を記載" />
              </div>
              <div className="space-y-2">
                <Label>治療歴</Label>
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
                <Label>依頼検査・治療</Label>
                <Textarea value={formData.requestedExam} onChange={(e) => handleChange('requestedExam', e.target.value)} rows={4} placeholder="依頼する検査や治療内容を記載" />
              </div>
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
