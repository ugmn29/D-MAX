-- plan_master テーブルを作成
CREATE TABLE IF NOT EXISTS "public"."plan_master" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "monthly_fee" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "plan_master_pkey" PRIMARY KEY ("id")
);

-- テスト・サンプル・デモクリニックを削除
DELETE FROM "public"."clinics"
WHERE LOWER(name) LIKE '%test%'
   OR LOWER(name) LIKE '%テスト%'
   OR LOWER(name) LIKE '%sample%'
   OR LOWER(name) LIKE '%サンプル%'
   OR LOWER(name) LIKE '%demo%'
   OR LOWER(name) LIKE '%デモ%';
