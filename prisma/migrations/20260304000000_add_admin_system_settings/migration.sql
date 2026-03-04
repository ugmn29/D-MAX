-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."admin_system_settings" (
    "id" SMALLINT NOT NULL DEFAULT 1,
    "issuer_company_name" TEXT,
    "issuer_postal_code" TEXT,
    "issuer_prefecture" TEXT,
    "issuer_city" TEXT,
    "issuer_address_line" TEXT,
    "issuer_phone" TEXT,
    "issuer_registration_number" TEXT,
    "sms_unit_price_jpy" INTEGER NOT NULL DEFAULT 10,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "admin_system_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "single_row" CHECK (id = 1)
);

-- Insert default row
INSERT INTO "public"."admin_system_settings" ("id") VALUES (1) ON CONFLICT DO NOTHING;
