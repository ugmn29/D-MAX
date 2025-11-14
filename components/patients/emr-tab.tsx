'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Plus,
  Save,
  FileText,
  Mic,
  AlertCircle,
  X,
  Calculator,
  Lightbulb,
  CheckCircle
} from 'lucide-react'
import { DiseaseCode, TreatmentCode } from '@/types/emr'
import { searchDiseaseCodes, searchTreatmentCodes } from '@/lib/api/emr'
import {
  validateDiseaseTreatmentCompatibility,
  COMMON_DISEASE_TREATMENT_TEMPLATES
} from '@/lib/validation/disease-treatment-validation'
import {
  validateTreatmentSelection
} from '@/lib/validation/treatment-suggestions'
import {
  suggestRelatedTreatments,
  validateTreatmentAddition,
  type TreatmentSuggestion
} from '@/lib/api/treatment-suggestions'
import {
  suggestTreatmentsByMultipleDiseases
} from '@/lib/api/disease-treatment-mapping'
import {
  getTreatmentSets,
  getSuggestedTreatmentSetsByDiseaseName,
  getTreatmentRequiredFields,
  type TreatmentSet,
  type TreatmentSetItem
} from '@/lib/api/treatment-sets'
import { TreatmentSetModal } from '@/components/emr/treatment-set-modal'
import { TreatmentRequiredFieldsForm } from '@/components/emr/treatment-required-fields-form'
import { TimelineView } from '@/components/emr/timeline-view'

interface EMRTabProps {
  patientId: string
  clinicId: string
}

interface SelectedDisease {
  id: string
  code: string
  name: string
  icd10Code: string
  tooth?: string // 該当歯番号
}

interface SelectedTreatment {
  id: string
  code: string
  name: string
  points: number
  tooth?: string // 該当歯番号
  relatedDiseaseId?: string // 関連する病名ID
}

// ヘルパー関数: 病名表示をC1/C2/C3形式に変換
function formatDiseaseName(name: string): string {
  return name
    .replace(/う蝕第１度/g, 'C1 (う蝕第１度)')
    .replace(/う蝕第２度/g, 'C2 (う蝕第２度)')
    .replace(/う蝕第３度/g, 'C3 (う蝕第３度)')
    .replace(/う蝕第４度/g, 'C4 (う蝕第４度)')
}

