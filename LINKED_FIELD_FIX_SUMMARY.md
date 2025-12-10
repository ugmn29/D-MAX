# 問診票データ反映の修正完了レポート

## 🎯 問題の根本原因

**問診票を連携しても患者情報が反映されない理由:**

システムテンプレートから問診票を作成する際、**`linked_field`（患者情報との連携設定）がコピーされていませんでした。**

### 具体的な原因箇所

[lib/api/clinic-initialization.ts:69-78](lib/api/clinic-initialization.ts#L69-L78)

```typescript
// ❌ 修正前: linked_fieldがコピーされていない
const newQuestions = (questions || []).map(q => ({
  questionnaire_id: newQuestionnaire.id,
  section_name: q.section_name,
  question_text: q.question_text,
  question_type: q.question_type,
  options: q.options,
  is_required: q.is_required,
  conditional_logic: q.conditional_logic,
  sort_order: q.sort_order
  // ← linked_field が無い！
}))
```

このため、全ての問診票質問で `linked_field` が NULL になり、患者情報への自動反映が動作しませんでした。

---

## ✅ 実施した修正

### 1. テンプレートコピー処理の修正

[lib/api/clinic-initialization.ts:69-79](lib/api/clinic-initialization.ts#L69-L79)

```typescript
// ✅ 修正後: linked_fieldをコピーに追加
const newQuestions = (questions || []).map(q => ({
  questionnaire_id: newQuestionnaire.id,
  section_name: q.section_name,
  question_text: q.question_text,
  question_type: q.question_type,
  options: q.options,
  is_required: q.is_required,
  conditional_logic: q.conditional_logic,
  sort_order: q.sort_order,
  linked_field: q.linked_field  // ← 追加！
}))
```

**影響:** これ以降に作成される問診票は、自動的に `linked_field` が設定されます。

---

### 2. 問診票編集UIの復元

[components/forms/questionnaire-edit-modal.tsx:736-766](components/forms/questionnaire-edit-modal.tsx#L736-L766)

以前はコメントアウトされていた「患者情報フィールドとの連携」設定UIを復元しました。

**利用可能な連携フィールド:**
- 姓 (`last_name`)
- 名 (`first_name`)
- 姓（カナ）(`last_name_kana`)
- 名（カナ）(`first_name_kana`)
- 性別 (`gender`)
- 生年月日 (`birth_date`)
- 郵便番号 (`postal_code`)
- 住所 (`address`)
- 電話番号 (`phone`)
- メールアドレス (`email`)
- 緊急連絡先 (`emergency_contact`)
- 来院のきっかけ (`referral_source`)
- 希望連絡方法 (`preferred_contact_method`)
- アレルギー (`allergies`)
- 既往歴・持病 (`medical_history`)
- 服用中の薬 (`medications`)

**使い方:**
1. 問診票編集画面で質問をクリック
2. 「患者情報フィールドとの連携」ドロップダウンから連携先を選択
3. 保存

---

### 3. 既存問診票の一括修正API

[app/api/questionnaires/fix-linked-fields/route.ts](app/api/questionnaires/fix-linked-fields/route.ts)

既存の問診票（すでに作成済みで `linked_field` が NULL のもの）を一括修正するAPIを追加しました。

**動作:**
1. 全ての問診票を取得
2. 各問診票の `template_id` から元のシステムテンプレートを特定
3. テンプレートの質問と問診票の質問を `question_text` と `section_name` で照合
4. 一致した質問に `linked_field` をコピー

---

## 📋 次のステップ

### ステップ1: Vercelのデプロイ完了を待つ

GitHubにプッシュ済みです。Vercelのダッシュボードで最新のデプロイが「Ready」になるまで待ちます（通常2-5分）。

デプロイ状況確認: https://vercel.com/dashboard

### ステップ2: 既存問診票の修正APIを実行

デプロイ完了後、以下のコマンドを実行して既存の問診票を修正します:

```bash
node test-fix-linked-fields.mjs
```

または、直接curlで実行:

```bash
curl -X POST https://dmax-mu.vercel.app/api/questionnaires/fix-linked-fields
```

**期待される出力:**

```json
{
  "success": true,
  "message": "XX件のlinked_fieldを修正しました",
  "fixed": XX
}
```

### ステップ3: 動作確認

1. 本番環境 `https://dmax-mu.vercel.app` にアクセス
2. ブラウザのコンソールを開く（F12）
3. 問診票連携を実行
4. 以下のログが表示されることを確認:

```
問診票回答データから患者情報を抽出: {...}
linked_field: birth_date = 1990-01-01
linked_field: gender = male
linked_field: phone = 090-1234-5678
...
抽出した患者情報: {
  birth_date: '1990-01-01',
  gender: 'male',
  phone: '090-1234-5678',
  ...
}
```

5. 患者詳細ページで、問診票データが自動入力されていることを確認

---

## 🔍 トラブルシューティング

### Q: APIを実行しても `fixed: 0` と表示される

**考えられる原因:**
1. システムテンプレート自体に `linked_field` が設定されていない
2. 問診票が既に `linked_field` を持っている
3. `question_text` や `section_name` が一致しない

**確認方法:**

```bash
# 本番環境の問診票とlinked_fieldを確認
node check-questions-linked-field.mjs
```

### Q: 修正後も患者情報が反映されない

**確認ポイント:**
1. デプロイが完了しているか
2. APIが正常に実行されたか（`fixed > 0`）
3. ブラウザコンソールに `linked_field: xxx = yyy` のログが出ているか
4. 問診票の回答データのキー形式が正しいか

**デバッグ方法:**

ブラウザのコンソールで以下を実行:

```javascript
// 問診票回答データを確認
fetch('/api/questionnaires/debug?clinic_id=11111111-1111-1111-1111-111111111111')
  .then(r => r.json())
  .then(d => {
    console.log('Questions with linked_field:', d.questions.filter(q => q.linked_field))
    console.log('Response data keys:', Object.keys(d.responses[0]?.response_data || {}))
  })
```

### Q: 手動で `linked_field` を設定したい

**手順:**
1. 本番環境の問診票設定ページにアクセス
2. 問診票を選択して「編集」
3. 質問をクリックして編集
4. 「患者情報フィールドとの連携」ドロップダウンから選択
5. 保存

---

## 📊 修正の影響範囲

### 新規作成される問診票
✅ 自動的に `linked_field` が設定される
✅ 問診票連携時に患者情報が自動入力される

### 既存の問診票
⚠️ APIを実行するまで `linked_field` は NULL のまま
✅ API実行後は患者情報が自動入力される

### ユーザー操作
✅ 問診票編集画面で `linked_field` を手動設定可能
✅ システムテンプレートから作成時は自動設定

---

## 📝 技術的な補足

### linked_field のマッピングロジック

[lib/api/questionnaires.ts:650-683](lib/api/questionnaires.ts#L650-L683)

```typescript
questions.forEach((question: any) => {
  const { linked_field } = question
  const answer = answers[questionId] // 複数キー形式対応済み

  if (linked_field && answer) {
    switch (linked_field) {
      case 'birth_date':
        patientUpdates.birth_date = answer
        break
      case 'gender':
        patientUpdates.gender = answer
        break
      case 'phone':
        patientUpdates.phone = answer
        break
      // ... 他のフィールド
    }
  }
})
```

### システムテンプレートでの設定

システムテンプレート（`system_questionnaire_template_questions` テーブル）には、以下のマイグレーションで `linked_field` が設定されています:

- [20251023000009_add_linked_field_to_questionnaire_questions.sql](supabase/migrations/20251023000009_add_linked_field_to_questionnaire_questions.sql)
- [20251023000011_add_linked_field_and_preferred_contact_question.sql](supabase/migrations/20251023000011_add_linked_field_and_preferred_contact_question.sql)
- [20251024000001_update_questionnaire_linked_fields.sql](supabase/migrations/20251024000001_update_questionnaire_linked_fields.sql)

---

## ✨ 結論

**修正完了:** 問診票連携時に患者情報が自動的に反映されるようになりました。

**次のアクション:**
1. ✅ デプロイ完了を待つ
2. ⏳ `node test-fix-linked-fields.mjs` を実行
3. ⏳ 本番環境で動作確認

何か問題があれば、上記のトラブルシューティングセクションを参照してください。
