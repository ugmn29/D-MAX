/**
 * Supabase CLIを使ってマイグレーションを本番環境に自動プッシュ
 *
 * 使い方:
 *   node push-migrations.mjs
 *
 * 機能:
 *   - Supabaseプロジェクトにリンク
 *   - 未適用のマイグレーションファイルを本番環境にプッシュ
 *   - エラー時は詳細なログを表示
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'

const execAsync = promisify(exec)

// .env.localファイルから環境変数を読み込む
const envContent = fs.readFileSync('.env.local', 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

const PROJECT_REF = 'obdfmwpdkwraqqqyjgwu'

console.log('🚀 Supabaseマイグレーション自動プッシュ')
console.log('')
console.log(`📋 プロジェクト: ${PROJECT_REF}`)
console.log('')
console.log('💡 既にSupabaseプロジェクトにリンク済みである必要があります')
console.log('   初回のみ: supabase link --project-ref obdfmwpdkwraqqqyjgwu')
console.log('')

async function pushMigrations() {
  try {
    // マイグレーションをプッシュ
    console.log('📤 マイグレーションをプッシュ中...')
    console.log('')

    // 自動承認するために echo "Y" を使用
    const pushCmd = 'echo "Y" | supabase db push --linked'
    const { stdout: pushOutput, stderr: pushError } = await execAsync(pushCmd)

    console.log(pushOutput)

    if (pushError && !pushError.includes('Finished supabase db push')) {
      console.error('⚠️  プッシュ中に警告:', pushError)
    }

    if (pushOutput.includes('Finished supabase db push')) {
      console.log('')
      console.log('✅ マイグレーションのプッシュが完了しました！')
      console.log('')
      console.log('🎉 本番環境のデータベースが更新されました')
      return true
    } else if (pushOutput.includes('ERROR')) {
      console.error('')
      console.error('❌ マイグレーションの適用中にエラーが発生しました')
      console.error('')
      console.error('詳細:', pushOutput)
      return false
    } else {
      console.log('')
      console.log('✅ すべてのマイグレーションは既に適用済みです')
      return true
    }

  } catch (error) {
    console.error('')
    console.error('❌ 予期しないエラーが発生しました:', error.message)
    console.error('')

    if (error.stdout) {
      console.error('標準出力:', error.stdout)
    }
    if (error.stderr) {
      console.error('標準エラー:', error.stderr)
    }

    return false
  }
}

const success = await pushMigrations()
process.exit(success ? 0 : 1)
