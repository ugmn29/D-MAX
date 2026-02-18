'use client'

import { useState, useRef, useCallback } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Textarea } from './textarea'
import { Select } from './select'
import { Mic, MicOff, FileText, Trash2, Square } from 'lucide-react'

interface AudioRecordingModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  clinicId?: string
  staffId?: string
}

// SpeechRecognition型定義
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any

export function AudioRecordingModal({ isOpen, onClose, patientId, clinicId, staffId }: AudioRecordingModalProps) {
  const [transcription, setTranscription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('soap')
  const [summary, setSummary] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')

  // recognitionインスタンスをrefで保持
  const recognitionRef = useRef<any>(null)
  // 意図的な停止かどうかのフラグ
  const intentionalStopRef = useRef(false)

  // Web Speech API で音声認識開始
  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('このブラウザは音声認識に対応していません。Chrome を使用してください。')
      return
    }

    // 既存のrecognitionがあれば停止
    if (recognitionRef.current) {
      intentionalStopRef.current = true
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[STT] 音声認識開始')
      setIsRecording(true)
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
      } else {
        setInterimText(interim)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[STT] エラー:', event.error)
      if (event.error === 'not-allowed') {
        alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。')
      }
      // no-speech エラーの場合は自動再起動に任せる
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsRecording(false)
        recognitionRef.current = null
      }
    }

    recognition.onend = () => {
      console.log('[STT] 音声認識終了, intentionalStop:', intentionalStopRef.current)
      // 意図的な停止でなければ自動再起動（ブラウザが自動停止した場合）
      if (!intentionalStopRef.current && recognitionRef.current === recognition) {
        console.log('[STT] 自動再起動...')
        try {
          recognition.start()
          return
        } catch (e) {
          console.error('[STT] 再起動失敗:', e)
        }
      }
      setIsRecording(false)
      setInterimText('')
      recognitionRef.current = null
    }

    intentionalStopRef.current = false
    recognitionRef.current = recognition

    try {
      recognition.start()
      console.log('[STT] recognition.start() 呼び出し完了')
    } catch (e) {
      console.error('[STT] start失敗:', e)
      setIsRecording(false)
      recognitionRef.current = null
    }
  }, [])

  // 音声認識停止
  const stopRecording = useCallback(() => {
    intentionalStopRef.current = true
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setIsRecording(false)
    setInterimText('')
  }, [])

  // 要約処理
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

  // 全クリア
  const clearAll = () => {
    if (isRecording) stopRecording()
    setTranscription('')
    setSummary('')
    setInterimText('')
  }

  // サブカルテに貼り付け
  const attachToSubKarte = async () => {
    try {
      const response = await fetch('/api/subkarte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          type: 'text',
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

  // アクティビティに送信
  const sendToActivity = () => {
    alert('アクティビティに送信しました')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-[1400px] max-w-[90vw]">
      <div className="flex h-[600px]">
        {/* 左パネル: テキスト入力 */}
        <div className="flex-1 border-r border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">会話内容</h3>
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1"
                  size="sm"
                >
                  <Mic className="w-4 h-4 mr-1" />
                  録音開始
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-1 animate-pulse"
                  size="sm"
                >
                  <Square className="w-4 h-4 mr-1" />
                  録音停止
                </Button>
              )}
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

          {/* 要約コントロール */}
          <div className="flex items-center gap-2 mb-3">
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
