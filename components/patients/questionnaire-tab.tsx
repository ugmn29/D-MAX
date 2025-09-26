'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { getLinkedQuestionnaireResponses, QuestionnaireResponse } from '@/lib/api/questionnaires'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface QuestionnaireTabProps {
  patientId: string
}

export function QuestionnaireTab({ patientId }: QuestionnaireTabProps) {
  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)

  useEffect(() => {
    loadQuestionnaireResponses()
  }, [patientId])

  const loadQuestionnaireResponses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // この患者に連携済みの問診票回答を取得
      const patientResponses = await getLinkedQuestionnaireResponses(patientId)
      
      setQuestionnaireResponses(patientResponses)
    } catch (err) {
      console.error('問診票回答の読み込みエラー:', err)
      setError('問診票回答の読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (responseId: string) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId)
  }

  const formatResponseData = (data: any) => {
    if (!data) return 'データなし'
    
    const formattedData: { [key: string]: any } = {}
    
    // 基本的な患者情報
    if (data.patient_name) formattedData['患者名'] = data.patient_name
    if (data.patient_name_kana) formattedData['患者名（フリガナ）'] = data.patient_name_kana
    if (data.birth_date) formattedData['生年月日'] = data.birth_date
    if (data.gender) formattedData['性別'] = data.gender === 'male' ? '男性' : data.gender === 'female' ? '女性' : 'その他'
    if (data.phone) formattedData['電話番号'] = data.phone
    if (data.email) formattedData['メールアドレス'] = data.email
    
    // 医療情報
    if (data.allergies) formattedData['アレルギー'] = data.allergies
    if (data.medical_history) formattedData['既往歴'] = data.medical_history
    if (data.current_medications) formattedData['現在服用中の薬'] = data.current_medications
    if (data.chief_complaint) formattedData['主訴'] = data.chief_complaint
    
    // 問診票固有の項目
    if (data.questions) {
      Object.entries(data.questions).forEach(([key, value]) => {
        formattedData[`質問: ${key}`] = value
      })
    }
    
    return formattedData
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">問診票回答を読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
        <Button onClick={loadQuestionnaireResponses} className="mt-4">
          再読み込み
        </Button>
      </div>
    )
  }

  if (questionnaireResponses.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">問診票回答がありません</h3>
        <p className="text-gray-500 mb-4">この患者に関連する問診票回答が見つかりませんでした。</p>
        <Button 
          onClick={loadQuestionnaireResponses}
          variant="outline"
          size="sm"
        >
          再読み込み
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">問診票回答</h3>
        <Badge variant="outline" className="text-sm">
          {questionnaireResponses.length}件の回答
        </Badge>
      </div>

      <div className="space-y-4">
        {questionnaireResponses.map((response) => {
          const isExpanded = expandedResponse === response.id
          const formattedData = formatResponseData(response.response_data)
          
          return (
            <Card key={response.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">
                        問診票回答 #{response.id.slice(-8)}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(response.created_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </div>
                        {response.patient_name && (
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {response.patient_name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={response.patient_id ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {response.patient_id ? '連携済み' : '未連携'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(response.id)}
                      className="p-1"
                    >
                      {isExpanded ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(formattedData).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <label className="text-sm font-medium text-gray-600">
                            {key}
                          </label>
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <p className="text-sm text-gray-900">
                              {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {response.patient_id && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-800">
                            この問診票は患者情報と連携されています
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
