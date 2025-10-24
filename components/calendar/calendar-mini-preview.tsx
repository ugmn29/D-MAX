'use client'

import { useMemo } from 'react'
import { getPatientIcon } from '@/lib/constants/patient-icons'

interface CalendarMiniPreviewProps {
  timeSlotMinutes: number
  cellHeight: number
  displayItems: string[]
}

// ダミーデータ（スタッフ1列のみ）
const DUMMY_STAFF = [
  { id: '1', name: '田中Dr' },
]

const DUMMY_APPOINTMENTS = [
  {
    id: '1',
    staffId: '1',
    startTime: '09:00',
    endTime: '09:30',
    patientName: '山田',
    patientLastName: '山田',
    patientFirstName: '太郎',
    medicalCardNumber: '1001',
    furigana: 'ヤマダタロウ',
    furiganaLast: 'ヤマダ',
    furiganaFirst: 'タロウ',
    age: 45,
    treatmentContent: '検診',
    menuColor: '#93C5FD', // 青系
    patientIconIds: ['caution', 'implant'], // 患者アイコンID（マスタ設定から複数表示可能）
    patientRank: 'VIP',
    patientColor: '#FFD700',
    assignedStaff: '田中Dr / 佐藤助手',
  },
  {
    id: '2',
    staffId: '1',
    startTime: '10:00',
    endTime: '10:30',
    patientName: '佐藤',
    patientLastName: '佐藤',
    patientFirstName: '花子',
    medicalCardNumber: '1002',
    furigana: 'サトウハナコ',
    furiganaLast: 'サトウ',
    furiganaFirst: 'ハナコ',
    age: 32,
    treatmentContent: '虫歯治療',
    menuColor: '#FCA5A5', // 赤系
    patientIconIds: ['pregnant'], // 患者アイコンID（妊娠・授乳中）
    patientRank: 'A',
    patientColor: '#90EE90',
    assignedStaff: '佐藤衛生士',
  },
  {
    id: '3',
    staffId: '1',
    startTime: '11:00',
    endTime: '11:30',
    patientName: '田中',
    patientLastName: '田中',
    patientFirstName: '一郎',
    medicalCardNumber: '1003',
    furigana: 'タナカイチロウ',
    furiganaLast: 'タナカ',
    furiganaFirst: 'イチロウ',
    age: 28,
    treatmentContent: 'クリーニング',
    menuColor: '#86EFAC', // 緑系
    patientIconIds: [], // 患者アイコンなし
    patientRank: 'B',
    patientColor: '#87CEEB',
    assignedStaff: '山田助手',
  },
]

