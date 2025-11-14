'use client'

import type { VisualToothData } from '@/lib/api/visual-exams'

interface DentalChartTableProps {
  toothData: Record<number, VisualToothData>
  selectedTeeth: Set<number>
  onToothClick: (toothNumber: number) => void
}

export function DentalChartTable({ toothData, selectedTeeth, onToothClick }: DentalChartTableProps) {
  // 上顎: 18-11, 21-28
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11]
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28]

  // 下顎: 48-41, 31-38
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41]
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38]

  const getToothLabel = (toothNumber: number): string => {
    const data = toothData[toothNumber]
    if (!data) return ''

    if (data.status === 'healthy') return ''
    if (data.status === 'missing') return '×'
    if (data.status === 'extraction_required') return '△'
    if (data.status === 'unerupted') return '▲'

    if (data.status === 'caries' && data.caries_level) {
      return data.caries_level
    }

    if (data.status === 'restoration') {
      let label = ''
      if (data.restoration_type === 'inlay') label = 'In'
      if (data.restoration_type === 'crown') label = 'Cr'
      if (data.restoration_type === 'bridge') label = 'Br'

      if (data.material_type) {
        const materialLabel: Record<string, string> = {
          ceramic: 'セ',
          metal: 'メ',
          cad: 'C',
          hr: 'H'
        }
        label += `(${materialLabel[data.material_type] || ''})`
      }
      return label
    }

    return ''
  }

  const getCellBackground = (toothNumber: number): string => {
    const data = toothData[toothNumber]
    if (!data || data.status === 'healthy') return 'bg-white'

    if (data.status === 'missing') return 'bg-white'
    if (data.status === 'extraction_required') return 'bg-yellow-200'
    if (data.status === 'unerupted') return 'bg-gray-100'

    if (data.status === 'caries') {
      const colors: Record<string, string> = {
        'CO': 'bg-[#FFF9C4]',
        'C1': 'bg-[#FFE082]',
        'C2': 'bg-[#FFB74D]',
        'C3': 'bg-[#FF9800]',
        'C4': 'bg-[#F44336]'
      }
      return colors[data.caries_level || ''] || 'bg-white'
    }

    if (data.status === 'restoration') {
      const colors: Record<string, string> = {
        ceramic: 'bg-[#B3E5FC]',
        metal: 'bg-[#BDBDBD]',
        cad: 'bg-[#C8E6C9]',
        hr: 'bg-[#E1BEE7]'
      }
      return colors[data.material_type || ''] || 'bg-white'
    }

    return 'bg-white'
  }

  const renderToothCell = (toothNumber: number) => {
    const isSelected = selectedTeeth.has(toothNumber)
    const bgColor = getCellBackground(toothNumber)
    const label = getToothLabel(toothNumber)

    return (
      <td
        key={toothNumber}
        className={`
          border border-gray-300 h-7 w-7 min-w-[1.75rem] max-w-[1.75rem] cursor-pointer text-center align-middle font-medium text-[9px]
          ${bgColor}
          ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
          hover:opacity-80 transition-opacity
        `}
        onClick={() => onToothClick(toothNumber)}
      >
        {label}
      </td>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full border-collapse">
        <tbody>
          {/* 上顎データ行 */}
          <tr>
            {upperRight.map(renderToothCell)}
            <td className="border border-gray-300 bg-gray-100 w-4" />
            {upperLeft.map(renderToothCell)}
          </tr>

          {/* 歯番表示行 */}
          <tr>
            {upperRight.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0 text-[8px] text-center text-gray-600">
                {toothNumber % 10}
              </td>
            ))}
            <td className="border border-gray-300 bg-gray-100 px-0.5 py-0 text-[8px] text-center font-bold w-3">
              ｜
            </td>
            {upperLeft.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0 text-[8px] text-center text-gray-600">
                {toothNumber % 10}
              </td>
            ))}
          </tr>

          {/* 下顎データ行 */}
          <tr>
            {lowerRight.map(renderToothCell)}
            <td className="border border-gray-300 bg-gray-100 w-4" />
            {lowerLeft.map(renderToothCell)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
