'use client'

import { useState, useEffect, useCallback } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'

interface Training {
  id: string
  training_name: string
  category: string | null
}

interface GroupItem {
  id: string
  training_id: string
  sort_order: number
  training: Training
}

interface TrainingGroup {
  id: string
  name: string
  icon: string
  color: string
  sort_order: number
  is_active: boolean
  items: GroupItem[]
}

const COLOR_OPTIONS = [
  { value: 'blue', label: '青', className: 'bg-blue-500' },
  { value: 'pink', label: 'ピンク', className: 'bg-pink-500' },
  { value: 'green', label: '緑', className: 'bg-green-500' },
  { value: 'purple', label: '紫', className: 'bg-purple-500' },
  { value: 'orange', label: 'オレンジ', className: 'bg-orange-500' },
]

export default function TrainingGroupsSettingsPage() {
  const clinicId = useClinicId()
  const [groups, setGroups] = useState<TrainingGroup[]>([])
  const [allTrainings, setAllTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [showNewGroupForm, setShowNewGroupForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupIcon, setNewGroupIcon] = useState('📋')
  const [newGroupColor, setNewGroupColor] = useState('blue')
  const [addTrainingId, setAddTrainingId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const loadGroups = useCallback(async () => {
    if (!clinicId) return
    try {
      const res = await fetch(`/api/training/clinic/groups?clinicId=${clinicId}`)
      if (!res.ok) throw new Error('グループ取得に失敗しました')
      const { groups: data } = await res.json()
      setGroups(data || [])
      if (data?.length > 0 && !activeGroupId) {
        setActiveGroupId(data[0].id)
      }
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }, [clinicId, activeGroupId])

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
      await Promise.all([loadGroups(), loadTrainings()])
      setIsLoading(false)
    }
    init()
  }, [clinicId, loadGroups, loadTrainings])

  const handleSeedGroups = async () => {
    if (!clinicId) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/training/clinic/seed-groups?clinicId=${clinicId}`, { method: 'POST' })
      const json = await res.json()
      if (json.skipped) {
        showMessage('error', 'すでにグループが設定されています')
      } else {
        showMessage('success', 'デフォルトグループを作成しました')
        await loadGroups()
      }
    } catch {
      showMessage('error', '作成に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!clinicId || !newGroupName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/training/clinic/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId,
          name: newGroupName.trim(),
          icon: newGroupIcon,
          color: newGroupColor,
          sort_order: groups.length,
        }),
      })
      if (!res.ok) throw new Error('作成に失敗しました')
      showMessage('success', 'グループを作成しました')
      setShowNewGroupForm(false)
      setNewGroupName('')
      await loadGroups()
    } catch (e: any) {
      showMessage('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('このグループを削除しますか？（トレーニングの割り当ても解除されます）')) return
    try {
      const res = await fetch(`/api/training/clinic/groups?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      showMessage('success', 'グループを削除しました')
      if (activeGroupId === id) setActiveGroupId(null)
      await loadGroups()
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }

  const handleAddTraining = async () => {
    if (!activeGroupId || !addTrainingId) return
    setIsSaving(true)
    try {
      const currentGroup = groups.find((g) => g.id === activeGroupId)
      const res = await fetch('/api/training/clinic/group-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: activeGroupId,
          trainingId: addTrainingId,
          sort_order: currentGroup?.items.length ?? 0,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || '追加に失敗しました')
      }
      showMessage('success', 'トレーニングを追加しました')
      setAddTrainingId('')
      await loadGroups()
    } catch (e: any) {
      showMessage('error', e.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveTraining = async (itemId: string) => {
    try {
      const res = await fetch(`/api/training/clinic/group-items?id=${itemId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('削除に失敗しました')
      showMessage('success', 'トレーニングを外しました')
      await loadGroups()
    } catch (e: any) {
      showMessage('error', e.message)
    }
  }

  const activeGroup = groups.find((g) => g.id === activeGroupId)
  const unassignedTrainings = allTrainings.filter(
    (t) => !activeGroup?.items.some((item) => item.training_id === t.id)
  )

  if (isLoading) {
    return <div className="flex items-center justify-center py-12 text-gray-600">読み込み中...</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗂️ タブグループ設定</h1>
          <p className="text-sm text-gray-600 mt-1">患者トレーニング管理画面のタブグループをカスタマイズできます</p>
        </div>
        <div className="flex gap-2">
          {groups.length === 0 && (
            <button
              onClick={handleSeedGroups}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
            >
              デフォルトで初期化
            </button>
          )}
          <button
            onClick={() => setShowNewGroupForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            ＋ グループ追加
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

      {/* 新規グループフォーム */}
      {showNewGroupForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">新しいグループ</h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">グループ名</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="例: 舌のトレーニング"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">アイコン</label>
              <input
                type="text"
                value={newGroupIcon}
                onChange={(e) => setNewGroupIcon(e.target.value)}
                className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カラー</label>
              <select
                value={newGroupColor}
                onChange={(e) => setNewGroupColor(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateGroup}
              disabled={isSaving || !newGroupName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              作成
            </button>
            <button
              onClick={() => setShowNewGroupForm(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* グループ一覧 */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🗂️</p>
          <p className="font-medium">グループがまだありません</p>
          <p className="text-sm mt-1">「デフォルトで初期化」でデフォルトのグループを作成できます</p>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* グループタブ */}
          <div className="w-64 flex-shrink-0 space-y-2">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroupId(group.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm flex items-center justify-between transition-colors ${
                  activeGroupId === group.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300'
                }`}
              >
                <span>
                  <span className="mr-2">{group.icon}</span>
                  {group.name}
                </span>
                <span className="text-xs opacity-70">{group.items.length}件</span>
              </button>
            ))}
          </div>

          {/* グループ詳細 */}
          {activeGroup && (
            <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {activeGroup.icon} {activeGroup.name}
                </h2>
                <button
                  onClick={() => handleDeleteGroup(activeGroup.id)}
                  className="px-3 py-1 text-red-600 border border-red-300 rounded-lg text-sm hover:bg-red-50"
                >
                  削除
                </button>
              </div>

              {/* トレーニング追加 */}
              <div className="flex gap-2">
                <select
                  value={addTrainingId}
                  onChange={(e) => setAddTrainingId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">トレーニングを選択して追加...</option>
                  {unassignedTrainings.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.training_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddTraining}
                  disabled={!addTrainingId || isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  追加
                </button>
              </div>

              {/* トレーニング一覧 */}
              {activeGroup.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  トレーニングがありません
                </div>
              ) : (
                <div className="space-y-2">
                  {activeGroup.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <span className="font-medium text-gray-900 text-sm">{item.training.training_name}</span>
                        {item.training.category && (
                          <span className="ml-2 text-xs text-gray-500">[{item.training.category}]</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveTraining(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm px-2"
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
      )}
    </div>
  )
}
