/**
 * 患者データが復元されているか確認
 */

// 最後に連携解除した患者ID
const patientId = '2ac6f89b-2035-42ad-9ac1-e1784f7de4ed'

const url = `https://shikabot-mu.vercel.app/api/patients/${patientId}`

console.log('🔍 患者データを確認中...')
console.log('')

try {
  const response = await fetch(url)
  const data = await response.json()

  if (data) {
    console.log('✅ 患者データ取得成功')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID: ${data.id}`)
    console.log(`姓: ${data.last_name || '(空)'}`)
    console.log(`名: ${data.first_name || '(空)'}`)
    console.log(`姓カナ: ${data.last_name_kana || '(空)'}`)
    console.log(`名カナ: ${data.first_name_kana || '(空)'}`)
    console.log(`生年月日: ${data.birth_date || '(空)'}`)
    console.log(`性別: ${data.gender || '(空)'}`)
    console.log(`電話: ${data.phone || '(空)'}`)
    console.log(`is_registered: ${data.is_registered}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')

    if (data.is_registered) {
      console.log('⚠️  is_registeredがtrueのままです（本登録状態）')
    } else {
      console.log('✅ is_registeredがfalseです（仮登録状態）')
    }

    if (!data.last_name && !data.first_name) {
      console.log('⚠️  名前が空です')
    } else {
      console.log(`✅ 名前: ${data.last_name} ${data.first_name}`)
    }
  } else {
    console.error('❌ 患者が見つかりませんでした')
  }
} catch (error) {
  console.error('❌ エラー:', error.message)
}
