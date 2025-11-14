import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('診療行為コードの実際のデータを確認\n')

  const { data, error } = await supabase
    .from('treatment_codes')
    .select('*')
    .limit(5)

  if (error) {
    console.error('エラー:', error)
    return
  }

  console.log('取得したデータ:')
  console.log(JSON.stringify(data, null, 2))
}

main()
