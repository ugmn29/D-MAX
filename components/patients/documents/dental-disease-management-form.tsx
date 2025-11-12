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

interface DentalDiseaseManagementFormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

interface FormData {
  // 基本情報
  documentSubtype: '管理計画書' | '管理報告書'
  documentDate: string
  patientNumber: string
  patientName: string
  patientNameKana: string
  gender: string
  birthDate: string
  age: string
  address: string
  phone: string

  // 患者記入欄 - 既往歴（チェックボックス式）
  hasDiabetes: boolean
  hasHypertension: boolean
  hasRespiratoryDisease: boolean
  hasCardiovascularDisease: boolean
  isPregnant: boolean
  hasOtherDisease: boolean
  otherDiseaseDetail: string

  // 服用薬
  medications: string

  // 生活習慣の状況
  brushingFrequency: string // 1日の歯磨き回数
  brushingTimingBreakfast: boolean // 朝食後
  brushingTimingLunch: boolean // 昼食後
  brushingTimingDinner: boolean // 夕食後
  brushingTimingBedtime: boolean // 就寝前
  habitualBeverage: string // 習慣的飲料物
  snackPattern: string // 間食の取り方
  oralHygieneTools: string[] // 歯口清掃器具（複数選択）
  smokingStatus: string
  sleepDuration: 'insufficient' | 'somewhat-insufficient' | 'sufficient' | '' // 睡眠時間
  brushingMethodLearned: boolean // 歯磨き方法を習ったか
  hasDenture: boolean // 義歯装着

  // 口腔状態
  currentToothCount: string
  missingTeeth: string
  oralHygieneStatus: string
  plaqueAttachment: string
  gingivalStatus: string

  // 歯列図データ（各歯の状態）
  teethStatus: { [toothNumber: number]: 'present' | 'missing' | 'caries' | 'filled' | 'watch' }

  // 歯周組織検査の概要
  periodontalPocketOver4mm: boolean // 4mm以上の歯周ポケット
  toothMobility: 'severe' | 'moderate' | 'mild' | 'normal' | '' // 歯の動揺
  gingivalSwelling: boolean // 歯肉の腫れ
  toothPain: boolean // 歯の痛み

  // 画像診断結果の概要
  boneResorption: 'severe' | 'moderate' | 'mild' | 'none' | '' // 歯の支持骨吸収

  // その他の留意点
  concernMastication: boolean // 咀嚼機能
  concernSwallowing: boolean // 摂食・嚥下機能
  concernArticulation: boolean // 構音機能

  // 継続用（管理報告書用）- 現在のお口の中の状況
  currentPain: 'yes' | 'sometimes' | 'no' | '' // 痛み
  currentBleeding: 'yes' | 'sometimes' | 'no' | '' // 出血
  currentSwelling: 'yes' | 'sometimes' | 'no' | '' // 腫れ
  currentEating: 'difficult' | 'unchanged' | 'easier' | '' // 食べやすさ
  improvementStatus: string // 改善状況

  // 管理計画（管理計画書用）
  diagnosis: string
  treatmentPlan: string
  managementGoals: string
  guidanceProvided: string
  nextVisitDate: string

  // 管理報告（管理報告書用）
  progressSummary: string
  treatmentPerformed: string
  currentStatus: string
  futureRecommendations: string

  // その他
  remarks: string
  dentistName: string
}

const initialFormData: FormData = {
  documentSubtype: '管理計画書',
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  address: '',
  phone: '',
  hasDiabetes: false,
  hasHypertension: false,
  hasRespiratoryDisease: false,
  hasCardiovascularDisease: false,
  isPregnant: false,
  hasOtherDisease: false,
  otherDiseaseDetail: '',
  medications: '',
  brushingFrequency: '',
  brushingTimingBreakfast: false,
  brushingTimingLunch: false,
  brushingTimingDinner: false,
  brushingTimingBedtime: false,
  habitualBeverage: '',
  snackPattern: '',
  oralHygieneTools: [],
  smokingStatus: '',
  sleepDuration: '',
  brushingMethodLearned: false,
  hasDenture: false,
  currentToothCount: '',
  missingTeeth: '',
  oralHygieneStatus: '',
  plaqueAttachment: '',
  gingivalStatus: '',
  teethStatus: {},
  periodontalPocketOver4mm: false,
  toothMobility: '',
  gingivalSwelling: false,
  toothPain: false,
  boneResorption: '',
  concernMastication: false,
  concernSwallowing: false,
  concernArticulation: false,
  currentPain: '',
  currentBleeding: '',
  currentSwelling: '',
  currentEating: '',
  improvementStatus: '',
  diagnosis: '',
  treatmentPlan: '',
  managementGoals: '',
  guidanceProvided: '',
  nextVisitDate: '',
  progressSummary: '',
  treatmentPerformed: '',
  currentStatus: '',
  futureRecommendations: '',
  remarks: '',
  dentistName: ''
}

