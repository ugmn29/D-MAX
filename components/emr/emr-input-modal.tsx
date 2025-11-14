/**
 * EMR入力モーダル（歯式図ベース）
 * EMR Input Modal with Dental Chart
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { DentalChart } from '@/components/patients/visual/dental-chart'
import type { VisualToothData } from '@/lib/api/visual-exams'
import type { DiseaseCode, TreatmentCode } from '@/types/emr'

// 全ての歯番号（32本）
const ALL_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

interface ToothDiseaseEntry {
  tooth_number: number
  disease_code_id: string
  disease_code: string
  disease_name: string
  is_primary: boolean
  notes?: string
}

interface TreatmentEntry {
  treatment_code_id: string
  treatment_code: string
  treatment_name: string
  tooth_numbers: number[]
  quantity: number
  points: number
  notes?: string
}

interface EMRInputModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  clinicId: string
  onSave: (data: any) => void
}

type Step = 'tooth_disease' | 'treatment' | 'soap'

export function EMRInputModal({
  isOpen,
  onClose,
  patientId,
  clinicId,
  onSave
}: EMRInputModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('tooth_disease')

  // 歯式図の状態（選択表示用）
  const [toothDataMap, setToothDataMap] = useState<Record<number, VisualToothData>>(() => {
    const map: Record<number, VisualToothData> = {}
    ALL_TEETH.forEach(toothNumber => {
      map[toothNumber] = {
        tooth_number: toothNumber,
        status: 'healthy',
      }
    })
    return map
  })

  // 選択中の歯
  const [selectedTeeth, setSelectedTeeth] = useState<Set<number>>(new Set())

  // 歯と病名の関連付け
  const [toothDiseases, setToothDiseases] = useState<ToothDiseaseEntry[]>([])

  // 病名カテゴリー選択
  const [selectedDiseaseCategory, setSelectedDiseaseCategory] = useState<string>('c')

  // 処置
  const [treatments, setTreatments] = useState<TreatmentEntry[]>([])
  const [selectedTreatmentCategory, setSelectedTreatmentCategory] = useState<string>('filling')

  // SOAP
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [visitType, setVisitType] = useState<'initial' | 'regular' | 'emergency' | 'home_visit'>('regular')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  // よく使う病名プリセット
  const diseasePresets: Record<string, Array<{ code: string; name: string; id: string }>> = {
    c: [
      { id: 'c1', code: 'C1', name: 'う蝕第1度' },
      { id: 'c2', code: 'C2', name: 'う蝕第2度' },
      { id: 'c3', code: 'C3', name: 'う蝕第3度' },
      { id: 'c4', code: 'C4', name: 'う蝕第4度' },
      { id: 'co', code: 'CO', name: '初期う蝕' },
      { id: 'c2_pulp', code: 'C2Pu', name: 'う蝕第2度単純性歯髄炎' },
    ],
    p: [
      { id: 'p1', code: 'P1', name: '歯周病第1度（歯肉炎）' },
      { id: 'p2', code: 'P2', name: '歯周病第2度（軽度歯周炎）' },
      { id: 'p3', code: 'P3', name: '歯周病第3度（中等度歯周炎）' },
      { id: 'p4', code: 'P4', name: '歯周病第4度（重度歯周炎）' },
      { id: 'p_急性', code: 'P急', name: '急性歯周炎' },
    ],
    extraction: [
      { id: 'ext_c4', code: 'ExtC4', name: '残根（抜歯適応）' },
      { id: 'ext_p4', code: 'ExtP4', name: '高度歯周病（抜歯適応）' },
      { id: 'pericoronitis', code: 'Perico', name: '智歯周囲炎' },
      { id: 'impacted', code: 'Imp', name: '埋伏歯' },
      { id: 'impacted_wisdom', code: 'ImpWis', name: '埋伏智歯' },
      { id: 'horizontal_impaction', code: 'HorImp', name: '水平埋伏' },
      { id: 'partial_impaction', code: 'PartImp', name: '半埋伏' },
      { id: 'complete_impaction', code: 'CompImp', name: '完全埋伏' },
    ],
    pulp: [
      { id: 'pulpitis', code: 'Pu', name: '歯髄炎' },
      { id: 'pulp_necrosis', code: 'Pn', name: '歯髄壊死' },
      { id: 'pulp_gangrene', code: 'Pg', name: '歯髄壊疽' },
      { id: 'c2_pulp_simple', code: 'C2Pus', name: 'う蝕第2度単純性歯髄炎' },
      { id: 'c3_pulp', code: 'C3Pu', name: 'う蝕第3度歯髄炎' },
    ],
    periapical: [
      { id: 'per', code: 'Per', name: '根尖性歯周炎' },
      { id: 'per_acute', code: 'Pera', name: '急性根尖性歯周炎' },
      { id: 'per_chronic', code: 'Perc', name: '慢性根尖性歯周炎' },
      { id: 'periapical_abscess', code: 'Pab', name: '根尖性歯周膿瘍' },
    ],
    detachment: [
      { id: 'crown_off', code: 'CrOff', name: '冠脱離' },
      { id: 'inlay_off', code: 'InOff', name: 'インレー脱離' },
      { id: 'bridge_off', code: 'BrOff', name: 'ブリッジ脱離' },
      { id: 'filling_off', code: 'FiOff', name: '充填物脱離' },
    ],
    other: [
      { id: 'missing', code: 'MT', name: '欠損（Missing Tooth）' },
      { id: 'wisdom', code: 'Wis', name: '智歯' },
      { id: 'fracture', code: 'Fr', name: '歯牙破折' },
      { id: 'crack', code: 'Cr', name: 'クラック' },
    ],
  }

  // よく使う処置プリセット
  const treatmentPresets: Record<string, Array<{ code: string; name: string; id: string; points: number }>> = {
    filling: [
      // 形成料（M001-3）
      { id: 'formation_simple', code: '140000310', name: '窩洞形成（単純なもの）', points: 60 },
      { id: 'formation_complex', code: '140000410', name: '窩洞形成（複雑なもの）', points: 86 },

      // 充填料（M009）
      { id: 'filling_1_simple', code: '140009110', name: '充填１（単純なもの）※CR', points: 106 },
      { id: 'filling_1_complex', code: '140009210', name: '充填１（複雑なもの）※CR', points: 158 },
      { id: 'filling_2_simple', code: '140009310', name: '充填２（単純なもの）', points: 59 },
      { id: 'filling_2_complex', code: '140009410', name: '充填２（複雑なもの）', points: 107 },

      // 形成・充填一体（M001-2）
      { id: 'immediate_filling', code: '140000210', name: 'う蝕歯即時充填形成', points: 128 },

      // 材料代（M100）- 歯科充填用材料Ⅰ（充填１用）
      { id: 'material_1_simple', code: '140100110', name: '複合レジン系（単純なもの）', points: 11 },
      { id: 'material_1_complex', code: '140100120', name: '複合レジン系（複雑なもの）', points: 29 },
      // 材料代（M100）- 歯科充填用材料Ⅱ（充填２用）
      { id: 'material_2_simple', code: '140100210', name: '複合レジン系（単純なもの）', points: 4 },
      { id: 'material_2_complex', code: '140100220', name: '複合レジン系（複雑なもの）', points: 11 },

      // その他
      { id: 'filling_in', code: '00410', name: 'インレー（金属）', points: 198 },
      { id: 'filling_in_cr', code: '00420', name: 'インレー（CAD/CAM）', points: 888 },
    ],
    endo: [
      { id: 'endo_pulpotomy', code: '01110', name: '抜髄（単根管）', points: 240 },
      { id: 'endo_pulpotomy_2', code: '01120', name: '抜髄（2根管）', points: 360 },
      { id: 'endo_pulpotomy_3', code: '01130', name: '抜髄（3根管）', points: 480 },
      { id: 'endo_root', code: '01210', name: '感染根管処置（単根管）', points: 180 },
      { id: 'endo_root_2', code: '01220', name: '感染根管処置（2根管）', points: 270 },
      { id: 'endo_root_3', code: '01230', name: '感染根管処置（3根管）', points: 360 },
    ],
    crown: [
      { id: 'crown_metal', code: '02110', name: '全部金属冠（前装なし）', points: 640 },
      { id: 'crown_fcr', code: '02120', name: '前装金属冠', points: 1248 },
      { id: 'crown_cad', code: '02130', name: 'CAD/CAM冠', points: 2838 },
      { id: 'crown_core', code: '02210', name: '支台築造（メタルコア）', points: 160 },
      { id: 'crown_fiber', code: '02220', name: '支台築造（ファイバーコア）', points: 248 },
    ],
    extraction: [
      { id: 'ext_simple', code: '03110', name: '抜歯（単純）', points: 130 },
      { id: 'ext_difficult', code: '03120', name: '抜歯（困難）', points: 270 },
      { id: 'ext_wisdom', code: '03210', name: '難抜歯（埋伏歯）', points: 1050 },
      { id: 'ext_wisdom_horizontal', code: '03220', name: '難抜歯（水平埋伏）', points: 1150 },
    ],
    perio: [
      { id: 'perio_scaling', code: '04110', name: 'スケーリング（1/3顎）', points: 68 },
      { id: 'perio_rp', code: '04120', name: 'ルートプレーニング（1歯）', points: 60 },
      { id: 'perio_flap', code: '04210', name: 'フラップ手術（1歯）', points: 660 },
    ],
    prosthesis: [
      { id: 'denture_partial', code: '05110', name: '部分床義歯（レジン床）', points: 1140 },
      { id: 'denture_full', code: '05120', name: '全部床義歯（レジン床）', points: 1680 },
      { id: 'bridge_3', code: '05210', name: 'ブリッジ（3歯）', points: 3840 },
    ],
    other: [
      { id: 'exam_initial', code: '06110', name: '初診料', points: 288 },
      { id: 'exam_regular', code: '06120', name: '再診料', points: 53 },
      { id: 'xray_small', code: '06210', name: 'デンタル撮影', points: 58 },
      { id: 'xray_panorama', code: '06220', name: 'パノラマ撮影', points: 402 },
    ],
  }

  // 歯をクリック
  const handleToothClick = (toothNumber: number) => {
    const newSelection = new Set(selectedTeeth)
    if (newSelection.has(toothNumber)) {
      newSelection.delete(toothNumber)
    } else {
      newSelection.add(toothNumber)
    }
    setSelectedTeeth(newSelection)
  }

  // 選択中の歯に病名を追加（プリセットから）
  const handleAddDiseaseToSelectedTeeth = (disease: { code: string; name: string; id: string }) => {
    if (selectedTeeth.size === 0) {
      alert('歯を選択してください')
      return
    }

    const newEntries: ToothDiseaseEntry[] = Array.from(selectedTeeth).map(toothNumber => ({
      tooth_number: toothNumber,
      disease_code_id: disease.id,
      disease_code: disease.code,
      disease_name: disease.name,
      is_primary: false,
      notes: ''
    }))

    setToothDiseases([...toothDiseases, ...newEntries])

    // 歯式図の色を更新（病名付き歯は赤系に）
    const newToothDataMap = { ...toothDataMap }
    selectedTeeth.forEach(toothNumber => {
      newToothDataMap[toothNumber] = {
        ...newToothDataMap[toothNumber],
        status: 'caries',
        caries_level: disease.code.includes('C') ? disease.code.substring(0, 2) as any : 'C2'
      }
    })
    setToothDataMap(newToothDataMap)
  }

  // 病名エントリーを削除
  const handleRemoveToothDisease = (index: number) => {
    const removed = toothDiseases[index]
    const newToothDiseases = toothDiseases.filter((_, i) => i !== index)
    setToothDiseases(newToothDiseases)

    // その歯に他の病名がなければ健全に戻す
    const hasOtherDisease = newToothDiseases.some(d => d.tooth_number === removed.tooth_number)
    if (!hasOtherDisease) {
      const newToothDataMap = { ...toothDataMap }
      newToothDataMap[removed.tooth_number] = {
        ...newToothDataMap[removed.tooth_number],
        status: 'healthy'
      }
      setToothDataMap(newToothDataMap)
    }
  }

  // 処置を追加（プリセットから）
  const handleAddTreatment = (treatment: { code: string; name: string; id: string; points: number }) => {
    const newTreatment: TreatmentEntry = {
      treatment_code_id: treatment.id,
      treatment_code: treatment.code,
      treatment_name: treatment.name,
      tooth_numbers: Array.from(selectedTeeth),
      quantity: 1,
      points: treatment.points,
      notes: ''
    }

    setTreatments([...treatments, newTreatment])
  }

  // 処置を削除
  const handleRemoveTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index))
  }

  // ステップを進める
  const handleNextStep = () => {
    if (currentStep === 'tooth_disease') {
      if (toothDiseases.length === 0) {
        alert('病名を1つ以上設定してください')
        return
      }
      setCurrentStep('treatment')
    } else if (currentStep === 'treatment') {
      setCurrentStep('soap')
    }
  }

  // ステップを戻る
  const handlePrevStep = () => {
    if (currentStep === 'treatment') {
      setCurrentStep('tooth_disease')
    } else if (currentStep === 'soap') {
      setCurrentStep('treatment')
    }
  }

  // 保存
  const handleSave = () => {
    // 病名データを整形（歯番号ごとにグループ化）
    const diseasesByTooth: { [key: number]: ToothDiseaseEntry[] } = {}
    toothDiseases.forEach(entry => {
      if (!diseasesByTooth[entry.tooth_number]) {
        diseasesByTooth[entry.tooth_number] = []
      }
      diseasesByTooth[entry.tooth_number].push(entry)
    })

    // 病名配列を構築
    const diseases = toothDiseases.map(entry => ({
      disease_code_id: entry.disease_code_id,
      disease_name: entry.disease_name,
      disease_code: entry.disease_code,
      tooth_numbers: [entry.tooth_number],
      is_primary: entry.is_primary,
      notes: entry.notes
    }))

    // 処置配列を構築
    const treatmentsList = treatments.map(t => ({
      treatment_code_id: t.treatment_code_id,
      treatment_name: t.treatment_name,
      treatment_code: t.treatment_code,
      tooth_numbers: t.tooth_numbers,
      quantity: t.quantity,
      points: t.points,
      notes: t.notes
    }))

    // 合計点数を計算
    const totalPoints = treatments.reduce((sum, t) => sum + (t.points * t.quantity), 0)

    const recordData = {
      visit_date: visitDate,
      visit_type: visitType,
      diseases,
      treatments: treatmentsList,
      prescriptions: [],
      subjective,
      objective,
      assessment,
      plan,
      total_points: totalPoints
    }

    console.log('🔍 EMR Input Modal - Sending data:', recordData)
    console.log('🔍 Diseases:', JSON.stringify(diseases, null, 2))
    console.log('🔍 Treatments:', JSON.stringify(treatmentsList, null, 2))

    onSave(recordData)
    handleClose()
  }

  // モーダルを閉じる
  const handleClose = () => {
    // 状態をリセット
    setCurrentStep('tooth_disease')
    setSelectedTeeth(new Set())
    setToothDiseases([])
    setTreatments([])
    setSubjective('')
    setObjective('')
    setAssessment('')
    setPlan('')

    // 歯式図をリセット
    const map: Record<number, VisualToothData> = {}
    ALL_TEETH.forEach(toothNumber => {
      map[toothNumber] = {
        tooth_number: toothNumber,
        status: 'healthy',
      }
    })
    setToothDataMap(map)

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">新規カルテ入力</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* ステップインジケーター */}
        <div className="flex items-center gap-2 px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 'tooth_disease' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="font-semibold">1. 歯式・病名選択</span>
          </div>
          <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 'treatment' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="font-semibold">2. 処置選択</span>
          </div>
          <div className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            currentStep === 'soap' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="font-semibold">3. SOAP入力</span>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左側：歯式図（常に表示） */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">歯式図（32マス）</h3>
            <p className="text-sm text-gray-600 mb-4">
              {currentStep === 'tooth_disease' && '歯をクリックして選択し、病名を設定してください'}
              {currentStep === 'treatment' && '処置を行う歯を選択してください（任意）'}
              {currentStep === 'soap' && '選択した歯は赤色で表示されます'}
            </p>
            <DentalChart
              toothData={toothDataMap}
              selectedTeeth={selectedTeeth}
              onToothClick={handleToothClick}
            />
          </div>

          {/* 右側：入力エリア */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {/* ステップ1: 歯式・病名選択 */}
            {currentStep === 'tooth_disease' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">よく使う病名</h3>

                  {/* 2列レイアウト：左側カテゴリー、右側候補 */}
                  <div className="flex gap-3 mb-4">
                    {/* 左側：カテゴリー一覧（縦並び） */}
                    <div className="w-40 flex-shrink-0 space-y-1">
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('c')}
                        onClick={() => setSelectedDiseaseCategory('c')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'c'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        C関連（う蝕）
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('p')}
                        onClick={() => setSelectedDiseaseCategory('p')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'p'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        P関連（歯周病）
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('pulp')}
                        onClick={() => setSelectedDiseaseCategory('pulp')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'pulp'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Pul（歯髄炎）
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('periapical')}
                        onClick={() => setSelectedDiseaseCategory('periapical')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'periapical'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Per（根尖性）
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('extraction')}
                        onClick={() => setSelectedDiseaseCategory('extraction')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'extraction'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        抜歯関連
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('detachment')}
                        onClick={() => setSelectedDiseaseCategory('detachment')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'detachment'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        脱離系
                      </button>
                      <button
                        onMouseEnter={() => setSelectedDiseaseCategory('other')}
                        onClick={() => setSelectedDiseaseCategory('other')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDiseaseCategory === 'other'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        その他
                      </button>
                    </div>

                    {/* 右側：病名候補一覧 */}
                    <div className="flex-1 grid grid-cols-1 gap-2 content-start">
                      {diseasePresets[selectedDiseaseCategory]?.map((disease) => (
                        <button
                          key={disease.id}
                          onClick={() => handleAddDiseaseToSelectedTeeth(disease)}
                          className="text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-blue-100 hover:border-blue-600 hover:shadow-md transition-all duration-150"
                        >
                          <div className="font-medium text-sm text-gray-900">{disease.name}</div>
                          <div className="text-xs text-gray-500">{disease.code}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 設定済み病名リスト */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    設定済み病名 ({toothDiseases.length}件)
                  </h3>
                  {toothDiseases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      歯を選択して病名を追加してください
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {toothDiseases.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-lg flex items-center justify-center font-bold">
                            {entry.tooth_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{entry.disease_name}</div>
                            <div className="text-xs text-gray-500">{entry.disease_code}</div>
                          </div>
                          <button
                            onClick={() => handleRemoveToothDisease(index)}
                            className="flex-shrink-0 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ステップ2: 処置選択 */}
            {currentStep === 'treatment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">よく使う処置</h3>

                  {/* 2列レイアウト：左側カテゴリー、右側候補 */}
                  <div className="flex gap-3 mb-4">
                    {/* 左側：カテゴリー一覧（縦並び） */}
                    <div className="w-40 flex-shrink-0 space-y-1">
                      <button
                        onClick={() => setSelectedTreatmentCategory('filling')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'filling'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        充填
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('endo')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'endo'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        根管治療
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('crown')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'crown'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        冠・支台築造
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('extraction')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'extraction'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        抜歯
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('perio')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'perio'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        歯周治療
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('prosthesis')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'prosthesis'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        補綴
                      </button>
                      <button
                        onClick={() => setSelectedTreatmentCategory('other')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTreatmentCategory === 'other'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        その他
                      </button>
                    </div>

                    {/* 右側：処置候補一覧 */}
                    <div className="flex-1 space-y-4 content-start">
                      {selectedTreatmentCategory === 'filling' ? (
                        // 充填の場合：形成料・充填料・材料代に分けて表示
                        <>
                          {/* 形成料セクション */}
                          <div className="border-l-4 border-orange-500 pl-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-orange-700">① 形成料（M001-3 窩洞形成）</h4>
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">単純=隣接面なし / 複雑=隣接面あり</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {treatmentPresets.filling.filter(t => t.code === '140000310' || t.code === '140000410').map((treatment) => (
                                <button
                                  key={treatment.id}
                                  onClick={() => handleAddTreatment(treatment)}
                                  className="text-left px-3 py-2 border border-orange-200 bg-orange-50 rounded-lg hover:bg-orange-100 hover:border-orange-400 hover:shadow-md transition-all duration-150"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-orange-600 ml-2 flex-shrink-0">
                                      {treatment.points}点
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 充填料セクション */}
                          <div className="border-l-4 border-blue-500 pl-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-blue-700">② 充填料（M009 充填）</h4>
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">充填１=CR（歯面処理あり） / 充填２=その他</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {treatmentPresets.filling.filter(t => t.code.startsWith('140009')).map((treatment) => (
                                <button
                                  key={treatment.id}
                                  onClick={() => handleAddTreatment(treatment)}
                                  className="text-left px-3 py-2 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 hover:border-blue-400 hover:shadow-md transition-all duration-150"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-blue-600 ml-2 flex-shrink-0">
                                      {treatment.points}点
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 形成・充填一体セクション */}
                          <div className="border-l-4 border-purple-500 pl-3">
                            <h4 className="text-sm font-bold text-purple-700 mb-2">③ 形成・充填一体（M001-2）</h4>
                            <div className="space-y-2">
                              {treatmentPresets.filling.filter(t => t.code === '140000210').map((treatment) => (
                                <button
                                  key={treatment.id}
                                  onClick={() => handleAddTreatment(treatment)}
                                  className="w-full text-left px-3 py-2 border border-purple-200 bg-purple-50 rounded-lg hover:bg-purple-100 hover:border-purple-400 hover:shadow-md transition-all duration-150"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-purple-600">
                                      {treatment.points}点
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 材料代セクション */}
                          <div className="border-l-4 border-green-500 pl-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-green-700">④ 材料代（M100 特定保険医療材料）</h4>
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">材料価格÷10円=点数</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {treatmentPresets.filling.filter(t => t.code.startsWith('1401000')).map((treatment) => (
                                <button
                                  key={treatment.id}
                                  onClick={() => handleAddTreatment(treatment)}
                                  className="text-left px-3 py-2 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 hover:border-green-400 hover:shadow-md transition-all duration-150"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                    </div>
                                    <div className="text-sm font-semibold text-green-600 ml-2 flex-shrink-0">
                                      {treatment.points}点
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* その他（インレー等）セクション */}
                          {treatmentPresets.filling.filter(t => !t.code.startsWith('140000') && !t.code.startsWith('140009') && !t.code.startsWith('1401000')).length > 0 && (
                            <div className="border-l-4 border-gray-400 pl-3">
                              <h4 className="text-sm font-bold text-gray-700 mb-2">⑤ その他</h4>
                              <div className="space-y-2">
                                {treatmentPresets.filling.filter(t => !t.code.startsWith('140000') && !t.code.startsWith('140009') && !t.code.startsWith('1401000')).map((treatment) => (
                                  <button
                                    key={treatment.id}
                                    onClick={() => handleAddTreatment(treatment)}
                                    className="w-full text-left px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg hover:bg-gray-100 hover:border-gray-400 hover:shadow-md transition-all duration-150"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                      </div>
                                      <div className="text-sm font-semibold text-gray-600">
                                        {treatment.points}点
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        // その他のカテゴリーは通常表示
                        <div className="grid grid-cols-1 gap-2">
                          {treatmentPresets[selectedTreatmentCategory]?.map((treatment) => (
                            <button
                              key={treatment.id}
                              onClick={() => handleAddTreatment(treatment)}
                              className="text-left px-3 py-2 border border-gray-300 rounded-lg hover:bg-blue-100 hover:border-blue-600 hover:shadow-md transition-all duration-150"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{treatment.name}</div>
                                  <div className="text-xs text-gray-500">{treatment.code}</div>
                                </div>
                                <div className="text-sm font-semibold text-blue-600">
                                  {treatment.points}点
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 追加済み処置リスト */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    追加済み処置 ({treatments.length}件)
                  </h3>
                  {treatments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      処置を選択して追加してください
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {treatments.map((treatment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{treatment.treatment_name}</div>
                            <div className="text-xs text-gray-500">
                              {treatment.treatment_code} |
                              {treatment.tooth_numbers.length > 0 && (
                                <> 歯番: {treatment.tooth_numbers.join(', ')} | </>
                              )}
                              {treatment.points}点
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveTreatment(index)}
                            className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-900">合計点数</span>
                          <span className="text-xl font-bold text-blue-600">
                            {treatments.reduce((sum, t) => sum + (t.points * t.quantity), 0)}点
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ステップ3: SOAP入力 */}
            {currentStep === 'soap' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      診療日
                    </label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      診療種別
                    </label>
                    <select
                      value={visitType}
                      onChange={(e) => setVisitType(e.target.value as any)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="initial">初診</option>
                      <option value="regular">再診</option>
                      <option value="emergency">緊急</option>
                      <option value="home_visit">訪問診療</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    S (主訴) - Subjective
                  </label>
                  <textarea
                    value={subjective}
                    onChange={(e) => setSubjective(e.target.value)}
                    placeholder="患者の訴え、主訴を記入"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O (所見) - Objective
                  </label>
                  <textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="客観的所見、検査結果を記入"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    A (評価) - Assessment
                  </label>
                  <textarea
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="診断、評価を記入"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    P (計画) - Plan
                  </label>
                  <textarea
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="治療計画、次回予定を記入"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* フッター（ボタン） */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <div className="flex items-center gap-3">
            {currentStep !== 'tooth_disease' && (
              <button
                onClick={handlePrevStep}
                className="px-6 py-2 text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                戻る
              </button>
            )}
            {currentStep !== 'soap' ? (
              <button
                onClick={handleNextStep}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                次へ
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-semibold"
              >
                保存
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
