'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  User,
  Eye,
  Activity,
  FileText,
  Target,
  History,
  Calendar,
  ClipboardList,
  Shield,
  Folder,
  BarChart3,
  Search,
  FileClock,
  TrendingUp,
  AlertCircle,
  Bell,
  FileCheck,
  Stethoscope
} from 'lucide-react'
import { BasicInfoTab } from './basic-info-tab'
import { QuestionnaireTab } from './questionnaire-tab'
import { AppointmentsTab } from './appointments-tab'
import { AppointmentLogsTab } from './appointment-logs-tab'
import { SubKarteTab } from './subkarte-tab'
import PatientTrainingTabs from '@/components/training/PatientTrainingTabs'
import { PeriodontalExamTab } from './periodontal-exam-tab'
import { VisualExamTab } from './visual/visual-exam-tab'
import { PatientNotificationTab } from './patient-notification-tab'
import { MedicalDocumentsTab } from './medical-documents-tab'
import { EMRTab } from './emr-tab'
import { TreatmentPlanTab } from './treatment-plan-tab'

interface PatientDetailTabsProps {
  patientId: string
}

const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

// タブ定義
const tabs = [
  { id: 'basic', label: '基本情報', icon: User, available: true },
  { id: 'emr', label: '電子カルテ', icon: Stethoscope, available: true },
  { id: 'visual', label: '視診', icon: Eye, available: true },
  { id: 'p-test', label: 'P検査', icon: Activity, available: true },
  { id: 'sub-chart', label: 'サブカルテ', icon: FileText, available: true },
  { id: 'treatment-plan', label: '治療計画', icon: BarChart3, available: true },
  { id: 'training', label: 'トレーニング', icon: Target, available: true },
  { id: 'history', label: '診療履歴', icon: History, available: true },
  { id: 'appointments', label: '予約', icon: Calendar, available: true },
  { id: 'notification', label: '通知', icon: Bell, available: true },
  { id: 'questionnaire', label: '問診', icon: ClipboardList, available: true },
  { id: 'insurance', label: '保険・公費', icon: Shield, available: true },
  { id: 'files', label: 'ファイル', icon: Folder, available: true },
  { id: 'medical-documents', label: '提供文書', icon: FileCheck, available: true },
  { id: 'access-history', label: 'アクセス履歴', icon: Search, available: true },
  { id: 'appointment-logs', label: '予約操作ログ', icon: FileClock, available: true }
]

export function PatientDetailTabs({ patientId }: PatientDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('basic')

  const renderTabContent = () => {
    console.log('PatientDetailTabs: タブコンテンツをレンダリング', { activeTab, patientId })
    switch (activeTab) {
      case 'basic':
        return <BasicInfoTab patientId={patientId} />
      case 'emr':
        return <EMRTab patientId={patientId} clinicId={DEMO_CLINIC_ID} />
      case 'visual':
        return <VisualExamTab patientId={patientId} />
      case 'p-test':
        return <PeriodontalExamTab patientId={patientId} />
      case 'sub-chart':
        return <SubKarteTab key={`subkarte-${Date.now()}`} patientId={patientId} />
      case 'training':
        return <PatientTrainingTabs patientId={patientId} />
      case 'history':
        return <div className="p-6 text-center text-gray-500">診療履歴機能（開発中）</div>
      case 'appointments':
        console.log('PatientDetailTabs: 予約タブをレンダリング', { patientId })
        return <AppointmentsTab patientId={patientId} />
      case 'notification':
        return <PatientNotificationTab patientId={patientId} clinicId={DEMO_CLINIC_ID} />
      case 'questionnaire':
        return <QuestionnaireTab patientId={patientId} />
      case 'insurance':
        return <div className="p-6 text-center text-gray-500">保険・公費機能（開発中）</div>
      case 'files':
        return <div className="p-6 text-center text-gray-500">ファイル機能（開発中）</div>
      case 'medical-documents':
        return <MedicalDocumentsTab patientId={patientId} clinicId={DEMO_CLINIC_ID} />
      case 'treatment-plan':
        return <TreatmentPlanTab patientId={patientId} />
      case 'access-history':
        return <div className="p-6 text-center text-gray-500">アクセス履歴機能（開発中）</div>
      case 'appointment-logs':
        console.log('PatientDetailTabs: AppointmentLogsTabをレンダリング', { patientId })
        return <AppointmentLogsTab patientId={patientId} />
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