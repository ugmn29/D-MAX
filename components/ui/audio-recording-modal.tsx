'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Modal } from './modal'
import { Button } from './button'
import { Textarea } from './textarea'
import { Select } from './select'
import { Mic, FileText, Trash2, Square, Activity } from 'lucide-react'

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

  // マイクテスト用
  const [isMicTesting, setIsMicTesting] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [micDeviceName, setMicDeviceName] = useState('')
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animFrameRef = useRef<number>(0)

  // 診断ステータス用
  const [sttEvents, setSttEvents] = useState<string[]>([])
  const [restartDisplay, setRestartDisplay] = useState(0)

  const recognitionRef = useRef<any>(null)
  const wantRecordingRef = useRef(false)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
  const restartCountRef = useRef(0)

  // マイクテスト開始
  const startMicTest = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      micStreamRef.current = stream

      const audioTrack = stream.getAudioTracks()[0]
      const trackInfo = `${audioTrack.label || '不明'} (${audioTrack.readyState}, muted=${audioTrack.muted})`
      setMicDeviceName(trackInfo)

      const audioContext = new AudioContext()
      // Chrome: AudioContextがsuspended状態の場合resumeが必要
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      const source = audioContext.createMediaStreamSource(stream)
      // source → analyser → gain(0) → destination で音声処理パイプラインを完成させる
      // （destinationに接続しないとChromeがAnalyserNodeを処理しない場合がある）
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 0 // スピーカーから音を出さない
      source.connect(analyser)
      analyser.connect(gainNode)
      gainNode.connect(audioContext.destination)
      audioContextRef.current = audioContext

      setIsMicTesting(true)
      console.log('[MicTest] stream active:', stream.active, 'track:', trackInfo, 'audioContext:', audioContext.state)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setMicLevel(Math.round(avg / 255 * 100))
        animFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()
    } catch (err) {
      alert('マイクにアクセスできませんでした: ' + err)
    }
  }, [])

  // マイクテスト停止
  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop())
    if (audioContextRef.current) audioContextRef.current.close()
    micStreamRef.current = null
    audioContextRef.current = null
    setIsMicTesting(false)
    setMicLevel(0)
  }, [])

  // 録音を停止する内部関数
  const doStopRef = useRef(() => {
    wantRecordingRef.current = false
    restartCountRef.current = 0
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsRecording(false)
    setInterimText('')
    setSttEvents([])
    setRestartDisplay(0)
  })

  // SpeechRecognitionセッションを開始（getUserMedia不要 - SpeechRecognitionが直接マイクにアクセス）
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

    recognition.onstart = () => {
      console.log('[STT] onstart')
      setSttEvents(prev => [...prev.slice(-8), '⏳ onstart - 認識開始'])
    }
    recognition.onaudiostart = () => {
      console.log('[STT] onaudiostart - マイク音声受信開始')
      setSttEvents(prev => [...prev.slice(-8), '✅ onaudiostart - マイク受信中'])
    }
    recognition.onspeechstart = () => {
      console.log('[STT] onspeechstart - 音声検出')
      setSttEvents(prev => [...prev.slice(-8), '✅ onspeechstart - 音声検出!'])
    }
    recognition.onspeechend = () => {
      console.log('[STT] onspeechend')
      setSttEvents(prev => [...prev.slice(-8), '⏹ onspeechend'])
    }
    recognition.onaudioend = () => {
      console.log('[STT] onaudioend')
      setSttEvents(prev => [...prev.slice(-8), '⏹ onaudioend'])
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
        // 音声認識が成功したらリスタートカウンタをリセット
        restartCountRef.current = 0
      } else if (interim) {
        setInterimText(interim)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('[STT] onerror:', event.error)
      setSttEvents(prev => [...prev.slice(-8), `❌ onerror: ${event.error}`])
      if (event.error === 'not-allowed') {
        alert('マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。')
        doStopRef.current()
      }
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        doStopRef.current()
      }
    }

    recognition.onend = () => {
      console.log('[STT] onend - wantRecording:', wantRecordingRef.current, 'restartCount:', restartCountRef.current)
      // 終了した認識オブジェクトへの参照をクリア
      recognitionRef.current = null

      if (wantRecordingRef.current) {
        // no-speech連続リスタートを制限（最大20回 = 約2分）
        if (restartCountRef.current >= 20) {
          console.log('[STT] リスタート上限到達、新規セッション作成...')
          restartCountRef.current = 0
        }
        restartCountRef.current++
        setRestartDisplay(restartCountRef.current)
        setSttEvents(prev => [...prev.slice(-8), `🔄 自動再起動 #${restartCountRef.current}`])
        console.log('[STT] 自動再起動 #' + restartCountRef.current + ' - マイクリフレッシュ後に新規セッション')
        // getUserMediaで一瞬マイクを起こしてからSpeechRecognition開始
        // （Chrome: no-speech後にマイクがスリープする問題への対策）
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            // マイクを即座に解放（SpeechRecognitionと競合させない）
            stream.getTracks().forEach(t => t.stop())
            console.log('[STT] マイクリフレッシュ完了、新規セッション開始')
            if (!wantRecordingRef.current) return
            startRecognitionSession.current()
          })
          .catch(() => {
            // getUserMedia失敗でもSpeechRecognition開始を試みる
            console.log('[STT] マイクリフレッシュ失敗、直接開始')
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
      console.log('[STT] recognition.start() 完了')
    } catch (e) {
      console.error('[STT] start失敗:', e)
      doStopRef.current()
    }
  })

  // 録音開始: SpeechRecognitionが直接マイクにアクセス（getUserMedia不要）
  const doStartRef = useRef(() => {
    console.log('[STT] startRecording')

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
  // Reactの合成イベントシステムを完全にバイパス
  useEffect(() => {
    if (!isOpen) return
    const button = toggleButtonRef.current
    if (!button) return

    // useEffect内のローカル変数（Reactの再レンダーに影響されない）
    let startedAt = 0
    let lastBlockedAt = 0 // ダブルタップ検出用

    const handler = (e: PointerEvent) => {
      if (e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()

      const now = Date.now()
      const sinceStart = now - startedAt
      console.log('[STT] pointerdown: trusted=' + e.isTrusted + ' wantRec=' + wantRecordingRef.current + ' sinceStart=' + sinceStart + 'ms')

      // untrustedイベント（プログラム生成）は無視
      if (!e.isTrusted) {
        console.log('[STT] untrusted event → 無視')
        return
      }

      if (wantRecordingRef.current) {
        // 録音開始後10秒以内のphantom対策
        // ただし前回ブロックから1秒以内の再タップ（ユーザーの意図的ダブルタップ）は許可
        if (startedAt > 0 && sinceStart < 10000) {
          if (lastBlockedAt > 0 && now - lastBlockedAt < 1000) {
            // ダブルタップ検出 → 停止を許可
            console.log('[STT] ダブルタップ検出 → 停止 (' + sinceStart + 'ms)')
          } else {
            // 初回タップ → ブロック
            lastBlockedAt = now
            console.log('[STT] cooldown中 → 停止を無視 (' + sinceStart + 'ms) ※もう一度押すと停止')
            return
          }
        }
        console.log('[STT] toggle → 停止 (native)')
        doStopRef.current()
        startedAt = 0
        lastBlockedAt = 0
      } else {
        console.log('[STT] toggle → 開始 (native)')
        startedAt = now
        lastBlockedAt = 0
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

  // モーダルが閉じた時にマイクテストもクリーンアップ
  useEffect(() => {
    if (!isOpen) {
      stopMicTest()
    }
  }, [isOpen, stopMicTest])

  const clearAll = () => {
    doStopRef.current()
    stopMicTest()
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

          {/* マイクテストパネル */}
          {isMicTesting && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">🎤 マイクテスト中</span>
                <Button onClick={stopMicTest} variant="outline" size="sm" className="text-xs px-2 py-0.5">
                  テスト終了
                </Button>
              </div>
              <div className="text-xs text-green-700 mb-1">デバイス: {micDeviceName}</div>
              <div className="w-full bg-gray-200 rounded h-5 overflow-hidden">
                <div
                  className={`h-5 rounded transition-all duration-75 ${micLevel > 30 ? 'bg-green-500' : micLevel > 5 ? 'bg-yellow-400' : 'bg-gray-400'}`}
                  style={{ width: `${Math.min(micLevel, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>レベル: {micLevel}%</span>
                <span>{micLevel > 30 ? '✅ 音声を検出中' : micLevel > 5 ? '⚠️ 音が小さい' : '❌ 音声なし - マイクを確認'}</span>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>録音中... 話してください</span>
              </div>
              {/* 診断ステータス */}
              {sttEvents.length > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <div className="text-xs text-gray-600 font-mono space-y-0.5">
                    {sttEvents.map((evt, i) => (
                      <div key={i}>{evt}</div>
                    ))}
                  </div>
                  {restartDisplay > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ no-speechで{restartDisplay}回再起動（音声が届いていない可能性）
                    </div>
                  )}
                  {restartDisplay >= 3 && (
                    <div className="text-xs text-red-600 mt-1 font-medium">
                      💡 マイクテストで音声が拾えているか確認してください（録音停止→マイクテスト）
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isRecording && !isMicTesting && (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Mic className="w-4 h-4" />
                  <span>「録音開始」ボタンを押すか、テキストエリアをクリックして <strong>Fnキーを2回</strong> で音声入力</span>
                </div>
                <Button
                  onClick={startMicTest}
                  variant="outline"
                  size="sm"
                  className="text-xs px-2 py-1 ml-2 shrink-0"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  マイクテスト
                </Button>
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
