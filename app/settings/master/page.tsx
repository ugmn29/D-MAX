'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react'
import { getPatientNoteTypes, createPatientNoteType, updatePatientNoteType, deletePatientNoteType } from '@/lib/api/patient-note-types'
import { getStaffPositions, createStaffPosition, updateStaffPosition, deleteStaffPosition } from '@/lib/api/staff-positions'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface PatientNoteType {
  id: string
  name: string
  icon?: string
  color?: string
  sort_order: number
}

interface StaffPosition {
  id: string
  name: string
  sort_order: number
}

export default function MasterSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('patient_notes')
  const [patientNoteTypes, setPatientNoteTypes] = useState<PatientNoteType[]>([])
  const [staffPositions, setStaffPositions] = useState<StaffPosition[]>([])
  const [editingNoteType, setEditingNoteType] = useState<PatientNoteType | null>(null)
  const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null)
  const [showAddNoteType, setShowAddNoteType] = useState(false)
  const [showAddPosition, setShowAddPosition] = useState(false)
  
  const [newNoteType, setNewNoteType] = useState({
    name: '',
    icon: '',
    color: '#3B82F6',
    sort_order: 0
  })
  
  const [newPosition, setNewPosition] = useState({
    name: '',
    sort_order: 0
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [noteTypesData, positionsData] = await Promise.all([
          getPatientNoteTypes(DEMO_CLINIC_ID),
          getStaffPositions(DEMO_CLINIC_ID)
        ])
        
        setPatientNoteTypes(noteTypesData)
        setStaffPositions(positionsData)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 患者特記事項アイコン追加
  const handleAddNoteType = async () => {
    try {
      setSaving(true)
      await createPatientNoteType(DEMO_CLINIC_ID, newNoteType)
      
      // データを再読み込み
      const data = await getPatientNoteTypes(DEMO_CLINIC_ID)
      setPatientNoteTypes(data)
      
      setNewNoteType({
        name: '',
        icon: '',
        color: '#3B82F6',
        sort_order: 0
      })
      setShowAddNoteType(false)
    } catch (error) {
      console.error('患者特記事項アイコン追加エラー:', error)
      alert('患者特記事項アイコンの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

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
        sort_order: 0
      })
      setShowAddPosition(false)
    } catch (error) {
      console.error('役職追加エラー:', error)
      alert('役職の追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="flex h-screen">
        {/* 左サイドバー */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-bold text-gray-900">マスタ設定</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">マスタ設定</div>
                <div className="text-sm text-blue-600">特記事項アイコンや基本データの管理</div>
              </div>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {/* ヘッダー */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">マスタ設定</h2>
                <p className="text-gray-600">特記事項アイコンや基本データを管理します</p>
              </div>
            </div>

            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('patient_notes')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'patient_notes'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                患者特記事項アイコン
              </button>
              <button
                onClick={() => setActiveTab('staff_positions')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'staff_positions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                スタッフ役職設定
              </button>
            </div>

            {/* 患者特記事項アイコンタブ */}
            {activeTab === 'patient_notes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">患者特記事項アイコン</h3>
                  <Button onClick={() => setShowAddNoteType(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    アイコン追加
                  </Button>
                </div>

                {/* デフォルトアイコン */}
                <Card>
                  <CardHeader>
                    <CardTitle>デフォルトアイコン</CardTitle>
                    <p className="text-sm text-gray-600">システムに標準で含まれているアイコンです</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: '👶', name: 'お子さん', color: '#F59E0B' },
                        { icon: '📞', name: '連絡不要', color: '#6B7280' },
                        { icon: '💬', name: 'お話長め', color: '#8B5CF6' },
                        { icon: '🤰', name: '妊娠・授乳中', color: '#EC4899' },
                        { icon: '⚡', name: 'インプラント', color: '#F59E0B' },
                        { icon: '📄', name: '領収書不要', color: '#10B981' },
                        { icon: '♿', name: 'ハンディキャップ', color: '#3B82F6' },
                        { icon: '😟', name: '心配・恐怖心', color: '#EF4444' }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="text-2xl">{item.icon}</div>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">デフォルト</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* カスタムアイコン */}
                <Card>
                  <CardHeader>
                    <CardTitle>カスタムアイコン</CardTitle>
                    <p className="text-sm text-gray-600">医院独自のアイコンを管理します</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {patientNoteTypes.map(noteType => (
                        <div key={noteType.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg"
                              style={{ backgroundColor: noteType.color }}
                            >
                              {noteType.icon}
                            </div>
                            <div>
                              <div className="font-medium">{noteType.name}</div>
                              <div className="text-sm text-gray-500">
                                並び順: {noteType.sort_order}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingNoteType(noteType)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('このアイコンを削除しますか？')) {
                                  deletePatientNoteType(DEMO_CLINIC_ID, noteType.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* アイコン追加フォーム */}
                {showAddNoteType && (
                  <Card>
                    <CardHeader>
                      <CardTitle>新しいアイコンを追加</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="note_type_name">アイコン名</Label>
                          <Input
                            id="note_type_name"
                            value={newNoteType.name}
                            onChange={(e) => setNewNoteType(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="例: アレルギー"
                          />
                        </div>
                        <div>
                          <Label htmlFor="note_type_icon">アイコン（絵文字）</Label>
                          <Input
                            id="note_type_icon"
                            value={newNoteType.icon}
                            onChange={(e) => setNewNoteType(prev => ({ ...prev, icon: e.target.value }))}
                            placeholder="例: 🤧"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="note_type_color">色</Label>
                          <Input
                            id="note_type_color"
                            type="color"
                            value={newNoteType.color}
                            onChange={(e) => setNewNoteType(prev => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="note_type_sort">並び順</Label>
                          <Input
                            id="note_type_sort"
                            type="number"
                            value={newNoteType.sort_order}
                            onChange={(e) => setNewNoteType(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddNoteType(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddNoteType}
                          disabled={saving || !newNoteType.name}
                        >
                          {saving ? '追加中...' : '追加'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* スタッフ役職設定タブ */}
            {activeTab === 'staff_positions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">スタッフ役職設定</h3>
                  <Button onClick={() => setShowAddPosition(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    役職追加
                  </Button>
                </div>

                <div className="space-y-4">
                  {staffPositions.map(position => (
                    <Card key={position.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{position.name}</div>
                            <div className="text-sm text-gray-500">
                              並び順: {position.sort_order}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingPosition(position)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('この役職を削除しますか？')) {
                                  deleteStaffPosition(DEMO_CLINIC_ID, position.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 役職追加フォーム */}
                {showAddPosition && (
                  <Card>
                    <CardHeader>
                      <CardTitle>新しい役職を追加</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="position_name">役職名</Label>
                          <Input
                            id="position_name"
                            value={newPosition.name}
                            onChange={(e) => setNewPosition(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="例: 院長"
                          />
                        </div>
                        <div>
                          <Label htmlFor="position_sort">並び順</Label>
                          <Input
                            id="position_sort"
                            type="number"
                            value={newPosition.sort_order}
                            onChange={(e) => setNewPosition(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddPosition(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddPosition}
                          disabled={saving || !newPosition.name}
                        >
                          {saving ? '追加中...' : '追加'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
