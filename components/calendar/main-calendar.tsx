'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, Grid3X3, Users } from 'lucide-react'
import { getAppointmentsByDate, createAppointment, updateAppointment, updateAppointmentStatus } from '@/lib/api/appointments'
import { getStaffShiftsByDate } from '@/lib/api/shifts'
import { getBusinessHours, getBreakTimes, getTimeSlotMinutes, getHolidays, getClinicSettings } from '@/lib/api/clinic'
import { getIndividualHolidays } from '@/lib/api/individual-holidays'
import { getUnits, getStaffUnitPriorities } from '@/lib/api/units'
import { Appointment, BusinessHours, BreakTimes, StaffShift } from '@/types/database'
import { AppointmentEditModal } from '@/components/forms/appointment-edit-modal'
import { CancelInfoModal } from '@/components/ui/cancel-info-modal'
import { formatDateForDB } from '@/lib/utils/date'
import { initializeMockData } from '@/lib/utils/mock-mode'
import { timeToMinutes, minutesToTime } from '@/lib/utils/time-validation'
import { PATIENT_ICONS } from '@/lib/constants/patient-icons'

interface MainCalendarProps {
  clinicId: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  timeSlotMinutes: number // 必須パラメータに変更
  displayItems?: string[] // 表示項目の設定
  cellHeight?: number // セルの高さ設定
  displayMode?: 'staff' | 'units' | 'both' // 表示モード
  onDisplayModeChange?: (mode: 'staff' | 'units' | 'both') => void // 表示モード変更コールバック
  onCopyStateChange?: (copiedAppointment: any, isPasteMode: boolean) => void
  onAppointmentCancel?: () => void // 予約キャンセル成功後のコールバック
}

interface TimeSlot {
  time: string
  hour: number
  minute: number
}

interface AppointmentBlock {
  appointment: Appointment
  top: number
  height: number
  staffIndex: number
}

interface WorkingStaff {
  staff: {
    id: string
    name: string
    position: string
  }
  shift_pattern: StaffShift['shift_patterns']
  is_holiday: boolean
}

