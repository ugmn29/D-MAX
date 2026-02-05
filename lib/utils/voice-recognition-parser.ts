/**
 * P検査音声認識パーサー
 * 音声認識結果を解析してPPD、BOP、動揺度データに変換
 */

export type InputMode = 'ppd' | 'bop' | 'mobility'

export interface ParsedVoiceData {
  mode: InputMode
  values: ParsedValue[]
  rawText: string
  detectedMode?: InputMode // モード切り替えが検出された場合
}

export interface ParsedValue {
  toothNumber?: number
  position?: string // 'mb', 'b', 'db', 'ml', 'l', 'dl'
  value: number | boolean
  confidence: number
  rawToken: string
}

// モード切り替えトリガーワード
const MODE_TRIGGERS = {
  ppd: ['ポケット', 'PPD', 'ピーピーディー', '深さ', 'ふかさ'],
  bop: ['BOP', 'ビーオーピー', 'ビーオーピー', '出血', 'しゅっけつ', '出血あり'],
  mobility: ['動揺度', 'どうようど', 'モビリティ', 'どうよう'],
}

// 数値の読み方バリエーション（1-15mm）
const NUMBER_PATTERNS: Record<number, RegExp> = {
  0: /^(ぜろ|ゼロ|零|0|zero)$/i,
  1: /^(いち|イチ|一|1|one|ワン)$/i,
  2: /^(に|ニ|二|2|two|ツー)$/i,
  3: /^(さん|サン|三|3|three|スリー)$/i,
  4: /^(よん|ヨン|し|シ|四|4|four|フォー)$/i,
  5: /^(ご|ゴ|五|5|five|ファイブ)$/i,
  6: /^(ろく|ロク|六|6|six|シックス)$/i,
  7: /^(なな|ナナ|しち|シチ|七|7|seven|セブン)$/i,
  8: /^(はち|ハチ|八|8|eight|エイト)$/i,
  9: /^(きゅう|キュウ|く|ク|九|9|nine|ナイン)$/i,
  10: /^(じゅう|ジュウ|十|10|ten|テン)$/i,
  11: /^(じゅういち|ジュウイチ|十一|11|eleven|イレブン)$/i,
  12: /^(じゅうに|ジュウニ|十二|12|twelve|トゥエルブ)$/i,
  13: /^(じゅうさん|ジュウサン|十三|13|thirteen|サーティーン)$/i,
  14: /^(じゅうよん|ジュウヨン|十四|14|fourteen|フォーティーン)$/i,
  15: /^(じゅうご|ジュウゴ|十五|15|fifteen|フィフティーン)$/i,
}

// 歯番号パターン（FDI表記）
const TOOTH_NUMBER_PATTERN = /^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/

/**
 * 数値を正規化（文字列 → 数値）
 */
export function normalizeNumber(text: string): number | null {
  const trimmed = text.trim()
  console.log(`  🔍 normalizeNumber入力: "${trimmed}"`)

  // 数字の場合はそのまま変換（範囲チェックなし - 呼び出し側で処理）
  const num = parseInt(trimmed, 10)
  if (!isNaN(num) && num >= 0) {
    console.log(`  ✓ 数字として認識: ${num}`)
    return num
  }

  // パターンマッチング
  for (const [value, pattern] of Object.entries(NUMBER_PATTERNS)) {
    if (pattern.test(trimmed)) {
      console.log(`  ✓ パターンマッチ成功: "${trimmed}" → ${value} (パターン: ${pattern})`)
      return parseInt(value, 10)
    }
  }

  console.log(`  ✗ マッチ失敗: "${trimmed}"`)
  return null
}

/**
 * 歯番号を正規化
 */
export function normalizeToothNumber(text: string): number | null {
  const trimmed = text.trim()

  // 数字のみの場合
  if (TOOTH_NUMBER_PATTERN.test(trimmed)) {
    return parseInt(trimmed, 10)
  }

  // 「31番」「31ばん」などのパターン
  const match = trimmed.match(/^(\d{2})(?:番|ばん)?$/i)
  if (match && TOOTH_NUMBER_PATTERN.test(match[1])) {
    return parseInt(match[1], 10)
  }

  return null
}

/**
 * モード切り替えを検出
 */
export function detectModeChange(text: string): InputMode | null {
  const lower = text.toLowerCase().trim()

  for (const [mode, triggers] of Object.entries(MODE_TRIGGERS)) {
    for (const trigger of triggers) {
      if (lower.includes(trigger.toLowerCase())) {
        return mode as InputMode
      }
    }
  }

  return null
}

/**
 * PPDモード: 連続する数値を解析
 * 例: "3, 4, 3, 3, 2, 2" → [3, 4, 3, 3, 2, 2]
 * 例: "さんさんさん" → [3, 3, 3]
 */
