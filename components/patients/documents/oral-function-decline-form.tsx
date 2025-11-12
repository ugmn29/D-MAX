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
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { createMedicalDocument, updateMedicalDocument, MedicalDocument } from '@/lib/api/medical-documents'

interface OralFunctionDeclineFormProps {
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
  address: string
  phone: string

  // 診断情報
  diagnosisDate: string
  diagnosis: string

  // 検査結果（7項目）- 日本老年歯科医学会基準
  // 1. 口腔衛生状態不良（TCI: Tongue Coating Index）
  test1_tci_score: string // TCI合計スコア
  test1_result: 'normal' | 'abnormal' | '' // 9点以上で異常

  // 2. 口腔乾燥
  test2_saliva_weight: string // 唾液重量増加（g）
  test2_result: 'normal' | 'abnormal' | '' // 2g以下で異常

  // 3. 咬合力低下
  test3_occlusal_force: string // 咬合力（N）
  test3_remaining_teeth: string // 残存歯数
  test3_result: 'normal' | 'abnormal' | '' // 200N未満または残存歯20本未満で異常

  // 4. 舌口唇運動機能低下（オーラルディアドコキネシス）
  test4_pa_count: string // /pa/の回数（回/秒）
  test4_ta_count: string // /ta/の回数（回/秒）
  test4_ka_count: string // /ka/の回数（回/秒）
  test4_result: 'normal' | 'abnormal' | '' // いずれか6回/秒未満で異常

  // 5. 低舌圧
  test5_tongue_pressure: string // 最大舌圧（kPa）
  test5_result: 'normal' | 'abnormal' | '' // 30kPa未満で異常

  // 6. 咀嚼機能低下
  test6_glucose_value: string // グルコース濃度（mg/dL）
  test6_result: 'normal' | 'abnormal' | ''

  // 7. 嚥下機能低下
  test7_swallowing_test: string // 嚥下スクリーニング検査結果
  test7_result: 'normal' | 'abnormal' | ''

  // 総合判定
  abnormal_count: number // 異常項目数
  overall_diagnosis: string // 総合診断（3項目以上で口腔機能低下症）

  // 治療・管理計画
  treatmentPlan: string
  managementGoals: string
  guidanceProvided: string
  nextVisitDate: string

  // その他
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
  address: '',
  phone: '',
  diagnosisDate: format(new Date(), 'yyyy-MM-dd'),
  diagnosis: '',
  test1_tci_score: '',
  test1_result: '',
  test2_saliva_weight: '',
  test2_result: '',
  test3_occlusal_force: '',
  test3_remaining_teeth: '',
  test3_result: '',
  test4_pa_count: '',
  test4_ta_count: '',
  test4_ka_count: '',
  test4_result: '',
  test5_tongue_pressure: '',
  test5_result: '',
  test6_glucose_value: '',
  test6_result: '',
  test7_swallowing_test: '',
  test7_result: '',
  abnormal_count: 0,
  overall_diagnosis: '',
  treatmentPlan: '',
  managementGoals: '',
  guidanceProvided: '',
  nextVisitDate: '',
  remarks: '',
  dentistName: '',
  dentistLicense: ''
}

