'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Save,
  FileText,
  Clock,
  User
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface OralFunctionAssessment {
  id: string
  patient_id: string
  assessment_date: string
  assessment_type: string
  questionnaire_response_id: string | null
  evaluated_by_staff_id: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string

  // C分類17項目
  c1_result: boolean | null
  c1_source: string | null
  c1_notes: string | null
  c2_result: boolean | null
  c2_source: string | null
  c2_notes: string | null
  c3_result: boolean | null
  c3_source: string | null
  c3_notes: string | null
  c4_result: boolean | null
  c4_source: string | null
  c4_notes: string | null
  c5_result: boolean | null
  c5_source: string | null
  c5_notes: string | null
  c6_result: boolean | null
  c6_source: string | null
  c6_notes: string | null
  c7_result: boolean | null
  c7_source: string | null
  c7_notes: string | null
  c8_result: boolean | null
  c8_source: string | null
  c8_notes: string | null
  c9_result: boolean | null
  c9_source: string | null
  c9_notes: string | null
  c10_result: boolean | null
  c10_source: string | null
  c10_notes: string | null
  c11_result: boolean | null
  c11_source: string | null
  c11_notes: string | null
  c12_result: boolean | null
  c12_source: string | null
  c12_notes: string | null
  c13_result: boolean | null
  c13_source: string | null
  c13_notes: string | null
  c14_result: boolean | null
  c14_source: string | null
  c14_notes: string | null
  c15_result: boolean | null
  c15_source: string | null
  c15_notes: string | null
  c16_result: boolean | null
  c16_source: string | null
  c16_notes: string | null
  c17_result: boolean | null
  c17_source: string | null
  c17_notes: string | null
}

interface OralFunctionAssessmentPanelProps {
  patientId: string
  staffId?: string
}

// C分類項目の定義
const C_CLASSIFICATION_ITEMS = [
  { key: 'c1', label: 'C-1: 歯の欠損がある', autoEval: false },
  { key: 'c2', label: 'C-2: 口唇・口蓋裂等がある', autoEval: false },
  { key: 'c3', label: 'C-3: 舌小帯、上唇小帯に異常がある', autoEval: false },
  { key: 'c4', label: 'C-4: 口唇閉鎖不全がある', autoEval: true },
  { key: 'c5', label: 'C-5: 食べこぼしがある', autoEval: true },
  { key: 'c6', label: 'C-6: 口腔習癖がある', autoEval: true },
  { key: 'c7', label: 'C-7: 歯の萌出に遅れがある', autoEval: false },
  { key: 'c8', label: 'C-8: 咀嚼に時間がかかる・咀嚼ができない', autoEval: true },
  { key: 'c9', label: 'C-9: 咬み合わせに異常がある', autoEval: false },
  { key: 'c10', label: 'C-10: 鼻呼吸の障害がある', autoEval: true },
  { key: 'c11', label: 'C-11: 口で呼吸する癖がある', autoEval: true },
  { key: 'c12', label: 'C-12: 咀嚼時、舌の動きに問題がある', autoEval: false },
  { key: 'c13', label: 'C-13: 身長、体重の増加に問題がある', autoEval: false },
  { key: 'c14', label: 'C-14: 食べ方が遅い', autoEval: true },
  { key: 'c15', label: 'C-15: 偏食がある', autoEval: false },
  { key: 'c16', label: 'C-16: 睡眠時のいびきがある', autoEval: true },
  { key: 'c17', label: 'C-17: その他の症状', autoEval: true },
]

