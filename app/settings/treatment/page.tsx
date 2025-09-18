'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react'
import { getTreatmentMenus, createTreatmentMenu, updateTreatmentMenu, deleteTreatmentMenu } from '@/lib/api/treatment'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface TreatmentMenu {
  id: string
  name: string
  level: number
  parent_id?: string
  standard_duration?: number
  color?: string
  sort_order: number
  is_active: boolean
  children?: TreatmentMenu[]
}

export default function TreatmentSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [menus, setMenus] = useState<TreatmentMenu[]>([])
  const [editingMenu, setEditingMenu] = useState<TreatmentMenu | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMenu, setNewMenu] = useState({
    name: '',
    level: 1,
    parent_id: '',
    standard_duration: 30,
    color: '#3B82F6',
    sort_order: 0
  })

  // データ読み込み
  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true)
        const data = await getTreatmentMenus(DEMO_CLINIC_ID)
        setMenus(data)
      } catch (error) {
        console.error('メニュー読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadMenus()
  }, [])

  // メニューを階層構造に変換
  const buildMenuTree = (menus: TreatmentMenu[]): TreatmentMenu[] => {
    const menuMap = new Map<string, TreatmentMenu>()
    const rootMenus: TreatmentMenu[] = []

    // 全メニューをマップに格納
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] })
    })

    // 親子関係を構築
    menus.forEach(menu => {
      if (menu.parent_id && menuMap.has(menu.parent_id)) {
        const parent = menuMap.get(menu.parent_id)!
        parent.children!.push(menuMap.get(menu.id)!)
      } else {
        rootMenus.push(menuMap.get(menu.id)!)
      }
    })

    return rootMenus
  }

  // メニュー追加
  const handleAddMenu = async () => {
    try {
      setSaving(true)
      await createTreatmentMenu(DEMO_CLINIC_ID, newMenu)
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setMenus(data)
      
      setNewMenu({
        name: '',
        level: 1,
        parent_id: '',
        standard_duration: 30,
        color: '#3B82F6',
        sort_order: 0
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('メニュー追加エラー:', error)
      alert('メニューの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メニュー編集
  const handleEditMenu = async (menu: TreatmentMenu) => {
    try {
      setSaving(true)
      await updateTreatmentMenu(DEMO_CLINIC_ID, menu.id, {
        name: menu.name,
        standard_duration: menu.standard_duration,
        color: menu.color,
        sort_order: menu.sort_order,
        is_active: menu.is_active
      })
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setMenus(data)
      setEditingMenu(null)
    } catch (error) {
      console.error('メニュー編集エラー:', error)
      alert('メニューの編集に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メニュー削除
  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('このメニューを削除しますか？')) return
    
    try {
      setSaving(true)
      await deleteTreatmentMenu(DEMO_CLINIC_ID, menuId)
      
      // データを再読み込み
      const data = await getTreatmentMenus(DEMO_CLINIC_ID)
      setMenus(data)
    } catch (error) {
      console.error('メニュー削除エラー:', error)
      alert('メニューの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // メニューアイテムのレンダリング
  const renderMenuItem = (menu: TreatmentMenu, level: number = 0) => {
    const indent = level * 20
    
    return (
      <div key={menu.id} className="border rounded-lg p-4 mb-2" style={{ marginLeft: `${indent}px` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: menu.color }}
            />
            <div>
              <div className="font-medium">{menu.name}</div>
              <div className="text-sm text-gray-500">
                レベル{menu.level} | 標準時間: {menu.standard_duration}分 | 並び順: {menu.sort_order}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingMenu(menu)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteMenu(menu.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {menu.children && menu.children.map(child => renderMenuItem(child, level + 1))}
      </div>
    )
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
              <h1 className="text-xl font-bold text-gray-900">診療メニュー</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">診療メニュー</div>
                <div className="text-sm text-blue-600">診療メニューの3階層設定</div>
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
                <h2 className="text-2xl font-bold text-gray-900">診療メニュー設定</h2>
                <p className="text-gray-600">診療メニューの3階層構造を管理します</p>
              </div>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                メニュー追加
              </Button>
            </div>

            {/* メニュー一覧 */}
            <div className="space-y-4">
              {buildMenuTree(menus).map(menu => renderMenuItem(menu))}
            </div>

            {/* メニュー追加フォーム */}
            {showAddForm && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>新しいメニューを追加</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="menu_name">メニュー名</Label>
                      <Input
                        id="menu_name"
                        value={newMenu.name}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="例: 虫歯治療"
                      />
                    </div>
                    <div>
                      <Label htmlFor="menu_level">レベル</Label>
                      <select
                        id="menu_level"
                        value={newMenu.level}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value={1}>レベル1（大分類）</option>
                        <option value={2}>レベル2（中分類）</option>
                        <option value={3}>レベル3（詳細）</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="standard_duration">標準時間（分）</Label>
                      <Input
                        id="standard_duration"
                        type="number"
                        value={newMenu.standard_duration}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, standard_duration: parseInt(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="menu_color">色</Label>
                      <Input
                        id="menu_color"
                        type="color"
                        value={newMenu.color}
                        onChange={(e) => setNewMenu(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={handleAddMenu}
                      disabled={saving || !newMenu.name}
                    >
                      {saving ? '追加中...' : '追加'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 編集フォーム */}
            {editingMenu && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>メニューを編集</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_name">メニュー名</Label>
                      <Input
                        id="edit_name"
                        value={editingMenu.name}
                        onChange={(e) => setEditingMenu(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_duration">標準時間（分）</Label>
                      <Input
                        id="edit_duration"
                        type="number"
                        value={editingMenu.standard_duration || 30}
                        onChange={(e) => setEditingMenu(prev => prev ? { ...prev, standard_duration: parseInt(e.target.value) } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit_color">色</Label>
                      <Input
                        id="edit_color"
                        type="color"
                        value={editingMenu.color || '#3B82F6'}
                        onChange={(e) => setEditingMenu(prev => prev ? { ...prev, color: e.target.value } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_sort">並び順</Label>
                      <Input
                        id="edit_sort"
                        type="number"
                        value={editingMenu.sort_order}
                        onChange={(e) => setEditingMenu(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) } : null)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingMenu(null)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      onClick={() => editingMenu && handleEditMenu(editingMenu)}
                      disabled={saving}
                    >
                      {saving ? '保存中...' : '保存'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
