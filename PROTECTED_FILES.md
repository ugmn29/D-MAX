# 絶対に削除・変更してはいけないファイル

## CSS/スタイル設定（UIに影響）
- `tailwind.config.js` - Tailwind CSS設定
- `postcss.config.js` - PostCSS設定
- `app/globals.css` - グローバルCSS
- `next.config.js` - Next.js設定

## UIコンポーネント（全て保護）
- `components/**/*` - 全UIコンポーネント
- `app/**/page.tsx` - 全ページコンポーネント
- `app/**/layout.tsx` - 全レイアウトコンポーネント

## 環境設定
- `package.json` - 依存関係（CSS関連パッケージを削除しない）
- `tsconfig.json` - TypeScript設定
- `.env.local` - 環境変数

## この移行で変更するファイル
- `lib/api/**/*` - APIロジックのみ（Supabase → Prisma）
- `prisma/schema.prisma` - 新規作成
- `lib/prisma.ts` - 新規作成

## 変更禁止の原則
❌ `git clean -fd` を実行しない
❌ UIコンポーネントを変更しない
❌ CSS設定ファイルを削除しない
✅ API層のみを段階的に変更
