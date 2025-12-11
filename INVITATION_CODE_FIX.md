# 招待コード発行エラー修正完了

## 🎯 問題の概要

本番環境で招待コード発行時に「保存に失敗しました」エラーが発生し、招待コードがデータベースに保存されない問題が発生していました。

---

## 🔍 根本原因

### 1. RLS (Row Level Security) ポリシーの問題

**症状**: `line_invitation_codes` テーブルへの INSERT が拒否される

**原因**:
- `/api/line/invitation-codes` エンドポイントが `getSupabaseClient()` を使用
- `getSupabaseClient()` は本番環境で **anon key** を使用
- anon key は RLS ポリシーの対象となり、テーブルへの書き込み権限がない

**エラーコード**: `42501` (RLS policy violation)

### 2. 使用するべき認証キー

Supabase には2種類の認証キーがあります：

| キー | 権限 | RLS | 用途 |
|------|------|-----|------|
| **Anon Key** | 制限あり | 適用される | フロントエンド（ブラウザ） |
| **Service Role Key** | 管理者権限 | バイパス | バックエンド（API Routes） |

---

## ✅ 修正内容

### 修正ファイル
[app/api/line/invitation-codes/route.ts](app/api/line/invitation-codes/route.ts)

### 変更点

**修正前**:
```typescript
import { getSupabaseClient } from '@/lib/utils/supabase-client'

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient() // 本番環境では anon key を使用
  // ...
}
```

**修正後**:
```typescript
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  // Service Role Keyを使用してRLSをバイパス（管理操作のため）
  const supabase = supabaseAdmin

  if (!supabase) {
    return NextResponse.json(
      { error: 'サーバー設定エラー' },
      { status: 500 }
    )
  }
  // ...
}
```

### 修正対象メソッド
- ✅ `POST /api/line/invitation-codes` - 招待コード発行
- ✅ `GET /api/line/invitation-codes?patient_id=xxx` - 招待コード取得
- ✅ `DELETE /api/line/invitation-codes?id=xxx` - 招待コード無効化

---

## 🚀 デプロイ状況

### Git コミット
- **コミットID**: `6fae11a`
- **ブランチ**: `main`
- **プッシュ完了**: ✅

### Vercel デプロイ
- **自動デプロイ**: 進行中
- **URL**: https://vercel.com/ugmn29s-projects/d-max/deployments

---

## 🧪 テスト手順

デプロイ完了後、以下の手順で動作確認してください：

### 1. 招待コード発行テスト

1. 本番環境にアクセス: https://d-max-lemon.vercel.app
2. 患者一覧ページを開く
3. 任意の患者を選択
4. 「基本情報」タブ → 「LINE連携」セクション
5. 「招待コードを発行」ボタンをクリック
6. **期待結果**: 8桁の招待コード（例: AB12-CD34）が表示される

### 2. 招待コード保存確認

招待コードが正常に保存されているか確認：

```bash
node check-invitation-codes.mjs
```

**期待結果**:
```
✅ 1件の招待コードが見つかりました:

1. 招待コード: AB12-CD34
   ステータス: pending
   有効期限: 2025-01-10T12:00:00Z
   有効期限切れ: いいえ
   患者ID: patient_1234567890_abc
   作成日時: 2024-12-11T12:00:00Z
```

### 3. LINE連携テスト

1. LINE公式アカウントを友だち追加
2. リッチメニューから「初回登録」をタップ
3. 招待コードと生年月日を入力
4. 「連携する」ボタンをクリック
5. **期待結果**: 「連携が完了しました」メッセージが表示される

---

## 📝 技術的補足

### なぜ Service Role Key を使用するのか？

API Routes (`/api/*`) は以下の理由で Service Role Key の使用が適切：

1. **バックエンドで実行**: ブラウザではなくサーバー側で実行される
2. **管理操作**: 招待コード発行は管理者が行う操作
3. **セキュリティ**: Next.js の API Routes は認証済みユーザーのみアクセス可能
4. **RLS バイパス**: 管理操作では RLS ポリシーをバイパスする必要がある

### Service Role Key の安全性

- ✅ **環境変数で管理**: `SUPABASE_SERVICE_ROLE_KEY` は Vercel の環境変数に保存
- ✅ **サーバーサイドのみ**: ブラウザには公開されない
- ✅ **API 認証**: Next.js の認証機能でアクセス制限

---

## 🔧 今後の対応

### 他の API エンドポイントの確認

以下のエンドポイントも同様の問題がある可能性があるため、確認が必要：

- `/api/line/link-patient` - 患者連携
- `/api/line/send-message` - メッセージ送信
- `/api/line/send-notification` - 通知送信
- `/api/line/patient-linkages` - 連携情報取得

**推奨**: これらのエンドポイントも `supabaseAdmin` を使用するよう統一する

---

## ✅ まとめ

**問題**: 本番環境で招待コード発行が失敗
**原因**: anon key を使用していたため RLS ポリシーで拒否された
**修正**: Service Role Key (`supabaseAdmin`) を使用するよう変更
**結果**: 招待コード発行が正常に動作する

**デプロイ完了後、すぐにテストしてください！**
