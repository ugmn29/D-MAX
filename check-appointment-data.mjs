/**
 * 予約データの患者情報を確認
 */

const patientId = '4cc15d6a-32e3-45be-a434-292b0a17316e'
const url = `https://shikabot-mu.vercel.app/api/appointments?clinicId=11111111-1111-1111-1111-111111111111&date=2025-12-11`

console.log('🔍 予約データを確認中...')
console.log('')

try {
  const response = await fetch(url)
  const appointments = await response.json()

  console.log(`✅ 予約データ取得成功: ${appointments.length}件`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━')

  // 該当患者の予約を探す
  const patientAppointments = appointments.filter(apt => apt.patient?.id === patientId)

  console.log(`該当患者の予約: ${patientAppointments.length}件`)
  console.log('')

  patientAppointments.forEach((apt, index) => {
    console.log(`予約${index + 1}:`)
    console.log(`  予約ID: ${apt.id}`)
    console.log(`  開始時刻: ${apt.start_time}`)
    console.log(`  患者ID: ${apt.patient?.id}`)
    console.log(`  患者名: ${apt.patient?.last_name} ${apt.patient?.first_name}`)
    console.log(`  患者カナ: ${apt.patient?.last_name_kana} ${apt.patient?.first_name_kana}`)
    console.log(`  is_registered: ${apt.patient?.is_registered}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━')
  })

} catch (error) {
  console.error('❌ エラー:', error.message)
}
