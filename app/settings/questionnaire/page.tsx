'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Settings } from 'lucide-react'
import { QuestionnaireForm } from '@/components/forms/questionnaire-form'
import { QuestionnaireList } from '@/components/forms/questionnaire-list'
import { QuestionnaireDetail } from '@/components/forms/questionnaire-detail'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

type PageMode = 'list' | 'form' | 'detail' | 'settings'

export default function QuestionnaireSettingsPage() {
  const router = useRouter()
  const [mode, setMode] = useState<PageMode>('list')
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null)


  // 問診票保存完了時の処理
  const handleQuestionnaireSave = (responseId: string) => {
    alert('問診票を保存しました')
    setMode('list')
  }

  // 問診票キャンセル時の処理
  const handleQuestionnaireCancel = () => {
    setMode('list')
  }

  // 問診票詳細表示
  const handleViewQuestionnaire = (questionnaire: any) => {
    setSelectedQuestionnaireId(questionnaire.id)
    setMode('detail')
  }

  // 問診票編集（モーダル内で処理されるため、ここでは単純にログ出力のみ）
  const handleEditQuestionnaire = (questionnaire: any) => {
    console.log('問診票編集完了:', questionnaire)
  }

  // 詳細から戻る
  const handleBackFromDetail = () => {
    setSelectedQuestionnaireId(null)
    setMode('list')
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
              <h1 className="text-xl font-bold text-gray-900">問診表</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <Button
                variant={mode === 'list' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setMode('list')}
              >
                <FileText className="w-4 h-4 mr-2" />
                問診表一覧
              </Button>
              <Button
                variant={mode === 'settings' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setMode('settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                設定
              </Button>
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {mode === 'list' && (
            <div className="p-6">
              <QuestionnaireList
                clinicId={DEMO_CLINIC_ID}
                onCreate={() => {
                  console.log('新しい問診票を作成')
                  setSelectedQuestionnaireId(null) // 編集モードをリセット
                  setMode('form')
                }}
                onEdit={handleEditQuestionnaire}
                onView={handleViewQuestionnaire}
              />
            </div>
          )}

          {mode === 'form' && (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('list')}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedQuestionnaireId ? '問診表編集' : '問診表作成'}
                </h2>
              </div>
              
              <QuestionnaireForm
                clinicId={DEMO_CLINIC_ID}
                questionnaireId={selectedQuestionnaireId || undefined}
                onSave={handleQuestionnaireSave}
                onCancel={handleQuestionnaireCancel}
              />
            </div>
          )}

          {mode === 'detail' && selectedQuestionnaireId && (
            <div className="p-6">
              <QuestionnaireDetail
                questionnaireId={selectedQuestionnaireId}
                clinicId={DEMO_CLINIC_ID}
                onEdit={handleEditQuestionnaire}
                onBack={handleBackFromDetail}
              />
            </div>
          )}

          {mode === 'settings' && (
            <div className="p-6">
              <div className="flex items-center mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode('list')}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">問診表設定</h2>
              </div>
              
              <div className="bg-white rounded-lg border p-6">
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">設定</h3>
                  <p className="text-gray-500">問診表の設定は今後実装予定です</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
