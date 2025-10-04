'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Users,
  Grid3X3
} from 'lucide-react'
import { 
  getUnits, 
  createUnit, 
  updateUnit, 
  deleteUnit,
  getStaffUnitPriorities,
  createStaffUnitPriority,
  updateStaffUnitPriorities,
  deleteStaffUnitPriority,
  Unit,
  StaffUnitPriority,
  CreateUnitData,
  UpdateUnitData
} from '@/lib/api/units'
import { getStaff, Staff } from '@/lib/api/staff'

const DEMO_CLINIC_ID = 'demo-clinic-1'

export default function UnitsSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // ユニット関連の状態
  const [units, setUnits] = useState<Unit[]>([])
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitFormData, setUnitFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true
  })

  // スタッフ関連の状態
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<StaffUnitPriority[]>([])
  const [draggedPriority, setDraggedPriority] = useState<StaffUnitPriority | null>(null)

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [unitsData, staffData] = await Promise.all([
        getUnits(DEMO_CLINIC_ID),
        getStaff(DEMO_CLINIC_ID)
      ])
      setUnits(unitsData)
      setStaff(staffData)
      
      if (staffData.length > 0) {
        setSelectedStaff(staffData[0].id)
      }
    } catch (error) {
      console.error('データ読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 選択されたスタッフの優先順位を読み込み
  useEffect(() => {
    if (selectedStaff) {
      loadStaffUnitPriorities()
    }
  }, [selectedStaff])

  const loadStaffUnitPriorities = async () => {
    try {
      const priorities = await getStaffUnitPriorities(DEMO_CLINIC_ID, selectedStaff)
      setStaffUnitPriorities(priorities)
    } catch (error) {
      console.error('スタッフユニット優先順位読み込みエラー:', error)
    }
  }

  // ユニット管理
  const handleAddUnit = () => {
    setEditingUnit(null)
    setUnitFormData({
      name: '',
      sort_order: units.length + 1,
      is_active: true
    })
    setShowUnitModal(true)
  }

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setUnitFormData({
      name: unit.name,
      sort_order: unit.sort_order,
      is_active: unit.is_active
    })
    setShowUnitModal(true)
  }

  const handleSaveUnit = async () => {
    try {
      setSaving(true)
      
      if (editingUnit) {
        // 更新
        const updatedUnit = await updateUnit(DEMO_CLINIC_ID, editingUnit.id, unitFormData)
        setUnits(units.map(u => u.id === editingUnit.id ? updatedUnit : u))
      } else {
        // 新規作成
        const newUnit = await createUnit(DEMO_CLINIC_ID, unitFormData)
        setUnits([...units, newUnit])
      }
      
      setShowUnitModal(false)
    } catch (error) {
      console.error('ユニット保存エラー:', error)
      alert('ユニットの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUnit = async (unit: Unit) => {
    if (!confirm(`ユニット「${unit.name}」を削除しますか？`)) return
    
    try {
      setSaving(true)
      await deleteUnit(DEMO_CLINIC_ID, unit.id)
      setUnits(units.filter(u => u.id !== unit.id))
    } catch (error) {
      console.error('ユニット削除エラー:', error)
      if (error instanceof Error && error.message.includes('予約が存在する')) {
        alert('このユニットに関連する予約が存在するため削除できません')
      } else {
        alert('ユニットの削除に失敗しました')
      }
    } finally {
      setSaving(false)
    }
  }

  // スタッフユニット優先順位管理
  const handleAddPriority = async (unitId: string) => {
    try {
      const maxPriority = Math.max(0, ...staffUnitPriorities.map(p => p.priority_order))
      await createStaffUnitPriority(DEMO_CLINIC_ID, {
        staff_id: selectedStaff,
        unit_id: unitId,
        priority_order: maxPriority + 1,
        is_active: true
      })
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('優先順位追加エラー:', error)
      alert('優先順位の追加に失敗しました')
    }
  }

  const handleDeletePriority = async (priorityId: string) => {
    try {
      await deleteStaffUnitPriority(DEMO_CLINIC_ID, priorityId)
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('優先順位削除エラー:', error)
      alert('優先順位の削除に失敗しました')
    }
  }

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, priority: StaffUnitPriority) => {
    setDraggedPriority(priority)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetPriority: StaffUnitPriority) => {
    e.preventDefault()
    
    if (!draggedPriority || draggedPriority.id === targetPriority.id) {
      setDraggedPriority(null)
      return
    }

    try {
      // 優先順位を再計算
      const priorities = [...staffUnitPriorities]
      const draggedIndex = priorities.findIndex(p => p.id === draggedPriority.id)
      const targetIndex = priorities.findIndex(p => p.id === targetPriority.id)
      
      // 配列を並び替え
      const [draggedItem] = priorities.splice(draggedIndex, 1)
      priorities.splice(targetIndex, 0, draggedItem)
      
      // 新しい優先順位を設定
      const newPriorities = priorities.map((p, index) => ({
        unitId: p.unit_id,
        priorityOrder: index + 1
      }))
      
      await updateStaffUnitPriorities(DEMO_CLINIC_ID, selectedStaff, newPriorities)
      loadStaffUnitPriorities()
    } catch (error) {
      console.error('優先順位更新エラー:', error)
      alert('優先順位の更新に失敗しました')
    } finally {
      setDraggedPriority(null)
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
    <div className="h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ユニット設定</h1>
              <p className="text-sm text-gray-500">ユニットの管理とスタッフの優先順位設定</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* 左側: ユニット管理 */}
        <div className="w-1/2 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Grid3X3 className="w-5 h-5" />
                  <span>ユニット管理</span>
                </CardTitle>
                <Button onClick={handleAddUnit} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  新規追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {units.map((unit) => (
                  <div key={unit.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Grid3X3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{unit.name}</div>
                        <div className="text-sm text-gray-500">並び順: {unit.sort_order}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUnit(unit)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {units.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    ユニットが登録されていません
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側: スタッフ優先順位設定 */}
        <div className="w-1/2 p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>スタッフ優先順位設定</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* スタッフ選択 */}
                <div>
                  <Label htmlFor="staff-select">スタッフ選択</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="スタッフを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 優先順位一覧 */}
                <div>
                  <Label>ユニット優先順位</Label>
                  <div className="space-y-2 mt-2">
                    {staffUnitPriorities
                      .sort((a, b) => a.priority_order - b.priority_order)
                      .map((priority) => (
                        <div
                          key={priority.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, priority)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, priority)}
                          className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:bg-gray-50"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">{priority.unit?.name}</div>
                            <div className="text-sm text-gray-500">優先順位: {priority.priority_order}</div>
                          </div>
                          <button
                            onClick={() => handleDeletePriority(priority.id)}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                  
                  {/* 未設定ユニット */}
                  <div className="mt-4">
                    <Label>未設定ユニット</Label>
                    <div className="space-y-2 mt-2">
                      {units
                        .filter(unit => !staffUnitPriorities.some(p => p.unit_id === unit.id))
                        .map((unit) => (
                          <div key={unit.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="font-medium text-gray-700">{unit.name}</div>
                            <Button
                              size="sm"
                              onClick={() => handleAddPriority(unit.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              追加
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ユニット編集モーダル */}
      {showUnitModal && (
        <Modal isOpen={showUnitModal} onClose={() => setShowUnitModal(false)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingUnit ? 'ユニット編集' : 'ユニット新規作成'}
              </h3>
              <button
                onClick={() => setShowUnitModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="unit-name">ユニット名</Label>
                <Input
                  id="unit-name"
                  value={unitFormData.name}
                  onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                  placeholder="ユニット名を入力"
                />
              </div>
              
              <div>
                <Label htmlFor="sort-order">並び順</Label>
                <Input
                  id="sort-order"
                  type="number"
                  value={unitFormData.sort_order}
                  onChange={(e) => setUnitFormData({ ...unitFormData, sort_order: parseInt(e.target.value) || 0 })}
                  placeholder="並び順を入力"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowUnitModal(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSaveUnit} disabled={saving || !unitFormData.name.trim()}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
