// 小臼歯のSVG形状 - 画像に合わせたシンプルな形状
export function PremolarSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 36 55" className="w-full h-full">
      {/* 小臼歯 - 楕円形 */}
      <ellipse
        cx="18"
        cy="28"
        rx="14"
        ry="26"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}

// 下顎小臼歯用 - 根が尖っている
export function LowerPremolarSVG({ fill = '#FFFFFF', stroke = '#333333' }: { fill?: string; stroke?: string }) {
  return (
    <svg viewBox="0 0 36 55" className="w-full h-full">
      {/* 下顎小臼歯 - 楕円から下に伸びて尖る */}
      <path
        d="M 18,2 Q 6,2 6,15 L 6,25 Q 10,40 18,53 Q 26,40 30,25 L 30,15 Q 30,2 18,2 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  )
}
