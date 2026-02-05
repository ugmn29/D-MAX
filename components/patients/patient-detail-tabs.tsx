'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  User,
  FileText,
  Target,
  Calendar,
  Folder,
  BarChart3,
  Stethoscope,
  Microscope
} from 'lucide-react'
import { SubKarteTab } from './subkarte-tab'
import PatientTrainingTabs from '@/components/training/PatientTrainingTabs'
import { useClinicId } from '@/hooks/use-clinic-id'
import { EMRTab } from './emr-tab'
import { TreatmentPlanTab } from './treatment-plan-tab'
import { ExaminationTab } from './examination-tab'
import { PatientInfoTab } from './patient-info-tab'
import { AppointmentsNotificationsTab } from './appointments-notifications-tab'
import { FilesDocumentsTab } from './files-documents-tab'

interface PatientDetailTabsProps {
  patientId: string
}

// タブ定義
const tabs = [
  { id: 'basic', label: '基本情報', icon: User, available: true },
  { id: 'emr', label: '電子カルテ', icon: Stethoscope, available: true },
  { id: 'examination', label: '検査', icon: Microscope, available: true },
  { id: 'sub-chart', label: 'サブカルテ', icon: FileText, available: true },
  { id: 'treatment-plan', label: '治療計画', icon: BarChart3, available: true },
  { id: 'training', label: 'トレーニング', icon: Target, available: true },
  { id: 'appointments-notifications', label: '予約・通知', icon: Calendar, available: true },
  { id: 'files-documents', label: 'ファイル・文書', icon: Folder, available: true }
]

export function PatientDetailTabs({ patientId }: PatientDetailTabsProps) {
  const clinicId = useClinicId()
  const [activeTab, setActiveTab] = useState('basic')

  const renderTabContent = () => {
    console.log('PatientDetailTabs: タブコンテンツをレンダリング', { activeTab, patientId })
    switch (activeTab) {
      case 'basic':
        return <PatientInfoTab patientId={patientId} />
      case 'emr':
        return <EMRTab patientId={patientId} clinicId={clinicId} />
      case 'examination':
        return <ExaminationTab patientId={patientId} />
      case 'sub-chart':
        return <SubKarteTab key={`subkarte-${Date.now()}`} patientId={patientId} />
      case 'training':
        return <PatientTrainingTabs patientId={patientId} />
      case 'appointments-notifications':
        console.log('PatientDetailTabs: 予約・通知タブをレンダリング', { patientId })
        return <AppointmentsNotificationsTab patientId={patientId} />
      case 'files-documents':
        console.log('PatientDetailTabs: ファイル・文書タブをレンダリング', { patientId })
        return <FilesDocumentsTab patientId={patientId} />
      case 'treatment-plan':
        return <TreatmentPlanTab patientId={patientId} />
      default:
        return <div>タブコンテンツが見つかりません</div>
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* タブナビゲーション（固定） */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => tab.available && setActiveTab(tab.id)}
                onMouseEnter={() => tab.available && setActiveTab(tab.id)}
                disabled={!tab.available}
                className={`
                  flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-all duration-200 rounded-t-md
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : tab.available
                    ? 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300'
                    : 'border-transparent text-gray-300 cursor-not-allowed'
                  }
                `}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${
                  activeTab === tab.id ? 'scale-110' : ''
                }`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* タブコンテンツ（スクロール可能） */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
          <Card>
            <CardContent className="p-6">
              {renderTabContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// 各タブのコンポーネント（プレースホルダー）
// BasicInfoTabは別ファイルからインポート

function VisualInspectionTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">視診</h3>
      <p className="text-gray-600">視診タブのコンテンツがここに表示されます</p>
    </div>
  )
}

function PTestTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">P検査</h3>
      <p className="text-gray-600">P検査タブのコンテンツがここに表示されます</p>
    </div>
  )
}

function SubChartTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">サブカルテ</h3>
      <p className="text-gray-600">サブカルテタブのコンテンツがここに表示されます</p>
    </div>
  )
}

function MedicalHistoryTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">診療履歴</h3>
      <p className="text-gray-600">診療履歴タブのコンテンツがここに表示されます</p>
    </div>
  )
}


// QuestionnaireTabは別ファイルからインポート

function InsuranceTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">保険・公費</h3>
      <p className="text-gray-600">保険・公費タブのコンテンツがここに表示されます</p>
    </div>
  )
}

function FilesTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">ファイル</h3>
      <p className="text-gray-600">ファイルタブのコンテンツがここに表示されます</p>
    </div>
  )
}

function AccessHistoryTab({ patientId }: { patientId: string }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">アクセス履歴</h3>
      <p className="text-gray-600">アクセス履歴タブのコンテンツがここに表示されます</p>
    </div>
  )
}