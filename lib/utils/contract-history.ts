/**
 * 契約開始月から指定月（デフォルト: 現在）までの全月リストを降順で生成する
 */
export function generateContractMonthList(
  contractStart: string,
  now: Date = new Date()
): { year: number; month: number }[] {
  if (!contractStart) return []
  const start = new Date(contractStart)
  const months: { year: number; month: number }[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const current = new Date(now.getFullYear(), now.getMonth(), 1)
  while (cursor <= current) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return months.reverse()
}
