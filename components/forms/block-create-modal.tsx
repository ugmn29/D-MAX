'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Modal } from '@/components/ui/modal'
import { Trash2, AlertTriangle, ChevronRight, ChevronDown, Users } from 'lucide-react'
import { Unit } from '@/lib/api/units'

interface WorkingStaff {
  staff: {
    id: string
    name: string
    position: string
  }
  shift_pattern: any
  is_holiday: boolean
}

interface AllStaff {
  id: string
  name: string
  position: string
}

interface EditingBlock {
  id: string
  start_time: string
  end_time: string
  block_color?: string
  block_text?: string
  staff1_id?: string | null
  unit_id?: string | null
}

interface ExistingAppointment {
  id: string
  start_time: string
  end_time: string
  staff1_id?: string | null
  is_block?: boolean
  status?: string
}

interface BlockCreateModalProps {
  isOpen: boolean
  onClose: () => void
  clinicId: string
  selectedDate: string
  selectedTime: string
  selectedStaffIndex?: number
  selectedUnitIndex?: number
  timeSlotMinutes?: number
  workingStaff?: WorkingStaff[]
  allStaff?: AllStaff[]  // 全スタッフリスト（出勤チェック用）
  units?: Unit[]
  appointments?: ExistingAppointment[]  // 既存の予約リスト（重複チェック用）
  onSave: (blockData: any) => void
  onSaveMultiple?: (blockDataArray: any[]) => void  // 複数ブロック保存用
  onUpdate?: (blockId: string, blockData: any) => void
  onDelete?: (blockId: string) => void
  editingBlock?: EditingBlock | null
}

// ブロックの色定義（2行×3列）
const BLOCK_COLORS = [
  { id: 'red', name: '赤', color: '#EF4444', bgClass: 'bg-red-500' },
  { id: 'yellow', name: '黄', color: '#EAB308', bgClass: 'bg-yellow-500' },
  { id: 'black', name: '黒', color: '#1F2937', bgClass: 'bg-gray-800' },
  { id: 'blue', name: '青', color: '#3B82F6', bgClass: 'bg-blue-500' },
  { id: 'green', name: '緑', color: '#22C55E', bgClass: 'bg-green-500' },
  { id: 'gray', name: 'グレー', color: '#9CA3AF', bgClass: 'bg-gray-400' },
]

