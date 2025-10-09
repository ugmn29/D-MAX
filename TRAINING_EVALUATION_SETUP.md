# トレーニング評価・課題管理システム セットアップガイド

## 概要

来院時にトレーニングの実施状況を3段階評価し、患者の課題を特定して適切なトレーニングを推奨する機能を実装しました。

## 実装された機能

### 1. データベース構造
- **training_evaluations**: 来院時評価の記録
- **patient_issues**: 課題マスタ（6種類の課題）
- **issue_training_mappings**: 課題→トレーニング紐付け
- **patient_issue_records**: 患者の課題記録
- **evaluation_issue_rules**: 評価→課題判定ルール
- **clinic_training_customizations**: 医院ごとの評価基準カスタマイズ

### 2. 追加された課題マスタ（6種類）
1. **tongue_protrusion_difficulty** - 舌を前に出すことができない
2. **tongue_position_difficulty** - スポットの位置に置くことができない
3. **tongue_suction_difficulty** - 吸い上げができない
4. **lip_tension_high** - 口唇の緊張が強い
5. **lip_closure_weak** - 口唇閉鎖力が弱い
6. **bite_force_weak** - 咬合力が弱い

### 3. 新規トレーニング（2種類追加）
- **舌小帯伸ばし** - 舌の柔軟性向上
- **チューブ吸い** - 舌の吸引動作訓練

### 4. API エンドポイント
- `POST /api/training/evaluations` - 評価保存 & 課題自動判定
- `GET /api/training/evaluations` - 評価履歴取得
- `GET /api/training/evaluations/history` - タイムライン形式の評価履歴
- `GET /api/training/evaluations/progress` - 進捗サマリー
- `GET /api/training/issues` - 患者の課題一覧
- `POST /api/training/issues` - 課題記録
- `PUT /api/training/issues/[id]` - 課題更新・解決
- `DELETE /api/training/issues/[id]` - 課題削除

### 5. UI画面
- **来院時評価画面** (`/training/clinic/evaluate/[patientId]`)
  - 各トレーニングの3段階評価
  - 評価基準の表示
  - コメント記入

- **課題分析モーダル**
  - 特定された課題の表示
  - 重症度設定（軽度/中度/重度）
  - 推奨トレーニングの選択
  - 処方画面への遷移

- **処方画面の拡張**
  - 推奨トレーニングの自動選択
  - 推奨トレーニング通知表示

- **患者詳細画面の拡張**
  - 「来院時評価を記録」ボタン追加

## マイグレーション実行手順

### 1. マイグレーションファイルの確認
以下のマイグレーションファイルが作成されています：
- `supabase/migrations/026_add_evaluation_and_issue_system.sql`
- `supabase/migrations/027_insert_issue_and_evaluation_data.sql`

### 2. マイグレーション実行

#### オプション A: Supabase CLI使用（推奨）
```bash
# ローカル環境の場合
npx supabase db reset

# リモート環境の場合
npx supabase db push
```

#### オプション B: Supabase Dashboard使用
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクトを選択
3. SQL Editor を開く
4. `026_add_evaluation_and_issue_system.sql` の内容をコピー&ペーストして実行
5. `027_insert_issue_and_evaluation_data.sql` の内容をコピー&ペーストして実行

## 使用方法

### 1. 来院時評価の記録
1. 患者詳細画面で「来院時評価を記録」ボタンをクリック
2. 各トレーニングを3段階で評価
   - ❌ レベル1: できなかった
   - ⚠️ レベル2: まあまあできた
   - ✅ レベル3: できた
3. 必要に応じてコメントを記入
4. 「評価を保存して課題を分析」ボタンをクリック

### 2. 課題の確認と推奨トレーニングの処方
1. 課題分析モーダルが表示される
2. 特定された課題を確認
3. 各課題の重症度を設定（軽度/中度/重度）
4. 推奨トレーニングを選択
5. 「課題を記録して推奨トレーニングを処方」ボタンをクリック
6. 処方画面に遷移し、推奨トレーニングが事前選択されている

### 3. 課題と推奨トレーニングの関係

#### 課題1: 舌を前に出すことができない
- → 舌を左右に振る（優先度1）
- → 口唇をなぞる（優先度2）
- → 舌小帯伸ばし（優先度3）

#### 課題2: スポットの位置に置くことができない
- → スポットの位置確認（優先度1）

#### 課題3: 吸い上げができない
- → 吸い上げ（優先度1）
- → 舌筋の訓練（優先度2）
- → チューブ吸い（優先度3）

#### 課題4: 口唇の緊張が強い
- → 上唇小帯と下唇小帯を伸ばす（優先度1）
- → 口唇の緊張除去（優先度2）

#### 課題5: 口唇閉鎖力が弱い
- → 口輪筋訓練（優先度1）
- → 息吹きかけ（優先度2）

#### 課題6: 咬合力が弱い
- → ガムトレーニング（優先度1）

## 評価基準のカスタマイズ（将来実装予定）

医院ごとに評価基準をカスタマイズすることができます（現在は全医院共通のデフォルト基準を使用）。

カスタマイズ用のテーブル `clinic_training_customizations` が準備されています。

## トラブルシューティング

### マイグレーション実行エラー
- Supabase のデータベースパスワードを確認してください
- `.env.local` に正しい接続情報が設定されているか確認してください

### 評価が保存できない
- 患者にアクティブなトレーニングメニューが処方されているか確認してください
- 少なくとも1つのトレーニングを評価してください

### 課題が自動判定されない
- `evaluation_issue_rules` テーブルにルールが正しく設定されているか確認してください
- 評価レベル1または2のトレーニングがある場合のみ課題が判定されます

## 今後の拡張予定

### 1. 計測データ連携（将来実装）
- 舌の位置計測
- 口唇閉鎖力計測
- 咬合力計測
- 計測値に基づく自動課題判定

### 2. 患者詳細画面の拡張
- 来院時評価タブ（タイムライン、グラフ、カレンダー）
- 課題タブ（現在/解決済み課題の管理）

### 3. 評価基準カスタマイズ画面
- 医院ごとの評価基準編集UI
- デフォルト基準へのリセット機能

## 関連ファイル

### マイグレーション
- `supabase/migrations/026_add_evaluation_and_issue_system.sql`
- `supabase/migrations/027_insert_issue_and_evaluation_data.sql`

### 型定義
- `types/evaluation.ts`
- `types/training.ts`（拡張）

### API
- `app/api/training/evaluations/route.ts`
- `app/api/training/evaluations/history/route.ts`
- `app/api/training/evaluations/progress/route.ts`
- `app/api/training/issues/route.ts`
- `app/api/training/issues/[id]/route.ts`

### UI
- `app/training/clinic/evaluate/[patientId]/page.tsx`
- `components/training/IssueAnalysisModal.tsx`
- `app/training/clinic/patient/[patientId]/page.tsx`（拡張）
- `app/training/clinic/prescribe/[patientId]/page.tsx`（拡張）
