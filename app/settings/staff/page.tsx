'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react'
import { getStaff, createStaff, updateStaff, deleteStaff } from '@/lib/api/staff'
import { getStaffPositions, createStaffPosition, updateStaffPosition, deleteStaffPosition } from '@/lib/api/staff-positions'

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
}

export default function StaffSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('staff')
  const [staff, setStaff] = useState<Staff[]>([])
  const [positions, setPositions] = useState<StaffPosition[]>([])
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(null)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [showAddPosition, setShowAddPosition] = useState(false)
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    name_kana: '',
    email: '',
    phone: '',
    position_id: '',
    role: 'staff'
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
  const handleAddPosition = async () => {
    try {
      setSaving(true)
      await createStaffPosition(DEMO_CLINIC_ID, newPosition)
      
      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID)
      setPositions(data)
      
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
                onClick={() => setActiveTab('positions')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'positions'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                役職設定
              </button>
            </div>

            {/* スタッフ管理タブ */}
            {activeTab === 'staff' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">スタッフ一覧</h3>
                  <Button onClick={() => setShowAddStaff(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    スタッフ追加
                  </Button>
                </div>

                <div className="space-y-4">
                  {staff.map(member => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500">
                              {member.position?.name || '役職未設定'} | {member.role}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member.email} | {member.phone}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingStaff(member)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('このスタッフを削除しますか？')) {
                                  deleteStaff(DEMO_CLINIC_ID, member.id)
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

            {/* 役職設定タブ */}
            {activeTab === 'positions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">役職一覧</h3>
                  <Button onClick={() => setShowAddPosition(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    役職追加
                  </Button>
                </div>

                <div className="space-y-4">
                  {positions.map(position => (
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
