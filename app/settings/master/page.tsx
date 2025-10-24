'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Modal } from '@/components/ui/modal'
import { 
  Plus, 
  Trash2, 
  Edit, 
  User, 
  AlertCircle, 
  MessageSquare, 
  Heart, 
  Zap, 
  Receipt, 
  Accessibility, 
  Frown, 
  Star, 
  Car, 
  DollarSign, 
  FileText, 
  HelpCircle, 
  Calendar
} from 'lucide-react'
import { getStaffPositions, createStaffPosition, updateStaffPosition, deleteStaffPosition } from '@/lib/api/staff-positions'
import { getPatientNoteTypes, createPatientNoteType, updatePatientNoteType, deletePatientNoteType } from '@/lib/api/patient-note-types'
import { getCancelReasons, createCancelReason, updateCancelReason, deleteCancelReason } from '@/lib/api/cancel-reasons'
import { getMemoTemplates, createMemoTemplate, updateMemoTemplate, deleteMemoTemplate, MemoTemplate } from '@/lib/api/memo-templates'
import { PATIENT_ICONS } from '@/lib/constants/patient-icons'
import { initializeClinicStaffPositions, initializeClinicCancelReasons } from '@/lib/api/clinic-initialization'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface StaffPosition {
  id: string
  name: string
  sort_order: number
  enabled?: boolean
}

interface PatientNoteType {
  id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
}

interface CancelReason {
  id: string
  name: string
  description?: string
  sort_order: number
  is_active: boolean
}

