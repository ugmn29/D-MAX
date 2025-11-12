'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Save,
  Copy,
  Printer,
  X,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'

interface OralDevelopmentDisorderFormProps {
  patientId: string
  clinicId: string
  document?: MedicalDocument | null
  onSave: () => void
  onCancel: () => void
}

interface FormData {
  // 基本情報
  documentDate: string
  patientNumber: string
  patientName: string
  patientNameKana: string
  gender: string
  birthDate: string
  age: string
  ageMonths: string // 月齢（乳幼児の場合）
  address: string
  phone: string
  guardianName: string
  diagnosisDate: string

  // 年齢区分（評価基準の切り替え用）
  ageCategory: 'pre-weaning' | 'post-weaning' // 離乳完了前 or 離乳完了後

  // 離乳完了前（0歳〜離乳食完了前）のチェック項目
  preWeaning_哺乳困難: boolean
  preWeaning_体重増加不良: boolean
  preWeaning_哺乳時間異常: boolean
  preWeaning_哺乳時疲労: boolean
  preWeaning_嚥下困難: boolean

  // 離乳完了後（離乳食完了〜15歳未満）のチェック項目
  postWeaning_食べこぼし: boolean
  postWeaning_食事時間異常: boolean
  postWeaning_体重増加不良: boolean
  postWeaning_咀嚼困難: boolean
  postWeaning_偏咀嚼: boolean
  postWeaning_丸呑み: boolean
  postWeaning_口唇閉鎖不全: boolean
  postWeaning_前歯咬合異常: boolean
  postWeaning_習癖: boolean // 指しゃぶり、舌突出癖など
  postWeaning_構音障害: boolean
  postWeaning_睡眠時口呼吸: boolean

  // 検査所見
  exam_舌小帯短縮: boolean
  exam_上唇小帯異常: boolean
  exam_低位舌: boolean
  exam_狭窄歯列弓: boolean
  exam_反対咬合: boolean
  exam_開咬: boolean
  exam_過蓋咬合: boolean
  exam_口蓋形態異常: boolean
  exam_口腔習癖: string // 詳細記述

  // 該当項目数
  symptoms_count: number // 症状の該当数
  exam_findings_count: number // 検査所見の該当数
  diagnosis_result: string // 診断結果

  // その他の詳細情報
  symptoms_detail: string // 症状の詳細
  exam_detail: string // 検査の詳細
  treatmentPlan: string
  managementGoals: string
  guidanceProvided: string
  nextVisitDate: string
  remarks: string
  dentistName: string
  dentistLicense: string
}

const initialFormData: FormData = {
  documentDate: format(new Date(), 'yyyy-MM-dd'),
  patientNumber: '',
  patientName: '',
  patientNameKana: '',
  gender: '',
  birthDate: '',
  age: '',
  ageMonths: '',
  address: '',
  phone: '',
  guardianName: '',
  diagnosisDate: format(new Date(), 'yyyy-MM-dd'),
  ageCategory: 'post-weaning',
  preWeaning_哺乳困難: false,
  preWeaning_体重増加不良: false,
  preWeaning_哺乳時間異常: false,
  preWeaning_哺乳時疲労: false,
  preWeaning_嚥下困難: false,
  postWeaning_食べこぼし: false,
  postWeaning_食事時間異常: false,
  postWeaning_体重増加不良: false,
  postWeaning_咀嚼困難: false,
  postWeaning_偏咀嚼: false,
  postWeaning_丸呑み: false,
  postWeaning_口唇閉鎖不全: false,
  postWeaning_前歯咬合異常: false,
  postWeaning_習癖: false,
  postWeaning_構音障害: false,
  postWeaning_睡眠時口呼吸: false,
  exam_舌小帯短縮: false,
  exam_上唇小帯異常: false,
  exam_低位舌: false,
  exam_狭窄歯列弓: false,
  exam_反対咬合: false,
  exam_開咬: false,
  exam_過蓋咬合: false,
  exam_口蓋形態異常: false,
  exam_口腔習癖: '',
  symptoms_count: 0,
  exam_findings_count: 0,
  diagnosis_result: '',
  symptoms_detail: '',
  exam_detail: '',
  treatmentPlan: '',
  managementGoals: '',
  guidanceProvided: '',
  nextVisitDate: '',
  remarks: '',
  dentistName: '',
  dentistLicense: ''
}

export function OralDevelopmentDisorderForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: OralDevelopmentDisorderFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [autoPopulatedFields, setAutoPopulatedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

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

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: checked }

      // 症状数の自動計算
      let symptomsCount = 0
      if (updated.ageCategory === 'pre-weaning') {
        if (updated.preWeaning_哺乳困難) symptomsCount++
        if (updated.preWeaning_体重増加不良) symptomsCount++
        if (updated.preWeaning_哺乳時間異常) symptomsCount++
        if (updated.preWeaning_哺乳時疲労) symptomsCount++
        if (updated.preWeaning_嚥下困難) symptomsCount++
      } else {
        if (updated.postWeaning_食べこぼし) symptomsCount++
        if (updated.postWeaning_食事時間異常) symptomsCount++
        if (updated.postWeaning_体重増加不良) symptomsCount++
        if (updated.postWeaning_咀嚼困難) symptomsCount++
        if (updated.postWeaning_偏咀嚼) symptomsCount++
        if (updated.postWeaning_丸呑み) symptomsCount++
        if (updated.postWeaning_口唇閉鎖不全) symptomsCount++
        if (updated.postWeaning_前歯咬合異常) symptomsCount++
        if (updated.postWeaning_習癖) symptomsCount++
        if (updated.postWeaning_構音障害) symptomsCount++
        if (updated.postWeaning_睡眠時口呼吸) symptomsCount++
      }
      updated.symptoms_count = symptomsCount

      // 検査所見数の自動計算
      let examCount = 0
      if (updated.exam_舌小帯短縮) examCount++
      if (updated.exam_上唇小帯異常) examCount++
      if (updated.exam_低位舌) examCount++
      if (updated.exam_狭窄歯列弓) examCount++
      if (updated.exam_反対咬合) examCount++
      if (updated.exam_開咬) examCount++
      if (updated.exam_過蓋咬合) examCount++
      if (updated.exam_口蓋形態異常) examCount++
      updated.exam_findings_count = examCount

      // 診断判定（症状1つ以上 かつ 検査所見1つ以上で診断）
      if (symptomsCount >= 1 && examCount >= 1) {
        updated.diagnosis_result = '口腔機能発達不全症と診断'
      } else if (symptomsCount >= 1 || examCount >= 1) {
        updated.diagnosis_result = `口腔機能発達不全症の疑い（症状: ${symptomsCount}、所見: ${examCount}）`
      } else {
        updated.diagnosis_result = '該当なし'
      }

      return updated
    })
  }

  const handleAgeCategoryChange = (category: 'pre-weaning' | 'post-weaning') => {
    setFormData(prev => {
      const updated = { ...prev, ageCategory: category }

      // 年齢区分変更時は症状カウントを再計算
      let symptomsCount = 0
      if (category === 'pre-weaning') {
        if (updated.preWeaning_哺乳困難) symptomsCount++
        if (updated.preWeaning_体重増加不良) symptomsCount++
        if (updated.preWeaning_哺乳時間異常) symptomsCount++
        if (updated.preWeaning_哺乳時疲労) symptomsCount++
        if (updated.preWeaning_嚥下困難) symptomsCount++
      } else {
        if (updated.postWeaning_食べこぼし) symptomsCount++
        if (updated.postWeaning_食事時間異常) symptomsCount++
        if (updated.postWeaning_体重増加不良) symptomsCount++
        if (updated.postWeaning_咀嚼困難) symptomsCount++
        if (updated.postWeaning_偏咀嚼) symptomsCount++
        if (updated.postWeaning_丸呑み) symptomsCount++
        if (updated.postWeaning_口唇閉鎖不全) symptomsCount++
        if (updated.postWeaning_前歯咬合異常) symptomsCount++
        if (updated.postWeaning_習癖) symptomsCount++
        if (updated.postWeaning_構音障害) symptomsCount++
        if (updated.postWeaning_睡眠時口呼吸) symptomsCount++
      }
      updated.symptoms_count = symptomsCount

      // 診断判定の再計算
      if (symptomsCount >= 1 && updated.exam_findings_count >= 1) {
        updated.diagnosis_result = '口腔機能発達不全症と診断'
      } else if (symptomsCount >= 1 || updated.exam_findings_count >= 1) {
        updated.diagnosis_result = `口腔機能発達不全症の疑い（症状: ${symptomsCount}、所見: ${updated.exam_findings_count}）`
      } else {
        updated.diagnosis_result = '該当なし'
      }

      return updated
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = `口腔機能発達不全症 診断書 - ${formData.patientName || '患者名未設定'}`
      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '口腔機能発達不全症' as const,
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
        <title>口腔機能発達不全症 診断書</title>
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
    // 症状リストの生成
    const symptomsList = formData.ageCategory === 'pre-weaning'
      ? [
          { checked: formData.preWeaning_哺乳困難, label: '哺乳困難' },
          { checked: formData.preWeaning_体重増加不良, label: '体重増加不良' },
          { checked: formData.preWeaning_哺乳時間異常, label: '哺乳時間の異常' },
          { checked: formData.preWeaning_哺乳時疲労, label: '哺乳時の疲労' },
          { checked: formData.preWeaning_嚥下困難, label: '嚥下困難' }
        ]
      : [
          { checked: formData.postWeaning_食べこぼし, label: '食べこぼし' },
          { checked: formData.postWeaning_食事時間異常, label: '食事時間の異常' },
          { checked: formData.postWeaning_体重増加不良, label: '体重増加不良' },
          { checked: formData.postWeaning_咀嚼困難, label: '咀嚼困難' },
          { checked: formData.postWeaning_偏咀嚼, label: '偏咀嚼' },
          { checked: formData.postWeaning_丸呑み, label: '丸呑み' },
          { checked: formData.postWeaning_口唇閉鎖不全, label: '口唇閉鎖不全' },
          { checked: formData.postWeaning_前歯咬合異常, label: '前歯で噛めない' },
          { checked: formData.postWeaning_習癖, label: '習癖' },
          { checked: formData.postWeaning_構音障害, label: '構音障害' },
          { checked: formData.postWeaning_睡眠時口呼吸, label: '睡眠時の口呼吸' }
        ]

    const examList = [
      { checked: formData.exam_舌小帯短縮, label: '舌小帯短縮症' },
      { checked: formData.exam_上唇小帯異常, label: '上唇小帯の異常' },
      { checked: formData.exam_低位舌, label: '低位舌' },
      { checked: formData.exam_狭窄歯列弓, label: '狭窄歯列弓' },
      { checked: formData.exam_反対咬合, label: '反対咬合' },
      { checked: formData.exam_開咬, label: '開咬' },
      { checked: formData.exam_過蓋咬合, label: '過蓋咬合' },
      { checked: formData.exam_口蓋形態異常, label: '口蓋形態異常' }
    ]

    return `
      <h1>口腔機能発達不全症 診断書</h1>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">（日本歯科医学会 基準準拠）</p>

      <h2>総合判定</h2>
      <div style="background-color: ${formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? '#fef2f2' : '#eff6ff'}; border: 2px solid ${formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? '#fca5a5' : '#93c5fd'}; padding: 15px; margin: 10px 0; border-radius: 8px;">
        <div style="font-size: 14pt; font-weight: bold;">症状: ${formData.symptoms_count} 項目 / 検査所見: ${formData.exam_findings_count} 項目</div>
        <div style="font-size: 12pt; font-weight: bold; color: ${formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? '#b91c1c' : '#1e40af'}; margin-top: 5px;">
          ${formData.diagnosis_result}
        </div>
      </div>

      <h2>基本情報</h2>
      <div class="field"><span class="label">文書作成日:</span><span class="value">${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">患者番号:</span><span class="value">${formData.patientNumber}</span></div>
      <div class="field"><span class="label">患者氏名:</span><span class="value">${formData.patientName}</span></div>
      <div class="field"><span class="label">フリガナ:</span><span class="value">${formData.patientNameKana}</span></div>
      <div class="field"><span class="label">性別:</span><span class="value">${formData.gender}</span></div>
      <div class="field"><span class="label">生年月日:</span><span class="value">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">年齢:</span><span class="value">${formData.age}${formData.ageMonths ? ` (${formData.ageMonths})` : ''}</span></div>
      <div class="field"><span class="label">保護者氏名:</span><span class="value">${formData.guardianName}</span></div>
      <div class="field"><span class="label">診断日:</span><span class="value">${formData.diagnosisDate ? format(new Date(formData.diagnosisDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>

      <h2>症状チェックリスト（年齢区分: ${formData.ageCategory === 'pre-weaning' ? '離乳完了前' : '離乳完了後'}）</h2>
      <ul>
        ${symptomsList.map(item => `<li>${item.checked ? '☑' : '☐'} ${item.label}</li>`).join('')}
      </ul>
      ${formData.symptoms_detail ? `<div class="field"><span class="label">症状の詳細:</span><span class="value">${formData.symptoms_detail}</span></div>` : ''}

      <h2>検査所見チェックリスト</h2>
      <ul>
        ${examList.map(item => `<li>${item.checked ? '☑' : '☐'} ${item.label}</li>`).join('')}
      </ul>
      ${formData.exam_口腔習癖 ? `<div class="field"><span class="label">口腔習癖の詳細:</span><span class="value">${formData.exam_口腔習癖}</span></div>` : ''}
      ${formData.exam_detail ? `<div class="field"><span class="label">検査の詳細:</span><span class="value">${formData.exam_detail}</span></div>` : ''}

      <h2>治療・管理計画</h2>
      <div class="field"><span class="label">治療計画:</span><span class="value">${formData.treatmentPlan}</span></div>
      <div class="field"><span class="label">管理目標:</span><span class="value">${formData.managementGoals}</span></div>
      <div class="field"><span class="label">保護者への指導内容:</span><span class="value">${formData.guidanceProvided}</span></div>
      <div class="field"><span class="label">次回来院予定:</span><span class="value">${formData.nextVisitDate ? format(new Date(formData.nextVisitDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>

      <h2>その他</h2>
      <div class="field"><span class="label">備考:</span><span class="value">${formData.remarks}</span></div>
      <div class="field"><span class="label">担当歯科医師:</span><span class="value">${formData.dentistName}</span></div>
      <div class="field"><span class="label">歯科医師免許番号:</span><span class="value">${formData.dentistLicense}</span></div>
    `
  }

  const generatePlainText = () => {
    let text = `口腔機能発達不全症 診断書\n`
    text += `（日本歯科医学会 基準準拠）\n\n`

    text += `【総合判定】\n`
    text += `症状: ${formData.symptoms_count} 項目 / 検査所見: ${formData.exam_findings_count} 項目\n`
    text += `判定: ${formData.diagnosis_result}\n\n`

    text += `【基本情報】\n`
    text += `文書作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `患者番号: ${formData.patientNumber}\n`
    text += `患者氏名: ${formData.patientName}\n`
    text += `フリガナ: ${formData.patientNameKana}\n`
    text += `性別: ${formData.gender}\n`
    text += `生年月日: ${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `年齢: ${formData.age}${formData.ageMonths ? ` (${formData.ageMonths})` : ''}\n`
    text += `保護者氏名: ${formData.guardianName}\n`
    text += `診断日: ${formData.diagnosisDate ? format(new Date(formData.diagnosisDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n\n`

    text += `【症状チェックリスト】（年齢区分: ${formData.ageCategory === 'pre-weaning' ? '離乳完了前' : '離乳完了後'}）\n`
    if (formData.ageCategory === 'pre-weaning') {
      text += `${formData.preWeaning_哺乳困難 ? '☑' : '☐'} 哺乳困難\n`
      text += `${formData.preWeaning_体重増加不良 ? '☑' : '☐'} 体重増加不良\n`
      text += `${formData.preWeaning_哺乳時間異常 ? '☑' : '☐'} 哺乳時間の異常\n`
      text += `${formData.preWeaning_哺乳時疲労 ? '☑' : '☐'} 哺乳時の疲労\n`
      text += `${formData.preWeaning_嚥下困難 ? '☑' : '☐'} 嚥下困難\n`
    } else {
      text += `${formData.postWeaning_食べこぼし ? '☑' : '☐'} 食べこぼし\n`
      text += `${formData.postWeaning_食事時間異常 ? '☑' : '☐'} 食事時間の異常\n`
      text += `${formData.postWeaning_体重増加不良 ? '☑' : '☐'} 体重増加不良\n`
      text += `${formData.postWeaning_咀嚼困難 ? '☑' : '☐'} 咀嚼困難\n`
      text += `${formData.postWeaning_偏咀嚼 ? '☑' : '☐'} 偏咀嚼\n`
      text += `${formData.postWeaning_丸呑み ? '☑' : '☐'} 丸呑み\n`
      text += `${formData.postWeaning_口唇閉鎖不全 ? '☑' : '☐'} 口唇閉鎖不全\n`
      text += `${formData.postWeaning_前歯咬合異常 ? '☑' : '☐'} 前歯で噛めない\n`
      text += `${formData.postWeaning_習癖 ? '☑' : '☐'} 習癖\n`
      text += `${formData.postWeaning_構音障害 ? '☑' : '☐'} 構音障害\n`
      text += `${formData.postWeaning_睡眠時口呼吸 ? '☑' : '☐'} 睡眠時の口呼吸\n`
    }
    if (formData.symptoms_detail) text += `症状の詳細: ${formData.symptoms_detail}\n`
    text += `\n`

    text += `【検査所見チェックリスト】\n`
    text += `${formData.exam_舌小帯短縮 ? '☑' : '☐'} 舌小帯短縮症\n`
    text += `${formData.exam_上唇小帯異常 ? '☑' : '☐'} 上唇小帯の異常\n`
    text += `${formData.exam_低位舌 ? '☑' : '☐'} 低位舌\n`
    text += `${formData.exam_狭窄歯列弓 ? '☑' : '☐'} 狭窄歯列弓\n`
    text += `${formData.exam_反対咬合 ? '☑' : '☐'} 反対咬合\n`
    text += `${formData.exam_開咬 ? '☑' : '☐'} 開咬\n`
    text += `${formData.exam_過蓋咬合 ? '☑' : '☐'} 過蓋咬合\n`
    text += `${formData.exam_口蓋形態異常 ? '☑' : '☐'} 口蓋形態異常\n`
    if (formData.exam_口腔習癖) text += `口腔習癖の詳細: ${formData.exam_口腔習癖}\n`
    if (formData.exam_detail) text += `検査の詳細: ${formData.exam_detail}\n`
    text += `\n`

    text += `【治療・管理計画】\n`
    text += `治療計画: ${formData.treatmentPlan}\n`
    text += `管理目標: ${formData.managementGoals}\n`
    text += `保護者への指導内容: ${formData.guidanceProvided}\n`
    text += `次回来院予定: ${formData.nextVisitDate ? format(new Date(formData.nextVisitDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n\n`

    text += `【その他】\n`
    text += `備考: ${formData.remarks}\n`
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
      <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">口腔機能発達不全症 診断書</h3>
            <p className="text-sm text-gray-600">{document ? '文書を編集中' : '新規文書を作成中'} （15歳未満対象）</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCopyHTML} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            HTML形式でコピー
          </Button>
          <Button onClick={handleCopyPlainText} variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            テキストでコピー
          </Button>
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

      {copySuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">コピーしました</span>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <p className="font-medium">黄色の背景は自動入力された項目です</p>
        </div>
      </div>

      {/* 総合判定サマリー */}
      <Card className={formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
            総合判定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-xl font-bold">
              症状: {formData.symptoms_count} 項目 / 検査所見: {formData.exam_findings_count} 項目
            </div>
            <div className={`text-lg font-semibold ${formData.symptoms_count >= 1 && formData.exam_findings_count >= 1 ? 'text-red-700' : 'text-blue-700'}`}>
              {formData.diagnosis_result || '症状と検査所見を入力してください'}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              ※ 症状1項目以上 かつ 検査所見1項目以上で口腔機能発達不全症と診断されます
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* 左カラム */}
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
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>性別</Label>
                  <Input value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} className={isAutoPopulated('gender') ? 'bg-yellow-50' : ''} />
                </div>
                <div className="space-y-2">
                  <Label>年齢</Label>
                  <Input value={formData.age} onChange={(e) => handleChange('age', e.target.value)} className={isAutoPopulated('age') ? 'bg-yellow-50' : ''} />
                </div>
                <div className="space-y-2">
                  <Label>月齢</Label>
                  <Input value={formData.ageMonths} onChange={(e) => handleChange('ageMonths', e.target.value)} placeholder="例: 18ヶ月" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>生年月日</Label>
                <Input type="date" value={formData.birthDate} onChange={(e) => handleChange('birthDate', e.target.value)} className={isAutoPopulated('birthDate') ? 'bg-yellow-50' : ''} />
              </div>
              <div className="space-y-2">
                <Label>保護者氏名</Label>
                <Input value={formData.guardianName} onChange={(e) => handleChange('guardianName', e.target.value)} placeholder="保護者の氏名を入力" />
              </div>
              <div className="space-y-2">
                <Label>診断日</Label>
                <Input type="date" value={formData.diagnosisDate} onChange={(e) => handleChange('diagnosisDate', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* 年齢区分選択 */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-base">年齢区分（評価基準の選択）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg bg-white hover:bg-purple-50">
                  <input
                    type="radio"
                    checked={formData.ageCategory === 'pre-weaning'}
                    onChange={() => handleAgeCategoryChange('pre-weaning')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold">離乳完了前（0歳〜離乳食完了前）</div>
                    <div className="text-xs text-gray-600">哺乳困難、体重増加不良など（5項目）</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg bg-white hover:bg-purple-50">
                  <input
                    type="radio"
                    checked={formData.ageCategory === 'post-weaning'}
                    onChange={() => handleAgeCategoryChange('post-weaning')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-semibold">離乳完了後（離乳食完了〜15歳未満）</div>
                    <div className="text-xs text-gray-600">食べこぼし、咀嚼困難、構音障害など（11項目）</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 症状チェックリスト */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                症状チェックリスト（該当: {formData.symptoms_count} 項目）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.ageCategory === 'pre-weaning' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">【離乳完了前の症状】</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.preWeaning_哺乳困難} onChange={(e) => handleCheckboxChange('preWeaning_哺乳困難', e.target.checked)} className="w-4 h-4" />
                    <span>哺乳困難</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.preWeaning_体重増加不良} onChange={(e) => handleCheckboxChange('preWeaning_体重増加不良', e.target.checked)} className="w-4 h-4" />
                    <span>体重増加不良</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.preWeaning_哺乳時間異常} onChange={(e) => handleCheckboxChange('preWeaning_哺乳時間異常', e.target.checked)} className="w-4 h-4" />
                    <span>哺乳時間の異常（長すぎる/短すぎる）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.preWeaning_哺乳時疲労} onChange={(e) => handleCheckboxChange('preWeaning_哺乳時疲労', e.target.checked)} className="w-4 h-4" />
                    <span>哺乳時の疲労</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.preWeaning_嚥下困難} onChange={(e) => handleCheckboxChange('preWeaning_嚥下困難', e.target.checked)} className="w-4 h-4" />
                    <span>嚥下困難</span>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">【離乳完了後の症状】</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_食べこぼし} onChange={(e) => handleCheckboxChange('postWeaning_食べこぼし', e.target.checked)} className="w-4 h-4" />
                    <span>食べこぼし</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_食事時間異常} onChange={(e) => handleCheckboxChange('postWeaning_食事時間異常', e.target.checked)} className="w-4 h-4" />
                    <span>食事時間の異常（長すぎる/短すぎる）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_体重増加不良} onChange={(e) => handleCheckboxChange('postWeaning_体重増加不良', e.target.checked)} className="w-4 h-4" />
                    <span>体重増加不良</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_咀嚼困難} onChange={(e) => handleCheckboxChange('postWeaning_咀嚼困難', e.target.checked)} className="w-4 h-4" />
                    <span>咀嚼困難</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_偏咀嚼} onChange={(e) => handleCheckboxChange('postWeaning_偏咀嚼', e.target.checked)} className="w-4 h-4" />
                    <span>偏咀嚼（片側でのみ噛む）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_丸呑み} onChange={(e) => handleCheckboxChange('postWeaning_丸呑み', e.target.checked)} className="w-4 h-4" />
                    <span>丸呑み</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_口唇閉鎖不全} onChange={(e) => handleCheckboxChange('postWeaning_口唇閉鎖不全', e.target.checked)} className="w-4 h-4" />
                    <span>口唇閉鎖不全（口がいつも開いている）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_前歯咬合異常} onChange={(e) => handleCheckboxChange('postWeaning_前歯咬合異常', e.target.checked)} className="w-4 h-4" />
                    <span>前歯で噛めない</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_習癖} onChange={(e) => handleCheckboxChange('postWeaning_習癖', e.target.checked)} className="w-4 h-4" />
                    <span>習癖（指しゃぶり、舌突出癖など）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_構音障害} onChange={(e) => handleCheckboxChange('postWeaning_構音障害', e.target.checked)} className="w-4 h-4" />
                    <span>構音障害（発音の問題）</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.postWeaning_睡眠時口呼吸} onChange={(e) => handleCheckboxChange('postWeaning_睡眠時口呼吸', e.target.checked)} className="w-4 h-4" />
                    <span>睡眠時の口呼吸</span>
                  </label>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <Label>症状の詳細</Label>
                <Textarea value={formData.symptoms_detail} onChange={(e) => handleChange('symptoms_detail', e.target.value)} rows={3} placeholder="症状の詳細を記載してください" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {/* 検査所見チェックリスト */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                検査所見チェックリスト（該当: {formData.exam_findings_count} 項目）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_舌小帯短縮} onChange={(e) => handleCheckboxChange('exam_舌小帯短縮', e.target.checked)} className="w-4 h-4" />
                  <span>舌小帯短縮症</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_上唇小帯異常} onChange={(e) => handleCheckboxChange('exam_上唇小帯異常', e.target.checked)} className="w-4 h-4" />
                  <span>上唇小帯の異常</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_低位舌} onChange={(e) => handleCheckboxChange('exam_低位舌', e.target.checked)} className="w-4 h-4" />
                  <span>低位舌</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_狭窄歯列弓} onChange={(e) => handleCheckboxChange('exam_狭窄歯列弓', e.target.checked)} className="w-4 h-4" />
                  <span>狭窄歯列弓</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_反対咬合} onChange={(e) => handleCheckboxChange('exam_反対咬合', e.target.checked)} className="w-4 h-4" />
                  <span>反対咬合（受け口）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_開咬} onChange={(e) => handleCheckboxChange('exam_開咬', e.target.checked)} className="w-4 h-4" />
                  <span>開咬（かみ合わない）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_過蓋咬合} onChange={(e) => handleCheckboxChange('exam_過蓋咬合', e.target.checked)} className="w-4 h-4" />
                  <span>過蓋咬合（深い咬み合わせ）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.exam_口蓋形態異常} onChange={(e) => handleCheckboxChange('exam_口蓋形態異常', e.target.checked)} className="w-4 h-4" />
                  <span>口蓋形態異常（高口蓋など）</span>
                </label>
              </div>
              <div className="mt-4 space-y-2">
                <Label>口腔習癖の詳細</Label>
                <Textarea value={formData.exam_口腔習癖} onChange={(e) => handleChange('exam_口腔習癖', e.target.value)} rows={2} placeholder="例: 指しゃぶり、舌突出癖、爪噛み" />
              </div>
              <div className="mt-4 space-y-2">
                <Label>検査の詳細</Label>
                <Textarea value={formData.exam_detail} onChange={(e) => handleChange('exam_detail', e.target.value)} rows={4} placeholder="検査の詳細結果や所見を記載してください" />
              </div>
            </CardContent>
          </Card>

          {/* 治療・管理計画 */}
          <Card>
            <CardHeader><CardTitle className="text-base">治療・管理計画</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>治療計画</Label>
                <Textarea value={formData.treatmentPlan} onChange={(e) => handleChange('treatmentPlan', e.target.value)} rows={4} placeholder="例:&#10;1. 口腔機能訓練&#10;2. 食事指導&#10;3. 定期経過観察" />
              </div>
              <div className="space-y-2">
                <Label>管理目標</Label>
                <Textarea value={formData.managementGoals} onChange={(e) => handleChange('managementGoals', e.target.value)} rows={3} placeholder="例: 口腔機能の正常な発達促進" />
              </div>
              <div className="space-y-2">
                <Label>保護者への指導内容</Label>
                <Textarea value={formData.guidanceProvided} onChange={(e) => handleChange('guidanceProvided', e.target.value)} rows={3} placeholder="例: 保護者への食事指導、口腔体操の指導" />
              </div>
              <div className="space-y-2">
                <Label>次回来院予定</Label>
                <Input type="date" value={formData.nextVisitDate} onChange={(e) => handleChange('nextVisitDate', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* その他 */}
          <Card>
            <CardHeader><CardTitle className="text-base">その他</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>備考</Label>
                <Textarea value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} rows={2} />
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
      </div>
    </div>
  )
}
