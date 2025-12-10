# 問診票データ反映の修正状況

## 現在の状況

### ✅ 完了した作業

1. **外部キー制約の追加** (Commit: `cfac218`)
   - `questionnaire_responses.patient_id` と `patients.id` の間に外部キー制約を追加
   - マイグレーション `20251210000002_fix_patient_id_type_and_add_fk.sql` を適用
   - 400エラー「Could not find a relationship」を解決

2. **複数キー形式対応** (Commit: `3670770`) ⭐ **最新**
   - `linkQuestionnaireResponseToPatient()` 関数を修正
   - 以下の3つのキー形式をサポート:
     1. UUID形式 (新形式): `123e4567-e89b-12d3-a456-426614174000`
     2. レガシー形式: `q1-1`, `q1-2`, `q2-1`, etc.
     3. セクション形式 (フォールバック): `section1_q1`, `section2_q3`, etc.
   - `sort_order` からレガシーキーを自動計算

3. **デバッグツールの作成**
   - `/api/questionnaires/debug` - 問診票回答の一覧取得
   - `/api/debug/questionnaire-data` - 詳細なデータ構造確認 (未デプロイ)
   - ローカルスクリプト: `check-response-data-keys.mjs`, `get-response-data-structure.mjs`

### 📊 本番環境の状態

- **問診票回答数**: 1件
- **Response ID**: `623ab580-0afd-42cf-8a4e-feaf4c680174`
- **Patient ID**: `fde9e1b5-0c79-47b4-8dc3-9e45443e8dd0` (連携済み)
- **response_dataのキー数**: 56キー
- **患者の登録状態**: `is_registered: true`

### ⚠️ 現在の問題

**問診票連携後も患者情報が反映されない**

ユーザーから報告されたログ:
```
問診票連携完了: 患者情報を更新しました
{
  id: 'fde9e1b5-0c79-47b4-8dc3-9e45443e8dd0',
  is_registered: true,
  patient_number: 2,
  birth_date: null,    ← 反映されていない
  gender: 'other',      ← 反映されていない (本来は 'male' や 'female' のはず)
}
```

**期待される動作**:
- `birth_date`: 問診票から生年月日が自動入力される
- `gender`: 問診票から性別が正しく反映される
- `phone`, `email`, `allergies`, `medications` なども自動入力される

### 🔍 原因分析

最新の修正 (Commit `3670770`) には以下のデバッグログが含まれています:

```typescript
console.log(`問診票回答データから患者情報を抽出:`, answers)
console.log(`レガシーキー ${legacyKey} で回答を取得: ${answer}`)
console.log(`linked_field: ${linked_field} = ${answer}`)
```

**しかし、ユーザーのコンソールにこれらのログが出ていない**

これは以下のいずれかを意味します:

1. ✅ **Vercelのデプロイがまだ完了していない** (最も可能性が高い)
   - GitHubにプッシュ済みだが、Vercelのビルド・デプロイ中
   - 通常2-5分かかる

2. コンソールログが本番環境で出力されない設定になっている

3. 別の問題で `linkQuestionnaireResponseToPatient()` 関数が実行されていない

### 🎯 次のステップ

#### 1. Vercelデプロイの完了を待つ (推奨)

Vercelのダッシュボードで最新のデプロイ状況を確認:
- https://vercel.com/dashboard
- プロジェクト `dmax` を選択
- 最新のデプロイが「Ready」になるまで待つ (通常2-5分)

#### 2. デプロイ完了後、再度問診票連携をテスト

1. ブラウザのコンソールを開く (F12)
2. 本番環境 `https://dmax-mu.vercel.app` にアクセス
3. 問診票連携を実行
4. 以下のログが出ることを確認:
   ```
   問診票回答データから患者情報を抽出: {q1-1: "...", q1-2: "...", ...}
   レガシーキー q1-5 で回答を取得: 1990-01-01
   linked_field: birth_date = 1990-01-01
   linked_field: gender = male
   ```
5. 患者情報が正しく反映されることを確認:
   ```
   {
     id: '...',
     birth_date: '1990-01-01',  ← 反映される
     gender: 'male',             ← 反映される
     phone: '090-1234-5678',     ← 反映される
     ...
   }
   ```

#### 3. デプロイされたか確認する方法

以下のコマンドでVercelの最新デプロイのGitコミットを確認:

```bash
curl -s https://dmax-mu.vercel.app/_vercel/commit.txt
```

