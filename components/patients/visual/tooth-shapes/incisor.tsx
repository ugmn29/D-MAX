// 切歯（前歯）のSVG形状 - 画像に合わせたシンプルな形状
export function IncisorSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 30 55" className="w-full h-full">
      {/* 上顎切歯 - 細長い台形 */}
      <path
        d="M 8,2 L 22,2 L 24,10 L 24,53 L 6,53 L 6,10 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}

// 下顎切歯用（根が見える形状 - 下に行くほど細くなる）
export function LowerIncisorSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 30 55" className="w-full h-full">
      {/* 下顎切歯 - 逆台形（根が尖っている） */}
      <path
        d="M 6,2 L 24,2 L 24,15 L 20,35 L 15,53 L 10,35 L 6,15 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}