export function CalendarMiniPreview({
  timeSlotMinutes,
  cellHeight,
  displayItems,
}: CalendarMiniPreviewProps) {
  // 時間スロットを生成（9:00-12:00）
  const timeSlots = useMemo(() => {
    const slots: { time: string; minute: number }[] = []
    const startHour = 9
    const endHour = 12

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotMinutes) {
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          minute,
        })
      }
    }

    return slots
  }, [timeSlotMinutes])

  // 時間を分に変換
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + minute
  }

  // 予約ブロックの位置とサイズを計算
  const appointmentBlocks = useMemo(() => {
    return DUMMY_APPOINTMENTS.map((apt) => {
      const startMinutes = timeToMinutes(apt.startTime)
      const endMinutes = timeToMinutes(apt.endTime)
      const startHour = 9 // 9:00から開始

      const top = ((startMinutes - startHour * 60) / timeSlotMinutes) * cellHeight
      const height = ((endMinutes - startMinutes) / timeSlotMinutes) * cellHeight

      return {
        ...apt,
        top,
        height,
      }
    })
  }, [timeSlotMinutes, cellHeight])

  // 各予約ブロックの表示内容を生成（表示項目の順序に従う）
  const renderAppointmentContent = (apt: any) => {
    const firstLine: JSX.Element[] = []
    const otherItems: JSX.Element[] = []

    displayItems.forEach((itemId, index) => {
      let content: JSX.Element | null = null

      switch (itemId) {
        case 'reservation_time':
          content = <span key={itemId}>{apt.startTime} - {apt.endTime}</span>
          firstLine.push(content)
          break

        case 'medical_card_number':
          if (apt.medicalCardNumber) {
            content = <span key={itemId}>{firstLine.length > 0 ? ' / ' : ''}{apt.medicalCardNumber}</span>
            firstLine.push(content)
          }
          break

        case 'name':
          if (apt.patientLastName && apt.patientFirstName) {
            content = <span key={itemId} className="font-medium">{apt.patientLastName} {apt.patientFirstName}</span>
            otherItems.push(content)
          }
          break

        case 'furigana':
          if (apt.furigana) {
            content = <span key={itemId} className="text-xs">{apt.furiganaLast} {apt.furiganaFirst}</span>
            otherItems.push(content)
          }
          break

        case 'age':
          if (apt.age) {
            content = <span key={itemId}>{apt.age}歳</span>
            otherItems.push(content)
          }
          break

        case 'patient_icon':
          if (apt.patientIconIds && apt.patientIconIds.length > 0) {
            content = (
              <span key={itemId} className="inline-flex gap-1">
                {apt.patientIconIds.map((iconId: string, i: number) => {
                  const iconData = getPatientIcon(iconId)
                  if (!iconData) return null
                  const IconComponent = iconData.icon
                  return (
                    <IconComponent
                      key={i}
                      className="w-3.5 h-3.5 text-gray-700"
                      title={iconData.title}
                    />
                  )
                })}
              </span>
            )
            otherItems.push(content)
          }
          break

        case 'patient_rank':
          if (apt.patientRank) {
            content = (
              <span key={itemId} className="px-1 py-0.5 bg-white/50 rounded text-xs font-semibold">
                {apt.patientRank}
              </span>
            )
            otherItems.push(content)
          }
          break

        case 'patient_color':
          if (apt.patientColor) {
            content = (
              <span
                key={itemId}
                className="inline-block w-3 h-3 rounded-full border border-black/20"
                style={{ backgroundColor: apt.patientColor }}
              />
            )
            otherItems.push(content)
          }
          break

        case 'treatment_content':
          if (apt.treatmentContent) {
            content = <span key={itemId}>{apt.treatmentContent}</span>
            otherItems.push(content)
          }
          break

        case 'staff':
          if (apt.assignedStaff) {
            content = <span key={itemId} className="text-xs">担当: {apt.assignedStaff}</span>
            otherItems.push(content)
          }
          break
      }
    })

    return (
      <>
        {/* 1段目: 診療時間と診察券番号のみ */}
        {firstLine.length > 0 && (
          <div className="text-xs leading-tight mb-1">
            {firstLine}
          </div>
        )}

        {/* 2段目以降: その他の項目（折り返しあり） */}
        {otherItems.length > 0 && (
          <div className="text-xs leading-tight flex flex-wrap items-center gap-1">
            {otherItems.map((item, idx) => (
              <span key={idx}>
                {item}
                {idx < otherItems.length - 1 && <span className="mx-0.5">/</span>}
              </span>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">プレビュー</h3>
        <p className="text-xs text-gray-500 mt-1">
          変更内容が即座に反映されます
        </p>
      </div>

      {/* カレンダーグリッド */}
      <div className="p-4">
        <div className="border border-gray-200 rounded overflow-hidden flex" style={{ height: '500px' }}>
          {/* 時間軸 */}
          <div className="w-16 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
            {/* ヘッダー空白 */}
            <div className="h-11 border-b border-gray-200 bg-gray-50"></div>
            {/* 時間スロット */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-center text-xs text-gray-500 ${
                    slot.minute === 0 ? 'font-medium' : ''
                  }`}
                  style={{
                    height: `${cellHeight}px`,
                    borderTop:
                      slot.minute === 0
                        ? '0.5px solid #6B7280'
                        : '0.25px solid #E5E7EB',
                  }}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>

          {/* スタッフ列 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* スタッフヘッダー */}
            <div className="h-11 flex border-b border-gray-200">
              {DUMMY_STAFF.map((staff) => (
                <div
                  key={staff.id}
                  className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50 h-full"
                >
                  <div className="text-center px-2">
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {staff.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* タイムスロット + 予約ブロック */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="flex relative">
                {DUMMY_STAFF.map((staff) => (
                  <div key={staff.id} className="flex-1 border-r border-gray-200">
                    {/* タイムスロット背景 */}
                    {timeSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-white"
                        style={{
                          height: `${cellHeight}px`,
                          borderTop:
                            slot.minute === 0
                              ? '0.5px solid #6B7280'
                              : '0.25px solid #E5E7EB',
                        }}
                      />
                    ))}
                  </div>
                ))}

                {/* 予約ブロック（絶対配置） */}
                {appointmentBlocks
                  .filter((apt) => apt.staffId === DUMMY_STAFF[0].id)
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="absolute rounded-md text-xs cursor-pointer hover:shadow-md overflow-hidden"
                      style={{
                        top: `${apt.top}px`,
                        height: `${apt.height}px`,
                        left: '0%',
                        width: '100%',
                        backgroundColor: apt.menuColor,
                        color: 'black',
                        padding: '4px 6px',
                        zIndex: 10,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {renderAppointmentContent(apt)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
