'use client'

import { useState } from 'react'
import TrainingFlowChart from '@/components/training/TrainingFlowChart'
import TrainingProgressChart from '@/components/training/TrainingProgressChart'
import PatientIssuesTab from '@/components/training/PatientIssuesTab'
import { useClinicId } from '@/hooks/use-clinic-id'

interface PatientTrainingTabsProps {
  patientId: string
}

export default function PatientTrainingTabs({ patientId }: PatientTrainingTabsProps) {
  const clinicId = useClinicId()
  const [activeTab, setActiveTab] = useState<'training' | 'progress' | 'issues'>('training')

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('training')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'training'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎯 トレーニング管理
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'progress'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📈 進捗グラフ
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'issues'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚠️ 課題
          </button>
        </div>
      </div>

      {/* トレーニング管理タブ */}
      {activeTab === 'training' && (
        <TrainingFlowChart patientId={patientId} clinicId={clinicId} />
      )}

      {/* 進捗グラフタブ */}
      {activeTab === 'progress' && (
        <TrainingProgressChart patientId={patientId} />
      )}

      {/* 課題タブ */}
      {activeTab === 'issues' && (
        <PatientIssuesTab patientId={patientId} />
      )}
    </div>
  )
}
