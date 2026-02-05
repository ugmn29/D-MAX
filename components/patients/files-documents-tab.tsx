'use client'

import { useState } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'
import { FileCheck, Folder } from 'lucide-react'
import { MedicalDocumentsTab } from './medical-documents-tab'

interface FilesDocumentsTabProps {
  patientId: string
}

type SubTab = 'documents' | 'files'

const subTabs = [
  { id: 'documents' as SubTab, label: '提供文書', icon: FileCheck },
  { id: 'files' as SubTab, label: 'ファイル', icon: Folder },
]

export function FilesDocumentsTab({ patientId }: FilesDocumentsTabProps) {
  const clinicId = useClinicId()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('documents')

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'documents':
        return <MedicalDocumentsTab patientId={patientId} clinicId={clinicId} />
      case 'files':
        return <div className="p-6 text-center text-gray-500">ファイル機能（開発中）</div>
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
