'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  patientName: string

  // 歯と歯肉の状態
  wellPolished: boolean
  grindsRemain: boolean
  grindsRemainLocation: string
  calculusPresent: boolean
  gumInflammation: boolean

  // その他
  tongueCoating: boolean
  dentureUnclean: boolean
  otherCondition: string

  // 歯列図
  currentToothCount: string
  teethStatus: { [toothNumber: number]: boolean }

  // 指導内容
  brushingAndPlaqueRemoval: boolean
  salivaGlandMassage: boolean
  oralClosureTraining: boolean
  oralClosureTrainingDetail: string
  tongueImprovementTraining: boolean
  tongueImprovementTrainingDetail: string
  masticationTraining: boolean

  // 指導時間
  guidanceStartTime: string
  guidanceEndTime: string

  // 保険医療機関
  clinicName: string
  clinicAddress: string
  dentistName: string
  hygienistName: string
}

const initialFormData: FormData = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientName: '',
  wellPolished: false,
  grindsRemain: false,
  grindsRemainLocation: '',
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
  guidanceStartTime: '',
  guidanceEndTime: '',
  clinicName: '',
  clinicAddress: '',
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

      if (patient.last_name && patient.first_name) {
        updates.patientName = `${patient.last_name} ${patient.first_name}`
        autoFields.add('patientName')
      }

      setFormData(prev => ({ ...prev, ...updates }))
      setAutoPopulatedFields(autoFields)
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleToothClick = (toothNumber: number) => {
    setFormData(prev => ({
      ...prev,
      teethStatus: {
        ...prev.teethStatus,
        [toothNumber]: !prev.teethStatus[toothNumber]
      }
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `口腔衛生管理様 - ${formData.patientName || '患者名未設定'}`
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
        <title>口腔衛生管理様</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'MS PGothic', 'MS Gothic', sans-serif;
            font-size: 9pt;
            line-height: 1.3;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 12px;
            position: relative;
          }
          .header-top {
            font-size: 8pt;
            text-align: left;
            margin-bottom: 5px;
          }
          .title {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 6px;
            margin: 8px 0;
          }
          .subtitle {
            font-size: 12pt;
            margin-bottom: 8px;
          }
          .date-box {
            position: absolute;
            top: 0;
            right: 0;
            font-size: 9pt;
          }
          .section {
            border: 2px solid #000;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 5px;
          }
          .section-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }
          .checkbox-group {
            margin: 4px 0;
          }
          .checkbox-item {
            margin: 2px 0;
            font-size: 9pt;
          }
          .teeth-diagram {
            text-align: center;
            margin: 20px 0;
          }
          .teeth-table {
            border-collapse: collapse;
            margin: 0 auto;
          }
          .teeth-table td {
            border: 1px solid #000;
            width: 24px;
            height: 36px;
            text-align: center;
            vertical-align: middle;
            font-size: 8pt;
            padding: 1px;
            background-color: #f5f5f5;
          }
          .teeth-table td.present {
            background-color: #fff;
          }
          .teeth-table .tooth-number {
            font-size: 6pt;
            color: #666;
            line-height: 1;
          }
          .teeth-table .tooth-mark {
            font-size: 12pt;
            font-weight: bold;
            line-height: 1;
          }
          .guidance-content {
            display: flex;
            gap: 20px;
          }
          .guidance-left, .guidance-right {
            flex: 1;
          }
          .footer-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .footer-table td {
            border: 1px solid #000;
            padding: 8px;
            font-size: 9pt;
          }
          .footer-note {
            text-align: right;
            font-size: 7pt;
            margin-top: 15px;
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
    const dateObj = new Date(formData.documentDate)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1
    const day = dateObj.getDate()

    // 歯列図の生成
    const upperTeeth = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8]
    const lowerTeeth = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8]
    const upperNumbers = Array.from({length: 16}, (_, i) => i < 8 ? 18 - i : 21 + (i - 8))
    const lowerNumbers = Array.from({length: 16}, (_, i) => i < 8 ? 48 - i : 31 + (i - 8))

    const presentTeeth = Object.keys(formData.teethStatus).filter(key => formData.teethStatus[Number(key)])

    return `
      <div class="header">
        <div class="date-box">
          年　　月　　日
        </div>
        <div class="title">口腔衛生管理</div>
        <div class="subtitle">様</div>
      </div>

      <div class="section">
        <div class="section-title">歯と歯肉の状態</div>
        <div class="checkbox-group">
          <div class="checkbox-item">${formData.wellPolished ? '☑' : '☐'} よく磨けています</div>
          <div class="checkbox-item">${formData.grindsRemain ? '☑' : '☐'} 磨き残しがあります ${formData.grindsRemainLocation ? '('+formData.grindsRemainLocation+'部)' : '(　　部)'}</div>
          <div class="checkbox-item">${formData.calculusPresent ? '☑' : '☐'} 歯石がついています</div>
          <div class="checkbox-item">${formData.gumInflammation ? '☑' : '☐'} 歯ぐきに発赤・出血・腫れがあります</div>
        </div>

        <div class="section-title" style="margin-top: 15px;">その他</div>
        <div class="checkbox-group">
          <div class="checkbox-item">${formData.tongueCoating ? '☑' : '☐'} 舌苔（舌の汚れ）</div>
          <div class="checkbox-item">${formData.dentureUnclean ? '☑' : '☐'} 義歯下粘膜の汚れ</div>
          <div class="checkbox-item">${formData.otherCondition ? '☑' : '☐'} その他（${formData.otherCondition || '　　　　　　　　　　'}）</div>
        </div>
      </div>

      <div class="guidance-content">
        <div class="guidance-left">
          <div class="teeth-diagram">
            <table class="teeth-table">
              <tr>
                ${upperNumbers.map((num, idx) => `
                  <td class="${formData.teethStatus[num] ? 'present' : ''}">
                    <div class="tooth-number">${upperTeeth[idx]}</div>
                    <div class="tooth-mark">${formData.teethStatus[num] ? '●' : ''}</div>
                  </td>
                `).join('')}
              </tr>
              <tr>
                ${lowerNumbers.map((num, idx) => `
                  <td class="${formData.teethStatus[num] ? 'present' : ''}">
                    <div class="tooth-mark">${formData.teethStatus[num] ? '●' : ''}</div>
                    <div class="tooth-number">${lowerTeeth[idx]}</div>
                  </td>
                `).join('')}
              </tr>
            </table>
            <div style="margin-top: 10px; font-weight: bold;">
              現在（${formData.currentToothCount || '　　'}）本
            </div>
          </div>
        </div>

        <div class="guidance-right">
          <div class="section">
            <div class="section-title">指導内容</div>
            <div class="checkbox-group">
              <div class="checkbox-item">${formData.brushingAndPlaqueRemoval ? '☑' : '☐'} ブラッシングおよびプラーク除去</div>
              <div class="checkbox-item">${formData.salivaGlandMassage ? '☑' : '☐'} 唾液腺マッサージ</div>
              <div class="checkbox-item">
                ${formData.oralClosureTraining ? '☑' : '☐'} 口唇閉鎖力の訓練<br>
                <span style="margin-left: 20px;">（内容：${formData.oralClosureTrainingDetail || '　　　　　　　　　　'}）</span>
              </div>
              <div class="checkbox-item">
                ${formData.tongueImprovementTraining ? '☑' : '☐'} 舌圧改善の訓練<br>
                <span style="margin-left: 20px;">（内容：${formData.tongueImprovementTrainingDetail || '　　　　　　　　　　'}）</span>
              </div>
              <div class="checkbox-item">${formData.masticationTraining ? '☑' : '☐'} 咀嚼機能訓練</div>
            </div>
            <div style="margin-top: 15px; text-align: right;">
              時間（${formData.guidanceStartTime || '　　'}：　～　${formData.guidanceEndTime || '　　'}：　）
            </div>
          </div>
        </div>
      </div>

      <table class="footer-table">
        <tr>
          <td rowspan="2" style="width: 30%; font-weight: bold; text-align: center;">保険医療機関名</td>
          <td rowspan="2" style="width: 40%;">${formData.clinicName || ''}</td>
          <td style="width: 30%;"></td>
        </tr>
        <tr>
          <td></td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center;">所在地・電話番号</td>
          <td colspan="2">${formData.clinicAddress || ''}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; text-align: center;">担当歯科医</td>
          <td colspan="2">${formData.dentistName || ''}<span style="margin-left: 40px;">歯科衛生士</span><span style="margin-left: 20px;">${formData.hygienistName || ''}</span></td>
        </tr>
      </table>
    `
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

  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">口腔衛生管理様</h3>
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
                <Label>患者氏名</Label>
                <Input value={formData.patientName} onChange={(e) => handleChange('patientName', e.target.value)} className={isAutoPopulated('patientName') ? 'bg-yellow-50' : ''} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">歯と歯肉の状態</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.wellPolished} onCheckedChange={(checked) => handleChange('wellPolished', checked)} id="wellPolished" />
                <Label htmlFor="wellPolished" className="cursor-pointer">よく磨けています</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.grindsRemain} onCheckedChange={(checked) => handleChange('grindsRemain', checked)} id="grindsRemain" />
                  <Label htmlFor="grindsRemain" className="cursor-pointer">磨き残しがあります</Label>
                </div>
                {formData.grindsRemain && (
                  <Input value={formData.grindsRemainLocation} onChange={(e) => handleChange('grindsRemainLocation', e.target.value)} placeholder="部位を入力（例：上顎前歯）" className="ml-6" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.calculusPresent} onCheckedChange={(checked) => handleChange('calculusPresent', checked)} id="calculusPresent" />
                <Label htmlFor="calculusPresent" className="cursor-pointer">歯石がついています</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.gumInflammation} onCheckedChange={(checked) => handleChange('gumInflammation', checked)} id="gumInflammation" />
                <Label htmlFor="gumInflammation" className="cursor-pointer">歯ぐきに発赤・出血・腫れがあります</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">その他</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.tongueCoating} onCheckedChange={(checked) => handleChange('tongueCoating', checked)} id="tongueCoating" />
                <Label htmlFor="tongueCoating" className="cursor-pointer">舌苔（舌の汚れ）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.dentureUnclean} onCheckedChange={(checked) => handleChange('dentureUnclean', checked)} id="dentureUnclean" />
                <Label htmlFor="dentureUnclean" className="cursor-pointer">義歯下粘膜の汚れ</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherCondition">その他</Label>
                <Input value={formData.otherCondition} onChange={(e) => handleChange('otherCondition', e.target.value)} id="otherCondition" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">歯列図</CardTitle></CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label>現在の歯数</Label>
                <Input value={formData.currentToothCount} onChange={(e) => handleChange('currentToothCount', e.target.value)} placeholder="例: 28" />
              </div>
              <Label className="mb-2 block">歯をクリックして選択（クリックで●マーク）</Label>
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                {/* 上顎 */}
                <div className="flex justify-center gap-0.5 mb-2">
                  {upperTeeth.map(toothNum => {
                    const isSelected = formData.teethStatus[toothNum]
                    const bgColor = isSelected ? 'bg-white' : 'bg-gray-100'
                    return (
                      <button
                        key={toothNum}
                        type="button"
                        onClick={() => handleToothClick(toothNum)}
                        className={`w-8 h-12 border border-gray-300 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${bgColor}`}
                      >
                        <span className="text-xs text-gray-500">{toothNum}</span>
                        <span className="text-base font-bold">{isSelected ? '●' : ''}</span>
                      </button>
                    )
                  })}
                </div>
                {/* 下顎 */}
                <div className="flex justify-center gap-0.5">
                  {lowerTeeth.map(toothNum => {
                    const isSelected = formData.teethStatus[toothNum]
                    const bgColor = isSelected ? 'bg-white' : 'bg-gray-100'
                    return (
                      <button
                        key={toothNum}
                        type="button"
                        onClick={() => handleToothClick(toothNum)}
                        className={`w-8 h-12 border border-gray-300 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${bgColor}`}
                      >
                        <span className="text-base font-bold">{isSelected ? '●' : ''}</span>
                        <span className="text-xs text-gray-500">{toothNum}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">指導内容</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.brushingAndPlaqueRemoval} onCheckedChange={(checked) => handleChange('brushingAndPlaqueRemoval', checked)} id="brushingAndPlaqueRemoval" />
                <Label htmlFor="brushingAndPlaqueRemoval" className="cursor-pointer">ブラッシングおよびプラーク除去</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.salivaGlandMassage} onCheckedChange={(checked) => handleChange('salivaGlandMassage', checked)} id="salivaGlandMassage" />
                <Label htmlFor="salivaGlandMassage" className="cursor-pointer">唾液腺マッサージ</Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.oralClosureTraining} onCheckedChange={(checked) => handleChange('oralClosureTraining', checked)} id="oralClosureTraining" />
                  <Label htmlFor="oralClosureTraining" className="cursor-pointer">口唇閉鎖力の訓練</Label>
                </div>
                {formData.oralClosureTraining && (
                  <Input value={formData.oralClosureTrainingDetail} onChange={(e) => handleChange('oralClosureTrainingDetail', e.target.value)} placeholder="内容を入力" className="ml-6" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox checked={formData.tongueImprovementTraining} onCheckedChange={(checked) => handleChange('tongueImprovementTraining', checked)} id="tongueImprovementTraining" />
                  <Label htmlFor="tongueImprovementTraining" className="cursor-pointer">舌圧改善の訓練</Label>
                </div>
                {formData.tongueImprovementTraining && (
                  <Input value={formData.tongueImprovementTrainingDetail} onChange={(e) => handleChange('tongueImprovementTrainingDetail', e.target.value)} placeholder="内容を入力" className="ml-6" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={formData.masticationTraining} onCheckedChange={(checked) => handleChange('masticationTraining', checked)} id="masticationTraining" />
                <Label htmlFor="masticationTraining" className="cursor-pointer">咀嚼機能訓練</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">指導時間</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開始時刻</Label>
                  <Input type="time" value={formData.guidanceStartTime} onChange={(e) => handleChange('guidanceStartTime', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>終了時刻</Label>
                  <Input type="time" value={formData.guidanceEndTime} onChange={(e) => handleChange('guidanceEndTime', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">保険医療機関</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>医療機関名</Label>
                <Input value={formData.clinicName} onChange={(e) => handleChange('clinicName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>所在地・電話番号</Label>
                <Textarea value={formData.clinicAddress} onChange={(e) => handleChange('clinicAddress', e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>担当歯科医</Label>
                <Input value={formData.dentistName} onChange={(e) => handleChange('dentistName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>歯科衛生士</Label>
                <Input value={formData.hygienistName} onChange={(e) => handleChange('hygienistName', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
