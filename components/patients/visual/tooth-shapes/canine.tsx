// 犬歯のSVG形状 - 画像に合わせたシンプルな形状
export function CanineSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 32 55" className="w-full h-full">
      {/* 上顎犬歯 - 先端が少し尖った台形 */}
      <path
        d="M 16,2 L 10,8 L 8,12 L 8,53 L 24,53 L 24,12 L 22,8 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}

// 下顎犬歯用 - 根が尖っている
export function LowerCanineSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 32 55" className="w-full h-full">
      {/* 下顎犬歯 - 根が尖った形 */}
      <path
        d="M 8,2 L 24,2 L 24,15 L 22,30 L 16,53 L 10,30 L 8,15 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}
