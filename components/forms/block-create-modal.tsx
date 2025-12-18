'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { Trash2 } from 'lucide-react'
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

interface EditingBlock {
  id: string
  start_time: string
  end_time: string
  block_color?: string
  block_text?: string
  staff1_id?: string | null
  unit_id?: string | null
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
  units?: Unit[]
  onSave: (blockData: any) => void
  onUpdate?: (blockId: string, blockData: any) => void
  onDelete?: (blockId: string) => void
  editingBlock?: EditingBlock | null
}

// ブロックの色定義
const BLOCK_COLORS = [
  { id: 'red', name: '赤', color: '#EF4444', bgClass: 'bg-red-500' },
  { id: 'yellow', name: '黄', color: '#EAB308', bgClass: 'bg-yellow-500' },
  { id: 'black', name: '黒', color: '#1F2937', bgClass: 'bg-gray-800' },
  { id: 'blue', name: '青', color: '#3B82F6', bgClass: 'bg-blue-500' },
  { id: 'green', name: '緑', color: '#22C55E', bgClass: 'bg-green-500' },
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
  units = [],
  onSave,
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

  // スタッフ・ユニット
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')

  // 編集モードかどうか
  const isEditMode = !!editingBlock

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
      if (editingBlock) {
        // 編集モード: 既存データをセット
        setStartTime(editingBlock.start_time)
        setSelectedColor(editingBlock.block_color || 'red')
        setBlockText(editingBlock.block_text || '')
        setDuration(calculateDuration(editingBlock.start_time, editingBlock.end_time))
        setSelectedStaffId(editingBlock.staff1_id || '')
        setSelectedUnitId(editingBlock.unit_id || '')
      } else {
        // 新規作成モード
        setStartTime(selectedTime)
        setSelectedColor('red')
        setBlockText('')
        setDuration(30)

        // スタッフの初期選択
        if (selectedStaffIndex !== undefined && workingStaff[selectedStaffIndex]) {
          setSelectedStaffId(workingStaff[selectedStaffIndex].staff.id)
        } else if (workingStaff.length > 0) {
          setSelectedStaffId(workingStaff[0].staff.id)
        } else {
          setSelectedStaffId('')
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

  // 終了時間を計算
  const calculateEndTime = (start: string, durationMinutes: number): string => {
    const [hours, minutes] = start.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMinutes = totalMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  // 保存処理
  const handleSave = async () => {
    setSaving(true)
    try {
      const endTime = calculateEndTime(startTime, duration)

      const blockData = {
        clinic_id: clinicId,
        patient_id: '00000000-0000-0000-0000-000000000000', // ブロック用のダミー患者ID
        appointment_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        staff1_id: selectedStaffId || null,
        unit_id: selectedUnitId || null,
        status: '終了', // ブロックはステータス管理不要なので「終了」に設定
        memo: blockText,
        is_block: true,
        block_color: selectedColor,
        block_text: blockText
      }

      if (isEditMode && editingBlock && onUpdate) {
        // 編集モード: 更新
        await onUpdate(editingBlock.id, blockData)
      } else {
        // 新規作成モード
        await onSave(blockData)
      }
      onClose()
    } catch (error) {
      console.error('ブロック保存エラー:', error)
      alert(isEditMode ? 'ブロックの更新に失敗しました' : 'ブロックの作成に失敗しました')
    } finally {
      setSaving(false)
    }
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
      <div className="space-y-6">
        {/* 色選択 */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">色を選択</Label>
          <div className="flex space-x-3">
            {BLOCK_COLORS.map((color) => (
              <button
                key={color.id}
                type="button"
                onClick={() => setSelectedColor(color.id)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  selectedColor === color.id
                    ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: color.color }}
                title={color.name}
              >
                {selectedColor === color.id && (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* テキスト入力 */}
        <div>
          <Label htmlFor="blockText" className="text-sm font-medium text-gray-700 mb-2 block">
            テキスト（任意）
          </Label>
          <Textarea
            id="blockText"
            value={blockText}
            onChange={(e) => setBlockText(e.target.value)}
            placeholder="ブロックの内容を入力..."
            rows={3}
            className="w-full"
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

        {/* スタッフ・ユニット選択 */}
        {(workingStaff.length > 0 || units.length > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {/* スタッフ選択 */}
            {workingStaff.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">スタッフ</Label>
                <Select value={selectedStaffId || 'none'} onValueChange={(v) => setSelectedStaffId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="スタッフを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">なし</SelectItem>
                    {workingStaff.map((ws) => (
                      <SelectItem key={ws.staff.id} value={ws.staff.id}>
                        {ws.staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ユニット選択 */}
            {units.length > 0 && (
              <div>
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
              onClick={handleSave}
              disabled={saving || deleting}
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
