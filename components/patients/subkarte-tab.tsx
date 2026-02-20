'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'
import { useAuth } from '@/components/providers/auth-provider'
import { getClinicSetting } from '@/lib/api/clinic'
import {
  getSubKarteEntries,
  createSubKarteEntry,
  updateSubKarteEntry,
  deleteSubKarteEntry
} from '@/lib/api/subkarte'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// 古いRecordingContractModalは削除
import { HandwritingModal } from '@/components/ui/handwriting-modal'
import { AudioRecordingModal } from '@/components/ui/audio-recording-modal'
import { getStaff } from '@/lib/api/staff'
import { getPatientTreatmentMemo, updatePatientTreatmentMemo } from '@/lib/api/patients'
import { TreatmentPlanTodos } from './treatment-plan-todos'
import { getActiveMemoTodoTemplates, parseTemplateItems, MemoTodoTemplate } from '@/lib/api/memo-todo-templates'
import {
  getPatientAlertNotes,
  checkTodayConfirmation,
  recordTodayConfirmation,
  PatientAlertNote
} from '@/lib/api/patient-alert-notes'
import {
  FileText,
  Mic,
  MicOff,
  Upload,
  Palette,
  Eraser,
  Save,
  Trash2,
  Download,
  Play,
  Pause,
  Square,
  Type,
  Pen,
  Image,
  File,
  FileSignature,
  Edit,
  X,
  Highlighter,
  User,
  StickyNote,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  AlertTriangle
} from 'lucide-react'

interface SubKarteEntry {
  id: string
  type: 'text' | 'handwriting' | 'audio' | 'file' | 'template' | 'mixed'
  content: string
  metadata: any
  createdAt: string
  staffName: string
}

interface SubKarteTabProps {
  patientId: string
  layout?: 'vertical' | 'horizontal' // vertical: 右側に記入欄（デフォルト）, horizontal: 下に記入欄
}

