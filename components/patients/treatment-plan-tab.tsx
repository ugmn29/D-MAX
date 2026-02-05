'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  GripVertical,
  Stethoscope,
  UserCog,
  Sparkles,
  Target,
  FileText,
  ChevronDown,
  ChevronUp,
  Split,
  ChevronRight,
  Clock,
  CheckCircle2,
  ClipboardList
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  getTreatmentPlans,
  createTreatmentPlan,
  updateTreatmentPlan,
  deleteTreatmentPlan,
  completeTreatmentPlan,
  type TreatmentPlan,
  type CreateTreatmentPlanInput
} from '@/lib/api/treatment-plans'
import { getVisualExaminations } from '@/lib/api/visual-exams'
import { getPeriodontalExams, type PeriodontalExam } from '@/lib/api/periodontal-exams'
import { getPatientTreatmentMemo, updatePatientTreatmentMemo } from '@/lib/api/patients'
import { generateTreatmentPlansFromVisualExam, convertProposalToTreatmentPlan, type TreatmentPlanProposal } from '@/lib/utils/treatment-plan-generator'
import { generateTreatmentPlansFromPeriodontalExam } from '@/lib/utils/periodontal-plan-generator'
import { TreatmentPlanPreviewModal } from './treatment-plan-preview-modal'
import { ToothSelectorModal } from './tooth-selector-modal'
import { ToothSplitDialog } from './tooth-split-dialog'
import { DentalChart } from './visual/dental-chart'
import { PeriodontalFlowCollapsibleCompact, type SrpSelectionItem, type DeepPocketTooth } from './periodontal-flow-collapsible-compact'
import type { VisualToothData } from '@/lib/api/visual-exams'
import { getActiveMemoTodoTemplates, parseTemplateItems, MemoTodoTemplate } from '@/lib/api/memo-todo-templates'
import { useClinicId } from '@/hooks/use-clinic-id'

// 永久歯と乳歯の歯番号
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11,
  21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41,
  31, 32, 33, 34, 35, 36, 37, 38,
]

const DECIDUOUS_TEETH = [
  55, 54, 53, 52, 51,
  61, 62, 63, 64, 65,
  85, 84, 83, 82, 81,
  71, 72, 73, 74, 75,
]

const ALL_TEETH = [...PERMANENT_TEETH, ...DECIDUOUS_TEETH]

// 全ての歯を健全状態で初期化
const createEmptyToothData = (): Record<number, VisualToothData> => {
  const map: Record<number, VisualToothData> = {}
  ALL_TEETH.forEach(toothNumber => {
    map[toothNumber] = {
      tooth_number: toothNumber,
      status: 'healthy',
    }
  })
  return map
}

// 歯番号を歯科表記に変換する関数
const formatToothNumber = (toothNumber: string): string => {
  if (!toothNumber || toothNumber.trim() === '') return ''

  // カンマやスペースで分割
  const teeth = toothNumber.split(/[,、\s]+/).filter(t => t.trim())

  // 各歯番号をPalmer記法に変換
  const formattedTeeth = teeth.map(tooth => {
    const trimmed = tooth.trim()
    // 数字のみ抽出
    const numbers = trimmed.match(/\d+/g)
    if (!numbers || numbers.length === 0) return trimmed

    // 最後の数字を取得（FDI表記: 2桁の場合、1桁目=象限、2桁目=歯番号）
    const lastNumber = numbers[numbers.length - 1]
    if (lastNumber.length < 2) return trimmed

    const quadrant = lastNumber.charAt(0)
    const toothNum = lastNumber.slice(-1)

    // Palmer記法のUnicode記号で象限を表現
    // ⏌ (U+23CC) = 右上 (1x) - 数字→記号
    // ⎿ (U+23BF) = 左上 (2x) - 記号→数字
    // ⎾ (U+23BE) = 左下 (3x) - 記号→数字
    // ⏋ (U+23CB) = 右下 (4x) - 数字→記号
    switch (quadrant) {
      case '1': // 右上: 数字→記号（上向き）
        return `${toothNum}⏌`
      case '2': // 左上: 記号→数字（上向き）
        return `⎿${toothNum}`
      case '3': // 左下: 記号→数字（下向き）
        return `⎾${toothNum}`
      case '4': // 右下: 数字→記号（下向き）
        return `${toothNum}⏋`
      default:
        return trimmed
    }
  })

  return formattedTeeth.join(' ')
}

interface TreatmentPlanTabProps {
  patientId: string
}

// 衛生士メニューの選択肢
const HYGIENIST_MENU_OPTIONS = [
  { value: 'TBI', label: 'TBI（ブラッシング指導）' },
  { value: 'SRP', label: 'SRP（スケーリング・ルートプレーニング）' },
  { value: 'PMT', label: 'PMT（メンテナンス）' },
  { value: 'SPT', label: 'SPT（サポーティブペリオドンタルセラピー）' },
  { value: 'P_JUBO', label: 'P重防（歯周病重症化予防治療）' },
  { value: 'OTHER', label: 'その他' }
]

// 歯周病フェーズの選択肢
const PERIODONTAL_PHASE_OPTIONS = [
  { value: 'P_EXAM_1', label: 'P検査1（初診時）' },
  { value: 'INITIAL', label: '初期治療（基本治療）' },
  { value: 'P_EXAM_2', label: 'P検査2（再評価1）' },
  { value: 'SURGERY', label: '歯周外科' },
  { value: 'P_EXAM_3', label: 'P検査3（再評価2）' },
  { value: 'MAINTENANCE', label: 'メンテナンス期' }
]

// 歯周治療フローチャートのフェーズ定義
const PERIODONTAL_FLOW_PHASES = [
  { id: 'P_EXAM_1', label: 'P検①', fullLabel: '歯周基本検査①' },
  { id: 'INITIAL', label: '初期治療', fullLabel: 'Sc/Poli/TBI' },
  { id: 'P_EXAM_2', label: 'P検②', fullLabel: '歯周基本検査②' },
  { id: 'SRP', label: 'SRP', fullLabel: 'スケーリング・ルートプレーニング' },
  { id: 'P_EXAM_3', label: 'P検③', fullLabel: '歯周基本検査③' },
  { id: 'SURGERY', label: '外科', fullLabel: '歯周外科' },
  { id: 'P_EXAM_4', label: 'P検④', fullLabel: '歯周基本検査④' },
  { id: 'MAINTENANCE', label: 'SPT', fullLabel: 'サポーティブペリオドンタルセラピー' }
] as const

