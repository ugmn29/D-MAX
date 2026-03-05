-- CreateTable: individual_holiday_time_ranges
-- 時間帯休診を複数設定できるテーブル（全日休診とは別管理）
CREATE TABLE "public"."individual_holiday_time_ranges" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "clinic_id"  UUID        NOT NULL,
  "date"       DATE        NOT NULL,
  "start_time" TIME(6)     NOT NULL,
  "end_time"   TIME(6)     NOT NULL,
  "created_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT "individual_holiday_time_ranges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "individual_holiday_time_ranges_clinic_id_fkey"
    FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "idx_individual_holiday_time_ranges_clinic_date"
  ON "public"."individual_holiday_time_ranges"("clinic_id", "date");
