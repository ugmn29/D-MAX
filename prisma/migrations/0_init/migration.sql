-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('未来院', '遅刻', '来院済み', '診療中', '会計', '終了', 'キャンセル');

-- CreateEnum
CREATE TYPE "log_action" AS ENUM ('作成', '変更', 'キャンセル', '削除');

-- CreateEnum
CREATE TYPE "patient_gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "staff_role" AS ENUM ('admin', 'clinic', 'staff');

-- CreateTable
CREATE TABLE "acquisition_source_master" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "utm_source_patterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questionnaire_patterns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acquisition_source_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_sources_master" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "utm_source" TEXT NOT NULL,
    "utm_medium" TEXT,
    "description" TEXT,
    "is_system" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_sources_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_spend_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "ad_platform" TEXT NOT NULL,
    "campaign_name" TEXT,
    "spend_date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'JPY',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_spend_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertising_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "campaign_name" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "cost" INTEGER NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advertising_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID,
    "action" "log_action" NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "reason" TEXT NOT NULL,
    "operator_id" UUID,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "is_primary" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "appointment_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "unit_id" UUID,
    "menu1_id" UUID,
    "menu2_id" UUID,
    "menu3_id" UUID,
    "staff1_id" UUID,
    "staff2_id" UUID,
    "staff3_id" UUID,
    "status" "appointment_status" DEFAULT '未来院',
    "memo" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "cancel_reason_id" UUID,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "checked_in_at" TIMESTAMPTZ(6),
    "check_in_method" VARCHAR(50),
    "is_block" BOOLEAN DEFAULT false,
    "block_color" TEXT,
    "block_text" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auto_reminder_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "enabled" BOOLEAN DEFAULT false,
    "intervals" JSONB NOT NULL DEFAULT '[]',
    "on_cancel_resend_enabled" BOOLEAN DEFAULT false,
    "on_cancel_resend_delay_days" INTEGER,
    "on_cancel_resend_template_id" UUID,
    "fallback_enabled" BOOLEAN DEFAULT false,
    "fallback_order" JSONB DEFAULT '["line", "email", "sms"]',
    "optimize_send_time" BOOLEAN DEFAULT true,
    "default_send_hour" INTEGER DEFAULT 18,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auto_reminder_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_classification_question_mapping" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "c_classification_item" TEXT NOT NULL,
    "section_name" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "matching_condition" JSONB,
    "priority" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "c_classification_question_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cancel_reasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "template_id" UUID,

    CONSTRAINT "cancel_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "line_registered_rich_menu_id" VARCHAR(255),
    "line_unregistered_rich_menu_id" VARCHAR(255),

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_training_customizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "evaluation_level_1_label" VARCHAR(100),
    "evaluation_level_1_criteria" TEXT,
    "evaluation_level_2_label" VARCHAR(100),
    "evaluation_level_2_criteria" TEXT,
    "evaluation_level_3_label" VARCHAR(100),
    "evaluation_level_3_criteria" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinic_training_customizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "name_kana" VARCHAR(255),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "website_url" TEXT,
    "postal_code" VARCHAR(10),
    "prefecture" VARCHAR(50),
    "city" VARCHAR(100),
    "address_line" TEXT,
    "business_hours" JSONB,
    "break_times" JSONB,
    "time_slot_minutes" INTEGER DEFAULT 15,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT,
    "hp_url" TEXT,
    "google_maps_api_key" TEXT,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_memos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "memo" TEXT,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_identifier" TEXT NOT NULL,
    "patient_id" UUID NOT NULL,
    "last_login_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disease_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kana" TEXT NOT NULL,
    "icd10_code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "is_dental" BOOLEAN DEFAULT true,
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disease_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disease_treatment_set_mapping" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "disease_code" TEXT NOT NULL,
    "set_id" UUID NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "condition_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disease_treatment_set_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_type" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_data" JSONB NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_issue_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "training_id" UUID NOT NULL,
    "evaluation_level" INTEGER NOT NULL,
    "identified_issue_code" VARCHAR(50) NOT NULL,
    "auto_identify" BOOLEAN DEFAULT true,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_issue_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "postal_code" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "contact_person" TEXT DEFAULT '',
    "notes" TEXT DEFAULT '',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_links_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "link_type" TEXT NOT NULL,
    "generated_url" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "platform" TEXT,
    "placement" TEXT,
    "label" TEXT,
    "qr_code_url" TEXT,
    "click_count" INTEGER DEFAULT 0,
    "last_clicked_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_links_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hp_tab_click_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "tab_id" TEXT NOT NULL,
    "tab_label" TEXT NOT NULL,
    "tab_position" TEXT,
    "page_url" TEXT NOT NULL,
    "click_timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device_type" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "did_visit_booking" BOOLEAN DEFAULT false,
    "did_complete_booking" BOOLEAN DEFAULT false,
    "booking_completed_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hp_tab_click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "is_holiday" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "individual_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_training_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "issue_code" VARCHAR(50) NOT NULL,
    "training_id" UUID NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_training_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "medical_record_id" UUID NOT NULL,
    "lab_id" UUID NOT NULL,
    "order_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "completed_date" DATE,
    "items" JSONB DEFAULT '[]',
    "total_cost" DECIMAL(10,2) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ordered',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "postal_code" TEXT DEFAULT '',
    "address" TEXT DEFAULT '',
    "phone" TEXT DEFAULT '',
    "email" TEXT DEFAULT '',
    "contact_person" TEXT DEFAULT '',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_conversation_states" (
    "line_user_id" VARCHAR(255) NOT NULL,
    "state" VARCHAR(50) DEFAULT 'idle',
    "context" JSONB DEFAULT '{}',
    "expires_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_conversation_states_pkey" PRIMARY KEY ("line_user_id")
);