export function SubKarteTab({ patientId, layout = 'vertical' }: SubKarteTabProps) {
  const clinicId = useClinicId()
  const { staff: authStaff } = useAuth()
  // authStaffのIDがUUID形式でない場合（fallback-staff等）はstaffListの最初のスタッフをフォールバックとして使う
  const getCurrentStaffId = () => {
    const authId = authStaff?.id || ''
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId)) {
      return authId
    }
    // フォールバック: staffListの最初のスタッフID
    return staffList[0]?.id || ''
  }
  const [entries, setEntries] = useState<SubKarteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeInputType, setActiveInputType] = useState<'text' | 'handwriting' | 'audio' | 'file'>('text')
  const [textContent, setTextContent] = useState('')
  // 古い録音機能は削除 - 新しいAudioRecordingModalを使用
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [isErasing, setIsErasing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  // 古いRecordingContractModalは削除
  const [showHandwritingModal, setShowHandwritingModal] = useState(false)
  const [showAudioRecordingModal, setShowAudioRecordingModal] = useState(false)
  const [editingHandwritingEntry, setEditingHandwritingEntry] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [markerColor, setMarkerColor] = useState<string | null>(null)
  const [isTextSelected, setIsTextSelected] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [richTextContent, setRichTextContentState] = useState('')
  const [activeColorMode, setActiveColorMode] = useState<'text' | 'marker' | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffList, setStaffList] = useState<Array<{id: string, name: string, position?: {id: string, name: string, sort_order: number}}>>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDefaultTextModal, setShowDefaultTextModal] = useState(false)
  const [defaultTexts, setDefaultTexts] = useState<Array<{id: string, title: string, content: string}>>([])
  const [editTextColor, setEditTextColor] = useState('#000000')
  const [editMarkerColor, setEditMarkerColor] = useState<string | null>(null)
  const [editRichTextContent, setEditRichTextContent] = useState('')
  const [editActiveColorMode, setEditActiveColorMode] = useState<'text' | 'marker' | null>(null)
  // 治療計画メモ（自由記述 + TODOリスト）
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
  const [newTodoText, setNewTodoText] = useState('')
  const [showCompletedTodos, setShowCompletedTodos] = useState(false)
  // メモTODOテンプレート
  const [memoTodoTemplates, setMemoTodoTemplates] = useState<MemoTodoTemplate[]>([])
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
  const [hoveredTemplateId, setHoveredTemplateId] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const templateDropdownRef = useRef<HTMLDivElement>(null)
  // 毎回表示（重要な注意事項）
  const [alertNotes, setAlertNotes] = useState<PatientAlertNote[]>([])
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showAlertIcon, setShowAlertIcon] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const treatmentMemoTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // 古い録音機能のrefは削除 - 新しいAudioRecordingModalを使用

  // DBからサブカルテエントリを読み込み
  const loadEntries = useCallback(async () => {
    setLoading(true)
    try {
      const dbEntries = await getSubKarteEntries(patientId)
      // DB形式 → コンポーネント形式にマッピング
      const mappedEntries: SubKarteEntry[] = dbEntries.map((e: any) => ({
        id: e.id,
        type: e.entry_type || 'text',
        content: e.content || '',
        metadata: e.metadata || {},
        createdAt: e.created_at || new Date().toISOString(),
        staffName: e.staff?.name || '不明'
      }))
      setEntries(mappedEntries)
    } catch (error) {
      console.error('サブカルテエントリの読み込みに失敗:', error)
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // 毎回表示（重要な注意事項）の読み込みとモーダル表示
  useEffect(() => {
    const loadAlertNotes = async () => {
      try {
        const notes = await getPatientAlertNotes(patientId)
        setAlertNotes(notes)

        // 注意事項がある場合のみ、今日確認済みかチェック
        if (notes.length > 0) {
          const confirmed = await checkTodayConfirmation(patientId)
          if (!confirmed) {
            // まだ今日確認していない場合、モーダルを表示
            setShowAlertModal(true)
            setShowAlertIcon(false)
          } else {
            // 既に確認済みの場合、アイコンのみ表示
            setShowAlertModal(false)
            setShowAlertIcon(true)
          }
        }
      } catch (error) {
        console.error('注意事項の読み込みエラー:', error)
      }
    }

    loadAlertNotes()
  }, [patientId])

  // スタッフデータの読み込み
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // 設定ページと同じクリニックIDを使用
        const staffData = await getStaff(clinicId)
        console.log('読み込んだスタッフデータ:', staffData)
        setStaffList(staffData.map(staff => ({
          id: staff.id,
          name: staff.name,
          position: staff.position
        })))
      } catch (error) {
        console.error('スタッフデータの読み込みに失敗:', error)
        // フォールバック: モックデータを使用
        setStaffList([
          { id: '1', name: '田中 太郎', position: { id: '1', name: '院長', sort_order: 1 } },
          { id: '2', name: '佐藤 花子', position: { id: '2', name: '看護師', sort_order: 2 } },
          { id: '3', name: '山田 次郎', position: { id: '3', name: '受付', sort_order: 3 } },
          { id: '4', name: '鈴木 三郎', position: { id: '2', name: '看護師', sort_order: 2 } },
          { id: '5', name: '高橋 美咲', position: { id: '3', name: '受付', sort_order: 3 } },
          { id: '6', name: '伊藤 健太', position: { id: '1', name: '院長', sort_order: 1 } }
        ])
      }
    }
    
    loadStaff()
  }, [])

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
  }, [clinicId])

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

  // 治療計画メモの読み込み関数
  const loadTreatmentMemo = async () => {
    try {
      let rawMemo: string | null = null
      if (isUUID(patientId)) {
        // UUID形式の場合はDBから読み込み
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
      console.error('治療計画メモの読み込みに失敗:', error)
    }
  }

  // 治療計画メモの読み込み（マウント時と patientId 変更時）
  useEffect(() => {
    loadTreatmentMemo()
  }, [patientId])

  // ページがフォーカスを得た時に再読み込み（タブ切り替え対応）
  useEffect(() => {
    const handleFocus = () => {
      loadTreatmentMemo()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [patientId])

  // 治療計画メモの自動保存（デバウンス）- JSON形式
  const saveTreatmentMemoData = async (data: TreatmentMemoData) => {
    const memoJson = JSON.stringify(data)
    console.log('治療計画メモ保存開始:', memoJson, 'isUUID:', isUUID(patientId))
    try {
      setTreatmentMemoSaving(true)
      if (isUUID(patientId)) {
        // UUID形式の場合はDBに保存
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
    } catch (error) {
      console.error('治療計画メモの保存に失敗:', error)
    } finally {
      setTreatmentMemoSaving(false)
    }
  }

  // 注意事項モーダルの確認ボタン
  const handleConfirmAlert = async () => {
    try {
      await recordTodayConfirmation(patientId)
      setShowAlertModal(false)
      setShowAlertIcon(true)
    } catch (error) {
      console.error('確認記録のエラー:', error)
      alert('確認の記録に失敗しました')
    }
  }

  // 自由記述の変更
  const handleFreeTextChange = (value: string) => {
    const newData = { ...treatmentMemoData, freeText: value }
    setTreatmentMemoData(newData)

    // 既存のタイムアウトをクリア
    if (treatmentMemoTimeoutRef.current) {
      clearTimeout(treatmentMemoTimeoutRef.current)
    }

    // 1秒後に保存
    treatmentMemoTimeoutRef.current = setTimeout(() => {
      saveTreatmentMemoData(newData)
    }, 1000)
  }

  // TODO追加
  const handleAddTodo = () => {
    if (!newTodoText.trim()) return
    const newTodo: MemoTodo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newTodoText.trim(),
      completed: false
    }
    const newData = {
      ...treatmentMemoData,
      todos: [...treatmentMemoData.todos, newTodo]
    }
    setTreatmentMemoData(newData)
    setNewTodoText('')
    saveTreatmentMemoData(newData)
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
      const newData = {
        ...treatmentMemoData,
        todos: [...treatmentMemoData.todos, ...newTodos]
      }
      setTreatmentMemoData(newData)
      saveTreatmentMemoData(newData)
    }

    setShowTemplateDropdown(false)
  }

  // TODOのチェック状態を切り替え
  const handleToggleTodo = (todoId: string) => {
    const newData = {
      ...treatmentMemoData,
      todos: treatmentMemoData.todos.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    }
    setTreatmentMemoData(newData)
    saveTreatmentMemoData(newData)
  }

  // TODOを削除
  const handleDeleteTodo = (todoId: string) => {
    const newData = {
      ...treatmentMemoData,
      todos: treatmentMemoData.todos.filter(todo => todo.id !== todoId)
    }
    setTreatmentMemoData(newData)
    saveTreatmentMemoData(newData)
  }

  // デフォルトテキストの読み込み（clinic_settingsから取得）
  useEffect(() => {
    const loadDefaultTexts = async () => {
      try {
        const savedTexts = await getClinicSetting(clinicId, 'default_texts')
        console.log('clinic_settingsから取得したデフォルトテキスト:', savedTexts)
        if (savedTexts && Array.isArray(savedTexts)) {
          setDefaultTexts(savedTexts)
          console.log('読み込んだデフォルトテキスト:', savedTexts)
        } else {
          console.log('デフォルトテキストが見つかりません')
        }
      } catch (error) {
        console.error('デフォルトテキストの読み込みエラー:', error)
      }
    }
    loadDefaultTexts()
  }, [clinicId])

  // スタッフ選択の処理
  const handleStaffSelect = (staffId: string) => {
    setSelectedStaff(prev => 
      prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  // 選択されたスタッフ名を取得
  const getSelectedStaffNames = () => {
    return selectedStaff
      .map(id => staffList.find(staff => staff.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  // スタッフを役職ごとにグループ化
  const getStaffByPosition = () => {
    const grouped = staffList.reduce((groups: { [key: string]: typeof staffList }, staff) => {
      const positionName = staff.position?.name || '未設定'
      if (!groups[positionName]) {
        groups[positionName] = []
      }
      groups[positionName].push(staff)
      return groups
    }, {})

    // 役職の並び順でソート
    return Object.keys(grouped)
      .sort((a, b) => {
        const positionA = staffList.find(s => s.position?.name === a)?.position?.sort_order || 999
        const positionB = staffList.find(s => s.position?.name === b)?.position?.sort_order || 999
        return positionA - positionB
      })
      .map(positionName => ({
        positionName,
        staff: grouped[positionName]
      }))
  }

  // モックデータを取得する関数
  const getMockEntries = (): SubKarteEntry[] => [
    {
      id: '1',
      type: 'text',
      content: '患者様の状態は良好です。特に問題はありません。',
      metadata: {},
      createdAt: '2024-01-15T19:30:00Z',
      staffName: '田中 太郎'
    },
    {
      id: '2',
      type: 'template',
      content: '初診時の挨拶文',
      metadata: { templateId: 'template_1' },
      createdAt: '2024-01-15T18:15:00Z',
      staffName: '佐藤 花子'
    },
    {
      id: '3',
      type: 'audio',
      content: '音声記録の内容',
      metadata: { duration: 120 },
      createdAt: '2024-01-14T16:45:00Z',
      staffName: '山田 次郎'
    },
    {
      id: '4',
      type: 'file',
      content: '画像ファイルの添付',
      metadata: { fileName: 'xray.jpg' },
      createdAt: '2024-01-14T14:20:00Z',
      staffName: '鈴木 三郎'
    }
  ]

  // エントリを日付ごとにグループ化
  const groupEntriesByDate = (entries: SubKarteEntry[]) => {
    const grouped = entries.reduce((groups, entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(entry)
      return groups
    }, {} as Record<string, SubKarteEntry[]>)

    // 各日付グループ内でエントリを新しい順にソート
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })

    // 日付順でソート
    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }

  // 古い録音機能は削除 - 新しいAudioRecordingModalを使用

  // 手書き機能の初期化
  useEffect(() => {
    if (activeInputType === 'handwriting' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = brushSize
        ctx.strokeStyle = selectedColor
      }
    }
  }, [activeInputType, brushSize, selectedColor])

  // 手書き描画
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeInputType !== 'handwriting') return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - rect.left
      const newY = e.clientY - rect.top
      
      if (isErasing) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = brushSize * 2
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.lineWidth = brushSize
        ctx.strokeStyle = selectedColor
      }
      
      ctx.lineTo(newX, newY)
      ctx.stroke()
    }

    const handleMouseUp = () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
  }

  // ファイルアップロード（DB経由）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        alert(`${file.name}は5MBを超えています`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      // ファイル選択後、すぐにDBエントリとして保存
      for (const file of validFiles) {
        try {
          const created = await createSubKarteEntry({
            patient_id: patientId,
            staff_id: getCurrentStaffId(),
            entry_type: 'file',
            content: file.name,
            metadata: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type
            },
          })

          const entry: SubKarteEntry = {
            id: created.id,
            type: 'file',
            content: file.name,
            staffName: authStaff?.name || '現在のスタッフ',
            createdAt: created.created_at || new Date().toISOString(),
            metadata: created.metadata || { fileName: file.name, fileSize: file.size, fileType: file.type },
          }
          setEntries(prev => [entry, ...prev])
        } catch (error) {
          console.error('ファイルエントリ保存エラー:', error)
          alert(`${file.name}の保存に失敗しました`)
        }
      }
    }

    // ファイル入力をリセット
    e.target.value = ''
  }

  // エントリ編集開始
  const startEditEntry = (entry: SubKarteEntry) => {
    setEditingEntry(entry.id)
    setEditContent(entry.content)
    // HTMLコンテンツをそのまま使用（色情報を保持）
    setEditRichTextContent(entry.content)
    setEditTextColor(entry.metadata?.color || '#000000')
    setEditMarkerColor(entry.metadata?.markerColor || null)
    
    // 色モードを設定
    if (entry.metadata?.markerColor) {
      setEditActiveColorMode('marker')
    } else if (entry.metadata?.color && entry.metadata.color !== '#000000') {
      setEditActiveColorMode('text')
    } else {
      setEditActiveColorMode(null)
    }
    
    setShowEditModal(true)
  }

  // エントリ編集保存（DB経由）
  const saveEditEntry = async (entryId: string) => {
    try {
      // HTMLコンテンツをそのまま保存（色情報はHTMLに含まれている）
      const content = editRichTextContent
      const newMetadata = { color: editTextColor, markerColor: editMarkerColor }

      // DB更新
      await updateSubKarteEntry(entryId, {
        content,
        metadata: newMetadata,
      })

      // ローカルステートを更新
      setEntries(prev =>
        prev.map(entry =>
          entry.id === entryId
            ? { ...entry, content, metadata: { ...entry.metadata, ...newMetadata } }
            : entry
        )
      )
      setEditingEntry(null)
      setEditContent('')
      setEditRichTextContent('')
      setEditTextColor('#000000')
      setEditMarkerColor(null)
      setEditActiveColorMode(null)
      setShowEditModal(false)
    } catch (error) {
      console.error('編集保存エラー:', error)
      alert('編集の保存に失敗しました')
    }
  }

  // 編集用テキスト色の変更
  const applyEditTextColor = (color: string) => {
    const editor = document.getElementById('edit-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // 選択されたテキストを色付きspanで囲む
          const span = document.createElement('span')
          span.style.color = color
          span.textContent = selectedText
          
          range.deleteContents()
          range.insertNode(span)
          
          // 選択を解除してカーソルをspanの後に移動
          selection.removeAllRanges()
          const newRange = document.createRange()
          newRange.setStartAfter(span)
          newRange.setEndAfter(span)
          selection.addRange(newRange)
          
          // エディタの内容を更新
          setEditRichTextContent(editor.innerHTML)
          
          // 色モードを解除
          setEditActiveColorMode(null)
          setEditTextColor('#000000')
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }

  // 編集用マーカー色の適用
  const applyEditMarkerColor = (color: string) => {
    const editor = document.getElementById('edit-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // シンプルな方法：選択範囲内にspanタグがあるかチェック
          const container = range.commonAncestorContainer
          const isAlreadyMarked = container.nodeType === Node.ELEMENT_NODE && 
            (container as HTMLElement).tagName === 'SPAN' &&
            (container as HTMLElement).style.backgroundColor &&
            (container as HTMLElement).style.backgroundColor !== 'transparent'
          
          if (isAlreadyMarked) {
            // 既にマーカーが適用されている場合は解除
            const textNode = document.createTextNode(selectedText)
            range.deleteContents()
            range.insertNode(textNode)
            
            // 選択を解除してカーソルをテキストノードの後に移動
            selection.removeAllRanges()
            const newRange = document.createRange()
            newRange.setStartAfter(textNode)
            newRange.setEndAfter(textNode)
            selection.addRange(newRange)
          } else {
            // マーカーを適用
            const span = document.createElement('span')
            span.style.backgroundColor = color
            span.style.color = '#000000'
            span.textContent = selectedText
            
            range.deleteContents()
            range.insertNode(span)
            
            // 選択を解除してカーソルをspanの後に移動
            selection.removeAllRanges()
            const newRange = document.createRange()
            newRange.setStartAfter(span)
            newRange.setEndAfter(span)
            selection.addRange(newRange)
          }
          
          // エディタの内容を更新
          setEditRichTextContent(editor.innerHTML)
          
          // マーカーモードを解除
          setEditActiveColorMode(null)
          setEditMarkerColor(null)
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }

  // 編集用色の解除
  const removeEditColor = () => {
    const editor = document.getElementById('edit-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // フォーカスをエディタに設定
          editor.focus()
          
          // 選択範囲を削除してプレーンテキストを挿入
          const textNode = document.createTextNode(selectedText)
          range.deleteContents()
          range.insertNode(textNode)
          
          // 選択を解除してカーソルをテキストノードの後に移動
          selection.removeAllRanges()
          const newRange = document.createRange()
          newRange.setStartAfter(textNode)
          newRange.setEndAfter(textNode)
          selection.addRange(newRange)
          
          // エディタの内容を更新
          setEditRichTextContent(editor.innerHTML)
          
          // 色モードを解除
          setEditActiveColorMode(null)
          setEditTextColor('#000000')
          setEditMarkerColor(null)
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }

  // エントリ編集キャンセル
  const cancelEditEntry = () => {
    setEditingEntry(null)
    setEditContent('')
    setEditRichTextContent('')
    setEditTextColor('#000000')
    setEditMarkerColor(null)
    setEditActiveColorMode(null)
    setShowEditModal(false)
  }

  // 編集モーダルの内容を更新（カーソル位置を保持）
  useEffect(() => {
    if (showEditModal) {
      const editor = document.getElementById('edit-rich-text-editor') as HTMLDivElement
      if (editor && editRichTextContent !== editor.innerHTML) {
        // カーソル位置を保存
        const selection = window.getSelection()
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
        const cursorOffset = range ? range.startOffset : 0
        
        // 内容を更新
        editor.innerHTML = editRichTextContent
        
        // カーソル位置を復元
        if (range) {
          try {
            const newRange = document.createRange()
            const textNode = editor.firstChild
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
              newRange.setEnd(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
              selection?.removeAllRanges()
              selection?.addRange(newRange)
            }
          } catch (e) {
            // カーソル位置の復元に失敗した場合は無視
          }
        }
      }
    }
  }, [editRichTextContent, showEditModal])

  // メイン入力欄の内容を更新（カーソル位置を保持）
  useEffect(() => {
    const editor = document.getElementById('main-rich-text-editor') as HTMLDivElement
    if (editor && richTextContent !== editor.innerHTML) {
      // カーソル位置を保存
      const selection = window.getSelection()
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      const cursorOffset = range ? range.startOffset : 0
      
      // 内容を更新
      editor.innerHTML = richTextContent
      
      // カーソル位置を復元
      if (range) {
        try {
          const newRange = document.createRange()
          const textNode = editor.firstChild
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
            newRange.setEnd(textNode, Math.min(cursorOffset, textNode.textContent?.length || 0))
            selection?.removeAllRanges()
            selection?.addRange(newRange)
          }
        } catch (e) {
          // カーソル位置の復元に失敗した場合は無視
        }
      }
    }
  }, [richTextContent])

  // エントリ削除
  const deleteEntry = async (entryId: string) => {
    if (!confirm('このエントリを削除しますか？')) return

    try {
      await deleteSubKarteEntry(entryId)
      setEntries(prev => prev.filter(entry => entry.id !== entryId))
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  // テキスト選択の処理
  const handleTextSelection = () => {
    const textarea = document.getElementById('text-input') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = textarea.value.substring(start, end)
      
      setIsTextSelected(selected.length > 0)
      setSelectedText(selected)
    }
  }

  // テキスト色の変更
  const applyTextColor = (color: string) => {
    const editor = document.getElementById('main-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // 選択されたテキストを色付きspanで囲む
          const span = document.createElement('span')
          span.style.color = color
          span.textContent = selectedText
          
          range.deleteContents()
          range.insertNode(span)
          
          // 選択を解除してカーソルをspanの後に移動
          selection.removeAllRanges()
          const newRange = document.createRange()
          newRange.setStartAfter(span)
          newRange.setEndAfter(span)
          selection.addRange(newRange)
          
          // エディタの内容を更新
          setRichTextContentState(editor.innerHTML)
          
          // 色モードを解除
          setActiveColorMode(null)
          setTextColor('#000000')
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }

  // マーカー色の適用
  const applyMarkerColor = (color: string) => {
    const editor = document.getElementById('main-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // シンプルな方法：選択範囲内にspanタグがあるかチェック
          const container = range.commonAncestorContainer
          const isAlreadyMarked = container.nodeType === Node.ELEMENT_NODE && 
            (container as HTMLElement).tagName === 'SPAN' &&
            (container as HTMLElement).style.backgroundColor &&
            (container as HTMLElement).style.backgroundColor !== 'transparent'
          
          if (isAlreadyMarked) {
            // 既にマーカーが適用されている場合は解除
            const textNode = document.createTextNode(selectedText)
            range.deleteContents()
            range.insertNode(textNode)
            
            // 選択を解除してカーソルをテキストノードの後に移動
            selection.removeAllRanges()
            const newRange = document.createRange()
            newRange.setStartAfter(textNode)
            newRange.setEndAfter(textNode)
            selection.addRange(newRange)
          } else {
            // マーカーを適用
            const span = document.createElement('span')
            span.style.backgroundColor = color
            span.style.color = '#000000'
            span.textContent = selectedText
            
            range.deleteContents()
            range.insertNode(span)
            
            // 選択を解除してカーソルをspanの後に移動
            selection.removeAllRanges()
            const newRange = document.createRange()
            newRange.setStartAfter(span)
            newRange.setEndAfter(span)
            selection.addRange(newRange)
          }
          
          // エディタの内容を更新
          setRichTextContentState(editor.innerHTML)
          
          // マーカーモードを解除
          setActiveColorMode(null)
          setMarkerColor(null)
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }

  // 色の解除
  const removeColor = () => {
    const editor = document.getElementById('main-rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // フォーカスをエディタに設定
          editor.focus()
          
          // 選択範囲を削除してプレーンテキストを挿入
          const textNode = document.createTextNode(selectedText)
          range.deleteContents()
          range.insertNode(textNode)
          
          // 選択を解除してカーソルをテキストノードの後に移動
          selection.removeAllRanges()
          const newRange = document.createRange()
          newRange.setStartAfter(textNode)
          newRange.setEndAfter(textNode)
          selection.addRange(newRange)
          
          // エディタの内容を更新
          setRichTextContentState(editor.innerHTML)
          
          // 色モードを解除
          setActiveColorMode(null)
          setTextColor('#000000')
          setMarkerColor(null)
        } else {
          // 選択されていない場合は何もしない
          return
        }
      }
    }
  }


  // テキストをレンダリング用に変換
  const renderText = (text: string) => {
    // カラーマーカーをHTMLに変換
    let rendered = text.replace(/\[COLOR:([^\]]+)\]([^[]+)\[\/COLOR\]/g, '<span style="color: $1">$2</span>')
    // マーカーマーカーをHTMLに変換
    rendered = rendered.replace(/\[MARKER:([^\]]+)\]([^[]+)\[\/MARKER\]/g, '<span style="background-color: $1">$2</span>')
    return rendered
  }

  // 手書きモーダル保存処理（DB経由）
  const handleHandwritingSave = async (content: string, type: 'handwriting' | 'text' | 'mixed', _staffName?: string) => {
    try {
      const metadata = type === 'handwriting' ? { brushSize, color: selectedColor } : { color: textColor, markerColor: markerColor }

      if (editingHandwritingEntry) {
        // 編集モード - DB更新
        await updateSubKarteEntry(editingHandwritingEntry, {
          content,
          entry_type: type as any,
          metadata,
        })
        setEntries(prev =>
          prev.map(entry =>
            entry.id === editingHandwritingEntry
              ? { ...entry, content, type, metadata }
              : entry
          )
        )
        setEditingHandwritingEntry(null)
      } else {
        // 新規作成モード - DB作成
        const created = await createSubKarteEntry({
          patient_id: patientId,
          staff_id: getCurrentStaffId(),
          entry_type: type as any,
          content,
          metadata,
        })

        const newEntry: SubKarteEntry = {
          id: created.id,
          type: (created.entry_type as SubKarteEntry['type']) || type,
          content: created.content || content,
          metadata: created.metadata || metadata,
          createdAt: created.created_at || new Date().toISOString(),
          staffName: authStaff?.name || '現在のスタッフ',
        }
        setEntries(prev => [...prev, newEntry])
      }
    } catch (error) {
      console.error('手書き保存エラー:', error)
      alert('手書きの保存に失敗しました')
    }

    setShowHandwritingModal(false)
  }

  // エントリ保存（DB経由）
  const saveEntry = async () => {
    try {
      let content = ''
      let metadata = {}

      switch (activeInputType) {
        case 'text':
          content = richTextContent.replace(/\n/g, '<br>')
          if (!content || content.trim() === '' || content === '<br>') {
            alert('テキストを入力してください')
            return
          }
          metadata = { color: textColor, markerColor: markerColor }
          break
        case 'handwriting':
          const canvas = canvasRef.current
          if (canvas) {
            content = canvas.toDataURL()
            metadata = { brushSize, color: selectedColor }
          }
          break
        case 'file':
          content = uploadedFiles.map(f => f.name).join(', ')
          metadata = { files: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) }
          break
        case 'audio':
          content = `録音時間: ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}`
          metadata = { duration: recordingTime }
          break
      }

      // DB にエントリを作成
      const created = await createSubKarteEntry({
        patient_id: patientId,
        staff_id: getCurrentStaffId(),
        entry_type: activeInputType,
        content,
        metadata,
      })

      // DB形式 → コンポーネント形式にマッピングしてステートに追加
      const newEntry: SubKarteEntry = {
        id: created.id,
        type: (created.entry_type as SubKarteEntry['type']) || activeInputType,
        content: created.content || content,
        metadata: created.metadata || metadata,
        createdAt: created.created_at || new Date().toISOString(),
        staffName: authStaff?.name || '現在のスタッフ',
      }

      setEntries(prev => [newEntry, ...prev])

      // フォームリセット
      setTextContent('')
      setRichTextContentState('')
      setUploadedFiles([])

      // リッチテキストエディタをクリア
      const editor = document.getElementById('rich-text-editor') as HTMLDivElement
      if (editor) {
        editor.innerHTML = 'テキストを入力してください...'
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  // 録音時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // タイムラインのコンテンツを共通化
  const renderTimeline = () => (
          <div className="space-y-6">
            {groupEntriesByDate(entries).map(([date, dateEntries]) => (
              <div key={date} className="space-y-4">
                {/* 日付ヘッダー */}
                <div className="text-center">
                  <div className="inline-block bg-gray-100 text-gray-700 px-3 py-0 rounded-full text-sm font-medium">
                    {date}
                  </div>
                </div>
                
                {/* その日のエントリ */}
                <div className="space-y-3">
                  {dateEntries.map((entry) => (
                    <Card key={entry.id} className="relative">
                      <CardContent className="p-4">
                        {/* 右上のアクションボタン */}
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          {entry.type === 'file' && (
                            <button
                              onClick={() => {/* ダウンロード処理 */}}
                              className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                              title="ダウンロード"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              console.log('編集アイコンをクリック:', entry.id, entry.type, entry.content);
                              if (entry.type === 'handwriting' || entry.type === 'mixed') {
                                // 手書きまたは混合コンテンツの場合は手書きモーダルを開く
                                setEditingHandwritingEntry(entry.id)
                                setShowHandwritingModal(true)
                              } else {
                                // テキストエントリの場合はテキスト編集モーダルを開く
                                startEditEntry(entry)
                              }
                            }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                            title={entry.type === 'handwriting' || entry.type === 'mixed' ? '手書き編集' : 'テキスト編集'}
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1 hover:bg-gray-100 rounded text-red-500 hover:text-red-700"
                            title="削除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <div className="pr-16">
                          {editingEntry === entry.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full text-sm"
                                rows={3}
                              />
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEditEntry(entry.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  保存
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditEntry}
                                >
                                  キャンセル
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div 
                                className="text-sm whitespace-pre-wrap"
                                style={{
                                  color: entry.metadata?.color || '#000000',
                                  backgroundColor: entry.metadata?.markerColor || 'transparent'
                                }}
                                dangerouslySetInnerHTML={{ 
                                  __html: entry.type === 'handwriting' 
                                    ? `<img src="${entry.content}" alt="手書きデータ" className="w-full h-auto" style="object-fit: cover; object-position: left top; max-height: 60px; width: 100%;" />`
                                    : entry.type === 'mixed'
                                    ? (() => {
                                        try {
                                          const mixedData = JSON.parse(entry.content);
                                          return `
                                            <div class="space-y-2">
                                              ${mixedData.text ? `<div class="text-sm">${mixedData.text}</div>` : ''}
                                              ${mixedData.handwriting ? `<img src="${mixedData.handwriting}" alt="手書きデータ" className="w-full h-auto" style="object-fit: cover; object-position: left top; max-height: 60px; width: 100%;" />` : ''}
                                            </div>
                                          `;
                                        } catch {
                                          return entry.content;
                                        }
                                      })()
                                    : entry.content
                                }}
                              />
                            </>
                          )}
                        </div>
                        
                        {/* 右下の時間・スタッフ名 */}
                        {editingEntry !== entry.id && (
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                            {new Date(entry.createdAt).toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} {entry.staffName}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
  )

  // 記入エリアのコンテンツを共通化
  const renderInputArea = (isCompact: boolean = false) => (
      <div className="border-t border-gray-200 pt-3 pb-3 bg-gray-50">
        <div className="flex items-start space-x-4">
          {/* 左側：入力エリア */}
          <div className="flex-1 flex flex-col space-y-2">
            {/* 入力タイプ選択 */}
            <div className="flex space-x-1">
            {/* 文字色ボタン */}
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#000000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#000000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#000000')
              }}
              title="黒文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#ff0000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#ff0000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#ff0000')
              }}
              title="赤文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#0000ff' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#0000ff' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#0000ff')
              }}
              title="青文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#008000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#008000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#008000')
              }}
              title="緑文字"
            />
            
            {/* マーカーボタン */}
            <button
              className={`p-1 rounded ${
                activeColorMode === 'marker' ? 'bg-gray-100 text-gray-700 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                setActiveInputType('text')
                applyMarkerColor('#ffff00')
              }}
              title="黄色マーカー"
            >
              <Highlighter className="w-3 h-3" style={{ color: '#000000' }} />
            </button>
            <button
              className="p-1 rounded text-gray-500 hover:bg-gray-100"
              onClick={() => setShowDefaultTextModal(true)}
              title="デフォルトテキスト"
            >
              <FileText className="w-3 h-3" />
            </button>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <button
              className={`p-1 rounded ${
                activeInputType === 'file' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                const fileInput = document.getElementById('file-upload') as HTMLInputElement
                fileInput.click()
              }}
              title="ファイル"
            >
              <Upload className="w-3 h-3" />
            </button>
          </div>

            {/* テキスト入力 */}
            {activeInputType === 'text' && (
              <div
                id="main-rich-text-editor"
                contentEditable
                className="w-full resize-none h-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm overflow-y-auto bg-white"
                style={{ 
                  color: '#000000',
                  backgroundColor: 'transparent',
                  whiteSpace: 'pre-wrap'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLDivElement
                  setRichTextContentState(target.innerHTML)
                }}
                onKeyDown={(e) => {
                  // エンターキーは自然な改行動作を許可
                  if (e.key === 'Enter') {
                    // デフォルトの動作を使用（<div>要素として改行）
                  }
                  // DeleteキーとBackspaceキーもデフォルトの動作を使用
                }}
                onKeyUp={(e) => {
                  // キーアップ時に内容を更新（カーソル位置を保持）
                  const target = e.target as HTMLDivElement
                  setRichTextContentState(target.innerHTML)
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLDivElement
                  if (target.innerHTML === 'テキストを入力してください...' || target.innerHTML === '<div>テキストを入力してください...</div>') {
                    target.innerHTML = ''
                  }
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLDivElement
                  if (target.innerHTML === '' || target.innerHTML === '<div><br></div>') {
                    target.innerHTML = 'テキストを入力してください...'
                  }
                }}
                suppressContentEditableWarning={true}
              />
            )}
          </div>

          {/* 右側：ボタンエリア（2x2グリッド） */}
          <div className="grid grid-cols-2 gap-0.5">
            {/* 上段左：手書き */}
            <Button
              onClick={() => setShowHandwritingModal(true)}
              variant="outline"
              size="icon"
              className="h-7 w-7"
              title="手書き"
            >
              <Pen className="w-4 h-4" />
            </Button>
            {/* 上段右：スタッフ */}
            <Button
              onClick={() => setShowStaffModal(true)}
              variant="outline"
              size="icon"
              className={`h-7 w-7 ${selectedStaff.length > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
              title={selectedStaff.length > 0 ? `選択中: ${getSelectedStaffNames()}` : 'スタッフ選択'}
            >
              <User className="w-4 h-4" />
            </Button>
            {/* 下段左：録音 */}
            <Button
              onClick={() => setShowAudioRecordingModal(true)}
              variant="outline"
              size="icon"
              className="h-7 w-7"
              title="録音"
            >
              <Mic className="w-4 h-4" />
            </Button>
            {/* 下段右：送信 */}
            <Button
              onClick={saveEntry}
              size="icon"
              className="h-7 w-7"
              disabled={
                selectedStaff.length === 0 ||
                (activeInputType === 'text' && (!richTextContent || richTextContent.trim() === '' || richTextContent === 'テキストを入力してください...' || richTextContent === '<div>テキストを入力してください...</div>')) ||
                (activeInputType === 'file' && uploadedFiles.length === 0) ||
                (activeInputType === 'audio' && recordingTime === 0)
              }
              title="送信"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
  )

  // レイアウトに応じた表示
  if (layout === 'horizontal') {
    // 横配置（下に記入エリア）- 予約編集モーダル用
    return (
      <div className="h-full flex flex-col">
        {/* 上側：アクティビティ（タイムライン） - 拡大表示 */}
        <div className="flex-1 overflow-y-auto mb-4">
          {renderTimeline()}
        </div>
        
        {/* 下側：記入エリア - コンパクト */}
        {renderInputArea(true)}
        
        {/* 手書き入力（非表示） */}
          {false && activeInputType === 'handwriting' && (
            <div className="hidden flex-1 flex flex-col">
              {/* 手書きツール */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="flex space-x-1">
                  {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00'].map((color) => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full border-2 ${
                        selectedColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant={isErasing ? 'default' : 'outline'}
                    onClick={() => setIsErasing(!isErasing)}
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-16"
                  />
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={400}
                  className="border border-gray-300 rounded cursor-crosshair"
                  onMouseDown={handleCanvasMouseDown}
                />
              </div>
            </div>
          )}

          {/* 音声入力（非表示） */}
          {false && activeInputType === 'audio' && (
            <div className="hidden flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="text-2xl font-bold mb-4">
                  音声録音・文字起こし・要約
                </div>
                <Button
                  onClick={() => setShowAudioRecordingModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  録音開始
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  音声を録音して自動で文字起こし・要約を行います
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  • 自動文字起こし対応<br/>
                  • 3つの要約テンプレート<br/>
                  • サブカルテへの直接貼り付け
                </div>
              </div>
            </div>
          )}

          {/* ファイルアップロード（非表示） */}
          {false && activeInputType === 'file' && (
            <div className="hidden flex-1 flex flex-col min-h-[300px]">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  ファイルをドラッグ&ドロップまたは
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  ファイルを選択
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  画像ファイル（最大5MB）
                </p>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate">{file.name}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

      {/* 古いRecordingContractModalは削除 */}

      {/* 音声録音モーダル */}
      <AudioRecordingModal
        isOpen={showAudioRecordingModal}
        onClose={() => {
          setShowAudioRecordingModal(false)
          loadEntries()
        }}
        patientId={patientId}
        clinicId={clinicId}
        staffId={getCurrentStaffId()}
      />

      {/* 手書きモーダル */}
      <HandwritingModal
        isOpen={showHandwritingModal}
        onClose={() => {
          setShowHandwritingModal(false)
          setEditingHandwritingEntry(null)
        }}
        onSave={handleHandwritingSave}
        initialContent={editingHandwritingEntry ? entries.find(e => e.id === editingHandwritingEntry)?.content : ''}
        initialType={editingHandwritingEntry ? (entries.find(e => e.id === editingHandwritingEntry)?.type === 'mixed' ? 'mixed' : 'handwriting') : 'handwriting'}
        editingEntryId={editingHandwritingEntry}
      />

      {/* デフォルトテキスト選択モーダル */}
      {showDefaultTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">デフォルトテキスト選択</h3>
              <button
                onClick={() => setShowDefaultTextModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {defaultTexts.length > 0 ? (
                defaultTexts.map((text) => (
                  <button
                    key={text.id}
                    onClick={() => {
                      setRichTextContentState(prev => prev + text.content)
                      setShowDefaultTextModal(false)
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{text.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{text.content.substring(0, 50)}...</div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">デフォルトテキストがありません</p>
                  <p className="text-xs mt-1">設定ページでデフォルトテキストを作成してください</p>
                  <p className="text-xs mt-1 text-gray-400">デバッグ: defaultTexts.length = {defaultTexts.length}</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDefaultTextModal(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* スタッフ選択モーダル */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">スタッフ選択</h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              {getStaffByPosition().map(({ positionName, staff }) => (
                <div key={positionName} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                    {positionName}
                  </h4>
                  <div className="space-y-1 ml-2">
                    {staff.map(staffMember => (
                      <label key={staffMember.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staffMember.id)}
                          onChange={() => handleStaffSelect(staffMember.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{staffMember.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStaff([])
                  setShowStaffModal(false)
                }}
              >
                クリア
              </Button>
              <Button
                onClick={() => setShowStaffModal(false)}
              >
                確定
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-2/3 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">エントリ編集</h3>
              <button
                onClick={cancelEditEntry}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 色選択ボタン */}
            <div className="flex space-x-1 mb-4">
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#000000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#000000' }}
                onClick={() => {
                  applyEditTextColor('#000000')
                }}
                title="黒文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#ff0000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#ff0000' }}
                onClick={() => {
                  applyEditTextColor('#ff0000')
                }}
                title="赤文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#0000ff' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#0000ff' }}
                onClick={() => {
                  applyEditTextColor('#0000ff')
                }}
                title="青文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#008000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#008000' }}
                onClick={() => {
                  applyEditTextColor('#008000')
                }}
                title="緑文字"
              />
              
              {/* マーカーボタン */}
              <button
                className={`p-1 rounded ${
                  editActiveColorMode === 'marker' ? 'bg-gray-100 text-gray-700 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => {
                  applyEditMarkerColor('#ffff00')
                }}
                title="黄色マーカー"
              >
                <Highlighter className="w-3 h-3" style={{ color: '#000000' }} />
              </button>
            </div>

            {/* リッチテキストエディタ */}
            <div
              id="edit-rich-text-editor"
              contentEditable
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              style={{ 
                color: '#000000',
                backgroundColor: 'transparent',
                whiteSpace: 'pre-wrap'
              }}
              onInput={(e) => {
                const target = e.target as HTMLDivElement
                setEditRichTextContent(target.innerHTML)
              }}
              onKeyUp={(e) => {
                // キーアップ時に内容を更新（カーソル位置を保持）
                const target = e.target as HTMLDivElement
                setEditRichTextContent(target.innerHTML)
              }}
              onKeyDown={(e) => {
                // エンターキーは自然な改行動作を許可
                if (e.key === 'Enter') {
                  // デフォルトの動作を使用（<div>要素として改行）
                }
                // DeleteキーとBackspaceキーもデフォルトの動作を使用
              }}
              onFocus={(e) => {
                const target = e.target as HTMLDivElement
                if (target.innerHTML === 'テキストを入力してください...' || target.innerHTML === '<div>テキストを入力してください...</div>') {
                  target.innerHTML = ''
                }
              }}
              onBlur={(e) => {
                const target = e.target as HTMLDivElement
                if (target.innerHTML === '' || target.innerHTML === '<div><br></div>') {
                  target.innerHTML = 'テキストを入力してください...'
                }
              }}
              suppressContentEditableWarning={true}
            />

            {/* ボタン */}
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={cancelEditEntry}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => saveEditEntry(editingEntry!)}
                disabled={!editRichTextContent || editRichTextContent.trim() === '' || editRichTextContent === 'テキストを入力してください...' || editRichTextContent === '<div>テキストを入力してください...</div>'}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  }

  // 縦配置（右側に記入エリア）- 患者詳細ページ用（デフォルト）
  return (
    <div className="h-[calc(100vh-250px)] flex">
      {/* 左側：アクティビティ（タイムライン） - 3/4 */}
      <div className="flex-1 pr-4 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {renderTimeline()}
        </div>
      </div>

      {/* 右側：記入エリア + TODO - 1/4 */}
      <div className="w-1/4 border-l border-gray-200 pl-4 flex flex-col space-y-4">
        {/* 治療計画TODO */}
        <div className="flex-shrink-0">
          <TreatmentPlanTodos patientId={patientId} />
        </div>

        {/* 治療計画メモ + TODO */}
        <div className="flex-shrink-0">
          <div className="relative border border-gray-200 rounded-md p-2 min-h-[120px] max-h-[180px] overflow-y-auto bg-white">
            {treatmentMemoSaving && (
              <span className="absolute top-1 right-2 text-xs text-gray-400 z-10">保存中...</span>
            )}

            {/* TODOリスト */}
            {(() => {
              const pendingTodos = treatmentMemoData.todos.filter(todo => !todo.completed)
              const completedTodos = treatmentMemoData.todos.filter(todo => todo.completed)

              return (
                <>
                  {/* 未完了TODO */}
                  {pendingTodos.length > 0 && (
                    <div className="mb-1 space-y-0.5">
                      {pendingTodos.map(todo => (
                        <div key={todo.id} className="flex items-center gap-1 group">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggleTodo(todo.id)}
                            className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`flex-1 text-xs ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {todo.text}
                          </span>
                          <button
                            onClick={() => handleDeleteTodo(todo.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 完了済みTODO（折りたたみ） */}
                  {completedTodos.length > 0 && (
                    <div className="mb-1">
                      <button
                        onClick={() => setShowCompletedTodos(!showCompletedTodos)}
                        className="flex items-center gap-1 w-full px-1 py-0.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        {showCompletedTodos ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>完了済み ({completedTodos.length}件)</span>
                      </button>
                      {showCompletedTodos && (
                        <div className="mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-2 ml-2">
                          {completedTodos.map(todo => (
                            <div key={todo.id} className="flex items-center gap-1 group">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo.id)}
                                className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="flex-1 text-xs line-through text-gray-400">
                                {todo.text}
                              </span>
                              <button
                                onClick={() => handleDeleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )
            })()}

            {/* TODO追加入力 */}
            <div className="flex items-center gap-1 mb-1">
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
                placeholder="TODO追加（Enter）"
                className="flex-1 px-1 py-0.5 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {/* テンプレートボタン */}
              <div ref={templateDropdownRef} className="relative">
                <button
                  onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                  className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="テンプレートからTODOを追加"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>
                {showTemplateDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {memoTodoTemplates.length > 0 ? (
                        memoTodoTemplates.map(template => {
                          const items = parseTemplateItems(template.items)
                          return (
                            <div key={template.id}>
                              <button
                                onClick={() => handleApplyTemplate(template)}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setHoveredTemplateId(template.id)
                                  setTooltipPosition({
                                    x: rect.left - 10,
                                    y: rect.top
                                  })
                                }}
                                onMouseLeave={() => {
                                  setHoveredTemplateId(null)
                                  setTooltipPosition(null)
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                              >
                                {template.name}
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-500">
                          テンプレート未登録
                          <div className="mt-1 text-[10px] text-gray-400">設定 → マスタ → メモTODO</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 固定位置ツールチップ */}
            {hoveredTemplateId && tooltipPosition && (
              <div
                className="fixed z-[1000] min-w-[120px] bg-white text-gray-700 text-xs rounded-md shadow-lg border border-gray-200 p-2 pointer-events-none"
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y}px`,
                  transform: 'translateX(-100%)'
                }}
              >
                {memoTodoTemplates
                  .filter(t => t.id === hoveredTemplateId)
                  .map(template => {
                    const items = parseTemplateItems(template.items)
                    return items.map((item, idx) => (
                      <div key={idx} className="flex items-center py-0.5">
                        <span className="w-3 h-3 mr-1.5 flex-shrink-0 rounded border border-gray-300"></span>
                        {item}
                      </div>
                    ))
                  })}
              </div>
            )}

            {/* 自由記述エリア */}
            <Textarea
              value={treatmentMemoData.freeText}
              onChange={(e) => handleFreeTextChange(e.target.value)}
              placeholder="患者の治療方針や注意事項を入力..."
              className="text-xs min-h-[50px] max-h-[100px] resize-none border-0 p-0 focus:ring-0"
            />
          </div>
        </div>

        {/* 記入エリア + ツールバー */}
        <div className="flex-1 flex gap-2">
          {/* テキスト入力 */}
          {activeInputType === 'text' && (
            <div className="flex-1 flex flex-col">
              <div
                id="main-rich-text-editor"
                contentEditable
                className="flex-1 resize-none min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ 
                  color: '#000000',
                  backgroundColor: 'transparent',
                  whiteSpace: 'pre-wrap'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLDivElement
                  setRichTextContentState(target.innerHTML)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // デフォルトの動作を使用
                  }
                }}
                onKeyUp={(e) => {
                  const target = e.target as HTMLDivElement
                  setRichTextContentState(target.innerHTML)
                }}
                onFocus={(e) => {
                  const target = e.target as HTMLDivElement
                  if (target.innerHTML === 'テキストを入力してください...' || target.innerHTML === '<div>テキストを入力してください...</div>') {
                    target.innerHTML = ''
                  }
                }}
                onBlur={(e) => {
                  const target = e.target as HTMLDivElement
                  if (target.innerHTML === '' || target.innerHTML === '<div><br></div>') {
                    target.innerHTML = 'テキストを入力してください...'
                  }
                }}
                suppressContentEditableWarning={true}
              />
            </div>
          )}

          {/* ツールバー（テキスト入力の右側に縦配置） */}
          <div className="flex flex-col gap-1 pt-1">
            {/* 文字色ボタン */}
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#000000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#000000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#000000')
              }}
              title="黒文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#ff0000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#ff0000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#ff0000')
              }}
              title="赤文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#0000ff' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#0000ff' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#0000ff')
              }}
              title="青文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                activeColorMode === 'text' && textColor === '#008000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#008000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#008000')
              }}
              title="緑文字"
            />

            {/* マーカーボタン */}
            <button
              className={`p-1 rounded ${
                activeColorMode === 'marker' ? 'bg-gray-100 text-gray-700 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                setActiveInputType('text')
                applyMarkerColor('#ffff00')
              }}
              title="黄色マーカー"
            >
              <Highlighter className="w-3 h-3" style={{ color: '#000000' }} />
            </button>
            <button
              className="p-1 rounded text-gray-500 hover:bg-gray-100"
              onClick={() => setShowDefaultTextModal(true)}
              title="デフォルトテキスト"
            >
              <FileText className="w-3 h-3" />
            </button>
            <input
              type="file"
              id="file-upload-vertical"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
            />
            <button
              className={`p-1 rounded ${
                activeInputType === 'file' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                const fileInput = document.getElementById('file-upload-vertical') as HTMLInputElement
                fileInput.click()
              }}
              title="ファイル"
            >
              <Upload className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 録音・スタッフ・送信ボタン */}
        <div className="flex-shrink-0">
          <div className="mt-2 flex space-x-2">
            <Button
              onClick={() => setShowAudioRecordingModal(true)}
              variant="outline"
              className="flex-2"
            >
              <FileSignature className="w-5 h-5 mr-2" />
              録音
            </Button>
            <Button
              onClick={() => setShowHandwritingModal(true)}
              variant="outline"
              className="flex-none px-2"
              title="手書き"
            >
              <Pen className="w-3 h-3" />
            </Button>
            <Button
              onClick={() => setShowStaffModal(true)}
              variant="outline"
              className={`flex-none px-3 ${selectedStaff.length > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
              title={selectedStaff.length > 0 ? `選択中: ${getSelectedStaffNames()}` : 'スタッフ選択'}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveEntry}
              className="flex-1"
              disabled={
                selectedStaff.length === 0 ||
                (activeInputType === 'text' && (!richTextContent || richTextContent.trim() === '' || richTextContent === 'テキストを入力してください...' || richTextContent === '<div>テキストを入力してください...</div>')) ||
                (activeInputType === 'file' && uploadedFiles.length === 0) ||
                (activeInputType === 'audio' && recordingTime === 0)
              }
            >
              <Save className="w-4 h-4 mr-2" />
              送信
            </Button>
          </div>
        </div>
      </div>

      {/* モーダル群（AudioRecordingModalは1693行目で既にレンダリング済み） */}

      <HandwritingModal
        isOpen={showHandwritingModal}
        onClose={() => {
          setShowHandwritingModal(false)
          setEditingHandwritingEntry(null)
        }}
        onSave={handleHandwritingSave}
        initialContent={editingHandwritingEntry ? entries.find(e => e.id === editingHandwritingEntry)?.content : ''}
        initialType={editingHandwritingEntry ? (entries.find(e => e.id === editingHandwritingEntry)?.type === 'mixed' ? 'mixed' : 'handwriting') : 'handwriting'}
        editingEntryId={editingHandwritingEntry}
      />

      {showDefaultTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">デフォルトテキスト選択</h3>
              <button
                onClick={() => setShowDefaultTextModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {defaultTexts.length > 0 ? (
                defaultTexts.map((text) => (
                  <button
                    key={text.id}
                    onClick={() => {
                      setRichTextContentState(prev => prev + text.content)
                      setShowDefaultTextModal(false)
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{text.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{text.content.substring(0, 50)}...</div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">デフォルトテキストがありません</p>
                  <p className="text-xs mt-1">設定ページでデフォルトテキストを作成してください</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDefaultTextModal(false)}
              >
                キャンセル
              </Button>
            </div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">スタッフ選択</h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              {getStaffByPosition().map(({ positionName, staff }) => (
                <div key={positionName} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-1">
                    {positionName}
                  </h4>
                  <div className="space-y-1 ml-2">
                    {staff.map(staffMember => (
                      <label key={staffMember.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(staffMember.id)}
                          onChange={() => handleStaffSelect(staffMember.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{staffMember.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedStaff([])
                  setShowStaffModal(false)
                }}
              >
                クリア
              </Button>
              <Button
                onClick={() => setShowStaffModal(false)}
              >
                確定
              </Button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-2/3 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">エントリ編集</h3>
              <button
                onClick={cancelEditEntry}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex space-x-1 mb-4">
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#000000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#000000' }}
                onClick={() => applyEditTextColor('#000000')}
                title="黒文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#ff0000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#ff0000' }}
                onClick={() => applyEditTextColor('#ff0000')}
                title="赤文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#0000ff' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#0000ff' }}
                onClick={() => applyEditTextColor('#0000ff')}
                title="青文字"
              />
              <button
                className={`w-5 h-5 rounded-full border-2 ${
                  editActiveColorMode === 'text' && editTextColor === '#008000' ? 'border-gray-400 ring-2 ring-blue-500' : 'border-gray-200'
                }`}
                style={{ backgroundColor: '#008000' }}
                onClick={() => applyEditTextColor('#008000')}
                title="緑文字"
              />
              
              <button
                className={`p-1 rounded ${
                  editActiveColorMode === 'marker' ? 'bg-gray-100 text-gray-700 ring-2 ring-blue-500' : 'text-gray-500 hover:bg-gray-100'
                }`}
                onClick={() => applyEditMarkerColor('#ffff00')}
                title="黄色マーカー"
              >
                <Highlighter className="w-3 h-3" style={{ color: '#000000' }} />
              </button>
            </div>

            <div
              id="edit-rich-text-editor"
              contentEditable
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              style={{ 
                color: '#000000',
                backgroundColor: 'transparent',
                whiteSpace: 'pre-wrap'
              }}
              onInput={(e) => {
                const target = e.target as HTMLDivElement
                setEditRichTextContent(target.innerHTML)
              }}
              onKeyUp={(e) => {
                const target = e.target as HTMLDivElement
                setEditRichTextContent(target.innerHTML)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // デフォルトの動作を使用
                }
              }}
              onFocus={(e) => {
                const target = e.target as HTMLDivElement
                if (target.innerHTML === 'テキストを入力してください...' || target.innerHTML === '<div>テキストを入力してください...</div>') {
                  target.innerHTML = ''
                }
              }}
              onBlur={(e) => {
                const target = e.target as HTMLDivElement
                if (target.innerHTML === '' || target.innerHTML === '<div><br></div>') {
                  target.innerHTML = 'テキストを入力してください...'
                }
              }}
              suppressContentEditableWarning={true}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={cancelEditEntry}
              >
                キャンセル
              </Button>
              <Button
                onClick={() => saveEditEntry(editingEntry!)}
                disabled={!editRichTextContent || editRichTextContent.trim() === '' || editRichTextContent === 'テキストを入力してください...' || editRichTextContent === '<div>テキストを入力してください...</div>'}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 重要な注意事項モーダル */}
      {showAlertModal && alertNotes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <h2 className="text-xl font-bold text-gray-900">重要な注意事項</h2>
            </div>

            <div className="space-y-3 mb-6">
              {alertNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-2 p-3 bg-orange-50 border-2 border-orange-300 rounded-md"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm font-medium text-gray-900">
                    {note.text}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={handleConfirmAlert}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              確認しました
            </Button>
          </div>
        </div>
      )}

      {/* 警告アイコン（確認後に右上に表示） */}
      {showAlertIcon && alertNotes.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowAlertModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 text-white rounded-lg shadow-lg hover:bg-orange-600 transition-colors"
            title="重要な注意事項を確認"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">注意事項</span>
            <span className="text-xs bg-white text-orange-500 rounded-full px-2 py-0.5 font-bold">
              {alertNotes.length}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
