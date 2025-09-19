'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit, Users } from 'lucide-react'
import { getStaff, createStaff, updateStaff, deleteStaff } from '@/lib/api/staff'
import { getStaffPositions, createStaffPosition, updateStaffPosition, deleteStaffPosition } from '@/lib/api/staff-positions'
import { RoleManagement } from '@/components/staff/role-management'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface Staff {
  id: string
  name: string
  name_kana?: string
  email?: string
  phone?: string
  position_id?: string
  role: string
  is_active: boolean
  position?: {
    id: string
    name: string
    sort_order: number
  }
}

interface StaffPosition {
  id: string
  name: string
  sort_order: number
  enabled?: boolean
}

export default function StaffSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('staff')
  const [staff, setStaff] = useState<Staff[]>([])
  const [positions, setPositions] = useState<StaffPosition[]>([])
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [showAddStaff, setShowAddStaff] = useState(false)
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    name_kana: '',
    email: '',
    phone: '',
    position_id: '',
    role: 'staff'
  })
  

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [staffData, positionsData] = await Promise.all([
          getStaff(DEMO_CLINIC_ID),
          getStaffPositions(DEMO_CLINIC_ID)
        ])
        setStaff(staffData)
        setPositions(positionsData)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // スタッフ追加
  const handleAddStaff = async () => {
    try {
      setSaving(true)
      await createStaff(DEMO_CLINIC_ID, newStaff)
      
      // データを再読み込み
      const data = await getStaff(DEMO_CLINIC_ID)
      setStaff(data)
      
      setNewStaff({
        name: '',
        name_kana: '',
        email: '',
        phone: '',
        position_id: '',
        role: 'staff'
      })
      setShowAddStaff(false)
    } catch (error) {
      console.error('スタッフ追加エラー:', error)
      alert('スタッフの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 役職追加
  const handleAddPosition = async (role: Omit<StaffPosition, 'id'>) => {
    try {
      setSaving(true)
      await createStaffPosition(DEMO_CLINIC_ID, role)
      
      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setPositions(data)
    } catch (error) {
      console.error('役職追加エラー:', error)
      alert('役職の追加に失敗しました')
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
      setPositions(data)
    } catch (error) {
      console.error('役職更新エラー:', error)
      alert('役職の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 役職削除
  const handleDeletePosition = async (positionId: string) => {
    try {
      setSaving(true)
      await deleteStaffPosition(DEMO_CLINIC_ID, positionId)
      
      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setPositions(data)
    } catch (error) {
      console.error('役職削除エラー:', error)
      alert('役職の削除に失敗しました')
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
              <h1 className="text-xl font-bold text-gray-900">スタッフ</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">スタッフ</div>
                <div className="text-sm text-blue-600">スタッフとユニット（診療台）の管理</div>
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
                <h2 className="text-2xl font-bold text-gray-900">スタッフ管理</h2>
                <p className="text-gray-600">スタッフとユニット（診療台）を管理します</p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" className="text-gray-600">
                  初期データ設定(無効)
                </Button>
              </div>
            </div>

            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                スタッフ管理
              </button>
              <button
                onClick={() => setActiveTab('units')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'units'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ユニット管理
              </button>
            </div>

            {/* スタッフ管理タブ */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-medium">スタッフ一覧</h3>
                  </div>
                  <Button onClick={() => setShowAddStaff(true)} className="rounded-full w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* 役職ごとのスタッフ表示 */}
                <div className="space-y-4">
                  {positions.filter(pos => pos.enabled).map(position => {
                    const positionStaff = staff.filter(s => s.position_id === position.id)
                    return (
                      <div key={position.id} className="bg-white rounded-lg border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">
                              {position.name} {positionStaff.length}名
                            </h4>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddStaff(true)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              追加
                            </Button>
                          </div>
                        </div>
                        
                        {positionStaff.length > 0 ? (
                          <div className="divide-y divide-gray-200">
                            {positionStaff.map(member => (
                              <div key={member.id} className="p-4 flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{member.name}</div>
                                  <div className="text-sm text-gray-500">{member.email}</div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    className={`${member.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                  >
                                    {member.is_active ? '在籍' : '退職'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingStaff(member)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm('このスタッフを削除しますか？')) {
                                        deleteStaff(DEMO_CLINIC_ID, member.id)
                                      }
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">この役職にスタッフが登録されていません</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* スタッフ追加フォーム */}
                {showAddStaff && (
                  <Card>
                    <CardHeader>
                      <CardTitle>新しいスタッフを追加</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="staff_name">名前</Label>
                          <Input
                            id="staff_name"
                            value={newStaff.name}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="例: 田中太郎"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff_name_kana">フリガナ</Label>
                          <Input
                            id="staff_name_kana"
                            value={newStaff.name_kana}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, name_kana: e.target.value }))}
                            placeholder="例: タナカタロウ"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="staff_position">役職</Label>
                        <Select
                          value={newStaff.position_id}
                          onValueChange={(value) => setNewStaff(prev => ({ ...prev, position_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="役職を選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {positions.filter(pos => pos.enabled).map(position => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="staff_email">メールアドレス</Label>
                          <Input
                            id="staff_email"
                            type="email"
                            value={newStaff.email}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="例: tanaka@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="staff_phone">電話番号</Label>
                          <Input
                            id="staff_phone"
                            value={newStaff.phone}
                            onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="例: 03-1234-5678"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddStaff(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddStaff}
                          disabled={saving || !newStaff.name}
                        >
                          {saving ? '追加中...' : '追加'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ユニット管理タブ */}
            {activeTab === 'units' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">ユニット管理</h2>
                  <p className="text-gray-600">診療台（ユニット）の設定を管理します</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">ユニット管理機能は今後実装予定です</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