-- CreateTable
CREATE TABLE "line_invitation_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
    "invitation_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_patient_linkages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "line_user_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'self',
    "is_primary" BOOLEAN DEFAULT false,
    "linked_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_patient_linkages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_qr_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "line_user_id" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "qr_code_data" TEXT NOT NULL,
    "purpose" VARCHAR(50) DEFAULT 'checkin',
    "generated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "status" VARCHAR(50) DEFAULT 'active',

    CONSTRAINT "line_qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_rich_menus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "menu_type" VARCHAR(50),
    "line_rich_menu_id" VARCHAR(255),
    "menu_config" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_rich_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_user_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "line_user_id" VARCHAR(255) NOT NULL,
    "patient_id" UUID NOT NULL,
    "relationship" VARCHAR(50),
    "nickname" VARCHAR(100),
    "is_primary" BOOLEAN DEFAULT false,
    "is_blocked" BOOLEAN DEFAULT false,
    "linked_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "last_selected_at" TIMESTAMPTZ(6),
    "last_interaction_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_user_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lip_closure_tests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "test_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "measurement_value" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "examiner_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lip_closure_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
    "document_type" VARCHAR(50) NOT NULL,
    "document_subtype" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "content" JSONB NOT NULL,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "medical_record_id" UUID,
    "auto_generated" BOOLEAN DEFAULT false,
    "template_id" TEXT,

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "visit_type" TEXT NOT NULL,
    "facility_id" UUID,
    "diseases" JSONB DEFAULT '[]',
    "treatments" JSONB DEFAULT '[]',
    "prescriptions" JSONB DEFAULT '[]',
    "self_pay_items" JSONB DEFAULT '[]',
    "total_points" INTEGER DEFAULT 0,
    "total_insurance_amount" DECIMAL(10,2) DEFAULT 0,
    "patient_copay_amount" DECIMAL(10,2) DEFAULT 0,
    "self_pay_amount" DECIMAL(10,2) DEFAULT 0,
    "subjective" TEXT DEFAULT '',
    "objective" TEXT DEFAULT '',
    "assessment" TEXT DEFAULT '',
    "plan" TEXT DEFAULT '',
    "related_document_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "treatment_plan_id" UUID,
    "receipt_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER DEFAULT 1,
    "snapshot_data" JSONB DEFAULT '{}',

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "category" TEXT NOT NULL,
    "prescription_required" BOOLEAN DEFAULT true,
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memo_todo_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "items" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memo_todo_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menu_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "action_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "auto_progress" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mft_measurements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "measurement_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "height" DECIMAL(5,1),
    "weight" DECIMAL(5,1),
    "bmi" DECIMAL(4,1),
    "lip_seal_strength" DECIMAL(6,1),
    "tongue_pressure" DECIMAL(5,1),
    "max_mouth_opening" DECIMAL(4,1),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "mft_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_failure_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notification_schedule_id" UUID,
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "attempted_channel" VARCHAR(20),
    "failure_reason" TEXT,
    "failure_type" VARCHAR(50),
    "is_retryable" BOOLEAN DEFAULT true,
    "retry_with_fallback" BOOLEAN DEFAULT false,
    "failed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_failure_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "message_template" TEXT NOT NULL,
    "default_timing_value" INTEGER,
    "default_timing_unit" VARCHAR(20),
    "default_web_booking_menu_ids" UUID[],
    "default_staff_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "line_message" TEXT,
    "email_subject" VARCHAR(255),
    "email_message" TEXT,
    "sms_message" VARCHAR(160),
    "auto_send_enabled" BOOLEAN DEFAULT false,
    "auto_send_trigger" VARCHAR(50) DEFAULT 'manual',
    "auto_send_timing_value" INTEGER,
    "auto_send_timing_unit" VARCHAR(20),
    "template_id" UUID,
    "is_system_template" BOOLEAN DEFAULT false,
    "system_template_id" UUID,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "operator_id" UUID,
    "action_type" VARCHAR(50) NOT NULL,
    "target_table" VARCHAR(100) NOT NULL,
    "target_record_id" UUID NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oral_function_assessments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "assessment_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessment_type" TEXT NOT NULL DEFAULT '離乳完了後',
    "c1_result" BOOLEAN,
    "c1_source" TEXT,
    "c1_notes" TEXT,
    "c2_result" BOOLEAN,
    "c2_source" TEXT,
    "c2_notes" TEXT,
    "c3_result" BOOLEAN,
    "c3_source" TEXT,
    "c3_notes" TEXT,
    "c4_result" BOOLEAN,
    "c4_source" TEXT,
    "c4_notes" TEXT,
    "c5_result" BOOLEAN,
    "c5_source" TEXT,
    "c5_notes" TEXT,
    "c6_result" BOOLEAN,
    "c6_source" TEXT,
    "c6_notes" TEXT,
    "c7_result" BOOLEAN,
    "c7_source" TEXT,
    "c7_notes" TEXT,
    "c8_result" BOOLEAN,
    "c8_source" TEXT,
    "c8_notes" TEXT,
    "c9_result" BOOLEAN,
    "c9_source" TEXT,
    "c9_notes" TEXT,
    "c10_result" BOOLEAN,
    "c10_source" TEXT,
    "c10_notes" TEXT,
    "c11_result" BOOLEAN,
    "c11_source" TEXT,
    "c11_notes" TEXT,
    "c12_result" BOOLEAN,
    "c12_source" TEXT,
    "c12_notes" TEXT,
    "c13_result" BOOLEAN,
    "c13_source" TEXT,
    "c13_notes" TEXT,
    "c14_result" BOOLEAN,
    "c14_source" TEXT,
    "c14_notes" TEXT,
    "c15_result" BOOLEAN,
    "c15_source" TEXT,
    "c15_notes" TEXT,
    "c16_result" BOOLEAN,
    "c16_source" TEXT,
    "c16_notes" TEXT,
    "c17_result" BOOLEAN,
    "c17_source" TEXT,
    "c17_notes" TEXT,
    "questionnaire_response_id" UUID,
    "evaluated_by_staff_id" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oral_function_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_acquisition_channels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "acquisition_channel" VARCHAR(100) NOT NULL,
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "referral_patient_id" UUID,
    "acquisition_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_acquisition_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_acquisition_sources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "device_type" TEXT,
    "os" TEXT,
    "browser" TEXT,
    "questionnaire_source" TEXT,
    "questionnaire_detail" TEXT,
    "final_source" TEXT NOT NULL,
    "tracking_method" TEXT NOT NULL,
    "first_visit_at" TIMESTAMPTZ(6),
    "booking_completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "clicked_tab_id" TEXT,
    "clicked_tab_label" TEXT,

    CONSTRAINT "patient_acquisition_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_alert_confirmations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" VARCHAR(255) NOT NULL,
    "confirmed_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_alert_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_geocode_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "original_address" TEXT NOT NULL,
    "prefecture" TEXT,
    "city" TEXT,
    "district" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "geocode_status" TEXT,
    "geocode_error" TEXT,
    "area_code" TEXT,
    "distance_from_clinic" DECIMAL(10,2),
    "geocoded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_geocode_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_icons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "icon_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMPTZ(6) DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "patient_icons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_issue_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "issue_code" VARCHAR(50) NOT NULL,
    "identified_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "identified_by" UUID,
    "severity" INTEGER,
    "notes" TEXT,
    "is_resolved" BOOLEAN DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_issue_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_issues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_note_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(10),
    "color" VARCHAR(7),
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_note_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "note_type_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_notification_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "notification_schedule_id" UUID,
    "sent_at" TIMESTAMPTZ(6) NOT NULL,
    "send_channel" VARCHAR(20),
    "opened_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "booked_at" TIMESTAMPTZ(6),
    "hour_of_day" INTEGER,
    "day_of_week" INTEGER,
    "response_rate" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notification_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_notification_preferences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "appointment_reminder" BOOLEAN DEFAULT true,
    "periodic_checkup" BOOLEAN DEFAULT true,
    "treatment_reminder" BOOLEAN DEFAULT true,
    "appointment_change" BOOLEAN DEFAULT true,
    "custom" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_notification_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "template_id" UUID,
    "notification_type" VARCHAR(50) NOT NULL,
    "treatment_menu_id" UUID,
    "treatment_name" VARCHAR(255),
    "message" TEXT NOT NULL,
    "send_datetime" TIMESTAMPTZ(6) NOT NULL,
    "send_channel" VARCHAR(20) NOT NULL,
    "web_booking_enabled" BOOLEAN DEFAULT true,
    "web_booking_menu_ids" UUID[],
    "web_booking_staff_id" UUID,
    "web_booking_token" VARCHAR(255),
    "web_booking_token_expires_at" TIMESTAMPTZ(6),
    "linked_appointment_id" UUID,
    "status" VARCHAR(50) DEFAULT 'scheduled',
    "sent_at" TIMESTAMPTZ(6),
    "opened_at" TIMESTAMPTZ(6),
    "clicked_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "retry_count" INTEGER DEFAULT 0,
    "is_auto_reminder" BOOLEAN DEFAULT false,
    "auto_reminder_sequence" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notification_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_qr_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "qr_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "usage_count" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_web_booking_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "web_booking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "web_cancel_enabled" BOOLEAN NOT NULL DEFAULT true,
    "web_reschedule_enabled" BOOLEAN NOT NULL DEFAULT true,
    "web_cancel_limit" INTEGER,
    "cancel_deadline_hours" INTEGER,
    "max_concurrent_bookings" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_web_booking_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_number" INTEGER,
    "global_uuid" UUID DEFAULT gen_random_uuid(),
    "last_name" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name_kana" VARCHAR(50),
    "first_name_kana" VARCHAR(50),
    "birth_date" DATE,
    "gender" "patient_gender",
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "postal_code" VARCHAR(10),
    "prefecture" VARCHAR(50),
    "city" VARCHAR(100),
    "address_line" TEXT,
    "allergies" TEXT,
    "medical_history" TEXT,
    "primary_doctor_id" UUID,
    "primary_hygienist_id" UUID,
    "insurance_data" BYTEA,
    "is_registered" BOOLEAN DEFAULT false,
    "family_group_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT,
    "password_set" BOOLEAN DEFAULT false,
    "training_last_login_at" TIMESTAMPTZ(6),
    "preferred_contact_method" VARCHAR(20),
    "auto_reminder_enabled" BOOLEAN DEFAULT true,
    "auto_reminder_custom_intervals" JSONB,
    "notification_preferences" JSONB DEFAULT '{"other": true, "periodic_checkup": true, "treatment_reminder": true, "appointment_reminder": true}',
    "legacy_patient_number" VARCHAR(50),
    "legacy_system_name" VARCHAR(100),
    "migrated_at" TIMESTAMPTZ(6),
    "address" TEXT,
    "visit_reason" TEXT,
    "medications" TEXT,
    "insurance_card_image_path" TEXT,
    "insurance_verification_status" TEXT DEFAULT 'unverified',
    "last_insurance_verification_date" TIMESTAMPTZ(6),
    "copay_rate" DECIMAL(3,2) DEFAULT 0.30,
    "treatment_memo" TEXT,
    "alert_notes" TEXT,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodontal_examinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "examination_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examiner_id" UUID,
    "measurement_type" VARCHAR(10) NOT NULL DEFAULT '6point',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "examination_phase" VARCHAR(20) DEFAULT 'P_EXAM_1',

    CONSTRAINT "periodontal_examinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodontal_tooth_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examination_id" UUID NOT NULL,
    "tooth_number" INTEGER NOT NULL,
    "is_missing" BOOLEAN DEFAULT false,
    "mobility" INTEGER,
    "ppd_mb" INTEGER,
    "ppd_b" INTEGER,
    "ppd_db" INTEGER,
    "ppd_ml" INTEGER,
    "ppd_l" INTEGER,
    "ppd_dl" INTEGER,
    "bop_mb" BOOLEAN DEFAULT false,
    "bop_b" BOOLEAN DEFAULT false,
    "bop_db" BOOLEAN DEFAULT false,
    "bop_ml" BOOLEAN DEFAULT false,
    "bop_l" BOOLEAN DEFAULT false,
    "bop_dl" BOOLEAN DEFAULT false,
    "pus_mb" BOOLEAN DEFAULT false,
    "pus_b" BOOLEAN DEFAULT false,
    "pus_db" BOOLEAN DEFAULT false,
    "pus_ml" BOOLEAN DEFAULT false,
    "pus_l" BOOLEAN DEFAULT false,
    "pus_dl" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "plaque_top" BOOLEAN DEFAULT false,
    "plaque_right" BOOLEAN DEFAULT false,
    "plaque_bottom" BOOLEAN DEFAULT false,
    "plaque_left" BOOLEAN DEFAULT false,

    CONSTRAINT "periodontal_tooth_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "username" TEXT,
    "full_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "questionnaire_id" UUID NOT NULL,
    "section_name" VARCHAR(100) NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" VARCHAR(50) NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN DEFAULT true,
    "conditional_logic" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "linked_field" TEXT,
    "placeholder" TEXT,
    "is_hidden" BOOLEAN DEFAULT false,

    CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "questionnaire_id" UUID NOT NULL,
    "patient_id" UUID,
    "appointment_id" UUID,
    "response_data" JSONB NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "original_patient_data" JSONB,

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaires" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "template_id" UUID,

    CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "year_month" TEXT NOT NULL,
    "medical_record_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_points" INTEGER DEFAULT 0,
    "total_amount" DECIMAL(10,2) DEFAULT 0,
    "insurance_amount" DECIMAL(10,2) DEFAULT 0,
    "patient_amount" DECIMAL(10,2) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "validation_errors" JSONB DEFAULT '[]',
    "submitted_at" TIMESTAMPTZ(6),
    "submission_file_path" TEXT,
    "receipt_number" TEXT,
    "audit_result" JSONB,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "appointment_id" UUID,
    "patient_id" UUID NOT NULL,
    "staff_id" UUID,
    "sale_date" DATE NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "treatment_menu_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "receipt_number" VARCHAR(50),
    "treatment_date" DATE,
    "insurance_type" VARCHAR(50),
    "insurance_points" INTEGER,
    "insurance_amount" INTEGER,
    "patient_copay" INTEGER,
    "self_pay_amount" INTEGER,
    "total_amount" INTEGER,
    "payment_method" VARCHAR(50),
    "treatment_codes" TEXT[],
    "treatment_details" JSONB,
    "notes" TEXT,
    "external_system_id" VARCHAR(100),
    "external_system_name" VARCHAR(100),
    "imported_at" TIMESTAMPTZ(6),
    "import_file_name" VARCHAR(255),

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_import_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "import_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" TEXT,
    "total_records" INTEGER NOT NULL DEFAULT 0,
    "success_records" INTEGER NOT NULL DEFAULT 0,
    "failed_records" INTEGER NOT NULL DEFAULT 0,
    "error_details" JSONB,
    "imported_by" UUID,
    "status" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_import_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "self_pay_treatments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "price" DECIMAL(10,2) NOT NULL,
    "tax_rate" DECIMAL(3,2) DEFAULT 0.10,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "self_pay_treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_patterns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "abbreviation" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "break_start" TIME(6),
    "break_end" TIME(6),
    "memo" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "break_start_time" TIME(6),
    "break_end_time" TIME(6),
    "pattern_name" VARCHAR(50),
    "is_absent" BOOLEAN DEFAULT false,
    "substitute_for_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "user_id" UUID,
    "position_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "name_kana" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "employee_number" VARCHAR(50),
    "role" "staff_role" DEFAULT 'staff',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_evaluation_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "evaluation_period_start" DATE NOT NULL,
    "evaluation_period_end" DATE NOT NULL,
    "metrics_data" JSONB NOT NULL,
    "total_score" DECIMAL(10,2),
    "bonus_amount" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_evaluation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_evaluation_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "metric_name" VARCHAR(100) NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "weight_percentage" INTEGER NOT NULL DEFAULT 0,
    "target_value" DECIMAL(10,2),
    "position_id" UUID,
    "evaluation_period" VARCHAR(20) DEFAULT 'monthly',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_evaluation_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "template_id" UUID,

    CONSTRAINT "staff_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "shift_pattern_id" UUID,
    "is_holiday" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_unit_priorities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "priority_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_unit_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subkarte_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subkarte_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subkarte_audio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "audio_file_path" VARCHAR(500) NOT NULL,
    "transcription" TEXT,
    "duration_seconds" INTEGER,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) DEFAULT (now() + '01:00:00'::interval),

    CONSTRAINT "subkarte_audio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subkarte_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "entry_type" VARCHAR(20) NOT NULL,
    "content" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subkarte_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subkarte_handwriting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entry_id" UUID NOT NULL,
    "canvas_data" TEXT NOT NULL,
    "image_data" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subkarte_handwriting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subkarte_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100),
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subkarte_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_cancel_reasons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_cancel_reasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_notification_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "notification_type" VARCHAR(50) NOT NULL,
    "message_template" TEXT,
    "line_message" TEXT,
    "email_subject" TEXT,
    "email_message" TEXT,
    "sms_message" TEXT,
    "default_timing_value" INTEGER,
    "default_timing_unit" VARCHAR(20),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_questionnaire_template_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "section_name" TEXT,
    "question_text" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "options" JSONB,
    "is_required" BOOLEAN DEFAULT false,
    "conditional_logic" JSONB,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linked_field" TEXT,
    "placeholder" TEXT,

    CONSTRAINT "system_questionnaire_template_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_questionnaire_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_questionnaire_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_staff_positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_staff_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "action_seconds" INTEGER NOT NULL,
    "rest_seconds" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL,
    "auto_progress" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "template_name" VARCHAR(255) NOT NULL,
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "gtm_container_id" TEXT,
    "gtm_enabled" BOOLEAN DEFAULT false,
    "ga4_measurement_id" TEXT,
    "ga4_enabled" BOOLEAN DEFAULT false,
    "google_ads_conversion_id" TEXT,
    "google_ads_conversion_label" TEXT,
    "google_ads_enabled" BOOLEAN DEFAULT false,
    "meta_pixel_id" TEXT,
    "meta_pixel_enabled" BOOLEAN DEFAULT false,
    "yahoo_ads_account_id" TEXT,
    "yahoo_ads_enabled" BOOLEAN DEFAULT false,
    "line_tag_id" TEXT,
    "line_tag_enabled" BOOLEAN DEFAULT false,
    "custom_tags" JSONB DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "clarity_project_id" TEXT,
    "clarity_enabled" BOOLEAN DEFAULT false,

    CONSTRAINT "tracking_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "menu_id" UUID,
    "training_id" UUID NOT NULL,
    "menu_training_id" UUID,
    "evaluated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "evaluator_id" UUID,
    "evaluation_level" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_menus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "menu_name" VARCHAR(255),
    "prescribed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "training_id" UUID NOT NULL,
    "menu_id" UUID NOT NULL,
    "performed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN DEFAULT false,
    "interrupted" BOOLEAN DEFAULT false,
    "time_of_day" VARCHAR(10),
    "actual_duration_seconds" INTEGER,
    "device_info" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID,
    "training_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "animation_storage_path" TEXT,
    "mirror_display" BOOLEAN DEFAULT false,
    "is_default" BOOLEAN DEFAULT false,
    "default_action_seconds" INTEGER DEFAULT 10,
    "default_rest_seconds" INTEGER DEFAULT 5,
    "default_sets" INTEGER DEFAULT 1,
    "is_deleted" BOOLEAN DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "instructions" TEXT[],
    "precautions" TEXT[],
    "evaluation_level_1_label" VARCHAR(100) DEFAULT 'できなかった',
    "evaluation_level_1_criteria" TEXT,
    "evaluation_level_2_label" VARCHAR(100) DEFAULT 'まあまあできた',
    "evaluation_level_2_criteria" TEXT,
    "evaluation_level_3_label" VARCHAR(100) DEFAULT 'できた',
    "evaluation_level_3_criteria" TEXT,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "inclusion_rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exclusion_rules" JSONB DEFAULT '{"same_day": [], "same_site": [], "same_week": [], "same_month": [], "simultaneous": []}',
    "frequency_limits" JSONB DEFAULT '[]',
    "effective_from" DATE NOT NULL,
    "effective_to" DATE,
    "requires_documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_menus" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "parent_id" UUID,
    "level" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "standard_duration" INTEGER,
    "color" VARCHAR(7),
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "web_booking_enabled" BOOLEAN DEFAULT false,
    "web_booking_staff_ids" UUID[],
    "web_booking_duration" INTEGER,
    "web_booking_new_patient" BOOLEAN DEFAULT true,
    "web_booking_returning" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_content" TEXT NOT NULL,
    "treatment_menu_id" UUID,
    "staff_type" VARCHAR(20) NOT NULL,
    "tooth_number" VARCHAR(200),
    "tooth_position" VARCHAR(50),
    "priority" INTEGER DEFAULT 2,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "hygienist_menu_type" VARCHAR(20),
    "hygienist_menu_detail" TEXT,
    "periodontal_phase" VARCHAR(20),
    "periodontal_phase_detail" JSONB,
    "status" VARCHAR(20) DEFAULT 'planned',
    "completed_at" TIMESTAMPTZ(6),
    "implemented_date" DATE,
    "implemented_by" TEXT,
    "memo" TEXT,
    "subkarte_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "is_memo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_required_fields" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "treatment_code" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "field_options" JSONB,
    "is_required" BOOLEAN DEFAULT true,
    "placeholder" TEXT,
    "validation_rule" TEXT,
    "help_text" TEXT,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_required_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_set_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "set_id" UUID NOT NULL,
    "treatment_code" TEXT NOT NULL,
    "is_required" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "default_selected" BOOLEAN DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_set_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visual_examinations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "patient_id" TEXT NOT NULL,
    "clinic_id" UUID NOT NULL,
    "examination_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visual_examinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visual_tooth_data" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "examination_id" UUID NOT NULL,
    "tooth_number" INTEGER NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'healthy',
    "caries_level" VARCHAR(10),
    "restoration_type" VARCHAR(20),
    "material_type" VARCHAR(20),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visual_tooth_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_booking_funnel_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "step_name" TEXT NOT NULL,
    "step_number" INTEGER NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_timestamp" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device_type" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "tab_id" TEXT,
    "tab_label" TEXT,
    "tab_position" TEXT,
    "referrer_url" TEXT,

    CONSTRAINT "web_booking_funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_booking_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
    "treatment_menu_id" UUID,
    "treatment_menu_level2_id" UUID,
    "treatment_menu_level3_id" UUID,
    "staff_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_by" TEXT NOT NULL,
    "notification_schedule_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "web_booking_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_acquisition_source_master_clinic" ON "acquisition_source_master"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_acquisition_source_master_normalized" ON "acquisition_source_master"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_ad_sources_master_clinic_id" ON "ad_sources_master"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_ad_sources_master_utm_source" ON "ad_sources_master"("utm_source");