export default function MasterSettingsPage() {
  const [selectedTab, setSelectedTab] = useState('icons')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 役職管理の状態
  const [staffPositions, setStaffPositions] = useState<StaffPosition[]>([])
  const [showAddPosition, setShowAddPosition] = useState(false)
  const [newPosition, setNewPosition] = useState({
    name: '',
    sort_order: 0,
    enabled: true
  })

  // 患者ノートタイプの状態
  const [patientNoteTypes, setPatientNoteTypes] = useState<PatientNoteType[]>([])
  const [showAddNoteType, setShowAddNoteType] = useState(false)
  const [newNoteType, setNewNoteType] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_active: true
  })

  // キャンセル理由の状態
  const [cancelReasons, setCancelReasons] = useState<CancelReason[]>([])
  const [showAddCancelReason, setShowAddCancelReason] = useState(false)
  const [newCancelReason, setNewCancelReason] = useState({
    name: '',
    description: '',
    sort_order: 0,
    is_active: true
  })

  // メモテンプレートの状態
  const [memoTemplates, setMemoTemplates] = useState<MemoTemplate[]>([])
  const [showAddMemoTemplate, setShowAddMemoTemplate] = useState(false)
  const [newMemoTemplate, setNewMemoTemplate] = useState({
    name: '',
    content: '',
    sort_order: 0,
    is_active: true
  })

  // アイコンマスターの状態
  const [iconMaster, setIconMaster] = useState(PATIENT_ICONS)
  const [editingIconId, setEditingIconId] = useState<string | null>(null)

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [positionsData, noteTypesData, cancelReasonsData, memoTemplatesData] = await Promise.all([
          getStaffPositions(DEMO_CLINIC_ID),
          getPatientNoteTypes(DEMO_CLINIC_ID),
          getCancelReasons(DEMO_CLINIC_ID),
          getMemoTemplates(DEMO_CLINIC_ID)
        ])

        // スタッフ役職が空の場合、デフォルトデータを初期化
        if (positionsData.length === 0) {
          console.log('スタッフ役職が空です。デフォルトデータを初期化します...')
          const initResult = await initializeClinicStaffPositions(DEMO_CLINIC_ID)
          if (initResult.success) {
            console.log(`✓ ${initResult.count}件のスタッフ役職を初期化しました`)
            const reloadedPositions = await getStaffPositions(DEMO_CLINIC_ID)
            setStaffPositions(reloadedPositions)
          } else {
            console.error('スタッフ役職の初期化に失敗:', initResult.errors)
            setStaffPositions(positionsData)
          }
        } else {
          setStaffPositions(positionsData)
        }

        // キャンセル理由が空の場合、デフォルトデータを初期化
        if (cancelReasonsData.length === 0) {
          console.log('キャンセル理由が空です。デフォルトデータを初期化します...')
          const initResult = await initializeClinicCancelReasons(DEMO_CLINIC_ID)
          if (initResult.success) {
            console.log(`✓ ${initResult.count}件のキャンセル理由を初期化しました`)
            const reloadedReasons = await getCancelReasons(DEMO_CLINIC_ID)
            setCancelReasons(reloadedReasons)
          } else {
            console.error('キャンセル理由の初期化に失敗:', initResult.errors)
            setCancelReasons(cancelReasonsData)
          }
        } else {
          setCancelReasons(cancelReasonsData)
        }

        setPatientNoteTypes(noteTypesData)
        setMemoTemplates(memoTemplatesData)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 役職追加
  const handleAddPosition = async () => {
    try {
      setSaving(true)
      await createStaffPosition(DEMO_CLINIC_ID, newPosition)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)

      setNewPosition({
        name: '',
        sort_order: 0,
        enabled: true
      })
      setShowAddPosition(false)
    } catch (error) {
      console.error('役職追加エラー:', error)
      const errorMessage = error instanceof Error ? error.message : '役職の追加に失敗しました'
      alert(`役職の追加に失敗しました: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  // 役職更新
  const handleUpdatePosition = async (positionId: string, updates: Partial<StaffPosition>) => {
    try {
      setSaving(true)
      await updateStaffPosition(DEMO_CLINIC_ID, positionId, updates)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)
    } catch (error) {
      console.error('役職更新エラー:', error)
      alert('役職の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 役職削除
  const handleDeletePosition = async (positionId: string) => {
    if (!confirm('この役職を削除しますか？')) return
    
    try {
      setSaving(true)
      await deleteStaffPosition(DEMO_CLINIC_ID, positionId)

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setStaffPositions(data)
    } catch (error) {
      console.error('役職削除エラー:', error)
      alert('役職の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 患者ノートタイプ追加
  const handleAddNoteType = async () => {
    try {
      setSaving(true)
      await createPatientNoteType(DEMO_CLINIC_ID, newNoteType)

      // データを再読み込み
      const data = await getPatientNoteTypes(DEMO_CLINIC_ID)
      setPatientNoteTypes(data)

      setNewNoteType({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true
      })
      setShowAddNoteType(false)
    } catch (error) {
      console.error('ノートタイプ追加エラー:', error)
      alert('ノートタイプの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // アイコンマスターの関数
  const handleIconTitleEdit = (iconId: string, newTitle: string) => {
    setIconMaster(prev => prev.map(icon => 
      icon.id === iconId ? { ...icon, title: newTitle } : icon
    ))
  }

  const handleIconToggle = (iconId: string) => {
    setIconMaster(prev => prev.map(icon => 
      icon.id === iconId ? { ...icon, enabled: !icon.enabled } : icon
    ))
  }

  // キャンセル理由追加
  const handleAddCancelReason = async () => {
    try {
      setSaving(true)
      await createCancelReason(DEMO_CLINIC_ID, newCancelReason)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)

      setNewCancelReason({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true
      })
      setShowAddCancelReason(false)
    } catch (error) {
      console.error('キャンセル理由追加エラー:', error)
      alert('キャンセル理由の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // キャンセル理由更新
  const handleUpdateCancelReason = async (reasonId: string, updates: Partial<CancelReason>) => {
    try {
      setSaving(true)
      await updateCancelReason(reasonId, updates)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)
    } catch (error) {
      console.error('キャンセル理由更新エラー:', error)
      alert('キャンセル理由の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // キャンセル理由削除
  const handleDeleteCancelReason = async (reasonId: string) => {
    if (!confirm('このキャンセル理由を削除しますか？')) return

    try {
      setSaving(true)
      await deleteCancelReason(reasonId)

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID)
      setCancelReasons(data)
    } catch (error) {
      console.error('キャンセル理由削除エラー:', error)
      alert('キャンセル理由の削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メモテンプレート追加
  const handleAddMemoTemplate = async () => {
    try {
      setSaving(true)
      await createMemoTemplate(DEMO_CLINIC_ID, newMemoTemplate)

      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID)
      setMemoTemplates(data)

      setNewMemoTemplate({
        name: '',
        content: '',
        sort_order: 0,
        is_active: true
      })
      setShowAddMemoTemplate(false)
    } catch (error) {
      console.error('メモテンプレート追加エラー:', error)
      alert('メモテンプレートの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メモテンプレート更新
  const handleUpdateMemoTemplate = async (templateId: string, updates: Partial<MemoTemplate>) => {
    try {
      setSaving(true)
      await updateMemoTemplate(DEMO_CLINIC_ID, templateId, updates)

      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID)
      setMemoTemplates(data)
    } catch (error) {
      console.error('メモテンプレート更新エラー:', error)
      alert('メモテンプレートの更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メモテンプレート削除
  const handleDeleteMemoTemplate = async (templateId: string) => {
    if (!confirm('このメモテンプレートを削除しますか？')) return

    try {
      setSaving(true)
      await deleteMemoTemplate(DEMO_CLINIC_ID, templateId)

      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID)
      setMemoTemplates(data)
    } catch (error) {
      console.error('メモテンプレート削除エラー:', error)
      alert('メモテンプレートの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* サブタブ */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedTab('icons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'icons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            アイコン
          </button>
          <button
            onClick={() => setSelectedTab('staff')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'staff'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            スタッフ
          </button>
          <button
            onClick={() => setSelectedTab('files')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ファイル
          </button>
          <button
            onClick={() => setSelectedTab('cancel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'cancel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            キャンセル
          </button>
          <button
            onClick={() => setSelectedTab('memo')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'memo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            メモ
          </button>
        </nav>
      </div>

      {/* アイコンタブのコンテンツ */}
      {selectedTab === 'icons' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">アイコン</h3>
              <p className="text-sm text-gray-500">患者の特記事項を管理します</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {iconMaster.map((icon) => {
              const IconComponent = icon.icon
              return (
                <div key={icon.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {editingIconId === icon.id ? (
                        <Input
                          value={icon.title}
                          onChange={(e) => handleIconTitleEdit(icon.id, e.target.value)}
                          onBlur={() => setEditingIconId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setEditingIconId(null)
                            }
                          }}
                          className="text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => setEditingIconId(icon.id)}
                        >
                          {icon.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={icon.enabled}
                        onChange={() => handleIconToggle(icon.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setEditingIconId(icon.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* スタッフタブのコンテンツ */}
      {selectedTab === 'staff' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">スタッフ</h2>
            <p className="text-gray-600">スタッフの設定を管理します</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>役職管理</CardTitle>
                <Button onClick={() => {
                  setNewPosition({
                    name: '',
                    sort_order: staffPositions.length,
                    enabled: true
                  })
                  setShowAddPosition(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  役職追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPositions.map(position => (
                  <div key={position.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{position.name}</div>
                      <div className="text-sm text-gray-500">
                        並び順: {position.sort_order} | ステータス: {position.enabled !== false ? '有効' : '無効'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={position.enabled !== false}
                        onChange={(e) => handleUpdatePosition(position.id, { enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newName = prompt('新しい役職名を入力してください:', position.name)
                          if (newName && newName.trim()) {
                            handleUpdatePosition(position.id, { name: newName.trim() })
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {staffPositions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">役職が登録されていません</p>
                    <Button 
                      onClick={() => setShowAddPosition(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初の役職を追加
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 役職追加モーダル */}
          {showAddPosition && (
            <Modal
              isOpen={showAddPosition}
              onClose={() => setShowAddPosition(false)}
              title="新しい役職を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="position_name">役職名</Label>
                  <Input
                    id="position_name"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 歯科医師"
                  />
                </div>
                
                <div>
                  <Label htmlFor="position_sort_order">並び順</Label>
                  <Input
                    id="position_sort_order"
                    type="number"
                    value={newPosition.sort_order}
                    onChange={(e) => setNewPosition(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position_enabled"
                    checked={newPosition.enabled}
                    onCheckedChange={(checked) => setNewPosition(prev => ({ ...prev, enabled: checked as boolean }))}
                  />
                  <Label htmlFor="position_enabled">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPosition(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddPosition}
                    disabled={saving || !newPosition.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ファイルタブのコンテンツ */}
      {selectedTab === 'files' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">患者ノートタイプ</h3>
              <p className="text-sm text-gray-500">患者ノートの分類を管理します</p>
            </div>
            <Button onClick={() => setShowAddNoteType(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {patientNoteTypes.map(noteType => (
              <div key={noteType.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{noteType.name}</div>
                  {noteType.description && (
                    <div className="text-sm text-gray-500">{noteType.description}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    並び順: {noteType.sort_order} | ステータス: {noteType.is_active ? '有効' : '無効'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={noteType.is_active}
                    onChange={(e) => {
                      updatePatientNoteType(DEMO_CLINIC_ID, noteType.id, { is_active: e.target.checked })
                        .then(() => {
                          const data = getPatientNoteTypes(DEMO_CLINIC_ID)
                          data.then(d => setPatientNoteTypes(d))
                        })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('このノートタイプを削除しますか？')) {
                        deletePatientNoteType(DEMO_CLINIC_ID, noteType.id)
                          .then(() => {
                            const data = getPatientNoteTypes(DEMO_CLINIC_ID)
                            data.then(d => setPatientNoteTypes(d))
                          })
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {patientNoteTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">ノートタイプが登録されていません</p>
              </div>
            )}
          </div>

          {/* ノートタイプ追加モーダル */}
          {showAddNoteType && (
            <Modal
              isOpen={showAddNoteType}
              onClose={() => setShowAddNoteType(false)}
              title="新しいノートタイプを追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note_type_name">ノートタイプ名</Label>
                  <Input
                    id="note_type_name"
                    value={newNoteType.name}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 診療メモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_description">説明</Label>
                  <Input
                    id="note_type_description"
                    value={newNoteType.description}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="例: 診療内容のメモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_sort_order">並び順</Label>
                  <Input
                    id="note_type_sort_order"
                    type="number"
                    value={newNoteType.sort_order}
                    onChange={(e) => setNewNoteType(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="note_type_active"
                    checked={newNoteType.is_active}
                    onCheckedChange={(checked) => setNewNoteType(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="note_type_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddNoteType(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddNoteType}
                    disabled={saving || !newNoteType.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* キャンセルタブのコンテンツ */}
      {selectedTab === 'cancel' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">キャンセル理由</h3>
              <p className="text-sm text-gray-500">予約キャンセル時の理由を管理します</p>
            </div>
            <Button onClick={() => setShowAddCancelReason(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {cancelReasons.map(reason => (
              <div key={reason.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{reason.name}</div>
                  {reason.description && (
                    <div className="text-sm text-gray-500">{reason.description}</div>
                  )}
                  <div className="text-sm text-gray-500">
                    並び順: {reason.sort_order} | ステータス: {reason.is_active ? '有効' : '無効'}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reason.is_active}
                    onChange={(e) => {
                      handleUpdateCancelReason(reason.id, { is_active: e.target.checked })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newName = prompt('新しいキャンセル理由名を入力してください:', reason.name)
                      if (newName && newName.trim()) {
                        handleUpdateCancelReason(reason.id, { name: newName.trim() })
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCancelReason(reason.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {cancelReasons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">キャンセル理由が登録されていません</p>
                <Button 
                  onClick={() => setShowAddCancelReason(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初のキャンセル理由を追加
                </Button>
              </div>
            )}
          </div>

          {/* キャンセル理由追加モーダル */}
          {showAddCancelReason && (
            <Modal
              isOpen={showAddCancelReason}
              onClose={() => setShowAddCancelReason(false)}
              title="新しいキャンセル理由を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancel_reason_name">キャンセル理由名</Label>
                  <Input
                    id="cancel_reason_name"
                    value={newCancelReason.name}
                    onChange={(e) => setNewCancelReason(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 無断キャンセル"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cancel_reason_description">説明</Label>
                  <Input
                    id="cancel_reason_description"
                    value={newCancelReason.description}
                    onChange={(e) => setNewCancelReason(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="例: 連絡なしでのキャンセル"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cancel_reason_sort_order">並び順</Label>
                  <Input
                    id="cancel_reason_sort_order"
                    type="number"
                    value={newCancelReason.sort_order}
                    onChange={(e) => setNewCancelReason(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cancel_reason_active"
                    checked={newCancelReason.is_active}
                    onCheckedChange={(checked) => setNewCancelReason(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="cancel_reason_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCancelReason(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddCancelReason}
                    disabled={saving || !newCancelReason.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* メモタブのコンテンツ */}
      {selectedTab === 'memo' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">メモテンプレート</h3>
              <p className="text-sm text-gray-500">予約メモで使用するテンプレートを管理します</p>
            </div>
            <Button onClick={() => setShowAddMemoTemplate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {memoTemplates.map(template => (
              <div key={template.id} className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-200">
                    {template.content}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    並び順: {template.sort_order} | ステータス: {template.is_active ? '有効' : '無効'}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => {
                      handleUpdateMemoTemplate(template.id, { is_active: e.target.checked })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newName = prompt('新しいテンプレート名を入力してください:', template.name)
                      if (newName && newName.trim()) {
                        const newContent = prompt('新しいテンプレート内容を入力してください:', template.content)
                        if (newContent !== null) {
                          handleUpdateMemoTemplate(template.id, {
                            name: newName.trim(),
                            content: newContent
                          })
                        }
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemoTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {memoTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">メモテンプレートが登録されていません</p>
                <Button
                  onClick={() => setShowAddMemoTemplate(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初のメモテンプレートを追加
                </Button>
              </div>
            )}
          </div>

          {/* メモテンプレート追加モーダル */}
          {showAddMemoTemplate && (
            <Modal
              isOpen={showAddMemoTemplate}
              onClose={() => setShowAddMemoTemplate(false)}
              title="新しいメモテンプレートを追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="memo_template_name">テンプレート名</Label>
                  <Input
                    id="memo_template_name"
                    value={newMemoTemplate.name}
                    onChange={(e) => setNewMemoTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 初診時"
                  />
                </div>

                <div>
                  <Label htmlFor="memo_template_content">テンプレート内容</Label>
                  <Textarea
                    id="memo_template_content"
                    value={newMemoTemplate.content}
                    onChange={(e) => setNewMemoTemplate(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="例: 初診&#10;主訴：&#10;既往歴："
                    className="min-h-[150px]"
                  />
                </div>

                <div>
                  <Label htmlFor="memo_template_sort_order">並び順</Label>
                  <Input
                    id="memo_template_sort_order"
                    type="number"
                    value={newMemoTemplate.sort_order}
                    onChange={(e) => setNewMemoTemplate(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memo_template_active"
                    checked={newMemoTemplate.is_active}
                    onCheckedChange={(checked) => setNewMemoTemplate(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="memo_template_active">有効</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddMemoTemplate(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddMemoTemplate}
                    disabled={saving || !newMemoTemplate.name.trim() || !newMemoTemplate.content.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  )
}
