'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
// 古いRecordingContractModalは削除
import { HandwritingModal } from '@/components/ui/handwriting-modal'
import { AudioRecordingModal } from '@/components/ui/audio-recording-modal'
import { getStaff } from '@/lib/api/staff'
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
  User
} from 'lucide-react'

interface SubKarteEntry {
  id: string
  type: 'text' | 'handwriting' | 'audio' | 'file' | 'template'
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 古い録音機能のrefは削除 - 新しいAudioRecordingModalを使用

  // ローカルストレージからデータを読み込み
  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true)

      // ローカルストレージから保存されたエントリを読み込み
      const savedEntries = localStorage.getItem(`subkarte_entries_${patientId}`)
      if (savedEntries) {
        try {
          const parsedEntries = JSON.parse(savedEntries)
          setEntries(parsedEntries)
        } catch (error) {
          console.error('保存されたエントリの読み込みに失敗:', error)
          setEntries([])
        }
      } else {
        // データがない場合は空配列
        setEntries([])
      }

      setLoading(false)
    }

    loadEntries()
  }, [patientId])

  // スタッフデータの読み込み
  useEffect(() => {
    const loadStaff = async () => {
      try {
        // 設定ページと同じクリニックIDを使用
        const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'
        const staffData = await getStaff(DEMO_CLINIC_ID)
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

  // デフォルトテキストの読み込み
  useEffect(() => {
    const savedTexts = localStorage.getItem('default_texts')
    console.log('ローカルストレージから取得したデフォルトテキスト:', savedTexts)
    if (savedTexts) {
      try {
        const parsedTexts = JSON.parse(savedTexts)
        setDefaultTexts(parsedTexts)
        console.log('読み込んだデフォルトテキスト:', parsedTexts)
      } catch (error) {
        console.error('デフォルトテキストの読み込みエラー:', error)
      }
    } else {
      console.log('デフォルトテキストが見つかりません')
    }
  }, [])

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

  // ファイルアップロード
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // ファイル選択後、すぐにエントリとして保存
      validFiles.forEach(file => {
        const entry: SubKarteEntry = {
          id: `entry_${Date.now()}_${Math.random()}`,
          type: 'file',
          content: file.name,
          staffName: selectedStaff.length > 0 ? getSelectedStaffNames() : '現在のスタッフ',
          createdAt: new Date().toISOString(),
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          }
        }
        setEntries(prev => [entry, ...prev])
        
        // ローカルストレージに保存
        const newEntries = [entry, ...entries]
        localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
      })
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

  // エントリ編集保存
  const saveEditEntry = async (entryId: string) => {
    try {
      // HTMLコンテンツをそのまま保存（色情報はHTMLに含まれている）
      const content = editRichTextContent
      setEntries(prev => {
        const newEntries = prev.map(entry => 
          entry.id === entryId 
            ? { 
                ...entry, 
                content: content,
                metadata: {
                  ...entry.metadata,
                  color: editTextColor,
                  markerColor: editMarkerColor
                }
              }
            : entry
        )
        // ローカルストレージに保存
        localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
        return newEntries
      })
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
      setEntries(prev => {
        const newEntries = prev.filter(entry => entry.id !== entryId)
        // ローカルストレージに保存
        localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
        return newEntries
      })
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

  // 手書きモーダル保存処理
  const handleHandwritingSave = (content: string, type: 'handwriting' | 'text' | 'mixed', staffName?: string) => {
    if (editingHandwritingEntry) {
      // 編集モード
      const updatedEntries = entries.map(entry => 
        entry.id === editingHandwritingEntry 
          ? { ...entry, content, type, staffName: staffName || entry.staffName, metadata: type === 'handwriting' ? { brushSize, color: selectedColor } : { color: textColor, markerColor: markerColor } }
          : entry
      )
      setEntries(updatedEntries)
      localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(updatedEntries))
      setEditingHandwritingEntry(null)
    } else {
      // 新規作成モード
      const newEntry: SubKarteEntry = {
        id: Date.now().toString(),
        type: type,
        content: content,
        metadata: type === 'handwriting' ? { brushSize, color: selectedColor } : { color: textColor, markerColor: markerColor },
        createdAt: new Date().toISOString(),
        staffName: staffName || (selectedStaff.length > 0 ? getSelectedStaffNames() : '現在のスタッフ')
      }
      
      console.log('手書きエントリ保存:', { newEntry, selectedStaff, getSelectedStaffNames: getSelectedStaffNames() })
      
      const newEntries = [...entries, newEntry]
      setEntries(newEntries)
      localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
    }
    
    setShowHandwritingModal(false)
  }

  // エントリ保存
  const saveEntry = async () => {
    try {
      let content = ''
      let metadata = {}

      switch (activeInputType) {
        case 'text':
          content = richTextContent.replace(/\n/g, '<br>')
          console.log('Rich text content:', content) // デバッグ用
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

      const newEntry: SubKarteEntry = {
        id: Date.now().toString(),
        type: activeInputType,
        content,
        metadata,
        createdAt: new Date().toISOString(),
        staffName: selectedStaff.length > 0 ? getSelectedStaffNames() : '現在のスタッフ' // 選択されたスタッフ名またはデフォルト
      }

      setEntries(prev => {
        const newEntries = [newEntry, ...prev]
        // ローカルストレージに保存
        localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
        return newEntries
      })
      
      // フォームリセット
      setTextContent('')
      setRichTextContentState('')
      setUploadedFiles([])
      setRecordingTime(0)
      
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

          {/* 右側：ボタンエリア */}
          <div className="flex flex-col space-y-2">
            {/* 録音・スタッフ・送信ボタン */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowAudioRecordingModal(true)}
                variant="outline"
                size="sm"
                title="録音"
              >
                <FileSignature className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowHandwritingModal(true)}
                variant="outline"
                size="sm"
                title="手書き"
              >
                <Pen className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setShowStaffModal(true)}
                variant="outline"
                size="sm"
                className={selectedStaff.length > 0 ? 'bg-blue-50 border-blue-300' : ''}
                title={selectedStaff.length > 0 ? `選択中: ${getSelectedStaffNames()}` : 'スタッフ選択'}
              >
                <User className="w-4 h-4" />
              </Button>
              <Button
                onClick={saveEntry}
                size="sm"
                disabled={
                  selectedStaff.length === 0 ||
                  (activeInputType === 'text' && (!richTextContent || richTextContent.trim() === '' || richTextContent === 'テキストを入力してください...' || richTextContent === '<div>テキストを入力してください...</div>')) ||
                  (activeInputType === 'file' && uploadedFiles.length === 0) ||
                  (activeInputType === 'audio' && recordingTime === 0)
                }
              >
                <Save className="w-4 h-4 mr-1" />
                送信
              </Button>
            </div>
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
        onClose={() => setShowAudioRecordingModal(false)}
        patientId={patientId}
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

      {/* 右側：記入エリア - 1/4 */}
      <div className="w-1/4 border-l border-gray-200 pl-4 flex flex-col">
        <div className="h-full flex flex-col">
          
          {/* 入力タイプ選択 */}
          <div className="flex space-x-1 mb-4">
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

          {/* 録音・スタッフ・送信ボタン */}
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

      {/* モーダル群 */}
      <AudioRecordingModal
        isOpen={showAudioRecordingModal}
        onClose={() => setShowAudioRecordingModal(false)}
        patientId={patientId}
      />

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
    </div>
  )
}