-- CreateIndex
CREATE INDEX "idx_ad_spend_clinic_id" ON "ad_spend_records"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_ad_spend_date" ON "ad_spend_records"("spend_date");

-- CreateIndex
CREATE INDEX "idx_ad_spend_platform" ON "ad_spend_records"("ad_platform");

-- CreateIndex
CREATE INDEX "idx_advertising_costs_clinic_period" ON "advertising_costs"("clinic_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "idx_appointment_logs_appointment_id" ON "appointment_logs"("appointment_id");

-- CreateIndex
CREATE INDEX "idx_appointment_logs_created_at" ON "appointment_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_appointment_staff_appointment_id" ON "appointment_staff"("appointment_id");

-- CreateIndex
CREATE INDEX "idx_appointment_staff_is_primary" ON "appointment_staff"("is_primary");

-- CreateIndex
CREATE INDEX "idx_appointment_staff_staff_id" ON "appointment_staff"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_staff_appointment_id_staff_id_key" ON "appointment_staff"("appointment_id", "staff_id");

-- CreateIndex
CREATE INDEX "idx_appointments_cancel_reason" ON "appointments"("cancel_reason_id");

-- CreateIndex
CREATE INDEX "idx_appointments_clinic_date" ON "appointments"("clinic_id", "appointment_date");

-- CreateIndex
CREATE INDEX "idx_appointments_patient" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "idx_appointments_staff" ON "appointments"("staff1_id", "staff2_id", "staff3_id");

-- CreateIndex
CREATE UNIQUE INDEX "auto_reminder_rules_clinic_id_key" ON "auto_reminder_rules"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_c_classification_mapping_item" ON "c_classification_question_mapping"("c_classification_item");

-- CreateIndex
CREATE INDEX "idx_cancel_reasons_clinic" ON "cancel_reasons"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_clinic_settings_registered_menu" ON "clinic_settings"("line_registered_rich_menu_id");

-- CreateIndex
CREATE INDEX "idx_clinic_settings_unregistered_menu" ON "clinic_settings"("line_unregistered_rich_menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_settings_clinic_id_setting_key_key" ON "clinic_settings"("clinic_id", "setting_key");

-- CreateIndex
CREATE INDEX "idx_clinic_customizations_clinic" ON "clinic_training_customizations"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinic_training_customizations_clinic_id_training_id_key" ON "clinic_training_customizations"("clinic_id", "training_id");

-- CreateIndex
CREATE UNIQUE INDEX "unique_clinic_slug" ON "clinics"("slug");

-- CreateIndex
CREATE INDEX "idx_clinics_slug" ON "clinics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "daily_memos_clinic_id_date_key" ON "daily_memos"("clinic_id", "date");

-- CreateIndex
CREATE INDEX "idx_device_accounts_device" ON "device_accounts"("device_identifier");

-- CreateIndex
CREATE UNIQUE INDEX "device_accounts_device_identifier_patient_id_key" ON "device_accounts"("device_identifier", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "disease_codes_code_key" ON "disease_codes"("code");

-- CreateIndex
CREATE INDEX "idx_disease_codes_category" ON "disease_codes"("category");

-- CreateIndex
CREATE INDEX "idx_disease_codes_code" ON "disease_codes"("code");

-- CreateIndex
CREATE INDEX "idx_disease_codes_icd10" ON "disease_codes"("icd10_code");

-- CreateIndex
CREATE INDEX "idx_disease_codes_is_dental" ON "disease_codes"("is_dental");

-- CreateIndex
CREATE INDEX "idx_disease_codes_kana" ON "disease_codes"("kana");

-- CreateIndex
CREATE INDEX "idx_disease_codes_name" ON "disease_codes"("name");

-- CreateIndex
CREATE INDEX "idx_disease_treatment_set_mapping_disease" ON "disease_treatment_set_mapping"("disease_code");

-- CreateIndex
CREATE INDEX "idx_disease_treatment_set_mapping_set" ON "disease_treatment_set_mapping"("set_id");

-- CreateIndex
CREATE UNIQUE INDEX "disease_treatment_set_mapping_disease_code_set_id_key" ON "disease_treatment_set_mapping"("disease_code", "set_id");

-- CreateIndex
CREATE INDEX "idx_document_templates_active" ON "document_templates"("is_active");

-- CreateIndex
CREATE INDEX "idx_document_templates_order" ON "document_templates"("document_type", "display_order");

-- CreateIndex
CREATE INDEX "idx_document_templates_type" ON "document_templates"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_document_type_template_key_key" ON "document_templates"("document_type", "template_key");

-- CreateIndex
CREATE INDEX "idx_evaluation_issue_rules_training" ON "evaluation_issue_rules"("training_id", "evaluation_level");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_issue_rules_training_id_evaluation_level_identif_key" ON "evaluation_issue_rules"("training_id", "evaluation_level", "identified_issue_code");

-- CreateIndex
CREATE INDEX "idx_facilities_clinic_id" ON "facilities"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_facilities_is_active" ON "facilities"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_clinic_id_code_key" ON "facilities"("clinic_id", "code");

-- CreateIndex
CREATE INDEX "idx_generated_links_clinic" ON "generated_links_history"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_generated_links_created" ON "generated_links_history"("created_at");

-- CreateIndex
CREATE INDEX "idx_generated_links_platform" ON "generated_links_history"("platform");

-- CreateIndex
CREATE INDEX "idx_generated_links_type" ON "generated_links_history"("link_type");

-- CreateIndex
CREATE INDEX "idx_tab_click_clinic_id" ON "hp_tab_click_events"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_tab_click_completed" ON "hp_tab_click_events"("did_complete_booking");

-- CreateIndex
CREATE INDEX "idx_tab_click_session_id" ON "hp_tab_click_events"("session_id");

-- CreateIndex
CREATE INDEX "idx_tab_click_tab_id" ON "hp_tab_click_events"("tab_id");

-- CreateIndex
CREATE INDEX "idx_tab_click_timestamp" ON "hp_tab_click_events"("click_timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "individual_holidays_clinic_id_date_key" ON "individual_holidays"("clinic_id", "date");

-- CreateIndex
CREATE INDEX "idx_issue_training_mappings_issue" ON "issue_training_mappings"("issue_code", "priority");

-- CreateIndex
CREATE INDEX "idx_issue_training_mappings_training" ON "issue_training_mappings"("training_id");

-- CreateIndex
CREATE INDEX "idx_lab_orders_clinic_id" ON "lab_orders"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_lab_orders_lab_id" ON "lab_orders"("lab_id");

-- CreateIndex
CREATE INDEX "idx_lab_orders_medical_record_id" ON "lab_orders"("medical_record_id");

-- CreateIndex
CREATE INDEX "idx_lab_orders_order_date" ON "lab_orders"("order_date" DESC);

-- CreateIndex
CREATE INDEX "idx_lab_orders_patient_id" ON "lab_orders"("patient_id");

-- CreateIndex
CREATE INDEX "idx_lab_orders_status" ON "lab_orders"("status");

-- CreateIndex
CREATE INDEX "idx_labs_clinic_id" ON "labs"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_labs_is_active" ON "labs"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "line_invitation_codes_invitation_code_key" ON "line_invitation_codes"("invitation_code");

-- CreateIndex
CREATE INDEX "idx_line_invitation_codes_code" ON "line_invitation_codes"("invitation_code");

-- CreateIndex
CREATE INDEX "idx_line_invitation_codes_expires_at" ON "line_invitation_codes"("expires_at");

-- CreateIndex
CREATE INDEX "idx_line_invitation_codes_patient_id" ON "line_invitation_codes"("patient_id");

-- CreateIndex
CREATE INDEX "idx_line_invitation_codes_status" ON "line_invitation_codes"("status");

-- CreateIndex
CREATE INDEX "idx_line_patient_linkages_clinic_id" ON "line_patient_linkages"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_line_patient_linkages_line_user_id" ON "line_patient_linkages"("line_user_id");

-- CreateIndex
CREATE INDEX "idx_line_patient_linkages_patient_id" ON "line_patient_linkages"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_line_patient_linkages_unique" ON "line_patient_linkages"("line_user_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_qr_tokens_token_key" ON "line_qr_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_line_qr_tokens_expires_at" ON "line_qr_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_line_qr_tokens_patient_id" ON "line_qr_tokens"("patient_id");

-- CreateIndex
CREATE INDEX "idx_line_qr_tokens_token" ON "line_qr_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_line_rich_menus_clinic_id" ON "line_rich_menus"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_line_user_links_line_user_id" ON "line_user_links"("line_user_id");

-- CreateIndex
CREATE INDEX "idx_line_user_links_patient_id" ON "line_user_links"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_user_links_line_user_id_patient_id_key" ON "line_user_links"("line_user_id", "patient_id");

-- CreateIndex
CREATE INDEX "idx_lip_closure_tests_clinic_id" ON "lip_closure_tests"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_lip_closure_tests_patient_id" ON "lip_closure_tests"("patient_id");

-- CreateIndex
CREATE INDEX "idx_lip_closure_tests_test_date" ON "lip_closure_tests"("test_date");

-- CreateIndex
CREATE INDEX "idx_medical_documents_clinic_id" ON "medical_documents"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_medical_documents_created_at" ON "medical_documents"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_medical_documents_document_type" ON "medical_documents"("document_type");

-- CreateIndex
CREATE INDEX "idx_medical_documents_medical_record_id" ON "medical_documents"("medical_record_id");

-- CreateIndex
CREATE INDEX "idx_medical_documents_patient_id" ON "medical_documents"("patient_id");

-- CreateIndex
CREATE INDEX "idx_medical_records_clinic_id" ON "medical_records"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_medical_records_created_at" ON "medical_records"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_medical_records_facility_id" ON "medical_records"("facility_id");

-- CreateIndex
CREATE INDEX "idx_medical_records_patient_id" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "idx_medical_records_treatment_plan_id" ON "medical_records"("treatment_plan_id");

-- CreateIndex
CREATE INDEX "idx_medical_records_visit_date" ON "medical_records"("visit_date" DESC);

-- CreateIndex
CREATE INDEX "idx_medical_records_visit_type" ON "medical_records"("visit_type");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_codes_code_key" ON "medicine_codes"("code");

-- CreateIndex
CREATE INDEX "idx_medicine_codes_category" ON "medicine_codes"("category");

-- CreateIndex
CREATE INDEX "idx_medicine_codes_code" ON "medicine_codes"("code");

-- CreateIndex
CREATE INDEX "idx_medicine_codes_generic_name" ON "medicine_codes"("generic_name");

-- CreateIndex
CREATE INDEX "idx_medicine_codes_name" ON "medicine_codes"("name");

-- CreateIndex
CREATE INDEX "idx_memo_todo_templates_clinic_id" ON "memo_todo_templates"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_memo_todo_templates_sort_order" ON "memo_todo_templates"("sort_order");

-- CreateIndex
CREATE INDEX "idx_menu_trainings_menu" ON "menu_trainings"("menu_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_menu_trainings_training" ON "menu_trainings"("training_id");

-- CreateIndex
CREATE INDEX "idx_mft_measurements_clinic_id" ON "mft_measurements"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_mft_measurements_measurement_date" ON "mft_measurements"("measurement_date");

-- CreateIndex
CREATE INDEX "idx_mft_measurements_patient_id" ON "mft_measurements"("patient_id");

-- CreateIndex
CREATE INDEX "idx_notification_failure_logs_clinic_id" ON "notification_failure_logs"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_notification_failure_logs_failed_at" ON "notification_failure_logs"("failed_at");

-- CreateIndex
CREATE INDEX "idx_notification_failure_logs_schedule_id" ON "notification_failure_logs"("notification_schedule_id");

-- CreateIndex
CREATE INDEX "idx_notification_templates_clinic_id" ON "notification_templates"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_notification_templates_system_template_id" ON "notification_templates"("system_template_id");

-- CreateIndex
CREATE INDEX "idx_notification_templates_type" ON "notification_templates"("notification_type");

-- CreateIndex
CREATE INDEX "idx_operation_logs_clinic" ON "operation_logs"("clinic_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_operation_logs_target" ON "operation_logs"("target_table", "target_record_id");

-- CreateIndex
CREATE INDEX "idx_oral_function_assessments_date" ON "oral_function_assessments"("assessment_date");

-- CreateIndex
CREATE INDEX "idx_oral_function_assessments_patient" ON "oral_function_assessments"("patient_id");

-- CreateIndex
CREATE INDEX "idx_oral_function_assessments_response" ON "oral_function_assessments"("questionnaire_response_id");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_clinic_date" ON "patient_acquisition_channels"("clinic_id", "acquisition_date");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_sources_booking_completed_at" ON "patient_acquisition_sources"("booking_completed_at");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_sources_clinic_id" ON "patient_acquisition_sources"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_sources_final_source" ON "patient_acquisition_sources"("final_source");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_sources_patient_id" ON "patient_acquisition_sources"("patient_id");

-- CreateIndex
CREATE INDEX "idx_patient_acquisition_sources_tracking_method" ON "patient_acquisition_sources"("tracking_method");

-- CreateIndex
CREATE INDEX "idx_patient_alert_confirmations_confirmed_date" ON "patient_alert_confirmations"("confirmed_date");

-- CreateIndex
CREATE INDEX "idx_patient_alert_confirmations_patient_id" ON "patient_alert_confirmations"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_alert_confirmations_patient_id_confirmed_date_key" ON "patient_alert_confirmations"("patient_id", "confirmed_date");

-- CreateIndex
CREATE UNIQUE INDEX "patient_geocode_cache_patient_id_key" ON "patient_geocode_cache"("patient_id");

-- CreateIndex
CREATE INDEX "idx_geocode_cache_city" ON "patient_geocode_cache"("city");

-- CreateIndex
CREATE INDEX "idx_geocode_cache_clinic" ON "patient_geocode_cache"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_geocode_cache_lat_lng" ON "patient_geocode_cache"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_geocode_cache_prefecture" ON "patient_geocode_cache"("prefecture");

-- CreateIndex
CREATE INDEX "idx_geocode_cache_status" ON "patient_geocode_cache"("geocode_status");

-- CreateIndex
CREATE INDEX "idx_patient_icons_clinic_id" ON "patient_icons"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_icons_patient_id" ON "patient_icons"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_icons_patient_id_clinic_id_key" ON "patient_icons"("patient_id", "clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_issue_records_clinic" ON "patient_issue_records"("clinic_id", "identified_at" DESC);

-- CreateIndex
CREATE INDEX "idx_patient_issue_records_patient" ON "patient_issue_records"("patient_id", "is_resolved");

-- CreateIndex
CREATE UNIQUE INDEX "patient_issues_code_key" ON "patient_issues"("code");

-- CreateIndex
CREATE INDEX "idx_patient_notification_analytics_patient_id" ON "patient_notification_analytics"("patient_id");

-- CreateIndex
CREATE INDEX "idx_patient_notification_analytics_sent_at" ON "patient_notification_analytics"("sent_at");

-- CreateIndex
CREATE INDEX "idx_patient_notification_preferences_clinic_id" ON "patient_notification_preferences"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_notification_preferences_patient_id" ON "patient_notification_preferences"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_notification_preferences_patient_id_clinic_id_key" ON "patient_notification_preferences"("patient_id", "clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_notification_schedules_web_booking_token_key" ON "patient_notification_schedules"("web_booking_token");

-- CreateIndex
CREATE INDEX "idx_patient_notification_schedules_clinic_id" ON "patient_notification_schedules"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_notification_schedules_patient_id" ON "patient_notification_schedules"("patient_id");

-- CreateIndex
CREATE INDEX "idx_patient_notification_schedules_send_datetime" ON "patient_notification_schedules"("send_datetime");

-- CreateIndex
CREATE INDEX "idx_patient_notification_schedules_status" ON "patient_notification_schedules"("status");

-- CreateIndex
CREATE INDEX "idx_patient_notification_schedules_token" ON "patient_notification_schedules"("web_booking_token");

-- CreateIndex
CREATE UNIQUE INDEX "patient_qr_codes_patient_id_key" ON "patient_qr_codes"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_qr_codes_qr_token_key" ON "patient_qr_codes"("qr_token");

-- CreateIndex
CREATE INDEX "idx_patient_qr_codes_clinic_id" ON "patient_qr_codes"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_qr_codes_patient_id" ON "patient_qr_codes"("patient_id");

-- CreateIndex
CREATE INDEX "idx_patient_qr_codes_qr_token" ON "patient_qr_codes"("qr_token");

-- CreateIndex
CREATE INDEX "idx_patient_web_booking_settings_clinic_id" ON "patient_web_booking_settings"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_patient_web_booking_settings_patient_id" ON "patient_web_booking_settings"("patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "patient_web_booking_settings_patient_id_clinic_id_key" ON "patient_web_booking_settings"("patient_id", "clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_global_uuid_key" ON "patients"("global_uuid");

-- CreateIndex
CREATE INDEX "idx_patients_clinic_number" ON "patients"("clinic_id", "patient_number");

-- CreateIndex
CREATE INDEX "idx_patients_legacy_number" ON "patients"("clinic_id", "legacy_patient_number");

-- CreateIndex
CREATE INDEX "idx_patients_name" ON "patients"("clinic_id", "last_name", "first_name");

-- CreateIndex
CREATE INDEX "idx_patients_training_login" ON "patients"("clinic_id", "patient_number", "birth_date") WHERE (is_registered = true);

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinic_id_patient_number_key" ON "patients"("clinic_id", "patient_number") WHERE (patient_number IS NOT NULL);

-- CreateIndex
CREATE INDEX "idx_periodontal_examinations_clinic" ON "periodontal_examinations"("clinic_id", "examination_date" DESC);

-- CreateIndex
CREATE INDEX "idx_periodontal_examinations_patient" ON "periodontal_examinations"("patient_id", "examination_date" DESC);

-- CreateIndex
CREATE INDEX "idx_periodontal_examinations_phase" ON "periodontal_examinations"("patient_id", "examination_phase", "examination_date" DESC);

-- CreateIndex
CREATE INDEX "idx_periodontal_tooth_data_examination" ON "periodontal_tooth_data"("examination_id");

-- CreateIndex
CREATE UNIQUE INDEX "periodontal_tooth_data_examination_id_tooth_number_key" ON "periodontal_tooth_data"("examination_id", "tooth_number");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "idx_questionnaire_questions_questionnaire" ON "questionnaire_questions"("questionnaire_id");

-- CreateIndex
CREATE INDEX "idx_questionnaire_responses_appointment" ON "questionnaire_responses"("appointment_id");

-- CreateIndex
CREATE INDEX "idx_questionnaire_responses_patient" ON "questionnaire_responses"("patient_id");

-- CreateIndex
CREATE INDEX "idx_questionnaires_clinic" ON "questionnaires"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_questionnaires_template_id" ON "questionnaires"("template_id");

-- CreateIndex
CREATE INDEX "idx_receipts_clinic_id" ON "receipts"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_receipts_patient_id" ON "receipts"("patient_id");

-- CreateIndex
CREATE INDEX "idx_receipts_status" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "idx_receipts_submitted_at" ON "receipts"("submitted_at" DESC);

-- CreateIndex
CREATE INDEX "idx_receipts_year_month" ON "receipts"("year_month" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "receipts_clinic_id_patient_id_year_month_key" ON "receipts"("clinic_id", "patient_id", "year_month");

-- CreateIndex
CREATE INDEX "idx_sales_category" ON "sales"("category");

-- CreateIndex
CREATE INDEX "idx_sales_clinic_date" ON "sales"("clinic_id", "sale_date");

-- CreateIndex
CREATE INDEX "idx_sales_external_system" ON "sales"("external_system_id", "external_system_name");

-- CreateIndex
CREATE INDEX "idx_sales_payment_method" ON "sales"("payment_method");

-- CreateIndex
CREATE INDEX "idx_sales_receipt_number" ON "sales"("receipt_number");

-- CreateIndex
CREATE INDEX "idx_sales_staff" ON "sales"("staff_id");

-- CreateIndex
CREATE INDEX "idx_sales_treatment_date" ON "sales"("treatment_date");

-- CreateIndex
CREATE INDEX "idx_sales_import_history_clinic" ON "sales_import_history"("clinic_id", "import_date" DESC);

-- CreateIndex
CREATE INDEX "idx_sales_import_history_status" ON "sales_import_history"("status");

-- CreateIndex
CREATE INDEX "idx_self_pay_treatments_category" ON "self_pay_treatments"("category");

-- CreateIndex
CREATE INDEX "idx_self_pay_treatments_clinic_id" ON "self_pay_treatments"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_self_pay_treatments_is_active" ON "self_pay_treatments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "self_pay_treatments_clinic_id_code_key" ON "self_pay_treatments"("clinic_id", "code");

-- CreateIndex
CREATE INDEX "idx_shift_patterns_clinic_id" ON "shift_patterns"("clinic_id");

-- CreateIndex
CREATE UNIQUE INDEX "shift_patterns_clinic_id_abbreviation_key" ON "shift_patterns"("clinic_id", "abbreviation");

-- CreateIndex
CREATE INDEX "idx_shifts_clinic_date" ON "shifts"("clinic_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_clinic_id_staff_id_date_key" ON "shifts"("clinic_id", "staff_id", "date");

-- CreateIndex
CREATE INDEX "idx_staff_evaluation_results_staff_period" ON "staff_evaluation_results"("staff_id", "evaluation_period_start", "evaluation_period_end");

-- CreateIndex
CREATE INDEX "idx_staff_evaluation_settings_clinic" ON "staff_evaluation_settings"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_staff_shifts_clinic_id" ON "staff_shifts"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_staff_shifts_date" ON "staff_shifts"("date");

-- CreateIndex
CREATE INDEX "idx_staff_shifts_staff_id" ON "staff_shifts"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_shifts_clinic_id_staff_id_date_key" ON "staff_shifts"("clinic_id", "staff_id", "date");

-- CreateIndex
CREATE INDEX "idx_staff_unit_priorities_clinic" ON "staff_unit_priorities"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_staff_unit_priorities_priority" ON "staff_unit_priorities"("clinic_id", "staff_id", "priority_order");

-- CreateIndex
CREATE INDEX "idx_staff_unit_priorities_staff" ON "staff_unit_priorities"("staff_id");

-- CreateIndex
CREATE INDEX "idx_staff_unit_priorities_unit" ON "staff_unit_priorities"("unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_unit_priorities_clinic_id_staff_id_unit_id_key" ON "staff_unit_priorities"("clinic_id", "staff_id", "unit_id");

-- CreateIndex
CREATE INDEX "idx_subkarte_attachments_entry_id" ON "subkarte_attachments"("entry_id");

-- CreateIndex
CREATE INDEX "idx_subkarte_audio_entry_id" ON "subkarte_audio"("entry_id");

-- CreateIndex
CREATE INDEX "idx_subkarte_audio_expires_at" ON "subkarte_audio"("expires_at");

-- CreateIndex
CREATE INDEX "idx_subkarte_entries_created_at" ON "subkarte_entries"("created_at");

-- CreateIndex
CREATE INDEX "idx_subkarte_entries_patient_id" ON "subkarte_entries"("patient_id");

-- CreateIndex
CREATE INDEX "idx_subkarte_handwriting_entry_id" ON "subkarte_handwriting"("entry_id");

-- CreateIndex
CREATE INDEX "idx_subkarte_templates_clinic_id" ON "subkarte_templates"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_system_questionnaire_template_questions_sort_order" ON "system_questionnaire_template_questions"("template_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_system_questionnaire_template_questions_template_id" ON "system_questionnaire_template_questions"("template_id");

-- CreateIndex
CREATE INDEX "idx_system_questionnaire_templates_active" ON "system_questionnaire_templates"("is_active");

-- CreateIndex
CREATE INDEX "idx_system_questionnaire_templates_category" ON "system_questionnaire_templates"("category");

-- CreateIndex
CREATE INDEX "idx_template_trainings_template" ON "template_trainings"("template_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_templates_clinic" ON "templates"("clinic_id") WHERE (is_deleted = false);

-- CreateIndex
CREATE UNIQUE INDEX "unique_clinic_tracking_tags" ON "tracking_tags"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_tracking_tags_clinic_id" ON "tracking_tags"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_training_evaluations_clinic" ON "training_evaluations"("clinic_id", "evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_training_evaluations_menu" ON "training_evaluations"("menu_id");

-- CreateIndex
CREATE INDEX "idx_training_evaluations_patient" ON "training_evaluations"("patient_id", "evaluated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_training_evaluations_training" ON "training_evaluations"("training_id", "evaluation_level");

-- CreateIndex
CREATE INDEX "idx_training_menus_active" ON "training_menus"("patient_id", "is_active") WHERE (is_deleted = false);

-- CreateIndex
CREATE INDEX "idx_training_menus_clinic" ON "training_menus"("clinic_id") WHERE (is_deleted = false);

-- CreateIndex
CREATE INDEX "idx_training_menus_patient" ON "training_menus"("patient_id") WHERE (is_deleted = false);

-- CreateIndex
CREATE INDEX "idx_training_records_clinic_date" ON "training_records"("clinic_id", "performed_at");

-- CreateIndex
CREATE INDEX "idx_training_records_clinic_training" ON "training_records"("clinic_id", "training_id", "performed_at");

-- CreateIndex
CREATE INDEX "idx_training_records_menu" ON "training_records"("menu_id");

-- CreateIndex
CREATE INDEX "idx_training_records_patient_date" ON "training_records"("patient_id", "performed_at");

-- CreateIndex
CREATE INDEX "idx_trainings_clinic" ON "trainings"("clinic_id") WHERE (is_deleted = false);

-- CreateIndex
CREATE INDEX "idx_trainings_default" ON "trainings"("is_default") WHERE ((is_default = true) AND (is_deleted = false));

-- CreateIndex
CREATE UNIQUE INDEX "treatment_codes_code_key" ON "treatment_codes"("code");

-- CreateIndex
CREATE INDEX "idx_treatment_codes_category" ON "treatment_codes"("category");

-- CreateIndex
CREATE INDEX "idx_treatment_codes_code" ON "treatment_codes"("code");

-- CreateIndex
CREATE INDEX "idx_treatment_codes_effective_dates" ON "treatment_codes"("effective_from", "effective_to");

-- CreateIndex
CREATE INDEX "idx_treatment_codes_name" ON "treatment_codes"("name");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_clinic" ON "treatment_plans"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_is_memo" ON "treatment_plans"("patient_id", "is_memo", "sort_order");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_patient" ON "treatment_plans"("patient_id");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_sort_order" ON "treatment_plans"("patient_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_staff_type" ON "treatment_plans"("staff_type");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_status" ON "treatment_plans"("status");

-- CreateIndex
CREATE INDEX "idx_treatment_plans_subkarte" ON "treatment_plans"("subkarte_id");

-- CreateIndex
CREATE INDEX "idx_treatment_required_fields_code" ON "treatment_required_fields"("treatment_code");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_required_fields_treatment_code_field_name_key" ON "treatment_required_fields"("treatment_code", "field_name");

-- CreateIndex
CREATE INDEX "idx_treatment_set_items_set_id" ON "treatment_set_items"("set_id");

-- CreateIndex
CREATE UNIQUE INDEX "treatment_sets_code_key" ON "treatment_sets"("code");

-- CreateIndex
CREATE INDEX "idx_visual_examinations_clinic" ON "visual_examinations"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_visual_examinations_date" ON "visual_examinations"("examination_date" DESC);

-- CreateIndex
CREATE INDEX "idx_visual_examinations_patient" ON "visual_examinations"("patient_id");

-- CreateIndex
CREATE INDEX "idx_visual_tooth_data_examination" ON "visual_tooth_data"("examination_id");

-- CreateIndex
CREATE INDEX "idx_visual_tooth_data_tooth_number" ON "visual_tooth_data"("tooth_number");

-- CreateIndex
CREATE INDEX "idx_funnel_events_clinic_id" ON "web_booking_funnel_events"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_funnel_events_event_timestamp" ON "web_booking_funnel_events"("event_timestamp");

-- CreateIndex
CREATE INDEX "idx_funnel_events_session_id" ON "web_booking_funnel_events"("session_id");

-- CreateIndex
CREATE INDEX "idx_funnel_events_step_name" ON "web_booking_funnel_events"("step_name");

-- CreateIndex
CREATE INDEX "idx_funnel_events_step_number" ON "web_booking_funnel_events"("step_number");

-- CreateIndex
CREATE INDEX "idx_funnel_events_utm_source" ON "web_booking_funnel_events"("utm_source");

-- CreateIndex
CREATE UNIQUE INDEX "web_booking_tokens_token_key" ON "web_booking_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_web_booking_tokens_clinic_id" ON "web_booking_tokens"("clinic_id");

-- CreateIndex
CREATE INDEX "idx_web_booking_tokens_expires_at" ON "web_booking_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "idx_web_booking_tokens_patient_id" ON "web_booking_tokens"("patient_id");

-- CreateIndex
CREATE INDEX "idx_web_booking_tokens_token" ON "web_booking_tokens"("token");

-- AddForeignKey
ALTER TABLE "acquisition_source_master" ADD CONSTRAINT "acquisition_source_master_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ad_sources_master" ADD CONSTRAINT "ad_sources_master_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ad_spend_records" ADD CONSTRAINT "ad_spend_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "advertising_costs" ADD CONSTRAINT "advertising_costs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_logs" ADD CONSTRAINT "appointment_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_logs" ADD CONSTRAINT "appointment_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_staff" ADD CONSTRAINT "appointment_staff_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment_staff" ADD CONSTRAINT "appointment_staff_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancel_reason_id_fkey" FOREIGN KEY ("cancel_reason_id") REFERENCES "cancel_reasons"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_menu1_id_fkey" FOREIGN KEY ("menu1_id") REFERENCES "treatment_menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_menu2_id_fkey" FOREIGN KEY ("menu2_id") REFERENCES "treatment_menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_menu3_id_fkey" FOREIGN KEY ("menu3_id") REFERENCES "treatment_menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff1_id_fkey" FOREIGN KEY ("staff1_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff2_id_fkey" FOREIGN KEY ("staff2_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_staff3_id_fkey" FOREIGN KEY ("staff3_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auto_reminder_rules" ADD CONSTRAINT "auto_reminder_rules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auto_reminder_rules" ADD CONSTRAINT "auto_reminder_rules_on_cancel_resend_template_id_fkey" FOREIGN KEY ("on_cancel_resend_template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cancel_reasons" ADD CONSTRAINT "cancel_reasons_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cancel_reasons" ADD CONSTRAINT "cancel_reasons_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "system_cancel_reasons"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clinic_settings" ADD CONSTRAINT "clinic_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clinic_training_customizations" ADD CONSTRAINT "clinic_training_customizations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clinic_training_customizations" ADD CONSTRAINT "clinic_training_customizations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_memos" ADD CONSTRAINT "daily_memos_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "daily_memos" ADD CONSTRAINT "daily_memos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "device_accounts" ADD CONSTRAINT "device_accounts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disease_treatment_set_mapping" ADD CONSTRAINT "disease_treatment_set_mapping_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "treatment_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluation_issue_rules" ADD CONSTRAINT "evaluation_issue_rules_identified_issue_code_fkey" FOREIGN KEY ("identified_issue_code") REFERENCES "patient_issues"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evaluation_issue_rules" ADD CONSTRAINT "evaluation_issue_rules_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "generated_links_history" ADD CONSTRAINT "generated_links_history_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "generated_links_history" ADD CONSTRAINT "generated_links_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hp_tab_click_events" ADD CONSTRAINT "fk_tab_click_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "individual_holidays" ADD CONSTRAINT "individual_holidays_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_training_mappings" ADD CONSTRAINT "issue_training_mappings_issue_code_fkey" FOREIGN KEY ("issue_code") REFERENCES "patient_issues"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "issue_training_mappings" ADD CONSTRAINT "issue_training_mappings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "labs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lab_orders" ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labs" ADD CONSTRAINT "labs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_invitation_codes" ADD CONSTRAINT "line_invitation_codes_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_invitation_codes" ADD CONSTRAINT "line_invitation_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_patient_linkages" ADD CONSTRAINT "line_patient_linkages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_qr_tokens" ADD CONSTRAINT "line_qr_tokens_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_qr_tokens" ADD CONSTRAINT "line_qr_tokens_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_rich_menus" ADD CONSTRAINT "line_rich_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_user_links" ADD CONSTRAINT "line_user_links_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "line_user_links" ADD CONSTRAINT "line_user_links_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "memo_templates" ADD CONSTRAINT "memo_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "memo_todo_templates" ADD CONSTRAINT "memo_todo_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_trainings" ADD CONSTRAINT "menu_trainings_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "training_menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_trainings" ADD CONSTRAINT "menu_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mft_measurements" ADD CONSTRAINT "mft_measurements_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mft_measurements" ADD CONSTRAINT "mft_measurements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mft_measurements" ADD CONSTRAINT "mft_measurements_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_failure_logs" ADD CONSTRAINT "notification_failure_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_failure_logs" ADD CONSTRAINT "notification_failure_logs_notification_schedule_id_fkey" FOREIGN KEY ("notification_schedule_id") REFERENCES "patient_notification_schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_failure_logs" ADD CONSTRAINT "notification_failure_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_default_staff_id_fkey" FOREIGN KEY ("default_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_system_template_id_fkey" FOREIGN KEY ("system_template_id") REFERENCES "system_notification_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "system_notification_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "operation_logs" ADD CONSTRAINT "operation_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oral_function_assessments" ADD CONSTRAINT "oral_function_assessments_evaluated_by_staff_id_fkey" FOREIGN KEY ("evaluated_by_staff_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "oral_function_assessments" ADD CONSTRAINT "oral_function_assessments_questionnaire_response_id_fkey" FOREIGN KEY ("questionnaire_response_id") REFERENCES "questionnaire_responses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_acquisition_channels" ADD CONSTRAINT "patient_acquisition_channels_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_acquisition_channels" ADD CONSTRAINT "patient_acquisition_channels_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_acquisition_channels" ADD CONSTRAINT "patient_acquisition_channels_referral_patient_id_fkey" FOREIGN KEY ("referral_patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_acquisition_sources" ADD CONSTRAINT "fk_patient_acquisition_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_acquisition_sources" ADD CONSTRAINT "fk_patient_acquisition_patient" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_geocode_cache" ADD CONSTRAINT "patient_geocode_cache_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_geocode_cache" ADD CONSTRAINT "patient_geocode_cache_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_issue_records" ADD CONSTRAINT "patient_issue_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_issue_records" ADD CONSTRAINT "patient_issue_records_identified_by_fkey" FOREIGN KEY ("identified_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_issue_records" ADD CONSTRAINT "patient_issue_records_issue_code_fkey" FOREIGN KEY ("issue_code") REFERENCES "patient_issues"("code") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_issue_records" ADD CONSTRAINT "patient_issue_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_note_types" ADD CONSTRAINT "patient_note_types_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "patient_note_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_analytics" ADD CONSTRAINT "patient_notification_analytics_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_analytics" ADD CONSTRAINT "patient_notification_analytics_notification_schedule_id_fkey" FOREIGN KEY ("notification_schedule_id") REFERENCES "patient_notification_schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_analytics" ADD CONSTRAINT "patient_notification_analytics_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_preferences" ADD CONSTRAINT "patient_notification_preferences_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_linked_appointment_id_fkey" FOREIGN KEY ("linked_appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "treatment_menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_notification_schedules" ADD CONSTRAINT "patient_notification_schedules_web_booking_staff_id_fkey" FOREIGN KEY ("web_booking_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_qr_codes" ADD CONSTRAINT "patient_qr_codes_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_web_booking_settings" ADD CONSTRAINT "patient_web_booking_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_web_booking_settings" ADD CONSTRAINT "patient_web_booking_settings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_primary_doctor_id_fkey" FOREIGN KEY ("primary_doctor_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_primary_hygienist_id_fkey" FOREIGN KEY ("primary_hygienist_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "periodontal_examinations" ADD CONSTRAINT "periodontal_examinations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "periodontal_examinations" ADD CONSTRAINT "periodontal_examinations_examiner_id_fkey" FOREIGN KEY ("examiner_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "periodontal_tooth_data" ADD CONSTRAINT "periodontal_tooth_data_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "periodontal_examinations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "questionnaires" ADD CONSTRAINT "questionnaires_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "system_questionnaire_templates"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "treatment_menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_import_history" ADD CONSTRAINT "sales_import_history_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_import_history" ADD CONSTRAINT "sales_import_history_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "self_pay_treatments" ADD CONSTRAINT "self_pay_treatments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shift_patterns" ADD CONSTRAINT "shift_patterns_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_substitute_for_id_fkey" FOREIGN KEY ("substitute_for_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "staff_positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_evaluation_results" ADD CONSTRAINT "staff_evaluation_results_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_evaluation_results" ADD CONSTRAINT "staff_evaluation_results_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_evaluation_settings" ADD CONSTRAINT "staff_evaluation_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_evaluation_settings" ADD CONSTRAINT "staff_evaluation_settings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "staff_positions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_positions" ADD CONSTRAINT "staff_positions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_positions" ADD CONSTRAINT "staff_positions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "system_staff_positions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_shift_pattern_id_fkey" FOREIGN KEY ("shift_pattern_id") REFERENCES "shift_patterns"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_unit_priorities" ADD CONSTRAINT "staff_unit_priorities_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_unit_priorities" ADD CONSTRAINT "staff_unit_priorities_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_unit_priorities" ADD CONSTRAINT "staff_unit_priorities_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_attachments" ADD CONSTRAINT "subkarte_attachments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "subkarte_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_audio" ADD CONSTRAINT "subkarte_audio_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "subkarte_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_entries" ADD CONSTRAINT "subkarte_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_entries" ADD CONSTRAINT "subkarte_entries_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_handwriting" ADD CONSTRAINT "subkarte_handwriting_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "subkarte_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subkarte_templates" ADD CONSTRAINT "subkarte_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_questionnaire_template_questions" ADD CONSTRAINT "system_questionnaire_template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "system_questionnaire_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template_trainings" ADD CONSTRAINT "template_trainings_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "template_trainings" ADD CONSTRAINT "template_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tracking_tags" ADD CONSTRAINT "tracking_tags_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "training_menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_menu_training_id_fkey" FOREIGN KEY ("menu_training_id") REFERENCES "menu_trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_evaluations" ADD CONSTRAINT "training_evaluations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_menus" ADD CONSTRAINT "training_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_menus" ADD CONSTRAINT "training_menus_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "training_menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "trainings"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "treatment_menus" ADD CONSTRAINT "treatment_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "treatment_menus" ADD CONSTRAINT "treatment_menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "treatment_menus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "treatment_set_items" ADD CONSTRAINT "treatment_set_items_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "treatment_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visual_examinations" ADD CONSTRAINT "visual_examinations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "visual_tooth_data" ADD CONSTRAINT "visual_tooth_data_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "visual_examinations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_booking_funnel_events" ADD CONSTRAINT "fk_funnel_events_clinic" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_booking_tokens" ADD CONSTRAINT "web_booking_tokens_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_booking_tokens" ADD CONSTRAINT "web_booking_tokens_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "treatment_menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_booking_tokens" ADD CONSTRAINT "web_booking_tokens_treatment_menu_level2_id_fkey" FOREIGN KEY ("treatment_menu_level2_id") REFERENCES "treatment_menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "web_booking_tokens" ADD CONSTRAINT "web_booking_tokens_treatment_menu_level3_id_fkey" FOREIGN KEY ("treatment_menu_level3_id") REFERENCES "treatment_menus"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

