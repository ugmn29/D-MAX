'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye, FileText, ExternalLink, Copy } from 'lucide-react'
import { getQuestionnaires, deleteQuestionnaire, type Questionnaire } from '@/lib/api/questionnaires'
import { QuestionnaireEditModal } from './questionnaire-edit-modal'

interface QuestionnaireListProps {
  clinicId: string
  onEdit?: (questionnaire: Questionnaire) => void
  onView?: (questionnaire: Questionnaire) => void
  onCreate?: () => void
}

export function QuestionnaireList({ clinicId, onEdit, onView, onCreate }: QuestionnaireListProps) {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null)

  // 患者用URLの生成（問診票専用）
  const getPatientUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/questionnaire`
  }

  // URLをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('URLをクリップボードにコピーしました')
    } catch (error) {
      console.error('コピーに失敗しました:', error)
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('URLをクリップボードにコピーしました')
    }
  }

  // デバッグ用ログ
  console.log('QuestionnaireList props:', { onEdit, onView, onCreate })

  // データ読み込み
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        setLoading(true)
        const data = await getQuestionnaires(clinicId)
        setQuestionnaires(data)
      } catch (error) {
        console.error('問診票読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestionnaires()
  }, [clinicId])

  // 削除処理
  const handleDelete = async (questionnaireId: string) => {
    if (!confirm('この問診票を削除しますか？この操作は元に戻せません。')) {
      return
    }

    try {
      setDeleting(questionnaireId)
      await deleteQuestionnaire(questionnaireId)
      
      // リストから削除
      setQuestionnaires(prev => prev.filter(q => q.id !== questionnaireId))
    } catch (error) {
      console.error('問診票削除エラー:', error)
      alert('削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  // 質問数をカウント
  const getQuestionCount = (questionnaire: Questionnaire) => {
    return questionnaire.questions?.length || 0
  }

  // 作成日のフォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">問診票一覧</h2>
          <p className="text-gray-600">患者の問診票を管理します</p>
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            新しい問診票を作成
          </Button>
        )}
      </div>

      {/* 問診票一覧 */}
      {questionnaires.length === 0 ? (
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">問診票がありません</h3>
            <p className="text-gray-500 mb-4">新しい問診票を作成してください</p>
            {onCreate && (
              <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-700">
                問診票を作成
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg">{questionnaire.name}</CardTitle>
                      <Badge 
                        variant={questionnaire.is_active ? "default" : "secondary"}
                        className={questionnaire.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {questionnaire.is_active ? '有効' : '無効'}
                      </Badge>
                    </div>
                    {questionnaire.description && (
                      <p className="text-gray-600 text-sm">{questionnaire.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {onView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(questionnaire)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        表示
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log('=== 編集ボタンクリック開始 ===')
                        console.log('questionnaire:', questionnaire)
                        console.log('editingQuestionnaire before:', editingQuestionnaire)
                        setEditingQuestionnaire(questionnaire)
                        console.log('=== 編集ボタンクリック終了 ===')
                        // 状態更新の確認
                        setTimeout(() => {
                          console.log('editingQuestionnaire after:', editingQuestionnaire)
                        }, 100)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      編集
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(questionnaire.id)}
                      disabled={deleting === questionnaire.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {deleting === questionnaire.id ? '削除中...' : '削除'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>質問数: {getQuestionCount(questionnaire)}件</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>作成日: {formatDate(questionnaire.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span>更新日: {formatDate(questionnaire.updated_at)}</span>
                    </div>
                  </div>
                  
                  {/* 患者用URL */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">患者用URL</span>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getPatientUrl())}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          コピー
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(getPatientUrl(), '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          開く
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                      {getPatientUrl()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 編集モーダル */}
      {editingQuestionnaire && (
        <>
          {console.log('QuestionnaireEditModal をレンダリングします:', editingQuestionnaire)}
          <QuestionnaireEditModal
            isOpen={!!editingQuestionnaire}
            onClose={() => {
              console.log('モーダルを閉じます')
              setEditingQuestionnaire(null)
            }}
            questionnaireId={editingQuestionnaire.id}
            clinicId={clinicId}
            onSave={(updatedQuestionnaire) => {
              console.log('問診票を保存しました:', updatedQuestionnaire)
              // リストを更新
              setQuestionnaires(prev => 
                prev.map(q => q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q)
              )
              setEditingQuestionnaire(null)
              onEdit?.(updatedQuestionnaire)
            }}
          />
        </>
      )}
    </div>
  )
}