これが `3670770` またはそれ以降であれば、修正がデプロイされています。

#### 4. もしデプロイ済みでも問題が続く場合

問診票の実際のキー形式を調べる必要があります:

1. ブラウザのコンソールで以下を実行:
   ```javascript
   // 問診票回答のresponse_dataを直接確認
   fetch('/api/questionnaires/debug?response_id=623ab580-0afd-42cf-8a4e-feaf4c680174')
     .then(r => r.json())
     .then(d => {
       console.log('Response Data:', d.response?.response_data)
       console.log('Keys:', Object.keys(d.response?.response_data || {}))
     })
   ```

2. キー形式を確認して、修正が正しくマッチしているか検証

### 📝 修正内容の詳細

**ファイル**: `/lib/api/questionnaires.ts` (Lines 650-683)

修正された `linkQuestionnaireResponseToPatient()` 関数:

```typescript
questions.forEach((question: any) => {
  const { id: questionId, linked_field, question_text, sort_order } = question

  // 回答を取得：複数の形式に対応
  // 1. UUID形式のID (新形式)
  // 2. q{section}-{number} 形式 (レガシー形式、例: q1-1, q1-2)
  // 3. sort_orderベース (フォールバック)
  let answer = answers[questionId]  // UUID形式を試す

  if (answer === undefined || answer === null || answer === '') {
    // レガシー形式を試す（例: q1-1, q3-5）
    // sort_orderから推測: 0-9 -> q1-1～q1-10, 10-19 -> q2-1～q2-10, etc.
    const section = Math.floor(sort_order / 10) + 1
    const number = sort_order % 10 || 10
    const legacyKey = `q${section}-${number}`
    answer = answers[legacyKey]

    if (answer !== undefined) {
      console.log(`レガシーキー ${legacyKey} で回答を取得: ${answer}`)
    }
  }

  // セクション名ベースも試す（例: section1_q1, section2_q3）
  if (answer === undefined || answer === null || answer === '') {
    const sectionKey = `section${Math.floor(sort_order / 10) + 1}_q${sort_order % 10 || 10}`
    answer = answers[sectionKey]

    if (answer !== undefined) {
      console.log(`セクションキー ${sectionKey} で回答を取得: ${answer}`)
    }
  }

  if (linked_field && answer !== undefined && answer !== null && answer !== '') {
    console.log(`linked_field: ${linked_field} = ${answer}`)
    // ... 患者フィールドへのマッピング処理
  }
})
```

### 🔧 トラブルシューティング

#### Q: ログが出ないのはなぜ?

A: 本番環境ではコンソールログが抑制されている可能性があります。以下を確認:

1. ブラウザのコンソールレベルが「Verbose」または「All」になっているか
2. Next.jsの本番ビルドで`console.log`が削除されていないか
3. Vercelの環境変数で`NODE_ENV=production`の場合の挙動

#### Q: 406エラーは何?

A: 以下のテーブルが存在しないか、RLSでブロックされています (別途対応が必要):

- `patient_icons`
- `patient_notification_preferences`
- `patient_web_booking_settings`

これらは問診票データ反映とは無関係なので、後で対応可能です。

#### Q: 開発環境では動作している?

A: ローカル環境 (`.env.local` が `127.0.0.1:54321` を指している) はローカルSupabaseを使用しています。
本番環境とは別のデータベースです。

本番環境の動作を確認するには:
- `https://dmax-mu.vercel.app` で直接テスト
- または `.env.local` を本番のSupabase URLに変更してローカルテスト

### 📅 作業ログ

- **2025-12-10 06:00**: 外部キー制約追加のマイグレーション適用
- **2025-12-10 06:15**: 複数キー形式対応の修正をコミット (Commit: `3670770`)
- **2025-12-10 06:20**: Vercelデプロイ待ち中

### 結論

**現在の状況**: 修正は完了し、GitHubにプッシュ済みです。Vercelのデプロイが完了すれば、問診票データが正しく患者情報に反映されるはずです。

**次のアクション**:
1. Vercelのデプロイ完了を待つ (2-5分)
2. 再度問診票連携をテストする
3. コンソールログで修正が適用されていることを確認する
4. 患者情報が正しく反映されることを確認する

もしデプロイ完了後も問題が続く場合は、問診票の実際のキー形式を調査して、さらなる修正が必要かどうかを判断します。