export function EMRTab({ patientId, clinicId }: EMRTabProps) {
  // State for disease search
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState('')
  const [diseaseSearchResults, setDiseaseSearchResults] = useState<DiseaseCode[]>([])
  const [selectedDiseases, setSelectedDiseases] = useState<SelectedDisease[]>([])
  const [showDiseaseResults, setShowDiseaseResults] = useState(false)

  // State for treatment search
  const [treatmentSearchQuery, setTreatmentSearchQuery] = useState('')
  const [treatmentSearchResults, setTreatmentSearchResults] = useState<TreatmentCode[]>([])
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([])
  const [showTreatmentResults, setShowTreatmentResults] = useState(false)

  // State for SOAP notes
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')

  // State for validation warnings
  const [warnings, setWarnings] = useState<string[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  // State for treatment suggestions (関連処置の提案)
  const [treatmentSuggestions, setTreatmentSuggestions] = useState<TreatmentSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inclusionWarnings, setInclusionWarnings] = useState<string[]>([])
  const [exclusionErrors, setExclusionErrors] = useState<string[]>([])

  // State for tooth selection (歯式選択)
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)

  // State for treatment sets (処置セット)
  const [treatmentSets, setTreatmentSets] = useState<TreatmentSet[]>([])
  const [selectedTreatmentSet, setSelectedTreatmentSet] = useState<TreatmentSet | null>(null)
  const [showTreatmentSetModal, setShowTreatmentSetModal] = useState(false)

  // State for required fields (必須記載項目)
  const [pendingTreatmentWithFields, setPendingTreatmentWithFields] = useState<{
    treatment: TreatmentCode
    tooth?: string
  } | null>(null)
  const [toothDiseaseMode, setToothDiseaseMode] = useState<'disease' | 'treatment'>('disease')

  // State for view mode (入力 or 時系列)
  const [viewMode, setViewMode] = useState<'input' | 'timeline'>('input')

  // Total points calculation
  const totalPoints = selectedTreatments.reduce((sum, t) => sum + t.points, 0)
  const totalAmount = totalPoints * 10

  // Validation: Check disease-treatment compatibility
  useEffect(() => {
    if (selectedDiseases.length > 0 && selectedTreatments.length > 0) {
      const validation = validateDiseaseTreatmentCompatibility(
        selectedDiseases,
        selectedTreatments
      )
      setWarnings(validation.warnings)
      setErrors(validation.errors)
      setSuggestions(validation.suggestions)
    } else {
      setWarnings([])
      setErrors([])
      setSuggestions([])
    }
  }, [selectedDiseases, selectedTreatments])

  // Auto-suggest treatments when diseases are selected (Dentis/Julea style)
  useEffect(() => {
    const loadDiseaseSuggestions = async () => {
      if (selectedDiseases.length === 0) {
        // 病名がない場合は診療行為ベースの提案のみ
        return
      }

      // 病名から処置を提案
      const diseaseSuggestions = await suggestTreatmentsByMultipleDiseases(
        selectedDiseases.map(d => ({
          code: d.code,
          name: d.name
        }))
      )

      if (diseaseSuggestions.length > 0) {
        setTreatmentSuggestions(diseaseSuggestions)
        setShowSuggestions(true)
      }
    }

    loadDiseaseSuggestions()
  }, [selectedDiseases])

  // Auto-suggest related treatments when treatments are selected
  useEffect(() => {
    const loadTreatmentSuggestions = async () => {
      // 病名が選択されている場合は病名ベースの提案を優先
      if (selectedDiseases.length > 0) {
        return
      }

      if (selectedTreatments.length === 0) {
        setTreatmentSuggestions([])
        setShowSuggestions(false)
        return
      }

      const selectedCodes = selectedTreatments.map(t => t.code)
      const suggestions = await suggestRelatedTreatments(selectedCodes)

      if (suggestions.length > 0) {
        setTreatmentSuggestions(suggestions)
        setShowSuggestions(true)
      } else {
        setTreatmentSuggestions([])
        setShowSuggestions(false)
      }
    }

    loadTreatmentSuggestions()
  }, [selectedTreatments, selectedDiseases])

  // Disease search handler
  useEffect(() => {
    const searchDiseases = async () => {
      console.log('病名検索実行:', diseaseSearchQuery)

      if (diseaseSearchQuery.trim().length < 2) {
        setDiseaseSearchResults([])
        setShowDiseaseResults(false)
        return
      }

      try {
        console.log('API呼び出し中...')
        const results = await searchDiseaseCodes(diseaseSearchQuery, 20, false)
        console.log('検索結果:', results.length, '件')
        setDiseaseSearchResults(results)
        setShowDiseaseResults(true)
      } catch (error) {
        console.error('病名検索エラー:', error)
        setDiseaseSearchResults([])
      }
    }

    const debounce = setTimeout(searchDiseases, 300)
    return () => clearTimeout(debounce)
  }, [diseaseSearchQuery])

  // Treatment search handler
  useEffect(() => {
    const searchTreatments = async () => {
      console.log('診療行為検索実行:', treatmentSearchQuery)

      if (treatmentSearchQuery.trim().length < 2) {
        setTreatmentSearchResults([])
        setShowTreatmentResults(false)
        return
      }

      try {
        console.log('診療行為API呼び出し中...')
        const results = await searchTreatmentCodes(treatmentSearchQuery)
        console.log('診療行為検索結果:', results.length, '件')
        setTreatmentSearchResults(results)
        setShowTreatmentResults(true)
      } catch (error) {
        console.error('診療行為検索エラー:', error)
        setTreatmentSearchResults([])
      }
    }

    const debounce = setTimeout(searchTreatments, 300)
    return () => clearTimeout(debounce)
  }, [treatmentSearchQuery])

  // Add disease (with tooth number if selected)
  const addDisease = (disease: DiseaseCode) => {
    const newDisease: SelectedDisease = {
      id: disease.id + (selectedTooth ? `-${selectedTooth}` : ''),
      code: disease.code,
      name: disease.name,
      icd10Code: disease.icd10_code,
      tooth: selectedTooth || undefined
    }
    setSelectedDiseases([...selectedDiseases, newDisease])
    setDiseaseSearchQuery('')
    setShowDiseaseResults(false)

    // 歯式選択モードの場合、病名追加後に診療行為提案を自動表示
    if (selectedTooth) {
      setToothDiseaseMode('treatment')
    }
  }

  // Remove disease
  const removeDisease = (id: string) => {
    setSelectedDiseases(selectedDiseases.filter(d => d.id !== id))
  }

  // Tooth selection handler
  const handleToothSelect = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
    setToothDiseaseMode('disease')
    // 歯式選択時に病名入力欄にフォーカス
  }

  // Clear tooth selection
  const clearToothSelection = () => {
    setSelectedTooth(null)
    setToothDiseaseMode('disease')
  }

  // Add treatment with validation and suggestions
  const addTreatment = async (treatment: TreatmentCode) => {
    const existingCodes = selectedTreatments.map(t => t.code)

    // Validate treatment addition
    const validation = await validateTreatmentAddition(
      treatment.code,
      existingCodes
    )

    // Show inclusion warnings
    if (validation.inclusionConflicts.length > 0) {
      setInclusionWarnings(validation.inclusionConflicts)
    }

    // Show exclusion errors
    if (validation.exclusionConflicts.length > 0) {
      setExclusionErrors(validation.exclusionConflicts)
    }

    // Don't add if there are conflicts
    if (!validation.canAdd) {
      setTreatmentSearchQuery('')
      setShowTreatmentResults(false)
      // Clear errors after 5 seconds
      setTimeout(() => {
        setInclusionWarnings([])
        setExclusionErrors([])
      }, 5000)
      return
    }

    // Add the treatment (with tooth number if selected)
    // 選択中の歯に関連する病名を探す
    const relatedDisease = selectedDiseases.find(d => d.tooth === selectedTooth)

    const newTreatment: SelectedTreatment = {
      id: `${treatment.id}-${selectedTooth || 'no-tooth'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      code: treatment.code,
      name: treatment.name,
      points: treatment.points,
      tooth: selectedTooth || undefined,
      relatedDiseaseId: relatedDisease?.id
    }
    setSelectedTreatments([...selectedTreatments, newTreatment])

    setTreatmentSearchQuery('')
    setShowTreatmentResults(false)

    // Clear previous errors
    setInclusionWarnings([])
    setExclusionErrors([])
  }

  // Add suggested treatment directly from suggestion
  const addSuggestedTreatment = async (suggestion: TreatmentSuggestion) => {
    try {
      // Search for the treatment by code
      const results = await searchTreatmentCodes(suggestion.code, 1)

      if (results.length > 0) {
        await addTreatment(results[0])
      } else {
        // If code search fails, try by name
        const nameResults = await searchTreatmentCodes(suggestion.name, 1)
        if (nameResults.length > 0) {
          await addTreatment(nameResults[0])
        } else {
          console.error('処置が見つかりませんでした:', suggestion)
        }
      }
    } catch (error) {
      console.error('提案処置追加エラー:', error)
    }
  }

  // Dismiss all suggestions
  const dismissSuggestions = () => {
    setShowSuggestions(false)
  }

  // Remove treatment
  const removeTreatment = (id: string) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.id !== id))
  }

  // === 処置セット関連の関数 ===

  // Load treatment sets on mount
  useEffect(() => {
    loadTreatmentSets()
  }, [])

  const loadTreatmentSets = async () => {
    const sets = await getTreatmentSets()
    setTreatmentSets(sets)
  }

  // Open treatment set modal
  const openTreatmentSetModal = (set: TreatmentSet) => {
    setSelectedTreatmentSet(set)
    setShowTreatmentSetModal(true)
  }

  // Apply treatment set
  const applyTreatmentSet = async (selectedItems: TreatmentSetItem[]) => {
    for (const item of selectedItems) {
      if (item.treatment) {
        const treatmentCode: TreatmentCode = {
          id: item.treatment.code,
          code: item.treatment.code,
          name: item.treatment.name,
          points: item.treatment.points,
          category: '',
          description: null,
          metadata: null
        }

        // 必須記載項目があるかチェックして、ある場合は記載項目フォームを表示
        const requiredFields = await getTreatmentRequiredFields(item.treatment.code)

        if (requiredFields.length > 0) {
          // 必須記載項目がある場合は、フォームを表示
          setPendingTreatmentWithFields({
            treatment: treatmentCode,
            tooth: selectedTooth || undefined
          })
          // 1件ずつ処理するため、ここでreturn
          return
        } else {
          // 必須記載項目がない場合は、そのまま追加
          await addTreatment(treatmentCode)
        }
      }
    }
  }

  // Handle required fields submission
  const handleRequiredFieldsSubmit = async (fieldValues: Record<string, any>) => {
    if (!pendingTreatmentWithFields) return

    // TODO: fieldValuesをデータベースに保存
    console.log('必須記載項目:', fieldValues)

    // 処置を追加
    await addTreatment(pendingTreatmentWithFields.treatment)

    // ペンディング状態をクリア
    setPendingTreatmentWithFields(null)
  }

  // Template selection state
  const [showTemplates, setShowTemplates] = useState(false)

  // Apply template
  const applyTemplate = (templateId: string) => {
    const template = COMMON_DISEASE_TREATMENT_TEMPLATES.find(t => t.id === templateId)
    if (!template) return

    // Add diseases from template
    const newDiseases: SelectedDisease[] = template.diseases.map(d => ({
      id: `template-${d.code}`,
      code: d.code,
      name: d.name,
      icd10Code: d.icd10Code
    }))
    setSelectedDiseases([...selectedDiseases, ...newDiseases])

    // Add treatments from template
    const newTreatments: SelectedTreatment[] = template.treatments.map(t => ({
      id: `template-${t.code}`,
      code: t.code,
      name: t.name,
      points: t.points
    }))
    setSelectedTreatments([...selectedTreatments, ...newTreatments])

    setShowTemplates(false)
  }

  // Save medical record
  const saveMedicalRecord = async () => {
    // TODO: Implement save API call
    console.log('カルテ保存:', {
      patientId,
      diseases: selectedDiseases,
      treatments: selectedTreatments,
      soap: { subjective, objective, assessment, plan },
      totalPoints
    })
    alert('カルテを保存しました')
  }

  return (
    <div className="space-y-4">
      {/* Timeline View */}
      <TimelineView patientId={patientId} clinicId={clinicId} />

      {/* Hidden: Old Input View (Removed as per user request) */}
      {false && (
        <>
          {/* Error Messages */}
          {errors.length > 0 && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-red-900">病名と診療行為の不整合</p>
              {errors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-800">{error}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Warning Messages */}
      {warnings.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-yellow-900">注意事項</p>
              {warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-yellow-800">{warning}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="bg-blue-50 border-blue-200 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-blue-900">推奨処置</p>
              {suggestions.map((suggestion, idx) => (
                <p key={idx} className="text-sm text-blue-800">{suggestion}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Exclusion Errors (背反チェック) */}
      {exclusionErrors.length > 0 && (
        <Card className="bg-red-50 border-red-200 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-red-900">背反エラー（同時算定不可）</p>
              {exclusionErrors.map((error, idx) => (
                <p key={idx} className="text-sm text-red-800">{error}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Inclusion Warnings (包括チェック) */}
      {inclusionWarnings.length > 0 && (
        <Card className="bg-orange-50 border-orange-200 p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-sm text-orange-900">包括警告</p>
              {inclusionWarnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-orange-800">{warning}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Treatment Suggestions (関連処置の提案) */}
      {showSuggestions && treatmentSuggestions.length > 0 && (
        <Card className="bg-purple-50 border-purple-200 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2 flex-1">
              <Lightbulb className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div>
                  <p className="font-semibold text-sm text-purple-900">関連処置の提案</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    選択された処置に基づいて、併用可能な処置や加算を提案します
                  </p>
                </div>
                <div className="space-y-2">
                  {treatmentSuggestions.slice(0, 5).map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-purple-200 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              suggestion.type === 'addition' ? 'bg-blue-100 text-blue-700' :
                              suggestion.type === 'related' ? 'bg-green-100 text-green-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {suggestion.type === 'addition' ? '加算' :
                               suggestion.type === 'related' ? '関連処置' : '併用処置'}
                            </span>
                            <span className="text-xs text-purple-600 font-medium">
                              +{suggestion.points}点
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {suggestion.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {suggestion.reason}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addSuggestedTreatment(suggestion)}
                          className="ml-3 bg-white border-purple-300 text-purple-700 hover:bg-purple-100 shrink-0"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          追加
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismissSuggestions}
              className="ml-2 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Left Column: Dental Chart & Billing Summary */}
        <div className="space-y-4">
          {/* Dental Chart - Simplified Tooth Selection */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                歯式
              </h3>
              {selectedTooth && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearToothSelection}
                  className="text-xs h-6"
                >
                  <X className="w-3 h-3 mr-1" />
                  解除
                </Button>
              )}
            </div>

            {selectedTooth && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                <p className="text-sm font-semibold text-blue-700">
                  選択中: {selectedTooth}番
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {toothDiseaseMode === 'disease' ? '病名を入力してください' : '処置を入力してください'}
                </p>
              </div>
            )}

            {/* Dental Chart - P検査形式（2段表示） */}
            <div className="space-y-1">
              {/* Upper jaw */}
              <div className="flex gap-0.5">
                {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => {
                  const toothStr = tooth.toString()
                  const hasDisease = selectedDiseases.some(d => d.tooth === toothStr)
                  const hasTreatment = selectedTreatments.some(t => t.tooth === toothStr)
                  return (
                    <button
                      key={tooth}
                      onClick={() => handleToothSelect(toothStr)}
                      className={`
                        text-xs py-1.5 px-1 rounded border transition-colors relative flex-1 min-w-0
                        ${selectedTooth === toothStr
                          ? 'bg-blue-500 text-white border-blue-600 font-semibold'
                          : hasDisease || hasTreatment
                          ? 'bg-amber-50 hover:bg-amber-100 border-amber-400'
                          : 'bg-white hover:bg-blue-50 border-gray-300'
                        }
                      `}
                    >
                      <span className="text-[10px]">{tooth}</span>
                      {(hasDisease || hasTreatment) && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Lower jaw */}
              <div className="flex gap-0.5">
                {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(tooth => {
                  const toothStr = tooth.toString()
                  const hasDisease = selectedDiseases.some(d => d.tooth === toothStr)
                  const hasTreatment = selectedTreatments.some(t => t.tooth === toothStr)
                  return (
                    <button
                      key={tooth}
                      onClick={() => handleToothSelect(toothStr)}
                      className={`
                        text-xs py-1.5 px-1 rounded border transition-colors relative flex-1 min-w-0
                        ${selectedTooth === toothStr
                          ? 'bg-blue-500 text-white border-blue-600 font-semibold'
                          : hasDisease || hasTreatment
                          ? 'bg-amber-50 hover:bg-amber-100 border-amber-400'
                          : 'bg-white hover:bg-blue-50 border-gray-300'
                        }
                      `}
                    >
                      <span className="text-[10px]">{tooth}</span>
                      {(hasDisease || hasTreatment) && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <p className="text-xs text-gray-500">
                💡 歯をクリック → 病名選択 → 処置が自動提案
              </p>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                  <span className="text-gray-500">未処理</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-amber-50 border border-amber-400 rounded relative">
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  </div>
                  <span className="text-gray-500">病名/処置あり</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded"></div>
                  <span className="text-gray-500">選択中</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Billing Summary */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              請求サマリ
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">保険点数:</span>
                <span className="font-bold text-lg">{totalPoints.toLocaleString()}点</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-2">
                <span className="text-gray-600">請求金額:</span>
                <span className="font-bold text-lg text-blue-600">¥{totalAmount.toLocaleString()}</span>
              </div>
              {selectedTreatments.length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-1">
                  <p className="text-xs text-gray-500">内訳:</p>
                  {selectedTreatments.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate max-w-[150px]">{t.name}</span>
                      <span className="font-medium">{t.points}点</span>
                    </div>
                  ))}
                  {selectedTreatments.length > 3 && (
                    <p className="text-xs text-gray-400">他 {selectedTreatments.length - 3}件</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Main Input Area (2 columns) */}
        <div className="col-span-2 space-y-4">
          {/* S: Subjective (主訴) */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">S: 主訴</h3>
            <Textarea
              placeholder="患者の主訴を入力..."
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </Card>

          {/* O: Objective (所見・病名) */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">O: 所見（病名）</h3>

            {/* Selected Diseases */}
            <div className="space-y-2 mb-3">
              {selectedDiseases.map((disease) => (
                <div
                  key={disease.id}
                  className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-500">{disease.code}</span>
                    <span className="text-sm">
                      {disease.tooth && (
                        <span className="font-semibold text-blue-600 mr-1">{disease.tooth}番:</span>
                      )}
                      {formatDiseaseName(disease.name)}
                    </span>
                    {disease.icd10Code && (
                      <span className="text-xs text-gray-400">({disease.icd10Code})</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDisease(disease.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Disease Search */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="病名を検索... (例: う蝕、歯肉炎)"
                  value={diseaseSearchQuery}
                  onChange={(e) => setDiseaseSearchQuery(e.target.value)}
                  onFocus={() => diseaseSearchResults.length > 0 && setShowDiseaseResults(true)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Disease Search Results */}
              {showDiseaseResults && diseaseSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {diseaseSearchResults.map((disease) => (
                    <button
                      key={disease.id}
                      onClick={() => addDisease(disease)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{formatDiseaseName(disease.name)}</span>
                          {disease.kana && (
                            <span className="text-xs text-gray-400 ml-2">({disease.kana})</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-gray-500">{disease.code}</span>
                          {disease.icd10_code && (
                            <span className="text-xs text-blue-600">{disease.icd10_code}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              placeholder="客観的な所見を記載..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              className="text-sm mt-3"
            />
          </Card>

          {/* A: Assessment (診療行為) */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">A: 診療行為</h3>

            {/* Selected Treatments */}
            <div className="space-y-2 mb-3">
              {selectedTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-500">{treatment.code}</span>
                    <span className="text-sm">
                      {treatment.tooth && (
                        <span className="font-semibold text-green-600 mr-1">{treatment.tooth}番:</span>
                      )}
                      {treatment.name}
                    </span>
                    {treatment.relatedDiseaseId && (
                      <span className="text-xs text-gray-400 italic">
                        (病名関連)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-green-700">{treatment.points}点</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTreatment(treatment.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* 処置セットボタン */}
            {treatmentSets.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 mr-2 flex items-center">処置セット:</span>
                {treatmentSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => openTreatmentSetModal(set)}
                    className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                  >
                    {set.name}
                  </button>
                ))}
              </div>
            )}

            {/* Treatment Search */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="診療行為を検索... (例: CR充填、浸潤麻酔)"
                  value={treatmentSearchQuery}
                  onChange={(e) => setTreatmentSearchQuery(e.target.value)}
                  onFocus={() => treatmentSearchResults.length > 0 && setShowTreatmentResults(true)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Treatment Search Results */}
              {showTreatmentResults && treatmentSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {treatmentSearchResults.map((treatment) => (
                    <button
                      key={treatment.id}
                      onClick={() => addTreatment(treatment)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-medium">{treatment.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({treatment.category})</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-mono text-gray-500">{treatment.code}</span>
                          <span className="text-sm font-bold text-green-600">{treatment.points}点</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              placeholder="診断・評価を記載..."
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              rows={2}
              className="text-sm mt-3"
            />
          </Card>

          {/* P: Plan (計画) */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-2">P: 治療計画</h3>
            <Textarea
              placeholder="今後の治療計画を記載..."
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  テンプレート
                </Button>

                {/* Template Dropdown */}
                {showTemplates && (
                  <div className="absolute z-20 left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-gray-500 px-2 py-1">よく使う組み合わせ</p>
                      {COMMON_DISEASE_TREATMENT_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                        >
                          <p className="font-medium text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {template.diseases.map(d => d.name).join(', ')}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {template.treatments.map(t => t.name).join(', ')}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm">
                <Mic className="w-4 h-4 mr-2" />
                音声入力
              </Button>
            </div>
            <Button
              onClick={saveMedicalRecord}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={errors.length > 0}
            >
              <Save className="w-4 h-4 mr-2" />
              カルテ保存
            </Button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* 処置セット選択モーダル */}
      <TreatmentSetModal
        isOpen={showTreatmentSetModal}
        onClose={() => setShowTreatmentSetModal(false)}
        treatmentSet={selectedTreatmentSet}
        onApply={applyTreatmentSet}
      />

      {/* 必須記載項目フォーム */}
      {pendingTreatmentWithFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg mx-4">
            <TreatmentRequiredFieldsForm
              treatmentCode={pendingTreatmentWithFields.treatment.code}
              treatmentName={pendingTreatmentWithFields.treatment.name}
              onSubmit={handleRequiredFieldsSubmit}
              onCancel={() => setPendingTreatmentWithFields(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
