'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
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

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!trainingId) {
      router.push('/training/patient/home')
      return
    }

    loadTraining()

    // 画面スリープ防止（Web Locks API使用）
    if ('wakeLock' in navigator) {
      requestWakeLock()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [trainingId])

  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRunning, remainingSeconds])

  const requestWakeLock = async () => {
    try {
      // @ts-ignore
      await navigator.wakeLock.request('screen')
    } catch (err) {
      console.log('Wake Lock not supported')
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

  const handleTimerEnd = () => {
    if (isResting) {
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
  }

  const handleStart = () => {
    setIsRunning(true)
    setStartTime(new Date())
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

      // 完了画面表示
      alert('🎉 完了しました！')

      router.push('/training/patient/home')
    } catch (error) {
      console.error('記録保存エラー:', error)
      alert('記録の保存に失敗しました')
      router.push('/training/patient/home')
    }
  }

  const handleInterrupt = async () => {
    if (confirm('途中で終了しますか？')) {
      setIsRunning(false)

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
  }

  if (!training) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={handleInterrupt}
          className="text-white/70 hover:text-white"
        >
          ✕ 終了
        </button>
        <div className="text-sm text-white/70">
          {currentSet} / {training.sets} セット
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* トレーニング名 */}
        <h1 className="text-2xl font-bold mb-4">{training.training_name}</h1>

        {/* アニメーション表示エリア */}
        <div className="w-64 h-64 bg-gray-800 rounded-2xl mb-8 flex items-center justify-center">
          {/* TODO: Lottieアニメーション表示 */}
          <div className="text-6xl">🏃</div>
        </div>

        {/* タイマー */}
        <div className="mb-8">
          <div className="text-8xl font-bold mb-4">{remainingSeconds}</div>
          <div className="text-center text-xl text-white/70">
            {isResting ? '休憩です' : '始めてください'}
          </div>
        </div>

        {/* プログレスバー */}
        <div className="w-full max-w-md h-2 bg-gray-800 rounded-full overflow-hidden mb-8">
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

        {/* 説明文 */}
        {training.description && (
          <p className="text-center text-white/70 max-w-md">
            {training.description}
          </p>
        )}
      </div>

      {/* スタートボタン */}
      {!isRunning && (
        <div className="p-8">
          <button
            onClick={handleStart}
            className="w-full bg-blue-600 text-white py-4 rounded-xl text-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            開始
          </button>
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