export function MainCalendar({ clinicId, selectedDate, onDateChange, timeSlotMinutes, displayItems = [], cellHeight = 40, displayMode = 'staff', onDisplayModeChange, onCopyStateChange, onAppointmentCancel }: MainCalendarProps) {
  const [workingStaff, setWorkingStaff] = useState<WorkingStaff[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>({})
  const [breakTimes, setBreakTimes] = useState<BreakTimes>({})
  const [units, setUnits] = useState<any[]>([])
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<any[]>([])

  // 複数選択関連の状態
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])
  const [selectionStart, setSelectionStart] = useState<string | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<string | null>(null)

  const [holidays, setHolidays] = useState<string[]>([])
  const [individualHolidays, setIndividualHolidays] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)
  
  // 予約編集モーダル
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [selectedStaffIndex, setSelectedStaffIndex] = useState<number | undefined>(undefined)
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | undefined>(undefined)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  
  // ドラッグ&ドロップ関連
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrentPosition, setDragCurrentPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartTime, setDragStartTime] = useState<number | null>(null)
  const [dropTargetTime, setDropTargetTime] = useState<string | null>(null)
  const [isDropTargetValid, setIsDropTargetValid] = useState<boolean>(true)
  const [hasMoved, setHasMoved] = useState(false)

  // コピータブ機能関連
  const [copiedAppointment, setCopiedAppointment] = useState<Appointment | null>(null)
  const [isPasteMode, setIsPasteMode] = useState(false)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  
  // ホバー状態管理
  const [hoveredTimeSlot, setHoveredTimeSlot] = useState<string | null>(null)
  const [hoveredStaffIndex, setHoveredStaffIndex] = useState<number | null>(null)
  
  // 選択されたセル状態管理
  const [selectedCell, setSelectedCell] = useState<{timeSlot: string, columnIndex: number} | null>(null)
  const [selectedCells, setSelectedCells] = useState<{timeSlot: string, columnIndex: number}[]>([])
  const [isSelectingCells, setIsSelectingCells] = useState(false)


  // キャンセル情報モーダル
  const [showCancelInfoModal, setShowCancelInfoModal] = useState(false)
  const [selectedCancelledAppointment, setSelectedCancelledAppointment] = useState<Appointment | null>(null)

  // ドラッグ量表示関連
  const [dragDelta, setDragDelta] = useState<{ x: number; y: number; timeSlots: number } | null>(null)

  // ステータス進行の設定（患者ステータス管理ページと同じ）
  const STATUS_CONFIG = {
    '未来院': { color: 'bg-gray-100 text-gray-800 border-gray-300', nextStatus: '遅刻' },
    '遅刻': { color: 'bg-orange-100 text-orange-800 border-orange-300', nextStatus: '来院済み' },
    '来院済み': { color: 'bg-blue-100 text-blue-800 border-blue-300', nextStatus: '診療中' },
    '診療中': { color: 'bg-purple-100 text-purple-800 border-purple-300', nextStatus: '会計' },
    '会計': { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', nextStatus: '終了' },
    '終了': { color: 'bg-green-100 text-green-800 border-green-300', nextStatus: null }
  }

  // ステータス進行のハンドラー
  const handleStatusProgression = async (appointment: Appointment) => {
    const currentStatus = appointment.status
    const nextStatus = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]?.nextStatus
    
    if (!nextStatus) {
      console.log('最終ステータスです')
      return
    }

    try {
      await updateAppointmentStatus(clinicId, appointment.id, nextStatus)
      // 予約データを再読み込み
      const dateString = formatDateForDB(selectedDate)
      const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
      setAppointments(updatedAppointments)
      console.log(`ステータスを ${currentStatus} から ${nextStatus} に変更しました`)
    } catch (error) {
      console.error('ステータス変更エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }


  // リサイズ関連の状態
  const [isResizing, setIsResizing] = useState(false)
  const [resizingAppointment, setResizingAppointment] = useState<Appointment | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartHeight, setResizeStartHeight] = useState<number | null>(null)
  const [resizePreviewHeight, setResizePreviewHeight] = useState<number | null>(null)
  const [resizePreviewEndTime, setResizePreviewEndTime] = useState<string | null>(null)
  
  // スタッフデータのキャッシュ
  const [staffCache, setStaffCache] = useState<Map<string, WorkingStaff[]>>(new Map())
  
  // スクロール同期用のref
  const timeAxisRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // スクロール同期のイベントハンドラー
  const handleTimeAxisScroll = () => {
    if (timeAxisRef.current && gridRef.current) {
      gridRef.current.scrollTop = timeAxisRef.current.scrollTop
    }
  }

  const handleGridScroll = () => {
    if (timeAxisRef.current && gridRef.current) {
      timeAxisRef.current.scrollTop = gridRef.current.scrollTop
    }
  }

  // ドラッグ&ドロップのハンドラー
  const handleAppointmentMouseDown = (e: React.MouseEvent, appointment: Appointment) => {
    e.preventDefault()
    e.stopPropagation()
    
    // キャンセルされた予約はドラッグできない
    if (appointment.status === 'cancelled') {
      console.log('キャンセルされた予約はドラッグできません')
      return
    }
    
    // マウスがセル内のどの位置を掴んだかを記録
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    
    setDragStartTime(Date.now())
    setDragStartPosition({ x: e.clientX, y: e.clientY })
    setDragCurrentPosition({ x: e.clientX, y: e.clientY })
    setDraggedAppointment(appointment)
    setHasMoved(false) // 移動フラグをリセット
    
    // マウスオフセットを保存（後で使用）
    ;(e.currentTarget as any).__dragOffset = { x: offsetX, y: offsetY }
  }

  const handleAppointmentMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && dragStartTime && Date.now() - dragStartTime > 200) {
      // 200ms以上長押しした場合にドラッグ開始
      setIsDragging(true)
    }
    
    if (isDragging && draggedAppointment && dragStartPosition) {
      setDragCurrentPosition({ x: e.clientX, y: e.clientY })
      
      // ドラッグ量を計算
      const deltaX = e.clientX - dragStartPosition.x
      const deltaY = e.clientY - dragStartPosition.y
      const timeSlots = Math.round(deltaY / cellHeight)
      setDragDelta({ x: deltaX, y: deltaY, timeSlots })
      
      // 移動があったことを記録
      if (Math.abs(deltaY) > 5) { // 5px以上移動した場合
        setHasMoved(true)
      }
      
      // ドロップ先の時間スロットとスタッフインデックスを計算
      const dropTarget = calculateDropTarget(e.clientX, e.clientY)
      setDropTargetTime(dropTarget.timeSlot)
      
      // 重複チェック
      if (dropTarget.timeSlot) {
        const startMinutes = timeToMinutes(dropTarget.timeSlot)
        const duration = timeToMinutes(draggedAppointment.end_time) - timeToMinutes(draggedAppointment.start_time)
        const endMinutes = startMinutes + duration
        const newEndTime = minutesToTime(endMinutes)
        
        const hasConflict = checkAppointmentConflict(draggedAppointment, dropTarget.timeSlot, newEndTime)
        setIsDropTargetValid(!hasConflict)
      } else {
        setIsDropTargetValid(true)
      }
    }
  }

  const handleAppointmentMouseUp = async (e: React.MouseEvent) => {
    if (isDragging && draggedAppointment && dragStartPosition) {
      // ドロップ先の時間スロットとスタッフインデックスを計算
      const dropTarget = calculateDropTarget(e.clientX, e.clientY)
      
      if (dropTarget.timeSlot) {
        // 予約を移動（スタッフ間移動も含む）
        await moveAppointment(draggedAppointment, dropTarget.timeSlot, dropTarget.staffIndex)
      }
    }
    
    // ドラッグ状態をリセット
    setIsDragging(false)
    setDraggedAppointment(null)
    setDragStartPosition(null)
    setDragCurrentPosition(null)
    setDragStartTime(null)
    setDropTargetTime(null)
    setIsDropTargetValid(true)
    setDragDelta(null)
    setHasMoved(false)
  }

  // ドロップ先の時間スロットと列インデックスを計算（displayMode対応、スクロール位置考慮）
  const calculateDropTarget = (clientX: number, clientY: number): { timeSlot: string | null; staffIndex: number | null } => {
    if (!gridRef.current) return { timeSlot: null, staffIndex: null }
    
    const rect = gridRef.current.getBoundingClientRect()
    
    // スクロール位置を考慮した相対位置を計算
    const relativeY = clientY - rect.top + gridRef.current.scrollTop
    const relativeX = clientX - rect.left
    
    // 時間スロットの高さを計算（timeSlotsの生成ロジックと一致させる）
    const slotHeight = cellHeight
    const slotIndex = Math.floor(relativeY / slotHeight)
    
    // displayModeに応じて列数を計算
    let totalColumns = 0
    if (displayMode === 'staff') {
      totalColumns = workingStaff.length
    } else if (displayMode === 'units') {
      totalColumns = units.length
    } else if (displayMode === 'both') {
      totalColumns = workingStaff.length + units.length
    }
    
    // 列の幅を計算
    const columnWidth = rect.width / totalColumns
    const columnIndex = Math.floor(relativeX / columnWidth)
    
    console.log('calculateDropTarget デバッグ（displayMode対応）:', {
      clientX,
      clientY,
      rectTop: rect.top,
      rectLeft: rect.left,
      scrollTop: gridRef.current.scrollTop,
      relativeY,
      relativeX,
      slotHeight,
      slotIndex,
      columnWidth,
      columnIndex,
      displayMode,
      totalColumns,
      workingStaffLength: workingStaff.length,
      unitsLength: units.length,
      timeSlotsLength: timeSlots.length,
      calculatedTime: slotIndex >= 0 && slotIndex < timeSlots.length ? timeSlots[slotIndex]?.time : 'out of range',
      calculatedColumn: columnIndex >= 0 && columnIndex < totalColumns ? `column_${columnIndex}` : 'out of range'
    })
    
    // 1枠ごとの制限：有効な時間スロットと列の範囲内でのみ移動を許可
    const timeSlot = (slotIndex >= 0 && slotIndex < timeSlots.length) ? timeSlots[slotIndex].time : null
    const validColumnIndex = (columnIndex >= 0 && columnIndex < totalColumns) ? columnIndex : null
    
    return { timeSlot, staffIndex: validColumnIndex }
  }

  // 休憩時間との重複チェック
  const checkBreakTimeConflict = (newStartTime: string, newEndTime: string): boolean => {
    const newStartMinutes = timeToMinutes(newStartTime)
    const newEndMinutes = timeToMinutes(newEndTime)
    
    // 休憩時間の範囲をチェック（開始時刻ぴったりは除外）
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BreakTimes
    const dayBreaks = breakTimes[dayId]
    
    if (!dayBreaks?.start || !dayBreaks?.end) return false
    
    const breakStartMinutes = timeToMinutes(dayBreaks.start)
    const breakEndMinutes = timeToMinutes(dayBreaks.end)
    
    // 予約の開始時刻が休憩時間の開始時刻ぴったり（例：12:00）の場合は重複しない
    // 予約の終了時刻が休憩時間の開始時刻ぴったり（例：12:00）の場合は重複しない
    const isStartInBreak = newStartMinutes > breakStartMinutes && newStartMinutes < breakEndMinutes
    const isEndInBreak = newEndMinutes > breakStartMinutes && newEndMinutes < breakEndMinutes
    
    const isInBreakTime = isStartInBreak || isEndInBreak
    
    if (isInBreakTime) {
      console.log('休憩時間との重複検出:', {
        startTime: newStartTime,
        endTime: newEndTime,
        breakTime: `${dayBreaks.start} - ${dayBreaks.end}`,
        isStartInBreak,
        isEndInBreak
      })
    }
    
    return isInBreakTime
  }

  // 予約の重複チェック
  const checkAppointmentConflict = (appointment: Appointment, newStartTime: string, newEndTime: string): boolean => {
    const newStartMinutes = timeToMinutes(newStartTime)
    const newEndMinutes = timeToMinutes(newEndTime)
    
    // 同じ予約以外で重複をチェック（キャンセルされた予約は除外）
    const hasConflict = appointments.some(existingAppointment => {
      if (existingAppointment.id === appointment.id) return false // 自分自身は除外
      if (existingAppointment.status === 'cancelled') return false // キャンセルされた予約は除外
      
      const existingStartMinutes = timeToMinutes(existingAppointment.start_time)
      const existingEndMinutes = timeToMinutes(existingAppointment.end_time)
      
      // 時間の重複をチェック
      const isOverlapping = !(newEndMinutes <= existingStartMinutes || newStartMinutes >= existingEndMinutes)
      
      if (isOverlapping) {
        console.log('予約重複検出:', {
          movingAppointment: { id: appointment.id, time: `${newStartTime}-${newEndTime}` },
          conflictingAppointment: { 
            id: existingAppointment.id, 
            time: `${existingAppointment.start_time}-${existingAppointment.end_time}`,
            status: existingAppointment.status
          }
        })
      }
      
      return isOverlapping
    })
    
    return hasConflict
  }

  // 予約の現在位置を計算する関数
  const calculateAppointmentPosition = (appointment: Appointment) => {
    let staffIndex = 0
    let unitIndex = 0
    
    if (displayMode === 'staff') {
      // スタッフ表示モードの場合
      staffIndex = workingStaff.findIndex(staff => 
        staff.staff.id === appointment.staff1_id ||
        staff.staff.id === appointment.staff2_id ||
        staff.staff.id === appointment.staff3_id
      )
      if (staffIndex === -1) staffIndex = 0
    } else if (displayMode === 'units') {
      // ユニット表示モードの場合
      unitIndex = units.findIndex(unit => unit.id === appointment.unit_id)
      if (unitIndex === -1) unitIndex = 0
    } else if (displayMode === 'both') {
      // 両方表示モードの場合
      const staffId = appointment.staff1_id || appointment.staff2_id || appointment.staff3_id
      const workingStaffIndex = workingStaff.findIndex(staff => staff.staff.id === staffId)
      
      if (workingStaffIndex !== -1) {
        // スタッフ列の場合
        staffIndex = workingStaffIndex
      } else {
        // ユニット列の場合
        unitIndex = units.findIndex(unit => unit.id === appointment.unit_id)
        if (unitIndex === -1) unitIndex = 0
        staffIndex = workingStaff.length + unitIndex
      }
    }
    
    return { staffIndex, unitIndex }
  }

  // 予約を移動（1枠ごとに制限、スタッフ間移動対応）
  const moveAppointment = async (appointment: Appointment, newStartTime: string, newStaffIndex: number | null = null) => {
    try {
      // 1枠ごとの制限：有効な時間スロットかチェック
      const isValidTimeSlot = timeSlots.some(slot => slot.time === newStartTime)
      if (!isValidTimeSlot) {
        console.log('無効な時間スロット:', newStartTime)
        return
      }
      
      // 診療時間を計算（元の診療時間を維持）
      const startMinutes = timeToMinutes(newStartTime)
      const duration = timeToMinutes(appointment.end_time) - timeToMinutes(appointment.start_time)
      const endMinutes = startMinutes + duration
      const newEndTime = minutesToTime(endMinutes)
      
      // 終了時間も有効な時間スロットかチェック
      const isValidEndTimeSlot = timeSlots.some(slot => slot.time === newEndTime)
      if (!isValidEndTimeSlot) {
        console.log('無効な終了時間スロット:', newEndTime)
        return
      }
      
      // 予約の重複チェック
      if (checkAppointmentConflict(appointment, newStartTime, newEndTime)) {
        alert(`選択された時間帯（${newStartTime} - ${newEndTime}）には既に他の予約があります`)
        return
      }

      // ドラッグ操作を直接実行（休憩時間チェックは登録時に行う）
      await performDragUpdate(appointment, newStartTime, newEndTime, newStaffIndex)
    } catch (error) {
      console.error('予約移動エラー:', error)
      alert('予約の移動に失敗しました')
    }
  }

  // ドラッグ更新の実際の処理
  const performDragUpdate = async (
    appointment: Appointment,
    newStartTime: string,
    newEndTime: string,
    newStaffIndex: number | null
  ) => {
    try {
      // 更新データを準備
      const updateData: any = {
        start_time: newStartTime,
        end_time: newEndTime,
        appointment_date: formatDateForDB(selectedDate)
      }
      
      // 列間移動の場合、担当者またはユニットを変更
      if (newStaffIndex !== null) {
        if (displayMode === 'staff' && workingStaff[newStaffIndex]) {
          // スタッフ表示モード：スタッフを変更
          const newStaff = workingStaff[newStaffIndex].staff
          updateData.staff1_id = newStaff.id
          
          console.log('スタッフ間移動:', {
            from: appointment.staff1_id,
            to: newStaff.id,
            staffName: newStaff.name
          })
        } else if (displayMode === 'units' && units[newStaffIndex]) {
          // ユニット表示モード：ユニットを変更
          const newUnit = units[newStaffIndex]
          updateData.unit_id = newUnit.id
          
          console.log('ユニット間移動:', {
            from: appointment.unit_id,
            to: newUnit.id,
            unitName: newUnit.name
          })
        } else if (displayMode === 'both') {
          // 両方表示モード：スタッフとユニットの両方を考慮
          const totalColumns = workingStaff.length + units.length
          if (newStaffIndex < workingStaff.length) {
            // スタッフ列
            const newStaff = workingStaff[newStaffIndex].staff
            updateData.staff1_id = newStaff.id
            // ユニットは元のまま（または削除）
            updateData.unit_id = null
            
            console.log('両方表示モード - スタッフ列移動:', {
              from: appointment.staff1_id,
              to: newStaff.id,
              staffName: newStaff.name
            })
          } else {
            // ユニット列
            const unitIndex = newStaffIndex - workingStaff.length
            if (units[unitIndex]) {
              const newUnit = units[unitIndex]
              updateData.unit_id = newUnit.id
              // スタッフは元のまま（または削除）
              updateData.staff1_id = null
              
              console.log('両方表示モード - ユニット列移動:', {
                from: appointment.unit_id,
                to: newUnit.id,
                unitName: newUnit.name
              })
            }
          }
        }
      }
      
      // 予約を更新
      await updateAppointment(appointment.id, updateData)
      
      // 予約一覧を再読み込み
      const dateString = formatDateForDB(selectedDate)
      const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
      setAppointments(updatedAppointments)

      console.log('予約を移動しました（1枠ごと）:', {
        id: appointment.id,
        from: appointment.start_time,
        to: newStartTime,
        endTime: newEndTime,
        staffChanged: newStaffIndex !== null,
        newStaff: newStaffIndex !== null ? workingStaff[newStaffIndex]?.staff.name : '変更なし'
      })
    } catch (error) {
      console.error('予約移動エラー:', error)
      alert('予約の移動に失敗しました')
      throw error
    }
  }

  // リサイズハンドラーのマウスダウン
  const handleResizeMouseDown = (e: React.MouseEvent, appointment: Appointment) => {
    e.stopPropagation()
    e.preventDefault()
    
    // キャンセルされた予約はリサイズできない
    if (appointment.status === 'cancelled') {
      console.log('キャンセルされた予約はリサイズできません')
      return
    }
    
    setIsResizing(true)
    setResizingAppointment(appointment)
    setResizeStartY(e.clientY)
    setHasMoved(false) // 移動フラグをリセット
    
    // 現在の予約の高さを計算
    const startMinutes = timeToMinutes(appointment.start_time)
    const endMinutes = timeToMinutes(appointment.end_time)
    const duration = endMinutes - startMinutes
    const currentHeight = (duration / timeSlotMinutes) * cellHeight
    setResizeStartHeight(currentHeight)
    
    console.log('リサイズ開始:', {
      appointmentId: appointment.id,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      currentHeight,
      duration
    })
  }

  // リサイズ中のマウス移動（1枠ごとに制限）
  const handleResizeMouseMove = (e: React.MouseEvent) => {
    if (!isResizing || !resizingAppointment || !resizeStartY || !resizeStartHeight) return
    
    const deltaY = e.clientY - resizeStartY
    const newHeight = Math.max(cellHeight, resizeStartHeight + deltaY) // 最小1スロット分の高さ
    
    // 移動があったことを記録
    if (Math.abs(deltaY) > 5) { // 5px以上移動した場合
      setHasMoved(true)
    }
    
    // 1枠ごとの制限：時間スロット単位で高さを調整
    const slotCount = Math.round(newHeight / cellHeight)
    const adjustedHeight = slotCount * cellHeight
    const newDuration = slotCount * timeSlotMinutes
    
    // 新しい終了時間を計算
    const startMinutes = timeToMinutes(resizingAppointment.start_time)
    const newEndMinutes = startMinutes + newDuration
    const newEndTime = minutesToTime(newEndMinutes)
    
    // プレビュー表示を更新
    setResizePreviewHeight(adjustedHeight)
    setResizePreviewEndTime(newEndTime)
    
    console.log('リサイズ中（1枠ごと）:', {
      deltaY,
      newHeight,
      slotCount,
      adjustedHeight,
      newDuration,
      newEndTime
    })
  }

  // リサイズ終了（1枠ごとに制限）
  const handleResizeMouseUp = async (e: React.MouseEvent) => {
    if (!isResizing || !resizingAppointment || !resizeStartY || !resizeStartHeight) return
    
    const deltaY = e.clientY - resizeStartY
    const newHeight = Math.max(cellHeight, resizeStartHeight + deltaY)
    
    // 1枠ごとの制限：時間スロット単位で高さを調整
    const slotCount = Math.round(newHeight / cellHeight)
    const adjustedHeight = slotCount * cellHeight
    const newDuration = slotCount * timeSlotMinutes
    
    // 新しい終了時間を計算
    const startMinutes = timeToMinutes(resizingAppointment.start_time)
    const newEndMinutes = startMinutes + newDuration
    const newEndTime = minutesToTime(newEndMinutes)
    
    console.log('リサイズ終了（1枠ごと）:', {
      deltaY,
      newHeight,
      slotCount,
      adjustedHeight,
      newDuration,
      newEndTime
    })
    
    // 重複チェック
    if (checkAppointmentConflict(resizingAppointment, resizingAppointment.start_time, newEndTime)) {
      alert(`選択された時間帯（${resizingAppointment.start_time} - ${newEndTime}）には既に他の予約があります`)
      resetResizeState()
      return
    }

    // リサイズ操作を直接実行（休憩時間チェックは登録時に行う）
    try {
      // 予約を更新
      await updateAppointment(resizingAppointment.id, {
        end_time: newEndTime,
        appointment_date: formatDateForDB(selectedDate)
      })

      // 予約一覧を再読み込み
      const dateString = formatDateForDB(selectedDate)
      const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
      setAppointments(updatedAppointments)
      
      console.log('予約の診療時間を変更しました（1枠ごと）:', {
        id: resizingAppointment.id,
        from: resizingAppointment.end_time,
        to: newEndTime,
        slotCount
      })
    } catch (error) {
      console.error('予約リサイズエラー:', error)
      alert('予約の診療時間変更に失敗しました')
    }
    
    resetResizeState()
  }

  // リサイズ更新の実際の処理
  const performResizeUpdate = async (appointment: Appointment, newEndTime: string) => {
    try {
      await updateAppointment(appointment.id, {
        end_time: newEndTime,
        appointment_date: formatDateForDB(selectedDate)
      })

      // 予約一覧を再読み込み
      const dateString = formatDateForDB(selectedDate)
      const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
      setAppointments(updatedAppointments)

      console.log('予約の診療時間を変更しました:', {
        id: appointment.id,
        from: appointment.end_time,
        to: newEndTime
      })
    } catch (error) {
      console.error('予約リサイズエラー:', error)
      alert('予約の診療時間変更に失敗しました')
      throw error
    }
  }

  // リサイズ状態をリセット
  const resetResizeState = () => {
    setIsResizing(false)
    setResizingAppointment(null)
    setResizeStartY(null)
    setResizeStartHeight(null)
    setResizePreviewHeight(null)
    setResizePreviewEndTime(null)
    setHasMoved(false)
  }

  // コピー機能
  const handleCopyAppointment = (appointment: Appointment) => {
    console.log('予約をコピーしました - 元データ:', appointment)
    console.log('患者情報:', (appointment as any).patient)
    console.log('患者ID:', (appointment as any).patient_id)
    setCopiedAppointment(appointment)
    setIsPasteMode(true)
    onCopyStateChange?.(appointment, true)
  }

  // マウス位置を追跡
  const handlePasteMouseMove = (e: React.MouseEvent) => {
    if (isPasteMode) {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
  }

  // セルホバー処理
  const handleCellMouseEnter = (timeSlot: string, staffIndex?: number) => {
    setHoveredTimeSlot(timeSlot)
    setHoveredStaffIndex(staffIndex ?? null)
  }

  const handleCellMouseLeave = () => {
    setHoveredTimeSlot(null)
    setHoveredStaffIndex(null)
  }

  // 貼り付け機能
  const handlePasteAppointment = async (targetTimeSlot: string, targetStaffIndex: number) => {
    if (!copiedAppointment) return

    try {
      // 新しい予約データを作成
      const newAppointmentData = {
        patient_id: copiedAppointment.patient_id,
        staff1_id: workingStaff[targetStaffIndex]?.staff.id,
        staff2_id: copiedAppointment.staff2_id,
        staff3_id: copiedAppointment.staff3_id,
        menu1_id: copiedAppointment.menu1_id,
        menu2_id: copiedAppointment.menu2_id,
        menu3_id: copiedAppointment.menu3_id,
        start_time: targetTimeSlot,
        end_time: (() => {
          const startMinutes = timeToMinutes(targetTimeSlot)
          const duration = timeToMinutes(copiedAppointment.end_time) - timeToMinutes(copiedAppointment.start_time)
          const endMinutes = startMinutes + duration
          return minutesToTime(endMinutes)
        })(),
        status: copiedAppointment.status,
        memo: (copiedAppointment as any).memo || '',
        appointment_date: formatDateForDB(selectedDate)
      }

      // 重複チェック
      if (checkAppointmentConflict(copiedAppointment, newAppointmentData.start_time, newAppointmentData.end_time)) {
        alert(`選択された時間帯（${newAppointmentData.start_time} - ${newAppointmentData.end_time}）には既に他の予約があります`)
        return
      }

      // ペースト操作を直接実行（休憩時間チェックは登録時に行う）
      await performPasteAppointment(newAppointmentData)
    } catch (error) {
      console.error('予約貼り付けエラー:', error)
      alert('予約の貼り付けに失敗しました')
    }
  }

  // 貼り付け実行の実際の処理
  const performPasteAppointment = async (newAppointmentData: any) => {
    try {

      // 予約を作成
      await createAppointment(clinicId, newAppointmentData)
      
      // 予約一覧を再読み込み
      const dateString = formatDateForDB(selectedDate)
      const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
      setAppointments(updatedAppointments)
      
      // 貼り付けモードを終了
      setIsPasteMode(false)
      setCopiedAppointment(null)
      onCopyStateChange?.(null, false)
      
      console.log('予約を貼り付けました:', newAppointmentData)
    } catch (error) {
      console.error('予約貼り付けエラー:', error)
      alert('予約の貼り付けに失敗しました')
      throw error
    }
  }


  // 出勤スタッフデータを取得する関数
  const loadWorkingStaff = async (date: Date) => {
    const dateString = formatDateForDB(date) // 日本時間で日付を処理
    
    // キャッシュをチェック
    if (staffCache.has(dateString)) {
      setWorkingStaff(staffCache.get(dateString)!)
      return
    }

    try {
      setStaffLoading(true)
      setStaffError(null)
      
      const shifts = await getStaffShiftsByDate(clinicId, dateString)
      
      // デバッグログを追加
      console.log('メインカレンダー: 取得したシフトデータ:', shifts)
      console.log('メインカレンダー: シフトデータの詳細:', shifts.map(shift => ({
        id: shift.id,
        staff_id: shift.staff_id,
        staff: shift.staff,
        shift_patterns: shift.shift_patterns,
        is_holiday: shift.is_holiday
      })))
      
      // 出勤しているスタッフのみフィルタリング（休暇でない、かつシフトパターンが設定されているスタッフ）
      const workingStaffData: WorkingStaff[] = shifts
        .filter(shift => {
          // 休暇、または勤務なし（shift_pattern_id が null）の場合は除外
          if (shift.is_holiday || shift.shift_pattern_id === null) {
            return false
          }
          return true
        })
        .map(shift => ({
          staff: {
            id: shift.staff_id,
            name: shift.staff?.name || 'スタッフ名不明',
            position: shift.staff?.position?.name || 'その他'
          },
          shift_pattern: shift.shift_patterns,
          is_holiday: shift.is_holiday
        }))
        // 同じスタッフIDの重複を除去（最初のもののみ残す）
        .filter((shift, index, array) => 
          array.findIndex(s => s.staff.id === shift.staff.id) === index
        )
        .sort((a, b) => {
          // 役職順でソート（歯科医師 → 歯科衛生士 → 歯科助手）
          const positionOrder = ['歯科医師', '歯科衛生士', '歯科助手']
          const aPosition = a.staff.position || 'その他'
          const bPosition = b.staff.position || 'その他'
          const aIndex = positionOrder.indexOf(aPosition)
          const bIndex = positionOrder.indexOf(bPosition)
          
          if (aIndex !== bIndex) {
            return aIndex - bIndex
          }
          
          // 同じ役職の場合は名前順
          return a.staff.name.localeCompare(b.staff.name, 'ja')
        })

      // キャッシュに保存
      setStaffCache(prev => new Map(prev.set(dateString, workingStaffData)))
      setWorkingStaff(workingStaffData)
      
    } catch (error) {
      console.error('スタッフデータ取得エラー:', error)
      setStaffError('スタッフデータの取得に失敗しました')
    } finally {
      setStaffLoading(false)
    }
  }

  // 時間スロットを生成
  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = []
    
    console.log('MainCalendar: 時間スロット生成 - timeSlotMinutes:', timeSlotMinutes)
    console.log('MainCalendar: 時間スロット生成 - timeSlotMinutesの型:', typeof timeSlotMinutes)
    console.log('MainCalendar: 診療時間設定:', businessHours)

    // timeSlotMinutesが有効な数値でない場合はデフォルト値15を使用
    const validTimeSlotMinutes = (typeof timeSlotMinutes === 'number' && timeSlotMinutes > 0) ? timeSlotMinutes : 15
    console.log('MainCalendar: 使用する時間スロット値:', validTimeSlotMinutes)

    // 現在の曜日の診療時間を取得
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
    const dayHours = businessHours[dayId]
    
    // 診療時間が設定されている場合はその時間範囲を使用、そうでなければデフォルト値
    let startHour = 9
    let endHour = 18
    
    if (dayHours?.isOpen && dayHours?.timeSlots && dayHours.timeSlots.length > 0) {
      // 最初の時間枠の開始時間と最後の時間枠の終了時間を使用
      const firstSlot = dayHours.timeSlots[0]
      const lastSlot = dayHours.timeSlots[dayHours.timeSlots.length - 1]
      
      startHour = parseInt(firstSlot.start.split(':')[0])
      endHour = parseInt(lastSlot.end.split(':')[0])
      
      console.log('MainCalendar: 診療時間に基づく時間範囲:', { startHour, endHour })
    } else {
      console.log('MainCalendar: デフォルト時間範囲を使用:', { startHour, endHour })
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += validTimeSlotMinutes) {
        if (hour === endHour && minute > 0) break
        slots.push({
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          hour,
          minute
        })
      }
    }
    console.log('MainCalendar: 生成された時間スロット数:', slots.length)
    console.log('MainCalendar: 最初の5つのスロット:', slots.slice(0, 5))
    return slots
  }, [timeSlotMinutes, businessHours, selectedDate])

  // 時間文字列を分に変換する関数
  const timeToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + minute
  }

  // 分を時間文字列に変換する関数
  const minutesToTime = (minutes: number): string => {
    const hour = Math.floor(minutes / 60)
    const minute = minutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  // 選択範囲内の時間スロットを計算する関数
  const getSelectedTimeSlots = (startTime: string, endTime: string): string[] => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const slots: string[] = []
    
    // マウス位置のセルまで含めるため、endMinutesまで含む（<=）
    for (let minutes = startMinutes; minutes <= endMinutes; minutes += timeSlotMinutes) {
      slots.push(minutesToTime(minutes))
    }
    
    return slots
  }

  // 長押し開始の処理
  const handleMouseDown = (timeSlot: string, e: React.MouseEvent) => {
    e.preventDefault()
    console.log('複数選択開始:', timeSlot)
    setIsSelecting(true)
    setSelectionStart(timeSlot)
    setSelectionEnd(timeSlot)
    setSelectedTimeSlots([timeSlot])
  }

  // マウス移動時の処理
  const handleMouseMove = (timeSlot: string) => {
    if (!isSelecting || !selectionStart) return
    
    console.log('複数選択拡張:', timeSlot, '開始:', selectionStart)
    setSelectionEnd(timeSlot)
    
    // 開始時間と終了時間を比較して範囲を決定
    const startMinutes = timeToMinutes(selectionStart)
    const endMinutes = timeToMinutes(timeSlot)
    
    if (startMinutes <= endMinutes) {
      setSelectedTimeSlots(getSelectedTimeSlots(selectionStart, timeSlot))
    } else {
      setSelectedTimeSlots(getSelectedTimeSlots(timeSlot, selectionStart))
    }
  }

  // 長押し終了の処理
  const handleMouseUp = () => {
    if (!isSelecting) return

    console.log('複数選択完了:', selectedTimeSlots)
    setIsSelecting(false)

    // 選択された時間範囲で予約編集モーダルを開く
    if (selectedTimeSlots.length > 0) {
      const startTime = selectedTimeSlots[0]
      // 選択されたスロット数に基づいて終了時間を計算
      const totalSlots = selectedTimeSlots.length
      const totalDuration = totalSlots * timeSlotMinutes
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = startMinutes + totalDuration
      const endTimeString = minutesToTime(endMinutes)

      console.log('複数選択完了:', {
        startTime,
        endTime: endTimeString,
        totalSlots,
        totalDuration,
        timeSlotMinutes,
        selectedSlots: selectedTimeSlots
      })

      // 貼り付けモードの場合は、コピーした予約の患者情報を引き継ぐ
      if (isPasteMode && copiedAppointment) {
        console.log('複数選択 + 貼り付けモード: 患者情報を引き継ぎます')
        console.log('コピー元の予約データ:', copiedAppointment)
        console.log('コピー元の患者情報:', (copiedAppointment as any).patient)
        console.log('コピー元の患者ID:', (copiedAppointment as any).patient_id)

        // コピー元のデータをベースに、日時を新しい値に変更（IDとend_timeは除外）
        const { id, end_time, ...appointmentWithoutId } = copiedAppointment as any
        const modifiedAppointment = {
          ...appointmentWithoutId,
          start_time: startTime,
          end_time: endTimeString, // 複数選択で計算された終了時間を使用
          // 患者情報を明示的に設定
          patient: (copiedAppointment as any).patient,
          patient_id: (copiedAppointment as any).patient_id
        }

        console.log('複数選択貼り付け時の予約データ:', modifiedAppointment)
        console.log('複数選択貼り付け時の患者情報:', modifiedAppointment.patient)
        console.log('複数選択貼り付け時の患者ID:', modifiedAppointment.patient_id)
        setEditingAppointment(modifiedAppointment as any)
      }

      setSelectedTimeSlot(startTime)
      setShowAppointmentModal(true)
    }

    // 選択状態をリセット（モーダルが閉じられた時にリセット）
    // setSelectedTimeSlots([])
    // setSelectionStart(null)
    // setSelectionEnd(null)
  }

  // データを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // モックデータを初期化
        initializeMockData()
        
        const dateString = formatDateForDB(selectedDate) // 日本時間で日付を処理
        const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof BusinessHours
        
        const [appointmentsData, businessHoursData, breakTimesData, holidaysData, unitsData, staffUnitPrioritiesData, individualHolidaysData] = await Promise.all([
          getAppointmentsByDate(clinicId, dateString),
          getBusinessHours(clinicId),
          getBreakTimes(clinicId),
          getHolidays(clinicId),
          getUnits(clinicId),
          getStaffUnitPriorities(clinicId),
          getIndividualHolidays(clinicId, selectedDate.getFullYear(), selectedDate.getMonth() + 1)
        ])

        console.log('取得した予約データ:', appointmentsData)
        console.log('予約データの詳細:', appointmentsData.map(apt => ({
          id: apt.id,
          start_time: apt.start_time,
          end_time: apt.end_time,
          patient: (apt as any).patient,
          hasPatient: !!(apt as any).patient,
          patientName: (apt as any).patient ? `${(apt as any).patient.last_name} ${(apt as any).patient.first_name}` : 'なし'
        })))
        
        setAppointments(appointmentsData)
        setBusinessHours(businessHoursData)
        setBreakTimes(breakTimesData)
        setHolidays(holidaysData)
        setUnits(unitsData)
        setStaffUnitPriorities(staffUnitPrioritiesData)
        setIndividualHolidays(individualHolidaysData)
        
        console.log('カレンダー: 取得した予約データ:', appointmentsData)
        console.log('カレンダー: 取得した休診日:', holidaysData)
        console.log('カレンダー: クリニックID:', clinicId)
      } catch (error) {
        console.error('データ読み込みエラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clinicId, selectedDate])

  // スタッフデータを読み込み（日付変更時）
  useEffect(() => {
    loadWorkingStaff(selectedDate)
  }, [selectedDate])

  // 個別休診日設定の変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clinic_settings_updated' && e.newValue) {
        try {
          const updateData = JSON.parse(e.newValue)
          console.log('メインカレンダー: クリニック設定変更を検知:', updateData)
          // 休診日設定が変更された場合はデータを再読み込み
          if (updateData.holidays) {
            console.log('メインカレンダー: 休診日設定変更によりデータを再読み込み')
            loadWorkingStaff(selectedDate)
          }
        } catch (error) {
          console.error('メインカレンダー: 設定更新データの解析エラー:', error)
        }
      } else if (e.key === 'mock_individual_holidays') {
        console.log('メインカレンダー: 個別休診日設定変更を検知')
        // 個別休診日設定が変更された場合はデータを再読み込み
        loadWorkingStaff(selectedDate)
      }
    }

    const handleIndividualHolidaysUpdate = (e: CustomEvent) => {
      console.log('メインカレンダー: 個別休診日更新イベントを受信:', e.detail)
      // 個別休診日設定が変更された場合はデータを再読み込み
      loadWorkingStaff(selectedDate)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('individualHolidaysUpdated', handleIndividualHolidaysUpdate as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('individualHolidaysUpdated', handleIndividualHolidaysUpdate as EventListener)
    }
  }, [selectedDate])

  // 予約ブロックの位置とサイズを計算
  const appointmentBlocks = useMemo(() => {
    const blocks: AppointmentBlock[] = []
    
    console.log('予約ブロック計算開始:', {
      appointmentsCount: appointments.length,
      workingStaffCount: workingStaff.length,
      timeSlotMinutes
    })
    console.log('予約データ:', appointments)
    console.log('出勤スタッフ:', workingStaff)
    
    // timeSlotMinutesが有効な数値でない場合はデフォルト値15を使用
    const validTimeSlotMinutes = (typeof timeSlotMinutes === 'number' && timeSlotMinutes > 0) ? timeSlotMinutes : 15
    
        // すべての予約を処理（キャンセルされた予約も表示）
        appointments.forEach((appointment, index) => {
          const startTime = appointment.start_time
          const endTime = appointment.end_time
          
          console.log(`予約${index}:`, {
            startTime,
            endTime,
            staff1_id: appointment.staff1_id,
            staff2_id: appointment.staff2_id,
            staff3_id: appointment.staff3_id,
            staff1: (appointment as any).staff1,
            staff2: (appointment as any).staff2,
            staff3: (appointment as any).staff3
          })
      
      // 時間を分に変換
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      
      // 表示モードに応じて列インデックスを計算
      let staffIndex = 0
      
      if (displayMode === 'units') {
        // ユニット表示モードの場合、予約のユニットIDに基づいて列インデックスを取得
        staffIndex = units.findIndex(unit => unit.id === appointment.unit_id)
        if (staffIndex === -1) {
          // ユニットが見つからない場合は最初のユニットを使用
          staffIndex = 0
          console.log('ユニットが見つからないため、最初のユニットを使用:', staffIndex)
        }
      } else if (displayMode === 'both') {
        // 両方表示モードの場合、スタッフ列とユニット列を分けて計算
        // まずスタッフを特定
        const staffId = appointment.staff1_id || appointment.staff2_id || appointment.staff3_id
        const workingStaffIndex = workingStaff.findIndex(staff => staff.staff.id === staffId)
        
        if (workingStaffIndex !== -1) {
          // スタッフ列の場合
          staffIndex = workingStaffIndex
        } else {
          // ユニット列の場合
          const unitIndex = units.findIndex(unit => unit.id === appointment.unit_id)
          if (unitIndex !== -1) {
            // ユニット列はスタッフ列の後に配置
            staffIndex = workingStaff.length + unitIndex
          } else {
            // どちらも見つからない場合は最初の列を使用
            staffIndex = 0
          }
        }
      } else {
        // スタッフ表示モード（デフォルト）
        staffIndex = workingStaff.findIndex(staff => 
          staff.staff.id === appointment.staff1_id ||
          staff.staff.id === appointment.staff2_id ||
          staff.staff.id === appointment.staff3_id
        )
        
        // スタッフが見つからない場合は最初のスタッフを使用
        if (staffIndex === -1) {
          staffIndex = 0
          console.log('スタッフが見つからないため、最初のスタッフを使用:', staffIndex)
        }
      }
      
      // 診療時間の開始時間を取得
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dayMapping: Record<string, string> = {
        'monday': 'monday',
        'tuesday': 'tuesday', 
        'wednesday': 'wednesday',
        'thursday': 'thursday',
        'friday': 'friday',
        'saturday': 'saturday',
        'sunday': 'sunday'
      }
      const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
      const dayHours = businessHours[dayId]
      
      // 診療時間の開始時間を取得（デフォルトは9時）
      let businessStartHour = 9
      if (dayHours?.isOpen && dayHours?.timeSlots && dayHours.timeSlots.length > 0) {
        const firstSlot = dayHours.timeSlots[0]
        businessStartHour = parseInt(firstSlot.start.split(':')[0])
      }
      
      const top = (startMinutes - businessStartHour * 60) / validTimeSlotMinutes * cellHeight
      const height = (endMinutes - startMinutes) / validTimeSlotMinutes * cellHeight
      
      console.log(`予約${index}のブロック計算:`, {
        startMinutes,
        endMinutes,
        staffIndex,
        businessStartHour,
        top,
        height,
        validTimeSlotMinutes,
        cellHeight
      })
      
      blocks.push({
        appointment,
        top,
        height,
        staffIndex
      })
    })
    
    console.log('計算された予約ブロック数:', blocks.length)
    console.log('予約ブロック詳細:', blocks)
    
    return blocks
  }, [appointments, workingStaff, timeSlotMinutes, displayMode, units, businessHours, cellHeight])

  // 列の幅を計算するヘルパー関数
  const getColumnWidth = () => {
    if (displayMode === 'units') {
      // ユニット表示モードの場合
      if (units.length === 0) return '100%'
      return `${100 / units.length}%`
    } else if (displayMode === 'both') {
      // 両方表示モードの場合
      const totalColumns = workingStaff.length * units.length
      if (totalColumns === 0) return '100%'
      return `${100 / totalColumns}%`
    } else {
      // スタッフ表示モード（デフォルト）
      if (workingStaff.length === 0) return '100%'
      return `${100 / workingStaff.length}%`
    }
  }

  // 列の最小幅を計算するヘルパー関数
  const getColumnMinWidth = () => {
    if (displayMode === 'units') {
      // ユニット表示モードの場合
      if (units.length <= 2) return '200px'
      if (units.length <= 4) return '150px'
      return '120px'
    } else if (displayMode === 'both') {
      // 両方表示モードの場合
      const totalColumns = workingStaff.length * units.length
      if (totalColumns <= 3) return '200px'
      if (totalColumns <= 6) return '150px'
      return '120px'
    } else {
      // スタッフ表示モード（デフォルト）
      if (workingStaff.length <= 2) return '200px'
      if (workingStaff.length <= 4) return '150px'
      return '120px'
    }
  }


  // 休診日かどうかを判定（医院設定の休診日 + 個別休診日）
  const isHoliday = (date: Date): boolean => {
    const dateString = formatDateForDB(date) // 日本時間で日付を処理
    
    // 個別休診日の設定がある場合はそれを優先
    if (individualHolidays.hasOwnProperty(dateString)) {
      console.log('メインカレンダー: 個別設定あり', { date: dateString, isHoliday: individualHolidays[dateString] })
      return individualHolidays[dateString]
    }
    
    // 個別設定がない場合は医院設定の休診日を適用
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek]
    const isClinicHoliday = dayId ? holidays.includes(dayId) : false
    console.log('メインカレンダー: 医院設定適用', { date: dateString, dayOfWeek, dayId, holidays, isHoliday: isClinicHoliday })
    return isClinicHoliday
  }

  // 診療時間外かどうかを判定
  const isOutsideBusinessHours = (time: string): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
    const dayHours = businessHours[dayId]
    
    // 休診日または診療時間が設定されていない場合は診療時間外
    if (!dayHours?.isOpen || !dayHours?.timeSlots || dayHours.timeSlots.length === 0) return true
    
    const timeMinutes = timeToMinutes(time)
    
    // 設定された時間枠のいずれかに含まれるかチェック
    const isWithinAnyTimeSlot = dayHours.timeSlots.some(slot => {
      const startMinutes = timeToMinutes(slot.start)
      const endMinutes = timeToMinutes(slot.end)
      return timeMinutes >= startMinutes && timeMinutes < endMinutes
    })
    
    return !isWithinAnyTimeSlot
  }

  // 休診日かどうかを判定
  const isHolidayDay = (): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BusinessHours
    const dayHours = businessHours[dayId]
    
    return !dayHours?.isOpen || !dayHours?.timeSlots || dayHours.timeSlots.length === 0
  }

  // 休憩時間かどうかを判定
  const isBreakTime = (time: string): boolean => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    
    // 曜日名のマッピング（英語 → 設定で使用されるID）
    const dayMapping: Record<string, string> = {
      'monday': 'monday',
      'tuesday': 'tuesday', 
      'wednesday': 'wednesday',
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    }
    
    const dayId = dayMapping[dayOfWeek] as keyof BreakTimes
    const dayBreaks = breakTimes[dayId]
    
    if (!dayBreaks?.start || !dayBreaks?.end) return false
    
    const timeMinutes = timeToMinutes(time)
    const breakStartMinutes = timeToMinutes(dayBreaks.start)
    const breakEndMinutes = timeToMinutes(dayBreaks.end)
    
    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes
  }

  // 日付ナビゲーション
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
      </div>
    )
  }

  // 休診日の場合の表示
  if (isHoliday(selectedDate)) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">休診日</h3>
          <p className="text-gray-500">本日は休診日です</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white flex-1">
      {/* 左側: 時間軸 */}
      <div className="w-16 flex-shrink-0 border-r border-gray-200">
        {/* 時間軸ヘッダー */}
        <div className="h-11 border-b border-gray-200 bg-gray-50"></div>
        {/* 時間軸スクロールエリア */}
        <div 
          ref={timeAxisRef}
          className="relative h-full overflow-y-auto scrollbar-hide"
          onScroll={handleTimeAxisScroll}
        >
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className={`flex items-center justify-center text-xs text-gray-500 ${
                slot.minute === 0 ? 'font-medium' : ''
              }`}
              style={{
                height: `${cellHeight}px`,
                borderTop: slot.minute === 0 ? '0.5px solid #6B7280' : '0.25px solid #E5E7EB'
              }}
            >
              {slot.time}
            </div>
          ))}
        </div>
      </div>

      {/* 右側: スタッフ列と予約ブロック */}
      <div className="flex-1 overflow-hidden">


        {/* スタッフヘッダー */}
        <div className="h-11 flex border-b border-gray-200">
          {staffLoading ? (
            <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : staffError ? (
            <div className="flex-1 h-full flex items-center justify-center bg-red-50 text-red-600 text-sm">
              {staffError}
            </div>
          ) : displayMode === 'staff' ? (
            workingStaff.length === 0 ? (
              <div className="flex-1 h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                出勤スタッフなし
              </div>
            ) : (
              workingStaff.map((shift, index) => {
                const isLastColumn = index === workingStaff.length - 1
                return (
                  <div 
                    key={`${shift.staff.id}-${index}`} 
                    className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50 h-full"
                    style={{ 
                      minWidth: getColumnMinWidth(),
                      maxWidth: getColumnWidth()
                    }}
                  >
                    <div className="text-center px-2">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {shift.staff.name}
                      </div>
                    </div>
                  </div>
                )
              })
            )
          ) : displayMode === 'units' ? (
            units.length === 0 ? (
              <div className="flex-1 h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                ユニットなし
              </div>
            ) : (
              units.map((unit, index) => {
                const isLastColumn = index === units.length - 1
                return (
                  <div 
                    key={`${unit.id}-${index}`} 
                    className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50 h-full"
                    style={{ 
                      minWidth: getColumnMinWidth(),
                      maxWidth: getColumnWidth()
                    }}
                  >
                    <div className="text-center px-2">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {unit.name}
                      </div>
                    </div>
                  </div>
                )
              })
            )
          ) : displayMode === 'both' ? (
            (() => {
              // スタッフに割り当てられたユニットを取得
              const assignedUnitIds = new Set()
              workingStaff.forEach(shift => {
                const staffPriority = staffUnitPriorities
                  .filter(p => p.staff_id === shift.staff.id)
                  .sort((a, b) => a.priority_order - b.priority_order)[0]
                if (staffPriority) {
                  assignedUnitIds.add(staffPriority.unit_id)
                }
              })
              
              // 割り当てられていないユニットのみを取得
              const unassignedUnits = units.filter(unit => !assignedUnitIds.has(unit.id))
              
              // 表示モードに応じて列を決定
              const columns = [...workingStaff, ...unassignedUnits]
              
              if (columns.length === 0) {
                return (
                  <div className="flex-1 h-full flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
                    出勤スタッフ・ユニットなし
                  </div>
                )
              }
              
              return columns.map((column, index) => {
                const isLastColumn = index === columns.length - 1
                
                // 列の種類を判定
                const isStaffColumn = 'staff' in column
                const isUnitColumn = 'name' in column && !isStaffColumn
                
                let displayText = ''
                if (isStaffColumn) {
                  // スタッフ列の場合
                  const staffPriority = staffUnitPriorities
                    .filter(p => p.staff_id === column.staff.id)
                    .sort((a, b) => a.priority_order - b.priority_order)[0]
                  const unitName = staffPriority ? units.find(u => u.id === staffPriority.unit_id)?.name : '未設定'
                  displayText = `${column.staff.name} ${unitName}`
                } else if (isUnitColumn) {
                  // ユニット列の場合
                  displayText = column.name
                }
                
                return (
                  <div 
                    key={`${isStaffColumn ? column.staff.id : column.id}-${index}`} 
                    className="flex-1 border-r border-gray-200 flex items-center justify-center bg-gray-50 h-full"
                    style={{ 
                      minWidth: getColumnMinWidth(),
                      maxWidth: getColumnWidth()
                    }}
                  >
                    <div className="text-center px-2">
                      <div className="text-sm font-medium text-gray-700 truncate">
                        {displayText}
                      </div>
                    </div>
                  </div>
                )
              })
            })()
          ) : null}
        </div>


        {/* タイムライングリッド */}
        <div 
          ref={gridRef}
          className="relative h-full overflow-y-auto scrollbar-hide"
          onScroll={handleGridScroll}
          onMouseMove={(e) => {
            handleAppointmentMouseMove(e)
            handleResizeMouseMove(e)
            handlePasteMouseMove(e)
          }}
          onMouseUp={(e) => {
            handleAppointmentMouseUp(e)
            handleResizeMouseUp(e)
          }}
        >
          {timeSlots.map((slot, index) => {
            const isHoliday = isHolidayDay()
            const isOutside = isHoliday ? false : isOutsideBusinessHours(slot.time)
            const isBreak = isBreakTime(slot.time)
            const isHourBoundary = slot.minute === 0
            // 行全体のハイライトを無効化（セル単位のハイライトのみ有効）
            const isHovered = false
            
            return (
              <div
                key={index}
                className={`flex ${
                  isHovered
                    ? 'bg-blue-50 border-blue-200 border' // ホバー時の薄い青
                    : isHoliday
                      ? 'bg-gray-50' // 休診日は薄いグレー
                      : isOutside
                        ? 'bg-gray-100' // 診療時間外はグレー
                        : isBreak
                          ? 'bg-gray-200 cursor-pointer'
                          : 'bg-white'
                }`}
                style={{
                  height: `${cellHeight}px`,
                  borderTop: isHourBoundary ? '0.5px solid #6B7280' : '0.25px solid #E5E7EB',
                  borderBottom: isBreak ? 'none' : undefined,
                  zIndex: isBreak ? 1 : 'auto'
                }}
                onMouseEnter={() => handleCellMouseEnter(slot.time)}
                onMouseLeave={handleCellMouseLeave}
                // 複数選択機能を無効化（セル単位選択のみ有効）
                // onMouseDown={(e) => {
                //   // 休憩時間や時間外でもマウスダウンを許可（選択範囲の開始）
                //   handleMouseDown(slot.time, e)
                // }}
                // onMouseMove={() => {
                //   // 休憩時間や時間外でもマウス移動を許可（選択範囲の拡張）
                //   handleMouseMove(slot.time)
                // }}
                // onMouseUp={() => {
                //   // 休憩時間や時間外でもマウスアップを許可（選択範囲の終了処理）
                //   handleMouseUp()
                // }}
                onClick={(e) => {
                  // 貼り付けモードの場合は予約編集モーダルを開く
                  if (isPasteMode && copiedAppointment) {
                    e.stopPropagation()
                    
                    // 貼り付け先のスタッフを取得
                    const targetStaff = workingStaff[0]
                    const newStaffId = targetStaff ? targetStaff.staff.id : ''
                    
                    console.log('コピー元の予約データ:', copiedAppointment)
                    console.log('コピー元の患者情報:', (copiedAppointment as any).patient)
                    console.log('コピー元の患者ID:', (copiedAppointment as any).patient_id)
                    
                    // コピー元のデータをベースに、日時とスタッフを新しい値に変更（IDとend_timeは除外）
                    const { id, end_time, ...appointmentWithoutId } = copiedAppointment as any
                    const modifiedAppointment = {
                      ...appointmentWithoutId,
                      start_time: slot.time,
                      staff1_id: newStaffId,
                      // 患者情報を明示的に設定
                      patient: (copiedAppointment as any).patient,
                      patient_id: (copiedAppointment as any).patient_id
                      // end_timeとdurationはモーダル側で自動計算される
                    }
                    
                    console.log('貼り付け時の予約データ:', modifiedAppointment)
                    console.log('貼り付け時の患者情報:', modifiedAppointment.patient)
                    console.log('貼り付け時の患者ID:', modifiedAppointment.patient_id)
                    setEditingAppointment(modifiedAppointment as any)
                    setSelectedTimeSlot(slot.time)
                    setSelectedStaffIndex(0)
                    setShowAppointmentModal(true)
                    return
                  }
                  
                  // 休憩時間や時間外でもクリックを許可（警告モーダルで対応）
                  // 単一クリックの場合は従来通り
                  if (!isSelecting) {
                    console.log('空のセルクリック:', slot.time, 'スタッフインデックス:', workingStaff.length > 0 ? '複数スタッフ' : 'スタッフなし', '休憩時間:', isBreak, '時間外:', isOutside)
                    setSelectedTimeSlot(slot.time)
                    setSelectedStaffIndex(undefined) // 空のセルなのでスタッフインデックスは未設定
                    setShowAppointmentModal(true)
                  }
                }}
              >
                {(() => {
                  // 表示モードに応じて列を決定
                  let columns
                  if (displayMode === 'units') {
                    columns = units
                  } else if (displayMode === 'both') {
                    // スタッフに割り当てられたユニットを取得
                    const assignedUnitIds = new Set()
                    workingStaff.forEach(shift => {
                      const staffPriority = staffUnitPriorities
                        .filter(p => p.staff_id === shift.staff.id)
                        .sort((a, b) => a.priority_order - b.priority_order)[0]
                      if (staffPriority) {
                        assignedUnitIds.add(staffPriority.unit_id)
                      }
                    })
                    
                    // 割り当てられていないユニットのみを取得
                    const unassignedUnits = units.filter(unit => !assignedUnitIds.has(unit.id))
                    columns = [...workingStaff, ...unassignedUnits]
                  } else {
                    columns = workingStaff
                  }
                  
                  return columns.map((_, columnIndex) => {
                    const isLastColumn = columnIndex === columns.length - 1
                    const isDropTargetColumn = isDragging && dropTargetTime === slot.time && (() => {
                      if (!dragCurrentPosition) return false
                      const dropTarget = calculateDropTarget(dragCurrentPosition.x, dragCurrentPosition.y)
                      const isTarget = dropTarget.staffIndex === columnIndex
                      
                      // デバッグログ
                      if (isDragging && dropTargetTime === slot.time) {
                        console.log('ドロップ先セル判定:', {
                          slotTime: slot.time,
                          columnIndex,
                          dropTargetStaffIndex: dropTarget.staffIndex,
                          isTarget,
                          dragCurrentPosition
                        })
                      }
                      
                      return isTarget
                    })()
                    const isDropTargetColumnInvalid = isDropTargetColumn && !isDropTargetValid
                    
                    return (
                      <div
                        key={columnIndex}
                        className={`flex-1 border-r border-gray-200 ${
                          isBreak ? 'bg-gray-200' : ''
                        } ${
                          isDropTargetColumnInvalid
                            ? 'bg-red-200 border-red-400 border-2' // 重複するドロップ先のハイライト（赤）
                            : isDropTargetColumn
                              ? 'bg-green-200 border-green-400 border-2' // 有効なドロップ先のハイライト（緑）
                              : selectedCells.some(cell => cell.timeSlot === slot.time && cell.columnIndex === columnIndex)
                                ? 'bg-blue-200 border-blue-400' // 複数選択されたセルのハイライト
                                : selectedCell?.timeSlot === slot.time && selectedCell?.columnIndex === columnIndex
                                  ? 'bg-blue-200 border-blue-400' // 単一選択されたセルのハイライト
                                  : hoveredTimeSlot === slot.time && hoveredStaffIndex === columnIndex
                                    ? 'bg-blue-50 border-blue-200' // ホバー時の薄い青（キャンセルされた予約でも適用）
                                    : ''
                        }`}
                        style={{ 
                          minWidth: getColumnMinWidth(),
                          maxWidth: getColumnWidth()
                        }}
                        onMouseEnter={() => handleCellMouseEnter(slot.time, columnIndex)}
                        onMouseLeave={handleCellMouseLeave}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          console.log('セル複数選択開始:', slot.time, columnIndex)
                          setIsSelectingCells(true)
                          setSelectedCells([{ timeSlot: slot.time, columnIndex }])
                        }}
                        onMouseMove={() => {
                          if (!isSelectingCells) return
                          const newCell = { timeSlot: slot.time, columnIndex }
                          setSelectedCells(prev => {
                            const exists = prev.some(cell => 
                              cell.timeSlot === newCell.timeSlot && cell.columnIndex === newCell.columnIndex
                            )
                            if (!exists) {
                              return [...prev, newCell]
                            }
                            return prev
                          })
                        }}
                        onMouseUp={() => {
                          if (!isSelectingCells) return
                          console.log('セル複数選択完了:', selectedCells)
                          setIsSelectingCells(false)

                          // 複数選択されたセルがある場合、最初のセルで予約編集モーダルを開く
                          if (selectedCells.length > 0) {
                            const firstCell = selectedCells[0]
                            setSelectedTimeSlot(firstCell.timeSlot)
                            setSelectedCell(firstCell)

                            // 複数選択されたセルの時間範囲を計算
                            const selectedTimeSlots = selectedCells.map(cell => cell.timeSlot).sort()
                            const startTime = selectedTimeSlots[0]
                            const endTime = selectedTimeSlots[selectedTimeSlots.length - 1]

                            // 診療時間を計算（15分単位）
                            const duration = selectedCells.length * 15 // 15分 × 選択セル数

                            console.log('セル複数選択による時間計算:', {
                              selectedCells,
                              selectedTimeSlots,
                              startTime,
                              endTime,
                              duration,
                              cellCount: selectedCells.length
                            })

                            // 選択された時間範囲を状態に保存
                            setSelectedTimeSlots(selectedTimeSlots)

                            // 貼り付けモードの場合は、コピー元のデータを使用
                            if (isPasteMode && copiedAppointment) {
                              // 貼り付け先のスタッフを取得
                              const targetStaff = displayMode === 'staff' || displayMode === 'both' ? workingStaff[firstCell.columnIndex] : null
                              const newStaffId = targetStaff ? targetStaff.staff.id : ''

                              console.log('複数セル選択 - コピー元の予約データ:', copiedAppointment)
                              console.log('複数セル選択 - コピー元の患者情報:', (copiedAppointment as any).patient)

                              // コピー元のデータをベースに、日時とスタッフを新しい値に変更
                              const { id, end_time, ...appointmentWithoutId } = copiedAppointment as any
                              const modifiedAppointment = {
                                ...appointmentWithoutId,
                                start_time: firstCell.timeSlot,
                                staff1_id: newStaffId,
                                patient: (copiedAppointment as any).patient,
                                patient_id: (copiedAppointment as any).patient_id
                              }

                              console.log('複数セル選択 - 貼り付け時の予約データ:', modifiedAppointment)
                              setEditingAppointment(modifiedAppointment as any)
                            }

                            // 表示モードに応じてスタッフインデックスとユニットインデックスを設定
                            if (displayMode === 'units') {
                              setSelectedStaffIndex(undefined)
                              setSelectedUnitIndex(firstCell.columnIndex)
                            } else if (displayMode === 'staff') {
                              setSelectedStaffIndex(firstCell.columnIndex)
                              setSelectedUnitIndex(undefined)
                            } else if (displayMode === 'both') {
                              if (firstCell.columnIndex < workingStaff.length) {
                                setSelectedStaffIndex(firstCell.columnIndex)
                                setSelectedUnitIndex(undefined)
                              } else {
                                setSelectedStaffIndex(undefined)
                                setSelectedUnitIndex(firstCell.columnIndex - workingStaff.length)
                              }
                            }

                            setShowAppointmentModal(true)
                          }
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        
                          // 貼り付けモードの場合は予約編集モーダルを開く
                          if (isPasteMode && copiedAppointment) {
                            // 貼り付け先のスタッフを取得（スタッフ表示モードの場合のみ）
                            const targetStaff = displayMode === 'staff' || displayMode === 'both' ? workingStaff[columnIndex] : null
                            const newStaffId = targetStaff ? targetStaff.staff.id : ''
                          
                          console.log('コピー元の予約データ（スタッフ列）:', copiedAppointment)
                          console.log('コピー元の患者情報（スタッフ列）:', (copiedAppointment as any).patient)
                          console.log('コピー元の患者ID（スタッフ列）:', (copiedAppointment as any).patient_id)
                          
                          // コピー元のデータをベースに、日時とスタッフを新しい値に変更（IDとend_timeは除外）
                          const { id, end_time, ...appointmentWithoutId } = copiedAppointment as any
                          const modifiedAppointment = {
                            ...appointmentWithoutId,
                            start_time: slot.time,
                            staff1_id: newStaffId,
                            // 患者情報を明示的に設定
                            patient: (copiedAppointment as any).patient,
                            patient_id: (copiedAppointment as any).patient_id
                            // end_timeとdurationはモーダル側で自動計算される
                          }
                          
                          console.log('貼り付け時の予約データ（スタッフ列）:', modifiedAppointment)
                          console.log('貼り付け時の患者情報（スタッフ列）:', modifiedAppointment.patient)
                          console.log('貼り付け時の患者ID（スタッフ列）:', modifiedAppointment.patient_id)
                          setEditingAppointment(modifiedAppointment as any)
                          setSelectedTimeSlot(slot.time)
                          setSelectedStaffIndex(columnIndex)
                          setShowAppointmentModal(true)
                          return
                        }
                        
                          // 休憩時間や時間外でもクリックを許可（警告モーダルで対応）
                          // 列をクリックした場合
                          console.log('列クリック:', slot.time, '列インデックス:', columnIndex, '休憩時間:', isBreak, '時間外:', isOutside)
                          setSelectedTimeSlot(slot.time)
                          
                          // 選択されたセルを設定
                          setSelectedCell({ timeSlot: slot.time, columnIndex })
                          
                          // 表示モードに応じてスタッフインデックスとユニットインデックスを設定
                          if (displayMode === 'units') {
                            // ユニット表示モードの場合
                            setSelectedStaffIndex(undefined)
                            setSelectedUnitIndex(columnIndex)
                          } else if (displayMode === 'staff') {
                            // スタッフ表示モードの場合
                            setSelectedStaffIndex(columnIndex)
                            setSelectedUnitIndex(undefined)
                          } else if (displayMode === 'both') {
                            // 同時表示モードの場合
                            if (columnIndex < workingStaff.length) {
                              // スタッフ列の場合
                              setSelectedStaffIndex(columnIndex)
                              setSelectedUnitIndex(undefined)
                            } else {
                              // ユニット列の場合
                              setSelectedStaffIndex(undefined)
                              setSelectedUnitIndex(columnIndex - workingStaff.length)
                            }
                          }
                          
                          setShowAppointmentModal(true)
                        }}
                      />
                    )
                  })
                })()}
              </div>
            )
          })}



          {/* 予約ブロック */}
          {appointmentBlocks.map((block, index) => {
            const isCancelled = block.appointment.status === 'cancelled'
            
            // キャンセルされた予約はブロックを表示しない（アイコンのみ別途表示）
            if (isCancelled) {
              return null
            }
            
            const menuColor = (block.appointment as any).menu1?.color || '#3B82F6'
            const patient = (block.appointment as any).patient
            
            
            const patientAge = patient?.birth_date ? 
              new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : null
            
            return (
              <div
                key={index}
                className={`absolute rounded-md text-xs transition-shadow overflow-hidden ${
                  isDragging && draggedAppointment?.id === block.appointment.id 
                    ? 'opacity-0' 
                    : isCancelled 
                    ? 'cursor-pointer' // キャンセルされた予約もクリックできるようにする
                    : 'cursor-pointer hover:shadow-md'
                }`}
                style={{
                  top: `${isDragging && draggedAppointment?.id === block.appointment.id 
                    ? (() => {
                        // ドラッグ中の場合は、マウス位置に基づいて新しい位置を計算
                        if (!dragCurrentPosition || !dragStartPosition) return block.top
                        
                        // マウスの移動量を計算（スクロール位置を考慮）
                        const deltaY = dragCurrentPosition.y - dragStartPosition.y
                        const newTop = block.top + deltaY
                        return newTop
                      })()
                    : block.top}px`,
                  height: `${isResizing && resizingAppointment?.id === block.appointment.id && resizePreviewHeight ? resizePreviewHeight : block.height}px`,
                  left: `${isDragging && draggedAppointment?.id === block.appointment.id 
                    ? (() => {
                        // ドラッグ中の場合は、マウス位置に基づいて新しい位置を計算
                        if (!dragCurrentPosition || !dragStartPosition) {
                          // displayModeに応じて列数を計算
                          let totalColumns = 0
                          if (displayMode === 'staff') {
                            totalColumns = workingStaff.length
                          } else if (displayMode === 'units') {
                            totalColumns = units.length
                          } else if (displayMode === 'both') {
                            totalColumns = workingStaff.length + units.length
                          }
                          return (block.staffIndex / totalColumns) * 100
                        }
                        
                        // マウスの移動量を計算
                        const deltaX = dragCurrentPosition.x - dragStartPosition.x
                        
                        // displayModeに応じて列数を計算
                        let totalColumns = 0
                        if (displayMode === 'staff') {
                          totalColumns = workingStaff.length
                        } else if (displayMode === 'units') {
                          totalColumns = units.length
                        } else if (displayMode === 'both') {
                          totalColumns = workingStaff.length + units.length
                        }
                        
                        const originalLeft = (block.staffIndex / totalColumns) * 100
                        const newLeft = originalLeft + (deltaX / window.innerWidth) * 100
                        return Math.max(0, Math.min(100 - (100 / totalColumns), newLeft))
                      })()
                    : (() => {
                        // displayModeに応じて列数を計算
                        let totalColumns = 0
                        if (displayMode === 'staff') {
                          totalColumns = workingStaff.length
                        } else if (displayMode === 'units') {
                          totalColumns = units.length
                        } else if (displayMode === 'both') {
                          totalColumns = workingStaff.length + units.length
                        }
                        return (block.staffIndex / totalColumns) * 100
                      })()}%`,
                  width: getColumnWidth(),
                  minWidth: getColumnMinWidth(),
                  backgroundColor: (() => {
                    // ホバー時は青いハイライトを優先
                    if (hoveredTimeSlot === block.appointment.start_time && hoveredStaffIndex === block.staffIndex) {
                      return '#DBEAFE' // bg-blue-50 の色
                    }
                    return menuColor
                  })(),
                  color: 'black', // キャンセルされた予約も通常のテキスト色を使用
                  padding: '2px 8px 8px 8px', // 上を2px、左右8px、下8px
                  zIndex: isDragging && draggedAppointment?.id === block.appointment.id ? 1000 : isCancelled ? 5 : 10,
                  opacity: isDragging && draggedAppointment?.id === block.appointment.id ? 0.8 : isPasteMode ? 0.5 : 1, // 貼り付けモード時は半透明にして背景が見えるようにする
                  transform: isDragging && draggedAppointment?.id === block.appointment.id ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isDragging && draggedAppointment?.id === block.appointment.id ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                  transition: isDragging && draggedAppointment?.id === block.appointment.id ? 'none' : 'all 0.2s ease',
                  pointerEvents: isPasteMode ? 'none' : 'auto' // 貼り付けモード時はクリックイベントを背景のセルに通す
                }}
                onMouseDown={(e) => handleAppointmentMouseDown(e, block.appointment)}
                onClick={(e) => {
                  // 移動やリサイズが行われた場合はモーダルを開かない
                  if (hasMoved) {
                    e.stopPropagation()
                    return
                  }

                  e.stopPropagation()

                  // 貼り付けモードの場合は、予約ブロックのクリックを無視して背景のセルに処理を委譲
                  if (isPasteMode && copiedAppointment) {
                    console.log('貼り付けモード: 予約ブロックのクリックを無視')
                    return
                  }

                  // 予約編集モーダルを開く
                  console.log('予約セルクリック:', block.appointment)
                  console.log('選択された時間スロット:', block.appointment.start_time)
                  console.log('選択されたスタッフインデックス:', block.staffIndex)
                  console.log('表示モード:', displayMode)

                  setSelectedTimeSlot(block.appointment.start_time)

                  // 予約の現在位置を計算して設定
                  const { staffIndex: calculatedStaffIndex, unitIndex: calculatedUnitIndex } = calculateAppointmentPosition(block.appointment)

                  // 表示モードに応じてスタッフインデックスとユニットインデックスを設定
                  if (displayMode === 'units') {
                    // ユニット表示モードの場合
                    setSelectedStaffIndex(undefined)
                    setSelectedUnitIndex(calculatedUnitIndex)
                  } else if (displayMode === 'staff') {
                    // スタッフ表示モードの場合
                    setSelectedStaffIndex(calculatedStaffIndex)
                    setSelectedUnitIndex(undefined)
                  } else if (displayMode === 'both') {
                    // 両方表示モードの場合
                    if (calculatedStaffIndex < workingStaff.length) {
                      // スタッフ列の場合
                      setSelectedStaffIndex(calculatedStaffIndex)
                      setSelectedUnitIndex(undefined)
                    } else {
                      // ユニット列の場合
                      setSelectedStaffIndex(undefined)
                      setSelectedUnitIndex(calculatedStaffIndex - workingStaff.length)
                    }
                  }

                  setEditingAppointment(block.appointment)
                  setShowAppointmentModal(true)
                  console.log('モーダル表示フラグ設定完了')
                }}
              >
                {/* キャンセルされていない予約のみテキストを表示 */}
                {!isCancelled && (
                  <>
                    {/* ステータス表示・進行ボタン（右上） */}
                    {(() => {
                      const currentStatus = block.appointment.status
                      const nextStatus = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]?.nextStatus
                      console.log('予約ステータス:', currentStatus, '次のステータス:', nextStatus, '予約ID:', block.appointment.id)
                      
                      // キャンセルされていない予約のみステータスボタンを表示
                      if (currentStatus && currentStatus !== 'キャンセル') {
                        const statusConfig = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG]
                        const buttonColor = statusConfig?.color.split(' ')[0] || 'bg-gray-500'
                        const textColor = statusConfig?.color.split(' ')[1] || 'text-gray-800'
                        
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (nextStatus) {
                                handleStatusProgression(block.appointment)
                              }
                            }}
                            className={`absolute top-1 right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors z-10 ${
                              nextStatus 
                                ? `${buttonColor} ${textColor} hover:opacity-80 cursor-pointer` 
                                : `${buttonColor} ${textColor} cursor-default`
                            }`}
                            title={nextStatus ? `${nextStatus}に進む (現在: ${currentStatus})` : `現在: ${currentStatus} (最終ステータス)`}
                          >
                            {currentStatus[0]}
                          </button>
                        )
                      }
                      
                      return null
                    })()}
                    
                    {/* 1段目: 診療時間、診察券番号 */}
                    <div className="text-xs leading-tight" style={{ marginTop: '0px', marginBottom: '2px' }}>
                      {displayItems.includes('reservation_time') && (
                        <>
                          {isResizing && resizingAppointment?.id === block.appointment.id && resizePreviewEndTime ? (
                            <>{block.appointment.start_time} - {resizePreviewEndTime}</>
                          ) : (
                            <>{block.appointment.start_time} - {block.appointment.end_time}</>
                          )}
                        </>
                      )}
                      {displayItems.includes('medical_card_number') && patient?.patient_number && patient?.is_registered && (
                        <span>{displayItems.includes('reservation_time') ? ' / ' : ''}{patient.patient_number}</span>
                      )}
                    </div>
                    
                    {/* 2段目: 患者名、フリガナ、年齢、アイコン、診療メニュー、担当者 */}
                    <div className="text-sm leading-tight flex items-center flex-wrap gap-1" style={{ lineHeight: '1.2', marginTop: '4px' }}>
                      {/* 患者名 */}
                      {displayItems.includes('name') && (
                        <span className="font-medium">
                          {patient ? 
                            `${patient.last_name} ${patient.first_name}` : 
                            '患者情報なし'
                          }
                        </span>
                      )}
                      
                      {/* フリガナ */}
                      {displayItems.includes('furigana') && patient && (patient.last_name_kana || patient.first_name_kana) && (
                        <span className="text-xs">
                          {(displayItems.includes('name') || displayItems.some(item => item.match(/^(name|medical_card_number|reservation_time)$/))) ? ' / ' : ''}
                          {patient.last_name_kana} {patient.first_name_kana}
                        </span>
                      )}
                      
                      {/* 年齢 */}
                      {displayItems.includes('age') && patientAge && (
                        <span>
                          {displayItems.some(item => item.match(/^(name|furigana|medical_card_number|reservation_time)$/)) ? ' / ' : ''}
                          {patientAge}歳
                        </span>
                      )}
                      
                      {/* 患者アイコン */}
                      {displayItems.includes('patient_icon') && patient && (() => {
                        const patientIconsData = localStorage.getItem(`patient_icons_${patient.id}`)
                        if (!patientIconsData) return null
                        
                        try {
                          const iconIds: string[] = JSON.parse(patientIconsData)
                          if (iconIds.length === 0) return null
                          
                          return (
                            <span className="flex items-center gap-0.5">
                              {displayItems.some(item => item.match(/^(name|furigana|age|medical_card_number|reservation_time)$/)) && ' / '}
                              {iconIds.slice(0, 3).map(iconId => {
                                const iconData = PATIENT_ICONS.find(i => i.id === iconId)
                                if (!iconData) return null
                                const IconComponent = iconData.icon
                                return (
                                  <IconComponent 
                                    key={iconId} 
                                    className="w-3.5 h-3.5 text-gray-700" 
                                    title={iconData.title}
                                  />
                                )
                              })}
                            </span>
                          )
                        } catch (e) {
                          return null
                        }
                      })()}
                      
                      {/* 診療内容（統合表示） */}
                      {displayItems.includes('treatment_content') && (
                        (() => {
                          const menu1 = (block.appointment as any).menu1
                          const menu2 = (block.appointment as any).menu2
                          const menu3 = (block.appointment as any).menu3
                          
                          if (!menu1 && !menu2 && !menu3) return null
                          
                          const menuParts = []
                          if (menu1) menuParts.push(menu1.name)
                          if (menu2) menuParts.push(menu2.name)
                          if (menu3) menuParts.push(menu3.name)
                          
                          return (
                            <span>
                              {displayItems.some(item => item.match(/^(name|furigana|age|patient_icon|medical_card_number|reservation_time)$/)) ? ' / ' : ''}
                              {menuParts.join('/')}
                            </span>
                          )
                        })()
                      )}
                      
                      {/* 担当者（統合表示） */}
                      {displayItems.includes('staff') && (
                        (() => {
                          const staff1 = (block.appointment as any).staff1
                          const staff2 = (block.appointment as any).staff2
                          const staff3 = (block.appointment as any).staff3

                          if (!staff1 && !staff2 && !staff3) return null

                          const staffParts = []
                          if (staff1) staffParts.push(staff1.name)
                          if (staff2) staffParts.push(staff2.name)
                          if (staff3) staffParts.push(staff3.name)

                          return (
                            <span>
                              {displayItems.some(item => item.match(/^(name|furigana|age|patient_icon|treatment_content|medical_card_number|reservation_time)$/)) ? ' / ' : ''}
                              {staffParts.join('/')}
                            </span>
                          )
                        })()
                      )}

                      {/* メモ */}
                      {block.appointment.memo && (
                        <span
                          className="text-xs text-gray-600"
                          dangerouslySetInnerHTML={{
                            __html: (displayItems.some(item => item.match(/^(name|furigana|age|patient_icon|treatment_content|staff|medical_card_number|reservation_time)$/)) ? ' / ' : '') +
                                    block.appointment.memo
                                      .replace(/<div[^>]*>/gi, '')
                                      .replace(/<\/div>/gi, ' ')
                                      .replace(/<p[^>]*>/gi, '')
                                      .replace(/<\/p>/gi, ' ')
                                      .replace(/<br\s*\/?>/gi, ' ')
                                      .replace(/\n/g, ' ')
                                      .trim()
                          }}
                        />
                      )}
                    </div>
                  </>
                )}

                {/* リサイズハンドル（下側の境界） */}
                <div
                    className="absolute bottom-0 left-0 right-0 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => handleResizeMouseDown(e, block.appointment)}
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.6)',
                      height: '4px'
                    }}
                  />
              </div>
            )
          })}

          {/* キャンセルされた予約のアイコンのみ表示 */}
          {appointmentBlocks.map((block, index) => {
            const isCancelled = block.appointment.status === 'cancelled'
            
            // キャンセルされた予約のみアイコンを表示
            if (!isCancelled) {
              return null
            }
            
            return (
              <div
                key={`cancel-icon-${index}`}
                className="absolute z-0"
                style={{
                  top: `${block.top}px`,
                  left: `${(block.staffIndex / workingStaff.length) * 100}%`,
                  width: getColumnWidth(),
                  minWidth: getColumnMinWidth(),
                  height: `${block.height}px`,
                  pointerEvents: 'none',
                }}
              >
                {/* キャンセルアイコン（右上）- クリック範囲を広げる */}
                <div 
                  className="absolute top-0 right-0 p-2 cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedCancelledAppointment(block.appointment)
                    setShowCancelInfoModal(true)
                  }}
                  title="キャンセル情報を表示"
                >
                  <div className="w-3 h-3 bg-red-300 text-red-100 rounded-full flex items-center justify-center hover:bg-red-400 hover:text-white hover:scale-110 transition-all shadow-sm">
                    <span className="text-[8px] leading-none">❌</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* マウスカーソル近くのコピー状態表示 */}
      {isPasteMode && copiedAppointment && mousePosition && (
        <div
          className="fixed z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">📋 コピー中</span>
            <span className="text-xs">
              {(copiedAppointment as any).patient?.last_name} {(copiedAppointment as any).patient?.first_name}
            </span>
          </div>
          <div className="text-xs mt-1 opacity-80">
            日付をクリックして移動、セルをクリックして登録
          </div>
        </div>
      )}

      {/* 貼り付けモード時の登録ボタン */}
      {isPasteMode && copiedAppointment && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => {
              // 貼り付けモードを終了
              setIsPasteMode(false)
              setCopiedAppointment(null)
              onCopyStateChange?.(null, false)
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-gray-600 transition-colors"
          >
            キャンセル
          </button>
        </div>
      )}

      {/* キャンセル情報モーダル */}
      <CancelInfoModal
        isOpen={showCancelInfoModal}
        onClose={() => {
          setShowCancelInfoModal(false)
          setSelectedCancelledAppointment(null)
        }}
        appointment={selectedCancelledAppointment}
      />

      {/* 予約編集モーダル */}
      <AppointmentEditModal
        isOpen={showAppointmentModal}
        onClose={() => {
          console.log('モーダルを閉じる')
          setShowAppointmentModal(false)
          setEditingAppointment(null)
          // モーダルが閉じられた時に選択状態をリセット
          setSelectedTimeSlots([])
          setSelectionStart(null)
          setSelectionEnd(null)
          setSelectedCell(null)
          setSelectedCells([])
          setIsSelectingCells(false)
        }}
        clinicId={clinicId}
        selectedDate={formatDateForDB(selectedDate)}
        selectedTime={selectedTimeSlot}
        selectedTimeSlots={selectedTimeSlots}
        selectedStaffIndex={selectedStaffIndex}
        selectedUnitIndex={selectedUnitIndex}
        timeSlotMinutes={timeSlotMinutes}
        workingStaff={workingStaff}
        units={units}
        editingAppointment={editingAppointment}
        onUpdate={async (appointmentData) => {
          try {
            console.log('予約即座更新:', appointmentData)

            if (editingAppointment) {
              // 更新前のデータを保存（ログ記録用）
              const oldData = {
                appointment_date: editingAppointment.appointment_date,
                start_time: editingAppointment.start_time,
                end_time: editingAppointment.end_time,
                staff1_id: editingAppointment.staff1_id,
                menu1_id: editingAppointment.menu1_id,
                status: editingAppointment.status,
                memo: editingAppointment.memo
              }

              // 既存の予約を即座に更新
              await updateAppointment(editingAppointment.id, {
                ...appointmentData,
                appointment_date: formatDateForDB(selectedDate)
              })
              console.log('既存予約即座更新完了')

              // 予約変更ログを記録
              const { logAppointmentChange } = await import('@/lib/api/appointment-logs')
              try {
                await logAppointmentChange(
                  editingAppointment.id,
                  editingAppointment.patient_id || '',
                  oldData,
                  {
                    ...appointmentData,
                    appointment_date: formatDateForDB(selectedDate)
                  },
                  'system',
                  '予約情報を即座に更新しました'
                )
                console.log('予約変更ログ記録完了')
              } catch (logError) {
                console.error('予約変更ログの記録に失敗:', logError)
                // ログ記録の失敗は予約操作を止めない
              }

              // 予約一覧を再読み込み
              const dateString = formatDateForDB(selectedDate)
              const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
              setAppointments(updatedAppointments)

              // editingAppointmentも最新データに更新
              const updatedAppointment = updatedAppointments.find(apt => apt.id === editingAppointment.id)
              if (updatedAppointment) {
                setEditingAppointment(updatedAppointment)
                console.log('editingAppointmentを最新データに更新しました:', updatedAppointment)
              }
            }
          } catch (error) {
            console.error('予約即座更新エラー:', error)
          }
        }}
        onCopyAppointment={handleCopyAppointment}
        onSave={async (appointmentData) => {
          try {
            console.log('予約保存:', appointmentData)

            let savedAppointment
            // editingAppointment.idが存在する場合のみ更新、そうでなければ新規作成
            if (editingAppointment?.id) {
              // 既存の予約を更新
              savedAppointment = await updateAppointment(editingAppointment.id, {
                ...appointmentData,
                appointment_date: formatDateForDB(selectedDate) // YYYY-MM-DD形式
              })
              console.log('既存予約更新完了:', savedAppointment)
            } else {
              // 新規予約を作成（コピー貼り付けを含む）
              savedAppointment = await createAppointment(clinicId, {
                ...appointmentData,
                appointment_date: formatDateForDB(selectedDate) // YYYY-MM-DD形式
              })
              console.log('新規予約作成完了:', savedAppointment)
            }
            
            // モーダルを閉じる
            setShowAppointmentModal(false)
            setEditingAppointment(null) // 編集状態をリセット

            // 選択状態をリセット
            setSelectedTimeSlots([])
            setSelectionStart(null)
            setSelectionEnd(null)
            setSelectedCell(null)
            setSelectedCells([])
            setIsSelectingCells(false)

            // コピー状態を解除（保存成功時のみ）
            if (isPasteMode) {
              console.log('予約保存成功: コピー状態を解除します')
              setCopiedAppointment(null)
              setIsPasteMode(false)
              if (onCopyStateChange) {
                onCopyStateChange(null, false)
              }
            }

            // 予約一覧を再読み込み
            const dateString = formatDateForDB(selectedDate)
            const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
            setAppointments(updatedAppointments)

            // 予約IDを返す（ログ作成のため）
            return savedAppointment?.id
            
          } catch (error) {
            console.error('予約保存エラー:', error)
            alert('予約の保存に失敗しました')
            throw error // エラーを再スローしてログ作成をスキップ
          }
        }}
        onAppointmentCancel={async () => {
          try {
            // キャンセル成功後に予約一覧を再読み込み
            const dateString = formatDateForDB(selectedDate)
            const updatedAppointments = await getAppointmentsByDate(clinicId, dateString)
            setAppointments(updatedAppointments)
            console.log('キャンセル後の予約一覧を再読み込みしました')
          } catch (error) {
            console.error('キャンセル後の予約一覧再読み込みエラー:', error)
          }
        }}
      />
    </div>
  )
}
