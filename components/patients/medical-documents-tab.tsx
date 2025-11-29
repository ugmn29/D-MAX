'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileCheck,
  Plus,
  Calendar,
  User,
  FileText,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { getMedicalDocuments, deleteMedicalDocument, MedicalDocument, DocumentType } from '@/lib/api/medical-documents'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { DentalDiseaseManagementForm } from './documents/dental-disease-management-form'
import { OralFunctionDeclineForm } from './documents/oral-function-decline-form'
import { OralDevelopmentDisorderForm } from './documents/oral-development-disorder-form'
import { HygienistGuidanceForm } from './documents/hygienist-guidance-form'
import { MedicalInformationLetterForm } from './documents/medical-information-letter-form'
import { MedicalInformationLetterTypeSelector } from './documents/medical-information-letter-type-selector'
import { ReferralLetterType1Form } from './documents/referral-letter-type1-form'
import { ReferralLetterType2Form } from './documents/referral-letter-type2-form'
import { CollaborationInquiryForm } from './documents/collaboration-inquiry-form'
import { CollaborationResponseForm } from './documents/collaboration-response-form'
import { MedicalInformationLetterType } from '@/types/medical-information-letter'

interface MedicalDocumentsTabProps {
  patientId: string
  clinicId: string
}

export function MedicalDocumentsTab({ patientId, clinicId }: MedicalDocumentsTabProps) {
  const [documents, setDocuments] = useState<MedicalDocument[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<MedicalDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all')
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocument | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'select' | 'edit'>('list')
  const [editingDocumentType, setEditingDocumentType] = useState<DocumentType | null>(null)
  const [selectedLetterType, setSelectedLetterType] = useState<MedicalInformationLetterType | null>(null)
  const [showLetterTypeSelector, setShowLetterTypeSelector] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [patientId])

  useEffect(() => {
    // フィルタリング処理
    if (filterType === 'all') {
      setFilteredDocuments(documents)
    } else {
      setFilteredDocuments(documents.filter(doc => doc.document_type === filterType))
    }
  }, [documents, filterType])

  const loadDocuments = async () => {
    try {
      console.log('提供文書取得開始:', { patientId })
      setLoading(true)
      setError(null)
      const docs = await getMedicalDocuments(patientId)
      console.log('提供文書取得完了:', { count: docs.length, docs })
      setDocuments(docs)
    } catch (error) {
      console.error('提供文書の取得エラー:', error)
      setError('提供文書の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('この文書を削除してもよろしいですか?')) {
      return
    }

    try {
      await deleteMedicalDocument(documentId)
      await loadDocuments()
    } catch (error) {
      console.error('文書の削除エラー:', error)
      alert('文書の削除に失敗しました')
    }
  }

  const handleNewDocument = () => {
    setShowTypeSelector(true)
    setViewMode('select')
  }

  const handleSelectType = (type: DocumentType) => {
    console.log('文書タイプ選択:', type)

    // 診療情報提供書の場合はサブタイプ選択画面を表示
    if (type === '診療情報提供書') {
      setShowLetterTypeSelector(true)
      setShowTypeSelector(false)
      setEditingDocumentType(type)
      setSelectedDocument(null)
    } else {
      setEditingDocumentType(type)
      setSelectedDocument(null)
      setShowTypeSelector(false)
      setShowLetterTypeSelector(false)
      setViewMode('edit')
    }
  }

  const handleSelectLetterType = (letterType: MedicalInformationLetterType) => {
    console.log('診療情報提供書タイプ選択:', letterType)
    setSelectedLetterType(letterType)
    setShowLetterTypeSelector(false)
    setViewMode('edit')
  }

  const handleEditDocument = (document: MedicalDocument) => {
    setSelectedDocument(document)
    setEditingDocumentType(document.document_type)

    // 診療情報提供書の場合はサブタイプも設定
    if (document.document_type === '診療情報提供書' && document.document_subtype) {
      setSelectedLetterType(document.document_subtype as MedicalInformationLetterType)
    }

    setViewMode('edit')
  }

  const handleSaveDocument = async () => {
    await loadDocuments()
    setViewMode('list')
    setEditingDocumentType(null)
    setSelectedDocument(null)
    setSelectedLetterType(null)
    setShowLetterTypeSelector(false)
  }

  const handleCancelEdit = () => {
    setViewMode('list')
    setEditingDocumentType(null)
    setSelectedDocument(null)
    setSelectedLetterType(null)
    setShowLetterTypeSelector(false)
  }

  const formatDateTime = (dateTime: string) => {
    try {
      return format(new Date(dateTime), 'yyyy年MM月dd日', { locale: ja })
    } catch (error) {
      console.error('日時フォーマットエラー:', error, dateTime)
      return dateTime
    }
  }

  const getDocumentTypeColor = (type: DocumentType) => {
    switch (type) {
      case '歯科疾患管理料':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case '口腔機能低下症':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case '口腔機能発達不全症':
        return 'bg-green-100 text-green-800 border-green-300'
      case '歯科衛生士実地指導':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case '診療情報提供書':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <FileCheck className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-600 mb-2">エラーが発生しました</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={loadDocuments} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          再試行
        </Button>
      </div>
    )
  }

  // 文書編集画面
  if (viewMode === 'edit' && editingDocumentType) {
    switch (editingDocumentType) {
      case '歯科疾患管理料':
        return (
          <DentalDiseaseManagementForm
            patientId={patientId}
            clinicId={clinicId}
            document={selectedDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
          />
        )
      case '口腔機能低下症':
        return (
          <OralFunctionDeclineForm
            patientId={patientId}
            clinicId={clinicId}
            document={selectedDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
          />
        )
      case '口腔機能発達不全症':
        return (
          <OralDevelopmentDisorderForm
            patientId={patientId}
            clinicId={clinicId}
            document={selectedDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
          />
        )
      case '歯科衛生士実地指導':
        return (
          <HygienistGuidanceForm
            patientId={patientId}
            clinicId={clinicId}
            document={selectedDocument}
            onSave={handleSaveDocument}
            onCancel={handleCancelEdit}
          />
        )
      case '診療情報提供書':
        // サブタイプに応じて適切なフォームを表示
        if (selectedLetterType === '診療情報提供料(I)') {
          return (
            <ReferralLetterType1Form
              patientId={patientId}
              clinicId={clinicId}
              document={selectedDocument}
              onSave={handleSaveDocument}
              onCancel={handleCancelEdit}
            />
          )
        } else if (selectedLetterType === '診療情報提供料(II)') {
          return (
            <ReferralLetterType2Form
              patientId={patientId}
              clinicId={clinicId}
              document={selectedDocument}
              onSave={handleSaveDocument}
              onCancel={handleCancelEdit}
            />
          )
        } else if (selectedLetterType === '診療情報等連携共有料1') {
          return (
            <CollaborationInquiryForm
              patientId={patientId}
              clinicId={clinicId}
              document={selectedDocument}
              onSave={handleSaveDocument}
              onCancel={handleCancelEdit}
            />
          )
        } else if (selectedLetterType === '診療情報等連携共有料2') {
          return (
            <CollaborationResponseForm
              patientId={patientId}
              clinicId={clinicId}
              document={selectedDocument}
              onSave={handleSaveDocument}
              onCancel={handleCancelEdit}
            />
          )
        } else {
          // 旧形式の診療情報提供書フォーム（後方互換性のため）
          return (
            <MedicalInformationLetterForm
              patientId={patientId}
              clinicId={clinicId}
              document={selectedDocument}
              onSave={handleSaveDocument}
              onCancel={handleCancelEdit}
            />
          )
        }
      default:
        return (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-600 mb-2">文書タイプが不明です</h3>
            <Button onClick={handleCancelEdit} variant="outline" size="sm">
              戻る
            </Button>
          </div>
        )
    }
  }

  // 診療情報提供書のサブタイプ選択画面
  if (showLetterTypeSelector) {
    return (
      <MedicalInformationLetterTypeSelector
        onSelectType={handleSelectLetterType}
        onCancel={() => {
          setShowLetterTypeSelector(false)
          setShowTypeSelector(true)
        }}
      />
    )
  }

  // 文書タイプ選択画面
  if (showTypeSelector) {
    const documentTypes: { type: DocumentType; icon: any; description: string }[] = [
      {
        type: '歯科疾患管理料',
        icon: FileText,
        description: '患者への管理計画書・報告書'
      },
      {
        type: '口腔機能低下症',
        icon: FileText,
        description: '65歳以上の高齢者向け診断書'
      },
      {
        type: '口腔機能発達不全症',
        icon: FileText,
        description: '15歳未満の小児向け診断書'
      },
      {
        type: '歯科衛生士実地指導',
        icon: FileText,
        description: 'ブラッシング指導・口腔衛生指導'
      },
      {
        type: '診療情報提供書',
        icon: FileText,
        description: '他の医療機関への紹介状'
      }
    ]

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">文書タイプを選択</h3>
            <p className="text-sm text-gray-500 mt-1">作成する文書の種類を選択してください</p>
          </div>
          <Button onClick={() => setShowTypeSelector(false)} variant="outline" size="sm">
            戻る
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentTypes.map(({ type, icon: Icon, description }) => (
            <Card
              key={type}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleSelectType(type)}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getDocumentTypeColor(type)}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h4 className="font-semibold text-gray-900">{type}</h4>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // 文書一覧画面
  return (
    <div className="space-y-6">
      {/* ヘッダーとアクション */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">提供文書</h3>
          <p className="text-sm text-gray-500 mt-1">
            全{documents.length}件の文書
            {filterType !== 'all' && ` (フィルタ適用中: ${filteredDocuments.length}件)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewDocument} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            新規作成
          </Button>
          <Button onClick={loadDocuments} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            更新
          </Button>
        </div>
      </div>

      {/* フィルター */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">文書種類:</span>
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => setFilterType('all')}
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                すべて
              </Button>
              <Button
                onClick={() => setFilterType('歯科疾患管理料')}
                variant={filterType === '歯科疾患管理料' ? 'default' : 'outline'}
                size="sm"
                className={filterType === '歯科疾患管理料' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                歯管
              </Button>
              <Button
                onClick={() => setFilterType('口腔機能低下症')}
                variant={filterType === '口腔機能低下症' ? 'default' : 'outline'}
                size="sm"
                className={filterType === '口腔機能低下症' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                口腔低下
              </Button>
              <Button
                onClick={() => setFilterType('口腔機能発達不全症')}
                variant={filterType === '口腔機能発達不全症' ? 'default' : 'outline'}
                size="sm"
                className={filterType === '口腔機能発達不全症' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                口腔発達
              </Button>
              <Button
                onClick={() => setFilterType('歯科衛生士実地指導')}
                variant={filterType === '歯科衛生士実地指導' ? 'default' : 'outline'}
                size="sm"
                className={filterType === '歯科衛生士実地指導' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                衛生士指導
              </Button>
              <Button
                onClick={() => setFilterType('診療情報提供書')}
                variant={filterType === '診療情報提供書' ? 'default' : 'outline'}
                size="sm"
                className={filterType === '診療情報提供書' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                情報提供
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 文書一覧テーブル */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterType === 'all' ? '提供文書がありません' : '該当する文書がありません'}
          </h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all'
              ? '新規作成ボタンから文書を作成してください'
              : 'フィルター条件を変更してください'}
          </p>
          {filterType === 'all' && (
            <Button onClick={handleNewDocument} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規作成
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  文書種類
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイトル
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成者
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDocumentTypeColor(
                        doc.document_type
                      )}`}
                    >
                      {doc.document_type}
                    </span>
                    {doc.document_subtype && (
                      <span className="ml-2 text-xs text-gray-500">({doc.document_subtype})</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDateTime(doc.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.creator ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        {doc.creator.name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: 表示モード
                          console.log('表示:', doc.id)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditDocument(doc)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
