'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BulkFillConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  type: 'ppd' | 'mobility'
  value: number
  affectedCount: number
}

export function BulkFillConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  type,
  value,
  affectedCount,
}: BulkFillConfirmationDialogProps) {
  const typeLabel = type === 'ppd' ? 'PPD（ポケット深さ）' : '動揺度'
  const valueLabel = type === 'ppd' ? `${value}mm` : `${value}度`

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>一括入力の確認</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p className="text-gray-700">
                {typeLabel}を全ての測定点に一括で設定します。
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="font-semibold text-blue-900 mb-2">設定内容:</p>
                <p className="text-blue-800">
                  値: <span className="font-bold text-lg">{valueLabel}</span>
                </p>
                <p className="text-blue-800">
                  対象: 欠損歯を除く全ての歯（約{affectedCount}箇所）
                </p>
              </div>
              <p className="text-amber-700 text-sm">
                ⚠️ 既存のデータは上書きされます。
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
            一括入力を実行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
