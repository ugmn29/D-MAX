import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMenus() {
  const clinicId = '11111111-1111-1111-1111-111111111111'

  console.log('診療メニューを確認中...')

  const { data: menus, error } = await supabase
    .from('treatment_menus')
    .select('id, name, sort_order, is_active, clinic_id')
    .eq('clinic_id', clinicId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('エラー:', error)
    return
  }

  console.log(`\n登録されている診療メニュー数: ${menus?.length || 0}`)

  if (menus && menus.length > 0) {
    console.log('\n診療メニュー一覧:')
    menus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.name}`)
      console.log(`   ID: ${menu.id}`)
      console.log(`   sort_order: ${menu.sort_order}`)
      console.log(`   is_active: ${menu.is_active}`)
      console.log('')
    })
  } else {
    console.log('\n診療メニューが登録されていません')
  }

  // 予約データも確認
  const { data: appointments, error: aptError } = await supabase
    .from('appointments')
    .select('id, menu1_id, menu2_id, menu3_id, status, appointment_date')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', '2025-11-01')
    .limit(10)

  if (aptError) {
    console.error('予約データエラー:', aptError)
    return
  }

  console.log(`\n予約データ数: ${appointments?.length || 0}`)
  if (appointments && appointments.length > 0) {
    console.log('\n最近の予約:')
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. 予約日: ${apt.appointment_date}`)
      console.log(`   menu1_id: ${apt.menu1_id || 'なし'}`)
      console.log(`   menu2_id: ${apt.menu2_id || 'なし'}`)
      console.log(`   menu3_id: ${apt.menu3_id || 'なし'}`)
      console.log(`   status: ${apt.status}`)
      console.log('')
    })
  }
}

checkMenus()
