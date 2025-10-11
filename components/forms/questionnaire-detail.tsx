'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { getQuestionnaires, type Questionnaire, type QuestionnaireQuestion } from '@/lib/api/questionnaires'

interface QuestionnaireDetailProps {
  questionnaireId: string
  clinicId: string
  onEdit?: (questionnaire: Questionnaire) => void
  onBack?: () => void
}

export function QuestionnaireDetail({ questionnaireId, clinicId, onEdit, onBack }: QuestionnaireDetailProps) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSection, setCurrentSection] = useState<string>('患者情報')

  // データ読み込み
  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true)
        const questionnaires = await getQuestionnaires(clinicId)
        const targetQuestionnaire = questionnaires.find(q => q.id === questionnaireId)
        
        if (targetQuestionnaire) {
          setQuestionnaire(targetQuestionnaire)

          // 最初のセクションを設定
          const firstSection = Array.from(new Set(targetQuestionnaire.questions.map(q => q.section_name).filter(Boolean)))[0]
          if (firstSection) {
            setCurrentSection(firstSection)
          }
        }
      } catch (error) {
        console.error('問診票読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadQuestionnaire()
  }, [questionnaireId, clinicId])

  // セクション一覧を取得
  const sections = questionnaire ? Array.from(new Set(questionnaire.questions.map(q => q.section_name).filter(Boolean))).sort((a, b) => {
    const order = ['患者情報', '主訴・症状', '問診', '歯科疾患管理', '同意事項']
    return order.indexOf(a) - order.indexOf(b)
  }) : []

  // 現在のセクションの質問を取得
  const currentQuestions = questionnaire ? questionnaire.questions.filter(q => q.section_name === currentSection) : []

  // 患者基本情報と連携している質問IDのマッピング
  const patientFieldMapping: { [key: string]: string } = {
    'q1-1': '氏名',
    'q1-2': 'ふりがな',
    'q1-3': '性別',
    'q1-4': '生年月日',
    'q1-5': '郵便番号',
    'q1-6': '住所',
    'q1-8': '自宅電話',
    'q1-9': '携帯電話',
    'q1-10': 'メールアドレス',
    'q3-4': 'アレルギー',
    'q3-5': 'アレルギー原因',
    'q3-6': '持病',
    'q3-8': '病名・病院名'
  }

  // 質問が患者基本情報と連携しているかチェック
  const isLinkedToPatient = (questionId: string) => {
    return questionId in patientFieldMapping
  }

  // 連携先のフィールド名を取得
  const getLinkedFieldName = (questionId: string) => {
    return patientFieldMapping[questionId]
  }

  // 質問のタイプに応じた表示
  const renderQuestionType = (question: QuestionnaireQuestion) => {
    switch (question.question_type) {
      case 'text':
        return <span className="text-sm text-gray-500">テキスト入力</span>
      case 'textarea':
        return <span className="text-sm text-gray-500">テキストエリア</span>
      case 'number':
        return <span className="text-sm text-gray-500">数値入力</span>
      case 'date':
        return <span className="text-sm text-gray-500">日付選択</span>
      case 'radio':
        return <span className="text-sm text-gray-500">ラジオボタン</span>
      case 'checkbox':
        return <span className="text-sm text-gray-500">チェックボックス</span>
      case 'select':
        return <span className="text-sm text-gray-500">セレクトボックス</span>
      default:
        return <span className="text-sm text-gray-500">その他</span>
    }
  }

  // 選択肢の表示
  const renderOptions = (question: QuestionnaireQuestion) => {
    if (!question.options || question.options.length === 0) return null
    
    return (
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">選択肢:</div>
        <div className="flex flex-wrap gap-1">
          {question.options.map((option, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {option}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // 条件分岐ロジックの表示
  const renderConditionalLogic = (question: QuestionnaireQuestion) => {
    if (!question.conditional_logic) return null
    
    const logic = question.conditional_logic as {
      depends_on?: string
      condition?: string
      value?: any
      required_when?: boolean
    }
    
    if (!logic.depends_on) return null
    
    return (
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <div className="text-blue-700 font-medium">条件分岐:</div>
        <div className="text-blue-600">
          「{logic.depends_on}」が「{logic.value}」の場合に{logic.required_when ? '必須' : '任意'}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!questionnaire) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">問診票が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{questionnaire.name}</h1>
            {questionnaire.description && (
              <p className="text-gray-600 mt-1">{questionnaire.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={questionnaire.is_active ? "default" : "secondary"}
            className={questionnaire.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
          >
            {questionnaire.is_active ? '有効' : '無効'}
          </Badge>
          {onEdit && (
            <Button onClick={() => onEdit(questionnaire)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          )}
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{questionnaire.questions.length}</div>
                <div className="text-sm text-gray-500">質問数</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  {questionnaire.questions.filter(q => q.is_required).length}
                </div>
                <div className="text-sm text-gray-500">必須項目</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {questionnaire.questions.filter(q => q.conditional_logic).length}
                </div>
                <div className="text-sm text-gray-500">条件分岐</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{sections.length}</div>
                <div className="text-sm text-gray-500">セクション</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* セクションナビゲーション */}
      <div className="flex space-x-2 overflow-x-auto">
        {sections.map((section) => (
          <Button
            key={section}
            variant={currentSection === section ? 'default' : 'outline'}
            onClick={() => setCurrentSection(section)}
            className="whitespace-nowrap"
          >
            {section}
          </Button>
        ))}
      </div>

      {/* 現在のセクションの質問 */}
      <Card>
        <CardHeader>
          <CardTitle>{currentSection}</CardTitle>
          <p className="text-sm text-gray-500">
            {currentQuestions.length}件の質問
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestions.map((question, index) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                    {question.is_required && (
                      <Badge variant="destructive" className="text-xs">
                        必須
                      </Badge>
                    )}
                    {isLinkedToPatient(question.id) && (
                      <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                        🔗 {getLinkedFieldName(question.id)}と連携
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">{question.question_text}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    {renderQuestionType(question)}
                    <span>並び順: {question.sort_order}</span>
                  </div>
                </div>
              </div>
              
              {renderOptions(question)}
              {renderConditionalLogic(question)}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* フッター */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-gray-500">
          作成日: {new Date(questionnaire.created_at).toLocaleDateString('ja-JP')} | 
          更新日: {new Date(questionnaire.updated_at).toLocaleDateString('ja-JP')}
        </div>
        <div className="flex space-x-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              戻る
            </Button>
          )}
          {onEdit && (
            <Button onClick={() => onEdit(questionnaire)} className="bg-blue-600 hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              編集
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
