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

interface HygienistGuidanceFormProps {
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

  // 歯と歯肉の状態
  wellPolished: boolean // よく磨けています
  grindsRemain: boolean // 磨き残しがあります
  calculusPresent: boolean // 歯石がついています
  gumInflammation: boolean // 歯ぐきに発赤・出血・腫れがあります

  // その他の状態
  tongueCoating: boolean // 舌苔（舌の汚れ）
  dentureUnclean: boolean // 義歯下粘膜の汚れ
  otherCondition: string // その他

  // 歯列図
  currentToothCount: string // 現在の歯数
  teethStatus: { [toothNumber: number]: 'present' | 'missing' | 'caries' | 'filled' | 'watch' }

  // 指導内容
  brushingAndPlaqueRemoval: boolean // ブラッシングおよびプラーク除去
  salivaGlandMassage: boolean // 唾液腺マッサージ
  oralClosureTraining: boolean // 口唇閉鎖力の訓練
  oralClosureTrainingDetail: string // 口唇閉鎖力の訓練（内容）
  tongueImprovementTraining: boolean // 舌圧改善の訓練
  tongueImprovementTrainingDetail: string // 舌圧改善の訓練（内容）
  masticationTraining: boolean // 咀嚼機能訓練

  // 指導時間
  guidanceDate: string
  guidanceStartTime: string
  guidanceEndTime: string

  // 保険医療機関情報
  clinicName: string
  clinicAddress: string
  clinicPhone: string
  dentistName: string
  hygienistName: string
}

const initialFormData: FormData = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  wellPolished: false,
  grindsRemain: false,
  calculusPresent: false,
  gumInflammation: false,
  tongueCoating: false,
  dentureUnclean: false,
  otherCondition: '',
  currentToothCount: '',
  teethStatus: {},
  brushingAndPlaqueRemoval: false,
  salivaGlandMassage: false,
  oralClosureTraining: false,
  oralClosureTrainingDetail: '',
  tongueImprovementTraining: false,
  tongueImprovementTrainingDetail: '',
  masticationTraining: false,
  guidanceDate: format(new Date(), 'yyyy-MM-dd'),
  guidanceStartTime: '',
  guidanceEndTime: '',
  clinicName: '',
  clinicAddress: '',
  clinicPhone: '',
  dentistName: '',
  hygienistName: ''
}

