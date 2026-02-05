'use client'

import { useState } from 'react'
import { useClinicId } from '@/hooks/use-clinic-id'
import { Calendar, Bell, FileClock } from 'lucide-react'
import { AppointmentsTab } from './appointments-tab'
import { PatientNotificationTab } from './patient-notification-tab'
import { AppointmentLogsTab } from './appointment-logs-tab'

interface AppointmentsNotificationsTabProps {
  patientId: string
}

type SubTab = 'appointments' | 'notifications' | 'logs'

const subTabs = [
  { id: 'appointments' as SubTab, label: '予約', icon: Calendar },
  { id: 'notifications' as SubTab, label: '通知', icon: Bell },
  { id: 'logs' as SubTab, label: '予約操作ログ', icon: FileClock },
]

export function AppointmentsNotificationsTab({ patientId }: AppointmentsNotificationsTabProps) {
  const clinicId = useClinicId()
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('appointments')

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case 'appointments':
        return <AppointmentsTab patientId={patientId} />
      case 'notifications':
        return <PatientNotificationTab patientId={patientId} clinicId={clinicId} />
      case 'logs':
        return <AppointmentLogsTab patientId={patientId} />
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
