'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Patient } from '@/types/database'
import { getPatientById } from '@/lib/api/patients'

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface Training {
  id: string
  training_name: string
  description: string
  category: string
  default_action_seconds: number
  default_rest_seconds: number
  default_sets: number
}

interface SelectedTraining extends Training {
  action_seconds: number
  rest_seconds: number
  sets: number
  sort_order: number
}

export default function PrescribePage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.patientId as string

  const [patient, setPatient] = useState<Patient | null>(null)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [selectedTrainings, setSelectedTrainings] = useState<SelectedTraining[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [menuName, setMenuName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      // 患者情報を取得
      console.log('患者情報取得開始:', patientId)
      const patientData = await getPatientById(DEMO_CLINIC_ID, patientId)

      if (!patientData) {
        console.error('患者が見つかりません:', patientId)
        alert('患者が見つかりません')
        router.push('/training/clinic/patients')
        return
      }

      // 本登録済みの患者のみ許可
      if (!patientData.is_registered) {
        console.error('本登録されていない患者:', patientId)
        alert('本登録されていない患者にはトレーニングを処方できません')
        router.push('/training/clinic/patients')
        return
      }

      console.log('患者情報取得成功:', patientData)
      setPatient(patientData)

      // トレーニング一覧を取得
      const { data: trainingsData, error: trainingsError } = await supabase
        .from('trainings')
        .select('*')
        .eq('is_deleted', false)
        .order('category', { ascending: true })

      if (trainingsError) throw trainingsError
      setTrainings(trainingsData || [])

      // 既存のメニューを取得（もしあれば）
      const { data: existingMenu, error: menuError } = await supabase
        .from('training_menus')
        .select(`
          id,
          menu_name,
          menu_trainings (
            training_id,
            action_seconds,
            rest_seconds,
            sets,
            sort_order,
            trainings (
              id,
              training_name,
              description,
              category,
              default_action_seconds,
              default_rest_seconds,
              default_sets
            )
          )
        `)
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single()

      if (existingMenu && !menuError) {
        setMenuName(existingMenu.menu_name || `${patientData.name}さんのメニュー`)
        
        // 既存のトレーニングを設定
        const existing = existingMenu.menu_trainings.map((mt: any) => ({
          ...mt.trainings,
          action_seconds: mt.action_seconds,
          rest_seconds: mt.rest_seconds,
          sets: mt.sets,
          sort_order: mt.sort_order
        }))
        setSelectedTrainings(existing.sort((a: any, b: any) => a.sort_order - b.sort_order))
      } else {
        setMenuName(`${patientData.name}さんのメニュー`)
      }
    } catch (error) {
      console.error('データ取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTraining = (training: Training) => {
    // 既に追加されているかチェック
    if (selectedTrainings.some(t => t.id === training.id)) {
      alert('このトレーニングは既に追加されています')
      return
    }

    const newTraining: SelectedTraining = {
      ...training,
      action_seconds: training.default_action_seconds,
      rest_seconds: training.default_rest_seconds,
      sets: training.default_sets,
      sort_order: selectedTrainings.length + 1
    }

    setSelectedTrainings([...selectedTrainings, newTraining])
  }

  const removeTraining = (trainingId: string) => {
    const updated = selectedTrainings
      .filter(t => t.id !== trainingId)
      .map((t, index) => ({ ...t, sort_order: index + 1 }))
    setSelectedTrainings(updated)
  }

  const updateTraining = (trainingId: string, field: 'action_seconds' | 'rest_seconds' | 'sets', value: number) => {
    setSelectedTrainings(
      selectedTrainings.map(t =>
        t.id === trainingId ? { ...t, [field]: value } : t
      )
    )
  }

  const moveTraining = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === selectedTrainings.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...selectedTrainings]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp

    // sort_orderを更新
    updated.forEach((t, i) => {
      t.sort_order = i + 1
    })

    setSelectedTrainings(updated)
  }

  const saveMenu = async () => {
    if (!menuName.trim()) {
      alert('メニュー名を入力してください')
      return
    }

    if (selectedTrainings.length === 0) {
      alert('トレーニングを1つ以上選択してください')
      return
    }

    setIsSaving(true)

    try {
      // 既存のメニューを無効化
      await supabase
        .from('training_menus')
        .update({ is_active: false })
        .eq('patient_id', patientId)
        .eq('is_active', true)

      // 新しいメニューを作成
      const { data: menuData, error: menuError } = await supabase
        .from('training_menus')
        .insert({
          patient_id: patientId,
          clinic_id: '11111111-1111-1111-1111-111111111111', // DEMO_CLINIC_ID
          menu_name: menuName,
          is_active: true
        })
        .select()
        .single()

      if (menuError) throw menuError

      // トレーニングを追加
      const menuTrainings = selectedTrainings.map(t => ({
        menu_id: menuData.id,
        training_id: t.id,
        sort_order: t.sort_order,
        action_seconds: t.action_seconds,
        rest_seconds: t.rest_seconds,
        sets: t.sets,
        auto_progress: false
      }))

      const { error: trainingsError } = await supabase
        .from('menu_trainings')
        .insert(menuTrainings)

      if (trainingsError) throw trainingsError

      alert('トレーニングメニューを保存しました')
      router.push('/training/clinic/patients')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTrainings = trainings.filter(
    (training) =>
      training.training_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            onClick={() => router.push('/training/clinic/patients')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-900">トレーニング処方</h1>
          {patient && (
            <p className="text-sm text-gray-500 mt-1">
              {patient.last_name} {patient.first_name}さん（患者番号: {patient.patient_number}）
            </p>
          )}
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 利用可能なトレーニング */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">利用可能なトレーニング</h2>
            
            {/* 検索バー */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="トレーニング名またはカテゴリで検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* トレーニングリスト */}
            <div className="bg-white rounded-xl shadow-sm max-h-[600px] overflow-y-auto">
              {filteredTrainings.map((training) => (
                <div
                  key={training.id}
                  className="p-4 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{training.training_name}</h3>
                      {training.category && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {training.category}
                        </span>
                      )}
                      {training.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {training.description}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        デフォルト: {training.default_action_seconds}秒 × {training.default_sets}セット
                      </div>
                    </div>
                    <button
                      onClick={() => addTraining(training)}
                      className="ml-4 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      追加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 右側: 選択されたトレーニング */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">処方するトレーニング</h2>
            
            {/* メニュー名 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メニュー名
              </label>
              <input
                type="text"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="例: 基本トレーニングメニュー"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 選択されたトレーニングリスト */}
            <div className="bg-white rounded-xl shadow-sm mb-4 max-h-[500px] overflow-y-auto">
              {selectedTrainings.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  トレーニングを選択してください
                </div>
              ) : (
                selectedTrainings.map((training, index) => (
                  <div
                    key={training.id}
                    className="p-4 border-b last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">
                            #{training.sort_order}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {training.training_name}
                          </h3>
                        </div>
                        {training.category && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {training.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveTraining(index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveTraining(index, 'down')}
                          disabled={index === selectedTrainings.length - 1}
                          className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeTraining(training.id)}
                          className="px-2 py-1 text-red-600 hover:text-red-700"
                        >
                          削除
                        </button>
                      </div>
                    </div>

                    {/* 設定 */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          動作時間（秒）
                        </label>
                        <input
                          type="number"
                          value={training.action_seconds}
                          onChange={(e) =>
                            updateTraining(training.id, 'action_seconds', parseInt(e.target.value) || 0)
                          }
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          休憩時間（秒）
                        </label>
                        <input
                          type="number"
                          value={training.rest_seconds}
                          onChange={(e) =>
                            updateTraining(training.id, 'rest_seconds', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          セット数
                        </label>
                        <input
                          type="number"
                          value={training.sets}
                          onChange={(e) =>
                            updateTraining(training.id, 'sets', parseInt(e.target.value) || 1)
                          }
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 保存ボタン */}
            <button
              onClick={saveMenu}
              disabled={isSaving || selectedTrainings.length === 0}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : 'トレーニングメニューを保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
