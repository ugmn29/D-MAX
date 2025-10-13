'use client'

import { Button } from '@/components/ui/button'
import type { ToothStatus, CariesLevel, RestorationType, MaterialType } from '@/lib/api/visual-exams'

interface VisualInputPanelProps {
  selectedTeeth: Set<number>
  onApplyStatus: (
    status: ToothStatus,
    cariesLevel?: CariesLevel,
    restorationType?: RestorationType,
    materialType?: MaterialType
  ) => void
  onClearSelection: () => void
}

export function VisualInputPanel({ selectedTeeth, onApplyStatus, onClearSelection }: VisualInputPanelProps) {
  const hasSelection = selectedTeeth.size > 0

  // 状態を適用（シンプル版）
  const handleApply = (
    status: ToothStatus,
    cariesLevel?: CariesLevel,
    restorationType?: RestorationType,
    materialType?: MaterialType
  ) => {
    onApplyStatus(status, cariesLevel, restorationType, materialType)
  }

  return (
    <div className="bg-slate-100 rounded-lg p-4 border border-gray-300">
      <div className="grid grid-cols-6 gap-2">
        {/* 左列：健全/欠損 */}
        <div className="flex flex-col gap-2">
          <div className="h-10" />
          <Button
            onClick={() => handleApply('healthy')}
            disabled={!hasSelection}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 h-10 text-xs"
          >
            健全
          </Button>
          <div className="h-10" />
          <Button
            onClick={() => handleApply('missing')}
            disabled={!hasSelection}
            className="bg-gray-300 hover:bg-gray-400 text-gray-900 border border-gray-400 h-10 text-xs"
          >
            欠損
          </Button>
          <div className="h-10" />
          <div className="h-10" />
        </div>

        {/* C列：空/CO/C1/C2/C3/C4 */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center justify-center text-xs font-semibold text-gray-700">C</div>
          <Button
            onClick={() => handleApply('caries', 'CO')}
            disabled={!hasSelection}
            className="bg-[#FFF9C4] hover:bg-[#FFF59D] text-gray-900 border border-yellow-300 h-10 text-xs"
          >
            CO
          </Button>
          <Button
            onClick={() => handleApply('caries', 'C1')}
            disabled={!hasSelection}
            className="bg-[#FFE082] hover:bg-[#FFD54F] text-gray-900 border border-orange-300 h-10 text-xs"
          >
            C1
          </Button>
          <Button
            onClick={() => handleApply('caries', 'C2')}
            disabled={!hasSelection}
            className="bg-[#FFB74D] hover:bg-[#FFA726] text-gray-900 border border-orange-400 h-10 text-xs"
          >
            C2
          </Button>
          <Button
            onClick={() => handleApply('caries', 'C3')}
            disabled={!hasSelection}
            className="bg-[#FF9800] hover:bg-[#FB8C00] text-white border border-orange-600 h-10 text-xs"
          >
            C3
          </Button>
          <Button
            onClick={() => handleApply('caries', 'C4')}
            disabled={!hasSelection}
            className="bg-[#F44336] hover:bg-[#E53935] text-white border border-red-600 h-10 text-xs"
          >
            C4
          </Button>
        </div>

        {/* In列：In/メタル/セラミック/CAD */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center justify-center text-xs font-semibold text-gray-700">In</div>
          <div className="h-10" />
          <Button
            onClick={() => handleApply('restoration', undefined, 'inlay', 'metal')}
            disabled={!hasSelection}
            className="bg-[#BDBDBD] hover:bg-[#9E9E9E] text-gray-900 border border-gray-400 h-10 text-xs"
          >
            メタル
          </Button>
          <Button
            onClick={() => handleApply('restoration', undefined, 'inlay', 'ceramic')}
            disabled={!hasSelection}
            className="bg-[#B3E5FC] hover:bg-[#81D4FA] text-gray-900 border border-blue-300 h-10 text-xs"
          >
            セラミック
          </Button>
          <Button
            onClick={() => handleApply('restoration', undefined, 'inlay', 'cad')}
            disabled={!hasSelection}
            className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-gray-900 border border-green-300 h-10 text-xs"
          >
            CAD
          </Button>
          <div className="h-10" />
        </div>

        {/* Cr列 */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center justify-center text-xs font-semibold text-gray-700">Cr</div>
          <div className="h-10" />
          <Button
            onClick={() => handleApply('restoration', undefined, 'crown', 'metal')}
            disabled={!hasSelection}
            className="bg-[#BDBDBD] hover:bg-[#9E9E9E] text-gray-900 border border-gray-400 h-10 text-xs"
          >
            メタル
          </Button>
          <Button
            onClick={() => handleApply('restoration', undefined, 'crown', 'ceramic')}
            disabled={!hasSelection}
            className="bg-[#B3E5FC] hover:bg-[#81D4FA] text-gray-900 border border-blue-300 h-10 text-xs"
          >
            セラミック
          </Button>
          <div className="flex gap-1">
            <Button
              onClick={() => handleApply('restoration', undefined, 'crown', 'cad')}
              disabled={!hasSelection}
              className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-gray-900 border border-green-300 h-10 text-xs flex-1"
            >
              CAD
            </Button>
            <Button
              onClick={() => handleApply('restoration', undefined, 'crown', 'hr')}
              disabled={!hasSelection}
              className="bg-[#E1BEE7] hover:bg-[#CE93D8] text-gray-900 border border-purple-300 h-10 text-xs flex-1"
            >
              HR
            </Button>
          </div>
        </div>

        {/* Br列 */}
        <div className="flex flex-col gap-2">
          <div className="h-10 flex items-center justify-center text-xs font-semibold text-gray-700">Br</div>
          <div className="h-10" />
          <Button
            onClick={() => handleApply('restoration', undefined, 'bridge', 'metal')}
            disabled={!hasSelection}
            className="bg-[#BDBDBD] hover:bg-[#9E9E9E] text-gray-900 border border-gray-400 h-10 text-xs"
          >
            メタル
          </Button>
          <Button
            onClick={() => handleApply('restoration', undefined, 'bridge', 'ceramic')}
            disabled={!hasSelection}
            className="bg-[#B3E5FC] hover:bg-[#81D4FA] text-gray-900 border border-blue-300 h-10 text-xs"
          >
            セラミック
          </Button>
          <div className="flex gap-1">
            <Button
              onClick={() => handleApply('restoration', undefined, 'bridge', 'cad')}
              disabled={!hasSelection}
              className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-gray-900 border border-green-300 h-10 text-xs flex-1"
            >
              CAD
            </Button>
            <Button
              onClick={() => handleApply('restoration', undefined, 'bridge', 'hr')}
              disabled={!hasSelection}
              className="bg-[#E1BEE7] hover:bg-[#CE93D8] text-gray-900 border border-purple-300 h-10 text-xs flex-1"
            >
              HR
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
