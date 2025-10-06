# 問診票からの希望連絡方法の取得方法

## 概要
問診票に「ご希望の連絡方法」フィールド（q1-11-1）が追加されました。
患者登録時にこの値をpreferred_contact_methodとして保存する必要があります。

## 実装方法

### 1. 問診票の質問ID
- **質問ID**: `q1-11-1`
- **質問文**: 「ご希望の連絡方法」
- **選択肢**: ['LINE', 'メール', 'SMS(ショートメール)', '特に希望なし']

### 2. 回答から値を取得
```typescript
const response_data = questionnaireResponse.response_data
const contactPreference = response_data['q1-11-1'] // 'LINE', 'メール', 'SMS(ショートメール)', または '特に希望なし'
```

### 3. データベースの値にマッピング
```typescript
function mapContactPreference(preference: string): 'line' | 'email' | 'sms' | null {
  switch (preference) {
    case 'LINE':
      return 'line'
    case 'メール':
      return 'email'
    case 'SMS(ショートメール)':
      return 'sms'
    default:
      return null
  }
}
```

### 4. 患者作成時に含める
```typescript
import { createPatient } from '@/lib/api/patients'

const contactMethod = mapContactPreference(response_data['q1-11-1'])

await createPatient(clinic_id, {
  last_name: response_data['q1-1']?.split(' ')[0],
  first_name: response_data['q1-1']?.split(' ')[1],
  last_name_kana: response_data['q1-2']?.split(' ')[0],
  first_name_kana: response_data['q1-2']?.split(' ')[1],
  gender: response_data['q1-3'] === '男' ? 'male' : 'female',
  birthdate: response_data['q1-4'],
  phone: response_data['q1-10'],
  email: response_data['q1-11'],
  preferred_contact_method: contactMethod, // ここに追加
  address: response_data['q1-9'],
  postal_code: response_data['q1-8'],
  // ... その他のフィールド
})
```

## データベーススキーマ
```sql
ALTER TABLE patients
ADD COLUMN preferred_contact_method VARCHAR(20)
CHECK (preferred_contact_method IN ('line', 'email', 'sms'));
```

このカラムは既に `supabase/migrations/026_create_notification_system.sql` で追加済みです。

## 使用例
通知送信時に患者の希望連絡方法を使用：
```typescript
const patient = await getPatient(patient_id)
const channel = patient.preferred_contact_method || 'line' // デフォルトはLINE

await createNotificationSchedule({
  patient_id,
  send_channel: channel,
  // ... その他の設定
})
```
