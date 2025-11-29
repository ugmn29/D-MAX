'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  FileText,
  AlertCircle,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MedicalInformationLetterType, MEDICAL_INFORMATION_LETTER_TYPES } from '@/types/medical-information-letter'

interface DocumentTemplate {
  id: string
  document_type: MedicalInformationLetterType
  template_key: string
  template_name: string
  template_data: any
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

interface SortableTemplateItemProps {
  template: DocumentTemplate
  onEdit: (template: DocumentTemplate) => void
  onDelete: (id: string) => void
}

function SortableTemplateItem({ template, onEdit, onDelete }: SortableTemplateItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeInfo = MEDICAL_INFORMATION_LETTER_TYPES.find(
    (t) => t.type === template.document_type
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo?.icon}</span>
            <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {typeInfo?.label} ({typeInfo?.code})
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(template)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4 mr-1" />
          編集
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(template.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          削除
        </Button>
      </div>
    </div>
  )
}

export function DocumentTemplatesManager() {
  const [selectedDocumentType, setSelectedDocumentType] =
    useState<MedicalInformationLetterType>('診療情報提供料(I)')
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null)
  const [formData, setFormData] = useState({
    template_name: '',
    template_key: '',
    template_data: {} as any,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadTemplates()
  }, [selectedDocumentType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/document-templates?documentType=${encodeURIComponent(selectedDocumentType)}`
      )
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = templates.findIndex((t) => t.id === active.id)
    const newIndex = templates.findIndex((t) => t.id === over.id)

    const newTemplates = arrayMove(templates, oldIndex, newIndex)
    setTemplates(newTemplates)

    // サーバーに並び順を保存
    const reorderedTemplates = newTemplates.map((template, index) => ({
      id: template.id,
      display_order: index,
    }))

    try {
      await fetch('/api/document-templates/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: reorderedTemplates }),
      })
    } catch (error) {
      console.error('Error reordering templates:', error)
      // エラー時は元に戻す
      loadTemplates()
    }
  }

  const handleAdd = () => {
    setFormData({
      template_name: '',
      template_key: '',
      template_data: getEmptyTemplateData(selectedDocumentType),
    })
    setShowAddModal(true)
  }

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template)
    setFormData({
      template_name: template.template_name,
      template_key: template.template_key,
      template_data: template.template_data,
    })
    setShowEditModal(true)
  }

  const handleSaveNew = async () => {
    try {
      const response = await fetch('/api/document-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_type: selectedDocumentType,
          template_key: formData.template_key,
          template_name: formData.template_name,
          template_data: formData.template_data,
          display_order: templates.length,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        loadTemplates()
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingTemplate) return

    try {
      const response = await fetch(`/api/document-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: formData.template_name,
          template_data: formData.template_data,
          display_order: editingTemplate.display_order,
        }),
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingTemplate(null)
        loadTemplates()
      }
    } catch (error) {
      console.error('Error updating template:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除してもよろしいですか？')) {
      return
    }

    try {
      const response = await fetch(`/api/document-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const getEmptyTemplateData = (documentType: MedicalInformationLetterType) => {
    switch (documentType) {
      case '診療情報提供料(I)':
        return {
          referToDepartment: '',
          diagnosis: '',
          chiefComplaint: '',
          referralReason: '',
          presentIllness: '',
          clinicalSummary: '',
          treatmentHistory: '',
          requestedExam: '',
        }
      case '診療情報提供料(II)':
        return {
          patientRequest: '',
          consultationPurpose: '',
          diagnosis: '',
          diseaseStage: '',
          presentIllness: '',
          currentTreatmentPlan: '',
          treatmentOptions: '',
          treatmentHistory: '',
          medications: '',
          examResults: '',
          imageInformation: '',
        }
      case '診療情報等連携共有料1':
        return {
          inquiryPurpose: '',
          systemicManagementReason: '',
          diagnosis: '',
          treatmentPolicy: '',
          requestedInformationDetail: '',
        }
      case '診療情報等連携共有料2':
        return {
          chiefComplaint: '',
          dentalDiagnosis: '',
          dentalFindings: '',
          dentalTreatmentStatus: '',
          treatmentHistory: '',
          medications: '',
          examResults: '',
          precautions: '',
        }
      default:
        return {}
    }
  }

  const renderTemplateFields = () => {
    const data = formData.template_data

    switch (selectedDocumentType) {
      case '診療情報提供料(I)':
        return (
          <>
            <div className="space-y-2">
              <Label>紹介先診療科</Label>
              <Input
                value={data.referToDepartment || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, referToDepartment: e.target.value },
                  })
                }
                placeholder="例: 口腔外科"
              />
            </div>
            <div className="space-y-2">
              <Label>傷病名</Label>
              <Textarea
                value={data.diagnosis || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, diagnosis: e.target.value },
                  })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>主訴</Label>
              <Textarea
                value={data.chiefComplaint || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, chiefComplaint: e.target.value },
                  })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>紹介目的・紹介理由</Label>
              <Textarea
                value={data.referralReason || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, referralReason: e.target.value },
                  })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>現病歴</Label>
              <Textarea
                value={data.presentIllness || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, presentIllness: e.target.value },
                  })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>症状経過</Label>
              <Textarea
                value={data.clinicalSummary || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, clinicalSummary: e.target.value },
                  })
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>治療経過</Label>
              <Textarea
                value={data.treatmentHistory || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, treatmentHistory: e.target.value },
                  })
                }
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>依頼事項</Label>
              <Textarea
                value={data.requestedExam || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    template_data: { ...data, requestedExam: e.target.value },
                  })
                }
                rows={3}
              />
            </div>
          </>
        )

      // 他のドキュメントタイプも同様に追加可能
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>このドキュメントタイプのフィールドは準備中です</p>
          </div>
        )
    }
  }

  const selectedTypeInfo = MEDICAL_INFORMATION_LETTER_TYPES.find(
    (t) => t.type === selectedDocumentType
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
      </div>

      {/* 文書タイプ選択 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">文書種別を選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {MEDICAL_INFORMATION_LETTER_TYPES.map((type) => (
              <button
                key={type.type}
                onClick={() => setSelectedDocumentType(type.type)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedDocumentType === type.type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{type.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {type.code} - {type.points}点 ({type.frequency})
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* テンプレート一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">{selectedTypeInfo?.icon}</span>
                {selectedTypeInfo?.label}のテンプレート
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                ドラッグ&ドロップで並び順を変更できます
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">テンプレートが登録されていません</p>
              <p className="text-xs mt-1">「新規追加」ボタンから追加してください</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={templates.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {templates.map((template) => (
                    <SortableTemplateItem
                      key={template.id}
                      template={template}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* 新規追加モーダル */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={`新しいテンプレートを追加 - ${selectedTypeInfo?.label}`}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>テンプレート名 *</Label>
              <Input
                value={formData.template_name}
                onChange={(e) =>
                  setFormData({ ...formData, template_name: e.target.value })
                }
                placeholder="例: 親知らず抜歯依頼"
              />
            </div>
            <div className="space-y-2">
              <Label>テンプレートキー（英数字） *</Label>
              <Input
                value={formData.template_key}
                onChange={(e) =>
                  setFormData({ ...formData, template_key: e.target.value })
                }
                placeholder="例: impacted_wisdom_tooth"
              />
              <p className="text-xs text-gray-500">
                システム内部で使用される一意の識別子（半角英数字とアンダースコアのみ）
              </p>
            </div>

            <hr className="my-4" />
            <h4 className="font-semibold text-sm">テンプレート内容</h4>
            {renderTemplateFields()}

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                キャンセル
              </Button>
              <Button
                onClick={handleSaveNew}
                disabled={!formData.template_name || !formData.template_key}
              >
                保存
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 編集モーダル */}
      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingTemplate(null)
          }}
          title={`テンプレートを編集 - ${formData.template_name}`}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>テンプレート名 *</Label>
              <Input
                value={formData.template_name}
                onChange={(e) =>
                  setFormData({ ...formData, template_name: e.target.value })
                }
              />
            </div>

            <hr className="my-4" />
            <h4 className="font-semibold text-sm">テンプレート内容</h4>
            {renderTemplateFields()}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTemplate(null)
                }}
              >
                キャンセル
              </Button>
              <Button onClick={handleSaveEdit} disabled={!formData.template_name}>
                保存
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
