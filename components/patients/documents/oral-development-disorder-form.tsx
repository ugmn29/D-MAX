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
  ageMonths: string
  address: string
  phone: string
  guardianName: string
  diagnosisDate: string

  // 年齢区分
  ageCategory: 'pre-weaning' | 'post-weaning'

  // 離乳完了前（別紙1：C-1〜C-13）
  pre_C1_先天性歯: boolean
  pre_C2_口唇歯槽形態異常: boolean
  pre_C3_舌小帯異常: boolean
  pre_C4_乳首を口に含めない: boolean
  pre_C5_授乳時間異常: boolean
  pre_C6_哺乳量回数ムラ: boolean
  pre_C7_離乳首の握り確認不可: boolean
  pre_C8_スプーン舌で押し出す: boolean
  pre_C9_離乳進まない: boolean
  pre_C10_口唇閉鎖不全: boolean
  pre_C11_やせ肥満: boolean
  pre_C12_口腔周囲過敏: boolean
  pre_C13_その他問題点: boolean
  pre_C13_その他問題点_詳細: string

  // 離乳完了後（別紙2：C-1〜C-17）
  post_C1_歯の萌出遅れ: boolean
  post_C2_機能的歯列咬合異常: boolean
  post_C3_咀嚼影響う蝕: boolean
  post_C4_強く噛み締められない: boolean
  post_C5_咀嚼時間異常: boolean
  post_C6_偏咀嚼: boolean
  post_C7_舌突出_乳児嚥下残存: boolean
  post_C8_哺乳量食事量回数ムラ: boolean
  post_C9_構音障害: boolean
  post_C10_口唇閉鎖不全: boolean
  post_C11_口腔習癖: boolean
  post_C12_舌小帯異常: boolean
  post_C13_やせ肥満: boolean
  post_C14_口呼吸: boolean
  post_C15_口蓋扁桃等肥大: boolean
  post_C16_睡眠時いびき: boolean
  post_C17_その他問題点: boolean
  post_C17_その他問題点_詳細: string
  post_口唇閉鎖力検査: string

  // 栄養（体格）
  currentWeight: string
  currentHeight: string
  birthWeight: string
  birthHeight: string
  kaupIndex: string
  rorerIndex: string

  // 該当項目数
  symptoms_count: number
  diagnosis_result: string
  can_diagnose: boolean
  can_claim_management_fee: boolean
  diagnosis_reason: string
  management_fee_reason: string

  // その他
  symptoms_detail: string
  exam_detail: string
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

  // 離乳完了前
  pre_C1_先天性歯: false,
  pre_C2_口唇歯槽形態異常: false,
  pre_C3_舌小帯異常: false,
  pre_C4_乳首を口に含めない: false,
  pre_C5_授乳時間異常: false,
  pre_C6_哺乳量回数ムラ: false,
  pre_C7_離乳首の握り確認不可: false,
  pre_C8_スプーン舌で押し出す: false,
  pre_C9_離乳進まない: false,
  pre_C10_口唇閉鎖不全: false,
  pre_C11_やせ肥満: false,
  pre_C12_口腔周囲過敏: false,
  pre_C13_その他問題点: false,
  pre_C13_その他問題点_詳細: '',

  // 離乳完了後
  post_C1_歯の萌出遅れ: false,
  post_C2_機能的歯列咬合異常: false,
  post_C3_咀嚼影響う蝕: false,
  post_C4_強く噛み締められない: false,
  post_C5_咀嚼時間異常: false,
  post_C6_偏咀嚼: false,
  post_C7_舌突出_乳児嚥下残存: false,
  post_C8_哺乳量食事量回数ムラ: false,
  post_C9_構音障害: false,
  post_C10_口唇閉鎖不全: false,
  post_C11_口腔習癖: false,
  post_C12_舌小帯異常: false,
  post_C13_やせ肥満: false,
  post_C14_口呼吸: false,
  post_C15_口蓋扁桃等肥大: false,
  post_C16_睡眠時いびき: false,
  post_C17_その他問題点: false,
  post_C17_その他問題点_詳細: '',
  post_口唇閉鎖力検査: '',

  currentWeight: '',
  currentHeight: '',
  birthWeight: '',
  birthHeight: '',
  kaupIndex: '',
  rorerIndex: '',

  symptoms_count: 0,
  diagnosis_result: '',
  can_diagnose: false,
  can_claim_management_fee: false,
  diagnosis_reason: '',
  management_fee_reason: '',
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

  const loadPatientData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
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
        let ageYears = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          ageYears--
        }

        // 月齢の計算（0-11ヶ月の範囲）
        let ageMonthsOnly = today.getMonth() - birthDate.getMonth()
        if (today.getDate() < birthDate.getDate()) {
          ageMonthsOnly--
        }
        if (ageMonthsOnly < 0) {
          ageMonthsOnly += 12
        }

        updates.age = `${ageYears}歳`
        updates.ageMonths = `${ageMonthsOnly}ヶ月`
        autoFields.add('age')
        autoFields.add('ageMonths')

        // 年齢による年齢区分の自動選択
        // 3歳以上の場合は離乳完了後を自動選択、それ以下は選択可能
        if (ageYears >= 3) {
          updates.ageCategory = 'post-weaning'
        } else {
          // 3歳未満の場合はデフォルトで離乳完了前を選択（ユーザーが変更可能）
          updates.ageCategory = 'pre-weaning'
        }
      }

      if (patient.address_line) {
        updates.address = patient.address_line
        autoFields.add('address')
      }

      if (patient.phone) {
        updates.phone = patient.phone
        autoFields.add('phone')
      }

      // 初回読み込み時はマージ、更新ボタンクリック時は強制上書き
      if (isInitialLoad) {
        setFormData(prev => ({ ...prev, ...updates }))
      } else {
        // 患者基本情報フィールドのみ強制上書き
        setFormData(prev => ({
          ...prev,
          ...updates
        }))
      }
      setAutoPopulatedFields(autoFields)

      if (!isInitialLoad) {
        alert('患者情報を更新しました')
      }
    } catch (error) {
      console.error('患者データの読み込みエラー:', error)
      alert('患者情報の読み込みに失敗しました')
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
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
        <title>口腔機能発達不全症 チェックリスト</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body {
            font-family: 'MS PGothic', 'MS Gothic', sans-serif;
            font-size: 8.5pt;
            line-height: 1.2;
            margin: 0;
            padding: 10px;
          }
          h1 {
            text-align: center;
            font-size: 13pt;
            margin: 3px 0;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            font-size: 8.5pt;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px 5px;
            text-align: center;
            vertical-align: middle;
            line-height: 1.4;
          }
          th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          .header-row {
            background-color: #e0e0e0;
          }
          .item-cell {
            text-align: left;
          }
          .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            margin-right: 5px;
            text-align: center;
            line-height: 12px;
          }
          .no-border {
            border: none;
          }
          .small-text {
            font-size: 7.5pt;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        ${generatePrintHTML()}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const generatePrintHTML = () => {
    const categoryTitle = formData.ageCategory === 'pre-weaning' ? '離乳完了前' : '離乳完了後'

    return `
      <h1>「口腔機能発達不全症」チェックリスト（${categoryTitle}）</h1>

      <div style="text-align: right; font-size: 8pt; margin-bottom: 5px;">
        記載日: ${formData.documentDate ? format(new Date(formData.documentDate), 'yyyy年MM月dd日') : ''}
      </div>

      <table>
        <tr>
          <th style="width: 60px;">氏名</th>
          <td style="width: 150px;">${formData.patientName}</td>
          <th style="width: 80px;">生年月日</th>
          <td style="width: 120px; font-size: 7pt;">${formData.birthDate ? format(new Date(formData.birthDate), 'yyyy/MM/dd') : ''}</td>
          <th style="width: 50px;">年齢</th>
          <td style="width: 100px;">${formData.age || ''}${formData.ageMonths ? ` ${formData.ageMonths}` : ''}</td>
        </tr>
      </table>

      <table style="margin-top: 15px;">
        <tr class="header-row">
          <th style="width: 60px;">A<br>機能</th>
          <th style="width: 100px;">B<br>分類</th>
          <th style="width: 400px;">C<br>項目</th>
          <th style="width: 80px;">D<br>該当項目</th>
          <th style="width: 80px;">管理の<br>必要性</th>
        </tr>
        ${formData.ageCategory === 'pre-weaning' ? `
        <tr>
          <td rowspan="9">食べる</td>
          <td rowspan="6">哺乳</td>
          <td class="item-cell">C-1 先天性歯がある</td>
          <td>${formData.pre_C1_先天性歯 ? '☑' : '☐'}</td>
          <td rowspan="6">${(formData.pre_C1_先天性歯 || formData.pre_C2_口唇歯槽形態異常 || formData.pre_C3_舌小帯異常 || formData.pre_C4_乳首を口に含めない || formData.pre_C5_授乳時間異常 || formData.pre_C6_哺乳量回数ムラ) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-2 口唇、歯槽の形態に異常がある（裂奇形など）</td>
          <td>${formData.pre_C2_口唇歯槽形態異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-3 舌小帯に異常がある</td>
          <td>${formData.pre_C3_舌小帯異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-4 乳首をしっかり口にふくむことができない</td>
          <td>${formData.pre_C4_乳首を口に含めない ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-5 授乳時間が長すぎる、短すぎる</td>
          <td>${formData.pre_C5_授乳時間異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-6 哺乳量・授乳回数が多すぎたり少なすぎたりムラがあるなど</td>
          <td>${formData.pre_C6_哺乳量回数ムラ ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="3">離乳</td>
          <td class="item-cell">C-7 開始しているが首の据わりが確認できない</td>
          <td>${formData.pre_C7_離乳首の握り確認不可 ? '☑' : '☐'}</td>
          <td rowspan="3">${(formData.pre_C7_離乳首の握り確認不可 || formData.pre_C8_スプーン舌で押し出す || formData.pre_C9_離乳進まない) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-8 スプーンを舌で押し出す状態がみられる</td>
          <td>${formData.pre_C8_スプーン舌で押し出す ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-9 離乳が進まない</td>
          <td>${formData.pre_C9_離乳進まない ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="1">話す</td>
          <td>構音機能</td>
          <td class="item-cell">C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</td>
          <td>${formData.pre_C10_口唇閉鎖不全 ? '☑' : '☐'}</td>
          <td>${formData.pre_C10_口唇閉鎖不全 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="3">その他</td>
          <td rowspan="2">栄養<br>（体格）</td>
          <td class="item-cell">C-11 やせ、または肥満である（カウプ指数で評価）*<br>
          <span class="small-text">現在 体重: ${formData.currentWeight}g 身長: ${formData.currentHeight}cm<br>
          出生時 体重: ${formData.birthWeight}g 身長: ${formData.birthHeight}cm<br>
          カウプ指数: ${formData.kaupIndex}</span></td>
          <td>${formData.pre_C11_やせ肥満 ? '☑' : '☐'}</td>
          <td rowspan="2">${(formData.pre_C11_やせ肥満 || formData.pre_C12_口腔周囲過敏) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-12 口腔周囲に過敏がある</td>
          <td>${formData.pre_C12_口腔周囲過敏 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td>その他</td>
          <td class="item-cell">C-13 上記以外の問題点<br>${formData.pre_C13_その他問題点_詳細 ? `（${formData.pre_C13_その他問題点_詳細}）` : ''}</td>
          <td>${formData.pre_C13_その他問題点 ? '☑' : '☐'}</td>
          <td>${formData.pre_C13_その他問題点 ? '☑' : '☐'}</td>
        </tr>
        ` : `
        <tr>
          <td rowspan="8">食べる</td>
          <td rowspan="6">咀嚼機能</td>
          <td class="item-cell">C-1 歯の萌出に遅れがある</td>
          <td>${formData.post_C1_歯の萌出遅れ ? '☑' : '☐'}</td>
          <td rowspan="6">${(formData.post_C1_歯の萌出遅れ || formData.post_C2_機能的歯列咬合異常 || formData.post_C3_咀嚼影響う蝕 || formData.post_C4_強く噛み締められない || formData.post_C5_咀嚼時間異常 || formData.post_C6_偏咀嚼) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-2 機能的因子による歯列・咬合の異常がある</td>
          <td>${formData.post_C2_機能的歯列咬合異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-3 咀嚼に影響するう蝕がある</td>
          <td>${formData.post_C3_咀嚼影響う蝕 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-4 強く噛みしめられない</td>
          <td>${formData.post_C4_強く噛み締められない ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-5 咀嚼時間が長すぎる、短すぎる</td>
          <td>${formData.post_C5_咀嚼時間異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-6 偏咀嚼がある</td>
          <td>${formData.post_C6_偏咀嚼 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td>嚥下機能</td>
          <td class="item-cell">C-7 舌の突出（乳児嚥下の残存）がみられる（離乳完了後）</td>
          <td>${formData.post_C7_舌突出_乳児嚥下残存 ? '☑' : '☐'}</td>
          <td>${formData.post_C7_舌突出_乳児嚥下残存 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td>食行動</td>
          <td class="item-cell">C-8 哺乳量・食べる量、回数が多すぎたり少なすぎたりムラがあるなど</td>
          <td>${formData.post_C8_哺乳量食事量回数ムラ ? '☑' : '☐'}</td>
          <td>${formData.post_C8_哺乳量食事量回数ムラ ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="4">話す</td>
          <td rowspan="4">構音機能</td>
          <td class="item-cell">C-9 構音に障害がある（音の置換、省略、歪みなどがある）</td>
          <td>${formData.post_C9_構音障害 ? '☑' : '☐'}</td>
          <td rowspan="4">${(formData.post_C9_構音障害 || formData.post_C10_口唇閉鎖不全 || formData.post_C11_口腔習癖 || formData.post_C12_舌小帯異常) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</td>
          <td>${formData.post_C10_口唇閉鎖不全 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-11 口腔習癖がある</td>
          <td>${formData.post_C11_口腔習癖 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-12 舌小帯に異常がある</td>
          <td>${formData.post_C12_舌小帯異常 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="5">その他</td>
          <td rowspan="2">栄養<br>（体格）</td>
          <td class="item-cell">C-13 やせ、または肥満である（カウプ指数、ローレル指数**で評価）<br>
          <span class="small-text">現在 体重: ${formData.currentWeight}kg 身長: ${formData.currentHeight}cm<br>
          カウプ指数・ローレル指数: ${formData.kaupIndex || formData.rorerIndex}</span></td>
          <td>${formData.post_C13_やせ肥満 ? '☑' : '☐'}</td>
          <td rowspan="2">${(formData.post_C13_やせ肥満 || formData.post_C14_口呼吸) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-14 口呼吸がある</td>
          <td>${formData.post_C14_口呼吸 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td rowspan="2">その他</td>
          <td class="item-cell">C-15 口蓋扁桃等に肥大がある</td>
          <td>${formData.post_C15_口蓋扁桃等肥大 ? '☑' : '☐'}</td>
          <td rowspan="2">${(formData.post_C15_口蓋扁桃等肥大 || formData.post_C16_睡眠時いびき) ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td class="item-cell">C-16 睡眠時のいびきがある</td>
          <td>${formData.post_C16_睡眠時いびき ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td>その他</td>
          <td class="item-cell">C-17 上記以外の問題点<br>${formData.post_C17_その他問題点_詳細 ? `（${formData.post_C17_その他問題点_詳細}）` : ''}</td>
          <td>${formData.post_C17_その他問題点 ? '☑' : '☐'}</td>
          <td>${formData.post_C17_その他問題点 ? '☑' : '☐'}</td>
        </tr>
        <tr>
          <td colspan="2">口唇閉鎖力検査</td>
          <td colspan="3">（ ${formData.post_口唇閉鎖力検査 || '_____'} N）</td>
        </tr>
        `}
      </table>
    `
  }

  const generateHTMLContent = () => {
    const categoryLabel = formData.ageCategory === 'pre-weaning' ? '離乳完了前' : '離乳完了後'

    let symptomsList = ''
    if (formData.ageCategory === 'pre-weaning') {
      symptomsList = `
        <h3>哺乳</h3>
        <ul>
          <li>${formData.pre_C1_先天性歯 ? '☑' : '☐'} C-1 先天性歯がある</li>
          <li>${formData.pre_C2_口唇歯槽形態異常 ? '☑' : '☐'} C-2 口唇、歯槽の形態に異常がある（裂奇形など）</li>
          <li>${formData.pre_C3_舌小帯異常 ? '☑' : '☐'} C-3 舌小帯に異常がある</li>
          <li>${formData.pre_C4_乳首を口に含めない ? '☑' : '☐'} C-4 乳首をしっかり口にふくむことができない</li>
          <li>${formData.pre_C5_授乳時間異常 ? '☑' : '☐'} C-5 授乳時間が長すぎる、短すぎる</li>
          <li>${formData.pre_C6_哺乳量回数ムラ ? '☑' : '☐'} C-6 哺乳量・授乳回数が多すぎたり少なすぎたりムラがあるなど</li>
        </ul>
        <h3>離乳</h3>
        <ul>
          <li>${formData.pre_C7_離乳首の握り確認不可 ? '☑' : '☐'} C-7 開始しているが首の据わりが確認できない</li>
          <li>${formData.pre_C8_スプーン舌で押し出す ? '☑' : '☐'} C-8 スプーンを舌で押し出す状態がみられる</li>
          <li>${formData.pre_C9_離乳進まない ? '☑' : '☐'} C-9 離乳が進まない</li>
        </ul>
        <h3>話す</h3>
        <ul>
          <li>${formData.pre_C10_口唇閉鎖不全 ? '☑' : '☐'} C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</li>
        </ul>
        <h3>その他</h3>
        <ul>
          <li>${formData.pre_C11_やせ肥満 ? '☑' : '☐'} C-11 やせ、または肥満である（カウプ指数で評価）</li>
          <li>${formData.pre_C12_口腔周囲過敏 ? '☑' : '☐'} C-12 口腔周囲に過敏がある</li>
          <li>${formData.pre_C13_その他問題点 ? '☑' : '☐'} C-13 上記以外の問題点${formData.pre_C13_その他問題点_詳細 ? `（${formData.pre_C13_その他問題点_詳細}）` : ''}</li>
        </ul>
      `
    } else {
      symptomsList = `
        <h3>咀嚼機能</h3>
        <ul>
          <li>${formData.post_C1_歯の萌出遅れ ? '☑' : '☐'} C-1 歯の萌出に遅れがある</li>
          <li>${formData.post_C2_機能的歯列咬合異常 ? '☑' : '☐'} C-2 機能的因子による歯列・咬合の異常がある</li>
          <li>${formData.post_C3_咀嚼影響う蝕 ? '☑' : '☐'} C-3 咀嚼に影響するう蝕がある</li>
          <li>${formData.post_C4_強く噛み締められない ? '☑' : '☐'} C-4 強く噛みしめられない</li>
          <li>${formData.post_C5_咀嚼時間異常 ? '☑' : '☐'} C-5 咀嚼時間が長すぎる、短すぎる</li>
          <li>${formData.post_C6_偏咀嚼 ? '☑' : '☐'} C-6 偏咀嚼がある</li>
        </ul>
        <h3>嚥下機能・食行動</h3>
        <ul>
          <li>${formData.post_C7_舌突出_乳児嚥下残存 ? '☑' : '☐'} C-7 舌の突出（乳児嚥下の残存）がみられる（離乳完了後）</li>
          <li>${formData.post_C8_哺乳量食事量回数ムラ ? '☑' : '☐'} C-8 哺乳量・食べる量、回数が多すぎたり少なすぎたりムラがあるなど</li>
        </ul>
        <h3>話す</h3>
        <ul>
          <li>${formData.post_C9_構音障害 ? '☑' : '☐'} C-9 構音に障害がある（音の置換、省略、歪みなどがある）</li>
          <li>${formData.post_C10_口唇閉鎖不全 ? '☑' : '☐'} C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</li>
          <li>${formData.post_C11_口腔習癖 ? '☑' : '☐'} C-11 口腔習癖がある</li>
          <li>${formData.post_C12_舌小帯異常 ? '☑' : '☐'} C-12 舌小帯に異常がある</li>
        </ul>
        <h3>その他</h3>
        <ul>
          <li>${formData.post_C13_やせ肥満 ? '☑' : '☐'} C-13 やせ、または肥満である（カウプ指数、ローレル指数で評価）</li>
          <li>${formData.post_C14_口呼吸 ? '☑' : '☐'} C-14 口呼吸がある</li>
          <li>${formData.post_C15_口蓋扁桃等肥大 ? '☑' : '☐'} C-15 口蓋扁桃等に肥大がある</li>
          <li>${formData.post_C16_睡眠時いびき ? '☑' : '☐'} C-16 睡眠時のいびきがある</li>
          <li>${formData.post_C17_その他問題点 ? '☑' : '☐'} C-17 上記以外の問題点${formData.post_C17_その他問題点_詳細 ? `（${formData.post_C17_その他問題点_詳細}）` : ''}</li>
        </ul>
        ${formData.post_口唇閉鎖力検査 ? `<p><strong>口唇閉鎖力検査:</strong> ${formData.post_口唇閉鎖力検査} N</p>` : ''}
      `
    }

    return `
      <h1>口腔機能発達不全症 チェックリスト</h1>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">（15歳未満対象）</p>

      <h2>総合判定</h2>
      <div style="background-color: ${formData.symptoms_count >= 1 ? '#fef2f2' : '#eff6ff'}; border: 2px solid ${formData.symptoms_count >= 1 ? '#fca5a5' : '#93c5fd'}; padding: 15px; margin: 10px 0; border-radius: 8px;">
        <div style="font-size: 14pt; font-weight: bold;">該当項目: ${formData.symptoms_count} 項目</div>
        <div style="font-size: 12pt; font-weight: bold; color: ${formData.symptoms_count >= 1 ? '#b91c1c' : '#1e40af'}; margin-top: 5px;">
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

      <h2>症状チェックリスト（年齢区分: ${categoryLabel}）</h2>
      ${symptomsList}
    `
  }

  const generatePlainText = () => {
    const categoryLabel = formData.ageCategory === 'pre-weaning' ? '離乳完了前' : '離乳完了後'

    let text = `口腔機能発達不全症 チェックリスト\n`
    text += `（15歳未満対象）\n\n`

    text += `【総合判定】\n`
    text += `該当項目: ${formData.symptoms_count} 項目\n`
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

    text += `【症状チェックリスト】（年齢区分: ${categoryLabel}）\n`

    if (formData.ageCategory === 'pre-weaning') {
      text += `\n哺乳:\n`
      text += `${formData.pre_C1_先天性歯 ? '☑' : '☐'} C-1 先天性歯がある\n`
      text += `${formData.pre_C2_口唇歯槽形態異常 ? '☑' : '☐'} C-2 口唇、歯槽の形態に異常がある（裂奇形など）\n`
      text += `${formData.pre_C3_舌小帯異常 ? '☑' : '☐'} C-3 舌小帯に異常がある\n`
      text += `${formData.pre_C4_乳首を口に含めない ? '☑' : '☐'} C-4 乳首をしっかり口にふくむことができない\n`
      text += `${formData.pre_C5_授乳時間異常 ? '☑' : '☐'} C-5 授乳時間が長すぎる、短すぎる\n`
      text += `${formData.pre_C6_哺乳量回数ムラ ? '☑' : '☐'} C-6 哺乳量・授乳回数が多すぎたり少なすぎたりムラがあるなど\n`
      text += `\n離乳:\n`
      text += `${formData.pre_C7_離乳首の握り確認不可 ? '☑' : '☐'} C-7 開始しているが首の据わりが確認できない\n`
      text += `${formData.pre_C8_スプーン舌で押し出す ? '☑' : '☐'} C-8 スプーンを舌で押し出す状態がみられる\n`
      text += `${formData.pre_C9_離乳進まない ? '☑' : '☐'} C-9 離乳が進まない\n`
      text += `\n話す:\n`
      text += `${formData.pre_C10_口唇閉鎖不全 ? '☑' : '☐'} C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）\n`
      text += `\nその他:\n`
      text += `${formData.pre_C11_やせ肥満 ? '☑' : '☐'} C-11 やせ、または肥満である（カウプ指数で評価）\n`
      text += `${formData.pre_C12_口腔周囲過敏 ? '☑' : '☐'} C-12 口腔周囲に過敏がある\n`
      text += `${formData.pre_C13_その他問題点 ? '☑' : '☐'} C-13 上記以外の問題点${formData.pre_C13_その他問題点_詳細 ? `（${formData.pre_C13_その他問題点_詳細}）` : ''}\n`
    } else {
      text += `\n咀嚼機能:\n`
      text += `${formData.post_C1_歯の萌出遅れ ? '☑' : '☐'} C-1 歯の萌出に遅れがある\n`
      text += `${formData.post_C2_機能的歯列咬合異常 ? '☑' : '☐'} C-2 機能的因子による歯列・咬合の異常がある\n`
      text += `${formData.post_C3_咀嚼影響う蝕 ? '☑' : '☐'} C-3 咀嚼に影響するう蝕がある\n`
      text += `${formData.post_C4_強く噛み締められない ? '☑' : '☐'} C-4 強く噛みしめられない\n`
      text += `${formData.post_C5_咀嚼時間異常 ? '☑' : '☐'} C-5 咀嚼時間が長すぎる、短すぎる\n`
      text += `${formData.post_C6_偏咀嚼 ? '☑' : '☐'} C-6 偏咀嚼がある\n`
      text += `\n嚥下機能・食行動:\n`
      text += `${formData.post_C7_舌突出_乳児嚥下残存 ? '☑' : '☐'} C-7 舌の突出（乳児嚥下の残存）がみられる（離乳完了後）\n`
      text += `${formData.post_C8_哺乳量食事量回数ムラ ? '☑' : '☐'} C-8 哺乳量・食べる量、回数が多すぎたり少なすぎたりムラがあるなど\n`
      text += `\n話す:\n`
      text += `${formData.post_C9_構音障害 ? '☑' : '☐'} C-9 構音に障害がある（音の置換、省略、歪みなどがある）\n`
      text += `${formData.post_C10_口唇閉鎖不全 ? '☑' : '☐'} C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）\n`
      text += `${formData.post_C11_口腔習癖 ? '☑' : '☐'} C-11 口腔習癖がある\n`
      text += `${formData.post_C12_舌小帯異常 ? '☑' : '☐'} C-12 舌小帯に異常がある\n`
      text += `\nその他:\n`
      text += `${formData.post_C13_やせ肥満 ? '☑' : '☐'} C-13 やせ、または肥満である（カウプ指数、ローレル指数で評価）\n`
      text += `${formData.post_C14_口呼吸 ? '☑' : '☐'} C-14 口呼吸がある\n`
      text += `${formData.post_C15_口蓋扁桃等肥大 ? '☑' : '☐'} C-15 口蓋扁桃等に肥大がある\n`
      text += `${formData.post_C16_睡眠時いびき ? '☑' : '☐'} C-16 睡眠時のいびきがある\n`
      text += `${formData.post_C17_その他問題点 ? '☑' : '☐'} C-17 上記以外の問題点${formData.post_C17_その他問題点_詳細 ? `（${formData.post_C17_その他問題点_詳細}）` : ''}\n`
      if (formData.post_口唇閉鎖力検査) {
        text += `\n口唇閉鎖力検査: ${formData.post_口唇閉鎖力検査} N\n`
      }
    }

    return text
  }

  useEffect(() => {
    loadPatientData(true)
  }, [patientId])

  useEffect(() => {
    if (document) {
      const content = document.content as Partial<FormData>
      setFormData(prev => {
        const updated = { ...prev, ...content }
        // ドキュメント読み込み後に判定を実行
        updateSymptomCount(updated)
        return updated
      })
      setAutoPopulatedFields(new Set())
    }
  }, [document])

  // 初期マウント時に判定を実行（新規作成時用）
  useEffect(() => {
    if (!document && !loading) {
      setFormData(prev => {
        const updated = { ...prev }
        updateSymptomCount(updated)
        return updated
      })
    }
  }, [loading])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: checked }
      updateSymptomCount(updated)
      return updated
    })
  }

  const updateSymptomCount = (data: FormData) => {
    let count = 0
    let canDiagnose = false
    let canClaimManagementFee = false
    let diagnosisReason = ''
    let managementFeeReason = ''

    if (data.ageCategory === 'pre-weaning') {
      // 離乳完了前のカウント
      if (data.pre_C1_先天性歯) count++
      if (data.pre_C2_口唇歯槽形態異常) count++
      if (data.pre_C3_舌小帯異常) count++
      if (data.pre_C4_乳首を口に含めない) count++
      if (data.pre_C5_授乳時間異常) count++
      if (data.pre_C6_哺乳量回数ムラ) count++
      if (data.pre_C7_離乳首の握り確認不可) count++
      if (data.pre_C8_スプーン舌で押し出す) count++
      if (data.pre_C9_離乳進まない) count++
      if (data.pre_C10_口唇閉鎖不全) count++
      if (data.pre_C11_やせ肥満) count++
      if (data.pre_C12_口腔周囲過敏) count++
      if (data.pre_C13_その他問題点) count++

      // 離乳完了前の診断基準
      // 「食べる」「話す」機能で2つ以上の該当項目があれば診断可能
      if (count >= 2) {
        canDiagnose = true
        diagnosisReason = '「食べる」「話す」機能で2つ以上の該当項目があります'
      } else if (count === 1) {
        diagnosisReason = '該当項目が1つのみです。診断には2つ以上必要です'
      } else {
        diagnosisReason = '該当項目がありません'
      }

      // 管理料算定基準
      // 評価項目において3項目以上に該当する小児
      if (count >= 3) {
        canClaimManagementFee = true
        managementFeeReason = '評価項目が3つ以上該当しています'
      } else if (count === 2) {
        managementFeeReason = '該当項目が2つです。管理料算定には3つ以上必要です'
      } else {
        managementFeeReason = '該当項目が不足しています（3つ以上必要）'
      }

    } else {
      // 離乳完了後のカウント
      // 咀嚼機能項目のカウント（C-1〜C-6）
      let masticationCount = 0
      if (data.post_C1_歯の萌出遅れ) { count++; masticationCount++ }
      if (data.post_C2_機能的歯列咬合異常) { count++; masticationCount++ }
      if (data.post_C3_咀嚼影響う蝕) { count++; masticationCount++ }
      if (data.post_C4_強く噛み締められない) { count++; masticationCount++ }
      if (data.post_C5_咀嚼時間異常) { count++; masticationCount++ }
      if (data.post_C6_偏咀嚼) { count++; masticationCount++ }

      // その他の項目
      if (data.post_C7_舌突出_乳児嚥下残存) count++
      if (data.post_C8_哺乳量食事量回数ムラ) count++
      if (data.post_C9_構音障害) count++
      if (data.post_C10_口唇閉鎖不全) count++
      if (data.post_C11_口腔習癖) count++
      if (data.post_C12_舌小帯異常) count++
      if (data.post_C13_やせ肥満) count++
      if (data.post_C14_口呼吸) count++
      if (data.post_C15_口蓋扁桃等肥大) count++
      if (data.post_C16_睡眠時いびき) count++
      if (data.post_C17_その他問題点) count++

      // 離乳完了後の診断基準
      // 咀嚼機能（C-1〜C-6）を1つ以上含み、「食べる」「話す」機能で2つ以上の該当項目
      if (masticationCount >= 1 && count >= 2) {
        canDiagnose = true
        diagnosisReason = `咀嚼機能項目を${masticationCount}つ含み、合計${count}つの該当項目があります`
      } else if (masticationCount === 0 && count >= 2) {
        diagnosisReason = '咀嚼機能項目（C-1〜C-6）が必須です。咀嚼機能項目を1つ以上含める必要があります'
      } else if (masticationCount >= 1 && count < 2) {
        diagnosisReason = `該当項目が${count}つのみです。診断には2つ以上必要です`
      } else {
        diagnosisReason = '咀嚼機能項目（C-1〜C-6）を1つ以上含み、合計2つ以上の該当項目が必要です'
      }

      // 管理料算定基準
      // 評価項目において3項目以上に該当する小児
      if (count >= 3) {
        canClaimManagementFee = true
        managementFeeReason = '評価項目が3つ以上該当しています'
      } else if (count === 2) {
        managementFeeReason = '該当項目が2つです。管理料算定には3つ以上必要です'
      } else {
        managementFeeReason = '該当項目が不足しています（3つ以上必要）'
      }
    }

    data.symptoms_count = count
    data.can_diagnose = canDiagnose
    data.can_claim_management_fee = canClaimManagementFee
    data.diagnosis_reason = diagnosisReason
    data.management_fee_reason = managementFeeReason
    data.diagnosis_result = canDiagnose ? '口腔機能発達不全症と診断可能' : '診断基準を満たしていません'
  }

  const handleAgeCategoryChange = (category: 'pre-weaning' | 'post-weaning') => {
    setFormData(prev => {
      const updated = { ...prev, ageCategory: category }
      updateSymptomCount(updated)
      return updated
    })
  }

  const calculateIndexes = (weight: string, height: string, birthWeight: string, birthHeight: string, ageCategory: 'pre-weaning' | 'post-weaning') => {
    if (!weight || !height) return

    const w = parseFloat(weight)
    const h = parseFloat(height)

    if (isNaN(w) || isNaN(h) || h === 0) return

    if (ageCategory === 'pre-weaning') {
      // カウプ指数: 体重(g) ÷ 身長(cm)² × 10
      const kaupIndex = (w / (h * h)) * 10
      const kaupValue = kaupIndex.toFixed(2)

      // 評価判定
      let evaluation = ''
      if (kaupIndex < 13) {
        evaluation = 'やせ'
      } else if (kaupIndex <= 17) {
        evaluation = '普通'
      } else {
        evaluation = '肥満'
      }

      setFormData(prev => ({
        ...prev,
        kaupIndex: `${kaupValue} (${evaluation})`,
        rorerIndex: ''
      }))
    } else {
      // 離乳完了後は年齢に応じて判断（5歳未満：カウプ、5歳以上：ローレル）
      // 年齢を取得
      const ageMatch = formData.age.match(/(\d+)/)
      const ageYears = ageMatch ? parseInt(ageMatch[1]) : 5

      if (ageYears < 5) {
        // カウプ指数: 体重(kg) ÷ 身長(cm)² × 10
        const kaupIndex = (w / (h * h)) * 10
        const kaupValue = kaupIndex.toFixed(2)

        let evaluation = ''
        if (kaupIndex < 13) {
          evaluation = 'やせ'
        } else if (kaupIndex <= 17) {
          evaluation = '普通'
        } else {
          evaluation = '肥満'
        }

        setFormData(prev => ({
          ...prev,
          kaupIndex: `${kaupValue} (${evaluation})`,
          rorerIndex: ''
        }))
      } else {
        // ローレル指数: 体重(kg) ÷ 身長(cm)³ × 10^7
        const rorerIndex = (w / (h * h * h)) * 10000000
        const rorerValue = rorerIndex.toFixed(2)

        let evaluation = ''
        if (rorerIndex < 100) {
          evaluation = 'やせ'
        } else if (rorerIndex <= 145) {
          evaluation = '普通'
        } else {
          evaluation = '肥満'
        }

        setFormData(prev => ({
          ...prev,
          rorerIndex: `${rorerValue} (${evaluation})`,
          kaupIndex: ''
        }))
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const title = '口腔機能発達不全症 診断書'
      const params = {
        clinic_id: clinicId,
        patient_id: patientId,
        document_type: '口腔機能発達不全症' as const,
        title,
        content: formData
      }

      if (document) {
        console.log('文書を更新:', { documentId: document.id, title })
        await updateMedicalDocument(document.id, { title, content: formData })
        console.log('文書更新完了')
      } else {
        console.log('新規文書を作成:', { title })
        await createMedicalDocument(params)
        console.log('文書作成完了')
      }

      onSave()
    } catch (error) {
      console.error('文書の保存エラー:', error)
      alert('文書の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const isAutoPopulated = (field: keyof FormData) => autoPopulatedFields.has(field)

  // 患者の年齢を取得
  const getPatientAgeYears = (): number => {
    if (!formData.birthDate) return 0
    const birthDate = new Date(formData.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const patientAgeYears = getPatientAgeYears()
  const canSelectAgeCategory = patientAgeYears < 3 // 3歳未満なら選択可能

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
            <h3 className="text-lg font-semibold text-gray-900">口腔機能発達不全症 チェックリスト</h3>
            <p className="text-sm text-gray-600">{document ? '文書を編集中' : '新規文書を作成中'} （15歳未満対象）</p>
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

      {/* 総合判定サマリー */}
      <Card className={formData.can_diagnose ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {formData.can_diagnose ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
            総合判定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-xl font-bold text-center">
              該当項目: {formData.symptoms_count} 項目
            </div>

            {/* 診断可否と管理料算定可否を横並び */}
            <div className="grid grid-cols-2 gap-4">
              {/* 診断可否 */}
              <div className={`p-4 rounded-lg border-2 ${formData.can_diagnose ? 'bg-red-100 border-red-400' : 'bg-gray-100 border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {formData.can_diagnose ? (
                    <CheckCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600" />
                  )}
                  <div className="font-bold text-base">
                    {formData.can_diagnose ? '✓ 診断可能' : '✗ 診断不可'}
                  </div>
                </div>
                <div className={`text-xs ${formData.can_diagnose ? 'text-red-800' : 'text-gray-700'}`}>
                  {formData.diagnosis_reason}
                </div>
              </div>

              {/* 管理料算定可否 */}
              <div className={`p-4 rounded-lg border-2 ${formData.can_claim_management_fee ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-300'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {formData.can_claim_management_fee ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-600" />
                  )}
                  <div className="font-bold text-base">
                    {formData.can_claim_management_fee ? '✓ 管理料算定可能' : '✗ 管理料算定不可'}
                  </div>
                </div>
                <div className={`text-xs ${formData.can_claim_management_fee ? 'text-green-800' : 'text-gray-700'}`}>
                  {formData.management_fee_reason}
                </div>
              </div>
            </div>

            {/* 診断基準の説明 */}
            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
              <div className="font-semibold mb-1">
                {formData.ageCategory === 'pre-weaning' ? '【離乳完了前の診断基準】' : '【離乳完了後の診断基準】'}
              </div>
              {formData.ageCategory === 'pre-weaning' ? (
                <ul className="list-disc list-inside space-y-1">
                  <li>診断: 「食べる」「話す」機能で2つ以上の該当項目</li>
                  <li>管理料算定: 評価項目3つ以上</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  <li>診断: 咀嚼機能（C-1〜C-6）を1つ以上含み、合計2つ以上の該当項目</li>
                  <li>管理料算定: 評価項目3つ以上</li>
                </ul>
              )}
            </div>
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
                  <Input value={formData.ageMonths} onChange={(e) => handleChange('ageMonths', e.target.value)} className={isAutoPopulated('ageMonths') ? 'bg-yellow-50' : ''} />
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

          {/* 体格・栄養評価 */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-base">体格・栄養評価（C-11/C-13用）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>現在の体重 ({formData.ageCategory === 'pre-weaning' ? 'g' : 'kg'})</Label>
                  <Input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => {
                      handleChange('currentWeight', e.target.value)
                      calculateIndexes(e.target.value, formData.currentHeight, formData.birthWeight, formData.birthHeight, formData.ageCategory)
                    }}
                    placeholder={formData.ageCategory === 'pre-weaning' ? '3500' : '18.5'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>現在の身長 (cm)</Label>
                  <Input
                    type="number"
                    value={formData.currentHeight}
                    onChange={(e) => {
                      handleChange('currentHeight', e.target.value)
                      calculateIndexes(formData.currentWeight, e.target.value, formData.birthWeight, formData.birthHeight, formData.ageCategory)
                    }}
                    placeholder="65.0"
                  />
                </div>
              </div>

              {formData.ageCategory === 'pre-weaning' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>出生時体重 (g)</Label>
                    <Input
                      type="number"
                      value={formData.birthWeight}
                      onChange={(e) => {
                        handleChange('birthWeight', e.target.value)
                        calculateIndexes(formData.currentWeight, formData.currentHeight, e.target.value, formData.birthHeight, formData.ageCategory)
                      }}
                      placeholder="3000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>出生時身長 (cm)</Label>
                    <Input
                      type="number"
                      value={formData.birthHeight}
                      onChange={(e) => {
                        handleChange('birthHeight', e.target.value)
                        calculateIndexes(formData.currentWeight, formData.currentHeight, formData.birthWeight, e.target.value, formData.ageCategory)
                      }}
                      placeholder="50.0"
                    />
                  </div>
                </div>
              )}

              {/* 指数表示 */}
              {(formData.kaupIndex || formData.rorerIndex) && (
                <div className="p-3 bg-white rounded border border-orange-300">
                  <div className="space-y-2">
                    {formData.ageCategory === 'pre-weaning' && formData.kaupIndex && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">カウプ指数:</span>
                          <span className="text-lg font-bold">{formData.kaupIndex}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          基準: やせ(&lt;13) / 普通(13-17) / 肥満(&gt;17)
                        </div>
                      </>
                    )}
                    {formData.ageCategory === 'post-weaning' && (formData.kaupIndex || formData.rorerIndex) && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">
                            {formData.rorerIndex ? 'ローレル指数:' : 'カウプ指数:'}
                          </span>
                          <span className="text-lg font-bold">{formData.rorerIndex || formData.kaupIndex}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {formData.rorerIndex ? (
                            <>基準: やせ(&lt;100) / 普通(100-145) / 肥満(&gt;145)</>
                          ) : (
                            <>基準: やせ(&lt;13) / 普通(13-17) / 肥満(&gt;17)</>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 年齢区分選択 */}
          <Card className="border-purple-200 bg-purple-50">
            <CardHeader>
              <CardTitle className="text-base">年齢区分（評価基準の選択）</CardTitle>
              {!canSelectAgeCategory && (
                <p className="text-xs text-purple-700 mt-1">※ 3歳以上のため、離乳完了後が自動選択されています</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 border rounded-lg ${canSelectAgeCategory ? 'cursor-pointer bg-white hover:bg-purple-50' : 'bg-gray-100 cursor-not-allowed'}`}>
                  <input
                    type="radio"
                    checked={formData.ageCategory === 'pre-weaning'}
                    onChange={() => handleAgeCategoryChange('pre-weaning')}
                    className="w-4 h-4"
                    disabled={!canSelectAgeCategory}
                  />
                  <div>
                    <div className="font-semibold">離乳完了前（0歳〜離乳食完了前）</div>
                    <div className="text-xs text-gray-600">哺乳、離乳に関する13項目</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg ${canSelectAgeCategory ? 'cursor-pointer bg-white hover:bg-purple-50' : 'bg-gray-100 cursor-not-allowed'}`}>
                  <input
                    type="radio"
                    checked={formData.ageCategory === 'post-weaning'}
                    onChange={() => handleAgeCategoryChange('post-weaning')}
                    className="w-4 h-4"
                    disabled={!canSelectAgeCategory}
                  />
                  <div>
                    <div className="font-semibold">離乳完了後（離乳食完了〜15歳未満）</div>
                    <div className="text-xs text-gray-600">咀嚼、構音、呼吸に関する17項目</div>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右カラム - チェックリスト */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                症状チェックリスト（該当: {formData.symptoms_count} 項目）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.ageCategory === 'pre-weaning' ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-3">【離乳完了前（別紙1）】</p>

                  <div className="space-y-2 border-l-4 border-blue-300 pl-3">
                    <p className="text-xs font-semibold text-blue-700">哺乳</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C1_先天性歯} onChange={(e) => handleCheckboxChange('pre_C1_先天性歯', e.target.checked)} className="w-4 h-4" />
                      <span>C-1 先天性歯がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C2_口唇歯槽形態異常} onChange={(e) => handleCheckboxChange('pre_C2_口唇歯槽形態異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-2 口唇、歯槽の形態に異常がある（裂奇形など）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C3_舌小帯異常} onChange={(e) => handleCheckboxChange('pre_C3_舌小帯異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-3 舌小帯に異常がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C4_乳首を口に含めない} onChange={(e) => handleCheckboxChange('pre_C4_乳首を口に含めない', e.target.checked)} className="w-4 h-4" />
                      <span>C-4 乳首をしっかり口にふくむことができない</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C5_授乳時間異常} onChange={(e) => handleCheckboxChange('pre_C5_授乳時間異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-5 授乳時間が長すぎる、短すぎる</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C6_哺乳量回数ムラ} onChange={(e) => handleCheckboxChange('pre_C6_哺乳量回数ムラ', e.target.checked)} className="w-4 h-4" />
                      <span>C-6 哺乳量・授乳回数が多すぎたり少なすぎたりムラがあるなど</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-green-300 pl-3">
                    <p className="text-xs font-semibold text-green-700">離乳</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C7_離乳首の握り確認不可} onChange={(e) => handleCheckboxChange('pre_C7_離乳首の握り確認不可', e.target.checked)} className="w-4 h-4" />
                      <span>C-7 開始しているが首の据わりが確認できない</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C8_スプーン舌で押し出す} onChange={(e) => handleCheckboxChange('pre_C8_スプーン舌で押し出す', e.target.checked)} className="w-4 h-4" />
                      <span>C-8 スプーンを舌で押し出す状態がみられる</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C9_離乳進まない} onChange={(e) => handleCheckboxChange('pre_C9_離乳進まない', e.target.checked)} className="w-4 h-4" />
                      <span>C-9 離乳が進まない</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-yellow-300 pl-3">
                    <p className="text-xs font-semibold text-yellow-700">話す</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C10_口唇閉鎖不全} onChange={(e) => handleCheckboxChange('pre_C10_口唇閉鎖不全', e.target.checked)} className="w-4 h-4" />
                      <span>C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-orange-300 pl-3">
                    <p className="text-xs font-semibold text-orange-700">その他</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C11_やせ肥満} onChange={(e) => handleCheckboxChange('pre_C11_やせ肥満', e.target.checked)} className="w-4 h-4" />
                      <span>C-11 やせ、または肥満である（カウプ指数で評価）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C12_口腔周囲過敏} onChange={(e) => handleCheckboxChange('pre_C12_口腔周囲過敏', e.target.checked)} className="w-4 h-4" />
                      <span>C-12 口腔周囲に過敏がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.pre_C13_その他問題点} onChange={(e) => handleCheckboxChange('pre_C13_その他問題点', e.target.checked)} className="w-4 h-4" />
                      <span>C-13 上記以外の問題点</span>
                    </label>
                    {formData.pre_C13_その他問題点 && (
                      <Textarea
                        value={formData.pre_C13_その他問題点_詳細}
                        onChange={(e) => handleChange('pre_C13_その他問題点_詳細', e.target.value)}
                        rows={2}
                        placeholder="詳細を記入してください"
                        className="text-sm"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-3">【離乳完了後（別紙2）】</p>

                  <div className="space-y-2 border-l-4 border-blue-300 pl-3">
                    <p className="text-xs font-semibold text-blue-700">咀嚼機能</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C1_歯の萌出遅れ} onChange={(e) => handleCheckboxChange('post_C1_歯の萌出遅れ', e.target.checked)} className="w-4 h-4" />
                      <span>C-1 歯の萌出に遅れがある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C2_機能的歯列咬合異常} onChange={(e) => handleCheckboxChange('post_C2_機能的歯列咬合異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-2 機能的因子による歯列・咬合の異常がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C3_咀嚼影響う蝕} onChange={(e) => handleCheckboxChange('post_C3_咀嚼影響う蝕', e.target.checked)} className="w-4 h-4" />
                      <span>C-3 咀嚼に影響するう蝕がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C4_強く噛み締められない} onChange={(e) => handleCheckboxChange('post_C4_強く噛み締められない', e.target.checked)} className="w-4 h-4" />
                      <span>C-4 強く噛みしめられない</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C5_咀嚼時間異常} onChange={(e) => handleCheckboxChange('post_C5_咀嚼時間異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-5 咀嚼時間が長すぎる、短すぎる</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C6_偏咀嚼} onChange={(e) => handleCheckboxChange('post_C6_偏咀嚼', e.target.checked)} className="w-4 h-4" />
                      <span>C-6 偏咀嚼がある</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-green-300 pl-3">
                    <p className="text-xs font-semibold text-green-700">嚥下機能・食行動</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C7_舌突出_乳児嚥下残存} onChange={(e) => handleCheckboxChange('post_C7_舌突出_乳児嚥下残存', e.target.checked)} className="w-4 h-4" />
                      <span>C-7 舌の突出（乳児嚥下の残存）がみられる（離乳完了後）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C8_哺乳量食事量回数ムラ} onChange={(e) => handleCheckboxChange('post_C8_哺乳量食事量回数ムラ', e.target.checked)} className="w-4 h-4" />
                      <span>C-8 哺乳量・食べる量、回数が多すぎたり少なすぎたりムラがあるなど</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-yellow-300 pl-3">
                    <p className="text-xs font-semibold text-yellow-700">話す</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C9_構音障害} onChange={(e) => handleCheckboxChange('post_C9_構音障害', e.target.checked)} className="w-4 h-4" />
                      <span>C-9 構音に障害がある（音の置換、省略、歪みなどがある）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C10_口唇閉鎖不全} onChange={(e) => handleCheckboxChange('post_C10_口唇閉鎖不全', e.target.checked)} className="w-4 h-4" />
                      <span>C-10 口唇の閉鎖不全がある（安静時に口唇閉鎖を認めない）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C11_口腔習癖} onChange={(e) => handleCheckboxChange('post_C11_口腔習癖', e.target.checked)} className="w-4 h-4" />
                      <span>C-11 口腔習癖がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C12_舌小帯異常} onChange={(e) => handleCheckboxChange('post_C12_舌小帯異常', e.target.checked)} className="w-4 h-4" />
                      <span>C-12 舌小帯に異常がある</span>
                    </label>
                  </div>

                  <div className="space-y-2 border-l-4 border-orange-300 pl-3">
                    <p className="text-xs font-semibold text-orange-700">その他</p>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C13_やせ肥満} onChange={(e) => handleCheckboxChange('post_C13_やせ肥満', e.target.checked)} className="w-4 h-4" />
                      <span>C-13 やせ、または肥満である（カウプ指数、ローレル指数で評価）</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C14_口呼吸} onChange={(e) => handleCheckboxChange('post_C14_口呼吸', e.target.checked)} className="w-4 h-4" />
                      <span>C-14 口呼吸がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C15_口蓋扁桃等肥大} onChange={(e) => handleCheckboxChange('post_C15_口蓋扁桃等肥大', e.target.checked)} className="w-4 h-4" />
                      <span>C-15 口蓋扁桃等に肥大がある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C16_睡眠時いびき} onChange={(e) => handleCheckboxChange('post_C16_睡眠時いびき', e.target.checked)} className="w-4 h-4" />
                      <span>C-16 睡眠時のいびきがある</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={formData.post_C17_その他問題点} onChange={(e) => handleCheckboxChange('post_C17_その他問題点', e.target.checked)} className="w-4 h-4" />
                      <span>C-17 上記以外の問題点</span>
                    </label>
                    {formData.post_C17_その他問題点 && (
                      <Textarea
                        value={formData.post_C17_その他問題点_詳細}
                        onChange={(e) => handleChange('post_C17_その他問題点_詳細', e.target.value)}
                        rows={2}
                        placeholder="詳細を記入してください"
                        className="text-sm"
                      />
                    )}
                  </div>

                  {formData.ageCategory === 'post-weaning' && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">口唇閉鎖力検査</Label>
                      <Input
                        value={formData.post_口唇閉鎖力検査}
                        onChange={(e) => handleChange('post_口唇閉鎖力検査', e.target.value)}
                        placeholder="測定値（N）を入力"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
