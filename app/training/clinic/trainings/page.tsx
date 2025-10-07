'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Pencil, Trash2, Plus } from 'lucide-react'

interface Training {
  id: string
  training_name: string
  description: string
  category: string
  default_action_seconds: number
  default_rest_seconds: number
  default_sets: number
  instructions: string[]
  precautions: string[]
}

export default function TrainingsPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('category', { ascending: true })

      if (error) {
        console.error('Supabaseエラー:', error)
        throw error
      }

      console.log('取得したトレーニング数:', data?.length || 0)
      
      // データが0件の場合、自動的にデフォルトデータを投入
      if (!data || data.length === 0) {
        console.log('トレーニングデータが0件のため、デフォルトデータを投入します')
        try {
          const response = await fetch('/api/training/clinic/seed', { method: 'POST' })
          const seedData = await response.json()
          
          if (response.ok) {
            console.log('デフォルトデータ投入成功:', seedData.message)
            // 再度データを取得
            const { data: newData, error: newError } = await supabase
              .from('trainings')
              .select('*')
              .order('category', { ascending: true })
            
            if (!newError && newData) {
              setTrainings(newData)
              return
            }
          }
        } catch (seedError) {
          console.error('デフォルトデータ投入エラー:', seedError)
          // エラーの場合はモックデータを表示
          setTrainings(getMockTrainings())
          return
        }
      }
      
      setTrainings(data || [])
    } catch (error) {
      console.error('トレーニング取得エラー:', error)
      // エラーの場合はモックデータを表示
      setTrainings(getMockTrainings())
    } finally {
      setIsLoading(false)
    }
  }

  // モックデータを返す関数
  const getMockTrainings = (): Training[] => {
    return [
      {
        id: '1',
        training_name: '口唇閉鎖練習',
        description: '唇を閉じる力を鍛えるトレーニング',
        category: '口腔機能',
        default_action_seconds: 30,
        default_rest_seconds: 10,
        default_sets: 3,
        instructions: ['唇を軽く閉じる', '5秒間保持', 'ゆっくりと開く'],
        precautions: ['無理をしない', '痛みがある場合は中止']
      },
      {
        id: '2',
        training_name: '舌の運動',
        description: '舌の可動域を広げるトレーニング',
        category: '口腔機能',
        default_action_seconds: 20,
        default_rest_seconds: 5,
        default_sets: 5,
        instructions: ['舌を前に出す', '左右に動かす', '上に上げる'],
        precautions: ['ゆっくりと行う', '疲れたら休む']
      },
      {
        id: '3',
        training_name: '咀嚼練習',
        description: '咀嚼機能を向上させるトレーニング',
        category: '口腔機能',
        default_action_seconds: 60,
        default_rest_seconds: 30,
        default_sets: 3,
        instructions: ['柔らかい食べ物を用意', 'ゆっくりと噛む', '左右均等に'],
        precautions: ['硬いものは避ける', '飲み込む前に十分噛む']
      }
    ]
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setShowEditModal(true)
  }

  const handleDelete = async (trainingId: string) => {
    if (!confirm('このトレーニングを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('trainings')
        .delete()
        .eq('id', trainingId)

      if (error) throw error

      alert('削除しました')
      loadTrainings()
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleSave = async () => {
    if (!editingTraining) return

    try {
      const { error } = await supabase
        .from('trainings')
        .update({
          training_name: editingTraining.training_name,
          description: editingTraining.description,
          category: editingTraining.category,
          default_action_seconds: editingTraining.default_action_seconds,
          default_rest_seconds: editingTraining.default_rest_seconds,
          default_sets: editingTraining.default_sets,
          instructions: editingTraining.instructions,
          precautions: editingTraining.precautions
        })
        .eq('id', editingTraining.id)

      if (error) throw error

      alert('保存しました')
      setShowEditModal(false)
      setEditingTraining(null)
      loadTrainings()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4">
          <button
            onClick={() => router.push('/training/clinic')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">トレーニング一覧 ({trainings.length}件)</h1>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {trainings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">トレーニングが登録されていません</p>
            <p className="text-sm text-gray-500">データベースを確認してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.map((training) => (
              <div key={training.id} className="bg-white rounded-xl p-6 shadow-sm relative">
                {/* 編集・削除ボタン */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(training)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(training.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4 pr-20">
                  <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                    {training.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {training.training_name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {training.description}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>{training.default_action_seconds}秒 × {training.default_sets}セット</p>
                  <p>休憩: {training.default_rest_seconds}秒</p>
                </div>

                {training.instructions && training.instructions.length > 0 && (
                  <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                    <div className="text-xs font-bold text-blue-900 mb-2">練習手順</div>
                    <ol className="space-y-1">
                      {training.instructions.map((instruction, idx) => (
                        <li key={idx} className="text-xs text-gray-800">
                          {idx + 1}. {instruction}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {training.precautions && training.precautions.length > 0 && (
                  <div className="mt-3 bg-orange-50 p-3 rounded-lg">
                    <div className="text-xs font-bold text-orange-900 mb-2">注意事項</div>
                    <ul className="space-y-1">
                      {training.precautions.map((precaution, idx) => (
                        <li key={idx} className="text-xs text-gray-800">
                          • {precaution}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingTraining && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">トレーニング編集</h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">トレーニング名</label>
                <input
                  type="text"
                  value={editingTraining.training_name}
                  onChange={(e) => setEditingTraining({ ...editingTraining, training_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={editingTraining.description}
                  onChange={(e) => setEditingTraining({ ...editingTraining, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">動作時間(秒)</label>
                  <input
                    type="number"
                    value={editingTraining.default_action_seconds}
                    onChange={(e) => setEditingTraining({ ...editingTraining, default_action_seconds: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">休憩時間(秒)</label>
                  <input
                    type="number"
                    value={editingTraining.default_rest_seconds}
                    onChange={(e) => setEditingTraining({ ...editingTraining, default_rest_seconds: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">セット数</label>
                <input
                  type="number"
                  value={editingTraining.default_sets}
                  onChange={(e) => setEditingTraining({ ...editingTraining, default_sets: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTraining(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
