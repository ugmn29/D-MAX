'use client'

import { useState } from 'react'
import { User, ClipboardList, Shield } from 'lucide-react'
import { BasicInfoTab } from './basic-info-tab'
import { QuestionnaireTab } from './questionnaire-tab'

interface PatientInfoTabProps {
  patientId: string
}

type SubTab = 'info' | 'questionnaire' | 'insurance'

const subTabs = [
  { id: 'info' as SubTab, label: '患者情報', icon: User },
  { id: 'questionnaire' as SubTab, label: '問診', icon: ClipboardList },
  { id: 'insurance' as SubTab, label: '保険・公費', icon: Shield },
]

export function PatientInfoTab({ patientId }: PatientInfoTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('info')

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'info':
        return <BasicInfoTab patientId={patientId} />
      case 'questionnaire':
        return <QuestionnaireTab patientId={patientId} />
      case 'insurance':
        return <div className="p-6 text-center text-gray-500">保険・公費機能（開発中）</div>
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* サブタブナビゲーション */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-4">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm
                  transition-colors duration-200
                  ${
                    activeSubTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* サブタブコンテンツ */}
      <div className="flex-1 overflow-auto">
        {renderSubTabContent()}
      </div>
    </div>
  )
}
