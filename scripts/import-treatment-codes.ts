/**
 * 診療行為マスター取込スクリプト
 * Treatment Codes Import Script
 *
 * 使い方:
 * npx tsx scripts/import-treatment-codes.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readAndParseCSV, parseDateYYYYMMDD, formatDateForPostgres, parseNumber, chunk, logProgress } from '../lib/utils/csv-import'
import path from 'path'

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 診療行為マスターのCSVフィールド定義
 * 01補助マスターテーブル（歯科）.csv
 */
interface TreatmentCodeCSVRow {
  code: string // 診療行為コード (9桁) + 加算コード (5桁)
  name: string // 診療行為名称
  points: number // 基本点数
  category: string // カテゴリ
  effectiveFrom: Date | null // 適用開始日
  effectiveTo: Date | null // 適用終了日
}

/**
 * CSVレコードをパース
 */
function parseTreatmentCodeRow(fields: string[]): TreatmentCodeCSVRow | null {
  if (fields.length < 10) {
    return null
  }

  // フィールドインデックス（PDFの仕様書を参照）
  // [0]=レコード識別, [1]=変更区分, [2]=診療行為コード, [3]=加算コード, [4]=省略名称, [5]=正式名称, ...

  const code = fields[2] + fields[3] // 診療行為コード + 加算コード
  const name = fields[5] || fields[4] || '' // 正式名称優先、なければ省略名称
  const points = parseNumber(fields.length > 11 ? fields[11] : '0') // 点数
  const category = fields[1] || '' // 変更区分をカテゴリとして一時的に使用

  // 適用日
  const effectiveFromStr = fields.length > 45 ? fields[45] : ''
  const effectiveToStr = fields.length > 46 ? fields[46] : ''

  const effectiveFrom = parseDateYYYYMMDD(effectiveFromStr)
  const effectiveTo = parseDateYYYYMMDD(effectiveToStr)

  return {
    code,
    name,
    points,
    category,
    effectiveFrom,
    effectiveTo,
  }
}

/**
 * 包括テーブルを読み込んでマッピング作成
 */
async function loadInclusionRules(csvPath: string): Promise<Map<string, string[]>> {
  console.log('包括テーブルを読み込み中...')

  const records = readAndParseCSV(csvPath)
  const inclusionMap = new Map<string, string[]>()

  for (const fields of records) {
    if (fields.length < 3) continue

    const targetCode = fields[1] // 包括される側のコード
    const includesCode = fields[2] // 包括する側のコード

    if (!inclusionMap.has(includesCode)) {
      inclusionMap.set(includesCode, [])
    }
    inclusionMap.get(includesCode)!.push(targetCode)
  }

  console.log(`包括ルール ${inclusionMap.size} 件を読み込みました`)
  return inclusionMap
}

/**
 * 背反テーブルを読み込んでマッピング作成
 */
async function loadExclusionRules(csvPaths: string[]): Promise<Map<string, any>> {
  console.log('背反テーブルを読み込み中...')

  const exclusionMap = new Map<string, any>()

  const exclusionTypes = ['same_day', 'same_month', 'simultaneous', 'same_site', 'same_week']

  for (let i = 0; i < csvPaths.length; i++) {
    const records = readAndParseCSV(csvPaths[i])
    const type = exclusionTypes[i]

    for (const fields of records) {
      if (fields.length < 3) continue

      const code1 = fields[1]
      const code2 = fields[2]

      // code1のルールを追加
      if (!exclusionMap.has(code1)) {
        exclusionMap.set(code1, {
          same_day: [],
          same_month: [],
          simultaneous: [],
          same_site: [],
          same_week: [],
        })
      }
      exclusionMap.get(code1)![type].push(code2)

      // code2のルールを追加（双方向）
      if (!exclusionMap.has(code2)) {
        exclusionMap.set(code2, {
          same_day: [],
          same_month: [],
          simultaneous: [],
          same_site: [],
          same_week: [],
        })
      }
      exclusionMap.get(code2)![type].push(code1)
    }
  }

  console.log(`背反ルール ${exclusionMap.size} 件を読み込みました`)
  return exclusionMap
}

/**
 * 算定回数テーブルを読み込んでマッピング作成
 */
