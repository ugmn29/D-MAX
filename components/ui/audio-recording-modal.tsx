'use client'

import { useState, useRef, useCallback } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Textarea } from './textarea'
import { Select } from './select'
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
  const lastToggleRef = useRef(0)

  // 録音を停止する内部関数
  const doStop = () => {
    wantRecordingRef.current = false
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
    setInterimText('')
  }

  const doStart = (e: React.MouseEvent) => {
    console.log('[STT] startRecording')

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('このブラウザは音声認識に対応していません。Chrome を使用してください。')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }

    wantRecordingRef.current = true
    // setIsRecordingは同期的に設定（onstartではなくここで）
    setIsRecording(true)

    const recognition = new SpeechRecognition()
    recognition.lang = 'ja-JP'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      console.log('[STT] onstart')
    }

    recognition.onaudiostart = () => {
      console.log('[STT] onaudiostart - マイク音声受信開始')
    }

    recognition.onspeechstart = () => {
      console.log('[STT] onspeechstart - 音声検出')
    }

    recognition.onspeechend = () => {
      console.log('[STT] onspeechend')
    }

    recognition.onaudioend = () => {
      console.log('[STT] onaudioend')
    }

    recognition.onresult = (event: any) => {
      console.log('[STT] onresult - results:', event.results.length)
      let interim = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
          console.log('[STT] final:', result[0].transcript)
        } else {
          interim += result[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscription(prev => prev + (prev ? '\n' : '') + finalTranscript)
        setInterimText('')
      } else if (interim) {
        setInterimText(interim)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[STT] onerror:', event.error)
      if (event.error === 'not-allowed') {
        alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。')
        wantRecordingRef.current = false
        setIsRecording(false)
      }
      // no-speech/aborted以外のエラーは録音停止
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        wantRecordingRef.current = false
        setIsRecording(false)
        recognitionRef.current = null
      }
    }

    recognition.onend = () => {
      console.log('[STT] onend - wantRecording:', wantRecordingRef.current)
      if (wantRecordingRef.current && recognitionRef.current === recognition) {
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

    recognitionRef.current = recognition

    try {
      recognition.start()
      console.log('[STT] recognition.start() 完了')
    } catch (e) {
      console.error('[STT] start失敗:', e)
      wantRecordingRef.current = false
      setIsRecording(false)
      recognitionRef.current = null
    }
  }

  // トグルボタン: onPointerDownで制御（onClick phantom call回避）
  const handleToggleRecording = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()

    // primary button（左クリック/タッチ）のみ
    if (e.button !== 0) return

    if (wantRecordingRef.current) {
      // 開始後3秒以内は停止を無視（phantom call対策）
      if (Date.now() - lastToggleRef.current < 3000) {
        console.log('[STT] 開始直後の停止を無視 (' + (Date.now() - lastToggleRef.current) + 'ms)')
        console.trace('[STT] phantom stop trace')
        return
      }
      console.log('[STT] toggle → 停止')
      doStop()
    } else {
      console.log('[STT] toggle → 開始')
      lastToggleRef.current = Date.now()
      doStart(e as unknown as React.MouseEvent)
    }
  }, [])

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

  const clearAll = () => {
    doStop()
    setTranscription('')
    setSummary('')
    setInterimText('')
  }

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
              <Button
                onPointerDown={handleToggleRecording}
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
