'use client'

import { useState } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'
import { Eye, Activity, Ruler } from 'lucide-react'
import { VisualExamTab } from './visual/visual-exam-tab'
import { PeriodontalExamTab } from './periodontal-exam-tab'
import { MftMeasurementsPage } from './mft/mft-measurements-page'

interface ExaminationTabProps {
  patientId: string
}

type SubTab = 'visual' | 'periodontal' | 'measurements'

const subTabs = [
  { id: 'visual' as SubTab, label: '視診', icon: Eye },
  { id: 'periodontal' as SubTab, label: 'P検査', icon: Activity },
  { id: 'measurements' as SubTab, label: '測定記録', icon: Ruler },
]

export function ExaminationTab({ patientId }: ExaminationTabProps) {
  const clinicId = useClinicId()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('periodontal')

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'visual':
        return <VisualExamTab patientId={patientId} />
      case 'periodontal':
        return <PeriodontalExamTab patientId={patientId} />
      case 'measurements':
        return <MftMeasurementsPage patientId={patientId} clinicId={clinicId} />
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
