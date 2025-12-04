import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

// LocalStorageのモックデータを読み取る（ブラウザで実行するためのコード例）
// このスクリプトはブラウザのコンソールで実行するか、
// または既存のlocalStorageデータをここにコピペする必要があります

async function syncMenusToDb() {
  console.log('診療メニューをデータベースに同期します...')

  // ここに既存のlocalStorageのデータを貼り付けてください
  // ブラウザのコンソールで localStorage.getItem('mock_treatment_menus') を実行して取得
  const mockMenusJson = process.argv[2]

  if (!mockMenusJson) {
    console.log('\n使い方:')
    console.log('1. ブラウザで http://localhost:3000/settings/treatment を開く')
    console.log('2. ブラウザのコンソール（F12キー）を開く')
    console.log('3. 以下のコマンドを実行: localStorage.getItem("mock_treatment_menus")')
    console.log('4. 出力された内容をコピーして、以下のように実行:')
    console.log('   npx tsx scripts/sync-menus-to-db.ts \'[コピーした内容]\'')
    console.log('\nまたは、既存のメニューを削除して、設定画面で再度追加することもできます。')
    return
  }

  try {
    const menus = JSON.parse(mockMenusJson)
    console.log(`\n${menus.length}個のメニューが見つかりました`)

    for (const menu of menus) {
      console.log(`\n処理中: ${menu.name}`)

      // 既に存在するかチェック
      const { data: existing } = await supabase
        .from('treatment_menus')
        .select('id')
        .eq('id', menu.id)
        .single()

      if (existing) {
        console.log('  → 既にデータベースに存在します。スキップ')
        continue
      }

      // データベースに挿入
      const { error } = await supabase
        .from('treatment_menus')
        .insert({
          id: menu.id,
          clinic_id: menu.clinic_id,
          name: menu.name,
          level: menu.level,
          parent_id: menu.parent_id || null,
          standard_duration: menu.standard_duration || menu.duration_minutes || 30,
          color: menu.color || '#3B82F6',
          sort_order: menu.sort_order || 0,
          is_active: menu.is_active ?? true,
          created_at: menu.created_at || new Date().toISOString()
        })

      if (error) {
        console.error('  → エラー:', error.message)
      } else {
        console.log('  ✓ データベースに保存しました')
      }
    }

    console.log('\n同期完了！')
    console.log('分析ページをリロードして確認してください。')

  } catch (error) {
    console.error('エラー:', error)
  }
}

syncMenusToDb()
