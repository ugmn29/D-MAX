/**
 * 処置必須記載項目フォーム
 * Treatment Required Fields Form
 */

'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  getTreatmentRequiredFields,
  type TreatmentRequiredField
} from '@/lib/api/treatment-sets'

interface TreatmentRequiredFieldsFormProps {
  treatmentCode: string
  treatmentName: string
  onSubmit: (fieldValues: Record<string, any>) => void
  onCancel: () => void
}

export function TreatmentRequiredFieldsForm({
  treatmentCode,
  treatmentName,
  onSubmit,
  onCancel
}: TreatmentRequiredFieldsFormProps) {
  const [fields, setFields] = useState<TreatmentRequiredField[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequiredFields()
  }, [treatmentCode])

  const loadRequiredFields = async () => {
    setLoading(true)
    try {
      const data = await getTreatmentRequiredFields(treatmentCode)
      setFields(data)

      // 初期値設定
      const initialValues: Record<string, any> = {}
      data.forEach(field => {
        if (field.field_type === 'checkbox') {
          initialValues[field.field_name] = false
        } else {
          initialValues[field.field_name] = ''
        }
      })
      setFieldValues(initialValues)
    } catch (error) {
      console.error('必須記載項目の読み込みエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }))

    // エラーをクリア
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach(field => {
      if (field.is_required) {
        const value = fieldValues[field.field_name]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.field_name] = `${field.field_name}は必須項目です`
        }
      }

      // バリデーションルール適用
      if (field.validation_rule && fieldValues[field.field_name]) {
        // TODO: 正規表現によるバリデーション
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    onSubmit(fieldValues)
  }

  const handleSkip = () => {
    // 必須項目がない、または全てオプションの場合はスキップ可能
    const hasRequiredFields = fields.some(f => f.is_required)
    if (!hasRequiredFields) {
      onSubmit({})
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center text-gray-500">読み込み中...</div>
      </div>
    )
  }

  // 必須記載項目がない場合は何も表示しない
  if (fields.length === 0) {
    return null
  }

  const hasRequiredFields = fields.some(f => f.is_required)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {treatmentName} - 記載項目
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            保険算定に必要な情報を入力してください
            {!hasRequiredFields && '（すべて任意項目です）'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.field_name}
              {field.is_required && (
                <span className="text-red-600 ml-1">*</span>
              )}
            </label>

            {field.field_type === 'text' && (
              <input
                type="text"
                value={fieldValues[field.field_name] || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.placeholder || ''}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors[field.field_name]
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                `}
              />
            )}

            {field.field_type === 'number' && (
              <input
                type="number"
                value={fieldValues[field.field_name] || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                placeholder={field.placeholder || ''}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors[field.field_name]
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                `}
              />
            )}

            {field.field_type === 'select' && (
              <select
                value={fieldValues[field.field_name] || ''}
                onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
                  ${
                    errors[field.field_name]
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }
                `}
              >
                <option value="">{field.placeholder || '選択してください'}</option>
                {field.field_options?.options?.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}

            {field.field_type === 'checkbox' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fieldValues[field.field_name] || false}
                  onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {field.placeholder || field.field_name}
                </span>
              </label>
            )}

            {field.help_text && (
              <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
            )}

            {errors[field.field_name] && (
              <p className="text-xs text-red-600 mt-1">{errors[field.field_name]}</p>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-2">
          {!hasRequiredFields && (
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              スキップ
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            確定
          </button>
        </div>
      </form>
    </div>
  )
}
