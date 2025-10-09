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
  evaluation_level_1_label: string
  evaluation_level_1_criteria: string
  evaluation_level_2_label: string
  evaluation_level_2_criteria: string
  evaluation_level_3_label: string
  evaluation_level_3_criteria: string
}

// フローチャートのカテゴリー定義
const FLOW_CATEGORIES = {
  舌: ["『あ』の口の確認", "舌を前に出す", "舌を左右に振る", "口唇をなぞる", "舌小帯伸ばし", "スポットの位置確認", "吸い上げ", "吸い上げができない場合", "チューブ吸い", "舌筋の訓練"],
  口唇: ["口輪筋訓練", "口唇の緊張除去", "上唇小帯と下唇小帯を伸ばす"],
  体操: ["あいうべ体操", "タラ体操"]
}

export default function TrainingsPage() {
  const router = useRouter()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("舌")

  useEffect(() => {
    loadTrainings()
  }, [])

  const loadTrainings = async () => {
    try {
      console.log('トレーニングデータ取得開始')

      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .eq('is_deleted', false)
        .order('category', { ascending: true })

      if (error) {
        console.error('Supabaseエラー:', error)
        setTrainings(getMockTrainings())
        setIsLoading(false)
        return
      }

      if (!data || data.length === 0) {
        console.log('データが0件のため、モックデータを使用')
        setTrainings(getMockTrainings())
      } else {
        console.log('トレーニングデータ取得成功:', data.length, '件')
        setTrainings(data)
      }
    } catch (error) {
      console.error('トレーニング取得エラー:', error)
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

    const isNew = !editingTraining.id

    try {
      const trainingData = {
        training_name: editingTraining.training_name,
        description: editingTraining.description,
        category: editingTraining.category,
        default_action_seconds: editingTraining.default_action_seconds,
        default_rest_seconds: editingTraining.default_rest_seconds,
        default_sets: editingTraining.default_sets,
        instructions: editingTraining.instructions,
        precautions: editingTraining.precautions,
        evaluation_level_1_label: editingTraining.evaluation_level_1_label,
        evaluation_level_1_criteria: editingTraining.evaluation_level_1_criteria,
        evaluation_level_2_label: editingTraining.evaluation_level_2_label,
        evaluation_level_2_criteria: editingTraining.evaluation_level_2_criteria,
        evaluation_level_3_label: editingTraining.evaluation_level_3_label,
        evaluation_level_3_criteria: editingTraining.evaluation_level_3_criteria,
        clinic_id: null, // デフォルトトレーニングとして登録
        is_default: true,
        is_deleted: false
      }

      if (isNew) {
        // 新規作成
        const { error } = await supabase
          .from('trainings')
          .insert(trainingData)

        if (error) throw error
        alert('トレーニングを追加しました')
      } else {
        // 更新
        const { error } = await supabase
          .from('trainings')
          .update(trainingData)
          .eq('id', editingTraining.id)

        if (error) throw error
        alert('保存しました')
      }

      setShowEditModal(false)
      setEditingTraining(null)
      loadTrainings()
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    }
  }

  // トレーニングをカテゴリー別に分類
  const categorizeTrainings = () => {
    const categorized: { [key: string]: Training[] } = {
      舌: [],
      口唇: [],
      体操: [],
      その他: []
    }

    trainings.forEach((training) => {
      let assigned = false
      for (const [category, names] of Object.entries(FLOW_CATEGORIES)) {
        if (names.includes(training.training_name)) {
          categorized[category].push(training)
          assigned = true
          break
        }
      }
      if (!assigned) {
        categorized["その他"].push(training)
      }
    })

    return categorized
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const categorizedTrainings = categorizeTrainings()
  const currentTrainings = categorizedTrainings[activeTab] || []

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
            <button
              onClick={() => {
                setEditingTraining({
                  id: '',
                  training_name: '',
                  description: '',
                  category: '',
                  default_action_seconds: 10,
                  default_rest_seconds: 5,
                  default_sets: 3,
                  instructions: [],
                  precautions: [],
                  evaluation_level_1_label: 'できなかった',
                  evaluation_level_1_criteria: '',
                  evaluation_level_2_label: 'まあまあできた',
                  evaluation_level_2_criteria: '',
                  evaluation_level_3_label: 'できた',
                  evaluation_level_3_criteria: ''
                })
                setShowEditModal(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新規追加
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-8">
        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-2">
            {["舌", "口唇", "体操", "その他"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} ({categorizedTrainings[tab]?.length || 0})
              </button>
            ))}
          </div>
        </div>

        {trainings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600 mb-4">トレーニングが登録されていません</p>
            <p className="text-sm text-gray-500">データベースを確認してください</p>
          </div>
        ) : currentTrainings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600">このカテゴリーにはトレーニングがありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentTrainings.map((training) => (
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

                <h3 className="text-lg font-bold text-gray-900 mb-2 pr-20">
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

                {/* 評価基準 */}
                <div className="mt-3 bg-green-50 p-3 rounded-lg">
                  <div className="text-xs font-bold text-green-900 mb-2">評価基準</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex gap-2">
                      <span className="text-red-600 font-semibold">❌ レベル1:</span>
                      <span className="text-gray-800">{training.evaluation_level_1_label || 'できなかった'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-600 font-semibold">⚠️ レベル2:</span>
                      <span className="text-gray-800">{training.evaluation_level_2_label || 'まあまあできた'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-green-600 font-semibold">✅ レベル3:</span>
                      <span className="text-gray-800">{training.evaluation_level_3_label || 'できた'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {showEditModal && editingTraining && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTraining.id ? 'トレーニング編集' : 'トレーニング新規追加'}
            </h2>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">トレーニング名 *</label>
                <input
                  type="text"
                  value={editingTraining.training_name}
                  onChange={(e) => setEditingTraining({ ...editingTraining, training_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="例: 舌を前に出す"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={editingTraining.description}
                  onChange={(e) => setEditingTraining({ ...editingTraining, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="トレーニングの説明を入力してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                <input
                  type="text"
                  value={editingTraining.category}
                  onChange={(e) => setEditingTraining({ ...editingTraining, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="例: 舌訓練"
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

              {/* 練習手順 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">練習手順</label>
                <div className="space-y-2">
                  {(editingTraining.instructions || []).map((instruction, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={instruction}
                        onChange={(e) => {
                          const newInstructions = [...(editingTraining.instructions || [])]
                          newInstructions[idx] = e.target.value
                          setEditingTraining({ ...editingTraining, instructions: newInstructions })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={`手順 ${idx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newInstructions = (editingTraining.instructions || []).filter((_, i) => i !== idx)
                          setEditingTraining({ ...editingTraining, instructions: newInstructions })
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingTraining({
                        ...editingTraining,
                        instructions: [...(editingTraining.instructions || []), '']
                      })
                    }}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    + 手順を追加
                  </button>
                </div>
              </div>

              {/* 注意事項 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">注意事項</label>
                <div className="space-y-2">
                  {(editingTraining.precautions || []).map((precaution, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={precaution}
                        onChange={(e) => {
                          const newPrecautions = [...(editingTraining.precautions || [])]
                          newPrecautions[idx] = e.target.value
                          setEditingTraining({ ...editingTraining, precautions: newPrecautions })
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder={`注意事項 ${idx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newPrecautions = (editingTraining.precautions || []).filter((_, i) => i !== idx)
                          setEditingTraining({ ...editingTraining, precautions: newPrecautions })
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingTraining({
                        ...editingTraining,
                        precautions: [...(editingTraining.precautions || []), '']
                      })
                    }}
                    className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    + 注意事項を追加
                  </button>
                </div>
              </div>

              {/* 評価基準 */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">評価基準</h3>

                {/* レベル1 */}
                <div className="mb-4 p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-600 font-semibold">❌ レベル1</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ラベル</label>
                      <input
                        type="text"
                        value={editingTraining.evaluation_level_1_label || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_1_label: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="例: できなかった"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">基準</label>
                      <textarea
                        value={editingTraining.evaluation_level_1_criteria || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_1_criteria: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                        placeholder="例: 全くできなかった"
                      />
                    </div>
                  </div>
                </div>

                {/* レベル2 */}
                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600 font-semibold">⚠️ レベル2</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ラベル</label>
                      <input
                        type="text"
                        value={editingTraining.evaluation_level_2_label || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_2_label: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="例: まあまあできた"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">基準</label>
                      <textarea
                        value={editingTraining.evaluation_level_2_criteria || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_2_criteria: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                        placeholder="例: 少しできた"
                      />
                    </div>
                  </div>
                </div>

                {/* レベル3 */}
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600 font-semibold">✅ レベル3</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">ラベル</label>
                      <input
                        type="text"
                        value={editingTraining.evaluation_level_3_label || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_3_label: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="例: できた"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">基準</label>
                      <textarea
                        value={editingTraining.evaluation_level_3_criteria || ''}
                        onChange={(e) => setEditingTraining({ ...editingTraining, evaluation_level_3_criteria: e.target.value })}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        rows={2}
                        placeholder="例: 完璧にできた"
                      />
                    </div>
                  </div>
                </div>
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