export function DentalDiseaseManagementForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: DentalDiseaseManagementFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPatientData()
  }, [patientId])

  useEffect(() => {
    if (document) {
      loadDocumentData()
    }
  }, [document])

  const loadPatientData = async () => {
    try {
      setLoading(true)

      // 患者基本情報を取得
      const response = await fetch(`/api/patients/${patientId}`)
      if (!response.ok) throw new Error('患者情報の取得に失敗しました')
      const patient = await response.json()

      // 問診票データを取得
      const questionnaireResponse = await fetch(`/api/questionnaires/responses?patientId=${patientId}`)
      const questionnaireData = questionnaireResponse.ok ? await questionnaireResponse.json() : null

      // 視診データを取得
      const visualExamResponse = await fetch(`/api/visual-exams?patientId=${patientId}`)
      const visualExamData = visualExamResponse.ok ? await visualExamResponse.json() : null

      const autoFields = new Set<string>()

      // 基本情報の自動入力
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

        // 年齢計算
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

      // 問診票データの自動入力
      if (questionnaireData && questionnaireData.length > 0) {
        const latestQuestionnaire = questionnaireData[0]
        const responses = latestQuestionnaire.responses || {}

        // 既往歴・現病歴をチェックボックスに変換
        if (responses.medical_history) {
          const medicalHistory = Array.isArray(responses.medical_history)
            ? responses.medical_history
            : String(responses.medical_history).split('、')

          medicalHistory.forEach((condition: string) => {
            const normalizedCondition = condition.toLowerCase().trim()
            if (normalizedCondition.includes('糖尿病') || normalizedCondition.includes('diabetes')) {
              updates.hasDiabetes = true
              autoFields.add('hasDiabetes')
            }
            if (normalizedCondition.includes('高血圧') || normalizedCondition.includes('hypertension')) {
              updates.hasHypertension = true
              autoFields.add('hasHypertension')
            }
            if (normalizedCondition.includes('呼吸器') || normalizedCondition.includes('喘息') || normalizedCondition.includes('respiratory')) {
              updates.hasRespiratoryDisease = true
              autoFields.add('hasRespiratoryDisease')
            }
            if (normalizedCondition.includes('心') || normalizedCondition.includes('cardiovascular') || normalizedCondition.includes('cardiac')) {
              updates.hasCardiovascularDisease = true
              autoFields.add('hasCardiovascularDisease')
            }
            if (normalizedCondition.includes('妊娠') || normalizedCondition.includes('pregnant')) {
              updates.isPregnant = true
              autoFields.add('isPregnant')
            }
          })

          // その他の病歴がある場合
          const specificConditions = ['糖尿病', 'diabetes', '高血圧', 'hypertension', '呼吸器', '喘息', 'respiratory', '心', 'cardiovascular', 'cardiac', '妊娠', 'pregnant']
          const otherConditions = medicalHistory.filter((condition: string) => {
            return !specificConditions.some(specific => condition.toLowerCase().includes(specific.toLowerCase()))
          })

          if (otherConditions.length > 0) {
            updates.hasOtherDisease = true
            updates.otherDiseaseDetail = otherConditions.join('、')
            autoFields.add('hasOtherDisease')
            autoFields.add('otherDiseaseDetail')
          }
        }

        // 服用薬
        if (responses.medications) {
          updates.medications = String(responses.medications)
          autoFields.add('medications')
        }

        // 喫煙状況
        if (responses.smoking_status) {
          updates.smokingStatus = String(responses.smoking_status)
          autoFields.add('smokingStatus')
        }

        // 習慣的飲料物
        if (responses['習慣的飲料物（複数選択可）']) {
          const beverages = Array.isArray(responses['習慣的飲料物（複数選択可）'])
            ? responses['習慣的飲料物（複数選択可）']
            : String(responses['習慣的飲料物（複数選択可）']).split('、')
          updates.habitualBeverage = beverages.join('、')
          autoFields.add('habitualBeverage')
        }

        // 間食の取り方
        if (responses['間食の取り方']) {
          updates.snackPattern = String(responses['間食の取り方'])
          autoFields.add('snackPattern')
        }

        // 1日の歯磨き回数
        if (responses['1日の歯磨き回数']) {
          updates.brushingFrequency = `${responses['1日の歯磨き回数']}回`
          autoFields.add('brushingFrequency')
        }

        // 歯磨きの時間（複数選択可）
        if (responses['歯磨きの時間（複数選択可）']) {
          const timings = Array.isArray(responses['歯磨きの時間（複数選択可）'])
            ? responses['歯磨きの時間（複数選択可）']
            : String(responses['歯磨きの時間（複数選択可）']).split('、')

          if (timings.includes('朝食後')) {
            updates.brushingTimingBreakfast = true
            autoFields.add('brushingTimingBreakfast')
          }
          if (timings.includes('昼食後')) {
            updates.brushingTimingLunch = true
            autoFields.add('brushingTimingLunch')
          }
          if (timings.includes('夕食後')) {
            updates.brushingTimingDinner = true
            autoFields.add('brushingTimingDinner')
          }
          if (timings.includes('就寝前')) {
            updates.brushingTimingBedtime = true
            autoFields.add('brushingTimingBedtime')
          }
        }

        // 歯口清掃器具の使用（複数選択可）
        if (responses['歯口清掃器具の使用（複数選択可）']) {
          const tools = Array.isArray(responses['歯口清掃器具の使用（複数選択可）'])
            ? responses['歯口清掃器具の使用（複数選択可）']
            : String(responses['歯口清掃器具の使用（複数選択可）']).split('、')

          const toolMap: { [key: string]: string } = {
            '歯ブラシ': '歯ブラシ',
            'フロス': 'デンタルフロス',
            '歯間ブラシ': '歯間ブラシ'
          }

          updates.oralHygieneTools = tools.map(t => toolMap[t] || t).filter(t => t !== 'なし')
          autoFields.add('oralHygieneTools')
        }

        // 歯磨き方法
        if (responses['歯磨き方法']) {
          updates.brushingMethodLearned = responses['歯磨き方法'] === '習ったことがある'
          autoFields.add('brushingMethodLearned')
        }

        // 睡眠時間
        if (responses['睡眠時間']) {
          const sleepMap: { [key: string]: 'insufficient' | 'somewhat-insufficient' | 'sufficient' } = {
            '十分': 'sufficient',
            'やや不足': 'somewhat-insufficient',
            '不足': 'insufficient'
          }
          updates.sleepDuration = sleepMap[String(responses['睡眠時間'])] || ''
          autoFields.add('sleepDuration')
        }
      }

      // 視診データの自動入力
      if (visualExamData && visualExamData.length > 0) {
        const latestVisualExam = visualExamData[0]

        if (latestVisualExam.present_teeth_count) {
          updates.currentToothCount = `${latestVisualExam.present_teeth_count}本`
          autoFields.add('currentToothCount')
        }

        if (latestVisualExam.missing_teeth_count) {
          updates.missingTeeth = `${latestVisualExam.missing_teeth_count}本`
          autoFields.add('missingTeeth')
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

  const loadDocumentData = () => {
    if (!document) return

    const content = document.content as Partial<FormData>
    setFormData(prev => ({
      ...prev,
      ...content,
      documentSubtype: document.document_subtype as '管理計画書' | '管理報告書' || '管理計画書'
    }))

    // 既存文書の場合は自動入力フィールドをクリア（全て編集済みとする）
    setAutoPopulatedFields(new Set())
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const handleOralHygieneToolsChange = (tool: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      oralHygieneTools: checked
        ? [...prev.oralHygieneTools, tool]
        : prev.oralHygieneTools.filter(t => t !== tool)
    }))
  }

  const handleToothClick = (toothNumber: number) => {
    setFormData(prev => {
      const currentStatus = prev.teethStatus[toothNumber]
      const statusCycle: Array<'present' | 'missing' | 'caries' | 'filled' | 'watch' | undefined> = [
        undefined, 'present', 'missing', 'caries', 'filled', 'watch'
      ]
      const currentIndex = statusCycle.indexOf(currentStatus)
      const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

      const newTeethStatus = { ...prev.teethStatus }
      if (nextStatus === undefined) {
        delete newTeethStatus[toothNumber]
      } else {
        newTeethStatus[toothNumber] = nextStatus
      }

      return { ...prev, teethStatus: newTeethStatus }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const title = `歯科疾患管理料 ${formData.documentSubtype} - ${formData.patientName || '患者名未設定'}`

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '歯科疾患管理料' as const,
        document_subtype: formData.documentSubtype,
        title,
        content: formData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: formData,
          document_subtype: formData.documentSubtype
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
      console.error('HTMLコピーエラー:', error)
      alert('コピーに失敗しました')
    }
  }

  const handleCopyPlainText = async () => {
    try {
      await navigator.clipboard.writeText(generatePlainText())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('テキストコピーエラー:', error)
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
        <title>歯科疾患管理料 ${formData.documentSubtype}</title>
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
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
            font-size: 6.5pt;
            border: 2px solid #495057;
          }
          th, td {
            border: 1px solid #adb5bd;
            padding: 2px 4px;
            text-align: left;
          }
          th {
            background-color: #e9ecef;
            font-weight: bold;
            border-bottom: 2px solid #495057;
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

  const getToothSymbol = (status: 'present' | 'missing' | 'caries' | 'filled' | 'watch' | undefined): string => {
    switch (status) {
      case 'present': return '○'
      case 'missing': return '×'
      case 'caries': return 'C'
      case 'filled': return '●'
      case 'watch': return '△'
      default: return ''
    }
  }

  const generateTeethChartHTML = (): string => {
    const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]
    const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]

    return `
      <div style="margin: 10px 0; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px;">
        <h3 style="font-size: 9pt; margin: 0 0 8px 0;">歯列図</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 7pt;">
          <div style="display: flex; justify-content: center; gap: 2px;">
            ${upperTeeth.map(num => `
              <div style="width: 20px; height: 30px; border: 1px solid #adb5bd; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: ${formData.teethStatus[num] ? '#f8f9fa' : '#fff'};">
                <div style="font-size: 6pt; color: #666;">${num}</div>
                <div style="font-size: 10pt; font-weight: bold;">${getToothSymbol(formData.teethStatus[num])}</div>
              </div>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: center; gap: 2px;">
            ${lowerTeeth.map(num => `
              <div style="width: 20px; height: 30px; border: 1px solid #adb5bd; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: ${formData.teethStatus[num] ? '#f8f9fa' : '#fff'};">
                <div style="font-size: 10pt; font-weight: bold;">${getToothSymbol(formData.teethStatus[num])}</div>
                <div style="font-size: 6pt; color: #666;">${num}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 6.5pt; color: #666;">
          <span style="margin-right: 8px;">○:健全</span>
          <span style="margin-right: 8px;">×:欠損</span>
          <span style="margin-right: 8px;">C:う蝕</span>
          <span style="margin-right: 8px;">●:処置済</span>
          <span>△:要注意</span>
        </div>
      </div>
    `
  }

  const generateHTMLContent = () => {
    return `
      <h1>歯科疾患管理料 ${formData.documentSubtype}</h1>

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
        <h2>既往歴・現病歴</h2>
      <div class="field">
        <span class="label">該当項目:</span>
        <span class="value">
          ${formData.hasDiabetes ? '☑ 糖尿病' : '☐ 糖尿病'}
          ${formData.hasHypertension ? '☑ 高血圧症' : '☐ 高血圧症'}
          ${formData.hasRespiratoryDisease ? '☑ 呼吸器疾患' : '☐ 呼吸器疾患'}
          ${formData.hasCardiovascularDisease ? '☑ 心血管疾患' : '☐ 心血管疾患'}
          ${formData.isPregnant ? '☑ 妊娠' : '☐ 妊娠'}
          ${formData.hasOtherDisease ? '☑ その他' : '☐ その他'}
        </span>
      </div>
      ${formData.hasOtherDisease && formData.otherDiseaseDetail ? `<div class="field"><span class="label">その他の詳細:</span><span class="value">${formData.otherDiseaseDetail}</span></div>` : ''}
      <div class="field"><span class="label">服用薬:</span><span class="value">${formData.medications}</span></div>
      </div>

      <div class="section">
        <h2>生活習慣の状況</h2>
        <div style="display: flex; gap: 20px; align-items: flex-start;">
          <div style="flex: 1; min-width: 0;">
            <div class="field"><span class="label">1日の歯磨き回数:</span><span class="value">${formData.brushingFrequency}</span></div>
            <div class="field">
              <span class="label">歯磨きの時間:</span>
              <span class="value">
                ${formData.brushingTimingBreakfast ? '☑ 朝食後' : '☐ 朝食後'}
                ${formData.brushingTimingLunch ? '☑ 昼食後' : '☐ 昼食後'}
                ${formData.brushingTimingDinner ? '☑ 夕食後' : '☐ 夕食後'}
                ${formData.brushingTimingBedtime ? '☑ 就寝前' : '☐ 就寝前'}
              </span>
            </div>
            <div class="field"><span class="label">習慣的飲料物:</span><span class="value">${formData.habitualBeverage}</span></div>
            <div class="field"><span class="label">間食の取り方:</span><span class="value">${formData.snackPattern}</span></div>
            <div class="field"><span class="label">歯口清掃器具:</span><span class="value">${formData.oralHygieneTools.join('、')}</span></div>
            <div class="field"><span class="label">喫煙状況:</span><span class="value">${formData.smokingStatus}</span></div>
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="field">
              <span class="label">睡眠時間:</span>
              <span class="value">
                ${formData.sleepDuration === 'insufficient' ? '☑ 不足' : '☐ 不足'}
                ${formData.sleepDuration === 'somewhat-insufficient' ? '☑ やや不足' : '☐ やや不足'}
                ${formData.sleepDuration === 'sufficient' ? '☑ 十分' : '☐ 十分'}
              </span>
            </div>
            <div class="field">
              <span class="label">歯磨き方法:</span>
              <span class="value">
                ${formData.brushingMethodLearned === false ? '☑ 習ったことがない' : '☐ 習ったことがない'}
                ${formData.brushingMethodLearned === true ? '☑ 習ったことがある' : '☐ 習ったことがある'}
              </span>
            </div>
            <div class="field">
              <span class="label">義歯装着:</span>
              <span class="value">
                ${formData.hasDenture ? '☑ 有' : '☐ 有'}
                ${!formData.hasDenture ? '☑ 無' : '☐ 無'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>口腔状態</h2>
        <div style="display: flex; gap: 20px; align-items: flex-start;">
          <div style="flex: 1; min-width: 0;">
            ${generateTeethChartHTML()}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div class="field"><span class="label">現在歯数:</span><span class="value">${formData.currentToothCount}</span></div>
            <div class="field"><span class="label">口腔衛生状態:</span><span class="value">${formData.oralHygieneStatus}</span></div>
            <div class="field"><span class="label">プラーク付着状況:</span><span class="value">${formData.plaqueAttachment}</span></div>
            <div class="field"><span class="label">歯肉の状態:</span><span class="value">${formData.gingivalStatus}</span></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 20px; align-items: flex-start;">
        <div style="flex: 1; min-width: 0;">
          <div class="section">
            <h2>歯周組織検査の概要</h2>
            <div class="field"><span class="label">4mm以上の歯周ポケット:</span><span class="value">${formData.periodontalPocketOver4mm ? '☑ 有' : '☐ 有'}</span></div>
            <div class="field">
              <span class="label">歯の動揺:</span>
              <span class="value">
                ${formData.toothMobility === 'severe' ? '☑ 重度' : '☐ 重度'}
                ${formData.toothMobility === 'moderate' ? '☑ 中等度' : '☐ 中等度'}
                ${formData.toothMobility === 'mild' ? '☑ 軽度' : '☐ 軽度'}
                ${formData.toothMobility === 'normal' ? '☑ 正常' : '☐ 正常'}
              </span>
            </div>
            <div class="field"><span class="label">歯肉の腫れ:</span><span class="value">${formData.gingivalSwelling ? '☑ 有' : '☐ 有'}</span></div>
            <div class="field"><span class="label">歯の痛み:</span><span class="value">${formData.toothPain ? '☑ 有' : '☐ 有'}</span></div>
          </div>
        </div>

        <div style="flex: 1; min-width: 0;">
          <div class="section">
            <h2>画像診断結果の概要</h2>
            <div class="field">
              <span class="label">歯の支持骨吸収:</span>
              <span class="value">
                ${formData.boneResorption === 'severe' ? '☑ 高度' : '☐ 高度'}
                ${formData.boneResorption === 'moderate' ? '☑ 中等度' : '☐ 中等度'}
                ${formData.boneResorption === 'mild' ? '☑ 軽度' : '☐ 軽度'}
                ${formData.boneResorption === 'none' ? '☑ 無' : '☐ 無'}
              </span>
            </div>
          </div>

          <div class="section">
            <h2>その他の留意点</h2>
            <div class="field">
              <span class="label">該当項目:</span>
              <span class="value">
                ${formData.concernMastication ? '☑ 咀嚼機能' : '☐ 咀嚼機能'}
                ${formData.concernSwallowing ? '☑ 摂食・嚥下機能' : '☐ 摂食・嚥下機能'}
                ${formData.concernArticulation ? '☑ 構音機能' : '☐ 構音機能'}
              </span>
            </div>
          </div>
        </div>
      </div>

      ${formData.documentSubtype === '管理計画書' ? `
        <div class="section">
          <h2>管理計画</h2>
        <div class="field"><span class="label">診断:</span><span class="value">${formData.diagnosis}</span></div>
        <div class="field"><span class="label">治療計画:</span><span class="value">${formData.treatmentPlan}</span></div>
        <div class="field"><span class="label">管理目標:</span><span class="value">${formData.managementGoals}</span></div>
        <div class="field"><span class="label">指導内容:</span><span class="value">${formData.guidanceProvided}</span></div>
        <div class="field"><span class="label">次回来院予定:</span><span class="value">${formData.nextVisitDate ? format(new Date(formData.nextVisitDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
        </div>
      ` : `
        <div class="section">
          <h2>現在のお口の中の状況</h2>
        <div class="field">
          <span class="label">痛み:</span>
          <span class="value">
            ${formData.currentPain === 'yes' ? '☑ ある' : '☐ ある'}
            ${formData.currentPain === 'sometimes' ? '☑ 時々ある' : '☐ 時々ある'}
            ${formData.currentPain === 'no' ? '☑ ない' : '☐ ない'}
          </span>
        </div>
        <div class="field">
          <span class="label">出血:</span>
          <span class="value">
            ${formData.currentBleeding === 'yes' ? '☑ ある' : '☐ ある'}
            ${formData.currentBleeding === 'sometimes' ? '☑ 時々ある' : '☐ 時々ある'}
            ${formData.currentBleeding === 'no' ? '☑ ない' : '☐ ない'}
          </span>
        </div>
        <div class="field">
          <span class="label">腫れ:</span>
          <span class="value">
            ${formData.currentSwelling === 'yes' ? '☑ ある' : '☐ ある'}
            ${formData.currentSwelling === 'sometimes' ? '☑ 時々ある' : '☐ 時々ある'}
            ${formData.currentSwelling === 'no' ? '☑ ない' : '☐ ない'}
          </span>
        </div>
        <div class="field">
          <span class="label">食べやすさ:</span>
          <span class="value">
            ${formData.currentEating === 'difficult' ? '☑ 食べにくい' : '☐ 食べにくい'}
            ${formData.currentEating === 'unchanged' ? '☑ 変わらない' : '☐ 変わらない'}
            ${formData.currentEating === 'easier' ? '☑ 食べやすくなった' : '☐ 食べやすくなった'}
          </span>
        </div>
        <div class="field"><span class="label">改善状況:</span><span class="value">${formData.improvementStatus}</span></div>
        </div>

        <div class="section">
          <h2>管理報告</h2>
          <div class="field"><span class="label">経過要約:</span><span class="value">${formData.progressSummary}</span></div>
          <div class="field"><span class="label">実施した治療:</span><span class="value">${formData.treatmentPerformed}</span></div>
          <div class="field"><span class="label">現在の状態:</span><span class="value">${formData.currentStatus}</span></div>
          <div class="field"><span class="label">今後の推奨事項:</span><span class="value">${formData.futureRecommendations}</span></div>
        </div>
      `}
    `
  }

  const generatePlainText = () => {
    let text = `歯科疾患管理料 ${formData.documentSubtype}\n\n`
    text += `【基本情報】\n`
    text += `文書作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `患者番号: ${formData.patientNumber}\n`
    text += `患者氏名: ${formData.patientName}\n`
    text += `フリガナ: ${formData.patientNameKana}\n`
    text += `性別: ${formData.gender}\n`
    text += `生年月日: ${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `年齢: ${formData.age}\n`
    text += `住所: ${formData.address}\n\n`

    text += `既往歴・現病歴\n`
    const medicalHistoryItems = []
    if (formData.hasDiabetes) medicalHistoryItems.push('糖尿病')
    if (formData.hasHypertension) medicalHistoryItems.push('高血圧症')
    if (formData.hasRespiratoryDisease) medicalHistoryItems.push('呼吸器疾患')
    if (formData.hasCardiovascularDisease) medicalHistoryItems.push('心血管疾患')
    if (formData.isPregnant) medicalHistoryItems.push('妊娠')
    if (formData.hasOtherDisease) medicalHistoryItems.push(`その他（${formData.otherDiseaseDetail}）`)
    text += `該当項目: ${medicalHistoryItems.join('、') || 'なし'}\n`
    text += `服用薬: ${formData.medications}\n\n`

    text += `【生活習慣の状況】\n`
    text += `1日の歯磨き回数: ${formData.brushingFrequency}\n`
    const brushingTimings = []
    if (formData.brushingTimingBreakfast) brushingTimings.push('朝食後')
    if (formData.brushingTimingLunch) brushingTimings.push('昼食後')
    if (formData.brushingTimingDinner) brushingTimings.push('夕食後')
    if (formData.brushingTimingBedtime) brushingTimings.push('就寝前')
    text += `歯磨きの時間: ${brushingTimings.join('、') || 'なし'}\n`
    text += `習慣的飲料物: ${formData.habitualBeverage}\n`
    text += `間食の取り方: ${formData.snackPattern}\n`
    text += `歯口清掃器具: ${formData.oralHygieneTools.join('、') || 'なし'}\n`
    text += `喫煙状況: ${formData.smokingStatus}\n`
    const sleepDurationMap = { 'insufficient': '不足', 'somewhat-insufficient': 'やや不足', 'sufficient': '十分' }
    text += `睡眠時間: ${formData.sleepDuration ? sleepDurationMap[formData.sleepDuration] : ''}\n`
    text += `歯磨き方法: ${formData.brushingMethodLearned ? '習ったことがある' : '習ったことがない'}\n`
    text += `義歯装着: ${formData.hasDenture ? '有' : '無'}\n\n`

    text += `【口腔状態】\n`
    text += `現在歯数: ${formData.currentToothCount}\n`
    text += `欠損歯数: ${formData.missingTeeth}\n`
    text += `口腔衛生状態: ${formData.oralHygieneStatus}\n`
    text += `プラーク付着状況: ${formData.plaqueAttachment}\n`
    text += `歯肉の状態: ${formData.gingivalStatus}\n\n`

    text += `歯周組織検査の概要\n`
    text += `4mm以上の歯周ポケット: ${formData.periodontalPocketOver4mm ? '有' : '無'}\n`
    const mobilityMap = { 'severe': '重度', 'moderate': '中等度', 'mild': '軽度', 'normal': '正常' }
    text += `歯の動揺: ${formData.toothMobility ? mobilityMap[formData.toothMobility] : ''}\n`
    text += `歯肉の腫れ: ${formData.gingivalSwelling ? '有' : '無'}\n`
    text += `歯の痛み: ${formData.toothPain ? '有' : '無'}\n\n`

    text += `【画像診断結果の概要】\n`
    const resorptionMap = { 'severe': '高度', 'moderate': '中等度', 'mild': '軽度', 'none': '無' }
    text += `歯の支持骨吸収: ${formData.boneResorption ? resorptionMap[formData.boneResorption] : ''}\n\n`

    text += `【その他の留意点】\n`
    const concerns = []
    if (formData.concernMastication) concerns.push('咀嚼機能')
    if (formData.concernSwallowing) concerns.push('摂食・嚥下機能')
    if (formData.concernArticulation) concerns.push('構音機能')
    text += `該当項目: ${concerns.join('、') || 'なし'}\n\n`

    if (formData.documentSubtype === '管理計画書') {
      text += `【管理計画】\n`
      text += `診断: ${formData.diagnosis}\n`
      text += `治療計画: ${formData.treatmentPlan}\n`
      text += `管理目標: ${formData.managementGoals}\n`
      text += `指導内容: ${formData.guidanceProvided}\n`
      text += `次回来院予定: ${formData.nextVisitDate ? format(new Date(formData.nextVisitDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n\n`
    } else {
      text += `【現在のお口の中の状況】\n`
      const painMap = { 'yes': 'ある', 'sometimes': '時々ある', 'no': 'ない' }
      const eatingMap = { 'difficult': '食べにくい', 'unchanged': '変わらない', 'easier': '食べやすくなった' }
      text += `痛み: ${formData.currentPain ? painMap[formData.currentPain] : ''}\n`
      text += `出血: ${formData.currentBleeding ? painMap[formData.currentBleeding] : ''}\n`
      text += `腫れ: ${formData.currentSwelling ? painMap[formData.currentSwelling] : ''}\n`
      text += `食べやすさ: ${formData.currentEating ? eatingMap[formData.currentEating] : ''}\n`
      text += `改善状況: ${formData.improvementStatus}\n\n`

      text += `【管理報告】\n`
      text += `経過要約: ${formData.progressSummary}\n`
      text += `実施した治療: ${formData.treatmentPerformed}\n`
      text += `現在の状態: ${formData.currentStatus}\n`
      text += `今後の推奨事項: ${formData.futureRecommendations}\n\n`
    }

    text += `【その他】\n`
    text += `備考: ${formData.remarks}\n`
    text += `担当歯科医師: ${formData.dentistName}\n`

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
      {/* ヘッダー */}
      <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">歯科疾患管理料</h3>
            <p className="text-sm text-gray-600">
              {document ? '文書を編集中' : '新規文書を作成中'}
            </p>
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

      {/* 凡例 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">黄色の背景は自動入力された項目です</p>
          <p className="text-xs mt-1">全ての項目は編集可能です</p>
        </div>
      </div>

      {/* フォーム */}
      <div className="grid grid-cols-2 gap-6">
        {/* 左カラム */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">文書種別</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>文書サブタイプ</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.documentSubtype === '管理計画書'}
                      onChange={() => handleChange('documentSubtype', '管理計画書')}
                      className="w-4 h-4"
                    />
                    <span>管理計画書（初回）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.documentSubtype === '管理報告書'}
                      onChange={() => handleChange('documentSubtype', '管理報告書')}
                      className="w-4 h-4"
                    />
                    <span>管理報告書（継続）</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentDate">文書作成日</Label>
                <Input
                  id="documentDate"
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => handleChange('documentDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientNumber">患者番号</Label>
                <Input
                  id="patientNumber"
                  value={formData.patientNumber}
                  onChange={(e) => handleChange('patientNumber', e.target.value)}
                  className={isAutoPopulated('patientNumber') ? 'bg-yellow-50' : ''}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientName">患者氏名</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                    className={isAutoPopulated('patientName') ? 'bg-yellow-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">性別</Label>
                  <Input
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className={isAutoPopulated('gender') ? 'bg-yellow-50' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">生年月日</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange('birthDate', e.target.value)}
                    className={isAutoPopulated('birthDate') ? 'bg-yellow-50' : ''}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">年齢</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className={isAutoPopulated('age') ? 'bg-yellow-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={isAutoPopulated('address') ? 'bg-yellow-50' : ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">既往歴・現病歴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>該当する項目にチェックを入れてください</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasDiabetes}
                      onChange={(e) => handleCheckboxChange('hasDiabetes', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('hasDiabetes') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>糖尿病</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasHypertension}
                      onChange={(e) => handleCheckboxChange('hasHypertension', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('hasHypertension') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>高血圧症</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasRespiratoryDisease}
                      onChange={(e) => handleCheckboxChange('hasRespiratoryDisease', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('hasRespiratoryDisease') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>呼吸器疾患</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasCardiovascularDisease}
                      onChange={(e) => handleCheckboxChange('hasCardiovascularDisease', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('hasCardiovascularDisease') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>心血管疾患</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPregnant}
                      onChange={(e) => handleCheckboxChange('isPregnant', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('isPregnant') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>妊娠</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasOtherDisease}
                      onChange={(e) => handleCheckboxChange('hasOtherDisease', e.target.checked)}
                      className={`w-4 h-4 ${isAutoPopulated('hasOtherDisease') ? 'bg-yellow-50' : ''}`}
                    />
                    <span>その他</span>
                  </label>
                </div>
              </div>

              {formData.hasOtherDisease && (
                <div className="space-y-2">
                  <Label htmlFor="otherDiseaseDetail">その他の詳細</Label>
                  <Input
                    id="otherDiseaseDetail"
                    value={formData.otherDiseaseDetail}
                    onChange={(e) => handleChange('otherDiseaseDetail', e.target.value)}
                    className={isAutoPopulated('otherDiseaseDetail') ? 'bg-yellow-50' : ''}
                    placeholder="その他の病歴を記入してください"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="medications">服用薬</Label>
                <Textarea
                  id="medications"
                  value={formData.medications}
                  onChange={(e) => handleChange('medications', e.target.value)}
                  className={isAutoPopulated('medications') ? 'bg-yellow-50' : ''}
                  rows={2}
                  placeholder="現在服用している薬を記入してください"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">生活習慣の状況</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brushingFrequency">1日の歯磨き回数</Label>
                <Input
                  id="brushingFrequency"
                  value={formData.brushingFrequency}
                  onChange={(e) => handleChange('brushingFrequency', e.target.value)}
                  placeholder="例: 2回、3回"
                />
              </div>

              <div className="space-y-3">
                <Label>歯磨きの時間（複数選択可）</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.brushingTimingBreakfast}
                      onChange={(e) => handleCheckboxChange('brushingTimingBreakfast', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>朝食後</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.brushingTimingLunch}
                      onChange={(e) => handleCheckboxChange('brushingTimingLunch', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>昼食後</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.brushingTimingDinner}
                      onChange={(e) => handleCheckboxChange('brushingTimingDinner', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>夕食後</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.brushingTimingBedtime}
                      onChange={(e) => handleCheckboxChange('brushingTimingBedtime', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>就寝前</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="habitualBeverage">習慣的飲料物</Label>
                <Input
                  id="habitualBeverage"
                  value={formData.habitualBeverage}
                  onChange={(e) => handleChange('habitualBeverage', e.target.value)}
                  placeholder="例: コーヒー、緑茶、炭酸飲料"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="snackPattern">間食の取り方</Label>
                <select
                  id="snackPattern"
                  value={formData.snackPattern}
                  onChange={(e) => handleChange('snackPattern', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">選択してください</option>
                  <option value="しない">しない</option>
                  <option value="規則正しい">規則正しい（時間を決めている）</option>
                  <option value="不規則">不規則（時間を決めていない）</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>歯口清掃器具（複数選択可）</Label>
                <div className="grid grid-cols-2 gap-3">
                  {['歯ブラシ', 'デンタルフロス', '歯間ブラシ', 'タフトブラシ', '舌ブラシ', '電動歯ブラシ'].map(tool => (
                    <label key={tool} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.oralHygieneTools.includes(tool)}
                        onChange={(e) => handleOralHygieneToolsChange(tool, e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span>{tool}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smokingStatus">喫煙状況</Label>
                <select
                  id="smokingStatus"
                  value={formData.smokingStatus}
                  onChange={(e) => handleChange('smokingStatus', e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isAutoPopulated('smokingStatus') ? 'bg-yellow-50' : ''}`}
                >
                  <option value="">選択してください</option>
                  <option value="吸わない">吸わない</option>
                  <option value="以前吸っていた">以前吸っていた</option>
                  <option value="吸う（1日10本未満）">吸う（1日10本未満）</option>
                  <option value="吸う（1日10〜20本）">吸う（1日10〜20本）</option>
                  <option value="吸う（1日20本以上）">吸う（1日20本以上）</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label>睡眠時間</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.sleepDuration === 'insufficient'}
                      onChange={() => handleChange('sleepDuration', 'insufficient')}
                      className="w-4 h-4"
                    />
                    <span>不足</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.sleepDuration === 'somewhat-insufficient'}
                      onChange={() => handleChange('sleepDuration', 'somewhat-insufficient')}
                      className="w-4 h-4"
                    />
                    <span>やや不足</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.sleepDuration === 'sufficient'}
                      onChange={() => handleChange('sleepDuration', 'sufficient')}
                      className="w-4 h-4"
                    />
                    <span>十分</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>歯磨き方法</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.brushingMethodLearned === false}
                      onChange={() => handleCheckboxChange('brushingMethodLearned', false)}
                      className="w-4 h-4"
                    />
                    <span>習ったことがない</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.brushingMethodLearned === true}
                      onChange={() => handleCheckboxChange('brushingMethodLearned', true)}
                      className="w-4 h-4"
                    />
                    <span>習ったことがある</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>義歯装着</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hasDenture === true}
                      onChange={() => handleCheckboxChange('hasDenture', true)}
                      className="w-4 h-4"
                    />
                    <span>有</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.hasDenture === false}
                      onChange={() => handleCheckboxChange('hasDenture', false)}
                      className="w-4 h-4"
                    />
                    <span>無</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">口腔状態</CardTitle>
            </CardHeader>
            <CardContent style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* 左側: 歯列図 */}
                <div style={{ flex: '1 1 50%', minWidth: '0' }}>
                  <Label>歯列図（クリックして状態を変更）</Label>
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    {/* 上顎 */}
                    <div className="flex justify-center gap-0.5 mb-2">
                      {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(toothNum => {
                        const status = formData.teethStatus[toothNum]
                        const symbol = getToothSymbol(status)
                        const bgColor = status ? 'bg-white' : 'bg-gray-100'
                        return (
                          <button
                            key={toothNum}
                            type="button"
                            onClick={() => handleToothClick(toothNum)}
                            className={`w-8 h-12 border border-gray-300 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${bgColor}`}
                          >
                            <span className="text-xs text-gray-500">{toothNum}</span>
                            <span className="text-base font-bold">{symbol}</span>
                          </button>
                        )
                      })}
                    </div>
                    {/* 下顎 */}
                    <div className="flex justify-center gap-0.5">
                      {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(toothNum => {
                        const status = formData.teethStatus[toothNum]
                        const symbol = getToothSymbol(status)
                        const bgColor = status ? 'bg-white' : 'bg-gray-100'
                        return (
                          <button
                            key={toothNum}
                            type="button"
                            onClick={() => handleToothClick(toothNum)}
                            className={`w-8 h-12 border border-gray-300 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors ${bgColor}`}
                          >
                            <span className="text-base font-bold">{symbol}</span>
                            <span className="text-xs text-gray-500">{toothNum}</span>
                          </button>
                        )
                      })}
                    </div>
                    {/* 凡例 */}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-600">
                      <span>○: 健全歯</span>
                      <span>×: 欠損歯</span>
                      <span>C: う蝕歯</span>
                      <span>●: 処置済</span>
                      <span>△: 要注意歯</span>
                    </div>
                  </div>
                </div>

                {/* 右側: その他のフィールド */}
                <div style={{ flex: '1 1 50%', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="space-y-2">
                    <Label htmlFor="oralHygieneStatus">口腔衛生状態</Label>
                    <Textarea
                      id="oralHygieneStatus"
                      value={formData.oralHygieneStatus}
                      onChange={(e) => handleChange('oralHygieneStatus', e.target.value)}
                      rows={2}
                      placeholder="例: 良好、プラーク付着多量、食渣の残留あり など"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plaqueAttachment">プラーク付着状況</Label>
                    <Input
                      id="plaqueAttachment"
                      value={formData.plaqueAttachment}
                      onChange={(e) => handleChange('plaqueAttachment', e.target.value)}
                      placeholder="例: 多量、中等度、少量 など"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentToothCount">現在歯数</Label>
                    <Input
                      id="currentToothCount"
                      value={formData.currentToothCount}
                      onChange={(e) => handleChange('currentToothCount', e.target.value)}
                      className={isAutoPopulated('currentToothCount') ? 'bg-yellow-50' : ''}
                      placeholder="例: 28"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gingivalStatus">歯肉の状態</Label>
                    <Textarea
                      id="gingivalStatus"
                      value={formData.gingivalStatus}
                      onChange={(e) => handleChange('gingivalStatus', e.target.value)}
                      rows={2}
                      placeholder="例: 発赤・腫脹あり、出血傾向、健康 など"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">画像診断結果の概要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>歯の支持骨吸収</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.boneResorption === 'severe'}
                      onChange={() => handleChange('boneResorption', 'severe')}
                      className="w-4 h-4"
                    />
                    <span>高度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.boneResorption === 'moderate'}
                      onChange={() => handleChange('boneResorption', 'moderate')}
                      className="w-4 h-4"
                    />
                    <span>中等度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.boneResorption === 'mild'}
                      onChange={() => handleChange('boneResorption', 'mild')}
                      className="w-4 h-4"
                    />
                    <span>軽度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.boneResorption === 'none'}
                      onChange={() => handleChange('boneResorption', 'none')}
                      className="w-4 h-4"
                    />
                    <span>無</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">その他の留意点</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>該当する機能にチェックを入れてください</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.concernMastication}
                      onChange={(e) => handleCheckboxChange('concernMastication', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>咀嚼機能</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.concernSwallowing}
                      onChange={(e) => handleCheckboxChange('concernSwallowing', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>摂食・嚥下機能</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.concernArticulation}
                      onChange={(e) => handleCheckboxChange('concernArticulation', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>構音機能</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">歯周組織検査の概要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>4mm以上の歯周ポケット</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.periodontalPocketOver4mm}
                      onChange={(e) => handleCheckboxChange('periodontalPocketOver4mm', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>有</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>歯の動揺</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.toothMobility === 'severe'}
                      onChange={() => handleChange('toothMobility', 'severe')}
                      className="w-4 h-4"
                    />
                    <span>重度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.toothMobility === 'moderate'}
                      onChange={() => handleChange('toothMobility', 'moderate')}
                      className="w-4 h-4"
                    />
                    <span>中等度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.toothMobility === 'mild'}
                      onChange={() => handleChange('toothMobility', 'mild')}
                      className="w-4 h-4"
                    />
                    <span>軽度</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.toothMobility === 'normal'}
                      onChange={() => handleChange('toothMobility', 'normal')}
                      className="w-4 h-4"
                    />
                    <span>正常</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>歯肉の腫れ</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gingivalSwelling}
                      onChange={(e) => handleCheckboxChange('gingivalSwelling', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>有</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Label>歯の痛み</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.toothPain}
                      onChange={(e) => handleCheckboxChange('toothPain', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>有</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {formData.documentSubtype === '管理計画書' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">管理計画</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">診断</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e) => handleChange('diagnosis', e.target.value)}
                    rows={3}
                    placeholder="例: 慢性歯周炎（中等度）、う蝕症 など"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="treatmentPlan">治療計画</Label>
                  <Textarea
                    id="treatmentPlan"
                    value={formData.treatmentPlan}
                    onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                    rows={5}
                    placeholder="1. 歯周基本治療&#10;2. スケーリング・ルートプレーニング&#10;3. ブラッシング指導&#10;4. 定期メインテナンス"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="managementGoals">管理目標</Label>
                  <Textarea
                    id="managementGoals"
                    value={formData.managementGoals}
                    onChange={(e) => handleChange('managementGoals', e.target.value)}
                    rows={4}
                    placeholder="例:&#10;・プラークコントロールの向上（目標PCR 20%以下）&#10;・歯肉炎症の改善&#10;・歯周ポケットの減少"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guidanceProvided">指導内容</Label>
                  <Textarea
                    id="guidanceProvided"
                    value={formData.guidanceProvided}
                    onChange={(e) => handleChange('guidanceProvided', e.target.value)}
                    rows={4}
                    placeholder="例:&#10;・バス法によるブラッシング指導&#10;・デンタルフロスの使用方法&#10;・食生活指導（間食の制限）"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextVisitDate">次回来院予定</Label>
                  <Input
                    id="nextVisitDate"
                    type="date"
                    value={formData.nextVisitDate}
                    onChange={(e) => handleChange('nextVisitDate', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">現在のお口の中の状況</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>痛み</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentPain === 'yes'}
                          onChange={() => handleChange('currentPain', 'yes')}
                          className="w-4 h-4"
                        />
                        <span>ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentPain === 'sometimes'}
                          onChange={() => handleChange('currentPain', 'sometimes')}
                          className="w-4 h-4"
                        />
                        <span>時々ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentPain === 'no'}
                          onChange={() => handleChange('currentPain', 'no')}
                          className="w-4 h-4"
                        />
                        <span>ない</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>出血</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentBleeding === 'yes'}
                          onChange={() => handleChange('currentBleeding', 'yes')}
                          className="w-4 h-4"
                        />
                        <span>ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentBleeding === 'sometimes'}
                          onChange={() => handleChange('currentBleeding', 'sometimes')}
                          className="w-4 h-4"
                        />
                        <span>時々ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentBleeding === 'no'}
                          onChange={() => handleChange('currentBleeding', 'no')}
                          className="w-4 h-4"
                        />
                        <span>ない</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>腫れ</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentSwelling === 'yes'}
                          onChange={() => handleChange('currentSwelling', 'yes')}
                          className="w-4 h-4"
                        />
                        <span>ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentSwelling === 'sometimes'}
                          onChange={() => handleChange('currentSwelling', 'sometimes')}
                          className="w-4 h-4"
                        />
                        <span>時々ある</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentSwelling === 'no'}
                          onChange={() => handleChange('currentSwelling', 'no')}
                          className="w-4 h-4"
                        />
                        <span>ない</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>食べやすさ</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentEating === 'difficult'}
                          onChange={() => handleChange('currentEating', 'difficult')}
                          className="w-4 h-4"
                        />
                        <span>食べにくい</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentEating === 'unchanged'}
                          onChange={() => handleChange('currentEating', 'unchanged')}
                          className="w-4 h-4"
                        />
                        <span>変わらない</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.currentEating === 'easier'}
                          onChange={() => handleChange('currentEating', 'easier')}
                          className="w-4 h-4"
                        />
                        <span>食べやすくなった</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="improvementStatus">改善状況</Label>
                    <Textarea
                      id="improvementStatus"
                      value={formData.improvementStatus}
                      onChange={(e) => handleChange('improvementStatus', e.target.value)}
                      rows={3}
                      placeholder="例: プラーク付着量が減少。歯肉の発赤が改善傾向。"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">管理報告</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="progressSummary">経過要約</Label>
                    <Textarea
                      id="progressSummary"
                      value={formData.progressSummary}
                      onChange={(e) => handleChange('progressSummary', e.target.value)}
                      rows={4}
                      placeholder="例: 前回来院より○ヶ月経過。歯周基本治療を継続中。"
                    />
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="treatmentPerformed">実施した治療</Label>
                  <Textarea
                    id="treatmentPerformed"
                    value={formData.treatmentPerformed}
                    onChange={(e) => handleChange('treatmentPerformed', e.target.value)}
                    rows={5}
                    placeholder="例:&#10;・スケーリング実施&#10;・ブラッシング再指導&#10;・フッ素塗布"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentStatus">現在の状態</Label>
                  <Textarea
                    id="currentStatus"
                    value={formData.currentStatus}
                    onChange={(e) => handleChange('currentStatus', e.target.value)}
                    rows={4}
                    placeholder="例:&#10;・プラークスコア: 30% → 20%に改善&#10;・出血部位の減少&#10;・歯肉の発赤軽減"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="futureRecommendations">今後の推奨事項</Label>
                  <Textarea
                    id="futureRecommendations"
                    value={formData.futureRecommendations}
                    onChange={(e) => handleChange('futureRecommendations', e.target.value)}
                    rows={4}
                    placeholder="例:&#10;・3ヶ月ごとのメインテナンス継続&#10;・セルフケアの継続&#10;・定期検診の受診"
                  />
                </div>
              </CardContent>
            </Card>
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">その他</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="remarks">備考</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                  rows={3}
                  placeholder="その他、特記事項があれば記入してください"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dentistName">担当歯科医師</Label>
                <Input
                  id="dentistName"
                  value={formData.dentistName}
                  onChange={(e) => handleChange('dentistName', e.target.value)}
                  placeholder="例: 福永"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
