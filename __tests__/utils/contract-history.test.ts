import { describe, it, expect } from 'vitest'
import { generateContractMonthList } from '@/lib/utils/contract-history'

describe('generateContractMonthList', () => {
  it('contract_start が空文字の場合は空配列を返す', () => {
    const result = generateContractMonthList('', new Date('2026-03-01'))
    expect(result).toEqual([])
  })

  it('契約開始月と現在月が同じ場合は1件だけ返す', () => {
    const result = generateContractMonthList('2026-03-01', new Date('2026-03-15'))
    expect(result).toEqual([{ year: 2026, month: 3 }])
  })

  it('3ヶ月分を降順で返す', () => {
    const result = generateContractMonthList('2026-01-01', new Date('2026-03-15'))
    expect(result).toEqual([
      { year: 2026, month: 3 },
      { year: 2026, month: 2 },
      { year: 2026, month: 1 },
    ])
  })

  it('年をまたぐ範囲を正しく生成する', () => {
    const result = generateContractMonthList('2025-11-01', new Date('2026-02-15'))
    expect(result).toEqual([
      { year: 2026, month: 2 },
      { year: 2026, month: 1 },
      { year: 2025, month: 12 },
      { year: 2025, month: 11 },
    ])
  })

  it('契約開始月が現在月より未来の場合は空配列を返す', () => {
    const result = generateContractMonthList('2026-04-01', new Date('2026-03-15'))
    expect(result).toEqual([])
  })

  it('日付部分は無視してあくまで月単位で計算する（開始日が15日でも1日扱い）', () => {
    const result = generateContractMonthList('2026-02-15', new Date('2026-03-01'))
    expect(result).toEqual([
      { year: 2026, month: 3 },
      { year: 2026, month: 2 },
    ])
  })

  it('1年以上の長期契約を正しく生成する', () => {
    const result = generateContractMonthList('2025-01-01', new Date('2026-03-15'))
    expect(result).toHaveLength(15) // 2025年1月〜2026年3月 = 15ヶ月
    expect(result[0]).toEqual({ year: 2026, month: 3 })  // 先頭は最新月
    expect(result[14]).toEqual({ year: 2025, month: 1 }) // 末尾は契約開始月
  })
})
