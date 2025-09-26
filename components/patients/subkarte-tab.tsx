'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RecordingContractModal } from '@/components/ui/recording-contract-modal'
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
}

export function SubKarteTab({ patientId }: SubKarteTabProps) {
  const [entries, setEntries] = useState<SubKarteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeInputType, setActiveInputType] = useState<'text' | 'handwriting' | 'audio' | 'file'>('text')
  const [textContent, setTextContent] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(2)
  const [isErasing, setIsErasing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [textColor, setTextColor] = useState('#000000')
  const [markerColor, setMarkerColor] = useState<string | null>(null)
  const [isTextSelected, setIsTextSelected] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [richTextContent, setRichTextContentState] = useState('')
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [staffList, setStaffList] = useState<Array<{id: string, name: string, position?: {id: string, name: string, sort_order: number}}>>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
          // フォールバック: モックデータを使用
          setEntries(getMockEntries())
        }
      } else {
        // 初回アクセス時はモックデータを使用
        setEntries(getMockEntries())
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

    // 日付順でソート
    return Object.entries(grouped).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
  }

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        // ここで音声データをサーバーに送信
        console.log('録音完了:', audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      // 録音時間のカウント
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('録音開始エラー:', error)
      alert('マイクへのアクセスが許可されていません')
    }
  }

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

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
    setUploadedFiles(prev => [...prev, ...validFiles])
  }

  // エントリ編集開始
  const startEditEntry = (entry: SubKarteEntry) => {
    setEditingEntry(entry.id)
    setEditContent(entry.content)
  }

  // エントリ編集保存
  const saveEditEntry = async (entryId: string) => {
    try {
      setEntries(prev => {
        const newEntries = prev.map(entry => 
          entry.id === entryId 
            ? { ...entry, content: editContent }
            : entry
        )
        // ローカルストレージに保存
        localStorage.setItem(`subkarte_entries_${patientId}`, JSON.stringify(newEntries))
        return newEntries
      })
      setEditingEntry(null)
      setEditContent('')
    } catch (error) {
      console.error('編集保存エラー:', error)
      alert('編集の保存に失敗しました')
    }
  }

  // エントリ編集キャンセル
  const cancelEditEntry = () => {
    setEditingEntry(null)
    setEditContent('')
  }

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

  // リッチテキストエディタの色変更
  const applyTextColor = (color: string) => {
    const editor = document.getElementById('rich-text-editor') as HTMLDivElement
    if (editor) {
      // 現在の選択範囲を取得
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
          
          // 選択を解除
          selection.removeAllRanges()
        } else {
          // 選択されていない場合はカーソル位置から入力する色を設定
          setTextColor(color)
        }
      }
    }
  }

  // マーカー色の適用
  const applyMarkerColor = (color: string) => {
    const editor = document.getElementById('rich-text-editor') as HTMLDivElement
    if (editor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const selectedText = range.toString()
        
        if (selectedText) {
          // 選択されたテキストをマーカー付きspanで囲む
          const span = document.createElement('span')
          span.style.backgroundColor = color
          span.textContent = selectedText
          
          range.deleteContents()
          range.insertNode(span)
          
          // 選択を解除
          selection.removeAllRanges()
        }
      }
    }
  }

  // リッチテキストの内容を取得
  const getRichTextContent = () => {
    const editor = document.getElementById('rich-text-editor') as HTMLDivElement
    if (editor) {
      // プレースホルダーテキストを除外
      const content = editor.innerHTML
      if (content === 'テキストを入力してください...' || content === '<div>テキストを入力してください...</div>') {
        return ''
      }
      return content
    }
    return ''
  }

  // リッチテキストの内容を設定
  const setRichTextContent = (content: string) => {
    const editor = document.getElementById('rich-text-editor') as HTMLDivElement
    if (editor) {
      editor.innerHTML = content
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

  // エントリ保存
  const saveEntry = async () => {
    try {
      let content = ''
      let metadata = {}

      switch (activeInputType) {
        case 'text':
          content = getRichTextContent()
          console.log('Rich text content:', content) // デバッグ用
          if (!content || content.trim() === '' || content === '<div><br></div>') {
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

  return (
    <div className="h-[calc(100vh-250px)] flex">
      {/* 左側：アクティビティ（タイムライン） - 3/4 */}
      <div className="flex-1 pr-4 flex flex-col">
        <div className="flex-1 overflow-y-auto">
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
                    <Card key={entry.id} className="border-l-4 border-l-blue-500 relative">
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
                            onClick={() => startEditEntry(entry)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                            title="編集"
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
                                dangerouslySetInnerHTML={{ 
                                  __html: entry.type === 'handwriting' 
                                    ? `<img src="${entry.content}" alt="手書きデータ" className="max-w-full h-auto" />`
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
                textColor === '#000000' && !markerColor ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#000000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#000000')
                setMarkerColor(null)
              }}
              title="黒文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                textColor === '#ff0000' && !markerColor ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#ff0000' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#ff0000')
                setMarkerColor(null)
              }}
              title="赤文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                textColor === '#0000ff' && !markerColor ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#0000ff' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#0000ff')
                setMarkerColor(null)
              }}
              title="青文字"
            />
            <button
              className={`w-5 h-5 rounded-full border-2 ${
                textColor === '#ffff00' && !markerColor ? 'border-gray-400' : 'border-gray-200'
              }`}
              style={{ backgroundColor: '#ffff00' }}
              onClick={() => {
                setActiveInputType('text')
                applyTextColor('#ffff00')
                setMarkerColor(null)
              }}
              title="黄色文字"
            />
            
            {/* マーカーボタン */}
            <button
              className={`p-1 rounded ${
                markerColor === '#ffff00' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => {
                setActiveInputType('text')
                applyMarkerColor('#ffff00')
                setTextColor('#000000')
              }}
              title="黄色マーカー"
            >
              <Highlighter className="w-3 h-3" style={{ color: '#000000' }} />
            </button>
            <button
              className={`p-1 rounded ${
                activeInputType === 'handwriting' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setActiveInputType('handwriting')}
              title="手書き"
            >
              <Pen className="w-3 h-3" />
            </button>
            <button
              className={`p-1 rounded ${
                activeInputType === 'audio' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setActiveInputType('audio')}
              title="音声"
            >
              <Mic className="w-3 h-3" />
            </button>
            <button
              className={`p-1 rounded ${
                activeInputType === 'file' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              onClick={() => setActiveInputType('file')}
              title="ファイル"
            >
              <Upload className="w-3 h-3" />
            </button>
          </div>

          {/* テキスト入力 */}
          {activeInputType === 'text' && (
            <div className="flex-1 flex flex-col">
              <div
                id="rich-text-editor"
                contentEditable
                className="flex-1 resize-none min-h-[200px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ 
                  color: textColor,
                  backgroundColor: markerColor || 'transparent'
                }}
                onInput={(e) => {
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
              >
                テキストを入力してください...
              </div>
            </div>
          )}

          {/* 手書き入力 */}
          {activeInputType === 'handwriting' && (
            <div className="flex-1 flex flex-col">
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

          {/* 音声入力 */}
          {activeInputType === 'audio' && (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="text-2xl font-bold mb-4">
                  {formatTime(recordingTime)}
                </div>
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    録音開始
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    録音停止
                  </Button>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  最大30分まで録音可能
                </p>
              </div>
            </div>
          )}

          {/* ファイルアップロード */}
          {activeInputType === 'file' && (
            <div className="flex-1 flex flex-col min-h-[300px]">
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

          {/* 録音・スタッフ・送信ボタン */}
          <div className="mt-2 flex space-x-2">
            <Button
              onClick={() => setShowRecordingModal(true)}
              variant="outline"
              className="flex-1"
            >
              <FileSignature className="w-4 h-4 mr-2" />
              録音
            </Button>
            <Button
              onClick={() => setShowStaffModal(true)}
              variant="outline"
              className={`flex-1 ${selectedStaff.length > 0 ? 'bg-blue-50 border-blue-300' : ''}`}
              title={selectedStaff.length > 0 ? `選択中: ${getSelectedStaffNames()}` : 'スタッフ選択'}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              onClick={saveEntry}
              className="flex-1"
              disabled={
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

      {/* 録音・契約モーダル */}
      <RecordingContractModal
        isOpen={showRecordingModal}
        onClose={() => setShowRecordingModal(false)}
        patientId={patientId}
      />

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
    </div>
  )
}
