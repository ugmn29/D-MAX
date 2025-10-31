/**
 * 予約の自動ステータス更新ユーティリティ
 *
 * 予約時刻を過ぎた「未来院」の予約を自動的に「遅刻」に変更する
 */

import { updateAppointmentStatus } from '@/lib/api/appointments'

/**
 * 現在時刻と予約時刻を比較して、遅刻かどうか判定
 * @param appointmentDate 予約日 (YYYY-MM-DD)
 * @param startTime 予約開始時刻 (HH:MM)
 * @returns 遅刻している場合はtrue
 */
export function isLate(appointmentDate: string, startTime: string): boolean {
  const now = new Date()

  // 予約日時を作成
  const [year, month, day] = appointmentDate.split('-').map(Number)
  const [hours, minutes] = startTime.split(':').map(Number)
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0)

  // 現在時刻が予約時刻を過ぎているかチェック
  return now > appointmentDateTime
}

/**
 * 予約のステータスを自動更新
 * @param appointments 予約リスト
 * @param clinicId クリニックID
 * @returns 更新された予約のIDリスト
 */
export async function autoUpdateLateStatus(
  appointments: any[],
  clinicId: string
): Promise<string[]> {
  const updatedIds: string[] = []

  for (const appointment of appointments) {
    // 「未来院」ステータスのみ対象
    if (appointment.status !== '未来院') {
      continue
    }

    // キャンセルされた予約は除外
    if (appointment.status === 'キャンセル') {
      continue
    }

    // 予約時刻を過ぎているかチェック
    if (isLate(appointment.appointment_date, appointment.start_time)) {
      try {
        // ステータスを「遅刻」に更新
        await updateAppointmentStatus(clinicId, appointment.id, '遅刻')
        updatedIds.push(appointment.id)
        console.log(`予約を自動的に遅刻に変更: ${appointment.id}`, {
          patient: appointment.patient?.last_name,
          date: appointment.appointment_date,
          time: appointment.start_time
        })
      } catch (error) {
        console.error(`予約ステータス自動更新エラー (${appointment.id}):`, error)
      }
    }
  }

  return updatedIds
}

/**
 * 定期的にステータスをチェックして自動更新するためのタイマーを開始
 * @param checkInterval チェック間隔（ミリ秒）デフォルト: 30000 (30秒)
 * @param onUpdate 更新時のコールバック
 * @returns タイマーをクリアするための関数
 */
export function startAutoStatusUpdateTimer(
  getAppointments: () => any[],
  clinicId: string,
  onUpdate: () => void,
  checkInterval: number = 30000 // 30秒
): () => void {
  console.log('自動ステータス更新タイマー開始: ', checkInterval / 1000, '秒ごと')

  const timerId = setInterval(async () => {
    const appointments = getAppointments()

    if (appointments.length === 0) {
      return
    }

    const updatedIds = await autoUpdateLateStatus(appointments, clinicId)

    if (updatedIds.length > 0) {
      console.log(`${updatedIds.length}件の予約を自動的に「遅刻」に更新しました`)
      onUpdate() // 予約リストを再読み込み
    }
  }, checkInterval)

  // クリーンアップ関数を返す
  return () => {
    console.log('自動ステータス更新タイマー停止')
    clearInterval(timerId)
  }
}
