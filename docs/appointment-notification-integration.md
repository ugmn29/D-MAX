# 予約時の自動通知スケジュール登録

## 概要
予約の作成・更新・キャンセル時に自動的に通知スケジュールを登録・更新・削除する機能です。

## 実装済みの関数

### 1. 予約リマインド通知の作成
```typescript
import { createAppointmentReminderNotification } from '@/lib/api/appointment-notifications'

// 予約作成後に呼び出す
await createAppointmentReminderNotification(
  appointmentId,
  patientId,
  clinicId,
  appointmentDatetime
)
```

**動作:**
- 予約の3日前、18時に送信される通知を作成
- 患者の希望連絡方法（LINE/メール/SMS）を自動選択
- 予約リマインドテンプレートを使用してメッセージ生成

### 2. 予約変更通知の作成
```typescript
import { createAppointmentChangeNotification } from '@/lib/api/appointment-notifications'

// 予約日時変更時に呼び出す
await createAppointmentChangeNotification(
  appointmentId,
  patientId,
  clinicId,
  oldDatetime,
  newDatetime
)
```

**動作:**
- 即座に送信される変更通知を作成
- 変更前と変更後の日時を含むメッセージを生成

### 3. 予約キャンセル時の通知削除
```typescript
import { cancelAppointmentNotifications } from '@/lib/api/appointment-notifications'

// 予約キャンセル時に呼び出す
await cancelAppointmentNotifications(appointmentId)
```

**動作:**
- その予約に紐づくすべてのスケジュール済み通知をキャンセル

### 4. 自動リマインドのキャンセル
```typescript
import { handleAppointmentConfirmed } from '@/lib/api/appointment-notifications'

// 予約確定時に呼び出す
await handleAppointmentConfirmed(patientId, clinicId)
```

**動作:**
- 患者の自動リマインド通知をすべてキャンセル
- 予約が入ったら定期検診のリマインドは不要なため

## 統合方法

### appointments APIへの統合

`lib/api/appointments.ts` を以下のように更新：

```typescript
import {
  createAppointmentReminderNotification,
  createAppointmentChangeNotification,
  cancelAppointmentNotifications,
  handleAppointmentConfirmed
} from './appointment-notifications'

// 予約作成時
export async function createAppointment(data: AppointmentInsert): Promise<Appointment> {
  const client = getSupabaseClient()

  // 予約を作成
  const { data: appointment, error } = await client
    .from('appointments')
    .insert(data)
    .select()
    .single()

  if (error) throw error

  // 通知スケジュールを作成
  try {
    await createAppointmentReminderNotification(
      appointment.id,
      appointment.patient_id,
      appointment.clinic_id,
      appointment.start_time
    )

    // 自動リマインドをキャンセル
    await handleAppointmentConfirmed(
      appointment.patient_id,
      appointment.clinic_id
    )
  } catch (notifError) {
    console.error('通知作成エラー:', notifError)
    // 通知エラーでも予約は作成済みなので続行
  }

  return appointment
}

// 予約更新時
export async function updateAppointment(
  id: string,
  updates: AppointmentUpdate
): Promise<Appointment> {
  const client = getSupabaseClient()

  // 既存予約を取得
  const { data: oldAppointment } = await client
    .from('appointments')
    .select('*')
    .eq('id', id)
    .single()

  // 予約を更新
  const { data: appointment, error } = await client
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // 日時が変更された場合
  if (updates.start_time && oldAppointment && updates.start_time !== oldAppointment.start_time) {
    try {
      // 古い通知をキャンセル
      await cancelAppointmentNotifications(id)

      // 新しい通知を作成
      await createAppointmentReminderNotification(
        appointment.id,
        appointment.patient_id,
        appointment.clinic_id,
        appointment.start_time
      )

      // 変更通知を送信
      await createAppointmentChangeNotification(
        appointment.id,
        appointment.patient_id,
        appointment.clinic_id,
        oldAppointment.start_time,
        appointment.start_time
      )
    } catch (notifError) {
      console.error('通知更新エラー:', notifError)
    }
  }

  return appointment
}

// 予約削除・キャンセル時
export async function deleteAppointment(id: string): Promise<void> {
  const client = getSupabaseClient()

  // 通知をキャンセル
  try {
    await cancelAppointmentNotifications(id)
  } catch (notifError) {
    console.error('通知キャンセルエラー:', notifError)
  }

  // 予約を削除
  const { error } = await client
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

## Web予約からの統合

Web予約システム（`/web-booking`）からの予約作成時も同様に統合してください。

## 注意事項

1. **エラーハンドリング**: 通知作成に失敗しても予約操作自体は成功させる
2. **非同期処理**: 通知作成は予約操作と並行して実行可能
3. **テンプレート**: 事前に予約リマインド・変更通知のテンプレートを作成しておく
4. **送信時刻**: デフォルトは18時だが、設定で変更可能にすることを推奨

## テスト方法

1. 予約を作成し、`patient_notification_schedules`テーブルにレコードが作成されることを確認
2. 予約日時を変更し、古い通知がキャンセルされ新しい通知が作成されることを確認
3. 予約をキャンセルし、通知もキャンセルされることを確認
4. Cronジョブが実行され、送信時刻になった通知が実際に送信されることを確認
