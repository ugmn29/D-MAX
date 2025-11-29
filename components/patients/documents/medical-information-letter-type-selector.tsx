'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, FileText, Search, ArrowRightLeft } from 'lucide-react'
import { MEDICAL_INFORMATION_LETTER_TYPES, MedicalInformationLetterType } from '@/types/medical-information-letter'

interface MedicalInformationLetterTypeSelectorProps {
  onSelectType: (type: MedicalInformationLetterType) => void
  onCancel: () => void
}

export function MedicalInformationLetterTypeSelector({
  onSelectType,
  onCancel
}: MedicalInformationLetterTypeSelectorProps) {
  const getIcon = (type: MedicalInformationLetterType) => {
    switch (type) {
      case '診療情報提供料(I)':
        return <FileText className="w-8 h-8" />
      case '診療情報提供料(II)':
        return <Search className="w-8 h-8" />
      case '診療情報等連携共有料1':
      case '診療情報等連携共有料2':
        return <ArrowRightLeft className="w-8 h-8" />
    }
  }

  const getColorClass = (type: MedicalInformationLetterType) => {
    switch (type) {
      case '診療情報提供料(I)':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:border-blue-500'
      case '診療情報提供料(II)':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:border-purple-500'
      case '診療情報等連携共有料1':
        return 'bg-green-100 text-green-800 border-green-300 hover:border-green-500'
      case '診療情報等連携共有料2':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:border-orange-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">診療情報提供書のタイプを選択</h3>
          <p className="text-sm text-gray-500 mt-1">作成する診療情報提供書の種類を選択してください</p>
        </div>
        <Button onClick={onCancel} variant="outline" size="sm">
          <X className="w-4 h-4 mr-2" />
          戻る
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEDICAL_INFORMATION_LETTER_TYPES.map((typeInfo) => (
          <Card
            key={typeInfo.type}
            className={`cursor-pointer hover:shadow-lg transition-all border-2 ${getColorClass(typeInfo.type)}`}
            onClick={() => onSelectType(typeInfo.type)}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${getColorClass(typeInfo.type)}`}>
                    {getIcon(typeInfo.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{typeInfo.label}</h4>
                    <p className="text-sm text-gray-600 mb-2">{typeInfo.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{typeInfo.code}</span>
                      <span className="font-semibold text-blue-600">{typeInfo.points}点</span>
                      <span>{typeInfo.frequency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <h4 className="font-semibold mb-2">各タイプの違い</h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">I:</span>
            <span>他の医療機関への患者紹介（月1回まで算定可能）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 font-bold">II:</span>
            <span>セカンドオピニオンのための情報提供（制限なし）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">連携共有1:</span>
            <span>歯科から医科機関・薬局への情報提供依頼（3か月に1回）</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">連携共有2:</span>
            <span>医科機関からの依頼に応じた情報提供（3か月に1回）</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
