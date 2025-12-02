// デバッグモードの制御
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'

export const debug = {
  log: (...args: any[]) => {
    if (DEBUG_MODE) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    // エラーは常に出力
    console.error(...args)
  },
  warn: (...args: any[]) => {
    // 警告は常に出力
    console.warn(...args)
  }
}
