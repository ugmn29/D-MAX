/**
 * 病名マスター取込スクリプト
 * Disease Codes Import Script
 *
 * 使い方:
 * npx tsx scripts/import-disease-codes.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readAndParseCSV, parseDateYYYYMMDD, formatDateForPostgres, chunk, logProgress } from '../lib/utils/csv-import'
import path from 'path'

// Supabaseクライアント初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * 病名マスターのフィールド定義
 * b_20250601.txt (傷病名マスター)
 */
interface DiseaseCodeCSVRow {
  code: string // 病名コード
  name: string // 病名
  kana: string // カナ読み
  icd10Code: string // ICD10コード
  category: string // カテゴリ
  isDental: boolean // 歯科関連フラグ
  effectiveFrom: Date | null // 適用開始日
  effectiveTo: Date | null // 適用終了日
}

/**
 * CSVレコードをパース
 * フィールド構成（b_20250601.txt）:
 * [0]=変更区分, [1]=マスタ種別, [2]=傷病名コード, [3]=傷病名基本コード,
 * [4]=傷病名交換用コード桁数, [5]=傷病名, [6]=傷病名省略名称桁数, [7]=傷病名省略名称,
 * [8]=傷病名カナ名称桁数, [9]=傷病名カナ名称, [10]=傷病名漢字名称変更年月日,
 * [11]=傷病名カナ名称変更年月日, [12]=ICD10コード, ...
 */
function parseDiseaseCodeRow(fields: string[]): DiseaseCodeCSVRow | null {
  if (fields.length < 25) {
    return null
  }

  const code = fields[2] || '' // 傷病名コード
  const name = fields[5] || '' // 傷病名
  const kana = fields[9] || '' // 傷病名カナ名称
  const icd10Code = fields[12] || '' // ICD10コード

  if (!code || !name) {
    return null
  }

  // カテゴリはICD10の先頭文字から判定
  const category = icd10Code ? icd10Code.substring(0, 1) : 'その他'

  // 歯科関連フラグ（ICD10がK00-K14の範囲）
  const isDental = icd10Code.startsWith('K0') || icd10Code.startsWith('K1')

  // 適用日
  const effectiveFromStr = fields.length > 21 ? fields[21] : ''
  const effectiveToStr = fields.length > 22 ? fields[22] : ''

  const effectiveFrom = parseDateYYYYMMDD(effectiveFromStr)
  const effectiveTo = parseDateYYYYMMDD(effectiveToStr)

  return {
    code,
    name,
    kana,
    icd10Code,
    category,
    isDental,
    effectiveFrom,
    effectiveTo,
  }
}

/**
 * 修飾語マスターを読み込む（オプション）
 */
async function loadModifiers(csvPath: string): Promise<Map<string, string[]>> {
  console.log('修飾語マスターを読み込み中...')

  try {
    const records = readAndParseCSV(csvPath)
    const modifierMap = new Map<string, string[]>()

    for (const fields of records) {
      if (fields.length < 3) continue

      const diseaseCode = fields[1]
      const modifier = fields[2]

      if (!modifierMap.has(diseaseCode)) {
        modifierMap.set(diseaseCode, [])
      }
      modifierMap.get(diseaseCode)!.push(modifier)
    }

    console.log(`修飾語 ${modifierMap.size} 件を読み込みました`)
    return modifierMap
  } catch (error) {
    console.warn('修飾語マスターの読み込みに失敗しました（スキップします）')
    return new Map()
  }
}

/**
 * メイン処理
 */
async function main() {
  console.log('=== 病名マスター取込開始 ===\n')

  const baseDir = path.join(process.cwd(), 'tensuhyo_04 2')

  // ファイルパス
  const diseaseMasterPath = path.join(baseDir, 'b_20250601.txt')
  const modifierPath = path.join(baseDir, 'hb_20250601.txt')

  try {
    // 修飾語マスターを読み込み（オプション）
    const modifierMap = await loadModifiers(modifierPath)

    // 病名マスターを読み込み
    console.log('\n病名マスターを読み込み中...')
    const records = readAndParseCSV(diseaseMasterPath)
    console.log(`${records.length} レコードを読み込みました\n`)

    // パースとバリデーション
    const parsedRecords: any[] = []
    let skipped = 0
    let dentalCount = 0

    for (const fields of records) {
      const parsed = parseDiseaseCodeRow(fields)
      if (!parsed || !parsed.code || !parsed.name) {
        skipped++
        continue
      }

      if (parsed.isDental) {
        dentalCount++
      }

      // 同義語として修飾語を追加
      const synonyms = modifierMap.get(parsed.code) || []

      const dbRecord = {
        code: parsed.code,
        name: parsed.name,
        kana: parsed.kana,
        icd10_code: parsed.icd10Code,
        category: parsed.category,
        is_dental: parsed.isDental,
        synonyms: synonyms,
        effective_from: formatDateForPostgres(parsed.effectiveFrom) || '2025-06-01',
        effective_to: formatDateForPostgres(parsed.effectiveTo),
        metadata: {},
      }

      parsedRecords.push(dbRecord)
    }

    console.log(`有効なレコード: ${parsedRecords.length}`)
    console.log(`歯科関連病名: ${dentalCount}`)
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
    const batches = chunk(finalRecords, 1000) // 1000件ずつ

    let insertedCount = 0
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      const { error } = await supabase.from('disease_codes').insert(batch)

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

    console.log('\n✅ 病名マスター取込完了！')
    console.log(`総レコード数: ${finalRecords.length}`)
    console.log(`歯科関連病名: ${dentalCount}`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// 実行
main()