export function HygienistGuidanceForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: HygienistGuidanceFormProps) {
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
      const title = `歯科衛生士実地指導 - ${formData.patientName || '患者名未設定'}`
      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '歯科衛生士実地指導' as const,
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
      alert('HTMLをコピーしました')
    } catch (error) {
      console.error('コピーエラー:', error)
      alert('コピーに失敗しました')
    }
  }

  const handleCopyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText())
      alert('テキストをコピーしました')
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
        <title>歯科衛生士実地指導</title>
        <style>
          @page { size: A4 portrait; margin: 10mm 12mm; }
          body {
            font-family: 'MS PGothic', 'MS Gothic', sans-serif;
            font-size: 7pt;
            line-height: 1.15;
            margin: 0;
            padding: 0;
            letter-spacing: 0.4px;
          }
          h1 {
            text-align: center;
            font-size: 12pt;
            margin: 0 0 3px 0;
            padding: 4px;
            background-color: #f8f9fa;
            border: 2px solid #333;
            border-radius: 4px;
            line-height: 2.0;
          }
          h2 {
            font-size: 8.5pt;
            background-color: #e9ecef;
            padding: 2px 6px;
            margin: 3px 0 1px 0;
            border-left: 4px solid #495057;
            font-weight: bold;
          }
          .section {
            border: 1.5px solid #dee2e6;
            padding: 2.5px;
            margin-bottom: 0px;
            border-radius: 2px;
            background-color: #ffffff;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2px 10px;
            margin-bottom: 3px;
          }
          .field {
            margin-bottom: 1.5px;
            line-height: 1.5;
            padding: 0.5px 0;
          }
          .label {
            font-weight: bold;
            display: inline-block;
            width: 90px;
            font-size: 7pt;
            color: #495057;
          }
          .value {
            display: inline-block;
            font-size: 7pt;
          }
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
      <h1>歯科衛生士実地指導</h1>

      <div class="section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h2 style="margin: 0;">基本情報</h2>
          <div style="font-size: 7pt;"><span style="font-weight: bold;">文書作成日:</span> ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</div>
        </div>
        <div style="display: flex; gap: 20px; margin-bottom: 4px;">
          <div class="field" style="flex: 1;"><span class="label">患者氏名:</span><span class="value">${formData.patientName}</span></div>
          <div style="flex: 0 0 280px; display: flex; gap: 15px; align-items: center; margin-bottom: 2px; padding: 1px 0;">
            <div style="white-space: nowrap;"><span class="label">性別:</span><span class="value">${formData.gender}</span></div>
            <div style="white-space: nowrap;"><span class="label">生年月日:</span><span class="value">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy/MM/dd') : ''}</span></div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>指導情報</h2>
        <div class="info-grid">
          <div class="field"><span class="label">医療機関名:</span><span class="value">${formData.clinicName}</span></div>
          <div class="field"><span class="label">指導実施日:</span><span class="value">${formData.guidanceDate ? format(new Date(formData.guidanceDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
          <div class="field"><span class="label">担当歯科医師名:</span><span class="value">${formData.dentistName}</span></div>
          <div class="field"><span class="label">指導開始時刻:</span><span class="value">${formData.guidanceStartTime || ''}</span></div>
          <div class="field"><span class="label">担当歯科衛生士:</span><span class="value">${formData.hygienistName}</span></div>
          <div class="field"><span class="label">指導終了時刻:</span><span class="value">${formData.guidanceEndTime || ''}</span></div>
        </div>
        <div class="field"><span class="label">指導種別:</span><span class="value">${formData.guidanceType}</span></div>
      </div>

      <div class="section">
        <h2>口腔状態</h2>
        <div class="field"><span class="label">口腔衛生状態:</span><span class="value">${formData.oralHygieneStatus}</span></div>
        <div class="field"><span class="label">プラークスコア:</span><span class="value">${formData.plaqueScore}</span></div>
      </div>

      <div class="section">
        <h2>指導内容</h2>
        <div class="field"><span class="label">ブラッシング方法:</span><span class="value">${formData.brushingMethod}</span></div>
        <div class="field"><span class="label">指導内容詳細:</span><span class="value">${formData.guidanceContent}</span></div>
        <div class="field"><span class="label">ホームケア計画:</span><span class="value">${formData.homeCarePlan}</span></div>
        <div class="field"><span class="label">次回指導予定:</span><span class="value">${formData.nextGuidanceDate ? format(new Date(formData.nextGuidanceDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      </div>

      <div class="section">
        <h2>その他</h2>
        <div class="field"><span class="label">備考:</span><span class="value">${formData.remarks}</span></div>
      </div>
    `
  }

  const generatePlainText = () => {
    let text = `歯科衛生士実地指導\n\n`
    text += `【基本情報】\n`
    text += `文書作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `医療機関名: ${formData.clinicName}\n`
    text += `患者番号: ${formData.patientNumber}\n`
    text += `患者氏名: ${formData.patientName}\n`
    text += `フリガナ: ${formData.patientNameKana}\n`
    text += `性別: ${formData.gender}\n`
    text += `生年月日: ${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `年齢: ${formData.age}\n\n`

    text += `【指導情報】\n`
    text += `指導実施日: ${formData.guidanceDate ? format(new Date(formData.guidanceDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `指導開始時刻: ${formData.guidanceStartTime || ''}\n`
    text += `指導終了時刻: ${formData.guidanceEndTime || ''}\n`
    text += `担当歯科医師名: ${formData.dentistName}\n`
    text += `担当歯科衛生士: ${formData.hygienistName}\n`
    text += `指導種別: ${formData.guidanceType}\n`
    text += `口腔衛生状態: ${formData.oralHygieneStatus}\n`
    text += `プラークスコア: ${formData.plaqueScore}\n\n`

    text += `【指導内容】\n`
    text += `ブラッシング方法: ${formData.brushingMethod}\n`
    text += `指導内容詳細: ${formData.guidanceContent}\n`
    text += `ホームケア計画: ${formData.homeCarePlan}\n`
    text += `次回指導予定: ${formData.nextGuidanceDate ? format(new Date(formData.nextGuidanceDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n\n`

    text += `【その他】\n`
    text += `備考: ${formData.remarks}\n`

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
      <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">歯科衛生士実地指導</h3>
            <p className="text-sm text-gray-600">{document ? '文書を編集中' : '新規文書を作成中'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            印刷
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-yellow-600 hover:bg-yellow-700">
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
            <CardHeader><CardTitle className="text-base">基本情報</CardTitle></CardHeader>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">指導情報</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>医療機関名</Label>
                <Input value={formData.clinicName} onChange={(e) => handleChange('clinicName', e.target.value)} placeholder="例: ○○歯科医院" />
              </div>
              <div className="space-y-2">
                <Label>担当歯科医師名</Label>
                <Input value={formData.dentistName} onChange={(e) => handleChange('dentistName', e.target.value)} placeholder="例: 福永" />
              </div>
              <div className="space-y-2">
                <Label>指導実施日</Label>
                <Input type="date" value={formData.guidanceDate} onChange={(e) => handleChange('guidanceDate', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>指導開始時刻</Label>
                  <Input type="time" value={formData.guidanceStartTime} onChange={(e) => handleChange('guidanceStartTime', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>指導終了時刻</Label>
                  <Input type="time" value={formData.guidanceEndTime} onChange={(e) => handleChange('guidanceEndTime', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>指導種別</Label>
                <Input value={formData.guidanceType} onChange={(e) => handleChange('guidanceType', e.target.value)} placeholder="例: ブラッシング指導、食事指導" />
              </div>
              <div className="space-y-2">
                <Label>口腔衛生状態</Label>
                <Textarea value={formData.oralHygieneStatus} onChange={(e) => handleChange('oralHygieneStatus', e.target.value)} rows={3} placeholder="現在の口腔衛生状態を記載" />
              </div>
              <div className="space-y-2">
                <Label>プラークスコア</Label>
                <Input value={formData.plaqueScore} onChange={(e) => handleChange('plaqueScore', e.target.value)} placeholder="例: 25%、50%" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">指導内容</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ブラッシング方法</Label>
                <Textarea value={formData.brushingMethod} onChange={(e) => handleChange('brushingMethod', e.target.value)} rows={4} placeholder="例: バス法、スクラビング法など" />
              </div>
              <div className="space-y-2">
                <Label>指導内容詳細</Label>
                <Textarea value={formData.guidanceContent} onChange={(e) => handleChange('guidanceContent', e.target.value)} rows={6} placeholder="実施した指導の詳細を記載" />
              </div>
              <div className="space-y-2">
                <Label>ホームケア計画</Label>
                <Textarea value={formData.homeCarePlan} onChange={(e) => handleChange('homeCarePlan', e.target.value)} rows={4} placeholder="自宅で実施するケアの計画" />
              </div>
              <div className="space-y-2">
                <Label>次回指導予定</Label>
                <Input type="date" value={formData.nextGuidanceDate} onChange={(e) => handleChange('nextGuidanceDate', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">その他</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>担当歯科衛生士</Label>
                <Input value={formData.hygienistName} onChange={(e) => handleChange('hygienistName', e.target.value)} placeholder="例: 早水" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