export function parsePPDValues(text: string, confidence: number): ParsedValue[] {
  const values: ParsedValue[] = []
  console.log('🔢 PPDパース開始:', text)
  console.log('🔢 文字コード:', Array.from(text).map(c => `${c}(${c.charCodeAt(0)})`).join(' '))

  // 連続した日本語数字を分割するパターン
  // じゅう(いち|に|さん...)の複合語をマッチ
  const complexPattern = /(じゅう(?:いち|に|さん|よん|し|ご|ろく|なな|しち|はち|きゅう|く)?)/gi
  // 単一の数字パターン
  const singlePattern = /(いち|に|さん|よん|し|ご|ろく|なな|しち|はち|きゅう|く|じゅう|ゼロ|ぜろ|[0-9]+)/gi

  // まず複合語（じゅういち等）を抽出
  let tokens: string[] = []
  const complexMatches = text.match(complexPattern)
  console.log('🔍 複合語マッチ:', complexMatches)

  if (complexMatches && complexMatches.length > 0) {
    // 複合語が見つかった場合、それらを使用
    tokens = complexMatches
  } else {
    // 単一の数字を抽出
    const singleMatches = text.match(singlePattern)
    console.log('🔍 単一数字マッチ:', singleMatches)
    if (singleMatches) {
      tokens = singleMatches
    }
  }

  // 区切り文字がある場合は通常通り分割も試みる
  const spaceSeparated = text.split(/[,、\s]+/).filter(t => t.trim().length > 0)
  console.log('🔍 スペース区切り:', spaceSeparated)
  if (spaceSeparated.length > tokens.length) {
    tokens = spaceSeparated
  }

  console.log('📝 最終トークン:', tokens)

  // 各トークンを数値に変換
  for (const token of tokens) {
    const num = normalizeNumber(token)
    console.log(`🔄 トークン "${token}" → 数値: ${num}`)

    if (num !== null) {
      // 0-15の範囲内ならそのまま追加
      if (num >= 0 && num <= 15) {
        values.push({
          value: num,
          confidence,
          rawToken: token,
        })
      }
      // 16以上の数字の場合
      else if (num >= 16) {
        const numStr = String(num)

        // 同じ数字の繰り返しパターンをチェック（例: 333, 6666, 11111）
        const isRepeatingDigit = /^(\d)\1+$/.test(numStr)

        if (isRepeatingDigit) {
          // 繰り返しパターンの場合、Web Speech APIが連続発音を誤認識した可能性が高い
          const digit = parseInt(numStr[0], 10)
          const repeatCount = numStr.length

          console.log(`  ⚠️ 繰り返し数字検出: ${num} (数字:${digit}, 回数:${repeatCount})`)
          console.log(`  → Web Speech APIの誤認識の可能性あり`)

          // より厳格な判定ロジック:
          // - 繰り返し2回 (例: 11, 22, 33):
          //   - 11-15の範囲: 「じゅういち」などの可能性が高いのでスキップ
          //   - それ以外: 信頼度85%以上で許可
          // - 繰り返し3回: 信頼度85%以上で許可
          // - 繰り返し4回以上: 信頼度92%以上で許可、それ以外はスキップ
          let shouldProcess = false
          let reason = ''

          if (repeatCount === 2) {
            // 11, 22, 33等の2桁繰り返し
            // 「じゅういち」(11)と言った場合は信頼度が高く(85%以上)、「いち、いち」と言った場合は低め
            // 閾値を70%に設定することで、明確に「じゅういち」と言った場合のみスキップ
            if (num === 11 && confidence >= 0.85) {
              // 信頼度が非常に高い場合は「じゅういち」の可能性
              shouldProcess = false
              reason = `11 + 高信頼度${(confidence*100).toFixed(1)}%≥85% → 「じゅういち」と判定してスキップ`
            } else {
              // それ以外は2回言った可能性が高いので許可
              shouldProcess = confidence >= 0.60
              reason = shouldProcess
                ? `2回の繰り返し + 信頼度${(confidence*100).toFixed(1)}%≥60% → 許可`
                : `2回の繰り返し + 信頼度${(confidence*100).toFixed(1)}%<60% → スキップ`
            }
          } else if (repeatCount === 3) {
            // 3回の繰り返しはP検査で頻出パターン（例: 3mm, 3mm, 3mm）
            // 非常に低い閾値で積極的に許可（Web Speech APIが3回認識することは稀なので信頼）
            shouldProcess = confidence >= 0.40
            reason = shouldProcess
              ? `3回の繰り返し + 信頼度${(confidence*100).toFixed(1)}%≥40% → 許可（頻出パターン）`
              : `3回の繰り返し + 信頼度${(confidence*100).toFixed(1)}%<40% → スキップ`
          } else {
            // 4回以上の繰り返しはP検査では非常に稀 → 誤認識として完全スキップ
            shouldProcess = false
            reason = `${repeatCount}回の繰り返し → 誤認識として完全スキップ（P検査では3回連続が最大）`
          }

          console.log(`  → ${reason}`)

          if (shouldProcess) {
            const digits = numStr.split('').map(d => parseInt(d, 10))
            for (const d of digits) {
              if (d >= 0 && d <= 15) {
                values.push({
                  value: d,
                  confidence,
                  rawToken: `${d}(from ${token})`,
                })
                console.log(`    ✓ 桁を追加: ${d}`)
              }
            }
          }
        } else {
          // 異なる数字の組み合わせ（例: 234, 567）は通常通り分割
          console.log(`  📊 大きな数字を検出: ${num} → 各桁に分割`)
          const digits = String(num).split('').map(d => parseInt(d, 10))
          for (const digit of digits) {
            if (digit >= 0 && digit <= 15) {
              values.push({
                value: digit,
                confidence,
                rawToken: `${digit}(from ${token})`,
              })
              console.log(`    ✓ 桁を追加: ${digit}`)
            }
          }
        }
      }
    }
  }

  console.log('✅ パース結果:', values)
  return values
}