export function OralFunctionAssessmentPanel({
  patientId,
  staffId
}: OralFunctionAssessmentPanelProps) {
  const [assessments, setAssessments] = useState<OralFunctionAssessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<OralFunctionAssessment | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningAutoEval, setIsRunningAutoEval] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedData, setEditedData] = useState<Partial<OralFunctionAssessment>>({})

  // 評価結果を読み込み
  const loadAssessments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/oral-function-assessment`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
        if (data.assessments && data.assessments.length > 0) {
          setCurrentAssessment(data.assessments[0])
        }
      }
    } catch (error) {
      console.error('評価結果の読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 自動評価を実行
  const runAutoEvaluation = async () => {
    setIsRunningAutoEval(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/oral-function-assessment`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        alert('自動評価が完了しました')
        await loadAssessments()
      } else {
        const error = await response.json()
        alert(`エラー: ${error.error}`)
      }
    } catch (error) {
      console.error('自動評価エラー:', error)
      alert('自動評価に失敗しました')
    } finally {
      setIsRunningAutoEval(false)
    }
  }

  // 評価結果を保存
  const saveAssessment = async () => {
    if (!currentAssessment || !staffId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/oral-function-assessment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: currentAssessment.id,
          updates: editedData,
          staff_id: staffId,
        }),
      })

      if (response.ok) {
        alert('評価結果を保存しました')
        setEditMode(false)
        await loadAssessments()
      } else {
        alert('保存に失敗しました')
      }
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAssessments()
  }, [patientId])

  // C分類項目の該当数を計算
  const countPositiveItems = () => {
    if (!currentAssessment) return 0
    return C_CLASSIFICATION_ITEMS.filter(item => {
      const result = currentAssessment[`${item.key}_result` as keyof OralFunctionAssessment]
      return result === true
    }).length
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              口腔機能発達不全症評価
            </CardTitle>
            <div className="flex items-center gap-2">
              {currentAssessment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  該当項目: {countPositiveItems()}/17
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={runAutoEvaluation}
                disabled={isRunningAutoEval}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRunningAutoEval ? 'animate-spin' : ''}`} />
                習慣チェック表から自動評価
              </Button>
            </div>
          </div>
        </CardHeader>

        {currentAssessment && (
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                評価日: {format(new Date(currentAssessment.assessment_date), 'yyyy年MM月dd日', { locale: ja })}
              </div>
              {currentAssessment.confirmed_at && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  確認済み: {format(new Date(currentAssessment.confirmed_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* C分類評価結果 */}
      {currentAssessment ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>C分類評価結果</CardTitle>
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditMode(true)
                    setEditedData({})
                  }}
                >
                  編集
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false)
                      setEditedData({})
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button size="sm" onClick={saveAssessment} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {C_CLASSIFICATION_ITEMS.map((item) => {
                const resultKey = `${item.key}_result` as keyof OralFunctionAssessment
                const sourceKey = `${item.key}_source` as keyof OralFunctionAssessment
                const notesKey = `${item.key}_notes` as keyof OralFunctionAssessment

                const result = editMode && editedData[resultKey] !== undefined
                  ? editedData[resultKey]
                  : currentAssessment[resultKey]
                const source = currentAssessment[sourceKey]
                const notes = editMode && editedData[notesKey] !== undefined
                  ? editedData[notesKey]
                  : currentAssessment[notesKey]

                return (
                  <div key={item.key} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-2">
                        {editMode ? (
                          <Checkbox
                            checked={result === true}
                            onCheckedChange={(checked) => {
                              setEditedData({
                                ...editedData,
                                [resultKey]: checked,
                                [`${item.key}_source`]: 'staff',
                              })
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center">
                            {result === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : result === false ? (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{item.label}</Label>
                          {item.autoEval && source === 'questionnaire' && (
                            <Badge variant="secondary" className="text-xs">
                              自動判定
                            </Badge>
                          )}
                          {source === 'staff' && (
                            <Badge variant="outline" className="text-xs">
                              スタッフ評価
                            </Badge>
                          )}
                          {source === null && result === null && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              未評価
                            </Badge>
                          )}
                        </div>

                        {notes && (
                          <div className="text-sm">
                            {editMode ? (
                              <Textarea
                                value={notes as string || ''}
                                onChange={(e) => {
                                  setEditedData({
                                    ...editedData,
                                    [notesKey]: e.target.value,
                                  })
                                }}
                                placeholder="備考・詳細を入力"
                                rows={2}
                              />
                            ) : (
                              <p className="text-muted-foreground">{notes as string}</p>
                            )}
                          </div>
                        )}

                        {editMode && !notes && (
                          <Textarea
                            value={(editedData[notesKey] as string) || ''}
                            onChange={(e) => {
                              setEditedData({
                                ...editedData,
                                [notesKey]: e.target.value,
                              })
                            }}
                            placeholder="備考・詳細を入力"
                            rows={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">まだ評価結果がありません</p>
              <Button onClick={runAutoEvaluation} disabled={isRunningAutoEval}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRunningAutoEval ? 'animate-spin' : ''}`} />
                習慣チェック表から自動評価を実行
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
