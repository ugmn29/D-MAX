'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Textarea } from './textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select'
import { Mic, FileText, Trash2, Square } from 'lucide-react'

interface AudioRecordingModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  clinicId?: string
  staffId?: string
}

export function AudioRecordingModal({ isOpen, onClose, patientId, clinicId, staffId }: AudioRecordingModalProps) {
  const [transcription, setTranscription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('soap')
  const [summary, setSummary] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')

  const recognitionRef = useRef<any>(null)
  const wantRecordingRef = useRef(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const restartCountRef = useRef(0)

  // 録音を停止する内部関数
  const doStopRef = useRef(() => {
    wantRecordingRef.current = false
    restartCountRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
    setInterimText('')
  })

  // SpeechRecognitionセッションを開始
  const startRecognitionSession = useRef(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。')
        doStopRef.current()
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        doStopRef.current()
      }
    }

    recognition.onresult = (event: any) => {
      let interim = ''
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (finalTranscript) {
        setTranscription(prev => prev + (prev ? '\n' : '') + finalTranscript)
        setInterimText('')
        restartCountRef.current = 0
      } else if (interim) {
        setInterimText(interim)
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null

      if (wantRecordingRef.current) {
        if (restartCountRef.current >= 20) {
          restartCountRef.current = 0
        }
        restartCountRef.current++
        // getUserMediaでマイクを起こしてからSpeechRecognition再開
        // （Chrome: no-speech後にマイクがスリープする問題への対策）
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            stream.getTracks().forEach(t => t.stop())
            if (!wantRecordingRef.current) return
            startRecognitionSession.current()
          })
          .catch(() => {
            if (!wantRecordingRef.current) return
            startRecognitionSession.current()
          })
        return
      }
      setIsRecording(false)
      setInterimText('')
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      doStopRef.current()
    }
  })

  // 録音開始
  const doStartRef = useRef(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('このブラウザは音声認識に対応していません。Chrome を使用してください。')
      return
    }

    wantRecordingRef.current = true
    restartCountRef.current = 0
    setIsRecording(true)
    startRecognitionSession.current()
  })

  // ネイティブDOMイベントリスナーでトグル制御
  useEffect(() => {
    if (!isOpen) return
    const button = toggleButtonRef.current
    if (!button) return

    const handler = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isTrusted) return
      e.stopPropagation()
      e.preventDefault()

      if (wantRecordingRef.current) {
        doStopRef.current()
      } else {
        doStartRef.current()
      }
    }

    button.addEventListener('pointerdown', handler)
    return () => button.removeEventListener('pointerdown', handler)
  }, [isOpen])

  const generateSummary = async () => {
    if (!transcription.trim()) {
      alert('テキストを入力してください')
      return
    }

    setIsSummarizing(true)
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcription,
          templateId: selectedTemplate,
          clinicId,
          operatorId: staffId,
        })
      })

      if (!response.ok) throw new Error('要約に失敗しました')

      const result = await response.json()
      setSummary(result.summary)
    } catch (error) {
      console.error('要約エラー:', error)
      alert('要約に失敗しました。もう一度お試しください。')
    } finally {
      setIsSummarizing(false)
    }
  }

  // モーダルが閉じた時にクリーンアップ
  useEffect(() => {
    if (!isOpen) {
      doStopRef.current()
    }
  }, [isOpen])

  const clearAll = () => {
    doStopRef.current()
    setTranscription('')
    setSummary('')
    setInterimText('')
  }

  const attachToSubKarte = async () => {
    try {
      const response = await fetch('/api/subkarte/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          staff_id: staffId,
          entry_type: 'text',
          content: summary,
          metadata: {
            source: 'audio_recording',
            template: selectedTemplate,
            transcription,
          }
        })
      })

      if (!response.ok) throw new Error('サブカルテへの貼り付けに失敗しました')

      alert('サブカルテに貼り付けました')
      onClose()
    } catch (error) {
      console.error('サブカルテ貼り付けエラー:', error)
      alert('サブカルテへの貼り付けに失敗しました')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[1400px] max-w-[90vw]">
      <div className="flex h-[600px]">
        {/* 左パネル: テキスト入力 */}
        <div className="flex-1 border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">会話内容</h3>
            <div className="flex items-center gap-2">
              <Button
                ref={toggleButtonRef}
                className={isRecording
                  ? "bg-gray-700 hover:bg-gray-800 text-white px-4 py-1 animate-pulse"
                  : "bg-red-500 hover:bg-red-600 text-white px-4 py-1"
                }
                size="sm"
              >
                {isRecording ? (
                  <><Square className="w-4 h-4 mr-1" />録音停止</>
                ) : (
                  <><Mic className="w-4 h-4 mr-1" />録音開始</>
                )}
              </Button>
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                disabled={!transcription && !summary}
                className="px-3 py-1"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                全クリア
              </Button>
            </div>
          </div>

          {isRecording && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>録音中... 話してください</span>
              </div>
            </div>
          )}

          {!isRecording && (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Mic className="w-4 h-4" />
                <span>「録音開始」ボタンを押すか、テキストエリアをクリックして <strong>Fnキーを2回</strong> で音声入力</span>
              </div>
            </div>
          )}

          <Textarea
            value={transcription + (interimText ? '\n' + interimText : '')}
            onChange={(e) => {
              if (!isRecording) setTranscription(e.target.value)
            }}
            placeholder="ここに会話内容を入力（録音ボタン or Fn2回で音声入力）..."
            className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            readOnly={isRecording}
          />
        </div>

        {/* 右パネル: 要約 */}
        <div className="flex-1 p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-3">要約（編集可）</h3>

          <div className="flex items-center gap-2 mb-3">
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soap">SOAP形式</SelectItem>
                <SelectItem value="simple">簡単要約</SelectItem>
                <SelectItem value="detailed">詳細要約</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={generateSummary}
              disabled={isSummarizing || !transcription.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
            >
              <FileText className="w-4 h-4 mr-1" />
              {isSummarizing ? '要約中...' : '要約する'}
            </Button>
          </div>

          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="要約結果がここに表示されます..."
            className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
        </div>
      </div>

      {/* 下部アクションボタン */}
      <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={attachToSubKarte}
          disabled={!summary.trim()}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
        >
          サブカルテに貼付
        </Button>
      </div>
    </Modal>
  )
}
