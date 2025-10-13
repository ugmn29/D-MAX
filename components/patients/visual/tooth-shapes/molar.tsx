// 大臼歯のSVG形状 - 画像に合わせたシンプルな形状
export function MolarSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 42 55" className="w-full h-full">
      {/* 大臼歯 - 大きめの楕円 */}
      <ellipse
        cx="21"
        cy="28"
        rx="18"
        ry="26"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}

// 下顎大臼歯用 - 根が2つに分かれている
export function LowerMolarSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 42 55" className="w-full h-full">
      {/* 下顎大臼歯 - 楕円から2本の根が伸びる */}
      <path
        d="M 21,2 Q 6,2 6,15 L 6,22 L 8,30 L 12,45 L 14,53 L 18,53 L 18,45 Q 18,38 21,32 Q 24,38 24,45 L 24,53 L 28,53 L 30,45 L 34,30 L 36,22 L 36,15 Q 36,2 21,2 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}
