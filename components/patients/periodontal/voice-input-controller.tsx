'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import {
  parseVoiceRecognition,
  type InputMode,
  type ParsedVoiceData,
} from '@/lib/utils/voice-recognition-parser'

// Web Speech API型定義
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface VoiceInputControllerProps {
  currentMode: InputMode
  onModeChange: (mode: InputMode) => void
  onDataParsed: (data: ParsedVoiceData) => void
  isActive: boolean
  onActiveChange: (active: boolean) => void
}

export function VoiceInputController({
  currentMode,
  onModeChange,
  onDataParsed,
  isActive,
  onActiveChange,
}: VoiceInputControllerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confidenceWarning, setConfidenceWarning] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)

  // 処理済みの認識結果を追跡（重複防止）
  const lastProcessedTimeRef = useRef<number>(0)
  const lastProcessedTranscriptRef = useRef<string>('')

  // 音声認識結果を処理
  const handleRecognitionResult = useCallback((transcript: string, confidence: number, isFinal: boolean) => {
    const now = Date.now()
    console.log(`\n📝 音声認識結果 (${isFinal ? '確定' : '暫定'}):`, {
      transcript,
      confidence,
      isFinal,
      timestamp: now,
      timeSinceLastProcess: now - lastProcessedTimeRef.current,
    })

    // 暫定結果も表示（リアルタイムフィードバック）
    setCurrentText(transcript)

    // 確定結果のみ処理
    if (!isFinal || !transcript.trim()) {
      console.log('  ⏭️ スキップ: 暫定結果または空文字')
      return
    }

    // 重複チェック: 完全に同じtranscriptを400ms以内に処理しない
    // これにより真の重複（interim→final変換や短時間での重複認識）は防ぎつつ、
    // ゆっくり話した連続した同じ数字（500ms以上の間隔）は許可
    const timeSinceLastProcess = now - lastProcessedTimeRef.current
    if (
      transcript.trim() === lastProcessedTranscriptRef.current &&
      timeSinceLastProcess < 400
    ) {
      console.log('⚠️ 重複検出: 同一transcript (400ms以内)')
      console.log('  前回:', lastProcessedTranscriptRef.current)
      console.log('  今回:', transcript.trim())
      console.log('  経過時間:', timeSinceLastProcess, 'ms')
      return
    }

    // 処理済みとしてマーク
    lastProcessedTimeRef.current = now
    lastProcessedTranscriptRef.current = transcript.trim()

    console.log('✅ 重複チェック通過 - 処理開始')
    console.log('  transcript:', transcript)
    console.log('  confidence:', confidence)
    console.log('  currentMode:', currentMode)

    // 信頼度が低い場合は警告を表示
    if (confidence < 0.7) {
      setConfidenceWarning(`認識の信頼度が低めです (${Math.round(confidence * 100)}%)`)
      setTimeout(() => setConfidenceWarning(null), 3000)
    } else {
      setConfidenceWarning(null)
    }

    // 音声認識結果を解析
    const parsed = parseVoiceRecognition(transcript, currentMode, confidence)
    console.log('🔍 パース結果:', {
      mode: parsed.mode,
      valuesCount: parsed.values.length,
      values: parsed.values,
      rawText: parsed.rawText,
      detectedMode: parsed.detectedMode,
    })

    // モード変更が検出された場合
    if (parsed.detectedMode && parsed.detectedMode !== currentMode) {
      console.log('🔄 モード変更:', currentMode, '->', parsed.detectedMode)
      onModeChange(parsed.detectedMode)
    }

    // データをコールバック
    console.log('📤 コールバック呼び出し - parsed.values.length:', parsed.values.length)
    onDataParsed(parsed)
  }, [currentMode, onModeChange, onDataParsed])

  // 録音開始（Web Speech API）
  const startRecording = useCallback(() => {
    try {
      setError(null)

      // Web Speech APIの対応チェック
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        setError('お使いのブラウザは音声認識に対応していません。Chrome/Edgeをご利用ください。')
        return
      }

      const recognition = new SpeechRecognition()

      // 設定
      recognition.lang = 'ja-JP'
      recognition.continuous = true // 連続認識
      recognition.interimResults = true // 暫定結果も取得
      recognition.maxAlternatives = 3 // 代替候補も取得

      // 結果イベント
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const results = event.results
        const result = results[event.resultIndex]
        const alternative = result[0]

        handleRecognitionResult(
          alternative.transcript,
          alternative.confidence,
          result.isFinal
        )
      }

      // エラーイベント
      recognition.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error)
        if (event.error === 'no-speech') {
          console.log('⚠️ 無音が検出されました（自動で再開します）')
          // 無音エラーは無視（自動で再開される）
        } else if (event.error === 'not-allowed') {
          setError('マイクへのアクセスが拒否されました')
          setIsRecording(false)
          onActiveChange(false)
        } else {
          setError(`音声認識エラー: ${event.error}`)
        }
      }

      // 終了イベント（自動再開）
      recognition.onend = () => {
        console.log('🔄 音声認識が終了しました')
        // 録音中なら自動で再開
        if (isRecording && recognitionRef.current) {
          console.log('▶️ 自動再開')
          try {
            recognition.start()
          } catch (err) {
            console.error('再開エラー:', err)
          }
        }
      }

      // 開始イベント
      recognition.onstart = () => {
        console.log('✅ 音声認識開始')
      }

      recognitionRef.current = recognition
      recognition.start()
      setIsRecording(true)
      setCurrentText('')
      onActiveChange(true)

      console.log('🎤 Web Speech API 録音開始')
    } catch (err) {
      console.error('録音開始エラー:', err)
      setError('音声認識の開始に失敗しました')
    }
  }, [onActiveChange, handleRecognitionResult, isRecording])

  // 録音停止
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
        console.log('⏹️ 音声認識停止')
      } catch (err) {
        console.error('停止エラー:', err)
      }
    }

    setIsRecording(false)
    onActiveChange(false)
  }, [onActiveChange])

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (err) {
          // 既に停止している場合は無視
        }
      }
    }
  }, [])

  // モード表示名
  const getModeLabel = (mode: InputMode) => {
    switch (mode) {
      case 'ppd':
        return 'PPD測定'
      case 'bop':
        return 'BOP記録'
      case 'mobility':
        return '動揺度測定'
    }
  }

  // モードカラー
  const getModeColor = (mode: InputMode) => {
    switch (mode) {
      case 'ppd':
        return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'bop':
        return 'bg-red-100 border-red-300 text-red-800'
      case 'mobility':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    }
  }

  return (
    <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isRecording ? (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-600">録音中</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <MicOff className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">待機中</span>
            </div>
          )}
        </div>

        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? 'destructive' : 'default'}
          size="sm"
          className="min-w-[100px]"
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              停止
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              録音開始
            </>
          )}
        </Button>
      </div>

      {/* 現在のモード表示 */}
      <div className={`px-3 py-2 rounded-md border ${getModeColor(currentMode)}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            現在のモード: {getModeLabel(currentMode)}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => onModeChange('ppd')}
              variant={currentMode === 'ppd' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              disabled={isRecording}
            >
              PPD
            </Button>
            <Button
              onClick={() => onModeChange('bop')}
              variant={currentMode === 'bop' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              disabled={isRecording}
            >
              BOP
            </Button>
            <Button
              onClick={() => onModeChange('mobility')}
              variant={currentMode === 'mobility' ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              disabled={isRecording}
            >
              動揺度
            </Button>
          </div>
        </div>
      </div>

      {/* 認識テキスト表示 */}
      {currentText && (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-start space-x-2">
            <Volume2 className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">認識結果（リアルタイム）:</p>
              <p className="text-sm font-medium text-gray-800">{currentText}</p>
            </div>
          </div>
        </div>
      )}

      {/* 信頼度警告 */}
      {confidenceWarning && (
        <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">{confidenceWarning}</p>
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 使い方ガイド */}
      {!isRecording && !isActive && (
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-200">
          <p className="font-semibold">📝 使い方:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>PPDモード: 「3, 4, 3, 3, 2, 2...」と数値を連続で読み上げ</li>
            <li>BOPモード(1点法): 「BOP 31, 34, 45」と歯番号を読み上げ</li>
            <li>BOPモード(4/6点法): 「BOP 37近心頬側, 41遠心舌側」と位置も指定</li>
            <li>動揺度モード: 「動揺度 16番2度, 36番1度」と読み上げ</li>
            <li>モード切り替え: 「BOP」「動揺度」と言うだけで自動切り替え</li>
          </ul>
        </div>
      )}
    </div>
  )
}
