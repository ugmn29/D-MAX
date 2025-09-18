'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Plus, Trash2, Edit } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

interface Template {
  id: string
  name: string
  content: string
  category: string
  sort_order: number
}

interface Category {
  id: string
  name: string
  sort_order: number
}

export default function SubKarteSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    content: '',
    category: '',
    sort_order: 0
  })
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    sort_order: 0
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        
        setTemplates(settings.subkarte_templates || [])
        setCategories(settings.subkarte_categories || [])
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // テンプレート追加
  const handleAddTemplate = async () => {
    try {
      setSaving(true)
      const newTemplateData = {
        ...newTemplate,
        id: Date.now().toString()
      }
      
      const updatedTemplates = [...templates, newTemplateData]
      setTemplates(updatedTemplates)
      await setClinicSetting(DEMO_CLINIC_ID, 'subkarte_templates', updatedTemplates)
      
      setNewTemplate({
        name: '',
        content: '',
        category: '',
        sort_order: 0
      })
      setShowAddTemplate(false)
    } catch (error) {
      console.error('テンプレート追加エラー:', error)
      alert('テンプレートの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // カテゴリ追加
  const handleAddCategory = async () => {
    try {
      setSaving(true)
      const newCategoryData = {
        ...newCategory,
        id: Date.now().toString()
      }
      
      const updatedCategories = [...categories, newCategoryData]
      setCategories(updatedCategories)
      await setClinicSetting(DEMO_CLINIC_ID, 'subkarte_categories', updatedCategories)
      
      setNewCategory({
        name: '',
        sort_order: 0
      })
      setShowAddCategory(false)
    } catch (error) {
      console.error('カテゴリ追加エラー:', error)
      alert('カテゴリの追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // テンプレート削除
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return
    
    try {
      setSaving(true)
      const updatedTemplates = templates.filter(t => t.id !== templateId)
      setTemplates(updatedTemplates)
      await setClinicSetting(DEMO_CLINIC_ID, 'subkarte_templates', updatedTemplates)
    } catch (error) {
      console.error('テンプレート削除エラー:', error)
      alert('テンプレートの削除に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // カテゴリ削除
  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('このカテゴリを削除しますか？')) return
    
    try {
      setSaving(true)
      const updatedCategories = categories.filter(c => c.id !== categoryId)
      setCategories(updatedCategories)
      await setClinicSetting(DEMO_CLINIC_ID, 'subkarte_categories', updatedCategories)
    } catch (error) {
      console.error('カテゴリ削除エラー:', error)
      alert('カテゴリの削除に失敗しました')
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
              <h1 className="text-xl font-bold text-gray-900">サブカルテ</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">サブカルテ</div>
                <div className="text-sm text-blue-600">定型文登録とカテゴリ管理</div>
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
                <h2 className="text-2xl font-bold text-gray-900">サブカルテ設定</h2>
                <p className="text-gray-600">定型文登録とカテゴリを管理します</p>
              </div>
            </div>

            {/* タブ */}
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                定型文登録
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                カテゴリ管理
              </button>
            </div>

            {/* 定型文登録タブ */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">定型文一覧</h3>
                  <Button onClick={() => setShowAddTemplate(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    定型文追加
                  </Button>
                </div>

                <div className="space-y-4">
                  {templates.map(template => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              カテゴリ: {template.category} | 並び順: {template.sort_order}
                            </div>
                            <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                              {template.content}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingTemplate(template)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
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

                {/* 定型文追加フォーム */}
                {showAddTemplate && (
                  <Card>
                    <CardHeader>
                      <CardTitle>新しい定型文を追加</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="template_name">定型文名</Label>
                          <Input
                            id="template_name"
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="例: 初診時の挨拶"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template_category">カテゴリ</Label>
                          <select
                            id="template_category"
                            value={newTemplate.category}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="">カテゴリを選択</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.name}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="template_content">定型文内容</Label>
                        <textarea
                          id="template_content"
                          value={newTemplate.content}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="例: 本日はお忙しい中、ご来院いただきありがとうございます。"
                          className="w-full p-2 border border-gray-300 rounded-md h-24"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="template_sort">並び順</Label>
                        <Input
                          id="template_sort"
                          type="number"
                          value={newTemplate.sort_order}
                          onChange={(e) => setNewTemplate(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                          className="max-w-xs"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddTemplate(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddTemplate}
                          disabled={saving || !newTemplate.name || !newTemplate.content}
                        >
                          {saving ? '追加中...' : '追加'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* カテゴリ管理タブ */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">カテゴリ一覧</h3>
                  <Button onClick={() => setShowAddCategory(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    カテゴリ追加
                  </Button>
                </div>

                <div className="space-y-4">
                  {categories.map(category => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-sm text-gray-500">
                              並び順: {category.sort_order}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
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

                {/* カテゴリ追加フォーム */}
                {showAddCategory && (
                  <Card>
                    <CardHeader>
                      <CardTitle>新しいカテゴリを追加</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category_name">カテゴリ名</Label>
                          <Input
                            id="category_name"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="例: 初診時"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category_sort">並び順</Label>
                          <Input
                            id="category_sort"
                            type="number"
                            value={newCategory.sort_order}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, sort_order: parseInt(e.target.value) }))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowAddCategory(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleAddCategory}
                          disabled={saving || !newCategory.name}
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
