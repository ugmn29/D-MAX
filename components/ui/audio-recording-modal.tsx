'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Textarea } from './textarea'
import { Select } from './select'
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Save,
  X,
  FileText,
  Clock,
  Volume2,
  Download,
  Upload,
  Trash2,
  Edit3,
  Check,
  X as XIcon
} from 'lucide-react'

interface AudioRecordingModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  clinicId?: string
  staffId?: string
}

interface AudioSegment {
  id: string
  startTime: number
  endTime: number
  transcription: string
  isSelected: boolean
}

interface SummaryTemplate {
  id: string
  name: string
  prompt: string
}

export function AudioRecordingModal({ isOpen, onClose, patientId, clinicId, staffId }: AudioRecordingModalProps) {
  // 録音関連の状態
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([])
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayTime, setCurrentPlayTime] = useState(0)
  
  // 文字起こし関連の状態
  const [transcription, setTranscription] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [autoTranscription, setAutoTranscription] = useState(true)
  const [segmentCount, setSegmentCount] = useState(0)
  const [appendCount, setAppendCount] = useState(0)
  
  // 要約関連の状態
  const [selectedTemplate, setSelectedTemplate] = useState<string>('soap')
  const [summary, setSummary] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  
  // ハイライト関連の状態
  const [highlightColor, setHighlightColor] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 要約テンプレート
  const summaryTemplates: SummaryTemplate[] = [
    {
      id: 'soap',
      name: 'SOAP形式',
      prompt: '以下の会話をSOAP形式で要約してください：\n主訴（S）: 患者の主な訴え\n客観的所見（O）: 医師が観察した事実\n評価（A）: 医師の判断・診断\n計画（P）: 今後の治療計画'
    },
    {
      id: 'simple',
      name: '簡単要約',
      prompt: '以下の会話を簡潔に要約してください：\n- 主な症状\n- 診断\n- 処置\n- 注意事項'
    },
    {
      id: 'detailed',
      name: '詳細要約',
      prompt: '以下の会話を詳細に要約してください：\n- 主訴と症状の詳細\n- 診断とその根拠\n- 処置内容\n- 注意事項と禁忌\n- 次回予定\n- その他の重要な情報'
    }
  ]

  // 録音開始
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // セグメントを作成（30秒ごと）
        const segmentDuration = 30
        const totalSegments = Math.ceil(recordingTime / segmentDuration)
        const newSegments: AudioSegment[] = []
        
        for (let i = 0; i < totalSegments; i++) {
          newSegments.push({
            id: `segment_${Date.now()}_${i}`,
            startTime: i * segmentDuration,
            endTime: Math.min((i + 1) * segmentDuration, recordingTime),
            transcription: '',
            isSelected: false
          })
        }
        
        setAudioSegments(prev => [...prev, ...newSegments])
        setSegmentCount(prev => prev + totalSegments)
        
        // 自動文字起こしが有効な場合
        if (autoTranscription) {
          transcribeAudio(audioBlob)
        }
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

  // 文字起こし処理
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('文字起こしに失敗しました')
      }
      
      const result = await response.json()
      setTranscription(result.transcript)
      setAppendCount(prev => prev + 1)
    } catch (error) {
      console.error('文字起こしエラー:', error)
      alert('文字起こしに失敗しました。もう一度お試しください。')
    } finally {
      setIsTranscribing(false)
    }
  }

  // 手動文字起こし
  const handleManualTranscription = () => {
    if (audioSegments.length > 0) {
      transcribeAudio(new Blob())
    }
  }

  // 要約処理
  const generateSummary = async () => {
    if (!transcription.trim()) {
      alert('文字起こし結果がありません')
      return
    }

    setIsSummarizing(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: transcription,
          templateId: selectedTemplate,
          clinicId: clinicId,
          operatorId: staffId,
        })
      })
      
      if (!response.ok) {
        throw new Error('要約に失敗しました')
      }
      
      const result = await response.json()
      setSummary(result.summary)
    } catch (error) {
      console.error('要約エラー:', error)
      alert('要約に失敗しました。もう一度お試しください。')
    } finally {
      setIsSummarizing(false)
    }
  }

  // セグメント削除
  const deleteSegment = (segmentId: string) => {
    setAudioSegments(prev => prev.filter(seg => seg.id !== segmentId))
    setSegmentCount(prev => Math.max(0, prev - 1))
  }

  // 全クリア
  const clearAll = () => {
    setAudioSegments([])
    setTranscription('')
    setSummary('')
    setSegmentCount(0)
    setAppendCount(0)
  }

  // 最後を取り消し
  const undoLast = () => {
    if (audioSegments.length > 0) {
      const lastSegment = audioSegments[audioSegments.length - 1]
      deleteSegment(lastSegment.id)
    }
  }

  // 下書き保存
  const saveDraft = () => {
    // TODO: 下書きをデータベースに保存
    alert('下書きを保存しました')
  }

  // サブカルテに貼り付け
  const attachToSubKarte = async () => {
    try {
      const response = await fetch('/api/subkarte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId,
          type: 'text',
          content: summary,
          metadata: {
            source: 'audio_recording',
            template: selectedTemplate,
            transcription: transcription
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('サブカルテへの貼り付けに失敗しました')
      }
      
      alert('サブカルテに貼り付けました')
      onClose()
    } catch (error) {
      console.error('サブカルテ貼り付けエラー:', error)
      alert('サブカルテへの貼り付けに失敗しました')
    }
  }

  // アクティビティに送信
  const sendToActivity = () => {
    // TODO: アクティビティに送信
    alert('アクティビティに送信しました')
    onClose()
  }

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[1400px] max-w-[90vw]">
      <div className="flex h-[600px]">
        {/* 左パネル: 音声入力 */}
        <div className="flex-1 border-r border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4">音声入力</h3>
            
            {/* 録音コントロール */}
            <div className="flex items-center gap-4 mb-4">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-lg"
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  録音開始
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 text-lg"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  録音停止
                </Button>
              )}
              
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="font-mono text-lg text-gray-800">
                  {formatTime(recordingTime)}
                </span>
              </div>
            </div>

            {/* 文字起こし設定 */}
            <div className="mb-4 bg-gray-50 p-3 rounded">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={autoTranscription}
                  onChange={(e) => setAutoTranscription(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">自動文字起こし</span>
              </label>
              <div className="text-sm text-gray-600">
                セグメント:{segmentCount} 追記回数:{appendCount}
              </div>
            </div>

            {/* セグメント情報 */}
            {audioSegments.length > 0 && (
              <div className="mb-4">
                {audioSegments.map((segment) => (
                  <div key={segment.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded mb-2">
                    <span className="text-sm font-medium">
                      セグメント {formatTime(segment.endTime - segment.startTime)}
                    </span>
                    <button
                      onClick={() => deleteSegment(segment.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 文字起こしボタン */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleManualTranscription}
                disabled={isTranscribing || audioSegments.length === 0}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
              >
                {isTranscribing ? '文字起こし中...' : '文字起こし'}
              </Button>
              <Button
                onClick={undoLast}
                variant="outline"
                disabled={audioSegments.length === 0}
                className="px-4 py-2"
              >
                最後を取り消し
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                disabled={audioSegments.length === 0 && !transcription}
                className="px-4 py-2"
              >
                全クリア
              </Button>
            </div>

            {/* 文字起こし結果 */}
            <div className="mb-4">
              <Textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                placeholder="文字起こし結果がここに表示されます..."
                className="min-h-[200px] w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 右パネル: 要約 */}
        <div className="flex-1 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-4">要約(編集可)</h3>
            
            {/* 要約コントロール */}
            <div className="flex items-center gap-2 mb-4">
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                className="w-40 px-3 py-2 border border-gray-300 rounded"
              >
                <option value="soap">SOAP形式</option>
                <option value="simple">簡単要約</option>
                <option value="detailed">詳細要約</option>
              </Select>
              
              <Button
                onClick={generateSummary}
                disabled={isSummarizing || !transcription.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
              >
                {isSummarizing ? '要約中...' : '要約する'}
              </Button>
              
              <Button
                onClick={saveDraft}
                variant="outline"
                disabled={!summary.trim()}
                className="px-4 py-2"
              >
                下書き保存
              </Button>
            </div>

            {/* ハイライトコントロール */}
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                className="text-red-500 border-red-500 hover:bg-red-50 px-3 py-1"
                onClick={() => setHighlightColor('red')}
              >
                赤
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-blue-500 border-blue-500 hover:bg-blue-50 px-3 py-1"
                onClick={() => setHighlightColor('blue')}
              >
                青
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-yellow-500 border-yellow-500 hover:bg-yellow-50 px-3 py-1"
                onClick={() => setHighlightColor('yellow')}
              >
                黄ハイライト
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-gray-50 px-3 py-1"
                onClick={() => setHighlightColor(null)}
              >
                ハイライト解除
              </Button>
            </div>

            {/* 要約結果 */}
            <div className="mb-4">
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="要約結果がここに表示されます..."
                className="min-h-[200px] w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 下部アクションボタン */}
      <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={attachToSubKarte}
          disabled={!summary.trim()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2"
        >
          サブカルテに貼付
        </Button>
        <Button
          onClick={sendToActivity}
          disabled={!summary.trim()}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
        >
          アクティビティに送信
        </Button>
      </div>
    </Modal>
  )
}
