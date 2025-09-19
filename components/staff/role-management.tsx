'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface Role {
  id: string
  name: string
  enabled: boolean
  sort_order: number
}

interface RoleManagementProps {
  roles: Role[]
  onRoleUpdate: (roleId: string, updates: Partial<Role>) => void
  onRoleDelete: (roleId: string) => void
  onRoleCreate: (role: Omit<Role, 'id'>) => void
  loading?: boolean
}

export function RoleManagement({ 
  roles, 
  onRoleUpdate, 
  onRoleDelete, 
  onRoleCreate, 
  loading = false 
}: RoleManagementProps) {
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    enabled: true,
    sort_order: 0
  })

  const handleToggle = (roleId: string, enabled: boolean) => {
    onRoleUpdate(roleId, { enabled })
  }

  const handleEdit = (role: Role) => {
    setEditingRole(role)
  }

  const handleSaveEdit = () => {
    if (editingRole) {
      onRoleUpdate(editingRole.id, editingRole)
      setEditingRole(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingRole(null)
  }

  const handleDelete = (roleId: string) => {
    if (confirm('この役職を削除しますか？')) {
      onRoleDelete(roleId)
    }
  }

  const handleAdd = () => {
    if (newRole.name.trim()) {
      onRoleCreate(newRole)
      setNewRole({ name: '', enabled: true, sort_order: 0 })
      setShowAddForm(false)
    }
  }

  const handleCancelAdd = () => {
    setNewRole({ name: '', enabled: true, sort_order: 0 })
    setShowAddForm(false)
  }

  return (
    <Card className="w-full bg-white rounded-lg border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          役職管理
        </CardTitle>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="h-8 w-8 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-blue-600 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-0">
            {roles.map((role, index) => (
              <div key={role.id}>
                <div className="flex items-center justify-between py-4 px-0">
                  {/* 役職名 */}
                  <div className="flex-1">
                    {editingRole?.id === role.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={editingRole.name}
                          onChange={(e) => setEditingRole(prev => 
                            prev ? { ...prev, name: e.target.value } : null
                          )}
                          className="h-8 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-8 w-8 p-0 bg-green-100 hover:bg-green-200 text-green-600"
                        >
                          <Save className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {role.name}
                      </span>
                    )}
                  </div>

                  {/* トグルスイッチとボタン */}
                  <div className="flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role.enabled}
                        onChange={(e) => handleToggle(role.id, e.target.checked)}
                        className="sr-only peer"
                        disabled={editingRole?.id === role.id}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>

                    {/* 編集ボタン */}
                    <button
                      onClick={() => handleEdit(role)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      disabled={editingRole?.id === role.id}
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* 削除ボタン */}
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      disabled={editingRole?.id === role.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {/* 区切り線（最後の項目以外） */}
                {index < roles.length - 1 && (
                  <hr className="border-gray-200" />
                )}
              </div>
            ))}

            {/* 新規追加フォーム */}
            {showAddForm && (
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="役職名を入力"
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAdd}
                    disabled={!newRole.name.trim()}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    追加
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAdd}
                    className="h-8 px-3"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {/* 役職が存在しない場合 */}
            {roles.length === 0 && !showAddForm && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">役職が登録されていません</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  最初の役職を追加
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
