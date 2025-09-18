'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import { getClinicSettings, setClinicSetting } from '@/lib/api/clinic'

// 仮のクリニックID
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function QuestionnaireSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // 問診表設定
  const [questionnaireSettings, setQuestionnaireSettings] = useState({
    isEnabled: false,
    sendTiming: 'before_appointment',
    validPeriod: 7,
    templates: {
      standard: true,
      child: false,
      orthodontic: false,
      custom: false
    }
  })

  // データ読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const settings = await getClinicSettings(DEMO_CLINIC_ID)
        
        setQuestionnaireSettings(settings.questionnaire || {
          isEnabled: false,
          sendTiming: 'before_appointment',
          validPeriod: 7,
          templates: {
            standard: true,
            child: false,
            orthodontic: false,
            custom: false
          }
        })
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true)
      await setClinicSetting(DEMO_CLINIC_ID, 'questionnaire', questionnaireSettings)
      alert('設定を保存しました')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました')
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
              <h1 className="text-xl font-bold text-gray-900">問診表</h1>
            </div>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <div className="bg-blue-50 text-blue-700 border border-blue-200 p-3 rounded-lg">
                <div className="font-medium">問診表</div>
                <div className="text-sm text-blue-600">Web問診表の設定と管理</div>
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
                <h2 className="text-2xl font-bold text-gray-900">問診表設定</h2>
                <p className="text-gray-600">Web問診表の設定と管理を行います</p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>

            {/* 基本設定 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="is_enabled"
                    checked={questionnaireSettings.isEnabled}
                    onCheckedChange={(checked) => 
                      setQuestionnaireSettings(prev => ({ ...prev, isEnabled: checked as boolean }))
                    }
                  />
                  <Label htmlFor="is_enabled" className="font-medium">
                    問診表機能を有効にする
                  </Label>
                </div>
                
                {questionnaireSettings.isEnabled && (
                  <>
                    <div>
                      <Label htmlFor="send_timing">送信タイミング</Label>
                      <select
                        id="send_timing"
                        value={questionnaireSettings.sendTiming}
                        onChange={(e) => 
                          setQuestionnaireSettings(prev => ({ ...prev, sendTiming: e.target.value }))
                        }
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="before_appointment">予約前</option>
                        <option value="same_day">当日</option>
                        <option value="after_booking">予約後</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="valid_period">有効期間（日）</Label>
                      <Input
                        id="valid_period"
                        type="number"
                        min="1"
                        max="30"
                        value={questionnaireSettings.validPeriod}
                        onChange={(e) => 
                          setQuestionnaireSettings(prev => ({ 
                            ...prev, 
                            validPeriod: parseInt(e.target.value) || 7 
                          }))
                        }
                        className="max-w-xs"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* テンプレート管理 */}
            <Card>
              <CardHeader>
                <CardTitle>テンプレート管理</CardTitle>
                <p className="text-sm text-gray-600">使用する問診表テンプレートを選択してください</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="template_standard"
                      checked={questionnaireSettings.templates.standard}
                      onCheckedChange={(checked) => 
                        setQuestionnaireSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, standard: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="template_standard" className="font-medium">
                        標準テンプレート
                      </Label>
                      <p className="text-sm text-gray-500">
                        一般的な問診項目を含む標準的なテンプレート
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="template_child"
                      checked={questionnaireSettings.templates.child}
                      onCheckedChange={(checked) => 
                        setQuestionnaireSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, child: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="template_child" className="font-medium">
                        子ども用テンプレート
                      </Label>
                      <p className="text-sm text-gray-500">
                        小児患者向けの問診項目を含むテンプレート
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="template_orthodontic"
                      checked={questionnaireSettings.templates.orthodontic}
                      onCheckedChange={(checked) => 
                        setQuestionnaireSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, orthodontic: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="template_orthodontic" className="font-medium">
                        矯正用テンプレート
                      </Label>
                      <p className="text-sm text-gray-500">
                        矯正治療向けの問診項目を含むテンプレート
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="template_custom"
                      checked={questionnaireSettings.templates.custom}
                      onCheckedChange={(checked) => 
                        setQuestionnaireSettings(prev => ({
                          ...prev,
                          templates: { ...prev.templates, custom: checked as boolean }
                        }))
                      }
                    />
                    <div className="flex-1">
                      <Label htmlFor="template_custom" className="font-medium">
                        カスタムテンプレート
                      </Label>
                      <p className="text-sm text-gray-500">
                        医院独自の問診項目を含むカスタムテンプレート
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
