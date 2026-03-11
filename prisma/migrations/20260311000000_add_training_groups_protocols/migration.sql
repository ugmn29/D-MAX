-- CreateTable: training_groups
-- 医院ごとのトレーニングタブグループ設定
CREATE TABLE "public"."training_groups" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  UUID         NOT NULL,
  "name"       VARCHAR(100) NOT NULL,
  "icon"       VARCHAR(10)  NOT NULL DEFAULT '📋',
  "color"      VARCHAR(50)  NOT NULL DEFAULT 'blue',
  "sort_order" INTEGER      NOT NULL DEFAULT 0,
  "is_active"  BOOLEAN      NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ  DEFAULT now(),
  "updated_at" TIMESTAMPTZ  DEFAULT now(),

  CONSTRAINT "training_groups_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_groups_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_training_groups_clinic" ON "public"."training_groups"("clinic_id");

-- CreateTable: training_group_items
-- グループに属するトレーニング
CREATE TABLE "public"."training_group_items" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "group_id"    UUID        NOT NULL,
  "training_id" UUID        NOT NULL,
  "sort_order"  INTEGER     NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT "training_group_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_group_items_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "public"."training_groups"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "training_group_items_training_id_fkey"
    FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "training_group_items_group_training_unique" UNIQUE ("group_id", "training_id")
);

CREATE INDEX "idx_training_group_items_group" ON "public"."training_group_items"("group_id");

-- CreateTable: training_protocols
-- 医院ごとの治療プロトコル（フローチャート）設定
CREATE TABLE "public"."training_protocols" (
  "id"                 UUID         NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"          UUID         NOT NULL,
  "name"               VARCHAR(100) NOT NULL,
  "description"        TEXT,
  "sort_order"         INTEGER      NOT NULL DEFAULT 0,
  "is_active"          BOOLEAN      NOT NULL DEFAULT true,
  "is_parallel_layout" BOOLEAN      NOT NULL DEFAULT false,
  "created_at"         TIMESTAMPTZ  DEFAULT now(),
  "updated_at"         TIMESTAMPTZ  DEFAULT now(),

  CONSTRAINT "training_protocols_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_protocols_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_training_protocols_clinic" ON "public"."training_protocols"("clinic_id");

-- CreateTable: training_protocol_steps
-- プロトコルのステップ（チェックポイント）
CREATE TABLE "public"."training_protocol_steps" (
  "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
  "protocol_id"      UUID         NOT NULL,
  "step_number"      INTEGER      NOT NULL DEFAULT 1,
  "checkpoint_name"  VARCHAR(200) NOT NULL,
  "description"      TEXT,
  "created_at"       TIMESTAMPTZ  DEFAULT now(),

  CONSTRAINT "training_protocol_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_protocol_steps_protocol_id_fkey"
    FOREIGN KEY ("protocol_id") REFERENCES "public"."training_protocols"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_training_protocol_steps_protocol" ON "public"."training_protocol_steps"("protocol_id");

-- CreateTable: training_protocol_step_items
-- ステップに属するトレーニング
CREATE TABLE "public"."training_protocol_step_items" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "step_id"     UUID        NOT NULL,
  "training_id" UUID        NOT NULL,
  "sort_order"  INTEGER     NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT "training_protocol_step_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "training_protocol_step_items_step_id_fkey"
    FOREIGN KEY ("step_id") REFERENCES "public"."training_protocol_steps"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "training_protocol_step_items_training_id_fkey"
    FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT "training_protocol_step_items_step_training_unique" UNIQUE ("step_id", "training_id")
);

CREATE INDEX "idx_training_protocol_step_items_step" ON "public"."training_protocol_step_items"("step_id");