async function loadFrequencyLimits(csvPath: string): Promise<Map<string, any[]>> {
  console.log('算定回数テーブルを読み込み中...')

  const records = readAndParseCSV(csvPath)
  const frequencyMap = new Map<string, any[]>()

  for (const fields of records) {
    if (fields.length < 5) continue

    const code = fields[1]
    const period = fields[2] // 期間コード
    const maxCount = parseNumber(fields[3]) // 回数

    // 期間コードを period に変換
    let periodType: 'day' | 'week' | 'month' | 'year' = 'month'
    if (period === '1') periodType = 'day'
    else if (period === '2') periodType = 'week'
    else if (period === '3') periodType = 'month'
    else if (period === '4') periodType = 'year'

    if (!frequencyMap.has(code)) {
      frequencyMap.set(code, [])
    }

    frequencyMap.get(code)!.push({
      period: periodType,
      max_count: maxCount,
    })
  }

  console.log(`算定回数ルール ${frequencyMap.size} 件を読み込みました`)
  return frequencyMap
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== 診療行為マスター取込開始 ===\n')

  const baseDir = path.join(process.cwd(), 'tensuhyo_04 2')

  // ファイルパス
  const treatmentMasterPath = path.join(baseDir, '01補助マスターテーブル（歯科）.csv')
  const inclusionPath = path.join(baseDir, '02包括テーブル（歯科）.csv')
  const exclusionPaths = [
    path.join(baseDir, '03-1背反テーブル1（歯科）.csv'),
    path.join(baseDir, '03-2背反テーブル2（歯科）.csv'),
    path.join(baseDir, '03-3背反テーブル3（歯科）.csv'),
    path.join(baseDir, '03-4背反テーブル4（歯科）.csv'),
    path.join(baseDir, '03-5背反テーブル5（歯科）.csv'),
  ]
  const frequencyPath = path.join(baseDir, '04算定回数テーブル（歯科）.csv')

  try {
    // 関連テーブルを読み込み
    const inclusionMap = await loadInclusionRules(inclusionPath)
    const exclusionMap = await loadExclusionRules(exclusionPaths)
    const frequencyMap = await loadFrequencyLimits(frequencyPath)

    // 診療行為マスターを読み込み
    console.log('\n診療行為マスターを読み込み中...')
    const records = readAndParseCSV(treatmentMasterPath)
    console.log(`${records.length} レコードを読み込みました\n`)

    // パースとバリデーション
    const parsedRecords: any[] = []
    let skipped = 0

    for (const fields of records) {
      const parsed = parseTreatmentCodeRow(fields)
      if (!parsed || !parsed.code || !parsed.name) {
        skipped++
        continue
      }

      // 関連ルールを統合
      const dbRecord = {
        code: parsed.code,
        name: parsed.name,
        category: parsed.category,
        points: parsed.points,
        inclusion_rules: inclusionMap.get(parsed.code) || [],
        exclusion_rules: exclusionMap.get(parsed.code) || {
          same_day: [],
          same_month: [],
          simultaneous: [],
          same_site: [],
          same_week: [],
        },
        frequency_limits: frequencyMap.get(parsed.code) || [],
        effective_from: formatDateForPostgres(parsed.effectiveFrom) || '2024-06-01',
        effective_to: formatDateForPostgres(parsed.effectiveTo),
        requires_documents: [],
        metadata: {},
      }

      parsedRecords.push(dbRecord)
    }

    console.log(`有効なレコード: ${parsedRecords.length}`)
    console.log(`スキップ: ${skipped}\n`)

    // 重複を除去（最新のレコードを保持）
    const uniqueRecords = new Map<string, any>()
    for (const record of parsedRecords) {
      uniqueRecords.set(record.code, record)
    }
    const finalRecords = Array.from(uniqueRecords.values())

    console.log(`重複除去後: ${finalRecords.length} レコード\n`)

    // データベースに挿入（バッチ処理）
    console.log('データベースに挿入中...')
    const batches = chunk(finalRecords, 500) // 500件ずつ

    let insertedCount = 0
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      const { error } = await supabase.from('treatment_codes').insert(batch)

      if (error) {
        console.error(`バッチ ${i + 1} 挿入エラー:`, error.message)
        // 重複エラーの場合は警告して続行
        if (error.code === '23505') {
          console.warn('重複レコードをスキップして続行します')
        } else {
          throw error
        }
      } else {
        insertedCount += batch.length
      }

      logProgress(insertedCount, finalRecords.length, '挿入進捗')
    }

    console.log('\n✅ 診療行為マスター取込完了！')
    console.log(`総レコード数: ${parsedRecords.length}`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// 実行
main()
