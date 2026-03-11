'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'

interface Training {
  id: string
  training_name: string
  category: string | null
}

interface StepItem {
  id: string
  training_id: string
  sort_order: number
  training: Training
}

interface ProtocolStep {
  id: string
  step_number: number
  checkpoint_name: string
  description: string | null
  items: StepItem[]
}

interface Protocol {
  id: string
  name: string
  sort_order: number
  is_active: boolean
  is_parallel_layout: boolean
  steps: ProtocolStep[]
}

export default function TrainingProtocolsSettingsPage() {
  const clinicId = useClinicId()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 新規プロトコルフォーム
  const [showNewProtocolForm, setShowNewProtocolForm] = useState(false)
  const [newProtoName, setNewProtoName] = useState('')
  const [newProtoParallel, setNewProtoParallel] = useState(false)

  // 新規ステップフォーム
  const [showNewStepForm, setShowNewStepForm] = useState(false)
  const [newStepCheckpoint, setNewStepCheckpoint] = useState('')
  const [newStepDesc, setNewStepDesc] = useState('')

  // トレーニング追加
  const [addTrainingId, setAddTrainingId] = useState('')

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadProtocols = useCallback(async () => {
    if (!clinicId) return
    try {
      const res = await fetch(`/api/training/clinic/protocols?clinicId=${clinicId}`)
      if (!res.ok) throw new Error('プロトコル取得に失敗しました')
      const { protocols: data } = await res.json()
      setProtocols(data || [])
      if (data?.length > 0 && !activeProtocolId) {
        setActiveProtocolId(data[0].id)
      }
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }, [clinicId, activeProtocolId])

  const loadTrainings = useCallback(async () => {
    if (!clinicId) return
    try {
      const res = await fetch(`/api/training/clinic/trainings`)
      if (!res.ok) return
      const json = await res.json()
      setAllTrainings(json.data || [])
    } catch {
      // ignore
    }
  }, [clinicId])

  useEffect(() => {
    const init = async () => {
      if (!clinicId) return
      setIsLoading(true)
      await Promise.all([loadProtocols(), loadTrainings()])
      setIsLoading(false)
    }
    init()
  }, [clinicId, loadProtocols, loadTrainings])

  const handleSeedProtocols = async () => {
    if (!clinicId) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/training/clinic/seed-protocols?clinicId=${clinicId}`, { method: 'POST' })
      const json = await res.json()
      if (json.skipped) {
        showMessage('error', 'すでにプロトコルが設定されています')
      } else {
        showMessage('success', 'デフォルトプロトコルを作成しました')
        await loadProtocols()
      }
    } catch {
      showMessage('error', '作成に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateProtocol = async () => {
    if (!clinicId || !newProtoName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/training/clinic/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          name: newProtoName.trim(),
          sort_order: protocols.length,
          is_parallel_layout: newProtoParallel,
        }),
      })
      if (!res.ok) throw new Error('作成に失敗しました')
      showMessage('success', 'プロトコルを作成しました')
      setShowNewProtocolForm(false)
      setNewProtoName('')
      setNewProtoParallel(false)
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProtocol = async (id: string) => {
    if (!confirm('このプロトコルを削除しますか？（ステップとトレーニング割り当ても削除されます）')) return
    try {
      const res = await fetch(`/api/training/clinic/protocols?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      showMessage('success', 'プロトコルを削除しました')
      if (activeProtocolId === id) setActiveProtocolId(null)
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }

  const handleCreateStep = async () => {
    if (!activeProtocolId || !newStepCheckpoint.trim()) return
    setIsSaving(true)
    const proto = protocols.find((p) => p.id === activeProtocolId)
    const nextStepNumber = (proto?.steps.length ?? 0) + 1
    try {
      const res = await fetch('/api/training/clinic/protocol-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocolId: activeProtocolId,
          step_number: nextStepNumber,
          checkpoint_name: newStepCheckpoint.trim(),
          description: newStepDesc.trim() || null,
        }),
      })
      if (!res.ok) throw new Error('ステップ作成に失敗しました')
      showMessage('success', 'ステップを追加しました')
      setShowNewStepForm(false)
      setNewStepCheckpoint('')
      setNewStepDesc('')
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm('このステップを削除しますか？')) return
    try {
      const res = await fetch(`/api/training/clinic/protocol-steps?id=${stepId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      showMessage('success', 'ステップを削除しました')
      if (activeStepId === stepId) setActiveStepId(null)
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }

  const handleAddTrainingToStep = async () => {
    if (!activeStepId || !addTrainingId) return
    const activeStep = protocols
      .flatMap((p) => p.steps)
      .find((s) => s.id === activeStepId)
    setIsSaving(true)
    try {
      const res = await fetch('/api/training/clinic/protocol-step-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: activeStepId,
          trainingId: addTrainingId,
          sort_order: activeStep?.items.length ?? 0,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || '追加に失敗しました')
      }
      showMessage('success', 'トレーニングを追加しました')
      setAddTrainingId('')
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveTrainingFromStep = async (itemId: string) => {
    try {
      const res = await fetch(`/api/training/clinic/protocol-step-items?id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      showMessage('success', 'トレーニングを外しました')
      await loadProtocols()
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }

  const activeProtocol = protocols.find((p) => p.id === activeProtocolId)
  const activeStep = activeProtocol?.steps.find((s) => s.id === activeStepId)
  const stepTrainingIds = new Set(activeStep?.items.map((i) => i.training_id) ?? [])
  const unassignedTrainings = allTrainings.filter((t) => !stepTrainingIds.has(t.id))

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 プロトコル設定</h1>
          <p className="text-sm text-gray-600 mt-1">フローチャートのステップとトレーニング構成をカスタマイズできます</p>
        </div>
        <div className="flex gap-2">
          {protocols.length === 0 && (
            <button
              onClick={handleSeedProtocols}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
            >
              デフォルトで初期化
            </button>
          )}
          <button
            onClick={() => setShowNewProtocolForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            ＋ プロトコル追加
          </button>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* 新規プロトコルフォーム */}
      {showNewProtocolForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">新しいプロトコル</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">プロトコル名</label>
              <input
                type="text"
                value={newProtoName}
                onChange={(e) => setNewProtoName(e.target.value)}
                placeholder="例: 舌"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="parallel"
                checked={newProtoParallel}
                onChange={(e) => setNewProtoParallel(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="parallel" className="text-sm text-gray-700">横並びレイアウト</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateProtocol}
              disabled={isSaving || !newProtoName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              作成
            </button>
            <button
              onClick={() => setShowNewProtocolForm(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      {protocols.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">📋</p>
          <p className="font-medium">プロトコルがまだありません</p>
          <p className="text-sm mt-1">「デフォルトで初期化」でデフォルトのプロトコルを作成できます</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* プロトコルタブ */}
          <div className="w-48 flex-shrink-0 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">プロトコル</div>
            {protocols.map((proto) => (
              <button
                key={proto.id}
                onClick={() => { setActiveProtocolId(proto.id); setActiveStepId(null) }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeProtocolId === proto.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                {proto.name}
                <span className="ml-1 text-xs opacity-70">({proto.steps.length})</span>
              </button>
            ))}
          </div>

          {/* プロトコル詳細 */}
          {activeProtocol && (
            <div className="flex-1 space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">
                    {activeProtocol.name}
                    {activeProtocol.is_parallel_layout && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">横並び</span>
                    )}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewStepForm(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
                    >
                      ＋ ステップ追加
                    </button>
                    <button
                      onClick={() => handleDeleteProtocol(activeProtocol.id)}
                      className="px-3 py-1.5 text-red-600 border border-red-300 rounded-lg text-xs hover:bg-red-50"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* 新規ステップフォーム */}
                {showNewStepForm && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
                    <h3 className="text-sm font-bold text-gray-800">新しいステップ</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">チェックポイント名</label>
                      <input
                        type="text"
                        value={newStepCheckpoint}
                        onChange={(e) => setNewStepCheckpoint(e.target.value)}
                        placeholder="例: 舌尖が前に伸びるか？"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">説明（任意）</label>
                      <input
                        type="text"
                        value={newStepDesc}
                        onChange={(e) => setNewStepDesc(e.target.value)}
                        placeholder="補足説明..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateStep}
                        disabled={isSaving || !newStepCheckpoint.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => { setShowNewStepForm(false); setNewStepCheckpoint(''); setNewStepDesc('') }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                )}

                {/* ステップ一覧 */}
                {activeProtocol.steps.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">ステップがありません</div>
                ) : (
                  <div className="space-y-2">
                    {activeProtocol.steps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() => setActiveStepId(activeStepId === step.id ? null : step.id)}
                        className={`rounded-lg border cursor-pointer transition-colors ${
                          activeStepId === step.id
                            ? 'border-blue-400 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between px-4 py-3">
                          <div>
                            <span className="text-xs text-gray-500 mr-2">ステップ {step.step_number}</span>
                            <span className="font-medium text-gray-900 text-sm">{step.checkpoint_name}</span>
                            <span className="ml-2 text-xs text-gray-400">({step.items.length}件)</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-gray-400 text-sm">{activeStepId === step.id ? '▲' : '▼'}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id) }}
                              className="text-red-400 hover:text-red-600 text-xs"
                            >
                              削除
                            </button>
                          </div>
                        </div>

                        {/* ステップ内トレーニング編集 */}
                        {activeStepId === step.id && (
                          <div className="border-t border-blue-200 px-4 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                            {/* トレーニング追加 */}
                            <div className="flex gap-2">
                              <select
                                value={addTrainingId}
                                onChange={(e) => setAddTrainingId(e.target.value)}
                                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">トレーニングを選択...</option>
                                {unassignedTrainings.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    [{t.category}] {t.training_name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={handleAddTrainingToStep}
                                disabled={!addTrainingId || isSaving}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                              >
                                追加
                              </button>
                            </div>

                            {/* 現在のトレーニング */}
                            {step.items.length === 0 ? (
                              <div className="text-xs text-gray-400 text-center py-2">トレーニングなし</div>
                            ) : (
                              <div className="space-y-1">
                                {step.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between px-3 py-2 bg-white rounded border border-gray-200"
                                  >
                                    <span className="text-xs font-medium text-gray-900">{item.training.training_name}</span>
                                    <button
                                      onClick={() => handleRemoveTrainingFromStep(item.id)}
                                      className="text-red-400 hover:text-red-600 text-xs"
                                    >
                                      外す
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
