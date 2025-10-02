// ブラウザのコンソールで実行するスクリプト
// 予約操作ログを確認

const logs = JSON.parse(localStorage.getItem('appointment_logs') || '[]')
console.log('予約操作ログの件数:', logs.length)
console.table(logs)

// 予約データも確認
const appointments = JSON.parse(localStorage.getItem('mock_appointments') || '[]')
console.log('\n予約の件数:', appointments.length)
console.log('予約データ:', appointments.map(a => ({
  id: a.id,
  patient_id: a.patient_id,
  date: a.appointment_date,
  time: `${a.start_time}-${a.end_time}`,
  status: a.status
})))
