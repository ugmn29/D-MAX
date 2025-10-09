// 予約ステータスを更新するスクリプト
const { updateMockAppointment } = require('./lib/utils/mock-mode.ts');

// 特定の予約IDのステータスを「未来院」に更新
const appointmentId = 'mock-appointment-1759806789660';
const updates = { status: '未来院' };

console.log(`予約ID ${appointmentId} のステータスを「未来院」に更新します...`);

try {
  const result = updateMockAppointment(appointmentId, updates);
  if (result) {
    console.log('更新成功:', result);
  } else {
    console.log('予約が見つかりませんでした');
  }
} catch (error) {
  console.error('更新エラー:', error);
}
