-- Add status column to clinics
ALTER TABLE "public"."clinics" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';

-- Create admin_accounts table
CREATE TABLE IF NOT EXISTS "public"."admin_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "admin_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "admin_accounts_email_key" ON "public"."admin_accounts"("email");

-- Create announcements table
CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "target_all" BOOLEAN NOT NULL DEFAULT true,
    "target_clinic_ids" TEXT[] NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_at" TIMESTAMPTZ NOT NULL,
    "end_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- Create announcement_reads table
CREATE TABLE IF NOT EXISTS "public"."announcement_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "announcement_reads_announcement_id_fkey"
        FOREIGN KEY ("announcement_id")
        REFERENCES "public"."announcements"("id")
        ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "announcement_reads_announcement_id_staff_id_key"
    ON "public"."announcement_reads"("announcement_id", "staff_id");