/**
 * BOPモード: 歯番号と位置のリストを解析
 * 1点法: "31, 34, 45" → [31, 34, 45] (位置なし)
 * 4点法/6点法: "37近心頬側, 41遠心舌側" → [{tooth: 37, pos: 'mb'}, {tooth: 41, pos: 'dl'}]
 */
export function parseBOPValues(text: string, confidence: number): ParsedValue[] {
  // モードトリガーを除去
  let cleaned = text
  for (const trigger of MODE_TRIGGERS.bop) {
    cleaned = cleaned.replace(new RegExp(trigger, 'gi'), '')
  }

  const tokens = cleaned
    .split(/[,、]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)

  const values: ParsedValue[] = []

  // 位置パターン
  const positionPatterns: Record<string, RegExp> = {
    mb: /(近心|きんしん).*(頬側|きょうそく|ほおがわ)/i,
    b: /(中央|ちゅうおう).*(頬側|きょうそく|ほおがわ)/i,
    db: /(遠心|えんしん).*(頬側|きょうそく|ほおがわ)/i,
    ml: /(近心|きんしん).*(舌側|ぜっそく|したがわ|口蓋側|こうがいそく)/i,
    l: /(中央|ちゅうおう).*(舌側|ぜっそく|したがわ|口蓋側|こうがいそく)/i,
    dl: /(遠心|えんしん).*(舌側|ぜっそく|したがわ|口蓋側|こうがいそく)/i,
  }

  for (const token of tokens) {
    // 歯番号を抽出
    const toothNum = normalizeToothNumber(token)

    if (toothNum !== null) {
      // 位置を検出
      let detectedPosition: string | undefined = undefined
      for (const [pos, pattern] of Object.entries(positionPatterns)) {
        if (pattern.test(token)) {
          detectedPosition = pos
          break
        }
      }

      values.push({
        toothNumber: toothNum,
        position: detectedPosition, // 位置が指定されていない場合はundefined
        value: true, // BOP陽性
        confidence,
        rawToken: token,
      })
    }
  }

  return values
}

/**
 * 動揺度モード: 歯番号と度数のペアを解析
 * 例: "16番2度, 36番1度" → [{tooth: 16, value: 2}, {tooth: 36, value: 1}]
 * 例: "動揺度 16 2 36 1" → [{tooth: 16, value: 2}, {tooth: 36, value: 1}]
 */
export function parseMobilityValues(text: string, confidence: number): ParsedValue[] {
  // モードトリガーを除去
  let cleaned = text
  for (const trigger of MODE_TRIGGERS.mobility) {
    cleaned = cleaned.replace(new RegExp(trigger, 'gi'), '')
  }

  const tokens = cleaned
    .split(/[,、\s]+/)
    .map(t => t.trim())
    .filter(t => t.length > 0)

  const values: ParsedValue[] = []

  // ペアで処理（歯番号 + 度数）
  for (let i = 0; i < tokens.length - 1; i += 2) {
    const toothNum = normalizeToothNumber(tokens[i])
    const degreeStr = tokens[i + 1].replace(/[度°]/g, '')
    const degree = normalizeNumber(degreeStr)

    if (toothNum !== null && degree !== null && degree >= 0 && degree <= 3) {
      values.push({
        toothNumber: toothNum,
        value: degree,
        confidence,
        rawToken: `${tokens[i]} ${tokens[i + 1]}`,
      })
    }
  }

  return values
}

/**
 * メイン解析関数
 */
export function parseVoiceRecognition(
  text: string,
  currentMode: InputMode,
  confidence: number = 0.85
): ParsedVoiceData {
  // モード切り替えを検出
  const detectedMode = detectModeChange(text)

  // モードが切り替わった場合は新しいモードで解析
  const mode = detectedMode || currentMode

  let values: ParsedValue[] = []

  switch (mode) {
    case 'ppd':
      values = parsePPDValues(text, confidence)
      break
    case 'bop':
      values = parseBOPValues(text, confidence)
      break
    case 'mobility':
      values = parseMobilityValues(text, confidence)
      break
  }

  return {
    mode,
    values,
    rawText: text,
    detectedMode,
  }
}

/**
 * 信頼度が低い値をフィルタリング
 */
export function filterLowConfidence(
  values: ParsedValue[],
  threshold: number = 0.7
): ParsedValue[] {
  return values.filter(v => v.confidence >= threshold)
}