export function TreatmentPlanTab({ patientId }: TreatmentPlanTabProps) {
  const clinicId = useClinicId()
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null)
  const [formData, setFormData] = useState<CreateTreatmentPlanInput>({
    treatment_content: '',
    staff_type: 'doctor',
    priority: 2
  })

  // 自動生成関連のstate
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [generatedProposals, setGeneratedProposals] = useState<TreatmentPlanProposal[]>([])
  const [latestVisualExamDate, setLatestVisualExamDate] = useState<string | undefined>()
  const [hasVisualExam, setHasVisualExam] = useState(false)
  const [latestVisualToothData, setLatestVisualToothData] = useState<Record<number, VisualToothData>>({})

  // P検査関連
  const [hasPerioExam, setHasPerioExam] = useState(false)
  const [perioExams, setPerioExams] = useState<PeriodontalExam[]>([])
  const [selectedPerioExam, setSelectedPerioExam] = useState<string | undefined>()
  const [deepPocketTeeth, setDeepPocketTeeth] = useState<DeepPocketTooth[]>([])

  // 欠損歯（視診データから取得）
  const [missingTeeth, setMissingTeeth] = useState<number[]>([])

  // 歯選択モーダル
  const [showToothSelector, setShowToothSelector] = useState(false)
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([])

  // 編集フォーム用の歯選択
  const [editingSelectedTeeth, setEditingSelectedTeeth] = useState<Set<number>>(new Set())

  // 新規追加フォーム用の歯選択
  const [newFormSelectedTeeth, setNewFormSelectedTeeth] = useState<Set<number>>(new Set())

  // 分割用のダイアログ（編集画面用）
  const [splitDialogOpen, setSplitDialogOpen] = useState(false)
  const [splitDialogInitialTooth, setSplitDialogInitialTooth] = useState<number | null>(null)
  const [splitDialogAllTeeth, setSplitDialogAllTeeth] = useState<number[]>([])
  const [splitDialogPlan, setSplitDialogPlan] = useState<TreatmentPlan | null>(null)

  // 分割用のダイアログ（新規追加フォーム用）
  const [newFormSplitDialogOpen, setNewFormSplitDialogOpen] = useState(false)
  const [newFormSplitDialogInitialTooth, setNewFormSplitDialogInitialTooth] = useState<number | null>(null)

  // ドラッグ&ドロップ
  const [draggedPlan, setDraggedPlan] = useState<TreatmentPlan | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // メモセクション（自由記述 + TODOリスト）
  interface MemoTodo {
    id: string
    text: string
    completed: boolean
  }
  interface TreatmentMemoData {
    freeText: string
    todos: MemoTodo[]
  }
  const [treatmentMemoData, setTreatmentMemoData] = useState<TreatmentMemoData>({ freeText: '', todos: [] })
  const [treatmentMemoSaving, setTreatmentMemoSaving] = useState(false)
  const [treatmentMemoSaved, setTreatmentMemoSaved] = useState(false)
  const [newTodoText, setNewTodoText] = useState('')
  // メモTODOテンプレート
  const [memoTodoTemplates, setMemoTodoTemplates] = useState<MemoTodoTemplate[]>([])
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const templateDropdownRef = useRef<HTMLDivElement>(null)

  // ドクター枠追加フォーム
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false)
  const [doctorFormData, setDoctorFormData] = useState<CreateTreatmentPlanInput>({
    treatment_content: '',
    staff_type: 'doctor',
    priority: 3,
    is_memo: false
  })

  // 衛生士枠追加フォーム
  const [showAddHygienistForm, setShowAddHygienistForm] = useState(false)
  const [hygienistFormData, setHygienistFormData] = useState<CreateTreatmentPlanInput>({
    treatment_content: '',
    staff_type: 'hygienist',
    priority: 3,
    is_memo: false
  })

  // タブ切り替え用
  const [activeStaffTab, setActiveStaffTab] = useState<'doctor' | 'hygienist'>('doctor')

  // フローチャートで選択されたフェーズ（衛生士）
  const [selectedPerioPhase, setSelectedPerioPhase] = useState<string | null>(null)

  // SRP/Fop編集用
  const [editingSrpPlan, setEditingSrpPlan] = useState<TreatmentPlan | null>(null)
  const [editingSrpPhaseId, setEditingSrpPhaseId] = useState<string>('')
  const [editingSrpSelectedTeeth, setEditingSrpSelectedTeeth] = useState<Set<number>>(new Set())
  const [editingSrpExistingTeeth, setEditingSrpExistingTeeth] = useState<number[]>([]) // 他のTODOに含まれる歯

  // SRP/Fop追加用
  const [addingSrpPhaseId, setAddingSrpPhaseId] = useState<string>('')
  const [addingSrpExistingTeeth, setAddingSrpExistingTeeth] = useState<number[]>([])
  const [addingSrpSelectedTeeth, setAddingSrpSelectedTeeth] = useState<Set<number>>(new Set())

  // SRP/Fop分割用
  const [srpSplitDialogOpen, setSrpSplitDialogOpen] = useState(false)
  const [srpSplitDialogInitialTooth, setSrpSplitDialogInitialTooth] = useState<number | null>(null)

  // ドラッグ選択用
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingEdit, setIsDraggingEdit] = useState(false)

  // 治療計画を読み込み
  useEffect(() => {
    loadPlans()
    checkVisualExams()
    checkPerioExams()
    loadDeepPocketTeeth()
    loadTreatmentMemo()
  }, [patientId])

  // メモTODOテンプレートの読み込み
  useEffect(() => {
    const loadMemoTodoTemplates = async () => {
      try {
        const templates = await getActiveMemoTodoTemplates(clinicId)
        setMemoTodoTemplates(templates)
      } catch (error) {
        console.error('メモTODOテンプレートの読み込みに失敗:', error)
      }
    }
    loadMemoTodoTemplates()
  }, [])

  // テンプレートドロップダウンの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setShowTemplateDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // UUID形式かどうかを判定するヘルパー
  const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // 治療計画メモを読み込み（JSON形式で保存されている場合はパース）
  const loadTreatmentMemo = async () => {
    try {
      let rawMemo: string | null = null
      if (isUUID(patientId)) {
        rawMemo = await getPatientTreatmentMemo(clinicId, patientId)
      } else {
        // UUID形式でない場合はローカルストレージから読み込み
        rawMemo = localStorage.getItem(`treatment_memo_${patientId}`)
      }

      if (rawMemo) {
        try {
          // JSON形式でパースを試みる
          const parsed = JSON.parse(rawMemo)
          if (parsed && typeof parsed === 'object' && 'freeText' in parsed) {
            setTreatmentMemoData(parsed as TreatmentMemoData)
          } else {
            // 旧形式（プレーンテキスト）の場合
            setTreatmentMemoData({ freeText: rawMemo, todos: [] })
          }
        } catch {
          // JSONパース失敗 = プレーンテキスト
          setTreatmentMemoData({ freeText: rawMemo, todos: [] })
        }
      } else {
        setTreatmentMemoData({ freeText: '', todos: [] })
      }
    } catch (error) {
      console.error('治療計画メモ読み込みエラー:', error)
    }
  }

  // 治療計画メモを保存（JSON形式）
  const handleSaveTreatmentMemo = async () => {
    const memoJson = JSON.stringify(treatmentMemoData)
    console.log('治療計画メモ保存ボタン押下:', memoJson, 'patientId:', patientId, 'isUUID:', isUUID(patientId))
    try {
      setTreatmentMemoSaving(true)
      if (isUUID(patientId)) {
        await updatePatientTreatmentMemo(clinicId, patientId, memoJson || null)
        console.log('DBに保存完了')
      } else {
        // UUID形式でない場合はローカルストレージに保存
        if (memoJson) {
          localStorage.setItem(`treatment_memo_${patientId}`, memoJson)
        } else {
          localStorage.removeItem(`treatment_memo_${patientId}`)
        }
        console.log('ローカルストレージに保存完了')
      }
      setTreatmentMemoSaved(true)
      setTimeout(() => setTreatmentMemoSaved(false), 2000)
    } catch (error) {
      console.error('治療計画メモ保存エラー:', error)
      alert('メモの保存に失敗しました')
    } finally {
      setTreatmentMemoSaving(false)
    }
  }

  // TODO追加
  const handleAddTodo = () => {
    if (!newTodoText.trim()) return
    const newTodo: MemoTodo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newTodoText.trim(),
      completed: false
    }
    setTreatmentMemoData(prev => ({
      ...prev,
      todos: [...prev.todos, newTodo]
    }))
    setNewTodoText('')
  }

  // テンプレートからTODOを追加
  const handleApplyTemplate = (template: MemoTodoTemplate) => {
    const templateItems = parseTemplateItems(template.items)
    const existingTexts = new Set(treatmentMemoData.todos.map(t => t.text))

    // 重複しないものだけ追加
    const newTodos = templateItems
      .filter(text => !existingTexts.has(text))
      .map(text => ({
        id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        completed: false
      }))

    if (newTodos.length > 0) {
      setTreatmentMemoData(prev => ({
        ...prev,
        todos: [...prev.todos, ...newTodos]
      }))
    }

    setShowTemplateDropdown(false)
  }

  // TODOのチェック状態を切り替え
  const handleToggleTodo = (todoId: string) => {
    setTreatmentMemoData(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    }))
  }

  // TODOを削除
  const handleDeleteTodo = (todoId: string) => {
    setTreatmentMemoData(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== todoId)
    }))
  }

  // 自由記述の更新
  const handleFreeTextChange = (text: string) => {
    setTreatmentMemoData(prev => ({
      ...prev,
      freeText: text
    }))
  }

  // 単一歯番号をPalmer記法に変換（メモ追記用）
  const formatSingleToothToPalmer = (toothNumber: number): string => {
    const str = toothNumber.toString()
    if (str.length < 2) return str
    const quadrant = str.charAt(0)
    const toothNum = str.slice(-1)
    switch (quadrant) {
      case '1': return `${toothNum}⏌`
      case '2': return `⎿${toothNum}`
      case '3': return `⎾${toothNum}`
      case '4': return `${toothNum}⏋`
      default: return str
    }
  }

  // 欠損歯の補綴方法選択時にメモに追記（DB/localStorageに即時保存）
  const handleRestorationSelect = async (toothNumbers: number[], selectedOption: string, selectedLabel: string) => {
    // 歯番号をPalmer記法に変換して連結
    const palmerTeeth = toothNumbers.map(t => formatSingleToothToPalmer(t)).join('')
    // メモに追記する行（例：「⎾6⎾7：ブリッジ」）
    const newLine = `${palmerTeeth}：${selectedLabel}`

    // 新しいデータを計算
    const newData = (() => {
      const currentText = treatmentMemoData.freeText.trim()
      const newFreeText = currentText ? `${currentText}\n${newLine}` : newLine
      return {
        ...treatmentMemoData,
        freeText: newFreeText
      }
    })()

    // 状態を更新
    setTreatmentMemoData(newData)

    // DB/localStorageに即時保存
    try {
      const memoJson = JSON.stringify(newData)
      if (isUUID(patientId)) {
        await updatePatientTreatmentMemo(clinicId, patientId, memoJson)
      } else {
        localStorage.setItem(`treatment_memo_${patientId}`, memoJson)
      }
    } catch (error) {
      console.error('欠損歯メモ保存エラー:', error)
    }
  }

  const loadPlans = async () => {
    try {
      setLoading(true)
      const data = await getTreatmentPlans(clinicId, patientId)
      setPlans(data)
    } catch (error) {
      console.error('治療計画読み込みエラー:', error)
      alert('治療計画の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // フェーズ完了ハンドラー（該当フェーズの全TODOを一括完了）
  const handlePhaseToggle = async (phaseId: string, isCurrentlyCompleted: boolean) => {
    try {
      // 該当フェーズのTODOを取得
      const phasePlans = plans.filter(p =>
        p.staff_type === 'hygienist' &&
        p.periodontal_phase === phaseId
      )

      if (phasePlans.length === 0) {
        return
      }

      // チェックON: 全て完了、チェックOFF: 全て未完了
      const newStatus = isCurrentlyCompleted ? 'planned' : 'completed'
      const timestamp = isCurrentlyCompleted ? null : new Date().toISOString()

      // 全TODOを一括更新
      await Promise.all(
        phasePlans.map(plan =>
          updateTreatmentPlan(clinicId, plan.id!, {
            status: newStatus,
            completed_at: timestamp,
          })
        )
      )

      // リロード
      await loadPlans()
    } catch (error) {
      console.error('フェーズ完了エラー:', error)
      alert('フェーズの完了処理に失敗しました')
    }
  }

  // 視診データの存在確認
  const checkVisualExams = async () => {
    try {
      const visualExams = await getVisualExaminations(patientId)
      if (visualExams && visualExams.length > 0) {
        setHasVisualExam(true)
        // 最新の視診データの日付を保存
        setLatestVisualExamDate(visualExams[0].examination_date)

        // 最新の視診データの歯データをマップに変換
        const latestExam = visualExams[0]
        if (latestExam.tooth_data) {
          const toothDataMap: Record<number, VisualToothData> = {}
          const missing: number[] = []
          latestExam.tooth_data.forEach(tooth => {
            toothDataMap[tooth.tooth_number] = tooth
            // 欠損歯を収集（missing, none, unerupted, impacted）
            if (['missing', 'none', 'unerupted', 'impacted'].includes(tooth.status)) {
              missing.push(tooth.tooth_number)
            }
          })
          setLatestVisualToothData(toothDataMap)
          setMissingTeeth(missing)
        }
      }
    } catch (error) {
      console.error('視診データ確認エラー:', error)
    }
  }

  // 視診データから治療計画を自動生成
  const handleGenerateFromVisualExam = async () => {
    try {
      const visualExams = await getVisualExaminations(patientId)
      console.log('視診データ:', visualExams)

      if (!visualExams || visualExams.length === 0) {
        alert('視診データが見つかりません')
        return
      }

      // 最新の視診データから生成
      const latestExam = visualExams[0]
      console.log('最新の視診データ:', latestExam)
      console.log('歯データ:', latestExam.tooth_data)

      const proposals = generateTreatmentPlansFromVisualExam(latestExam)
      console.log('生成された提案:', proposals)

      if (proposals.length === 0) {
        alert('治療が必要な所見が見つかりませんでした')
        return
      }

      setGeneratedProposals(proposals)
      setLatestVisualExamDate(latestExam.examination_date)
      setShowPreviewModal(true)
    } catch (error) {
      console.error('自動生成エラー:', error)
      alert('治療計画の自動生成に失敗しました')
    }
  }

  // プレビューから一括登録
  const handleConfirmGeneration = async (
    confirmedProposals: TreatmentPlanProposal[],
    restorationChoices: Record<number, string>,
    memoInputs: Record<number, string>
  ) => {
    try {
      let sortOrder = plans.length

      for (let i = 0; i < confirmedProposals.length; i++) {
        const proposal = confirmedProposals[i]
        const restorationChoice = restorationChoices[i]
        const memoText = memoInputs[i]

        // 欠損歯補綴の提案はスキップ（メモのみに記録済み）
        if (proposal.restoration_options) {
          continue
        }

        const plansToCreate = convertProposalToTreatmentPlan(
          proposal,
          clinicId,
          patientId,
          sortOrder,
          restorationChoice,
          memoText // メモを渡す
        )

        for (const plan of plansToCreate) {
          await createTreatmentPlan(clinicId, patientId, plan)
          sortOrder++
        }
      }

      setShowPreviewModal(false)
      await loadPlans()
      alert('治療計画を一括登録しました')
    } catch (error) {
      console.error('一括登録エラー:', error)
      alert('治療計画の登録に失敗しました')
    }
  }

  // 歯選択モーダルから確定
  const handleToothSelect = (teeth: number[]) => {
    setSelectedTeeth(teeth)
    const toothNumberStr = teeth.join(', ')

    // 新規追加フォームに反映
    setFormData(prev => ({
      ...prev,
      tooth_number: toothNumberStr
    }))

    // 編集フォームに反映（編集中の場合）
    if (editingPlan) {
      setEditingPlan(prev => ({
        ...prev!,
        tooth_number: toothNumberStr
      }))
    }

    setShowToothSelector(false)
  }

  // P検査データの存在確認
  const checkPerioExams = async () => {
    try {
      const exams = await getPeriodontalExams(patientId)
      if (exams && exams.length > 0) {
        setHasPerioExam(true)
        setPerioExams(exams)
        // P検査2または P検査3のみフィルタ
        const relevantExams = exams.filter(
          e => e.examination_phase === 'P_EXAM_2' || e.examination_phase === 'P_EXAM_3'
        )
        if (relevantExams.length > 0) {
          setSelectedPerioExam(relevantExams[0].id)
        }
      }
    } catch (error) {
      console.error('P検査データ確認エラー:', error)
    }
  }

  // P検データから4mm以上の歯を抽出
  const loadDeepPocketTeeth = async () => {
    try {
      const exams = await getPeriodontalExams(patientId)
      // 最新のP検②またはP検③を探す
      const latestExam = exams.find((e: PeriodontalExam) =>
        e.examination_phase === 'P_EXAM_2' || e.examination_phase === 'P_EXAM_3'
      )

      if (latestExam && latestExam.tooth_data) {
        const deepTeeth: DeepPocketTooth[] = []

        latestExam.tooth_data.forEach((tooth: any) => {
          if (tooth.is_missing) return

          const positions = ['mb', 'b', 'db', 'ml', 'l', 'dl'] as const
          const deepPositions: string[] = []
          let maxDepth = 0

          positions.forEach(pos => {
            const depth = tooth[`ppd_${pos}`] as number | undefined
            if (depth && depth >= 4) {
              deepPositions.push(pos)
              maxDepth = Math.max(maxDepth, depth)
            }
          })

          if (deepPositions.length > 0) {
            deepTeeth.push({
              toothNumber: tooth.tooth_number,
              maxDepth,
              positions: deepPositions
            })
          }
        })

        setDeepPocketTeeth(deepTeeth)
      }
    } catch (error) {
      console.error('P検データ読み込みエラー:', error)
    }
  }

  // 分岐選択ハンドラー（SRP/Fop/P重防/SPTのTODOを生成）
  const handleBranchSelect = async (phaseId: string, selections?: SrpSelectionItem[]) => {
    try {
      // 既存の最大sort_orderを取得
      const maxSortOrder = plans.length > 0
        ? Math.max(...plans.map(t => t.sort_order || 0))
        : 0
      let currentSortOrder = maxSortOrder

      // SRP系（SRP, SRP_2, SRP_3）
      if ((phaseId === 'SRP' || phaseId === 'SRP_2' || phaseId === 'SRP_3') && selections && selections.length > 0) {
        // P重防が選択されている場合は削除
        const existingPHeavy = plans.filter(p => p.periodontal_phase === 'P_HEAVY_PREVENTION')
        for (const plan of existingPHeavy) {
          await deleteTreatmentPlan(clinicId, plan.id)
        }

        const labelPrefix = phaseId === 'SRP' ? 'SRP' : phaseId === 'SRP_2' ? '再SRP' : '再々SRP'
        for (const selection of selections) {
          currentSortOrder++
          const teethStr = selection.teeth.join(', ')
          const content = selection.type === 'block'
            ? `${labelPrefix}（${selection.label.split(' ')[0]}）`
            : `${labelPrefix}（${teethStr}番）`

          await createTreatmentPlan(clinicId, patientId, {
            treatment_content: content,
            staff_type: 'hygienist',
            tooth_number: teethStr,
            priority: 2,
            sort_order: currentSortOrder,
            periodontal_phase: phaseId as any,
            hygienist_menu_type: 'SRP',
            status: 'planned'
          })
        }
      }
      // Fop系（SURGERY, SURGERY_2）
      else if ((phaseId === 'SURGERY' || phaseId === 'SURGERY_2') && selections && selections.length > 0) {
        const labelPrefix = phaseId === 'SURGERY' ? '歯周外科' : '再歯周外科'
        for (const selection of selections) {
          currentSortOrder++
          const teethStr = selection.teeth.join(', ')
          const content = selection.type === 'block'
            ? `${labelPrefix}（${selection.label.split(' ')[0]}）`
            : `${labelPrefix}（${teethStr}番）`

          await createTreatmentPlan(clinicId, patientId, {
            treatment_content: content,
            staff_type: 'doctor',
            tooth_number: teethStr,
            priority: 1,
            sort_order: currentSortOrder,
            periodontal_phase: phaseId as any,
            status: 'planned'
          })
        }
      }
      // P重防
      else if (phaseId === 'P_HEAVY_PREVENTION') {
        // SRP系が選択されている場合は全て削除
        const existingSRP = plans.filter(p =>
          p.periodontal_phase === 'SRP' ||
          p.periodontal_phase === 'SRP_2' ||
          p.periodontal_phase === 'SRP_3'
        )
        for (const plan of existingSRP) {
          await deleteTreatmentPlan(clinicId, plan.id)
        }

        currentSortOrder++
        await createTreatmentPlan(clinicId, patientId, {
          treatment_content: 'P重防（歯周病重症化予防治療）',
          staff_type: 'hygienist',
          priority: 3,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_HEAVY_PREVENTION',
          hygienist_menu_type: 'P_JUBO',
          status: 'planned'
        })
      }
      // SPT
      else if (phaseId === 'MAINTENANCE') {
        // 未完了のSRP系・Fop系・P重防を削除（SPTに移行するため）
        const existingToDelete = plans.filter(p =>
          p.status !== 'completed' && (
            p.periodontal_phase === 'SRP' ||
            p.periodontal_phase === 'SRP_2' ||
            p.periodontal_phase === 'SRP_3' ||
            p.periodontal_phase === 'SURGERY' ||
            p.periodontal_phase === 'SURGERY_2' ||
            p.periodontal_phase === 'P_HEAVY_PREVENTION'
          )
        )
        for (const plan of existingToDelete) {
          await deleteTreatmentPlan(clinicId, plan.id)
        }

        currentSortOrder++
        await createTreatmentPlan(clinicId, patientId, {
          treatment_content: 'SPT（歯周病安定期治療）',
          staff_type: 'hygienist',
          priority: 3,
          sort_order: currentSortOrder,
          periodontal_phase: 'MAINTENANCE',
          hygienist_menu_type: 'SPT',
          status: 'planned'
        })
      }
      // P検③
      else if (phaseId === 'P_EXAM_3') {
        currentSortOrder++
        await createTreatmentPlan(clinicId, patientId, {
          treatment_content: 'P検③（歯周基本検査）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_3',
          status: 'planned'
        })
      }
      // P検④
      else if (phaseId === 'P_EXAM_4') {
        currentSortOrder++
        await createTreatmentPlan(clinicId, patientId, {
          treatment_content: 'P検④（歯周基本検査）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_4',
          status: 'planned'
        })
      }
      // P検⑤
      else if (phaseId === 'P_EXAM_5') {
        currentSortOrder++
        await createTreatmentPlan(clinicId, patientId, {
          treatment_content: 'P検⑤（歯周基本検査）',
          staff_type: 'hygienist',
          priority: 2,
          sort_order: currentSortOrder,
          periodontal_phase: 'P_EXAM_5',
          status: 'planned'
        })
      }

      // リロード
      await loadPlans()
    } catch (error) {
      console.error('分岐選択エラー:', error)
      alert('治療計画の作成に失敗しました')
    }
  }

  // SRP/Fop TODOの編集開始
  const handleEditSrpTodo = (plan: TreatmentPlan, phaseId: string) => {
    setEditingSrpPlan(plan)
    setEditingSrpPhaseId(phaseId)
    // 歯番号文字列からSetに変換
    const teethSet = new Set<number>()
    if (plan.tooth_number) {
      const teethStr = plan.tooth_number.split(/[,、\s]+/).filter(t => t.trim())
      teethStr.forEach(t => {
        const num = parseInt(t.trim(), 10)
        if (!isNaN(num)) {
          teethSet.add(num)
        }
      })
    }
    setEditingSrpSelectedTeeth(teethSet)

    // 同じフェーズにある他のTODOの歯牙を収集
    const existingTeeth: number[] = []
    plans.forEach(p => {
      // 同じフェーズで、現在編集中のplan以外
      if (p.periodontal_phase === phaseId && p.id !== plan.id && p.tooth_number) {
        const teethStr = p.tooth_number.split(/[,、\s]+/).filter(t => t.trim())
        teethStr.forEach(t => {
          const num = parseInt(t.trim(), 10)
          if (!isNaN(num)) existingTeeth.push(num)
        })
      }
    })
    setEditingSrpExistingTeeth(existingTeeth)
  }

  // SRP/Fop TODOの編集保存
  const handleSaveSrpEdit = async () => {
    if (!editingSrpPlan) return

    try {
      const toothNumberStr = Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b).join(', ')
      await updateTreatmentPlan(clinicId, editingSrpPlan.id, {
        tooth_number: toothNumberStr
      })
      await loadPlans()
      setEditingSrpPlan(null)
      setEditingSrpPhaseId('')
      setEditingSrpSelectedTeeth(new Set())
      setEditingSrpExistingTeeth([])
    } catch (error) {
      console.error('編集エラー:', error)
      alert('更新に失敗しました')
    }
  }

  // SRP/Fop TODOの編集キャンセル
  const handleCancelSrpEdit = () => {
    setEditingSrpPlan(null)
    setEditingSrpPhaseId('')
    setEditingSrpSelectedTeeth(new Set())
    setEditingSrpExistingTeeth([])
  }

  // SRP/Fop TODOの削除
  const handleDeleteSrpTodo = async () => {
    if (!editingSrpPlan) return

    const confirmDelete = confirm('この部位を削除してもよろしいですか？')
    if (!confirmDelete) return

    try {
      await deleteTreatmentPlan(clinicId, editingSrpPlan.id)
      await loadPlans()
      setEditingSrpPlan(null)
      setEditingSrpPhaseId('')
      setEditingSrpSelectedTeeth(new Set())
      setEditingSrpExistingTeeth([])
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // 歯の選択をトグル（編集用）
  const handleToggleSrpTooth = (toothNum: number) => {
    // 他のTODOに含まれる歯牙または欠損歯はスキップ
    if (editingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return

    setEditingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toothNum)) {
        newSet.delete(toothNum)
      } else {
        newSet.add(toothNum)
      }
      return newSet
    })
  }

  // SRP/Fop分割ダイアログを開く
  const handleOpenSrpSplitDialog = (toothNumber: number) => {
    if (!editingSrpPlan) return

    const allTeeth = Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b)
    if (allTeeth.length < 2) {
      alert('分割するには2本以上の歯が必要です')
      return
    }

    // 完了済みの場合は分割不可
    if (editingSrpPlan.status === 'completed') {
      alert('完了済みのカードは分割できません')
      return
    }

    setSrpSplitDialogInitialTooth(toothNumber)
    setSrpSplitDialogOpen(true)
  }

  // SRP/Fop分割確定
  const handleConfirmSrpSplit = async (selectedTeeth: number[]) => {
    if (!editingSrpPlan) return

    try {
      const allTeeth = Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b)
      const remainingTeeth = allTeeth.filter(tooth => !selectedTeeth.includes(tooth))

      // 現在の計画より後ろにある計画のsort_orderを1つずつ増やす
      const plansToShift = plans.filter(p => p.sort_order > editingSrpPlan.sort_order)
      for (const plan of plansToShift) {
        await updateTreatmentPlan(clinicId, plan.id, {
          sort_order: plan.sort_order + 1
        })
      }

      // フェーズに応じたラベルを決定
      let labelPrefix = 'SRP'
      if (editingSrpPhaseId === 'SRP_2') labelPrefix = '再SRP'
      else if (editingSrpPhaseId === 'SRP_3') labelPrefix = '再々SRP'
      else if (editingSrpPhaseId === 'SURGERY') labelPrefix = '歯周外科'
      else if (editingSrpPhaseId === 'SURGERY_2') labelPrefix = '再歯周外科'

      // 元の計画の対象歯を更新
      await updateTreatmentPlan(clinicId, editingSrpPlan.id, {
        tooth_number: remainingTeeth.join(', '),
        treatment_content: `${labelPrefix}（${remainingTeeth.join(', ')}番）`
      })

      // 新しい計画を追加（元の計画の次に配置）
      const newPlan = {
        treatment_content: `${labelPrefix}（${selectedTeeth.sort((a, b) => a - b).join(', ')}番）`,
        tooth_number: selectedTeeth.sort((a, b) => a - b).join(', '),
        staff_type: editingSrpPlan.staff_type,
        priority: editingSrpPlan.priority,
        status: editingSrpPlan.status,
        hygienist_menu_type: editingSrpPlan.hygienist_menu_type,
        periodontal_phase: editingSrpPlan.periodontal_phase,
        memo: editingSrpPlan.memo,
        is_memo: editingSrpPlan.is_memo,
        sort_order: editingSrpPlan.sort_order + 1
      }

      await createTreatmentPlan(clinicId, patientId, newPlan)

      // ダイアログを閉じる
      setSrpSplitDialogOpen(false)
      setSrpSplitDialogInitialTooth(null)

      // 編集モードを閉じる
      setEditingSrpPlan(null)
      setEditingSrpPhaseId('')
      setEditingSrpSelectedTeeth(new Set())
      setEditingSrpExistingTeeth([])

      // 計画を再読み込み
      await loadPlans()

      // 衛生士タブを維持（分割はSRP/Fopなど衛生士枠の操作のため）
      setActiveStaffTab('hygienist')

      alert('治療計画を分割しました')
    } catch (error) {
      console.error('SRP/Fop分割エラー:', error)
      alert('治療計画の分割に失敗しました')
    }
  }

  // SRP/Fop TODOの追加開始
  const handleAddSrpTodo = (phaseId: string, existingTeeth: number[]) => {
    setAddingSrpPhaseId(phaseId)
    setAddingSrpExistingTeeth(existingTeeth)
    setAddingSrpSelectedTeeth(new Set())
  }

  // SRP/Fop TODOの追加保存
  const handleSaveAddSrp = async () => {
    if (addingSrpSelectedTeeth.size === 0) {
      alert('歯を選択してください')
      return
    }

    try {
      const toothNumberStr = Array.from(addingSrpSelectedTeeth).sort((a, b) => a - b).join(', ')
      const maxSortOrder = plans.length > 0
        ? Math.max(...plans.map(t => t.sort_order || 0))
        : 0

      // フェーズに応じたラベルを決定
      let labelPrefix = 'SRP'
      if (addingSrpPhaseId === 'SRP_2') labelPrefix = '再SRP'
      else if (addingSrpPhaseId === 'SRP_3') labelPrefix = '再々SRP'
      else if (addingSrpPhaseId === 'SURGERY') labelPrefix = '歯周外科'
      else if (addingSrpPhaseId === 'SURGERY_2') labelPrefix = '再歯周外科'

      await createTreatmentPlan(clinicId, patientId, {
        treatment_content: `${labelPrefix}（${toothNumberStr}番）`,
        staff_type: addingSrpPhaseId.startsWith('SURGERY') ? 'doctor' : 'hygienist',
        tooth_number: toothNumberStr,
        priority: 2,
        sort_order: maxSortOrder + 1,
        periodontal_phase: addingSrpPhaseId as any,
        hygienist_menu_type: addingSrpPhaseId.startsWith('SURGERY') ? undefined : 'SRP',
        status: 'planned'
      })

      await loadPlans()
      setAddingSrpPhaseId('')
      setAddingSrpExistingTeeth([])
      setAddingSrpSelectedTeeth(new Set())
    } catch (error) {
      console.error('追加エラー:', error)
      alert('追加に失敗しました')
    }
  }

  // SRP/Fop TODOの追加キャンセル
  const handleCancelAddSrp = () => {
    setAddingSrpPhaseId('')
    setAddingSrpExistingTeeth([])
    setAddingSrpSelectedTeeth(new Set())
  }

  // 歯の選択をトグル（追加用）
  const handleToggleAddSrpTooth = (toothNum: number) => {
    // 既存の歯または欠損歯はトグルしない
    if (addingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return

    setAddingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toothNum)) {
        newSet.delete(toothNum)
      } else {
        newSet.add(toothNum)
      }
      return newSet
    })
  }

  // ドラッグ選択用ハンドラー（追加モーダル）
  const handleAddDragStart = (toothNum: number) => {
    // 既存の歯または欠損歯はスキップ
    if (addingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return
    setIsDragging(true)
    setAddingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNum)
      return newSet
    })
  }

  const handleAddDragEnter = (toothNum: number) => {
    if (!isDragging) return
    // 既存の歯または欠損歯はスキップ
    if (addingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return
    setAddingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNum)
      return newSet
    })
  }

  const handleAddDragEnd = () => {
    setIsDragging(false)
  }

  // ドラッグ選択用ハンドラー（編集モーダル）
  const handleEditDragStart = (toothNum: number) => {
    // 他のTODOに含まれる歯牙または欠損歯はスキップ
    if (editingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return
    setIsDraggingEdit(true)
    setEditingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNum)
      return newSet
    })
  }

  const handleEditDragEnter = (toothNum: number) => {
    // 他のTODOに含まれる歯牙または欠損歯はスキップ
    if (!isDraggingEdit || editingSrpExistingTeeth.includes(toothNum) || missingTeeth.includes(toothNum)) return
    setEditingSrpSelectedTeeth(prev => {
      const newSet = new Set(prev)
      newSet.add(toothNum)
      return newSet
    })
  }

  const handleEditDragEnd = () => {
    setIsDraggingEdit(false)
  }

  // P検査データから治療計画を自動生成
  const handleGenerateFromPerioExam = async () => {
    try {
      if (!selectedPerioExam) {
        alert('P検査を選択してください')
        return
      }

      const exam = perioExams.find(e => e.id === selectedPerioExam)
      if (!exam) {
        alert('選択されたP検査が見つかりません')
        return
      }

      const proposals = generateTreatmentPlansFromPeriodontalExam(exam)

      if (proposals.length === 0) {
        alert('治療が必要な所見が見つかりませんでした')
        return
      }

      // 既存の提案に追加
      setGeneratedProposals(prev => [...prev, ...proposals])
      setShowPreviewModal(true)
    } catch (error) {
      console.error('P検査から自動生成エラー:', error)
      alert('治療計画の自動生成に失敗しました')
    }
  }

  // ドラッグ開始
  const handleDragStart = (e: React.DragEvent, plan: TreatmentPlan) => {
    setDraggedPlan(plan)
    e.dataTransfer.effectAllowed = 'move'
  }

  // ドラッグオーバー
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  // ドラッグ終了
  const handleDragEnd = () => {
    setDraggedPlan(null)
    setDragOverIndex(null)
  }

  // ドロップ
  const handleDrop = async (e: React.DragEvent, targetPlan: TreatmentPlan, targetIndex: number) => {
    e.preventDefault()

    if (!draggedPlan || draggedPlan.id === targetPlan.id) {
      setDraggedPlan(null)
      setDragOverIndex(null)
      return
    }

    // 同じスタッフタイプ内でのみ並び替え可能
    if (draggedPlan.staff_type !== targetPlan.staff_type) {
      alert('ドクター枠と衛生士枠をまたいだ並び替えはできません')
      setDraggedPlan(null)
      setDragOverIndex(null)
      return
    }

    // 同じスタッフタイプの計画を取得
    const samStaffPlans = plans.filter(p => p.staff_type === draggedPlan.staff_type)
    const draggedIndex = samStaffPlans.findIndex(p => p.id === draggedPlan.id)

    // 並び替え
    const newPlans = [...samStaffPlans]
    newPlans.splice(draggedIndex, 1)
    newPlans.splice(targetIndex, 0, draggedPlan)

    // sort_orderを更新
    const updates = newPlans.map((plan, index) => ({
      id: plan.id,
      sort_order: index,
    }))

    try {
      // 各計画のsort_orderを更新
      for (const update of updates) {
        await updateTreatmentPlan(clinicId, update.id, {
          sort_order: update.sort_order,
        })
      }

      // リロード
      await loadPlans()
    } catch (error) {
      console.error('並び替えエラー:', error)
      alert('並び替えに失敗しました')
    }

    setDraggedPlan(null)
    setDragOverIndex(null)
  }

  // 治療計画を取得（メモを除外）
  const treatmentPlans = plans.filter(p => !p.is_memo)

  // ドクター枠と衛生士枠で分類（メモを除外）
  const doctorPlans = treatmentPlans.filter(p => p.staff_type === 'doctor' && !p.periodontal_phase)
  // 衛生士: 全ての計画（歯周フロー用）
  const hygienistPlans = treatmentPlans.filter(p => p.staff_type === 'hygienist')
  // 衛生士: カード一覧用（歯周フローのTODOを除外）
  const hygienistPlansForCards = treatmentPlans.filter(p => p.staff_type === 'hygienist' && !p.periodontal_phase)

  // 新規追加
  const handleAdd = async () => {
    // 治療内容、歯番号、メモのいずれかが入力されていればOK
    if (!formData.treatment_content?.trim() && !formData.tooth_number?.trim() && !formData.memo?.trim()) {
      alert('治療内容、歯番号、またはメモのいずれかを入力してください')
      return
    }

    try {
      await createTreatmentPlan(clinicId, patientId, formData)
      await loadPlans()
      { setShowAddForm(false); setNewFormSelectedTeeth(new Set()) }
      setFormData({
        treatment_content: '',
        staff_type: 'doctor',
        priority: 2
      })
    } catch (error) {
      console.error('治療計画追加エラー:', error)
      alert('治療計画の追加に失敗しました')
    }
  }

  // 編集
  const handleEdit = async (plan: TreatmentPlan) => {
    setEditingPlan(plan)
    // 既存の歯番号を選択状態に設定
    if (plan.tooth_number) {
      const teeth = plan.tooth_number.split(/[,、\s]+/).map(t => parseInt(t.trim())).filter(n => !isNaN(n))
      setEditingSelectedTeeth(new Set(teeth))
    } else {
      setEditingSelectedTeeth(new Set())
    }
  }

  const handleSaveEdit = async () => {
    if (!editingPlan) return

    try {
      await updateTreatmentPlan(clinicId, editingPlan.id, {
        treatment_content: editingPlan.treatment_content,
        tooth_number: editingPlan.tooth_number,
        priority: editingPlan.priority,
        hygienist_menu_type: editingPlan.hygienist_menu_type,
        periodontal_phase: editingPlan.periodontal_phase,
        memo: editingPlan.memo,
        is_memo: editingPlan.is_memo
      })
      await loadPlans()
      { setEditingPlan(null); setEditingSelectedTeeth(new Set()) }
    } catch (error) {
      console.error('治療計画更新エラー:', error)
      alert('治療計画の更新に失敗しました')
    }
  }

  // 削除
  const handleDelete = async (planId: string) => {
    if (!confirm('この治療計画を削除しますか？')) return

    try {
      await deleteTreatmentPlan(clinicId, planId)
      await loadPlans()
    } catch (error) {
      console.error('治療計画削除エラー:', error)
      alert('治療計画の削除に失敗しました')
    }
  }

  // 完了
  const handleComplete = async (planId: string) => {
    try {
      await completeTreatmentPlan(clinicId, planId)
      await loadPlans()
    } catch (error) {
      console.error('治療計画完了エラー:', error)
      alert('治療計画の完了処理に失敗しました')
    }
  }

  // 完了を未完了に戻す
  const handleUncomplete = async (planId: string) => {
    try {
      await updateTreatmentPlan(clinicId, planId, {
        status: 'planned',
        completed_at: null
      })
      await loadPlans()
    } catch (error) {
      console.error('治療計画の未完了化エラー:', error)
      alert('治療計画の未完了化に失敗しました')
    }
  }

  // 分割モーダルを開く
  // 編集画面：バッジクリックで分割ダイアログを開く
  const handleOpenSplitDialog = (toothNumber: number) => {
    if (!editingPlan) return

    const allTeeth = Array.from(editingSelectedTeeth).sort((a, b) => a - b)
    if (allTeeth.length < 2) {
      alert('分割するには2本以上の歯が必要です')
      return
    }

    setSplitDialogInitialTooth(toothNumber)
    setSplitDialogAllTeeth(allTeeth)
    setSplitDialogPlan(editingPlan)
    setSplitDialogOpen(true)
  }

  // 編集画面：分割確定
  const handleConfirmSplit = async (selectedTeeth: number[]) => {
    if (!splitDialogPlan) return

    try {
      const remainingTeeth = splitDialogAllTeeth.filter(tooth => !selectedTeeth.includes(tooth))

      // 現在の計画より後ろにある計画のsort_orderを1つずつ増やす
      const plansToShift = plans.filter(p => p.sort_order > splitDialogPlan.sort_order)
      for (const plan of plansToShift) {
        await updateTreatmentPlan(clinicId, plan.id, {
          sort_order: plan.sort_order + 1
        })
      }

      // 元の計画の対象歯を更新
      await updateTreatmentPlan(clinicId, splitDialogPlan.id, {
        tooth_number: remainingTeeth.join(', ')
      })

      // 新しい計画を追加（元の計画の次に配置）
      const newPlan = {
        treatment_content: splitDialogPlan.treatment_content,
        tooth_number: selectedTeeth.sort((a, b) => a - b).join(', '),
        staff_type: splitDialogPlan.staff_type,
        priority: splitDialogPlan.priority,
        status: splitDialogPlan.status,
        hygienist_menu_type: splitDialogPlan.hygienist_menu_type,
        periodontal_phase: splitDialogPlan.periodontal_phase,
        memo: splitDialogPlan.memo,
        is_memo: splitDialogPlan.is_memo,
        sort_order: splitDialogPlan.sort_order + 1
      }

      await createTreatmentPlan(clinicId, patientId, newPlan)

      // ダイアログを閉じる
      setSplitDialogOpen(false)
      setSplitDialogPlan(null)
      setSplitDialogInitialTooth(null)
      setSplitDialogAllTeeth([])

      // 編集モードを閉じる
      setEditingPlan(null)
      setEditingSelectedTeeth(new Set())

      // 計画を再読み込み
      await loadPlans()
      alert('治療計画を分割しました')
    } catch (error) {
      console.error('治療計画分割エラー:', error)
      alert('治療計画の分割に失敗しました')
    }
  }

  // 新規追加フォーム：バッジクリックで分割ダイアログを開く
  const handleNewFormOpenSplitDialog = (toothNumber: number) => {
    const allTeeth = Array.from(newFormSelectedTeeth).sort((a, b) => a - b)
    if (allTeeth.length < 2) {
      alert('分割するには2本以上の歯が必要です')
      return
    }

    setNewFormSplitDialogInitialTooth(toothNumber)
    setNewFormSplitDialogOpen(true)
  }

  // 新規追加フォーム：分割確定（表示のみ更新）
  const handleNewFormConfirmSplit = (selectedTeeth: number[]) => {
    const remainingTeeth = Array.from(newFormSelectedTeeth).filter(tooth => !selectedTeeth.includes(tooth))
    setNewFormSelectedTeeth(new Set(remainingTeeth))

    // tooth_numberフィールドを更新
    const toothNumbers = remainingTeeth.sort((a, b) => a - b)
    setFormData({ ...formData, tooth_number: toothNumbers.join(', ') })

    setNewFormSplitDialogOpen(false)
    alert(`${selectedTeeth.join(', ')}番を分割対象として選択しました。保存時に別の計画として追加されます。`)
  }

  // ドクター治療計画追加
  const handleAddDoctorPlan = async () => {
    // 治療内容、歯番号、メモのいずれかが入力されていればOK
    if (!doctorFormData.treatment_content?.trim() && !doctorFormData.tooth_number?.trim() && !doctorFormData.memo?.trim()) {
      alert('治療内容、歯番号、またはメモのいずれかを入力してください')
      return
    }

    try {
      await createTreatmentPlan(clinicId, patientId, {
        ...doctorFormData,
        staff_type: 'doctor',
        is_memo: false,
        sort_order: plans.length
      })
      setDoctorFormData({
        treatment_content: '',
        staff_type: 'doctor',
        priority: 3,
        is_memo: false
      })
      setShowAddDoctorForm(false)
      await loadPlans()
    } catch (error) {
      console.error('ドクター治療計画追加エラー:', error)
      alert('治療計画の追加に失敗しました')
    }
  }

  // 衛生士治療計画追加
  const handleAddHygienistPlan = async () => {
    // 治療内容、歯番号、メモのいずれかが入力されていればOK
    if (!hygienistFormData.treatment_content?.trim() && !hygienistFormData.tooth_number?.trim() && !hygienistFormData.memo?.trim()) {
      alert('治療内容、歯番号、またはメモのいずれかを入力してください')
      return
    }

    try {
      await createTreatmentPlan(clinicId, patientId, {
        ...hygienistFormData,
        staff_type: 'hygienist',
        is_memo: false,
        sort_order: plans.length
      })
      setHygienistFormData({
        treatment_content: '',
        staff_type: 'hygienist',
        priority: 3,
        is_memo: false
      })
      setShowAddHygienistForm(false)
      await loadPlans()
    } catch (error) {
      console.error('衛生士治療計画追加エラー:', error)
      alert('治療計画の追加に失敗しました')
    }
  }

  // 治療計画カードのレンダリング
  const renderPlanCard = (plan: TreatmentPlan, index: number) => {
    const isEditing = editingPlan?.id === plan.id
    const isCompleted = plan.status === 'completed'
    const isDragging = draggedPlan?.id === plan.id
    const isDragOver = dragOverIndex === index

    return (
      <Card
        key={plan.id}
        className={`mb-3 transition-all ${isCompleted ? 'opacity-60' : ''} ${
          isDragging ? 'opacity-30 scale-95' : ''
        } ${isDragOver ? 'border-blue-500 border-2 shadow-lg' : ''}`}
        draggable={!isEditing && !isCompleted}
        onDragStart={(e) => handleDragStart(e, plan)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
        onDrop={(e) => handleDrop(e, plan, index)}
      >
        <CardContent className="p-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* ドラッグハンドル */}
            {!isEditing && !isCompleted && (
              <div className="cursor-move text-gray-400 hover:text-gray-600 flex-shrink-0">
                <GripVertical className="w-5 h-5" />
              </div>
            )}

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">治療内容</Label>
                    <Input
                      value={editingPlan.treatment_content}
                      onChange={(e) => setEditingPlan({ ...editingPlan, treatment_content: e.target.value })}
                      placeholder="治療内容"
                    />
                  </div>

                  {/* 歯式選択 */}
                  <div>
                    <Label className="text-xs mb-2 block">対象歯を選択（クリックで選択/解除）</Label>
                    <div className="max-w-full overflow-x-auto">
                      <DentalChart
                        toothData={Object.keys(latestVisualToothData).length > 0 ? latestVisualToothData : createEmptyToothData()}
                        selectedTeeth={editingSelectedTeeth}
                        onToothClick={(toothNumber) => {
                          const newSelected = new Set(editingSelectedTeeth)
                          if (newSelected.has(toothNumber)) {
                            newSelected.delete(toothNumber)
                          } else {
                            newSelected.add(toothNumber)
                          }
                          setEditingSelectedTeeth(newSelected)
                          // 歯番号フィールドを更新
                          const toothNumbers = Array.from(newSelected).sort((a, b) => a - b)
                          setEditingPlan({ ...editingPlan, tooth_number: toothNumbers.join(', ') })
                        }}
                      />
                    </div>
                    {editingSelectedTeeth.size > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 mb-1">選択中:</div>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(editingSelectedTeeth).sort((a, b) => a - b).map(toothNumber => (
                            <button
                              key={toothNumber}
                              onClick={() => handleOpenSplitDialog(toothNumber)}
                              className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer transition-colors"
                            >
                              {toothNumber}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {editingPlan.staff_type === 'hygienist' && (
                    <div>
                      <Label className="text-xs">衛生士メニュー</Label>
                      <select
                        value={editingPlan.hygienist_menu_type || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, hygienist_menu_type: e.target.value as any })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">選択してください</option>
                        {HYGIENIST_MENU_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">メモ</Label>
                    <Input
                      value={editingPlan.memo || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan, memo: e.target.value })}
                      placeholder="メモを入力"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-1" />
                      保存
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditingPlan(null); setEditingSelectedTeeth(new Set()) }}>
                      <X className="w-4 h-4 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">
                    {plan.tooth_number ? `${formatToothNumber(plan.tooth_number)} ` : ''}{plan.treatment_content}
                    {plan.memo && <span className="text-gray-500 italic ml-2">{plan.memo}</span>}
                  </h4>
                  {isCompleted && (
                    <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-600 ml-2">
                      完了
                    </span>
                  )}
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="flex gap-0">
                {!isCompleted ? (
                  <>
                    <button
                      onClick={() => handleEdit(plan)}
                      className="h-5 w-5 min-w-[1.25rem] p-0 m-0 flex items-center justify-center hover:bg-gray-100 rounded-none transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleComplete(plan.id)}
                      className="h-5 w-5 min-w-[1.25rem] p-0 m-0 flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50 rounded-none transition-colors"
                      title="完了にする"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleUncomplete(plan.id)}
                    className="h-5 w-5 min-w-[1.25rem] p-0 m-0 flex items-center justify-center text-gray-600 hover:text-gray-700 bg-green-50 hover:bg-green-100 rounded-none transition-colors"
                    title="未完了に戻す"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="h-5 w-5 min-w-[1.25rem] p-0 m-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-none transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">治療計画</h2>
              {plans.length > 0 && (
                <span className="text-sm text-gray-400">
                  作成日: {new Date(plans[0].created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasVisualExam && (
                <Button
                  onClick={handleGenerateFromVisualExam}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-300 hover:border-purple-400 h-7 w-7 p-0"
                  title="視診から自動生成"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </Button>
              )}
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="h-7 w-7 p-0"
                title="新規追加"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* P検査から自動生成 */}
          {hasPerioExam && perioExams.filter(e => e.examination_phase === 'P_EXAM_2' || e.examination_phase === 'P_EXAM_3').length > 0 && (
            <Card className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">P検査から治療計画を生成</div>
                      <div className="text-sm text-gray-600 mt-1">
                        P検査のポケット深さから自動的にSRP・P重防・SPTの計画を作成できます
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={selectedPerioExam || ''}
                      onChange={(e) => setSelectedPerioExam(e.target.value)}
                      className="p-2 border rounded text-sm"
                    >
                      <option value="">P検査を選択</option>
                      {perioExams
                        .filter(e => e.examination_phase === 'P_EXAM_2' || e.examination_phase === 'P_EXAM_3')
                        .map(exam => (
                          <option key={exam.id} value={exam.id}>
                            {exam.examination_phase === 'P_EXAM_2' ? 'P検査2' : 'P検査3'} - {new Date(exam.examination_date).toLocaleDateString('ja-JP')}
                          </option>
                        ))}
                    </select>
                    <Button
                      onClick={handleGenerateFromPerioExam}
                      disabled={!selectedPerioExam}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      生成
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 追加フォーム */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>新しい治療計画を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-[200px_1fr] gap-4">
                <div>
                  <Label>担当者区分</Label>
                  <div className="flex space-x-4 mt-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.staff_type === 'doctor'}
                        onChange={() => setFormData({ ...formData, staff_type: 'doctor' })}
                      />
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                      <span>ドクター</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={formData.staff_type === 'hygienist'}
                        onChange={() => setFormData({ ...formData, staff_type: 'hygienist' })}
                      />
                      <UserCog className="w-5 h-5 text-green-600" />
                      <span>衛生士</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>治療内容 *</Label>
                  <Input
                    value={formData.treatment_content}
                    onChange={(e) => setFormData({ ...formData, treatment_content: e.target.value })}
                    placeholder="例: CR充填、抜歯、TBIなど"
                  />
                </div>
              </div>

              {/* 歯式選択 */}
              <div>
                <Label className="mb-2 block">対象歯を選択（クリックで選択/解除）</Label>
                <div className="max-w-full overflow-x-auto">
                  <DentalChart
                    toothData={Object.keys(latestVisualToothData).length > 0 ? latestVisualToothData : createEmptyToothData()}
                    selectedTeeth={newFormSelectedTeeth}
                    onToothClick={(toothNumber) => {
                      const newSelected = new Set(newFormSelectedTeeth)
                      if (newSelected.has(toothNumber)) {
                        newSelected.delete(toothNumber)
                      } else {
                        newSelected.add(toothNumber)
                      }
                      setNewFormSelectedTeeth(newSelected)
                      // 歯番号フィールドを更新
                      const toothNumbers = Array.from(newSelected).sort((a, b) => a - b)
                      setFormData({ ...formData, tooth_number: toothNumbers.join(', ') })
                    }}
                  />
                </div>
                {newFormSelectedTeeth.size > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">選択中:</div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(newFormSelectedTeeth).sort((a, b) => a - b).map(toothNumber => (
                        <button
                          key={toothNumber}
                          onClick={() => handleNewFormOpenSplitDialog(toothNumber)}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer transition-colors"
                        >
                          {toothNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {formData.staff_type === 'hygienist' && (
                <div>
                  <Label>衛生士メニュー</Label>
                  <select
                    value={formData.hygienist_menu_type || ''}
                    onChange={(e) => setFormData({ ...formData, hygienist_menu_type: e.target.value as any })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">選択してください</option>
                    {HYGIENIST_MENU_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <Label>歯周病フェーズ</Label>
                <select
                  value={formData.periodontal_phase || ''}
                  onChange={(e) => setFormData({ ...formData, periodontal_phase: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="">選択してください</option>
                  {PERIODONTAL_PHASE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>メモ</Label>
                <Input
                  value={formData.memo || ''}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="メモを入力"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => { setShowAddForm(false); setNewFormSelectedTeeth(new Set()) }}>
                  キャンセル
                </Button>
                <Button onClick={handleAdd}>追加</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveStaffTab('doctor')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              activeStaffTab === 'doctor'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Stethoscope className="w-4 h-4" />
              <span>ドクター ({doctorPlans.length}件)</span>
            </div>
          </button>
          <button
            onClick={() => setActiveStaffTab('hygienist')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-colors ${
              activeStaffTab === 'hygienist'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <UserCog className="w-4 h-4" />
              <span>衛生士 ({hygienistPlansForCards.length}件)</span>
            </div>
          </button>
        </div>

        {/* タブコンテンツとメモ欄 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.5fr] gap-6">
          {/* タブコンテンツ */}
          <div>
            {/* ドクタータブ */}
            {activeStaffTab === 'doctor' && (
              <div>

            {/* ドクター追加フォーム */}
            {showAddDoctorForm && (
              <Card className="mb-3 bg-blue-50 border-blue-200">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-sm">治療内容 *</Label>
                    <Input
                      value={doctorFormData.treatment_content}
                      onChange={(e) => setDoctorFormData({ ...doctorFormData, treatment_content: e.target.value })}
                      placeholder="例: 46番 Cr(メタル)"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">対象歯（任意）</Label>
                      <Input
                        value={doctorFormData.tooth_number || ''}
                        onChange={(e) => setDoctorFormData({ ...doctorFormData, tooth_number: e.target.value })}
                        placeholder="例: 46"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">メモ（任意）</Label>
                    <Input
                      value={doctorFormData.memo || ''}
                      onChange={(e) => setDoctorFormData({ ...doctorFormData, memo: e.target.value })}
                      placeholder="例: 保険適用"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddDoctorPlan} className="bg-blue-600 hover:bg-blue-700">
                      <Check className="w-4 h-4 mr-1" />
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddDoctorForm(false)
                        setDoctorFormData({
                          treatment_content: '',
                          staff_type: 'doctor',
                          priority: 3,
                          is_memo: false
                        })
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ドクター計画リスト */}
            {doctorPlans.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  ドクターの治療計画はまだ登録されていません
                </CardContent>
              </Card>
            ) : (
              <div>
                {doctorPlans.map((plan, index) => renderPlanCard(plan, index))}
              </div>
            )}

            {/* ドクター追加ボタン（右下配置） */}
            <div className="flex justify-end mt-3">
              <Button
                onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                治療計画追加
              </Button>
            </div>
              </div>
            )}

            {/* 衛生士タブ */}
            {activeStaffTab === 'hygienist' && (
              <div>
                {/* 歯周治療フローチャート - PeriodontalFlowCollapsibleCompactコンポーネント使用 */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">歯周治療フロー</h4>
                      <p className="text-xs text-gray-500 mt-1">フェーズをクリックして完了/未完了を切り替え、分岐ボタンで治療方針を選択</p>
                    </div>
                    <PeriodontalFlowCollapsibleCompact
                      plans={hygienistPlans}
                      onPhaseToggle={handlePhaseToggle}
                      onBranchSelect={handleBranchSelect}
                      onTodoToggle={async (planId, isCompleted) => {
                        if (isCompleted) {
                          await handleUncomplete(planId)
                        } else {
                          await handleComplete(planId)
                        }
                      }}
                      onEditTodo={handleEditSrpTodo}
                      onAddTodo={handleAddSrpTodo}
                      deepPocketTeeth={deepPocketTeeth}
                      missingTeeth={missingTeeth}
                      patientId={patientId}
                      clinicId={clinicId}
                    />
                  </CardContent>
                </Card>


            {/* 衛生士追加フォーム */}
            {showAddHygienistForm && (
              <Card className="mb-3 bg-green-50 border-green-200">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <Label className="text-sm">治療内容 *</Label>
                    <Input
                      value={hygienistFormData.treatment_content}
                      onChange={(e) => setHygienistFormData({ ...hygienistFormData, treatment_content: e.target.value })}
                      placeholder="例: P検査・SRP"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">対象歯（任意）</Label>
                      <Input
                        value={hygienistFormData.tooth_number || ''}
                        onChange={(e) => setHygienistFormData({ ...hygienistFormData, tooth_number: e.target.value })}
                        placeholder="例: 全顎"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">メモ（任意）</Label>
                    <Input
                      value={hygienistFormData.memo || ''}
                      onChange={(e) => setHygienistFormData({ ...hygienistFormData, memo: e.target.value })}
                      placeholder="例: 次回予約時実施"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddHygienistPlan} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-1" />
                      追加
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddHygienistForm(false)
                        setHygienistFormData({
                          treatment_content: '',
                          staff_type: 'hygienist',
                          priority: 3,
                          is_memo: false
                        })
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 衛生士計画リスト（歯周フローのTODOを除外） */}
            {hygienistPlansForCards.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  衛生士の治療計画はまだ登録されていません
                </CardContent>
              </Card>
            ) : (
              <div>
                {hygienistPlansForCards.map((plan, index) => renderPlanCard(plan, index))}
              </div>
            )}

            {/* 衛生士追加ボタン（右下配置） */}
            <div className="flex justify-end mt-3">
              <Button
                onClick={() => setShowAddHygienistForm(!showAddHygienistForm)}
                size="sm"
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-1" />
                治療計画追加
              </Button>
            </div>
              </div>
            )}
          </div>

          {/* メモセクション */}
          <div>
            {/* メモテキストエリア + TODOリスト */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                {/* TODOリスト */}
                {treatmentMemoData.todos.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {treatmentMemoData.todos.map(todo => (
                      <div key={todo.id} className="flex items-center gap-2 group">
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id)}
                          className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                        />
                        <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {todo.text}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* TODO追加入力 */}
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        handleAddTodo()
                      }
                    }}
                    placeholder="TODO追加（Enter で追加）"
                    className="flex-1 px-2 py-1 text-sm border border-amber-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <Button
                    onClick={handleAddTodo}
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 px-2"
                    disabled={!newTodoText.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  {/* テンプレートボタン */}
                  <div ref={templateDropdownRef} className="relative">
                    <Button
                      onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      size="sm"
                      variant="outline"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100 px-2"
                      title="テンプレートからTODOを追加"
                    >
                      <ClipboardList className="w-4 h-4" />
                    </Button>
                    {showTemplateDropdown && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-1">
                          {memoTodoTemplates.length > 0 ? (
                            memoTodoTemplates.map(template => (
                              <button
                                key={template.id}
                                onClick={() => handleApplyTemplate(template)}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                              >
                                {template.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              テンプレート未登録
                              <div className="mt-1 text-xs text-gray-400">設定 → マスタ → メモTODO</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 自由記述エリア */}
                <textarea
                  value={treatmentMemoData.freeText}
                  onChange={(e) => handleFreeTextChange(e.target.value)}
                  placeholder="治療に関するメモや所見を自由に記入してください..."
                  className="w-full h-20 p-3 border border-amber-200 rounded-md bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={handleSaveTreatmentMemo}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700"
                    disabled={treatmentMemoSaving}
                  >
                    {treatmentMemoSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        保存
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 治療計画プレビューモーダル */}
      <TreatmentPlanPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        proposals={generatedProposals}
        onConfirm={handleConfirmGeneration}
        onRestorationSelect={handleRestorationSelect}
        visualExamDate={latestVisualExamDate}
      />

      {/* 歯選択モーダル */}
      <ToothSelectorModal
        isOpen={showToothSelector}
        onClose={() => setShowToothSelector(false)}
        onSelect={handleToothSelect}
        initialSelected={selectedTeeth}
      />

      {/* 編集画面用の分割ダイアログ */}
      {splitDialogInitialTooth !== null && (
        <ToothSplitDialog
          isOpen={splitDialogOpen}
          onClose={() => {
            setSplitDialogOpen(false)
            setSplitDialogInitialTooth(null)
            setSplitDialogPlan(null)
          }}
          onConfirm={handleConfirmSplit}
          allTeeth={splitDialogAllTeeth}
          initialSelectedTooth={splitDialogInitialTooth}
        />
      )}

      {/* 新規追加フォーム用の分割ダイアログ */}
      {newFormSplitDialogInitialTooth !== null && (
        <ToothSplitDialog
          isOpen={newFormSplitDialogOpen}
          onClose={() => {
            setNewFormSplitDialogOpen(false)
            setNewFormSplitDialogInitialTooth(null)
          }}
          onConfirm={handleNewFormConfirmSplit}
          allTeeth={Array.from(newFormSelectedTeeth).sort((a, b) => a - b)}
          initialSelectedTooth={newFormSplitDialogInitialTooth}
        />
      )}

      {/* SRP/Fop編集ダイアログ */}
      {editingSrpPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-auto">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              対象部位を編集
            </h3>
            <div className="mb-4">
              {/* 歯列表 */}
              <div
                className="border rounded-lg p-3 bg-gray-50 select-none"
                onMouseUp={handleEditDragEnd}
                onMouseLeave={handleEditDragEnd}
                onTouchEnd={handleEditDragEnd}
              >
                {/* 上顎 */}
                <div className="flex justify-center gap-0.5 mb-1">
                  {/* 右上 (18-11) */}
                  {[18, 17, 16, 15, 14, 13, 12, 11].map(tooth => {
                    const isExisting = editingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = editingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleEditDragStart(tooth)}
                        onMouseEnter={() => handleEditDragEnter(tooth)}
                        onTouchStart={() => handleEditDragStart(tooth)}
                        onClick={() => !isDraggingEdit && handleToggleSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                  <div className="w-2" />
                  {/* 左上 (21-28) */}
                  {[21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                    const isExisting = editingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = editingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleEditDragStart(tooth)}
                        onMouseEnter={() => handleEditDragEnter(tooth)}
                        onTouchStart={() => handleEditDragStart(tooth)}
                        onClick={() => !isDraggingEdit && handleToggleSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                </div>
                {/* 区切り線 */}
                <div className="flex justify-center items-center my-1">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-2 text-xs text-gray-400">上</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                <div className="flex justify-center items-center my-1">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-2 text-xs text-gray-400">下</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                {/* 下顎 */}
                <div className="flex justify-center gap-0.5 mt-1">
                  {/* 右下 (48-41) */}
                  {[48, 47, 46, 45, 44, 43, 42, 41].map(tooth => {
                    const isExisting = editingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = editingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleEditDragStart(tooth)}
                        onMouseEnter={() => handleEditDragEnter(tooth)}
                        onTouchStart={() => handleEditDragStart(tooth)}
                        onClick={() => !isDraggingEdit && handleToggleSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                  <div className="w-2" />
                  {/* 左下 (31-38) */}
                  {[31, 32, 33, 34, 35, 36, 37, 38].map(tooth => {
                    const isExisting = editingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = editingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleEditDragStart(tooth)}
                        onMouseEnter={() => handleEditDragEnter(tooth)}
                        onTouchStart={() => handleEditDragStart(tooth)}
                        onClick={() => !isDraggingEdit && handleToggleSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                </div>
                {/* ラベル */}
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>右</span>
                  <span>左</span>
                </div>
              </div>
              {/* 選択中の歯番号 */}
              <p className="text-xs text-gray-500 mt-2">
                選択中: {editingSrpSelectedTeeth.size > 0
                  ? Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b).join(', ')
                  : 'なし'}
              </p>
            </div>
            <div className="flex gap-2 justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteSrpTodo}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </Button>
                {/* 分割ボタン（2本以上選択中、かつ未完了の場合のみ表示） */}
                {editingSrpSelectedTeeth.size >= 2 && editingSrpPlan?.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const firstTooth = Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b)[0]
                      handleOpenSrpSplitDialog(firstTooth)
                    }}
                    className="text-purple-600 hover:bg-purple-50 hover:text-purple-700 border-purple-200"
                  >
                    <Split className="w-4 h-4 mr-1" />
                    分割
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelSrpEdit}
                >
                  キャンセル
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSrpEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SRP/Fop用分割ダイアログ */}
      {srpSplitDialogInitialTooth !== null && editingSrpPlan && (
        <ToothSplitDialog
          isOpen={srpSplitDialogOpen}
          onClose={() => {
            setSrpSplitDialogOpen(false)
            setSrpSplitDialogInitialTooth(null)
          }}
          onConfirm={handleConfirmSrpSplit}
          allTeeth={Array.from(editingSrpSelectedTeeth).sort((a, b) => a - b)}
          initialSelectedTooth={srpSplitDialogInitialTooth}
        />
      )}

      {/* SRP/Fop追加ダイアログ */}
      {addingSrpPhaseId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-4 w-auto">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              部位を追加
            </h3>
            <div className="mb-4">
              {/* 歯列表 */}
              <div
                className="border rounded-lg p-3 bg-gray-50 select-none"
                onMouseUp={handleAddDragEnd}
                onMouseLeave={handleAddDragEnd}
                onTouchEnd={handleAddDragEnd}
              >
                {/* 上顎 */}
                <div className="flex justify-center gap-0.5 mb-1">
                  {/* 右上 (18-11) */}
                  {[18, 17, 16, 15, 14, 13, 12, 11].map(tooth => {
                    const isExisting = addingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = addingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleAddDragStart(tooth)}
                        onMouseEnter={() => handleAddDragEnter(tooth)}
                        onTouchStart={() => handleAddDragStart(tooth)}
                        onClick={() => !isDragging && handleToggleAddSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                  <div className="w-2" />
                  {/* 左上 (21-28) */}
                  {[21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                    const isExisting = addingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = addingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleAddDragStart(tooth)}
                        onMouseEnter={() => handleAddDragEnter(tooth)}
                        onTouchStart={() => handleAddDragStart(tooth)}
                        onClick={() => !isDragging && handleToggleAddSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                </div>
                {/* 区切り線 */}
                <div className="flex justify-center items-center my-1">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-2 text-xs text-gray-400">上</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                <div className="flex justify-center items-center my-1">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-2 text-xs text-gray-400">下</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>
                {/* 下顎 */}
                <div className="flex justify-center gap-0.5 mt-1">
                  {/* 右下 (48-41) */}
                  {[48, 47, 46, 45, 44, 43, 42, 41].map(tooth => {
                    const isExisting = addingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = addingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleAddDragStart(tooth)}
                        onMouseEnter={() => handleAddDragEnter(tooth)}
                        onTouchStart={() => handleAddDragStart(tooth)}
                        onClick={() => !isDragging && handleToggleAddSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                  <div className="w-2" />
                  {/* 左下 (31-38) */}
                  {[31, 32, 33, 34, 35, 36, 37, 38].map(tooth => {
                    const isExisting = addingSrpExistingTeeth.includes(tooth)
                    const isMissing = missingTeeth.includes(tooth)
                    const isDisabled = isExisting || isMissing
                    const isSelected = addingSrpSelectedTeeth.has(tooth)
                    return (
                      <button
                        key={tooth}
                        onMouseDown={() => handleAddDragStart(tooth)}
                        onMouseEnter={() => handleAddDragEnter(tooth)}
                        onTouchStart={() => handleAddDragStart(tooth)}
                        onClick={() => !isDragging && handleToggleAddSrpTooth(tooth)}
                        disabled={isDisabled}
                        className={`w-7 h-7 text-xs font-medium rounded transition-all ${
                          isDisabled
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50'
                        }`}
                      >
                        {tooth % 10}
                      </button>
                    )
                  })}
                </div>
                {/* ラベル */}
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>右</span>
                  <span>左</span>
                </div>
              </div>
              {/* 選択中の歯番号 */}
              <p className="text-xs text-gray-500 mt-2">
                選択中: {addingSrpSelectedTeeth.size > 0
                  ? Array.from(addingSrpSelectedTeeth).sort((a, b) => a - b).join(', ')
                  : 'なし'}
              </p>
              {addingSrpExistingTeeth.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  ※グレーの歯は既に登録済み
                </p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelAddSrp}
              >
                キャンセル
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAddSrp}
                disabled={addingSrpSelectedTeeth.size === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                追加
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