export function BlockCreateModal({
  isOpen,
  onClose,
  clinicId,
  selectedDate,
  selectedTime,
  selectedStaffIndex,
  selectedUnitIndex,
  timeSlotMinutes = 15,
  workingStaff = [],
  allStaff = [],
  units = [],
  appointments = [],
  onSave,
  onSaveMultiple,
  onUpdate,
  onDelete,
  editingBlock
}: BlockCreateModalProps) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ブロックデータ
  const [selectedColor, setSelectedColor] = useState<string>('red')
  const [blockText, setBlockText] = useState('')

  // 時間
  const [startTime, setStartTime] = useState(selectedTime)
  const [duration, setDuration] = useState(30)

  // スタッフ・ユニット（複数選択対応）
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [showNonWorkingWarning, setShowNonWorkingWarning] = useState(false)
  const [nonWorkingStaffNames, setNonWorkingStaffNames] = useState<string[]>([])
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [showConflictWarning, setShowConflictWarning] = useState(false)
  const [conflictingStaffNames, setConflictingStaffNames] = useState<string[]>([])
  const [availableStaffIds, setAvailableStaffIds] = useState<string[]>([])
  const [expandedPositions, setExpandedPositions] = useState<string[]>([])
  const [hoveredPosition, setHoveredPosition] = useState<string | null>(null)

  // 編集モードかどうか
  const isEditMode = !!editingBlock

  // 出勤中のスタッフIDリスト
  const workingStaffIds = workingStaff.map(ws => ws.staff.id)

  // 所要時間を計算
  const calculateDuration = (start: string, end: string): number => {
    const [startHours, startMinutes] = start.split(':').map(Number)
    const [endHours, endMinutes] = end.split(':').map(Number)
    const startTotal = startHours * 60 + startMinutes
    const endTotal = endHours * 60 + endMinutes
    return endTotal - startTotal
  }

  // モーダルが開かれたときに初期値を設定
  useEffect(() => {
    if (isOpen) {
      setShowNonWorkingWarning(false)
      setNonWorkingStaffNames([])

      if (editingBlock) {
        // 編集モード: 既存データをセット
        setStartTime(editingBlock.start_time)
        setSelectedColor(editingBlock.block_color || 'red')
        setBlockText(editingBlock.block_text || '')
        setDuration(calculateDuration(editingBlock.start_time, editingBlock.end_time))
        setSelectedStaffIds(editingBlock.staff1_id ? [editingBlock.staff1_id] : [])
        setSelectedUnitId(editingBlock.unit_id || '')
      } else {
        // 新規作成モード
        setStartTime(selectedTime)
        setSelectedColor('red')
        setBlockText('')
        setDuration(30)

        // スタッフの初期選択（複数選択なので空配列で開始）
        if (selectedStaffIndex !== undefined && workingStaff[selectedStaffIndex]) {
          setSelectedStaffIds([workingStaff[selectedStaffIndex].staff.id])
        } else {
          setSelectedStaffIds([])
        }

        // ユニットの初期選択
        if (selectedUnitIndex !== undefined && units[selectedUnitIndex]) {
          setSelectedUnitId(units[selectedUnitIndex].id)
        } else if (units.length > 0) {
          setSelectedUnitId(units[0].id)
        } else {
          setSelectedUnitId('')
        }
      }
    }
  }, [isOpen, selectedTime, selectedStaffIndex, selectedUnitIndex, workingStaff, units, editingBlock])

  // スタッフ選択のトグル
  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) {
        return prev.filter(id => id !== staffId)
      } else {
        return [...prev, staffId]
      }
    })
  }

  // 全選択/全解除
  const toggleAllStaff = () => {
    const staffList = allStaff.length > 0 ? allStaff : workingStaff.map(ws => ws.staff)
    if (selectedStaffIds.length === staffList.length) {
      setSelectedStaffIds([])
    } else {
      setSelectedStaffIds(staffList.map(s => s.id))
    }
  }

  // 出勤中スタッフのみ全選択
  const selectAllWorkingStaff = () => {
    setSelectedStaffIds(workingStaffIds)
  }

  // 役職ごとにスタッフをグループ化
  const getStaffByPosition = () => {
    const staffList = allStaff.length > 0 ? allStaff : workingStaff.map(ws => ws.staff)
    const grouped: { [position: string]: typeof staffList } = {}

    staffList.forEach(staff => {
      const position = staff.position || '未設定'
      if (!grouped[position]) {
        grouped[position] = []
      }
      grouped[position].push(staff)
    })

    return grouped
  }

  // 役職の展開/折りたたみをトグル
  const togglePositionExpand = (position: string) => {
    setExpandedPositions(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position)
      } else {
        return [...prev, position]
      }
    })
  }

  // 役職内の全スタッフを選択/解除
  const togglePositionStaff = (position: string) => {
    const staffByPosition = getStaffByPosition()
    const positionStaffIds = staffByPosition[position]?.map(s => s.id) || []

    const allSelected = positionStaffIds.every(id => selectedStaffIds.includes(id))

    if (allSelected) {
      // 全員選択済みなら解除
      setSelectedStaffIds(prev => prev.filter(id => !positionStaffIds.includes(id)))
    } else {
      // 未選択があれば全員追加
      setSelectedStaffIds(prev => {
        const newIds = positionStaffIds.filter(id => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  // 終了時間を計算
  const calculateEndTime = (start: string, durationMinutes: number): string => {
    const [hours, minutes] = start.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // 時間を分に変換
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // 既存の予約との重複をチェック（重複しているスタッフIDのリストを返す）
  const getConflictingStaffIds = (): string[] => {
    const endTime = calculateEndTime(startTime, duration)
    const blockStart = timeToMinutes(startTime)
    const blockEnd = timeToMinutes(endTime)

    // キャンセルされていない予約のみチェック（ブロックは除外）
    const activeAppointments = appointments.filter(apt =>
      apt.status !== 'キャンセル' && !apt.is_block
    )

    const conflicting: string[] = []

    for (const staffId of selectedStaffIds) {
      for (const apt of activeAppointments) {
        // 編集モードの場合、自分自身はスキップ
        if (isEditMode && editingBlock && apt.id === editingBlock.id) continue

        // 同じスタッフの予約のみチェック
        if (apt.staff1_id !== staffId) continue

        const aptStart = timeToMinutes(apt.start_time)
        const aptEnd = timeToMinutes(apt.end_time)

        // 時間が重複しているかチェック
        if (!(blockEnd <= aptStart || blockStart >= aptEnd)) {
          if (!conflicting.includes(staffId)) {
            conflicting.push(staffId)
          }
          break
        }
      }
    }

    return conflicting
  }

  // スタッフなし（全体ブロック）の場合の重複チェック
  const checkGlobalBlockConflict = (): string | null => {
    if (selectedStaffIds.length > 0) return null

    const endTime = calculateEndTime(startTime, duration)
    const blockStart = timeToMinutes(startTime)
    const blockEnd = timeToMinutes(endTime)

    // キャンセルされていない予約のみチェック（ブロックは除外）
    const activeAppointments = appointments.filter(apt =>
      apt.status !== 'キャンセル' && !apt.is_block
    )

    for (const apt of activeAppointments) {
      if (isEditMode && editingBlock && apt.id === editingBlock.id) continue

      const aptStart = timeToMinutes(apt.start_time)
      const aptEnd = timeToMinutes(apt.end_time)

      if (!(blockEnd <= aptStart || blockStart >= aptEnd)) {
        return `${apt.start_time}〜${apt.end_time}に既存の予約があるため、全体ブロックを作成できません`
      }
    }

    return null
  }

  // 出勤していないスタッフをチェック
  const checkNonWorkingStaff = (): string[] => {
    const staffList = allStaff.length > 0 ? allStaff : workingStaff.map(ws => ws.staff)
    const nonWorking: string[] = []

    selectedStaffIds.forEach(staffId => {
      if (!workingStaffIds.includes(staffId)) {
        const staff = staffList.find(s => s.id === staffId)
        if (staff) {
          nonWorking.push(staff.name)
        }
      }
    })

    return nonWorking
  }

  // 保存前チェック
  const handleSaveClick = () => {
    setConflictError(null)
    setShowConflictWarning(false)

    // スタッフなしの全体ブロックの場合
    if (selectedStaffIds.length === 0) {
      const globalConflict = checkGlobalBlockConflict()
      if (globalConflict) {
        setConflictError(globalConflict)
        return
      }
    } else {
      // スタッフ選択ありの場合、重複しているスタッフをチェック
      const conflicting = getConflictingStaffIds()
      const staffList = allStaff.length > 0 ? allStaff : workingStaff.map(ws => ws.staff)

      if (conflicting.length > 0) {
        const available = selectedStaffIds.filter(id => !conflicting.includes(id))

        if (available.length === 0) {
          // 全員重複している場合はエラー
          const names = conflicting.map(id => staffList.find(s => s.id === id)?.name || '').filter(Boolean)
          setConflictError(`選択したスタッフ（${names.join('、')}）は全員既存の予約と重複しているため、ブロックを作成できません`)
          return
        }

        // 一部重複の場合は警告を表示
        const conflictNames = conflicting.map(id => staffList.find(s => s.id === id)?.name || '').filter(Boolean)
        setConflictingStaffNames(conflictNames)
        setAvailableStaffIds(available)
        setShowConflictWarning(true)
        return
      }
    }

    // 未出勤スタッフチェック
    const nonWorking = checkNonWorkingStaff()
    if (nonWorking.length > 0) {
      setNonWorkingStaffNames(nonWorking)
      setShowNonWorkingWarning(true)
    } else {
      handleSave()
    }
  }

  // 重複しているスタッフを除外して保存
  const handleSaveWithoutConflicting = () => {
    setShowConflictWarning(false)
    // 利用可能なスタッフIDのみで保存
    handleSaveWithStaffIds(availableStaffIds)
  }

  // 保存処理（引数でスタッフIDリストを渡せる）
  const handleSaveWithStaffIds = async (staffIds: string[]) => {
    setShowNonWorkingWarning(false)
    setShowConflictWarning(false)
    setSaving(true)
    try {
      const endTime = calculateEndTime(startTime, duration)

      if (isEditMode && editingBlock && onUpdate) {
        // 編集モード: 更新（単一スタッフのみ）
        const blockData = {
          clinic_id: clinicId,
          patient_id: '00000000-0000-0000-0000-000000000000',
          appointment_date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          staff1_id: staffIds.length > 0 ? staffIds[0] : null,
          unit_id: selectedUnitId || null,
          status: '終了',
          memo: blockText,
          is_block: true,
          block_color: selectedColor,
          block_text: blockText
        }
        await onUpdate(editingBlock.id, blockData)
      } else {
        // 新規作成モード
        if (staffIds.length === 0) {
          // スタッフなし（全員共通ブロック）
          const blockData = {
            clinic_id: clinicId,
            patient_id: '00000000-0000-0000-0000-000000000000',
            appointment_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            staff1_id: null,
            unit_id: selectedUnitId || null,
            status: '終了',
            memo: blockText,
            is_block: true,
            block_color: selectedColor,
            block_text: blockText
          }
          await onSave(blockData)
        } else if (staffIds.length === 1) {
          // 1人選択
          const blockData = {
            clinic_id: clinicId,
            patient_id: '00000000-0000-0000-0000-000000000000',
            appointment_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            staff1_id: staffIds[0],
            unit_id: selectedUnitId || null,
            status: '終了',
            memo: blockText,
            is_block: true,
            block_color: selectedColor,
            block_text: blockText
          }
          await onSave(blockData)
        } else {
          // 複数選択 → 複数ブロック作成
          const blockDataArray = staffIds.map(staffId => ({
            clinic_id: clinicId,
            patient_id: '00000000-0000-0000-0000-000000000000',
            appointment_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            staff1_id: staffId,
            unit_id: selectedUnitId || null,
            status: '終了',
            memo: blockText,
            is_block: true,
            block_color: selectedColor,
            block_text: blockText
          }))

          if (onSaveMultiple) {
            await onSaveMultiple(blockDataArray)
          } else {
            // fallback: 1つずつ保存
            for (const blockData of blockDataArray) {
              await onSave(blockData)
            }
          }
        }
      }
      onClose()
    } catch (error) {
      console.error('ブロック保存エラー:', error)
      alert(isEditMode ? 'ブロックの更新に失敗しました' : 'ブロックの作成に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // デフォルトの保存処理（選択されたスタッフIDを使用）
  const handleSave = () => {
    handleSaveWithStaffIds(selectedStaffIds)
  }

  // 削除処理
  const handleDelete = async () => {
    if (!editingBlock || !onDelete) return

    if (!confirm('このブロックを削除しますか？')) return

    setDeleting(true)
    try {
      await onDelete(editingBlock.id)
      onClose()
    } catch (error) {
      console.error('ブロック削除エラー:', error)
      alert('ブロックの削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  // 時間選択肢を生成
  const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += timeSlotMinutes) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        options.push(time)
      }
    }
    return options
  }

  // 所要時間の選択肢
  const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240]

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "ブロック編集" : "ブロック作成"}
      size="md"
    >
      <div className="space-y-4">
        {/* 色選択とテキスト入力 */}
        <div className="flex items-start gap-3">
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {BLOCK_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.id)}
                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                  selectedColor === color.id
                    ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                {selectedColor === color.id && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <Textarea
            id="blockText"
            value={blockText}
            onChange={(e) => setBlockText(e.target.value)}
            placeholder="ブロックの内容を入力..."
            rows={2}
            className="flex-1"
          />
        </div>

        {/* 時間設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">開始時間</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {generateTimeOptions().map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">所要時間</Label>
            <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d}分
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 終了時間表示 */}
        <div className="text-sm text-gray-600">
          終了時間: <span className="font-medium">{calculateEndTime(startTime, duration)}</span>
        </div>

        {/* スタッフ選択とユニット選択（横並び） */}
        <div className="flex gap-4">
          {/* スタッフ選択（役職別グループ表示） */}
          {(workingStaff.length > 0 || allStaff.length > 0) && (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">スタッフ選択</Label>
                <div className="flex space-x-2">
                  {!isEditMode && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllWorkingStaff}
                        className="text-xs h-6 px-2"
                      >
                        出勤中全員
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={toggleAllStaff}
                        className="text-xs h-6 px-2"
                      >
                        {selectedStaffIds.length === (allStaff.length > 0 ? allStaff.length : workingStaff.length) ? '全解除' : '全員選択'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="border rounded-lg p-2 max-h-60 overflow-y-auto space-y-1">
                {Object.entries(getStaffByPosition()).map(([position, staffList]) => {
                  const isHovered = hoveredPosition === position
                  const positionStaffIds = staffList.map(s => s.id)
                  const selectedCount = positionStaffIds.filter(id => selectedStaffIds.includes(id)).length
                  const allSelected = selectedCount === staffList.length
                  const someSelected = selectedCount > 0 && selectedCount < staffList.length

                  return (
                    <div
                      key={position}
                      className="rounded-lg overflow-hidden"
                      onMouseEnter={() => setHoveredPosition(position)}
                      onMouseLeave={() => setHoveredPosition(null)}
                    >
                      {/* 役職ヘッダー */}
                      <div
                        className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                          isHovered ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {isHovered ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{position}</span>
                          <span className="text-xs text-gray-400">({staffList.length}名)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {selectedCount > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {selectedCount}名選択
                            </span>
                          )}
                          <Checkbox
                            checked={allSelected}
                            className={someSelected ? 'data-[state=checked]:bg-blue-300' : ''}
                            onCheckedChange={() => togglePositionStaff(position)}
                          />
                        </div>
                      </div>

                      {/* スタッフリスト（ホバー時に表示） */}
                      {isHovered && (
                        <div className="bg-gray-50 border-t border-gray-100">
                          {staffList.map((staff) => {
                            const isWorking = workingStaffIds.includes(staff.id)
                            const isSelected = selectedStaffIds.includes(staff.id)
                            return (
                              <div
                                key={staff.id}
                                className={`flex items-center space-x-2 p-2 pl-10 cursor-pointer hover:bg-gray-100 transition-colors ${
                                  isSelected ? 'bg-blue-50' : ''
                                }`}
                                onClick={() => toggleStaffSelection(staff.id)}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleStaffSelection(staff.id)}
                                />
                                <span className={`text-sm ${!isWorking ? 'text-gray-400' : ''}`}>
                                  {staff.name}
                                  {!isWorking && <span className="ml-1 text-xs text-orange-500">(未出勤)</span>}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedStaffIds.length === 0
                  ? '選択なし（全員共通ブロック）'
                  : `${selectedStaffIds.length}名選択中`}
              </p>
            </div>
          )}

          {/* ユニット選択 */}
          {units.length > 0 && (
            <div className="w-40">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">ユニット</Label>
              <Select value={selectedUnitId || 'none'} onValueChange={(v) => setSelectedUnitId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="ユニットを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">なし</SelectItem>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* 予約との重複エラー */}
        {conflictError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">ブロックを作成できません</p>
                <p className="text-sm text-red-700 mt-1">{conflictError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConflictError(null)}
                  className="mt-3"
                >
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 一部スタッフに予約が重複している警告 */}
        {showConflictWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">一部のスタッフに既存予約があります</p>
                <p className="text-sm text-yellow-700 mt-1">
                  {conflictingStaffNames.join('、')}さんには既存の予約があるため、ブロックを作成できません。
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  他の{availableStaffIds.length}名のスタッフのみブロックを作成しますか？
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConflictWarning(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveWithoutConflicting}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    {availableStaffIds.length}名のみ作成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 出勤していないスタッフの警告 */}
        {showNonWorkingWarning && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">出勤がありません</p>
                <p className="text-sm text-orange-700 mt-1">
                  {nonWorkingStaffNames.join('、')}さんは本日出勤していませんが、よろしいですか？
                </p>
                <div className="flex space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowNonWorkingWarning(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    このまま作成
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div className="flex justify-between pt-4 border-t">
          {/* 削除ボタン（編集モードのみ） */}
          <div>
            {isEditMode && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? '削除中...' : '削除'}
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={saving || deleting || showNonWorkingWarning || showConflictWarning}
              style={{ backgroundColor: BLOCK_COLORS.find(c => c.id === selectedColor)?.color }}
              className="text-white"
            >
              {saving ? (isEditMode ? '更新中...' : '作成中...') : (isEditMode ? 'ブロック更新' : 'ブロック作成')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

// 色IDから色コードを取得するヘルパー関数をエクスポート
export function getBlockColor(colorId: string): string {
  const color = BLOCK_COLORS.find(c => c.id === colorId)
  return color?.color || '#6B7280'
}

export { BLOCK_COLORS }