export function OralFunctionDeclineForm({
  patientId,
  clinicId,
  document,
  onSave,
  onCancel
}: OralFunctionDeclineFormProps) {
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

  const loadDocumentData = () => {
    if (!document) return

    const content = document.content as Partial<FormData>
    setFormData(prev => ({
      ...prev,
      ...content
    }))

    setAutoPopulatedFields(new Set())
  }

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 自動判定ロジック
      if (field === 'test1_tci_score') {
        const score = parseFloat(value as string)
        updated.test1_result = !isNaN(score) && score >= 9 ? 'abnormal' : 'normal'
      }
      if (field === 'test2_saliva_weight') {
        const weight = parseFloat(value as string)
        updated.test2_result = !isNaN(weight) && weight <= 2 ? 'abnormal' : 'normal'
      }
      if (field === 'test3_occlusal_force' || field === 'test3_remaining_teeth') {
        const force = parseFloat(updated.test3_occlusal_force)
        const teeth = parseFloat(updated.test3_remaining_teeth)
        updated.test3_result = (!isNaN(force) && force < 200) || (!isNaN(teeth) && teeth < 20) ? 'abnormal' : 'normal'
      }
      if (field === 'test4_pa_count' || field === 'test4_ta_count' || field === 'test4_ka_count') {
        const pa = parseFloat(updated.test4_pa_count)
        const ta = parseFloat(updated.test4_ta_count)
        const ka = parseFloat(updated.test4_ka_count)
        updated.test4_result = (!isNaN(pa) && pa < 6) || (!isNaN(ta) && ta < 6) || (!isNaN(ka) && ka < 6) ? 'abnormal' : 'normal'
      }
      if (field === 'test5_tongue_pressure') {
        const pressure = parseFloat(value as string)
        updated.test5_result = !isNaN(pressure) && pressure < 30 ? 'abnormal' : 'normal'
      }

      // 異常項目数の自動計算
      let abnormalCount = 0
      if (updated.test1_result === 'abnormal') abnormalCount++
      if (updated.test2_result === 'abnormal') abnormalCount++
      if (updated.test3_result === 'abnormal') abnormalCount++
      if (updated.test4_result === 'abnormal') abnormalCount++
      if (updated.test5_result === 'abnormal') abnormalCount++
      if (updated.test6_result === 'abnormal') abnormalCount++
      if (updated.test7_result === 'abnormal') abnormalCount++

      updated.abnormal_count = abnormalCount
      updated.overall_diagnosis = abnormalCount >= 3
        ? '口腔機能低下症と診断'
        : `口腔機能低下症の疑い（異常項目: ${abnormalCount}/7）`

      return updated
    })
  }

  const handleResultChange = (field: keyof FormData, value: 'normal' | 'abnormal' | '') => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 異常項目数の再計算
      let abnormalCount = 0
      if (updated.test1_result === 'abnormal') abnormalCount++
      if (updated.test2_result === 'abnormal') abnormalCount++
      if (updated.test3_result === 'abnormal') abnormalCount++
      if (updated.test4_result === 'abnormal') abnormalCount++
      if (updated.test5_result === 'abnormal') abnormalCount++
      if (updated.test6_result === 'abnormal') abnormalCount++
      if (updated.test7_result === 'abnormal') abnormalCount++

      updated.abnormal_count = abnormalCount
      updated.overall_diagnosis = abnormalCount >= 3
        ? '口腔機能低下症と診断'
        : `口腔機能低下症の疑い（異常項目: ${abnormalCount}/7）`

      return updated
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const title = `口腔機能低下症 診断書 - ${formData.patientName || '患者名未設定'}`

      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '口腔機能低下症' as const,
        title,
        content: formData
      }

      if (document) {
        await updateMedicalDocument(document.id, {
          title,
          content: formData
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
        <title>口腔機能低下症 診断書</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'MS PGothic', sans-serif; font-size: 10pt; line-height: 1.6; }
          h1 { text-align: center; font-size: 16pt; margin-bottom: 20px; }
          h2 { font-size: 12pt; border-bottom: 2px solid #333; margin-top: 20px; margin-bottom: 10px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; display: inline-block; width: 150px; }
          .value { display: inline-block; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; }
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
    const resultBadge = (result: string) => {
      if (result === 'abnormal') return '<span style="background-color: #fed7aa; color: #9a3412; padding: 2px 8px; border-radius: 4px; font-size: 10pt;">異常</span>'
      if (result === 'normal') return '<span style="background-color: #bbf7d0; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 10pt;">正常</span>'
      return '-'
    }

    return `
      <h1>口腔機能低下症 診断書</h1>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">（日本老年歯科医学会 別添2準拠）</p>

      <h2>基本情報</h2>
      <div class="field"><span class="label">文書作成日:</span><span class="value">${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">患者番号:</span><span class="value">${formData.patientNumber}</span></div>
      <div class="field"><span class="label">患者氏名:</span><span class="value">${formData.patientName}</span></div>
      <div class="field"><span class="label">フリガナ:</span><span class="value">${formData.patientNameKana}</span></div>
      <div class="field"><span class="label">性別:</span><span class="value">${formData.gender}</span></div>
      <div class="field"><span class="label">生年月日:</span><span class="value">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">年齢:</span><span class="value">${formData.age}</span></div>
      <div class="field"><span class="label">住所:</span><span class="value">${formData.address}</span></div>
      <div class="field"><span class="label">電話番号:</span><span class="value">${formData.phone}</span></div>

      <h2>診断情報</h2>
      <div class="field"><span class="label">診断日:</span><span class="value">${formData.diagnosisDate ? format(new Date(formData.diagnosisDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>
      <div class="field"><span class="label">診断:</span><span class="value">${formData.diagnosis}</span></div>

      <h2>総合判定</h2>
      <div style="background-color: ${formData.abnormal_count >= 3 ? '#fef2f2' : '#eff6ff'}; border: 2px solid ${formData.abnormal_count >= 3 ? '#fca5a5' : '#93c5fd'}; padding: 15px; margin: 10px 0; border-radius: 8px;">
        <div style="font-size: 18pt; font-weight: bold; margin-bottom: 10px;">異常項目: ${formData.abnormal_count} / 7</div>
        <div style="font-size: 14pt; font-weight: bold; color: ${formData.abnormal_count >= 3 ? '#b91c1c' : '#1e40af'};">
          ${formData.overall_diagnosis || '検査結果を入力してください'}
        </div>
        <p style="font-size: 9pt; color: #666; margin-top: 10px;">※ 7項目中3項目以上が異常の場合、口腔機能低下症と診断されます</p>
      </div>

      <h2>検査結果詳細（7項目）</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">検査項目</th>
            <th style="width: 40%;">測定値</th>
            <th style="width: 15%;">基準値</th>
            <th style="width: 15%;">判定</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. 口腔衛生状態不良</strong><br/>（TCI: Tongue Coating Index）</td>
            <td>TCI合計スコア: ${formData.test1_tci_score || '-'} 点</td>
            <td>≥9点で異常</td>
            <td>${resultBadge(formData.test1_result)}</td>
          </tr>
          <tr>
            <td><strong>2. 口腔乾燥</strong></td>
            <td>唾液重量増加量: ${formData.test2_saliva_weight || '-'} g<br/>（ガムテスト/サクソンテスト）</td>
            <td>≤2gで異常</td>
            <td>${resultBadge(formData.test2_result)}</td>
          </tr>
          <tr>
            <td><strong>3. 咬合力低下</strong></td>
            <td>咬合力: ${formData.test3_occlusal_force || '-'} N<br/>残存歯数: ${formData.test3_remaining_teeth || '-'} 本</td>
            <td>&lt;200N または<br/>&lt;20本で異常</td>
            <td>${resultBadge(formData.test3_result)}</td>
          </tr>
          <tr>
            <td><strong>4. 舌口唇運動機能低下</strong><br/>（オーラルディアドコキネシス）</td>
            <td>/pa/: ${formData.test4_pa_count || '-'} 回/秒<br/>/ta/: ${formData.test4_ta_count || '-'} 回/秒<br/>/ka/: ${formData.test4_ka_count || '-'} 回/秒</td>
            <td>いずれか<br/>&lt;6回/秒で異常</td>
            <td>${resultBadge(formData.test4_result)}</td>
          </tr>
          <tr>
            <td><strong>5. 低舌圧</strong></td>
            <td>最大舌圧: ${formData.test5_tongue_pressure || '-'} kPa</td>
            <td>&lt;30kPaで異常</td>
            <td>${resultBadge(formData.test5_result)}</td>
          </tr>
          <tr>
            <td><strong>6. 咀嚼機能低下</strong></td>
            <td>グルコース濃度: ${formData.test6_glucose_value || '-'} mg/dL<br/>（グルコース法/グミゼリー咀嚼法）</td>
            <td>各検査法の基準値による</td>
            <td>${resultBadge(formData.test6_result)}</td>
          </tr>
          <tr>
            <td><strong>7. 嚥下機能低下</strong></td>
            <td>${formData.test7_swallowing_test || '-'}<br/>（EAT-10/聖隷式嚥下質問紙等）</td>
            <td>各検査法の基準値による</td>
            <td>${resultBadge(formData.test7_result)}</td>
          </tr>
        </tbody>
      </table>

      <h2>治療・管理計画</h2>
      <div class="field"><span class="label">治療計画:</span><span class="value">${formData.treatmentPlan}</span></div>
      <div class="field"><span class="label">管理目標:</span><span class="value">${formData.managementGoals}</span></div>
      <div class="field"><span class="label">指導内容:</span><span class="value">${formData.guidanceProvided}</span></div>
      <div class="field"><span class="label">次回来院予定:</span><span class="value">${formData.nextVisitDate ? format(new Date(formData.nextVisitDate), 'yyyy年MM月dd日', { locale: ja }) : ''}</span></div>

      <h2>その他</h2>
      <div class="field"><span class="label">備考:</span><span class="value">${formData.remarks}</span></div>
      <div class="field"><span class="label">担当歯科医師:</span><span class="value">${formData.dentistName}</span></div>
      <div class="field"><span class="label">歯科医師免許番号:</span><span class="value">${formData.dentistLicense}</span></div>
    `
  }

  const generatePlainText = () => {
    const resultText = (result: string) => {
      if (result === 'abnormal') return '異常'
      if (result === 'normal') return '正常'
      return '-'
    }

    let text = `口腔機能低下症 診断書\n`
    text += `（日本老年歯科医学会 別添2準拠）\n\n`

    text += `【基本情報】\n`
    text += `文書作成日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `患者番号: ${formData.patientNumber}\n`
    text += `患者氏名: ${formData.patientName}\n`
    text += `フリガナ: ${formData.patientNameKana}\n`
    text += `性別: ${formData.gender}\n`
    text += `生年月日: ${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `年齢: ${formData.age}\n`
    text += `住所: ${formData.address}\n`
    text += `電話番号: ${formData.phone}\n\n`

    text += `【診断情報】\n`
    text += `診断日: ${formData.diagnosisDate ? format(new Date(formData.diagnosisDate), 'yyyy年MM月dd日', { locale: ja }) : ''}\n`
    text += `診断: ${formData.diagnosis}\n\n`

    text += `【総合判定】\n`
    text += `異常項目: ${formData.abnormal_count} / 7\n`
    text += `判定: ${formData.overall_diagnosis || '検査結果を入力してください'}\n`
    text += `※ 7項目中3項目以上が異常の場合、口腔機能低下症と診断されます\n\n`

    text += `【検査結果詳細（7項目）】\n`
    text += `1. 口腔衛生状態不良（TCI: Tongue Coating Index）\n`
    text += `   TCI合計スコア: ${formData.test1_tci_score || '-'} 点\n`
    text += `   基準: ≥9点で異常\n`
    text += `   判定: ${resultText(formData.test1_result)}\n\n`

    text += `2. 口腔乾燥\n`
    text += `   唾液重量増加量: ${formData.test2_saliva_weight || '-'} g（ガムテスト/サクソンテスト）\n`
    text += `   基準: ≤2gで異常\n`
    text += `   判定: ${resultText(formData.test2_result)}\n\n`

    text += `3. 咬合力低下\n`
    text += `   咬合力: ${formData.test3_occlusal_force || '-'} N\n`
    text += `   残存歯数: ${formData.test3_remaining_teeth || '-'} 本\n`
    text += `   基準: <200N または <20本で異常\n`
    text += `   判定: ${resultText(formData.test3_result)}\n\n`

    text += `4. 舌口唇運動機能低下（オーラルディアドコキネシス）\n`
    text += `   /pa/: ${formData.test4_pa_count || '-'} 回/秒\n`
    text += `   /ta/: ${formData.test4_ta_count || '-'} 回/秒\n`
    text += `   /ka/: ${formData.test4_ka_count || '-'} 回/秒\n`
    text += `   基準: いずれか <6回/秒で異常\n`
    text += `   判定: ${resultText(formData.test4_result)}\n\n`

    text += `5. 低舌圧\n`
    text += `   最大舌圧: ${formData.test5_tongue_pressure || '-'} kPa\n`
    text += `   基準: <30kPaで異常\n`
    text += `   判定: ${resultText(formData.test5_result)}\n\n`

    text += `6. 咀嚼機能低下\n`
    text += `   グルコース濃度: ${formData.test6_glucose_value || '-'} mg/dL（グルコース法/グミゼリー咀嚼法）\n`
    text += `   基準: 各検査法の基準値による\n`
    text += `   判定: ${resultText(formData.test6_result)}\n\n`

    text += `7. 嚥下機能低下\n`
    text += `   検査結果: ${formData.test7_swallowing_test || '-'}（EAT-10/聖隷式嚥下質問紙等）\n`
    text += `   基準: 各検査法の基準値による\n`
    text += `   判定: ${resultText(formData.test7_result)}\n\n`

    text += `【治療・管理計画】\n`
    text += `治療計画: ${formData.treatmentPlan}\n`
    text += `管理目標: ${formData.managementGoals}\n`
    text += `指導内容: ${formData.guidanceProvided}\n`
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
      {/* ヘッダー */}
      <div className="flex items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">口腔機能低下症 診断書</h3>
            <p className="text-sm text-gray-600">
              {document ? '文書を編集中' : '新規文書を作成中'} （65歳以上対象）
            </p>
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
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="documentDate">文書作成日</Label>
                <Input
                  id="documentDate"
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => handleChange('documentDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientNumber">患者番号</Label>
                <Input
                  id="patientNumber"
                  value={formData.patientNumber}
                  onChange={(e) => handleChange('patientNumber', e.target.value)}
                  className={isAutoPopulated('patientNumber') ? 'bg-yellow-50' : ''}
                />
              </div>

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
                <Label htmlFor="patientNameKana">フリガナ</Label>
                <Input
                  id="patientNameKana"
                  value={formData.patientNameKana}
                  onChange={(e) => handleChange('patientNameKana', e.target.value)}
                  className={isAutoPopulated('patientNameKana') ? 'bg-yellow-50' : ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="age">年齢</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className={isAutoPopulated('age') ? 'bg-yellow-50' : ''}
                  />
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="address">住所</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className={isAutoPopulated('address') ? 'bg-yellow-50' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={isAutoPopulated('phone') ? 'bg-yellow-50' : ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">診断情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosisDate">診断日</Label>
                <Input
                  id="diagnosisDate"
                  type="date"
                  value={formData.diagnosisDate}
                  onChange={(e) => handleChange('diagnosisDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">診断</Label>
                <Textarea
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => handleChange('diagnosis', e.target.value)}
                  rows={3}
                  placeholder="例: 口腔機能低下症"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">治療・管理計画</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="treatmentPlan">治療計画</Label>
                <Textarea
                  id="treatmentPlan"
                  value={formData.treatmentPlan}
                  onChange={(e) => handleChange('treatmentPlan', e.target.value)}
                  rows={4}
                  placeholder="例:&#10;1. 口腔機能向上訓練&#10;2. 咀嚼・嚥下訓練&#10;3. 口腔衛生管理"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="managementGoals">管理目標</Label>
                <Textarea
                  id="managementGoals"
                  value={formData.managementGoals}
                  onChange={(e) => handleChange('managementGoals', e.target.value)}
                  rows={3}
                  placeholder="例: 口腔機能の維持・向上"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guidanceProvided">指導内容</Label>
                <Textarea
                  id="guidanceProvided"
                  value={formData.guidanceProvided}
                  onChange={(e) => handleChange('guidanceProvided', e.target.value)}
                  rows={3}
                  placeholder="例: 口腔体操、舌運動訓練"
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
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {/* 総合判定サマリー */}
          <Card className={formData.abnormal_count >= 3 ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {formData.abnormal_count >= 3 ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
                総合判定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  異常項目: {formData.abnormal_count} / 7
                </div>
                <div className={`text-lg font-semibold ${formData.abnormal_count >= 3 ? 'text-red-700' : 'text-blue-700'}`}>
                  {formData.overall_diagnosis || '検査結果を入力してください'}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  ※ 7項目中3項目以上が異常の場合、口腔機能低下症と診断されます
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 検査1: 口腔衛生状態不良 */}
          <Card className={formData.test1_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">1. 口腔衛生状態不良（TCI）</CardTitle>
                {formData.test1_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test1_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test1_tci_score">TCI合計スコア</Label>
                <Input
                  id="test1_tci_score"
                  type="number"
                  step="0.1"
                  value={formData.test1_tci_score}
                  onChange={(e) => handleChange('test1_tci_score', e.target.value)}
                  placeholder="0-27点"
                />
                <p className="text-xs text-gray-500">基準: 9点以上で異常</p>
              </div>
            </CardContent>
          </Card>

          {/* 検査2: 口腔乾燥 */}
          <Card className={formData.test2_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">2. 口腔乾燥</CardTitle>
                {formData.test2_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test2_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test2_saliva_weight">唾液重量増加量（g）</Label>
                <Input
                  id="test2_saliva_weight"
                  type="number"
                  step="0.1"
                  value={formData.test2_saliva_weight}
                  onChange={(e) => handleChange('test2_saliva_weight', e.target.value)}
                  placeholder="例: 1.5"
                />
                <p className="text-xs text-gray-500">基準: 2g以下で異常（ガムテスト、サクソンテスト）</p>
              </div>
            </CardContent>
          </Card>

          {/* 検査3: 咬合力低下 */}
          <Card className={formData.test3_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">3. 咬合力低下</CardTitle>
                {formData.test3_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test3_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test3_occlusal_force">咬合力（N）</Label>
                <Input
                  id="test3_occlusal_force"
                  type="number"
                  step="1"
                  value={formData.test3_occlusal_force}
                  onChange={(e) => handleChange('test3_occlusal_force', e.target.value)}
                  placeholder="例: 250"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test3_remaining_teeth">残存歯数（本）</Label>
                <Input
                  id="test3_remaining_teeth"
                  type="number"
                  step="1"
                  value={formData.test3_remaining_teeth}
                  onChange={(e) => handleChange('test3_remaining_teeth', e.target.value)}
                  placeholder="例: 24"
                />
              </div>
              <p className="text-xs text-gray-500">基準: 200N未満または残存歯20本未満で異常</p>
            </CardContent>
          </Card>

          {/* 検査4: 舌口唇運動機能低下 */}
          <Card className={formData.test4_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">4. 舌口唇運動機能低下（ODK）</CardTitle>
                {formData.test4_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test4_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test4_pa_count">/pa/ 回数（回/秒）</Label>
                <Input
                  id="test4_pa_count"
                  type="number"
                  step="0.1"
                  value={formData.test4_pa_count}
                  onChange={(e) => handleChange('test4_pa_count', e.target.value)}
                  placeholder="例: 6.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test4_ta_count">/ta/ 回数（回/秒）</Label>
                <Input
                  id="test4_ta_count"
                  type="number"
                  step="0.1"
                  value={formData.test4_ta_count}
                  onChange={(e) => handleChange('test4_ta_count', e.target.value)}
                  placeholder="例: 6.2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test4_ka_count">/ka/ 回数（回/秒）</Label>
                <Input
                  id="test4_ka_count"
                  type="number"
                  step="0.1"
                  value={formData.test4_ka_count}
                  onChange={(e) => handleChange('test4_ka_count', e.target.value)}
                  placeholder="例: 5.8"
                />
              </div>
              <p className="text-xs text-gray-500">基準: いずれか6回/秒未満で異常（オーラルディアドコキネシス）</p>
            </CardContent>
          </Card>

          {/* 検査5: 低舌圧 */}
          <Card className={formData.test5_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">5. 低舌圧</CardTitle>
                {formData.test5_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test5_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test5_tongue_pressure">最大舌圧（kPa）</Label>
                <Input
                  id="test5_tongue_pressure"
                  type="number"
                  step="0.1"
                  value={formData.test5_tongue_pressure}
                  onChange={(e) => handleChange('test5_tongue_pressure', e.target.value)}
                  placeholder="例: 28.5"
                />
                <p className="text-xs text-gray-500">基準: 30kPa未満で異常</p>
              </div>
            </CardContent>
          </Card>

          {/* 検査6: 咀嚼機能低下 */}
          <Card className={formData.test6_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">6. 咀嚼機能低下</CardTitle>
                {formData.test6_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test6_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test6_glucose_value">グルコース濃度（mg/dL）</Label>
                <Input
                  id="test6_glucose_value"
                  type="number"
                  step="1"
                  value={formData.test6_glucose_value}
                  onChange={(e) => handleChange('test6_glucose_value', e.target.value)}
                  placeholder="例: 150"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test6_result">判定</Label>
                <select
                  id="test6_result"
                  value={formData.test6_result}
                  onChange={(e) => handleResultChange('test6_result', e.target.value as 'normal' | 'abnormal' | '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  <option value="normal">正常</option>
                  <option value="abnormal">異常</option>
                </select>
                <p className="text-xs text-gray-500">グルコース法、グミゼリー咀嚼法など</p>
              </div>
            </CardContent>
          </Card>

          {/* 検査7: 嚥下機能低下 */}
          <Card className={formData.test7_result === 'abnormal' ? 'border-orange-300' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">7. 嚥下機能低下</CardTitle>
                {formData.test7_result === 'abnormal' && (
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">異常</span>
                )}
                {formData.test7_result === 'normal' && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">正常</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="test7_swallowing_test">嚥下スクリーニング検査結果</Label>
                <Textarea
                  id="test7_swallowing_test"
                  value={formData.test7_swallowing_test}
                  onChange={(e) => handleChange('test7_swallowing_test', e.target.value)}
                  rows={2}
                  placeholder="例: EAT-10スコア: 3点"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test7_result">判定</Label>
                <select
                  id="test7_result"
                  value={formData.test7_result}
                  onChange={(e) => handleResultChange('test7_result', e.target.value as 'normal' | 'abnormal' | '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">選択してください</option>
                  <option value="normal">正常</option>
                  <option value="abnormal">異常</option>
                </select>
                <p className="text-xs text-gray-500">EAT-10、聖隷式嚥下質問紙など</p>
              </div>
            </CardContent>
          </Card>

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

              <div className="space-y-2">
                <Label htmlFor="dentistLicense">歯科医師免許番号</Label>
                <Input
                  id="dentistLicense"
                  value={formData.dentistLicense}
                  onChange={(e) => handleChange('dentistLicense', e.target.value)}
                  placeholder="例: 第123456号"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
