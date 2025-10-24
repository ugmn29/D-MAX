'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Modal } from '@/components/ui/modal'
import { Clock, Edit, Trash2, Plus } from 'lucide-react'
import { ShiftPattern } from '@/types/database'
import { getShiftPatterns, createShiftPattern, updateShiftPattern, deleteShiftPattern } from '@/lib/api/shift-patterns'
import { getBusinessHours } from '@/lib/api/clinic'

interface ShiftPatternsProps {
  clinicId: string
}

export function ShiftPatterns({ clinicId }: ShiftPatternsProps) {
  const [patterns, setPatterns] = useState<ShiftPattern[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ShiftPattern | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  
  const [newPattern, setNewPattern] = useState({
    abbreviation: '',
    name: '',
    start_time: '09:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
    no_break: false,
    memo: ''
  })

  // パターンデータの読み込み
  const loadPatterns = async () => {
    try {
      console.log('パターンデータ読み込み開始:', clinicId)
      setLoading(true)
      const data = await getShiftPatterns(clinicId)
      console.log('読み込んだパターンデータ:', data)
      setPatterns(data)
    } catch (error: any) {
      console.error('パターン読み込みエラー:', error)
      console.error('エラーの詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPatterns()
  }, [clinicId])

  // 診療時間から自動入力
  const loadBusinessHoursForPattern = async () => {
    try {
      console.log('診療時間を取得してパターンに自動入力')
      const businessHours = await getBusinessHours(clinicId)

      // 月曜日の診療時間を取得
      const mondayHours = businessHours.monday

      if (!mondayHours || !mondayHours.isOpen || !mondayHours.timeSlots || mondayHours.timeSlots.length === 0) {
        console.log('月曜日の診療時間が設定されていません')
        return
      }

      // 時間順にソート
      const sortedSlots = [...mondayHours.timeSlots].sort((a, b) => {
        const aMinutes = parseInt(a.start.split(':')[0]) * 60 + parseInt(a.start.split(':')[1])
        const bMinutes = parseInt(b.start.split(':')[0]) * 60 + parseInt(b.start.split(':')[1])
        return aMinutes - bMinutes
      })

      // 最初のスロットの開始時刻と最後のスロットの終了時刻を使用
      const startTime = sortedSlots[0].start
      const endTime = sortedSlots[sortedSlots.length - 1].end

      // 複数スロットがある場合、その間を休憩時間とする
      let breakStart = '12:00'
      let breakEnd = '13:00'
      let noBreak = false

      if (sortedSlots.length >= 2) {
        // 最初のスロットの終了時刻と2番目のスロットの開始時刻を休憩時間とする
        breakStart = sortedSlots[0].end
        breakEnd = sortedSlots[1].start
        noBreak = false
      } else {
        // スロットが1つだけの場合は休憩なし
        noBreak = true
      }

      console.log('自動入力する時間:', { startTime, endTime, breakStart, breakEnd, noBreak })

      setNewPattern(prev => ({
        ...prev,
        start_time: startTime,
        end_time: endTime,
        break_start: breakStart,
        break_end: breakEnd,
        no_break: noBreak
      }))
    } catch (error) {
      console.error('診療時間の取得エラー:', error)
      // エラーの場合はデフォルト値のまま
    }
  }

  // モーダルを開いたときに診療時間を自動入力
  const handleOpenAddModal = () => {
    setShowAddModal(true)
    loadBusinessHoursForPattern()
  }

  // 新規パターン追加
  const handleAddPattern = async () => {
    try {
      console.log('パターン追加開始:', {
        clinicId,
        newPattern,
        noBreak: newPattern.no_break
      })
      
      setLoading(true)
      
      const patternData = {
        abbreviation: newPattern.abbreviation,
        name: newPattern.name,
        start_time: newPattern.start_time,
        end_time: newPattern.end_time,
        break_start: newPattern.no_break ? null : newPattern.break_start,
        break_end: newPattern.no_break ? null : newPattern.break_end,
        memo: newPattern.memo || null,
        clinic_id: clinicId
      }
      
      console.log('送信するデータ:', patternData)
      
      const result = await createShiftPattern(clinicId, patternData)
      console.log('パターン作成成功:', result)
      
      setNewPattern({
        abbreviation: '',
        name: '',
        start_time: '09:00',
        end_time: '18:00',
        break_start: '12:00',
        break_end: '13:00',
        no_break: false,
        memo: ''
      })
      setShowAddModal(false)
      await loadPatterns()
    } catch (error: any) {
      console.error('パターン追加エラー:', error)
      console.error('エラーの詳細:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      alert(`パターンの追加に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // パターン編集
  const handleEditPattern = async (pattern: ShiftPattern) => {
    try {
      setLoading(true)
      await updateShiftPattern(clinicId, pattern.id, {
        abbreviation: pattern.abbreviation,
        name: pattern.name,
        start_time: pattern.start_time,
        end_time: pattern.end_time,
        break_start: pattern.break_start,
        break_end: pattern.break_end,
        memo: pattern.memo
      })
      
      setEditingPattern(null)
      await loadPatterns()
    } catch (error) {
      console.error('パターン編集エラー:', error)
      alert('パターンの編集に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // パターン削除
  const handleDeletePattern = async (patternId: string) => {
    if (!confirm('このパターンを削除しますか？')) return
    
    try {
      setLoading(true)
      await deleteShiftPattern(clinicId, patternId)
      await loadPatterns()
    } catch (error) {
      console.error('パターン削除エラー:', error)
      alert('パターンの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 時間フォーマット関数
  const formatTime = (time: string | null) => {
    if (!time || time === '00:00') return 'なし'
    return time
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">短縮名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">パターン名</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">勤務時間</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">休憩時間</th>
                    <th className="w-24"></th>
                  </tr>
                </thead>
                <tbody>
                  {patterns.map((pattern) => (
                    <tr key={pattern.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        {editingPattern?.id === pattern.id ? (
                          <Input
                            value={editingPattern.abbreviation}
                            onChange={(e) => setEditingPattern(prev => 
                              prev ? { ...prev, abbreviation: e.target.value } : null
                            )}
                            className="w-20"
                          />
                        ) : (
                          <span className="font-medium">{pattern.abbreviation}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPattern?.id === pattern.id ? (
                          <Input
                            value={editingPattern.name}
                            onChange={(e) => setEditingPattern(prev => 
                              prev ? { ...prev, name: e.target.value } : null
                            )}
                          />
                        ) : (
                          pattern.name
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPattern?.id === pattern.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={editingPattern.start_time}
                              onChange={(e) => setEditingPattern(prev => 
                                prev ? { ...prev, start_time: e.target.value } : null
                              )}
                              className="w-24"
                            />
                            <span>～</span>
                            <Input
                              type="time"
                              value={editingPattern.end_time}
                              onChange={(e) => setEditingPattern(prev => 
                                prev ? { ...prev, end_time: e.target.value } : null
                              )}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          `${pattern.start_time.substring(0, 5)} - ${pattern.end_time.substring(0, 5)}`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingPattern?.id === pattern.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={editingPattern.break_start || ''}
                              onChange={(e) => setEditingPattern(prev => 
                                prev ? { ...prev, break_start: e.target.value } : null
                              )}
                              className="w-24"
                            />
                            <span>～</span>
                            <Input
                              type="time"
                              value={editingPattern.break_end || ''}
                              onChange={(e) => setEditingPattern(prev => 
                                prev ? { ...prev, break_end: e.target.value } : null
                              )}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          formatTime(pattern.break_start) === 'なし' 
                            ? 'なし' 
                            : `${formatTime(pattern.break_start)?.substring(0, 5) || ''} - ${formatTime(pattern.break_end)?.substring(0, 5) || ''}`
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {editingPattern?.id === pattern.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEditPattern(editingPattern)}
                                className="h-8 px-3"
                              >
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPattern(null)}
                                className="h-8 px-3"
                              >
                                キャンセル
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingPattern(pattern)}
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePattern(pattern.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新規パターン追加ボタン */}
      <div className="flex justify-end">
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>新規パターン追加</span>
        </Button>
      </div>

      {/* 新規パターン追加モーダル */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="新規パターン追加"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="abbreviation">短縮名</Label>
              <Input
                id="abbreviation"
                value={newPattern.abbreviation}
                onChange={(e) => setNewPattern(prev => ({ ...prev, abbreviation: e.target.value }))}
                placeholder="例: F"
                maxLength={10}
              />
            </div>
            <div>
              <Label htmlFor="pattern_name">パターン名</Label>
              <Input
                id="pattern_name"
                value={newPattern.name}
                onChange={(e) => setNewPattern(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例: フルタイム"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">開始時間</Label>
              <div className="relative">
                <Input
                  id="start_time"
                  type="time"
                  value={newPattern.start_time}
                  onChange={(e) => setNewPattern(prev => ({ ...prev, start_time: e.target.value }))}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
            <div>
              <Label htmlFor="end_time">終了時間</Label>
              <div className="relative">
                <Input
                  id="end_time"
                  type="time"
                  value={newPattern.end_time}
                  onChange={(e) => setNewPattern(prev => ({ ...prev, end_time: e.target.value }))}
                />
                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="no_break"
              checked={newPattern.no_break}
              onCheckedChange={(checked) => setNewPattern(prev => ({ ...prev, no_break: !!checked }))}
            />
            <Label htmlFor="no_break">休憩なし</Label>
          </div>

          {!newPattern.no_break && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="break_start">休憩開始</Label>
                <div className="relative">
                  <Input
                    id="break_start"
                    type="time"
                    value={newPattern.break_start}
                    onChange={(e) => setNewPattern(prev => ({ ...prev, break_start: e.target.value }))}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              <div>
                <Label htmlFor="break_end">休憩終了</Label>
                <div className="relative">
                  <Input
                    id="break_end"
                    type="time"
                    value={newPattern.break_end}
                    onChange={(e) => setNewPattern(prev => ({ ...prev, break_end: e.target.value }))}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleAddPattern}
              disabled={loading || !newPattern.abbreviation || !newPattern.name}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>パターンを追加</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
