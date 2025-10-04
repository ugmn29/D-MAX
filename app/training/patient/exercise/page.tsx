'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ExerciseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trainingId = searchParams.get('id')

  const [training, setTraining] = useState<any>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showInterruptConfirm, setShowInterruptConfirm] = useState(false)
  const [isStartCountdown, setIsStartCountdown] = useState(false)
  const [currentPrecautionIndex, setCurrentPrecautionIndex] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const precautionTimerRef = useRef<NodeJS.Timeout | null>(null)

  const requestWakeLock = async () => {
    try {
      // @ts-ignore
      await navigator.wakeLock.request('screen')
    } catch (err) {
      console.log('Wake Lock not supported')
    }
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }, // フロントカメラ
        audio: false
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('カメラの起動に失敗しました:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const loadTraining = async () => {
    try {
      const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')

      const response = await fetch(`/api/training/patient/training?trainingId=${trainingId}&patientId=${patient.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'トレーニングの取得に失敗しました')
      }

      setTraining(data.training)
      setMenuId(data.menuId)
      setRemainingSeconds(data.training.action_seconds)
    } catch (error) {
      console.error('トレーニング取得エラー:', error)
      router.push('/training/patient/home')
    }
  }

  const handleComplete = async () => {
    setIsRunning(false)

    try {
      const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')
      const endTime = new Date()
      const duration = startTime
        ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
        : 0

      const response = await fetch('/api/training/patient/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          clinicId: patient.clinicId,
          trainingId: trainingId,
          menuId: menuId,
          completed: true,
          actualDurationSeconds: duration
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '記録の保存に失敗しました')
      }

      // 完了モーダル表示
      setShowCompleteModal(true)
    } catch (error) {
      console.error('記録保存エラー:', error)
      setShowCompleteModal(true)
    }
  }

  const handleTimerEnd = useCallback(() => {
    if (isStartCountdown) {
      // 開始カウントダウン終了 → アクション開始
      setIsStartCountdown(false)
      setRemainingSeconds(training.action_seconds)
    } else if (isResting) {
      // 休憩終了 → 次のセットへ
      if (currentSet < training.sets) {
        setCurrentSet((prev) => prev + 1)
        setIsResting(false)
        setRemainingSeconds(training.action_seconds)
      } else {
        // 全セット完了
        handleComplete()
      }
    } else {
      // アクション終了 → 休憩へ
      if (currentSet < training.sets) {
        setIsResting(true)
        setRemainingSeconds(training.rest_seconds)
      } else {
        // 最終セット完了
        handleComplete()
      }
    }
  }, [isStartCountdown, isResting, currentSet, training])

  useEffect(() => {
    if (!trainingId) {
      router.push('/training/patient/home')
      return
    }

    loadTraining()
    startCamera()

    // 画面スリープ防止（Web Locks API使用）
    if ('wakeLock' in navigator) {
      requestWakeLock()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      stopCamera()
    }
  }, [trainingId])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, handleTimerEnd])

  // 注意事項の自動切り替え
  useEffect(() => {
    if (isRunning && !isStartCountdown && !isResting && training?.precautions && training.precautions.length > 0) {
      precautionTimerRef.current = setInterval(() => {
        setCurrentPrecautionIndex((prev) => (prev + 1) % training.precautions.length)
      }, 5000) // 5秒ごとに切り替え
    } else {
      if (precautionTimerRef.current) {
        clearInterval(precautionTimerRef.current)
        precautionTimerRef.current = null
      }
    }

    return () => {
      if (precautionTimerRef.current) {
        clearInterval(precautionTimerRef.current)
      }
    }
  }, [isRunning, isStartCountdown, isResting, training])

  const handleStart = () => {
    // 5秒カウントダウンを開始
    setIsStartCountdown(true)
    setRemainingSeconds(5)
    setIsRunning(true)
    setStartTime(new Date())
  }

  const handleInterrupt = () => {
    setShowInterruptConfirm(true)
  }

  const confirmInterrupt = async () => {
    setIsRunning(false)
    setShowInterruptConfirm(false)

    const patient = JSON.parse(localStorage.getItem('patient_data') || '{}')

    await fetch('/api/training/patient/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patient.id,
        clinicId: patient.clinicId,
        trainingId: trainingId,
        menuId: menuId,
        completed: false,
        actualDurationSeconds: 0
      })
    })

    router.push('/training/patient/home')
  }

  if (!training) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* ヘッダー */}
      <div className="p-3 flex items-center justify-between bg-black/30 backdrop-blur-sm z-10">
        <div className="text-sm px-3 py-1 bg-white/10 rounded">
          {currentSet}/{training.sets}
        </div>
        <div className="text-lg font-bold">{training.training_name}</div>
        <div className="w-16"></div>
      </div>

      {/* メインコンテンツ - カメラとタイマー */}
      <div className="flex-1 relative overflow-hidden">
        {/* インカメラ映像（フルスクリーン） */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 円形タイマー（左上） */}
        {!isResting && !isStartCountdown && isRunning && (
          <div className="absolute top-4 left-4">
            <div className="relative w-28 h-28">
              {/* 背景円 */}
              <svg className="transform -rotate-90 w-28 h-28">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="8"
                  fill="rgba(0,0,0,0.5)"
                />
                {/* プログレス円 */}
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - (training.action_seconds - remainingSeconds) / training.action_seconds)}`}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              {/* 中央の数字 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-white">{remainingSeconds}</div>
              </div>
            </div>
          </div>
        )}

        {/* 休憩中の表示（画面中央） */}
        {isResting && remainingSeconds > 3 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-black/70 backdrop-blur-md rounded-3xl px-12 py-8 text-center">
              <div className="text-5xl font-bold mb-3">休憩中</div>
              <div className="text-2xl text-white/70">あと {remainingSeconds}秒</div>
            </div>
          </div>
        )}

        {/* 開始カウントダウン表示（画面中央・5秒間） */}
        {isStartCountdown && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <div className="text-[180px] font-bold animate-pulse text-white leading-none">
                {remainingSeconds}
              </div>
              <div className="text-3xl text-white/80 mt-4">準備してください</div>
            </div>
          </div>
        )}

        {/* カウントダウン表示（画面中央・休憩の最後の3秒） */}
        {!isStartCountdown && isResting && remainingSeconds <= 3 && remainingSeconds > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-[150px] font-bold animate-pulse text-white">
              {remainingSeconds}
            </div>
          </div>
        )}

        {/* プログレスバー（下部） */}
        {isRunning && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${
                  ((isResting
                    ? training.rest_seconds - remainingSeconds
                    : training.action_seconds - remainingSeconds) /
                    (isResting ? training.rest_seconds : training.action_seconds)) *
                  100
                }%`
              }}
            />
          </div>
        )}
      </div>

      {/* 注意事項表示（トレーニング中のみ） */}
      {isRunning && !isStartCountdown && !isResting && training?.precautions && training.precautions.length > 0 && (
        <div className="px-4 py-3 bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white/80 mb-1">注意事項</div>
              <div className="text-base text-white font-medium leading-snug">
                {training.precautions[currentPrecautionIndex]}
              </div>
            </div>
            <div className="flex-shrink-0 text-xs text-white/60">
              {currentPrecautionIndex + 1}/{training.precautions.length}
            </div>
          </div>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="p-4 bg-black/30 backdrop-blur-sm">
        <div className="flex gap-3">
          <button
            onClick={handleInterrupt}
            className="flex-1 bg-red-600 text-white py-4 rounded-xl text-xl font-semibold hover:bg-red-700 transition-colors active:bg-red-800"
          >
            停止
          </button>
          {!isRunning && (
            <button
              onClick={handleStart}
              className="flex-1 bg-blue-600 text-white py-4 rounded-xl text-xl font-semibold hover:bg-blue-700 transition-colors active:bg-blue-800"
            >
              開始
            </button>
          )}
        </div>
      </div>

      {/* 完了モーダル */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">完了しました！</h2>
            <p className="text-gray-600 mb-6">お疲れ様でした</p>
            <button
              onClick={() => router.push('/training/patient/home')}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      )}

      {/* 中断確認モーダル */}
      {showInterruptConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">トレーニングを停止しますか？</h2>
            <p className="text-gray-600 mb-6 text-center">進捗は保存されません</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowInterruptConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl text-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmInterrupt}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl text-lg font-semibold hover:bg-red-700 transition-colors"
              >
                停止する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExercisePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">読み込み中...</div>
        </div>
      }
    >
      <ExerciseContent />
    </Suspense>
  )
}
