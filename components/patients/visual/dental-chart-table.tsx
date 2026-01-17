'use client'

import type { VisualToothData } from '@/lib/api/visual-exams'

interface DentalChartTableProps {
  toothData: Record<number, VisualToothData>
  selectedTeeth: Set<number>
  onToothClick: (toothNumber: number) => void
  disabledTeeth?: Set<number>  // 選択不可の歯（グレーアウト表示）
}

export function DentalChartTable({ toothData, selectedTeeth, onToothClick, disabledTeeth = new Set() }: DentalChartTableProps) {
  // 永久歯
  const upperRightPermanent = [18, 17, 16, 15, 14, 13, 12, 11]
  const upperLeftPermanent = [21, 22, 23, 24, 25, 26, 27, 28]
  const lowerRightPermanent = [48, 47, 46, 45, 44, 43, 42, 41]
  const lowerLeftPermanent = [31, 32, 33, 34, 35, 36, 37, 38]

  // 乳歯（FDI方式）
  const upperRightDeciduous = [55, 54, 53, 52, 51]
  const upperLeftDeciduous = [61, 62, 63, 64, 65]
  const lowerRightDeciduous = [85, 84, 83, 82, 81]
  const lowerLeftDeciduous = [71, 72, 73, 74, 75]

  // 乳歯データの有無をチェック（status が 'none' 以外のデータがある場合のみ表示）
  const allDeciduousTeeth = [
    ...upperRightDeciduous,
    ...upperLeftDeciduous,
    ...lowerRightDeciduous,
    ...lowerLeftDeciduous
  ]
  const hasDeciduousData = allDeciduousTeeth.some(toothNumber => {
    const data = toothData[toothNumber]
    return data && data.status !== 'none'
  })

  // FDI歯番号を表示用文字列に変換
  const toothNumberToDisplay = (toothNumber: number): string => {
    // 乳歯のマッピング
    const deciduousMap: Record<number, string> = {
      55: 'E', 54: 'D', 53: 'C', 52: 'B', 51: 'A',
      61: 'A', 62: 'B', 63: 'C', 64: 'D', 65: 'E',
      85: 'E', 84: 'D', 83: 'C', 82: 'B', 81: 'A',
      71: 'A', 72: 'B', 73: 'C', 74: 'D', 75: 'E',
    }

    if (deciduousMap[toothNumber]) {
      return deciduousMap[toothNumber]
    }

    // 永久歯は末尾の数字のみ表示（例: 18 → 8, 21 → 1）
    return String(toothNumber % 10)
  }

  const getToothLabel = (toothNumber: number): string => {
    const data = toothData[toothNumber]
    if (!data) return ''

    if (data.status === 'healthy') return '/'
    if (data.status === 'none') return '-'
    if (data.status === 'missing') return '×'
    if (data.status === 'extraction_required') return '△'
    if (data.status === 'unerupted') return '▲'
    if (data.status === 'impacted') return '◆'

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

    if (data.status === 'none') return 'bg-gray-200'
    if (data.status === 'missing') return 'bg-white'
    if (data.status === 'extraction_required') return 'bg-yellow-200'
    if (data.status === 'unerupted') return 'bg-gray-100'
    if (data.status === 'impacted') return 'bg-gray-300'

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
    const isDisabled = disabledTeeth.has(toothNumber)
    const bgColor = getCellBackground(toothNumber)
    const label = getToothLabel(toothNumber)

    return (
      <td
        key={toothNumber}
        className={`
          h-7 w-7 min-w-[1.75rem] max-w-[1.75rem] text-center align-middle font-medium text-[9px]
          border border-gray-300
          ${isDisabled
            ? 'bg-gray-300 text-gray-400 cursor-not-allowed opacity-50'
            : `${bgColor} cursor-pointer hover:opacity-80`
          }
          ${isSelected && !isDisabled ? 'ring-2 ring-blue-500 ring-inset' : ''}
          transition-opacity
        `}
        onClick={() => !isDisabled && onToothClick(toothNumber)}
      >
        {label}
      </td>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
      <table className="w-full border-collapse">
        <tbody>
          {/* 上顎 永久歯データ行 */}
          <tr>
            {upperRightPermanent.map(renderToothCell)}
            <td className="border-l border-r border-gray-400 bg-gray-100 w-1" />
            {upperLeftPermanent.map(renderToothCell)}
          </tr>

          {/* 上顎 永久歯番表示行 */}
          <tr>
            {upperRightPermanent.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0.5 text-[8px] text-center text-gray-600">
                {toothNumberToDisplay(toothNumber)}
              </td>
            ))}
            <td className="border-l border-r border-gray-400 bg-gray-100 px-0.5 py-0.5 text-[8px] text-center w-1">
            </td>
            {upperLeftPermanent.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0.5 text-[8px] text-center text-gray-600">
                {toothNumberToDisplay(toothNumber)}
              </td>
            ))}
          </tr>

          {/* 上顎 乳歯番表示行 */}
          {hasDeciduousData && (
            <tr>
              <td colSpan={3} className="bg-white px-0 py-0"></td>
              {upperRightDeciduous.map(toothNumber => (
                <td key={toothNumber} className="border border-gray-300 bg-blue-50 px-0.5 py-0.5 text-[8px] text-center text-blue-600 font-medium">
                  {toothNumberToDisplay(toothNumber)}
                </td>
              ))}
              <td className="border-l border-r border-gray-400 bg-gray-100 px-0.5 py-0.5 text-[8px] text-center w-1">
              </td>
              {upperLeftDeciduous.map(toothNumber => (
                <td key={toothNumber} className="border border-gray-300 bg-blue-50 px-0.5 py-0.5 text-[8px] text-center text-blue-600 font-medium">
                  {toothNumberToDisplay(toothNumber)}
                </td>
              ))}
              <td colSpan={3} className="bg-white px-0 py-0"></td>
            </tr>
          )}

          {/* 上顎 乳歯データ行 */}
          {hasDeciduousData && (
            <tr>
              <td colSpan={3} className="bg-white"></td>
              {upperRightDeciduous.map(renderToothCell)}
              <td className="border-l border-r border-gray-400 bg-gray-100 w-1" />
              {upperLeftDeciduous.map(renderToothCell)}
              <td colSpan={3} className="bg-white"></td>
            </tr>
          )}

          {/* 区切り行 */}
          <tr>
            <td colSpan={17} className="bg-gray-100 h-1"></td>
          </tr>

          {/* 下顎 乳歯データ行 */}
          {hasDeciduousData && (
            <tr>
              <td colSpan={3} className="bg-white"></td>
              {lowerRightDeciduous.map(renderToothCell)}
              <td className="border-l border-r border-gray-400 bg-gray-100 w-1" />
              {lowerLeftDeciduous.map(renderToothCell)}
              <td colSpan={3} className="bg-white"></td>
            </tr>
          )}

          {/* 下顎 乳歯番表示行 */}
          {hasDeciduousData && (
            <tr>
              <td colSpan={3} className="bg-white px-0 py-0"></td>
              {lowerRightDeciduous.map(toothNumber => (
                <td key={toothNumber} className="border border-gray-300 bg-blue-50 px-0.5 py-0.5 text-[8px] text-center text-blue-600 font-medium">
                  {toothNumberToDisplay(toothNumber)}
                </td>
              ))}
              <td className="border-l border-r border-gray-400 bg-gray-100 px-0.5 py-0.5 text-[8px] text-center w-1">
              </td>
              {lowerLeftDeciduous.map(toothNumber => (
                <td key={toothNumber} className="border border-gray-300 bg-blue-50 px-0.5 py-0.5 text-[8px] text-center text-blue-600 font-medium">
                  {toothNumberToDisplay(toothNumber)}
                </td>
              ))}
              <td colSpan={3} className="bg-white px-0 py-0"></td>
            </tr>
          )}

          {/* 下顎 永久歯番表示行 */}
          <tr>
            {lowerRightPermanent.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0.5 text-[8px] text-center text-gray-600">
                {toothNumberToDisplay(toothNumber)}
              </td>
            ))}
            <td className="border-l border-r border-gray-400 bg-gray-100 px-0.5 py-0.5 text-[8px] text-center w-1">
            </td>
            {lowerLeftPermanent.map(toothNumber => (
              <td key={toothNumber} className="border border-gray-300 bg-gray-50 px-0.5 py-0.5 text-[8px] text-center text-gray-600">
                {toothNumberToDisplay(toothNumber)}
              </td>
            ))}
          </tr>

          {/* 下顎 永久歯データ行 */}
          <tr>
            {lowerRightPermanent.map(renderToothCell)}
            <td className="border-l border-r border-gray-400 bg-gray-100 w-1" />
            {lowerLeftPermanent.map(renderToothCell)}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
