

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS '電子カルテシステム - マイグレーション完了 (2025-11-12)';



CREATE TYPE "public"."appointment_status" AS ENUM (
    '未来院',
    '遅刻',
    '来院済み',
    '診療中',
    '会計',
    '終了',
    'キャンセル'
);


ALTER TYPE "public"."appointment_status" OWNER TO "postgres";


CREATE TYPE "public"."log_action" AS ENUM (
    '作成',
    '変更',
    'キャンセル',
    '削除'
);


ALTER TYPE "public"."log_action" OWNER TO "postgres";


CREATE TYPE "public"."patient_gender" AS ENUM (
    'male',
    'female',
    'other'
);


ALTER TYPE "public"."patient_gender" OWNER TO "postgres";


CREATE TYPE "public"."staff_role" AS ENUM (
    'admin',
    'clinic',
    'staff'
);


ALTER TYPE "public"."staff_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_device_account_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (SELECT COUNT(*) FROM device_accounts
        WHERE device_identifier = NEW.device_identifier) >= 5 THEN
        RAISE EXCEPTION 'Device account limit exceeded: Maximum 5 accounts per device';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_device_account_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_template_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF (SELECT COUNT(*) FROM templates
        WHERE clinic_id = NEW.clinic_id
        AND is_deleted = false) >= 10 THEN
        RAISE EXCEPTION 'Template limit exceeded: Maximum 10 templates per clinic';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_template_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_audio_data"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM subkarte_audio WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_audio_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_conversation_states"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM line_conversation_states WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_conversation_states"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_qr_tokens"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE line_qr_tokens
  SET status = 'expired'
  WHERE expires_at < NOW() AND status = 'active';
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_qr_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_web_booking_tokens"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM web_booking_tokens WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_web_booking_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_templates_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_document_templates_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_medical_documents_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_medical_documents_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ad_spend_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "ad_platform" "text" NOT NULL,
    "campaign_name" "text",
    "spend_date" "date" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'JPY'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ad_spend_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."ad_spend_records" IS '広告費記録テーブル - 各プラットフォームの広告費を管理';



CREATE TABLE IF NOT EXISTS "public"."advertising_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "campaign_name" character varying(255) NOT NULL,
    "platform" character varying(50) NOT NULL,
    "cost" integer NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "utm_source" character varying(100),
    "utm_medium" character varying(100),
    "utm_campaign" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advertising_costs_platform_check" CHECK ((("platform")::"text" = ANY ((ARRAY['google'::character varying, 'meta'::character varying, 'yahoo'::character varying, 'instagram'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."advertising_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid",
    "action" "public"."log_action" NOT NULL,
    "before_data" "jsonb",
    "after_data" "jsonb",
    "reason" "text" NOT NULL,
    "operator_id" "uuid",
    "ip_address" "inet",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appointment_logs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."appointment_logs"."operator_id" IS 'スタッフID（NULLの場合はシステム操作）';



CREATE TABLE IF NOT EXISTS "public"."appointment_staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."appointment_staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "appointment_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "unit_id" "uuid",
    "menu1_id" "uuid",
    "menu2_id" "uuid",
    "menu3_id" "uuid",
    "staff1_id" "uuid",
    "staff2_id" "uuid",
    "staff3_id" "uuid",
    "status" "public"."appointment_status" DEFAULT '未来院'::"public"."appointment_status",
    "memo" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cancel_reason_id" "uuid",
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "uuid",
    "checked_in_at" timestamp with time zone,
    "check_in_method" character varying(50),
    CONSTRAINT "appointments_check_in_method_check" CHECK ((("check_in_method")::"text" = ANY ((ARRAY['qr_code'::character varying, 'manual'::character varying, 'auto'::character varying])::"text"[])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auto_reminder_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT false,
    "intervals" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "on_cancel_resend_enabled" boolean DEFAULT false,
    "on_cancel_resend_delay_days" integer,
    "on_cancel_resend_template_id" "uuid",
    "fallback_enabled" boolean DEFAULT false,
    "fallback_order" "jsonb" DEFAULT '["line", "email", "sms"]'::"jsonb",
    "optimize_send_time" boolean DEFAULT true,
    "default_send_hour" integer DEFAULT 18,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "auto_reminder_rules_default_send_hour_check" CHECK ((("default_send_hour" >= 0) AND ("default_send_hour" <= 23)))
);


ALTER TABLE "public"."auto_reminder_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."c_classification_question_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "c_classification_item" "text" NOT NULL,
    "section_name" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "matching_condition" "jsonb",
    "priority" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."c_classification_question_mapping" OWNER TO "postgres";


COMMENT ON TABLE "public"."c_classification_question_mapping" IS '問診票質問とC分類項目の紐付けマッピング';



CREATE TABLE IF NOT EXISTS "public"."cancel_reasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "template_id" "uuid"
);


ALTER TABLE "public"."cancel_reasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "setting_key" character varying(100) NOT NULL,
    "setting_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinic_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinic_training_customizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "training_id" "uuid" NOT NULL,
    "evaluation_level_1_label" character varying(100),
    "evaluation_level_1_criteria" "text",
    "evaluation_level_2_label" character varying(100),
    "evaluation_level_2_criteria" "text",
    "evaluation_level_3_label" character varying(100),
    "evaluation_level_3_criteria" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clinic_training_customizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "name_kana" character varying(255),
    "phone" character varying(20),
    "email" character varying(255),
    "website_url" "text",
    "postal_code" character varying(10),
    "prefecture" character varying(50),
    "city" character varying(100),
    "address_line" "text",
    "business_hours" "jsonb",
    "break_times" "jsonb",
    "time_slot_minutes" integer DEFAULT 15,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text"
);


ALTER TABLE "public"."clinics" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clinics"."slug" IS 'クリニック専用のURL識別子（例: tanaka-dental）';



CREATE TABLE IF NOT EXISTS "public"."daily_memos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "memo" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_memos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_identifier" "text" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "last_login_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disease_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "kana" "text" NOT NULL,
    "icd10_code" "text" NOT NULL,
    "category" "text" NOT NULL,
    "is_dental" boolean DEFAULT true,
    "synonyms" "text"[] DEFAULT '{}'::"text"[],
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."disease_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."disease_codes" IS '病名マスター - MEDIS-DC ICD10対応標準病名マスター';



COMMENT ON COLUMN "public"."disease_codes"."kana" IS 'カナ読み (検索用)';



COMMENT ON COLUMN "public"."disease_codes"."synonyms" IS '同義語配列';



CREATE TABLE IF NOT EXISTS "public"."disease_treatment_set_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "disease_code" "text" NOT NULL,
    "set_id" "uuid" NOT NULL,
    "priority" integer DEFAULT 0,
    "condition_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."disease_treatment_set_mapping" OWNER TO "postgres";


COMMENT ON TABLE "public"."disease_treatment_set_mapping" IS '病名から処置セットへの自動提案マッピング';



CREATE TABLE IF NOT EXISTS "public"."document_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "document_type" "text" NOT NULL,
    "template_key" "text" NOT NULL,
    "template_name" "text" NOT NULL,
    "template_data" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "document_templates_document_type_check" CHECK (("document_type" = ANY (ARRAY['診療情報提供料(I)'::"text", '診療情報提供料(II)'::"text", '診療情報等連携共有料1'::"text", '診療情報等連携共有料2'::"text"])))
);


ALTER TABLE "public"."document_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evaluation_issue_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "training_id" "uuid" NOT NULL,
    "evaluation_level" integer NOT NULL,
    "identified_issue_code" character varying(50) NOT NULL,
    "auto_identify" boolean DEFAULT true,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "evaluation_issue_rules_evaluation_level_check" CHECK ((("evaluation_level" >= 1) AND ("evaluation_level" <= 3)))
);


ALTER TABLE "public"."evaluation_issue_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text",
    "address" "text" DEFAULT ''::"text",
    "phone" "text" DEFAULT ''::"text",
    "contact_person" "text" DEFAULT ''::"text",
    "notes" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."facilities" OWNER TO "postgres";


COMMENT ON TABLE "public"."facilities" IS '施設マスター - 訪問診療先施設情報';



CREATE TABLE IF NOT EXISTS "public"."hp_tab_click_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "tab_id" "text" NOT NULL,
    "tab_label" "text" NOT NULL,
    "tab_position" "text",
    "page_url" "text" NOT NULL,
    "click_timestamp" timestamp with time zone DEFAULT "now"(),
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "device_type" "text",
    "os" "text",
    "browser" "text",
    "did_visit_booking" boolean DEFAULT false,
    "did_complete_booking" boolean DEFAULT false,
    "booking_completed_at" timestamp with time zone,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hp_tab_click_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."hp_tab_click_events" IS 'HPのタブクリックイベントテーブル - どのタブから予約に流入したかを記録';



COMMENT ON COLUMN "public"."hp_tab_click_events"."tab_id" IS 'タブの識別子（header, sidebar, footer, price_pageなど）';



COMMENT ON COLUMN "public"."hp_tab_click_events"."tab_label" IS 'タブのラベル（「予約する」「今すぐ予約」など）';



COMMENT ON COLUMN "public"."hp_tab_click_events"."tab_position" IS 'タブの配置位置（header, sidebar, footer, floating）';



COMMENT ON COLUMN "public"."hp_tab_click_events"."did_visit_booking" IS '予約ページに到達したか';



COMMENT ON COLUMN "public"."hp_tab_click_events"."did_complete_booking" IS '予約を完了したか';



CREATE TABLE IF NOT EXISTS "public"."individual_holidays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "is_holiday" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."individual_holidays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."issue_training_mappings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "issue_code" character varying(50) NOT NULL,
    "training_id" "uuid" NOT NULL,
    "priority" integer DEFAULT 1,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."issue_training_mappings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lab_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "medical_record_id" "uuid" NOT NULL,
    "lab_id" "uuid" NOT NULL,
    "order_date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "completed_date" "date",
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "total_cost" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'ordered'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lab_orders_status_check" CHECK (("status" = ANY (ARRAY['ordered'::"text", 'in_progress'::"text", 'completed'::"text", 'delivered'::"text"])))
);


ALTER TABLE "public"."lab_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."lab_orders" IS '技工指示書';



CREATE TABLE IF NOT EXISTS "public"."labs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "postal_code" "text" DEFAULT ''::"text",
    "address" "text" DEFAULT ''::"text",
    "phone" "text" DEFAULT ''::"text",
    "email" "text" DEFAULT ''::"text",
    "contact_person" "text" DEFAULT ''::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."labs" OWNER TO "postgres";


COMMENT ON TABLE "public"."labs" IS '技工所マスター';



CREATE TABLE IF NOT EXISTS "public"."line_conversation_states" (
    "line_user_id" character varying(255) NOT NULL,
    "state" character varying(50) DEFAULT 'idle'::character varying,
    "context" "jsonb" DEFAULT '{}'::"jsonb",
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "line_conversation_states_state_check" CHECK ((("state")::"text" = ANY ((ARRAY['idle'::character varying, 'linking_step1'::character varying, 'linking_step2'::character varying, 'adding_family_step1'::character varying, 'adding_family_step2'::character varying, 'adding_family_step3'::character varying])::"text"[])))
);


ALTER TABLE "public"."line_conversation_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."line_invitation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "text" NOT NULL,
    "invitation_code" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "line_invitation_codes_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'used'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."line_invitation_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."line_invitation_codes" IS 'LINE連携用の招待コード管理テーブル';



COMMENT ON COLUMN "public"."line_invitation_codes"."invitation_code" IS '8桁の招待コード（例: AB12-CD34）';



COMMENT ON COLUMN "public"."line_invitation_codes"."status" IS '招待コードの状態: pending=未使用, used=使用済み, expired=期限切れ';



CREATE TABLE IF NOT EXISTS "public"."line_patient_linkages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "line_user_id" "text" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "relationship" "text" DEFAULT 'self'::"text" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "linked_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "line_patient_linkages_relationship_check" CHECK (("relationship" = ANY (ARRAY['self'::"text", 'parent'::"text", 'spouse'::"text", 'child'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."line_patient_linkages" OWNER TO "postgres";


COMMENT ON TABLE "public"."line_patient_linkages" IS '患者とLINEアカウントの連携情報テーブル';



COMMENT ON COLUMN "public"."line_patient_linkages"."relationship" IS '連携関係: self=本人, parent=親, spouse=配偶者, child=子供, other=その他';



COMMENT ON COLUMN "public"."line_patient_linkages"."is_primary" IS 'このLINEアカウントのメイン患者かどうか';



CREATE TABLE IF NOT EXISTS "public"."line_qr_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "line_user_id" character varying(255) NOT NULL,
    "token" character varying(255) NOT NULL,
    "qr_code_data" "text" NOT NULL,
    "purpose" character varying(50) DEFAULT 'checkin'::character varying,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "status" character varying(50) DEFAULT 'active'::character varying,
    CONSTRAINT "line_qr_tokens_purpose_check" CHECK ((("purpose")::"text" = ANY ((ARRAY['checkin'::character varying, 'payment'::character varying])::"text"[]))),
    CONSTRAINT "line_qr_tokens_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."line_qr_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."line_rich_menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "menu_type" character varying(50),
    "line_rich_menu_id" character varying(255),
    "menu_config" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "line_rich_menus_menu_type_check" CHECK ((("menu_type")::"text" = ANY ((ARRAY['before_link'::character varying, 'after_link'::character varying])::"text"[])))
);


ALTER TABLE "public"."line_rich_menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."line_user_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "line_user_id" character varying(255) NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "relationship" character varying(50),
    "nickname" character varying(100),
    "is_primary" boolean DEFAULT false,
    "is_blocked" boolean DEFAULT false,
    "linked_at" timestamp with time zone DEFAULT "now"(),
    "last_selected_at" timestamp with time zone,
    "last_interaction_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "line_user_links_relationship_check" CHECK ((("relationship")::"text" = ANY ((ARRAY['self'::character varying, 'spouse'::character varying, 'child'::character varying, 'parent'::character varying, 'other'::character varying])::"text"[])))
);


ALTER TABLE "public"."line_user_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lip_closure_tests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "test_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "measurement_value" numeric(10,2) NOT NULL,
    "notes" "text",
    "examiner_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lip_closure_tests" OWNER TO "postgres";


COMMENT ON TABLE "public"."lip_closure_tests" IS '口唇閉鎖検査記録';



COMMENT ON COLUMN "public"."lip_closure_tests"."patient_id" IS '患者ID';



COMMENT ON COLUMN "public"."lip_closure_tests"."clinic_id" IS '医院ID';



COMMENT ON COLUMN "public"."lip_closure_tests"."test_date" IS '検査実施日時';



COMMENT ON COLUMN "public"."lip_closure_tests"."measurement_value" IS '測定値';



COMMENT ON COLUMN "public"."lip_closure_tests"."notes" IS 'メモ・所見';



COMMENT ON COLUMN "public"."lip_closure_tests"."examiner_id" IS '検査実施者ID';



CREATE TABLE IF NOT EXISTS "public"."medical_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "text" NOT NULL,
    "document_type" character varying(50) NOT NULL,
    "document_subtype" character varying(50),
    "title" character varying(255) NOT NULL,
    "content" "jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "medical_record_id" "uuid",
    "auto_generated" boolean DEFAULT false,
    "template_id" "text",
    CONSTRAINT "medical_documents_document_type_check" CHECK ((("document_type")::"text" = ANY ((ARRAY['歯科疾患管理料'::character varying, '口腔機能低下症'::character varying, '口腔機能発達不全症'::character varying, '歯科衛生士実地指導'::character varying, '診療情報提供書'::character varying])::"text"[])))
);


ALTER TABLE "public"."medical_documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."medical_documents" IS '医療提供文書（歯科疾患管理料、診断書など）';



COMMENT ON COLUMN "public"."medical_documents"."document_type" IS '文書種類';



COMMENT ON COLUMN "public"."medical_documents"."document_subtype" IS '文書サブタイプ（管理計画書/管理報告書など）';



COMMENT ON COLUMN "public"."medical_documents"."content" IS '文書内容（JSONB形式）';



COMMENT ON COLUMN "public"."medical_documents"."medical_record_id" IS '関連診療記録ID';



COMMENT ON COLUMN "public"."medical_documents"."auto_generated" IS '自動生成フラグ';



COMMENT ON COLUMN "public"."medical_documents"."template_id" IS 'テンプレートID';



CREATE TABLE IF NOT EXISTS "public"."medical_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "visit_date" "date" NOT NULL,
    "visit_type" "text" NOT NULL,
    "facility_id" "uuid",
    "diseases" "jsonb" DEFAULT '[]'::"jsonb",
    "treatments" "jsonb" DEFAULT '[]'::"jsonb",
    "prescriptions" "jsonb" DEFAULT '[]'::"jsonb",
    "self_pay_items" "jsonb" DEFAULT '[]'::"jsonb",
    "total_points" integer DEFAULT 0,
    "total_insurance_amount" numeric(10,2) DEFAULT 0,
    "patient_copay_amount" numeric(10,2) DEFAULT 0,
    "self_pay_amount" numeric(10,2) DEFAULT 0,
    "subjective" "text" DEFAULT ''::"text",
    "objective" "text" DEFAULT ''::"text",
    "assessment" "text" DEFAULT ''::"text",
    "plan" "text" DEFAULT ''::"text",
    "related_document_ids" "text"[] DEFAULT '{}'::"text"[],
    "treatment_plan_id" "uuid",
    "receipt_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "version" integer DEFAULT 1,
    "snapshot_data" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "medical_records_visit_type_check" CHECK (("visit_type" = ANY (ARRAY['initial'::"text", 'regular'::"text", 'emergency'::"text", 'home_visit'::"text"])))
);


ALTER TABLE "public"."medical_records" OWNER TO "postgres";


COMMENT ON TABLE "public"."medical_records" IS '診療記録 - 電子カルテの中核テーブル';



COMMENT ON COLUMN "public"."medical_records"."diseases" IS '病名情報 JSONB配列';



COMMENT ON COLUMN "public"."medical_records"."treatments" IS '診療行為情報 JSONB配列';



COMMENT ON COLUMN "public"."medical_records"."snapshot_data" IS '診療時点の点数表バージョンスナップショット';



CREATE TABLE IF NOT EXISTS "public"."medicine_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "generic_name" "text" NOT NULL,
    "manufacturer" "text" NOT NULL,
    "unit" "text" NOT NULL,
    "price_per_unit" numeric(10,2) NOT NULL,
    "category" "text" NOT NULL,
    "prescription_required" boolean DEFAULT true,
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medicine_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."medicine_codes" IS '医薬品マスター - 厚生労働省医薬品マスター';



COMMENT ON COLUMN "public"."medicine_codes"."price_per_unit" IS '薬価 (単位あたり価格)';



CREATE TABLE IF NOT EXISTS "public"."memo_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "content" "text" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."memo_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_trainings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "menu_id" "uuid" NOT NULL,
    "training_id" "uuid" NOT NULL,
    "sort_order" integer NOT NULL,
    "action_seconds" integer NOT NULL,
    "rest_seconds" integer NOT NULL,
    "sets" integer NOT NULL,
    "auto_progress" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_trainings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_failure_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "notification_schedule_id" "uuid",
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "attempted_channel" character varying(20),
    "failure_reason" "text",
    "failure_type" character varying(50),
    "is_retryable" boolean DEFAULT true,
    "retry_with_fallback" boolean DEFAULT false,
    "failed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_failure_logs_attempted_channel_check" CHECK ((("attempted_channel")::"text" = ANY ((ARRAY['line'::character varying, 'email'::character varying, 'sms'::character varying])::"text"[]))),
    CONSTRAINT "notification_failure_logs_failure_type_check" CHECK ((("failure_type")::"text" = ANY ((ARRAY['temporary'::character varying, 'permanent'::character varying])::"text"[])))
);


ALTER TABLE "public"."notification_failure_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "message_template" "text" NOT NULL,
    "default_timing_value" integer,
    "default_timing_unit" character varying(20),
    "default_web_booking_menu_ids" "uuid"[],
    "default_staff_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "line_message" "text",
    "email_subject" character varying(255),
    "email_message" "text",
    "sms_message" character varying(160),
    "auto_send_enabled" boolean DEFAULT false,
    "auto_send_trigger" character varying(50) DEFAULT 'manual'::character varying,
    "auto_send_timing_value" integer,
    "auto_send_timing_unit" character varying(20),
    "template_id" "uuid",
    "is_system_template" boolean DEFAULT false,
    "system_template_id" "uuid",
    CONSTRAINT "notification_templates_default_timing_unit_check" CHECK ((("default_timing_unit")::"text" = ANY ((ARRAY['days'::character varying, 'weeks'::character varying, 'months'::character varying])::"text"[]))),
    CONSTRAINT "notification_templates_notification_type_check" CHECK ((("notification_type")::"text" = ANY ((ARRAY['periodic_checkup'::character varying, 'treatment_reminder'::character varying, 'appointment_reminder'::character varying, 'appointment_change'::character varying, 'custom'::character varying])::"text"[])))
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


COMMENT ON COLUMN "public"."notification_templates"."message_template" IS '汎用メッセージテンプレート（後方互換性用）';



COMMENT ON COLUMN "public"."notification_templates"."line_message" IS 'LINE用メッセージ（最大5000文字）';



COMMENT ON COLUMN "public"."notification_templates"."email_subject" IS 'メール件名';



COMMENT ON COLUMN "public"."notification_templates"."email_message" IS 'メール本文';



COMMENT ON COLUMN "public"."notification_templates"."sms_message" IS 'SMS用メッセージ（70文字推奨、160文字まで）';



COMMENT ON COLUMN "public"."notification_templates"."auto_send_enabled" IS '自動送信が有効かどうか';



COMMENT ON COLUMN "public"."notification_templates"."auto_send_trigger" IS '送信トリガー: appointment_created, appointment_date, line_linked, manual';



COMMENT ON COLUMN "public"."notification_templates"."auto_send_timing_value" IS '送信タイミングの数値（例: 3日前の「3」）';



COMMENT ON COLUMN "public"."notification_templates"."auto_send_timing_unit" IS '送信タイミングの単位: days_before, days_after';



COMMENT ON COLUMN "public"."notification_templates"."is_system_template" IS 'システムテンプレートから作成されたかどうか';



COMMENT ON COLUMN "public"."notification_templates"."system_template_id" IS '元となったシステムテンプレートのID';



CREATE TABLE IF NOT EXISTS "public"."operation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "operator_id" "uuid",
    "action_type" character varying(50) NOT NULL,
    "target_table" character varying(100) NOT NULL,
    "target_record_id" "uuid" NOT NULL,
    "before_data" "jsonb",
    "after_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."operation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oral_function_assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "assessment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "assessment_type" "text" DEFAULT '離乳完了後'::"text" NOT NULL,
    "c1_result" boolean,
    "c1_source" "text",
    "c1_notes" "text",
    "c2_result" boolean,
    "c2_source" "text",
    "c2_notes" "text",
    "c3_result" boolean,
    "c3_source" "text",
    "c3_notes" "text",
    "c4_result" boolean,
    "c4_source" "text",
    "c4_notes" "text",
    "c5_result" boolean,
    "c5_source" "text",
    "c5_notes" "text",
    "c6_result" boolean,
    "c6_source" "text",
    "c6_notes" "text",
    "c7_result" boolean,
    "c7_source" "text",
    "c7_notes" "text",
    "c8_result" boolean,
    "c8_source" "text",
    "c8_notes" "text",
    "c9_result" boolean,
    "c9_source" "text",
    "c9_notes" "text",
    "c10_result" boolean,
    "c10_source" "text",
    "c10_notes" "text",
    "c11_result" boolean,
    "c11_source" "text",
    "c11_notes" "text",
    "c12_result" boolean,
    "c12_source" "text",
    "c12_notes" "text",
    "c13_result" boolean,
    "c13_source" "text",
    "c13_notes" "text",
    "c14_result" boolean,
    "c14_source" "text",
    "c14_notes" "text",
    "c15_result" boolean,
    "c15_source" "text",
    "c15_notes" "text",
    "c16_result" boolean,
    "c16_source" "text",
    "c16_notes" "text",
    "c17_result" boolean,
    "c17_source" "text",
    "c17_notes" "text",
    "questionnaire_response_id" "uuid",
    "evaluated_by_staff_id" "uuid",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."oral_function_assessments" OWNER TO "postgres";


COMMENT ON TABLE "public"."oral_function_assessments" IS '口腔機能発達不全症評価結果を保存';



CREATE TABLE IF NOT EXISTS "public"."patient_acquisition_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "acquisition_channel" character varying(100) NOT NULL,
    "utm_source" character varying(100),
    "utm_medium" character varying(100),
    "utm_campaign" character varying(100),
    "referral_patient_id" "uuid",
    "acquisition_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_acquisition_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_acquisition_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "utm_content" "text",
    "utm_term" "text",
    "device_type" "text",
    "os" "text",
    "browser" "text",
    "questionnaire_source" "text",
    "questionnaire_detail" "text",
    "final_source" "text" NOT NULL,
    "tracking_method" "text" NOT NULL,
    "first_visit_at" timestamp with time zone,
    "booking_completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "clicked_tab_id" "text",
    "clicked_tab_label" "text"
);


ALTER TABLE "public"."patient_acquisition_sources" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_acquisition_sources" IS '患者獲得経路テーブル - UTMパラメータとアンケート回答を統合管理';



COMMENT ON COLUMN "public"."patient_acquisition_sources"."clicked_tab_id" IS '最初にクリックされたタブのID';



COMMENT ON COLUMN "public"."patient_acquisition_sources"."clicked_tab_label" IS '最初にクリックされたタブのラベル';



CREATE TABLE IF NOT EXISTS "public"."patient_icons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "text" NOT NULL,
    "icon_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."patient_icons" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_icons" IS '患者の特記事項アイコン';



COMMENT ON COLUMN "public"."patient_icons"."patient_id" IS '患者ID';



COMMENT ON COLUMN "public"."patient_icons"."clinic_id" IS 'クリニックID';



COMMENT ON COLUMN "public"."patient_icons"."icon_ids" IS 'アイコンIDの配列';



CREATE TABLE IF NOT EXISTS "public"."patient_issue_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "issue_code" character varying(50) NOT NULL,
    "identified_at" timestamp with time zone DEFAULT "now"(),
    "identified_by" "uuid",
    "severity" integer,
    "notes" "text",
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_issue_records_severity_check" CHECK ((("severity" >= 1) AND ("severity" <= 3)))
);


ALTER TABLE "public"."patient_issue_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_issues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "category" character varying(100),
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_issues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_note_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "icon" character varying(10),
    "color" character varying(7),
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_note_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "note_type_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_notification_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "notification_schedule_id" "uuid",
    "sent_at" timestamp with time zone NOT NULL,
    "send_channel" character varying(20),
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "booked_at" timestamp with time zone,
    "hour_of_day" integer,
    "day_of_week" integer,
    "response_rate" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_notification_analytics_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "patient_notification_analytics_hour_of_day_check" CHECK ((("hour_of_day" >= 0) AND ("hour_of_day" <= 23))),
    CONSTRAINT "patient_notification_analytics_send_channel_check" CHECK ((("send_channel")::"text" = ANY ((ARRAY['line'::character varying, 'email'::character varying, 'sms'::character varying])::"text"[])))
);


ALTER TABLE "public"."patient_notification_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_notification_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "appointment_reminder" boolean DEFAULT true,
    "periodic_checkup" boolean DEFAULT true,
    "treatment_reminder" boolean DEFAULT true,
    "appointment_change" boolean DEFAULT true,
    "custom" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_notification_preferences" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_notification_preferences" IS '患者ごとの通知受信設定';



COMMENT ON COLUMN "public"."patient_notification_preferences"."appointment_reminder" IS '予約リマインド通知を受信するか';



COMMENT ON COLUMN "public"."patient_notification_preferences"."periodic_checkup" IS '定期検診通知を受信するか';



COMMENT ON COLUMN "public"."patient_notification_preferences"."treatment_reminder" IS '治療リマインド通知を受信するか';



COMMENT ON COLUMN "public"."patient_notification_preferences"."appointment_change" IS '予約変更通知を受信するか';



COMMENT ON COLUMN "public"."patient_notification_preferences"."custom" IS 'その他のカスタム通知を受信するか';



CREATE TABLE IF NOT EXISTS "public"."patient_notification_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "template_id" "uuid",
    "notification_type" character varying(50) NOT NULL,
    "treatment_menu_id" "uuid",
    "treatment_name" character varying(255),
    "message" "text" NOT NULL,
    "send_datetime" timestamp with time zone NOT NULL,
    "send_channel" character varying(20) NOT NULL,
    "web_booking_enabled" boolean DEFAULT true,
    "web_booking_menu_ids" "uuid"[],
    "web_booking_staff_id" "uuid",
    "web_booking_token" character varying(255),
    "web_booking_token_expires_at" timestamp with time zone,
    "linked_appointment_id" "uuid",
    "status" character varying(50) DEFAULT 'scheduled'::character varying,
    "sent_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "failure_reason" "text",
    "retry_count" integer DEFAULT 0,
    "is_auto_reminder" boolean DEFAULT false,
    "auto_reminder_sequence" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "patient_notification_schedules_notification_type_check" CHECK ((("notification_type")::"text" = ANY ((ARRAY['periodic_checkup'::character varying, 'treatment_reminder'::character varying, 'appointment_reminder'::character varying, 'appointment_change'::character varying, 'custom'::character varying])::"text"[]))),
    CONSTRAINT "patient_notification_schedules_send_channel_check" CHECK ((("send_channel")::"text" = ANY ((ARRAY['line'::character varying, 'email'::character varying, 'sms'::character varying])::"text"[]))),
    CONSTRAINT "patient_notification_schedules_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['scheduled'::character varying, 'sent'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."patient_notification_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_qr_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "qr_token" "text" NOT NULL,
    "expires_at" timestamp with time zone,
    "last_used_at" timestamp with time zone,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_qr_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."patient_qr_codes" IS '患者ごとのQRコード情報テーブル';



COMMENT ON COLUMN "public"."patient_qr_codes"."qr_token" IS 'QRコード用のユニークトークン';



CREATE TABLE IF NOT EXISTS "public"."patient_web_booking_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "web_booking_enabled" boolean DEFAULT true NOT NULL,
    "web_cancel_enabled" boolean DEFAULT true NOT NULL,
    "web_reschedule_enabled" boolean DEFAULT true NOT NULL,
    "web_cancel_limit" integer,
    "cancel_deadline_hours" integer,
    "max_concurrent_bookings" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."patient_web_booking_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_number" integer,
    "global_uuid" "uuid" DEFAULT "gen_random_uuid"(),
    "last_name" character varying(50) NOT NULL,
    "first_name" character varying(50) NOT NULL,
    "last_name_kana" character varying(50),
    "first_name_kana" character varying(50),
    "birth_date" "date",
    "gender" "public"."patient_gender",
    "phone" character varying(20),
    "email" character varying(255),
    "postal_code" character varying(10),
    "prefecture" character varying(50),
    "city" character varying(100),
    "address_line" "text",
    "allergies" "text",
    "medical_history" "text",
    "primary_doctor_id" "uuid",
    "primary_hygienist_id" "uuid",
    "insurance_data" "bytea",
    "is_registered" boolean DEFAULT false,
    "family_group_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "password_hash" "text",
    "password_set" boolean DEFAULT false,
    "training_last_login_at" timestamp with time zone,
    "preferred_contact_method" character varying(20),
    "auto_reminder_enabled" boolean DEFAULT true,
    "auto_reminder_custom_intervals" "jsonb",
    "notification_preferences" "jsonb" DEFAULT '{"other": true, "periodic_checkup": true, "treatment_reminder": true, "appointment_reminder": true}'::"jsonb",
    "legacy_patient_number" character varying(50),
    "legacy_system_name" character varying(100),
    "migrated_at" timestamp with time zone,
    "address" "text",
    "visit_reason" "text",
    "medications" "text",
    "insurance_card_image_path" "text",
    "insurance_verification_status" "text" DEFAULT 'unverified'::"text",
    "last_insurance_verification_date" timestamp with time zone,
    "copay_rate" numeric(3,2) DEFAULT 0.30,
    CONSTRAINT "patients_insurance_verification_status_check" CHECK (("insurance_verification_status" = ANY (ARRAY['unverified'::"text", 'verified'::"text", 'expired'::"text"]))),
    CONSTRAINT "patients_preferred_contact_method_check" CHECK ((("preferred_contact_method")::"text" = ANY ((ARRAY['line'::character varying, 'email'::character varying, 'sms'::character varying])::"text"[])))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."patients"."patient_number" IS '患者番号（本登録時のみ設定、仮登録時はNULL）';



COMMENT ON COLUMN "public"."patients"."preferred_contact_method" IS '希望連絡方法: line, email, sms';



COMMENT ON COLUMN "public"."patients"."legacy_patient_number" IS '旧システムの患者番号（移行時に保存、文字列対応）例: P-1001, K-0001など';



COMMENT ON COLUMN "public"."patients"."legacy_system_name" IS '移行元システム名（例: デントネット、Apotool、デンタルX）';



COMMENT ON COLUMN "public"."patients"."migrated_at" IS 'データ移行実行日時';



COMMENT ON COLUMN "public"."patients"."address" IS '住所（統合フィールド）: postal_code + prefecture + city + address_line の統合版';



COMMENT ON COLUMN "public"."patients"."visit_reason" IS '来院理由（初診時の主訴など）';



COMMENT ON COLUMN "public"."patients"."medications" IS '服用中の薬';



COMMENT ON COLUMN "public"."patients"."insurance_card_image_path" IS '保険証画像パス (Supabase Storage)';



COMMENT ON COLUMN "public"."patients"."insurance_verification_status" IS 'オンライン資格確認ステータス';



COMMENT ON COLUMN "public"."patients"."copay_rate" IS '患者負担割合 (0.30 = 30%)';



CREATE TABLE IF NOT EXISTS "public"."periodontal_examinations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "examination_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "examiner_id" "uuid",
    "measurement_type" character varying(10) DEFAULT '6point'::character varying NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."periodontal_examinations" OWNER TO "postgres";


COMMENT ON TABLE "public"."periodontal_examinations" IS '歯周検査記録';



COMMENT ON COLUMN "public"."periodontal_examinations"."patient_id" IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';



COMMENT ON COLUMN "public"."periodontal_examinations"."measurement_type" IS '測定方式: 6point(6点法), 4point(4点法), 1point(1点法)';



CREATE TABLE IF NOT EXISTS "public"."periodontal_tooth_data" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "examination_id" "uuid" NOT NULL,
    "tooth_number" integer NOT NULL,
    "is_missing" boolean DEFAULT false,
    "mobility" integer,
    "ppd_mb" integer,
    "ppd_b" integer,
    "ppd_db" integer,
    "ppd_ml" integer,
    "ppd_l" integer,
    "ppd_dl" integer,
    "bop_mb" boolean DEFAULT false,
    "bop_b" boolean DEFAULT false,
    "bop_db" boolean DEFAULT false,
    "bop_ml" boolean DEFAULT false,
    "bop_l" boolean DEFAULT false,
    "bop_dl" boolean DEFAULT false,
    "pus_mb" boolean DEFAULT false,
    "pus_b" boolean DEFAULT false,
    "pus_db" boolean DEFAULT false,
    "pus_ml" boolean DEFAULT false,
    "pus_l" boolean DEFAULT false,
    "pus_dl" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plaque_top" boolean DEFAULT false,
    "plaque_right" boolean DEFAULT false,
    "plaque_bottom" boolean DEFAULT false,
    "plaque_left" boolean DEFAULT false,
    CONSTRAINT "periodontal_tooth_data_mobility_check" CHECK ((("mobility" >= 0) AND ("mobility" <= 3)))
);


ALTER TABLE "public"."periodontal_tooth_data" OWNER TO "postgres";


COMMENT ON TABLE "public"."periodontal_tooth_data" IS '歯周検査の歯ごとのデータ';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."tooth_number" IS 'FDI歯番号: 11-18(右上), 21-28(左上), 31-38(左下), 41-48(右下)';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_mb" IS 'ポケット深さ 近心頬側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_b" IS 'ポケット深さ 頬側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_db" IS 'ポケット深さ 遠心頬側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_ml" IS 'ポケット深さ 近心舌側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_l" IS 'ポケット深さ 舌側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."ppd_dl" IS 'ポケット深さ 遠心舌側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."bop_mb" IS '出血 近心頬側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."pus_mb" IS '排膿 近心頬側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."plaque_top" IS 'プラーク 上部';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."plaque_right" IS 'プラーク 右側';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."plaque_bottom" IS 'プラーク 下部';



COMMENT ON COLUMN "public"."periodontal_tooth_data"."plaque_left" IS 'プラーク 左側';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaire_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "section_name" character varying(100) NOT NULL,
    "question_text" "text" NOT NULL,
    "question_type" character varying(50) NOT NULL,
    "options" "jsonb",
    "is_required" boolean DEFAULT true,
    "conditional_logic" "jsonb",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "linked_field" "text",
    "placeholder" "text",
    "is_hidden" boolean DEFAULT false
);


ALTER TABLE "public"."questionnaire_questions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."questionnaire_questions"."question_text" IS '質問文 - 来院理由質問も含む';



COMMENT ON COLUMN "public"."questionnaire_questions"."options" IS '選択肢（JSON配列） - 来院理由の選択肢も含む';



COMMENT ON COLUMN "public"."questionnaire_questions"."linked_field" IS '患者情報フィールドとの連携設定（例: last_name, email, allergies）';



COMMENT ON COLUMN "public"."questionnaire_questions"."is_hidden" IS '質問を問診票で非表示にするかどうか';



CREATE TABLE IF NOT EXISTS "public"."questionnaire_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "questionnaire_id" "uuid" NOT NULL,
    "patient_id" "text",
    "appointment_id" "uuid",
    "response_data" "jsonb" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."questionnaire_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questionnaires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "template_id" "uuid"
);


ALTER TABLE "public"."questionnaires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."receipts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "year_month" "text" NOT NULL,
    "medical_record_ids" "text"[] DEFAULT '{}'::"text"[],
    "total_points" integer DEFAULT 0,
    "total_amount" numeric(10,2) DEFAULT 0,
    "insurance_amount" numeric(10,2) DEFAULT 0,
    "patient_amount" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "validation_errors" "jsonb" DEFAULT '[]'::"jsonb",
    "submitted_at" timestamp with time zone,
    "submission_file_path" "text",
    "receipt_number" "text",
    "audit_result" "jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "receipts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'validated'::"text", 'submitted'::"text", 'approved'::"text", 'rejected'::"text", 'resubmitted'::"text"])))
);


ALTER TABLE "public"."receipts" OWNER TO "postgres";


COMMENT ON TABLE "public"."receipts" IS 'レセプト (診療報酬明細書)';



COMMENT ON COLUMN "public"."receipts"."year_month" IS '診療年月 (YYYY-MM形式)';



COMMENT ON COLUMN "public"."receipts"."validation_errors" IS '検証エラー配列';



CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "appointment_id" "uuid",
    "patient_id" "uuid" NOT NULL,
    "staff_id" "uuid",
    "sale_date" "date" NOT NULL,
    "amount" integer NOT NULL,
    "category" character varying(50) NOT NULL,
    "treatment_menu_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "receipt_number" character varying(50),
    "treatment_date" "date",
    "insurance_type" character varying(50),
    "insurance_points" integer,
    "insurance_amount" integer,
    "patient_copay" integer,
    "self_pay_amount" integer,
    "total_amount" integer,
    "payment_method" character varying(50),
    "treatment_codes" "text"[],
    "treatment_details" "jsonb",
    "notes" "text",
    "external_system_id" character varying(100),
    "external_system_name" character varying(100),
    "imported_at" timestamp with time zone,
    "import_file_name" character varying(255),
    CONSTRAINT "sales_category_check" CHECK ((("category")::"text" = ANY ((ARRAY['insurance'::character varying, 'self_pay'::character varying])::"text"[])))
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sales"."receipt_number" IS 'レセプト番号・会計伝票番号';



COMMENT ON COLUMN "public"."sales"."treatment_date" IS '実際の診療日（会計日と異なる場合あり）';



COMMENT ON COLUMN "public"."sales"."insurance_type" IS '保険種別（社保・国保・後期高齢・自費等）';



COMMENT ON COLUMN "public"."sales"."insurance_points" IS '保険診療点数';



COMMENT ON COLUMN "public"."sales"."insurance_amount" IS '保険請求額（総額）';



COMMENT ON COLUMN "public"."sales"."patient_copay" IS '患者自己負担額（保険診療分）';



COMMENT ON COLUMN "public"."sales"."self_pay_amount" IS '自費診療額';



COMMENT ON COLUMN "public"."sales"."total_amount" IS '合計金額（患者負担額＋自費診療額）';



COMMENT ON COLUMN "public"."sales"."payment_method" IS '支払方法（現金・クレジットカード・QR決済・未収等）';



COMMENT ON COLUMN "public"."sales"."treatment_codes" IS '診療行為コードの配列（レセプト電算コード等）';



COMMENT ON COLUMN "public"."sales"."treatment_details" IS '診療内容の詳細情報（JSON形式で柔軟に格納）';



COMMENT ON COLUMN "public"."sales"."external_system_id" IS '外部電子カルテシステムの売上ID';



COMMENT ON COLUMN "public"."sales"."external_system_name" IS '外部システム名（Dental X、デンタルマップ、アポツール等）';



CREATE TABLE IF NOT EXISTS "public"."sales_import_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "import_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" "text",
    "total_records" integer DEFAULT 0 NOT NULL,
    "success_records" integer DEFAULT 0 NOT NULL,
    "failed_records" integer DEFAULT 0 NOT NULL,
    "error_details" "jsonb",
    "imported_by" "uuid",
    "status" character varying(50) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sales_import_history_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."sales_import_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_import_history" IS '売上データのCSVインポート履歴';



CREATE TABLE IF NOT EXISTS "public"."self_pay_treatments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "price" numeric(10,2) NOT NULL,
    "tax_rate" numeric(3,2) DEFAULT 0.10,
    "category" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."self_pay_treatments" OWNER TO "postgres";


COMMENT ON TABLE "public"."self_pay_treatments" IS '自費診療マスター - クリニック独自の自費診療料金';



COMMENT ON COLUMN "public"."self_pay_treatments"."tax_rate" IS '消費税率 (0.10 = 10%)';



CREATE TABLE IF NOT EXISTS "public"."shift_patterns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "abbreviation" character varying(10) NOT NULL,
    "name" character varying(100) NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "break_start" time without time zone,
    "break_end" time without time zone,
    "memo" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shift_patterns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "break_start_time" time without time zone,
    "break_end_time" time without time zone,
    "pattern_name" character varying(50),
    "is_absent" boolean DEFAULT false,
    "substitute_for_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "position_id" "uuid",
    "name" character varying(100) NOT NULL,
    "name_kana" character varying(100),
    "email" character varying(255),
    "phone" character varying(20),
    "employee_number" character varying(50),
    "role" "public"."staff_role" DEFAULT 'staff'::"public"."staff_role",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_evaluation_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "evaluation_period_start" "date" NOT NULL,
    "evaluation_period_end" "date" NOT NULL,
    "metrics_data" "jsonb" NOT NULL,
    "total_score" numeric(10,2),
    "bonus_amount" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_evaluation_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_evaluation_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "metric_name" character varying(100) NOT NULL,
    "metric_type" character varying(50) NOT NULL,
    "weight_percentage" integer DEFAULT 0 NOT NULL,
    "target_value" numeric(10,2),
    "position_id" "uuid",
    "evaluation_period" character varying(20) DEFAULT 'monthly'::character varying,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_evaluation_settings_evaluation_period_check" CHECK ((("evaluation_period")::"text" = ANY ((ARRAY['weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::"text"[]))),
    CONSTRAINT "staff_evaluation_settings_metric_type_check" CHECK ((("metric_type")::"text" = ANY ((ARRAY['sales_per_hour'::character varying, 'recall_rate'::character varying, 'self_pay_rate'::character varying, 'cancellation_rate'::character varying, 'satisfaction'::character varying, 'patient_count'::character varying])::"text"[]))),
    CONSTRAINT "staff_evaluation_settings_weight_percentage_check" CHECK ((("weight_percentage" >= 0) AND ("weight_percentage" <= 100)))
);


ALTER TABLE "public"."staff_evaluation_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "template_id" "uuid"
);


ALTER TABLE "public"."staff_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "shift_pattern_id" "uuid",
    "is_holiday" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_unit_priorities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "priority_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."staff_unit_priorities" OWNER TO "postgres";


COMMENT ON TABLE "public"."staff_unit_priorities" IS 'スタッフのユニット優先順位を管理するテーブル';



COMMENT ON COLUMN "public"."staff_unit_priorities"."id" IS '優先順位ID';



COMMENT ON COLUMN "public"."staff_unit_priorities"."clinic_id" IS 'クリニックID';



COMMENT ON COLUMN "public"."staff_unit_priorities"."staff_id" IS 'スタッフID';



COMMENT ON COLUMN "public"."staff_unit_priorities"."unit_id" IS 'ユニットID';



COMMENT ON COLUMN "public"."staff_unit_priorities"."priority_order" IS '優先順位（数字が小さいほど優先度が高い）';



COMMENT ON COLUMN "public"."staff_unit_priorities"."is_active" IS '有効フラグ';



COMMENT ON COLUMN "public"."staff_unit_priorities"."created_at" IS '作成日時';



COMMENT ON COLUMN "public"."staff_unit_priorities"."updated_at" IS '更新日時';



CREATE TABLE IF NOT EXISTS "public"."subkarte_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_path" character varying(500) NOT NULL,
    "file_size" integer NOT NULL,
    "file_type" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subkarte_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subkarte_audio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "audio_file_path" character varying(500) NOT NULL,
    "transcription" "text",
    "duration_seconds" integer,
    "file_size" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '01:00:00'::interval)
);


ALTER TABLE "public"."subkarte_audio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subkarte_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "entry_type" character varying(20) NOT NULL,
    "content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subkarte_entries_entry_type_check" CHECK ((("entry_type")::"text" = ANY ((ARRAY['text'::character varying, 'handwriting'::character varying, 'audio'::character varying, 'file'::character varying, 'template'::character varying])::"text"[])))
);


ALTER TABLE "public"."subkarte_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subkarte_handwriting" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "entry_id" "uuid" NOT NULL,
    "canvas_data" "text" NOT NULL,
    "image_data" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subkarte_handwriting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subkarte_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "category" character varying(100),
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subkarte_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_cancel_reasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_cancel_reasons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "notification_type" character varying(50) NOT NULL,
    "message_template" "text",
    "line_message" "text",
    "email_subject" "text",
    "email_message" "text",
    "sms_message" "text",
    "default_timing_value" integer,
    "default_timing_unit" character varying(20),
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_questionnaire_template_questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "section_name" "text",
    "question_text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "is_required" boolean DEFAULT false,
    "conditional_logic" "jsonb",
    "sort_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "linked_field" "text",
    "placeholder" "text"
);


ALTER TABLE "public"."system_questionnaire_template_questions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."system_questionnaire_template_questions"."linked_field" IS '患者情報フィールドとの連携設定（例: last_name, email, allergies）';



CREATE TABLE IF NOT EXISTS "public"."system_questionnaire_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_questionnaire_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_staff_positions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_staff_positions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_trainings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "training_id" "uuid" NOT NULL,
    "sort_order" integer NOT NULL,
    "action_seconds" integer NOT NULL,
    "rest_seconds" integer NOT NULL,
    "sets" integer NOT NULL,
    "auto_progress" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."template_trainings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "template_name" character varying(255) NOT NULL,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracking_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "gtm_container_id" "text",
    "gtm_enabled" boolean DEFAULT false,
    "ga4_measurement_id" "text",
    "ga4_enabled" boolean DEFAULT false,
    "google_ads_conversion_id" "text",
    "google_ads_conversion_label" "text",
    "google_ads_enabled" boolean DEFAULT false,
    "meta_pixel_id" "text",
    "meta_pixel_enabled" boolean DEFAULT false,
    "yahoo_ads_account_id" "text",
    "yahoo_ads_enabled" boolean DEFAULT false,
    "line_tag_id" "text",
    "line_tag_enabled" boolean DEFAULT false,
    "custom_tags" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "clarity_project_id" "text",
    "clarity_enabled" boolean DEFAULT false
);


ALTER TABLE "public"."tracking_tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tracking_tags" IS 'トラッキングタグ設定 - GTM, GA4, Google Ads, META Pixelなどの設定を管理';



COMMENT ON COLUMN "public"."tracking_tags"."gtm_container_id" IS 'Google Tag ManagerのコンテナID (GTM-XXXXXXX)';



COMMENT ON COLUMN "public"."tracking_tags"."ga4_measurement_id" IS 'Google Analytics 4の測定ID (G-XXXXXXXXXX)';



COMMENT ON COLUMN "public"."tracking_tags"."google_ads_conversion_id" IS 'Google AdsのコンバージョンID (AW-XXXXXXXXX)';



COMMENT ON COLUMN "public"."tracking_tags"."google_ads_conversion_label" IS 'Google Adsのコンバージョンラベル';



COMMENT ON COLUMN "public"."tracking_tags"."meta_pixel_id" IS 'META Pixel ID (16桁の数字)';



COMMENT ON COLUMN "public"."tracking_tags"."custom_tags" IS 'カスタムタグのJSON配列';



COMMENT ON COLUMN "public"."tracking_tags"."clarity_project_id" IS 'Microsoft Clarity Project ID (ヒートマップ・セッションレコーディング)';



COMMENT ON COLUMN "public"."tracking_tags"."clarity_enabled" IS 'Microsoft Clarityが有効かどうか';



CREATE TABLE IF NOT EXISTS "public"."training_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "menu_id" "uuid",
    "training_id" "uuid" NOT NULL,
    "menu_training_id" "uuid",
    "evaluated_at" timestamp with time zone DEFAULT "now"(),
    "evaluator_id" "uuid",
    "evaluation_level" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "training_evaluations_evaluation_level_check" CHECK ((("evaluation_level" >= 1) AND ("evaluation_level" <= 3)))
);


ALTER TABLE "public"."training_evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "menu_name" character varying(255),
    "prescribed_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."training_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "training_id" "uuid" NOT NULL,
    "menu_id" "uuid" NOT NULL,
    "performed_at" timestamp with time zone DEFAULT "now"(),
    "completed" boolean DEFAULT false,
    "interrupted" boolean DEFAULT false,
    "time_of_day" character varying(10),
    "actual_duration_seconds" integer,
    "device_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."training_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trainings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid",
    "training_name" character varying(255) NOT NULL,
    "description" "text",
    "category" character varying(100),
    "animation_storage_path" "text",
    "mirror_display" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "default_action_seconds" integer DEFAULT 10,
    "default_rest_seconds" integer DEFAULT 5,
    "default_sets" integer DEFAULT 1,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "instructions" "text"[],
    "precautions" "text"[],
    "evaluation_level_1_label" character varying(100) DEFAULT 'できなかった'::character varying,
    "evaluation_level_1_criteria" "text",
    "evaluation_level_2_label" character varying(100) DEFAULT 'まあまあできた'::character varying,
    "evaluation_level_2_criteria" "text",
    "evaluation_level_3_label" character varying(100) DEFAULT 'できた'::character varying,
    "evaluation_level_3_criteria" "text"
);


ALTER TABLE "public"."trainings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."trainings"."description" IS '説明文（旧形式・後方互換性のため残存）';



COMMENT ON COLUMN "public"."trainings"."instructions" IS '練習手順（箇条書き配列）';



COMMENT ON COLUMN "public"."trainings"."precautions" IS '注意事項（箇条書き配列）';



CREATE TABLE IF NOT EXISTS "public"."treatment_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "inclusion_rules" "text"[] DEFAULT '{}'::"text"[],
    "exclusion_rules" "jsonb" DEFAULT '{"same_day": [], "same_site": [], "same_week": [], "same_month": [], "simultaneous": []}'::"jsonb",
    "frequency_limits" "jsonb" DEFAULT '[]'::"jsonb",
    "effective_from" "date" NOT NULL,
    "effective_to" "date",
    "requires_documents" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."treatment_codes" IS '診療行為マスター - 厚生労働省診療報酬点数表データ';



COMMENT ON COLUMN "public"."treatment_codes"."code" IS '診療行為コード (9桁) + 加算コード (5桁)';



COMMENT ON COLUMN "public"."treatment_codes"."inclusion_rules" IS '包括される処置コード配列';



COMMENT ON COLUMN "public"."treatment_codes"."exclusion_rules" IS '背反ルール: {same_day, same_month, simultaneous, same_site, same_week}';



COMMENT ON COLUMN "public"."treatment_codes"."frequency_limits" IS '算定回数制限: [{"period":"day","max_count":1}]';



COMMENT ON COLUMN "public"."treatment_codes"."requires_documents" IS '必須医療文書コード (例: ["歯科疾患管理料"])';



COMMENT ON COLUMN "public"."treatment_codes"."metadata" IS 'メタデータ: pdf_reference, notes, section, sub_category, material_type等を格納';



CREATE TABLE IF NOT EXISTS "public"."treatment_menus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "level" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "standard_duration" integer,
    "color" character varying(7),
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "web_booking_enabled" boolean DEFAULT false,
    "web_booking_staff_ids" "uuid"[],
    "web_booking_duration" integer,
    "web_booking_new_patient" boolean DEFAULT true,
    "web_booking_returning" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treatment_menus_level_check" CHECK (("level" = ANY (ARRAY[1, 2, 3])))
);


ALTER TABLE "public"."treatment_menus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."treatment_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "planned_treatments" "jsonb" DEFAULT '[]'::"jsonb",
    "estimated_total_points" integer DEFAULT 0,
    "estimated_insurance_amount" numeric(10,2) DEFAULT 0,
    "estimated_patient_amount" numeric(10,2) DEFAULT 0,
    "estimated_self_pay_amount" numeric(10,2) DEFAULT 0,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "treatment_plans_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."treatment_plans" OWNER TO "postgres";


COMMENT ON TABLE "public"."treatment_plans" IS '治療計画';



CREATE TABLE IF NOT EXISTS "public"."treatment_required_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "treatment_code" "text" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "field_options" "jsonb",
    "is_required" boolean DEFAULT true,
    "placeholder" "text",
    "validation_rule" "text",
    "help_text" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_required_fields" OWNER TO "postgres";


COMMENT ON TABLE "public"."treatment_required_fields" IS '処置実施時の必須記載項目（厚生局の点数表に基づく）';



CREATE TABLE IF NOT EXISTS "public"."treatment_set_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "set_id" "uuid" NOT NULL,
    "treatment_code" "text" NOT NULL,
    "is_required" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "default_selected" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_set_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."treatment_set_items" IS '処置セットの構成要素（どの処置がセットに含まれるか）';



CREATE TABLE IF NOT EXISTS "public"."treatment_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."treatment_sets" OWNER TO "postgres";


COMMENT ON TABLE "public"."treatment_sets" IS '処置セットマスタ（抜髄セット、充填セットなど）';



CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visual_examinations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "patient_id" "text" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "examination_date" timestamp without time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."visual_examinations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."visual_examinations"."patient_id" IS '患者ID (TEXT型: patient_TIMESTAMP_RANDOM形式)';



CREATE TABLE IF NOT EXISTS "public"."visual_tooth_data" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "examination_id" "uuid" NOT NULL,
    "tooth_number" integer NOT NULL,
    "status" character varying(50) DEFAULT 'healthy'::character varying NOT NULL,
    "caries_level" character varying(10),
    "restoration_type" character varying(20),
    "material_type" character varying(20),
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    CONSTRAINT "valid_tooth_number" CHECK (("tooth_number" = ANY (ARRAY[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28, 48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38, 55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75])))
);


ALTER TABLE "public"."visual_tooth_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_booking_funnel_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "step_name" "text" NOT NULL,
    "step_number" integer NOT NULL,
    "event_type" "text" NOT NULL,
    "event_timestamp" timestamp with time zone DEFAULT "now"(),
    "utm_source" "text",
    "utm_medium" "text",
    "utm_campaign" "text",
    "device_type" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tab_id" "text",
    "tab_label" "text",
    "tab_position" "text",
    "referrer_url" "text"
);


ALTER TABLE "public"."web_booking_funnel_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."web_booking_funnel_events" IS 'Web予約ファネルイベントテーブル - 予約プロセスの各ステップを記録';



COMMENT ON COLUMN "public"."web_booking_funnel_events"."tab_id" IS 'クリックされたタブのID';



COMMENT ON COLUMN "public"."web_booking_funnel_events"."tab_label" IS 'クリックされたタブのラベル';



COMMENT ON COLUMN "public"."web_booking_funnel_events"."referrer_url" IS '参照元URL';



CREATE TABLE IF NOT EXISTS "public"."web_booking_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinic_id" "uuid" NOT NULL,
    "patient_id" "text" NOT NULL,
    "treatment_menu_id" "uuid",
    "treatment_menu_level2_id" "uuid",
    "treatment_menu_level3_id" "uuid",
    "staff_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_by" "text" NOT NULL,
    "notification_schedule_id" "uuid",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_booking_tokens_created_by_check" CHECK (("created_by" = ANY (ARRAY['notification_schedule'::"text", 'manual'::"text"])))
);


ALTER TABLE "public"."web_booking_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."web_booking_tokens" IS 'Web予約用のトークン管理テーブル。通知から直接予約できるようにメニューと担当者を事前設定';



COMMENT ON COLUMN "public"."web_booking_tokens"."staff_ids" IS '担当者IDの配列。複数の担当者から選択可能';



COMMENT ON COLUMN "public"."web_booking_tokens"."token" IS 'URLパラメータに含めるトークン文字列（例: abc123xyz）';



COMMENT ON COLUMN "public"."web_booking_tokens"."created_by" IS 'トークン作成元。notification_schedule: 自動通知, manual: 手動送信';



ALTER TABLE ONLY "public"."ad_spend_records"
    ADD CONSTRAINT "ad_spend_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."advertising_costs"
    ADD CONSTRAINT "advertising_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_logs"
    ADD CONSTRAINT "appointment_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointment_staff"
    ADD CONSTRAINT "appointment_staff_appointment_id_staff_id_key" UNIQUE ("appointment_id", "staff_id");



ALTER TABLE ONLY "public"."appointment_staff"
    ADD CONSTRAINT "appointment_staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auto_reminder_rules"
    ADD CONSTRAINT "auto_reminder_rules_clinic_id_key" UNIQUE ("clinic_id");



ALTER TABLE ONLY "public"."auto_reminder_rules"
    ADD CONSTRAINT "auto_reminder_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."c_classification_question_mapping"
    ADD CONSTRAINT "c_classification_question_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cancel_reasons"
    ADD CONSTRAINT "cancel_reasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic_settings"
    ADD CONSTRAINT "clinic_settings_clinic_id_setting_key_key" UNIQUE ("clinic_id", "setting_key");



ALTER TABLE ONLY "public"."clinic_settings"
    ADD CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinic_training_customizations"
    ADD CONSTRAINT "clinic_training_customizations_clinic_id_training_id_key" UNIQUE ("clinic_id", "training_id");



ALTER TABLE ONLY "public"."clinic_training_customizations"
    ADD CONSTRAINT "clinic_training_customizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "clinics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_memos"
    ADD CONSTRAINT "daily_memos_clinic_id_date_key" UNIQUE ("clinic_id", "date");



ALTER TABLE ONLY "public"."daily_memos"
    ADD CONSTRAINT "daily_memos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_accounts"
    ADD CONSTRAINT "device_accounts_device_identifier_patient_id_key" UNIQUE ("device_identifier", "patient_id");



ALTER TABLE ONLY "public"."device_accounts"
    ADD CONSTRAINT "device_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disease_codes"
    ADD CONSTRAINT "disease_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."disease_codes"
    ADD CONSTRAINT "disease_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disease_treatment_set_mapping"
    ADD CONSTRAINT "disease_treatment_set_mapping_disease_code_set_id_key" UNIQUE ("disease_code", "set_id");



ALTER TABLE ONLY "public"."disease_treatment_set_mapping"
    ADD CONSTRAINT "disease_treatment_set_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_document_type_template_key_key" UNIQUE ("document_type", "template_key");



ALTER TABLE ONLY "public"."document_templates"
    ADD CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_issue_rules"
    ADD CONSTRAINT "evaluation_issue_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluation_issue_rules"
    ADD CONSTRAINT "evaluation_issue_rules_training_id_evaluation_level_identif_key" UNIQUE ("training_id", "evaluation_level", "identified_issue_code");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_clinic_id_code_key" UNIQUE ("clinic_id", "code");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hp_tab_click_events"
    ADD CONSTRAINT "hp_tab_click_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individual_holidays"
    ADD CONSTRAINT "individual_holidays_clinic_id_date_key" UNIQUE ("clinic_id", "date");



ALTER TABLE ONLY "public"."individual_holidays"
    ADD CONSTRAINT "individual_holidays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."issue_training_mappings"
    ADD CONSTRAINT "issue_training_mappings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."labs"
    ADD CONSTRAINT "labs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_conversation_states"
    ADD CONSTRAINT "line_conversation_states_pkey" PRIMARY KEY ("line_user_id");



ALTER TABLE ONLY "public"."line_invitation_codes"
    ADD CONSTRAINT "line_invitation_codes_invitation_code_key" UNIQUE ("invitation_code");



ALTER TABLE ONLY "public"."line_invitation_codes"
    ADD CONSTRAINT "line_invitation_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_patient_linkages"
    ADD CONSTRAINT "line_patient_linkages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_qr_tokens"
    ADD CONSTRAINT "line_qr_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_qr_tokens"
    ADD CONSTRAINT "line_qr_tokens_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."line_rich_menus"
    ADD CONSTRAINT "line_rich_menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_user_links"
    ADD CONSTRAINT "line_user_links_line_user_id_patient_id_key" UNIQUE ("line_user_id", "patient_id");



ALTER TABLE ONLY "public"."line_user_links"
    ADD CONSTRAINT "line_user_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lip_closure_tests"
    ADD CONSTRAINT "lip_closure_tests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medicine_codes"
    ADD CONSTRAINT "medicine_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."medicine_codes"
    ADD CONSTRAINT "medicine_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memo_templates"
    ADD CONSTRAINT "memo_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_trainings"
    ADD CONSTRAINT "menu_trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_failure_logs"
    ADD CONSTRAINT "notification_failure_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operation_logs"
    ADD CONSTRAINT "operation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oral_function_assessments"
    ADD CONSTRAINT "oral_function_assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_acquisition_channels"
    ADD CONSTRAINT "patient_acquisition_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_acquisition_sources"
    ADD CONSTRAINT "patient_acquisition_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_icons"
    ADD CONSTRAINT "patient_icons_patient_id_clinic_id_key" UNIQUE ("patient_id", "clinic_id");



ALTER TABLE ONLY "public"."patient_icons"
    ADD CONSTRAINT "patient_icons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_issue_records"
    ADD CONSTRAINT "patient_issue_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_issues"
    ADD CONSTRAINT "patient_issues_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."patient_issues"
    ADD CONSTRAINT "patient_issues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_note_types"
    ADD CONSTRAINT "patient_note_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notes"
    ADD CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notification_analytics"
    ADD CONSTRAINT "patient_notification_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notification_preferences"
    ADD CONSTRAINT "patient_notification_preferences_patient_id_clinic_id_key" UNIQUE ("patient_id", "clinic_id");



ALTER TABLE ONLY "public"."patient_notification_preferences"
    ADD CONSTRAINT "patient_notification_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_web_booking_token_key" UNIQUE ("web_booking_token");



ALTER TABLE ONLY "public"."patient_qr_codes"
    ADD CONSTRAINT "patient_qr_codes_patient_id_key" UNIQUE ("patient_id");



ALTER TABLE ONLY "public"."patient_qr_codes"
    ADD CONSTRAINT "patient_qr_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_qr_codes"
    ADD CONSTRAINT "patient_qr_codes_qr_token_key" UNIQUE ("qr_token");



ALTER TABLE ONLY "public"."patient_web_booking_settings"
    ADD CONSTRAINT "patient_web_booking_settings_patient_id_clinic_id_key" UNIQUE ("patient_id", "clinic_id");



ALTER TABLE ONLY "public"."patient_web_booking_settings"
    ADD CONSTRAINT "patient_web_booking_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_global_uuid_key" UNIQUE ("global_uuid");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."periodontal_examinations"
    ADD CONSTRAINT "periodontal_examinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."periodontal_tooth_data"
    ADD CONSTRAINT "periodontal_tooth_data_examination_id_tooth_number_key" UNIQUE ("examination_id", "tooth_number");



ALTER TABLE ONLY "public"."periodontal_tooth_data"
    ADD CONSTRAINT "periodontal_tooth_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."questionnaire_questions"
    ADD CONSTRAINT "questionnaire_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_clinic_id_patient_id_year_month_key" UNIQUE ("clinic_id", "patient_id", "year_month");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_import_history"
    ADD CONSTRAINT "sales_import_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."self_pay_treatments"
    ADD CONSTRAINT "self_pay_treatments_clinic_id_code_key" UNIQUE ("clinic_id", "code");



ALTER TABLE ONLY "public"."self_pay_treatments"
    ADD CONSTRAINT "self_pay_treatments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_patterns"
    ADD CONSTRAINT "shift_patterns_clinic_id_abbreviation_key" UNIQUE ("clinic_id", "abbreviation");



ALTER TABLE ONLY "public"."shift_patterns"
    ADD CONSTRAINT "shift_patterns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_clinic_id_staff_id_date_key" UNIQUE ("clinic_id", "staff_id", "date");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_evaluation_results"
    ADD CONSTRAINT "staff_evaluation_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_evaluation_settings"
    ADD CONSTRAINT "staff_evaluation_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_positions"
    ADD CONSTRAINT "staff_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_shifts"
    ADD CONSTRAINT "staff_shifts_clinic_id_staff_id_date_key" UNIQUE ("clinic_id", "staff_id", "date");



ALTER TABLE ONLY "public"."staff_shifts"
    ADD CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_unit_priorities"
    ADD CONSTRAINT "staff_unit_priorities_clinic_id_staff_id_unit_id_key" UNIQUE ("clinic_id", "staff_id", "unit_id");



ALTER TABLE ONLY "public"."staff_unit_priorities"
    ADD CONSTRAINT "staff_unit_priorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subkarte_attachments"
    ADD CONSTRAINT "subkarte_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subkarte_audio"
    ADD CONSTRAINT "subkarte_audio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subkarte_entries"
    ADD CONSTRAINT "subkarte_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subkarte_handwriting"
    ADD CONSTRAINT "subkarte_handwriting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subkarte_templates"
    ADD CONSTRAINT "subkarte_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_cancel_reasons"
    ADD CONSTRAINT "system_cancel_reasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_notification_templates"
    ADD CONSTRAINT "system_notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_questionnaire_template_questions"
    ADD CONSTRAINT "system_questionnaire_template_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_questionnaire_templates"
    ADD CONSTRAINT "system_questionnaire_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_staff_positions"
    ADD CONSTRAINT "system_staff_positions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_trainings"
    ADD CONSTRAINT "template_trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "tracking_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_menus"
    ADD CONSTRAINT "training_menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_codes"
    ADD CONSTRAINT "treatment_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."treatment_codes"
    ADD CONSTRAINT "treatment_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_menus"
    ADD CONSTRAINT "treatment_menus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_required_fields"
    ADD CONSTRAINT "treatment_required_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_required_fields"
    ADD CONSTRAINT "treatment_required_fields_treatment_code_field_name_key" UNIQUE ("treatment_code", "field_name");



ALTER TABLE ONLY "public"."treatment_set_items"
    ADD CONSTRAINT "treatment_set_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."treatment_sets"
    ADD CONSTRAINT "treatment_sets_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."treatment_sets"
    ADD CONSTRAINT "treatment_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinics"
    ADD CONSTRAINT "unique_clinic_slug" UNIQUE ("slug");



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "unique_clinic_tracking_tags" UNIQUE ("clinic_id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visual_examinations"
    ADD CONSTRAINT "visual_examinations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visual_tooth_data"
    ADD CONSTRAINT "visual_tooth_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_booking_funnel_events"
    ADD CONSTRAINT "web_booking_funnel_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_token_key" UNIQUE ("token");



CREATE INDEX "idx_ad_spend_clinic_id" ON "public"."ad_spend_records" USING "btree" ("clinic_id");



CREATE INDEX "idx_ad_spend_date" ON "public"."ad_spend_records" USING "btree" ("spend_date");



CREATE INDEX "idx_ad_spend_platform" ON "public"."ad_spend_records" USING "btree" ("ad_platform");



CREATE INDEX "idx_advertising_costs_clinic_period" ON "public"."advertising_costs" USING "btree" ("clinic_id", "period_start", "period_end");



CREATE INDEX "idx_appointment_logs_appointment_id" ON "public"."appointment_logs" USING "btree" ("appointment_id");



CREATE INDEX "idx_appointment_logs_created_at" ON "public"."appointment_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_appointment_staff_appointment_id" ON "public"."appointment_staff" USING "btree" ("appointment_id");



CREATE INDEX "idx_appointment_staff_is_primary" ON "public"."appointment_staff" USING "btree" ("is_primary");



CREATE INDEX "idx_appointment_staff_staff_id" ON "public"."appointment_staff" USING "btree" ("staff_id");



CREATE INDEX "idx_appointments_cancel_reason" ON "public"."appointments" USING "btree" ("cancel_reason_id");



CREATE INDEX "idx_appointments_clinic_date" ON "public"."appointments" USING "btree" ("clinic_id", "appointment_date");



CREATE INDEX "idx_appointments_patient" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_staff" ON "public"."appointments" USING "btree" ("staff1_id", "staff2_id", "staff3_id");



CREATE INDEX "idx_c_classification_mapping_item" ON "public"."c_classification_question_mapping" USING "btree" ("c_classification_item");



CREATE INDEX "idx_cancel_reasons_clinic" ON "public"."cancel_reasons" USING "btree" ("clinic_id");



CREATE INDEX "idx_clinic_customizations_clinic" ON "public"."clinic_training_customizations" USING "btree" ("clinic_id");



CREATE INDEX "idx_clinics_slug" ON "public"."clinics" USING "btree" ("slug");



CREATE INDEX "idx_device_accounts_device" ON "public"."device_accounts" USING "btree" ("device_identifier");



CREATE INDEX "idx_disease_codes_category" ON "public"."disease_codes" USING "btree" ("category");



CREATE INDEX "idx_disease_codes_code" ON "public"."disease_codes" USING "btree" ("code");



CREATE INDEX "idx_disease_codes_icd10" ON "public"."disease_codes" USING "btree" ("icd10_code");



CREATE INDEX "idx_disease_codes_is_dental" ON "public"."disease_codes" USING "btree" ("is_dental");



CREATE INDEX "idx_disease_codes_kana" ON "public"."disease_codes" USING "btree" ("kana");



CREATE INDEX "idx_disease_codes_name" ON "public"."disease_codes" USING "btree" ("name");



CREATE INDEX "idx_disease_treatment_set_mapping_disease" ON "public"."disease_treatment_set_mapping" USING "btree" ("disease_code");



CREATE INDEX "idx_disease_treatment_set_mapping_set" ON "public"."disease_treatment_set_mapping" USING "btree" ("set_id");



CREATE INDEX "idx_document_templates_active" ON "public"."document_templates" USING "btree" ("is_active");



CREATE INDEX "idx_document_templates_order" ON "public"."document_templates" USING "btree" ("document_type", "display_order");



CREATE INDEX "idx_document_templates_type" ON "public"."document_templates" USING "btree" ("document_type");



CREATE INDEX "idx_evaluation_issue_rules_training" ON "public"."evaluation_issue_rules" USING "btree" ("training_id", "evaluation_level");



CREATE INDEX "idx_facilities_clinic_id" ON "public"."facilities" USING "btree" ("clinic_id");



CREATE INDEX "idx_facilities_is_active" ON "public"."facilities" USING "btree" ("is_active");



CREATE INDEX "idx_funnel_events_clinic_id" ON "public"."web_booking_funnel_events" USING "btree" ("clinic_id");



CREATE INDEX "idx_funnel_events_event_timestamp" ON "public"."web_booking_funnel_events" USING "btree" ("event_timestamp");



CREATE INDEX "idx_funnel_events_session_id" ON "public"."web_booking_funnel_events" USING "btree" ("session_id");



CREATE INDEX "idx_funnel_events_step_name" ON "public"."web_booking_funnel_events" USING "btree" ("step_name");



CREATE INDEX "idx_funnel_events_step_number" ON "public"."web_booking_funnel_events" USING "btree" ("step_number");



CREATE INDEX "idx_funnel_events_utm_source" ON "public"."web_booking_funnel_events" USING "btree" ("utm_source");



CREATE INDEX "idx_issue_training_mappings_issue" ON "public"."issue_training_mappings" USING "btree" ("issue_code", "priority");



CREATE INDEX "idx_issue_training_mappings_training" ON "public"."issue_training_mappings" USING "btree" ("training_id");



CREATE INDEX "idx_lab_orders_clinic_id" ON "public"."lab_orders" USING "btree" ("clinic_id");



CREATE INDEX "idx_lab_orders_lab_id" ON "public"."lab_orders" USING "btree" ("lab_id");



CREATE INDEX "idx_lab_orders_medical_record_id" ON "public"."lab_orders" USING "btree" ("medical_record_id");



CREATE INDEX "idx_lab_orders_order_date" ON "public"."lab_orders" USING "btree" ("order_date" DESC);



CREATE INDEX "idx_lab_orders_patient_id" ON "public"."lab_orders" USING "btree" ("patient_id");



CREATE INDEX "idx_lab_orders_status" ON "public"."lab_orders" USING "btree" ("status");



CREATE INDEX "idx_labs_clinic_id" ON "public"."labs" USING "btree" ("clinic_id");



CREATE INDEX "idx_labs_is_active" ON "public"."labs" USING "btree" ("is_active");



CREATE INDEX "idx_line_invitation_codes_code" ON "public"."line_invitation_codes" USING "btree" ("invitation_code");



CREATE INDEX "idx_line_invitation_codes_expires_at" ON "public"."line_invitation_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_line_invitation_codes_patient_id" ON "public"."line_invitation_codes" USING "btree" ("patient_id");



CREATE INDEX "idx_line_invitation_codes_status" ON "public"."line_invitation_codes" USING "btree" ("status");



CREATE INDEX "idx_line_patient_linkages_clinic_id" ON "public"."line_patient_linkages" USING "btree" ("clinic_id");



CREATE INDEX "idx_line_patient_linkages_line_user_id" ON "public"."line_patient_linkages" USING "btree" ("line_user_id");



CREATE INDEX "idx_line_patient_linkages_patient_id" ON "public"."line_patient_linkages" USING "btree" ("patient_id");



CREATE UNIQUE INDEX "idx_line_patient_linkages_unique" ON "public"."line_patient_linkages" USING "btree" ("line_user_id", "patient_id");



CREATE INDEX "idx_line_qr_tokens_expires_at" ON "public"."line_qr_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_line_qr_tokens_patient_id" ON "public"."line_qr_tokens" USING "btree" ("patient_id");



CREATE INDEX "idx_line_qr_tokens_token" ON "public"."line_qr_tokens" USING "btree" ("token");



CREATE INDEX "idx_line_rich_menus_clinic_id" ON "public"."line_rich_menus" USING "btree" ("clinic_id");



CREATE INDEX "idx_line_user_links_line_user_id" ON "public"."line_user_links" USING "btree" ("line_user_id");



CREATE INDEX "idx_line_user_links_patient_id" ON "public"."line_user_links" USING "btree" ("patient_id");



CREATE INDEX "idx_lip_closure_tests_clinic_id" ON "public"."lip_closure_tests" USING "btree" ("clinic_id");



CREATE INDEX "idx_lip_closure_tests_patient_id" ON "public"."lip_closure_tests" USING "btree" ("patient_id");



CREATE INDEX "idx_lip_closure_tests_test_date" ON "public"."lip_closure_tests" USING "btree" ("test_date");



CREATE INDEX "idx_medical_documents_clinic_id" ON "public"."medical_documents" USING "btree" ("clinic_id");



CREATE INDEX "idx_medical_documents_created_at" ON "public"."medical_documents" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_medical_documents_document_type" ON "public"."medical_documents" USING "btree" ("document_type");



CREATE INDEX "idx_medical_documents_medical_record_id" ON "public"."medical_documents" USING "btree" ("medical_record_id");



CREATE INDEX "idx_medical_documents_patient_id" ON "public"."medical_documents" USING "btree" ("patient_id");



CREATE INDEX "idx_medical_records_clinic_id" ON "public"."medical_records" USING "btree" ("clinic_id");



CREATE INDEX "idx_medical_records_created_at" ON "public"."medical_records" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_medical_records_facility_id" ON "public"."medical_records" USING "btree" ("facility_id");



CREATE INDEX "idx_medical_records_patient_id" ON "public"."medical_records" USING "btree" ("patient_id");



CREATE INDEX "idx_medical_records_treatment_plan_id" ON "public"."medical_records" USING "btree" ("treatment_plan_id");



CREATE INDEX "idx_medical_records_visit_date" ON "public"."medical_records" USING "btree" ("visit_date" DESC);



CREATE INDEX "idx_medical_records_visit_type" ON "public"."medical_records" USING "btree" ("visit_type");



CREATE INDEX "idx_medicine_codes_category" ON "public"."medicine_codes" USING "btree" ("category");



CREATE INDEX "idx_medicine_codes_code" ON "public"."medicine_codes" USING "btree" ("code");



CREATE INDEX "idx_medicine_codes_generic_name" ON "public"."medicine_codes" USING "btree" ("generic_name");



CREATE INDEX "idx_medicine_codes_name" ON "public"."medicine_codes" USING "btree" ("name");



CREATE INDEX "idx_menu_trainings_menu" ON "public"."menu_trainings" USING "btree" ("menu_id", "sort_order");



CREATE INDEX "idx_menu_trainings_training" ON "public"."menu_trainings" USING "btree" ("training_id");



CREATE INDEX "idx_notification_failure_logs_clinic_id" ON "public"."notification_failure_logs" USING "btree" ("clinic_id");



CREATE INDEX "idx_notification_failure_logs_failed_at" ON "public"."notification_failure_logs" USING "btree" ("failed_at");



CREATE INDEX "idx_notification_failure_logs_schedule_id" ON "public"."notification_failure_logs" USING "btree" ("notification_schedule_id");



CREATE INDEX "idx_notification_templates_clinic_id" ON "public"."notification_templates" USING "btree" ("clinic_id");



CREATE INDEX "idx_notification_templates_system_template_id" ON "public"."notification_templates" USING "btree" ("system_template_id");



CREATE INDEX "idx_notification_templates_type" ON "public"."notification_templates" USING "btree" ("notification_type");



CREATE INDEX "idx_operation_logs_clinic" ON "public"."operation_logs" USING "btree" ("clinic_id", "created_at" DESC);



CREATE INDEX "idx_operation_logs_target" ON "public"."operation_logs" USING "btree" ("target_table", "target_record_id");



CREATE INDEX "idx_oral_function_assessments_date" ON "public"."oral_function_assessments" USING "btree" ("assessment_date");



CREATE INDEX "idx_oral_function_assessments_patient" ON "public"."oral_function_assessments" USING "btree" ("patient_id");



CREATE INDEX "idx_oral_function_assessments_response" ON "public"."oral_function_assessments" USING "btree" ("questionnaire_response_id");



CREATE INDEX "idx_patient_acquisition_clinic_date" ON "public"."patient_acquisition_channels" USING "btree" ("clinic_id", "acquisition_date");



CREATE INDEX "idx_patient_acquisition_sources_booking_completed_at" ON "public"."patient_acquisition_sources" USING "btree" ("booking_completed_at");



CREATE INDEX "idx_patient_acquisition_sources_clinic_id" ON "public"."patient_acquisition_sources" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_acquisition_sources_final_source" ON "public"."patient_acquisition_sources" USING "btree" ("final_source");



CREATE INDEX "idx_patient_acquisition_sources_patient_id" ON "public"."patient_acquisition_sources" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_acquisition_sources_tracking_method" ON "public"."patient_acquisition_sources" USING "btree" ("tracking_method");



CREATE INDEX "idx_patient_icons_clinic_id" ON "public"."patient_icons" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_icons_patient_id" ON "public"."patient_icons" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_issue_records_clinic" ON "public"."patient_issue_records" USING "btree" ("clinic_id", "identified_at" DESC);



CREATE INDEX "idx_patient_issue_records_patient" ON "public"."patient_issue_records" USING "btree" ("patient_id", "is_resolved");



CREATE INDEX "idx_patient_notification_analytics_patient_id" ON "public"."patient_notification_analytics" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_notification_analytics_sent_at" ON "public"."patient_notification_analytics" USING "btree" ("sent_at");



CREATE INDEX "idx_patient_notification_preferences_clinic_id" ON "public"."patient_notification_preferences" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_notification_preferences_patient_id" ON "public"."patient_notification_preferences" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_notification_schedules_clinic_id" ON "public"."patient_notification_schedules" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_notification_schedules_patient_id" ON "public"."patient_notification_schedules" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_notification_schedules_send_datetime" ON "public"."patient_notification_schedules" USING "btree" ("send_datetime");



CREATE INDEX "idx_patient_notification_schedules_status" ON "public"."patient_notification_schedules" USING "btree" ("status");



CREATE INDEX "idx_patient_notification_schedules_token" ON "public"."patient_notification_schedules" USING "btree" ("web_booking_token");



CREATE INDEX "idx_patient_qr_codes_clinic_id" ON "public"."patient_qr_codes" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_qr_codes_patient_id" ON "public"."patient_qr_codes" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_qr_codes_qr_token" ON "public"."patient_qr_codes" USING "btree" ("qr_token");



CREATE INDEX "idx_patient_web_booking_settings_clinic_id" ON "public"."patient_web_booking_settings" USING "btree" ("clinic_id");



CREATE INDEX "idx_patient_web_booking_settings_patient_id" ON "public"."patient_web_booking_settings" USING "btree" ("patient_id");



CREATE INDEX "idx_patients_clinic_number" ON "public"."patients" USING "btree" ("clinic_id", "patient_number");



CREATE INDEX "idx_patients_legacy_number" ON "public"."patients" USING "btree" ("clinic_id", "legacy_patient_number");



CREATE INDEX "idx_patients_name" ON "public"."patients" USING "btree" ("clinic_id", "last_name", "first_name");



CREATE INDEX "idx_patients_training_login" ON "public"."patients" USING "btree" ("clinic_id", "patient_number", "birth_date") WHERE ("is_registered" = true);



CREATE INDEX "idx_periodontal_examinations_clinic" ON "public"."periodontal_examinations" USING "btree" ("clinic_id", "examination_date" DESC);



CREATE INDEX "idx_periodontal_examinations_patient" ON "public"."periodontal_examinations" USING "btree" ("patient_id", "examination_date" DESC);



CREATE INDEX "idx_periodontal_tooth_data_examination" ON "public"."periodontal_tooth_data" USING "btree" ("examination_id");



CREATE INDEX "idx_questionnaire_questions_questionnaire" ON "public"."questionnaire_questions" USING "btree" ("questionnaire_id");



CREATE INDEX "idx_questionnaire_responses_appointment" ON "public"."questionnaire_responses" USING "btree" ("appointment_id");



CREATE INDEX "idx_questionnaire_responses_patient" ON "public"."questionnaire_responses" USING "btree" ("patient_id");



CREATE INDEX "idx_questionnaires_clinic" ON "public"."questionnaires" USING "btree" ("clinic_id");



CREATE INDEX "idx_questionnaires_template_id" ON "public"."questionnaires" USING "btree" ("template_id");



CREATE INDEX "idx_receipts_clinic_id" ON "public"."receipts" USING "btree" ("clinic_id");



CREATE INDEX "idx_receipts_patient_id" ON "public"."receipts" USING "btree" ("patient_id");



CREATE INDEX "idx_receipts_status" ON "public"."receipts" USING "btree" ("status");



CREATE INDEX "idx_receipts_submitted_at" ON "public"."receipts" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_receipts_year_month" ON "public"."receipts" USING "btree" ("year_month" DESC);



CREATE INDEX "idx_sales_category" ON "public"."sales" USING "btree" ("category");



CREATE INDEX "idx_sales_clinic_date" ON "public"."sales" USING "btree" ("clinic_id", "sale_date");



CREATE INDEX "idx_sales_external_system" ON "public"."sales" USING "btree" ("external_system_id", "external_system_name");



CREATE INDEX "idx_sales_import_history_clinic" ON "public"."sales_import_history" USING "btree" ("clinic_id", "import_date" DESC);



CREATE INDEX "idx_sales_import_history_status" ON "public"."sales_import_history" USING "btree" ("status");



CREATE INDEX "idx_sales_payment_method" ON "public"."sales" USING "btree" ("payment_method");



CREATE INDEX "idx_sales_receipt_number" ON "public"."sales" USING "btree" ("receipt_number");



CREATE INDEX "idx_sales_staff" ON "public"."sales" USING "btree" ("staff_id");



CREATE INDEX "idx_sales_treatment_date" ON "public"."sales" USING "btree" ("treatment_date");



CREATE INDEX "idx_self_pay_treatments_category" ON "public"."self_pay_treatments" USING "btree" ("category");



CREATE INDEX "idx_self_pay_treatments_clinic_id" ON "public"."self_pay_treatments" USING "btree" ("clinic_id");



CREATE INDEX "idx_self_pay_treatments_is_active" ON "public"."self_pay_treatments" USING "btree" ("is_active");



CREATE INDEX "idx_shift_patterns_clinic_id" ON "public"."shift_patterns" USING "btree" ("clinic_id");



CREATE INDEX "idx_shifts_clinic_date" ON "public"."shifts" USING "btree" ("clinic_id", "date");



CREATE INDEX "idx_staff_evaluation_results_staff_period" ON "public"."staff_evaluation_results" USING "btree" ("staff_id", "evaluation_period_start", "evaluation_period_end");



CREATE INDEX "idx_staff_evaluation_settings_clinic" ON "public"."staff_evaluation_settings" USING "btree" ("clinic_id");



CREATE INDEX "idx_staff_shifts_clinic_id" ON "public"."staff_shifts" USING "btree" ("clinic_id");



CREATE INDEX "idx_staff_shifts_date" ON "public"."staff_shifts" USING "btree" ("date");



CREATE INDEX "idx_staff_shifts_staff_id" ON "public"."staff_shifts" USING "btree" ("staff_id");



CREATE INDEX "idx_staff_unit_priorities_clinic" ON "public"."staff_unit_priorities" USING "btree" ("clinic_id");



CREATE INDEX "idx_staff_unit_priorities_priority" ON "public"."staff_unit_priorities" USING "btree" ("clinic_id", "staff_id", "priority_order");



CREATE INDEX "idx_staff_unit_priorities_staff" ON "public"."staff_unit_priorities" USING "btree" ("staff_id");



CREATE INDEX "idx_staff_unit_priorities_unit" ON "public"."staff_unit_priorities" USING "btree" ("unit_id");



CREATE INDEX "idx_subkarte_attachments_entry_id" ON "public"."subkarte_attachments" USING "btree" ("entry_id");



CREATE INDEX "idx_subkarte_audio_entry_id" ON "public"."subkarte_audio" USING "btree" ("entry_id");



CREATE INDEX "idx_subkarte_audio_expires_at" ON "public"."subkarte_audio" USING "btree" ("expires_at");



CREATE INDEX "idx_subkarte_entries_created_at" ON "public"."subkarte_entries" USING "btree" ("created_at");



CREATE INDEX "idx_subkarte_entries_patient_id" ON "public"."subkarte_entries" USING "btree" ("patient_id");



CREATE INDEX "idx_subkarte_handwriting_entry_id" ON "public"."subkarte_handwriting" USING "btree" ("entry_id");



CREATE INDEX "idx_subkarte_templates_clinic_id" ON "public"."subkarte_templates" USING "btree" ("clinic_id");



CREATE INDEX "idx_system_questionnaire_template_questions_sort_order" ON "public"."system_questionnaire_template_questions" USING "btree" ("template_id", "sort_order");



CREATE INDEX "idx_system_questionnaire_template_questions_template_id" ON "public"."system_questionnaire_template_questions" USING "btree" ("template_id");



CREATE INDEX "idx_system_questionnaire_templates_active" ON "public"."system_questionnaire_templates" USING "btree" ("is_active");



CREATE INDEX "idx_system_questionnaire_templates_category" ON "public"."system_questionnaire_templates" USING "btree" ("category");



CREATE INDEX "idx_tab_click_clinic_id" ON "public"."hp_tab_click_events" USING "btree" ("clinic_id");



CREATE INDEX "idx_tab_click_completed" ON "public"."hp_tab_click_events" USING "btree" ("did_complete_booking");



CREATE INDEX "idx_tab_click_session_id" ON "public"."hp_tab_click_events" USING "btree" ("session_id");



CREATE INDEX "idx_tab_click_tab_id" ON "public"."hp_tab_click_events" USING "btree" ("tab_id");



CREATE INDEX "idx_tab_click_timestamp" ON "public"."hp_tab_click_events" USING "btree" ("click_timestamp");



CREATE INDEX "idx_template_trainings_template" ON "public"."template_trainings" USING "btree" ("template_id", "sort_order");



CREATE INDEX "idx_templates_clinic" ON "public"."templates" USING "btree" ("clinic_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_tracking_tags_clinic_id" ON "public"."tracking_tags" USING "btree" ("clinic_id");



CREATE INDEX "idx_training_evaluations_clinic" ON "public"."training_evaluations" USING "btree" ("clinic_id", "evaluated_at" DESC);



CREATE INDEX "idx_training_evaluations_menu" ON "public"."training_evaluations" USING "btree" ("menu_id");



CREATE INDEX "idx_training_evaluations_patient" ON "public"."training_evaluations" USING "btree" ("patient_id", "evaluated_at" DESC);



CREATE INDEX "idx_training_evaluations_training" ON "public"."training_evaluations" USING "btree" ("training_id", "evaluation_level");



CREATE INDEX "idx_training_menus_active" ON "public"."training_menus" USING "btree" ("patient_id", "is_active") WHERE ("is_deleted" = false);



CREATE INDEX "idx_training_menus_clinic" ON "public"."training_menus" USING "btree" ("clinic_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_training_menus_patient" ON "public"."training_menus" USING "btree" ("patient_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_training_records_clinic_date" ON "public"."training_records" USING "btree" ("clinic_id", "performed_at");



CREATE INDEX "idx_training_records_clinic_training" ON "public"."training_records" USING "btree" ("clinic_id", "training_id", "performed_at");



CREATE INDEX "idx_training_records_menu" ON "public"."training_records" USING "btree" ("menu_id");



CREATE INDEX "idx_training_records_patient_date" ON "public"."training_records" USING "btree" ("patient_id", "performed_at");



CREATE INDEX "idx_trainings_clinic" ON "public"."trainings" USING "btree" ("clinic_id") WHERE ("is_deleted" = false);



CREATE INDEX "idx_trainings_default" ON "public"."trainings" USING "btree" ("is_default") WHERE (("is_default" = true) AND ("is_deleted" = false));



CREATE INDEX "idx_treatment_codes_category" ON "public"."treatment_codes" USING "btree" ("category");



CREATE INDEX "idx_treatment_codes_code" ON "public"."treatment_codes" USING "btree" ("code");



CREATE INDEX "idx_treatment_codes_effective_dates" ON "public"."treatment_codes" USING "btree" ("effective_from", "effective_to");



CREATE INDEX "idx_treatment_codes_name" ON "public"."treatment_codes" USING "btree" ("name");



CREATE INDEX "idx_treatment_plans_clinic_id" ON "public"."treatment_plans" USING "btree" ("clinic_id");



CREATE INDEX "idx_treatment_plans_created_at" ON "public"."treatment_plans" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_treatment_plans_patient_id" ON "public"."treatment_plans" USING "btree" ("patient_id");



CREATE INDEX "idx_treatment_plans_status" ON "public"."treatment_plans" USING "btree" ("status");



CREATE INDEX "idx_treatment_required_fields_code" ON "public"."treatment_required_fields" USING "btree" ("treatment_code");



CREATE INDEX "idx_treatment_set_items_set_id" ON "public"."treatment_set_items" USING "btree" ("set_id");



CREATE INDEX "idx_visual_examinations_clinic" ON "public"."visual_examinations" USING "btree" ("clinic_id");



CREATE INDEX "idx_visual_examinations_date" ON "public"."visual_examinations" USING "btree" ("examination_date" DESC);



CREATE INDEX "idx_visual_examinations_patient" ON "public"."visual_examinations" USING "btree" ("patient_id");



CREATE INDEX "idx_visual_tooth_data_examination" ON "public"."visual_tooth_data" USING "btree" ("examination_id");



CREATE INDEX "idx_visual_tooth_data_tooth_number" ON "public"."visual_tooth_data" USING "btree" ("tooth_number");



CREATE INDEX "idx_web_booking_tokens_clinic_id" ON "public"."web_booking_tokens" USING "btree" ("clinic_id");



CREATE INDEX "idx_web_booking_tokens_expires_at" ON "public"."web_booking_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_web_booking_tokens_patient_id" ON "public"."web_booking_tokens" USING "btree" ("patient_id");



CREATE INDEX "idx_web_booking_tokens_token" ON "public"."web_booking_tokens" USING "btree" ("token");



CREATE UNIQUE INDEX "patients_clinic_id_patient_number_key" ON "public"."patients" USING "btree" ("clinic_id", "patient_number") WHERE ("patient_number" IS NOT NULL);



CREATE OR REPLACE TRIGGER "enforce_device_account_limit" BEFORE INSERT ON "public"."device_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."check_device_account_limit"();



CREATE OR REPLACE TRIGGER "enforce_template_limit" BEFORE INSERT ON "public"."templates" FOR EACH ROW EXECUTE FUNCTION "public"."check_template_limit"();



CREATE OR REPLACE TRIGGER "trigger_update_medical_documents_updated_at" BEFORE UPDATE ON "public"."medical_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_medical_documents_updated_at"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinic_customizations_updated_at" BEFORE UPDATE ON "public"."clinic_training_customizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinic_settings_updated_at" BEFORE UPDATE ON "public"."clinic_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinics_updated_at" BEFORE UPDATE ON "public"."clinics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_disease_codes_updated_at" BEFORE UPDATE ON "public"."disease_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_document_templates_updated_at" BEFORE UPDATE ON "public"."document_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_templates_updated_at"();



CREATE OR REPLACE TRIGGER "update_facilities_updated_at" BEFORE UPDATE ON "public"."facilities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lab_orders_updated_at" BEFORE UPDATE ON "public"."lab_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_labs_updated_at" BEFORE UPDATE ON "public"."labs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_line_patient_linkages_updated_at" BEFORE UPDATE ON "public"."line_patient_linkages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medical_records_updated_at" BEFORE UPDATE ON "public"."medical_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medicine_codes_updated_at" BEFORE UPDATE ON "public"."medicine_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_oral_function_assessments_updated_at" BEFORE UPDATE ON "public"."oral_function_assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patient_qr_codes_updated_at" BEFORE UPDATE ON "public"."patient_qr_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_periodontal_examinations_updated_at" BEFORE UPDATE ON "public"."periodontal_examinations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_periodontal_tooth_data_updated_at" BEFORE UPDATE ON "public"."periodontal_tooth_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_receipts_updated_at" BEFORE UPDATE ON "public"."receipts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_self_pay_treatments_updated_at" BEFORE UPDATE ON "public"."self_pay_treatments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_updated_at" BEFORE UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_templates_updated_at" BEFORE UPDATE ON "public"."templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_training_menus_updated_at" BEFORE UPDATE ON "public"."training_menus" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trainings_updated_at" BEFORE UPDATE ON "public"."trainings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_treatment_codes_updated_at" BEFORE UPDATE ON "public"."treatment_codes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_treatment_plans_updated_at" BEFORE UPDATE ON "public"."treatment_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."ad_spend_records"
    ADD CONSTRAINT "ad_spend_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."advertising_costs"
    ADD CONSTRAINT "advertising_costs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_logs"
    ADD CONSTRAINT "appointment_logs_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_logs"
    ADD CONSTRAINT "appointment_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointment_staff"
    ADD CONSTRAINT "appointment_staff_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_staff"
    ADD CONSTRAINT "appointment_staff_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_cancel_reason_id_fkey" FOREIGN KEY ("cancel_reason_id") REFERENCES "public"."cancel_reasons"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_menu1_id_fkey" FOREIGN KEY ("menu1_id") REFERENCES "public"."treatment_menus"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_menu2_id_fkey" FOREIGN KEY ("menu2_id") REFERENCES "public"."treatment_menus"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_menu3_id_fkey" FOREIGN KEY ("menu3_id") REFERENCES "public"."treatment_menus"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_staff1_id_fkey" FOREIGN KEY ("staff1_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_staff2_id_fkey" FOREIGN KEY ("staff2_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_staff3_id_fkey" FOREIGN KEY ("staff3_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id");



ALTER TABLE ONLY "public"."auto_reminder_rules"
    ADD CONSTRAINT "auto_reminder_rules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."auto_reminder_rules"
    ADD CONSTRAINT "auto_reminder_rules_on_cancel_resend_template_id_fkey" FOREIGN KEY ("on_cancel_resend_template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cancel_reasons"
    ADD CONSTRAINT "cancel_reasons_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cancel_reasons"
    ADD CONSTRAINT "cancel_reasons_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."system_cancel_reasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clinic_settings"
    ADD CONSTRAINT "clinic_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_training_customizations"
    ADD CONSTRAINT "clinic_training_customizations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinic_training_customizations"
    ADD CONSTRAINT "clinic_training_customizations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_memos"
    ADD CONSTRAINT "daily_memos_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_memos"
    ADD CONSTRAINT "daily_memos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."device_accounts"
    ADD CONSTRAINT "device_accounts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disease_treatment_set_mapping"
    ADD CONSTRAINT "disease_treatment_set_mapping_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."treatment_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_issue_rules"
    ADD CONSTRAINT "evaluation_issue_rules_identified_issue_code_fkey" FOREIGN KEY ("identified_issue_code") REFERENCES "public"."patient_issues"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluation_issue_rules"
    ADD CONSTRAINT "evaluation_issue_rules_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_spend_records"
    ADD CONSTRAINT "fk_ad_spend_clinic" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_booking_funnel_events"
    ADD CONSTRAINT "fk_funnel_events_clinic" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "fk_medical_records_treatment_plan" FOREIGN KEY ("treatment_plan_id") REFERENCES "public"."treatment_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_acquisition_sources"
    ADD CONSTRAINT "fk_patient_acquisition_clinic" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_acquisition_sources"
    ADD CONSTRAINT "fk_patient_acquisition_patient" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hp_tab_click_events"
    ADD CONSTRAINT "fk_tab_click_clinic" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hp_tab_click_events"
    ADD CONSTRAINT "hp_tab_click_events_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."individual_holidays"
    ADD CONSTRAINT "individual_holidays_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_training_mappings"
    ADD CONSTRAINT "issue_training_mappings_issue_code_fkey" FOREIGN KEY ("issue_code") REFERENCES "public"."patient_issues"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."issue_training_mappings"
    ADD CONSTRAINT "issue_training_mappings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "public"."labs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lab_orders"
    ADD CONSTRAINT "lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."labs"
    ADD CONSTRAINT "labs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_invitation_codes"
    ADD CONSTRAINT "line_invitation_codes_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_invitation_codes"
    ADD CONSTRAINT "line_invitation_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."line_patient_linkages"
    ADD CONSTRAINT "line_patient_linkages_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_patient_linkages"
    ADD CONSTRAINT "line_patient_linkages_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_qr_tokens"
    ADD CONSTRAINT "line_qr_tokens_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_qr_tokens"
    ADD CONSTRAINT "line_qr_tokens_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_rich_menus"
    ADD CONSTRAINT "line_rich_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_user_links"
    ADD CONSTRAINT "line_user_links_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_user_links"
    ADD CONSTRAINT "line_user_links_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id");



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."medical_documents"
    ADD CONSTRAINT "medical_documents_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "public"."medical_records"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."medical_records"
    ADD CONSTRAINT "medical_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."memo_templates"
    ADD CONSTRAINT "memo_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_trainings"
    ADD CONSTRAINT "menu_trainings_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."training_menus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."menu_trainings"
    ADD CONSTRAINT "menu_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_failure_logs"
    ADD CONSTRAINT "notification_failure_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_failure_logs"
    ADD CONSTRAINT "notification_failure_logs_notification_schedule_id_fkey" FOREIGN KEY ("notification_schedule_id") REFERENCES "public"."patient_notification_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_failure_logs"
    ADD CONSTRAINT "notification_failure_logs_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_default_staff_id_fkey" FOREIGN KEY ("default_staff_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_system_template_id_fkey" FOREIGN KEY ("system_template_id") REFERENCES "public"."system_notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."system_notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."operation_logs"
    ADD CONSTRAINT "operation_logs_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operation_logs"
    ADD CONSTRAINT "operation_logs_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."oral_function_assessments"
    ADD CONSTRAINT "oral_function_assessments_evaluated_by_staff_id_fkey" FOREIGN KEY ("evaluated_by_staff_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."oral_function_assessments"
    ADD CONSTRAINT "oral_function_assessments_questionnaire_response_id_fkey" FOREIGN KEY ("questionnaire_response_id") REFERENCES "public"."questionnaire_responses"("id");



ALTER TABLE ONLY "public"."patient_acquisition_channels"
    ADD CONSTRAINT "patient_acquisition_channels_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_acquisition_channels"
    ADD CONSTRAINT "patient_acquisition_channels_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_acquisition_channels"
    ADD CONSTRAINT "patient_acquisition_channels_referral_patient_id_fkey" FOREIGN KEY ("referral_patient_id") REFERENCES "public"."patients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_acquisition_sources"
    ADD CONSTRAINT "patient_acquisition_sources_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_acquisition_sources"
    ADD CONSTRAINT "patient_acquisition_sources_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_issue_records"
    ADD CONSTRAINT "patient_issue_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_issue_records"
    ADD CONSTRAINT "patient_issue_records_identified_by_fkey" FOREIGN KEY ("identified_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."patient_issue_records"
    ADD CONSTRAINT "patient_issue_records_issue_code_fkey" FOREIGN KEY ("issue_code") REFERENCES "public"."patient_issues"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_issue_records"
    ADD CONSTRAINT "patient_issue_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_note_types"
    ADD CONSTRAINT "patient_note_types_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notes"
    ADD CONSTRAINT "patient_notes_note_type_id_fkey" FOREIGN KEY ("note_type_id") REFERENCES "public"."patient_note_types"("id");



ALTER TABLE ONLY "public"."patient_notes"
    ADD CONSTRAINT "patient_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_analytics"
    ADD CONSTRAINT "patient_notification_analytics_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_analytics"
    ADD CONSTRAINT "patient_notification_analytics_notification_schedule_id_fkey" FOREIGN KEY ("notification_schedule_id") REFERENCES "public"."patient_notification_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_analytics"
    ADD CONSTRAINT "patient_notification_analytics_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_preferences"
    ADD CONSTRAINT "patient_notification_preferences_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_linked_appointment_id_fkey" FOREIGN KEY ("linked_appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "public"."treatment_menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_notification_schedules"
    ADD CONSTRAINT "patient_notification_schedules_web_booking_staff_id_fkey" FOREIGN KEY ("web_booking_staff_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_qr_codes"
    ADD CONSTRAINT "patient_qr_codes_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_qr_codes"
    ADD CONSTRAINT "patient_qr_codes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_web_booking_settings"
    ADD CONSTRAINT "patient_web_booking_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_web_booking_settings"
    ADD CONSTRAINT "patient_web_booking_settings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_primary_doctor_id_fkey" FOREIGN KEY ("primary_doctor_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_primary_hygienist_id_fkey" FOREIGN KEY ("primary_hygienist_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."periodontal_examinations"
    ADD CONSTRAINT "periodontal_examinations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."periodontal_examinations"
    ADD CONSTRAINT "periodontal_examinations_examiner_id_fkey" FOREIGN KEY ("examiner_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."periodontal_tooth_data"
    ADD CONSTRAINT "periodontal_tooth_data_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "public"."periodontal_examinations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_questions"
    ADD CONSTRAINT "questionnaire_questions_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaire_responses"
    ADD CONSTRAINT "questionnaire_responses_questionnaire_id_fkey" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaires"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."questionnaires"
    ADD CONSTRAINT "questionnaires_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."system_questionnaire_templates"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."receipts"
    ADD CONSTRAINT "receipts_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_import_history"
    ADD CONSTRAINT "sales_import_history_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_import_history"
    ADD CONSTRAINT "sales_import_history_imported_by_fkey" FOREIGN KEY ("imported_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "public"."treatment_menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."self_pay_treatments"
    ADD CONSTRAINT "self_pay_treatments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_patterns"
    ADD CONSTRAINT "shift_patterns_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_substitute_for_id_fkey" FOREIGN KEY ("substitute_for_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_evaluation_results"
    ADD CONSTRAINT "staff_evaluation_results_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_evaluation_results"
    ADD CONSTRAINT "staff_evaluation_results_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_evaluation_settings"
    ADD CONSTRAINT "staff_evaluation_settings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_evaluation_settings"
    ADD CONSTRAINT "staff_evaluation_settings_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."staff_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."staff_positions"("id");



ALTER TABLE ONLY "public"."staff_positions"
    ADD CONSTRAINT "staff_positions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_positions"
    ADD CONSTRAINT "staff_positions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."system_staff_positions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."staff_shifts"
    ADD CONSTRAINT "staff_shifts_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_shifts"
    ADD CONSTRAINT "staff_shifts_shift_pattern_id_fkey" FOREIGN KEY ("shift_pattern_id") REFERENCES "public"."shift_patterns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."staff_shifts"
    ADD CONSTRAINT "staff_shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_unit_priorities"
    ADD CONSTRAINT "staff_unit_priorities_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_unit_priorities"
    ADD CONSTRAINT "staff_unit_priorities_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_unit_priorities"
    ADD CONSTRAINT "staff_unit_priorities_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."subkarte_attachments"
    ADD CONSTRAINT "subkarte_attachments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."subkarte_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subkarte_audio"
    ADD CONSTRAINT "subkarte_audio_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."subkarte_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subkarte_entries"
    ADD CONSTRAINT "subkarte_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subkarte_entries"
    ADD CONSTRAINT "subkarte_entries_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subkarte_handwriting"
    ADD CONSTRAINT "subkarte_handwriting_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."subkarte_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subkarte_templates"
    ADD CONSTRAINT "subkarte_templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."system_questionnaire_template_questions"
    ADD CONSTRAINT "system_questionnaire_template_questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."system_questionnaire_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_trainings"
    ADD CONSTRAINT "template_trainings_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_trainings"
    ADD CONSTRAINT "template_trainings_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."templates"
    ADD CONSTRAINT "templates_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracking_tags"
    ADD CONSTRAINT "tracking_tags_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."training_menus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_menu_training_id_fkey" FOREIGN KEY ("menu_training_id") REFERENCES "public"."menu_trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_evaluations"
    ADD CONSTRAINT "training_evaluations_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_menus"
    ADD CONSTRAINT "training_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_menus"
    ADD CONSTRAINT "training_menus_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "public"."training_menus"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."training_records"
    ADD CONSTRAINT "training_records_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trainings"
    ADD CONSTRAINT "trainings_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_menus"
    ADD CONSTRAINT "treatment_menus_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_menus"
    ADD CONSTRAINT "treatment_menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."treatment_menus"("id");



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."treatment_plans"
    ADD CONSTRAINT "treatment_plans_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."treatment_set_items"
    ADD CONSTRAINT "treatment_set_items_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "public"."treatment_sets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visual_examinations"
    ADD CONSTRAINT "visual_examinations_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visual_tooth_data"
    ADD CONSTRAINT "visual_tooth_data_examination_id_fkey" FOREIGN KEY ("examination_id") REFERENCES "public"."visual_examinations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_booking_funnel_events"
    ADD CONSTRAINT "web_booking_funnel_events_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_treatment_menu_id_fkey" FOREIGN KEY ("treatment_menu_id") REFERENCES "public"."treatment_menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_treatment_menu_level2_id_fkey" FOREIGN KEY ("treatment_menu_level2_id") REFERENCES "public"."treatment_menus"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."web_booking_tokens"
    ADD CONSTRAINT "web_booking_tokens_treatment_menu_level3_id_fkey" FOREIGN KEY ("treatment_menu_level3_id") REFERENCES "public"."treatment_menus"("id") ON DELETE SET NULL;



CREATE POLICY "Allow all authenticated users to delete templates" ON "public"."document_templates" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow all authenticated users to insert templates" ON "public"."document_templates" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow all authenticated users to update templates" ON "public"."document_templates" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow all authenticated users to view templates" ON "public"."document_templates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read disease_treatment_set_mapping" ON "public"."disease_treatment_set_mapping" FOR SELECT USING (true);



CREATE POLICY "Anyone can read treatment_required_fields" ON "public"."treatment_required_fields" FOR SELECT USING (true);



CREATE POLICY "Anyone can read treatment_set_items" ON "public"."treatment_set_items" FOR SELECT USING (true);



CREATE POLICY "Anyone can read treatment_sets" ON "public"."treatment_sets" FOR SELECT USING (true);



CREATE POLICY "Clinics can manage their patients web booking settings" ON "public"."patient_web_booking_settings" USING (("clinic_id" IN ( SELECT "clinics"."id"
   FROM "public"."clinics"
  WHERE ("clinics"."id" = "patient_web_booking_settings"."clinic_id"))));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."individual_holidays" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."individual_holidays" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."individual_holidays" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."individual_holidays" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Staff can access their clinic's QR codes" ON "public"."patient_qr_codes" USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Staff can access their clinic's invitation codes" ON "public"."line_invitation_codes" USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Staff can access their clinic's linkages" ON "public"."line_patient_linkages" USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "System questionnaire template questions are viewable by everyon" ON "public"."system_questionnaire_template_questions" FOR SELECT USING (true);



CREATE POLICY "System questionnaire templates are viewable by everyone" ON "public"."system_questionnaire_templates" FOR SELECT USING (true);



CREATE POLICY "Users can delete visual examinations from their clinic" ON "public"."visual_examinations" FOR DELETE USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete visual tooth data from their clinic" ON "public"."visual_tooth_data" FOR DELETE USING (("examination_id" IN ( SELECT "visual_examinations"."id"
   FROM "public"."visual_examinations"
  WHERE ("visual_examinations"."clinic_id" IN ( SELECT "staff"."clinic_id"
           FROM "public"."staff"
          WHERE ("staff"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert visual examinations to their clinic" ON "public"."visual_examinations" FOR INSERT WITH CHECK (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert visual tooth data to their clinic" ON "public"."visual_tooth_data" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."visual_examinations"
  WHERE (("visual_examinations"."id" = "visual_tooth_data"."examination_id") AND ("visual_examinations"."clinic_id" IN ( SELECT "staff"."clinic_id"
           FROM "public"."staff"
          WHERE ("staff"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update visual examinations from their clinic" ON "public"."visual_examinations" FOR UPDATE USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update visual tooth data from their clinic" ON "public"."visual_tooth_data" FOR UPDATE USING (("examination_id" IN ( SELECT "visual_examinations"."id"
   FROM "public"."visual_examinations"
  WHERE ("visual_examinations"."clinic_id" IN ( SELECT "staff"."clinic_id"
           FROM "public"."staff"
          WHERE ("staff"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view visual examinations from their clinic" ON "public"."visual_examinations" FOR SELECT USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view visual tooth data from their clinic" ON "public"."visual_tooth_data" FOR SELECT USING (("examination_id" IN ( SELECT "visual_examinations"."id"
   FROM "public"."visual_examinations"
  WHERE ("visual_examinations"."clinic_id" IN ( SELECT "staff"."clinic_id"
           FROM "public"."staff"
          WHERE ("staff"."user_id" = "auth"."uid"()))))));



CREATE POLICY "ad_spend_delete_policy" ON "public"."ad_spend_records" FOR DELETE USING (true);



CREATE POLICY "ad_spend_insert_policy" ON "public"."ad_spend_records" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."ad_spend_records" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ad_spend_select_policy" ON "public"."ad_spend_records" FOR SELECT USING (true);



CREATE POLICY "ad_spend_update_policy" ON "public"."ad_spend_records" FOR UPDATE USING (true);



ALTER TABLE "public"."appointment_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "appointment_logs_all_access" ON "public"."appointment_logs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "appointment_logs_allow_all" ON "public"."appointment_logs" USING (true) WITH CHECK (true);



CREATE POLICY "appointments_allow_all" ON "public"."appointments" USING (true) WITH CHECK (true);



CREATE POLICY "cancel_reasons_clinic_access" ON "public"."cancel_reasons" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "clinic_customizations_access" ON "public"."clinic_training_customizations" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "clinics_allow_all" ON "public"."clinics" USING (true) WITH CHECK (true);



CREATE POLICY "daily_memos_development_access" ON "public"."daily_memos" TO "authenticated" USING (true);



ALTER TABLE "public"."device_accounts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_accounts_patient_access" ON "public"."device_accounts" TO "authenticated" USING (("patient_id" = (("auth"."jwt"() ->> 'patient_id'::"text"))::"uuid"));



ALTER TABLE "public"."disease_treatment_set_mapping" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "evaluation_issue_rules_read_all" ON "public"."evaluation_issue_rules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "funnel_events_insert_policy" ON "public"."web_booking_funnel_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "funnel_events_select_policy" ON "public"."web_booking_funnel_events" FOR SELECT USING (true);



ALTER TABLE "public"."hp_tab_click_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hp_tab_click_events_insert_policy" ON "public"."hp_tab_click_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "hp_tab_click_events_select_policy" ON "public"."hp_tab_click_events" FOR SELECT USING (true);



CREATE POLICY "hp_tab_click_events_update_policy" ON "public"."hp_tab_click_events" FOR UPDATE USING (true);



CREATE POLICY "issue_training_mappings_read_all" ON "public"."issue_training_mappings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."line_invitation_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."line_patient_linkages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medical_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medical_documents_all_access" ON "public"."medical_documents" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "menu_trainings_access" ON "public"."menu_trainings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."training_menus" "tm"
  WHERE (("tm"."id" = "menu_trainings"."menu_id") AND (("tm"."clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid") OR ("tm"."patient_id" = (("auth"."jwt"() ->> 'patient_id'::"text"))::"uuid"))))));



ALTER TABLE "public"."operation_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "operation_logs_clinic_access" ON "public"."operation_logs" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



ALTER TABLE "public"."patient_acquisition_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_acquisition_sources_insert_policy" ON "public"."patient_acquisition_sources" FOR INSERT WITH CHECK (true);



CREATE POLICY "patient_acquisition_sources_select_policy" ON "public"."patient_acquisition_sources" FOR SELECT USING (true);



CREATE POLICY "patient_acquisition_sources_update_policy" ON "public"."patient_acquisition_sources" FOR UPDATE USING (true);



CREATE POLICY "patient_issue_records_clinic_access" ON "public"."patient_issue_records" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "patient_issues_read_all" ON "public"."patient_issues" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "patient_note_types_allow_all" ON "public"."patient_note_types" USING (true) WITH CHECK (true);



CREATE POLICY "patient_notes_allow_all" ON "public"."patient_notes" USING (true) WITH CHECK (true);



ALTER TABLE "public"."patient_qr_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_web_booking_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patients_allow_all" ON "public"."patients" USING (true) WITH CHECK (true);



ALTER TABLE "public"."periodontal_examinations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "periodontal_examinations_clinic_policy" ON "public"."periodontal_examinations" USING (("clinic_id" IN ( SELECT "staff"."clinic_id"
   FROM "public"."staff"
  WHERE ("staff"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."periodontal_tooth_data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "periodontal_tooth_data_clinic_policy" ON "public"."periodontal_tooth_data" USING (("examination_id" IN ( SELECT "periodontal_examinations"."id"
   FROM "public"."periodontal_examinations"
  WHERE ("periodontal_examinations"."clinic_id" IN ( SELECT "staff"."clinic_id"
           FROM "public"."staff"
          WHERE ("staff"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "staff_allow_all" ON "public"."staff" USING (true) WITH CHECK (true);



CREATE POLICY "staff_positions_allow_all" ON "public"."staff_positions" USING (true) WITH CHECK (true);



ALTER TABLE "public"."system_questionnaire_template_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_questionnaire_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "template_trainings_access" ON "public"."template_trainings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."templates" "t"
  WHERE (("t"."id" = "template_trainings"."template_id") AND ("t"."clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid")))));



CREATE POLICY "templates_clinic_access" ON "public"."templates" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



ALTER TABLE "public"."tracking_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tracking_tags_delete_policy" ON "public"."tracking_tags" FOR DELETE USING (true);



CREATE POLICY "tracking_tags_insert_policy" ON "public"."tracking_tags" FOR INSERT WITH CHECK (true);



CREATE POLICY "tracking_tags_select_policy" ON "public"."tracking_tags" FOR SELECT USING (true);



CREATE POLICY "tracking_tags_update_policy" ON "public"."tracking_tags" FOR UPDATE USING (true);



CREATE POLICY "training_evaluations_clinic_access" ON "public"."training_evaluations" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "training_menus_clinic_access" ON "public"."training_menus" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "training_menus_patient_access" ON "public"."training_menus" FOR SELECT TO "authenticated" USING (("patient_id" = (("auth"."jwt"() ->> 'patient_id'::"text"))::"uuid"));



CREATE POLICY "training_records_clinic_access" ON "public"."training_records" TO "authenticated" USING (("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid"));



CREATE POLICY "training_records_patient_access" ON "public"."training_records" FOR SELECT TO "authenticated" USING (("patient_id" = (("auth"."jwt"() ->> 'patient_id'::"text"))::"uuid"));



CREATE POLICY "training_records_patient_insert" ON "public"."training_records" FOR INSERT TO "authenticated" WITH CHECK (("patient_id" = (("auth"."jwt"() ->> 'patient_id'::"text"))::"uuid"));



CREATE POLICY "trainings_clinic_access" ON "public"."trainings" TO "authenticated" USING ((("clinic_id" IS NULL) OR ("clinic_id" = (("auth"."jwt"() ->> 'clinic_id'::"text"))::"uuid")));



CREATE POLICY "treatment_menus_allow_all" ON "public"."treatment_menus" USING (true) WITH CHECK (true);



ALTER TABLE "public"."treatment_required_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_set_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."treatment_sets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "units_allow_all" ON "public"."units" USING (true) WITH CHECK (true);



ALTER TABLE "public"."visual_examinations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visual_tooth_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_booking_funnel_events" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_device_account_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_device_account_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_device_account_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_template_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_template_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_template_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_audio_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_audio_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_audio_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_conversation_states"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_conversation_states"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_conversation_states"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_qr_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_qr_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_qr_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_web_booking_tokens"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_web_booking_tokens"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_web_booking_tokens"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_templates_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_templates_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_templates_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_medical_documents_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_medical_documents_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_medical_documents_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."ad_spend_records" TO "anon";
GRANT ALL ON TABLE "public"."ad_spend_records" TO "authenticated";
GRANT ALL ON TABLE "public"."ad_spend_records" TO "service_role";



GRANT ALL ON TABLE "public"."advertising_costs" TO "anon";
GRANT ALL ON TABLE "public"."advertising_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."advertising_costs" TO "service_role";



GRANT ALL ON TABLE "public"."appointment_logs" TO "anon";
GRANT ALL ON TABLE "public"."appointment_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_logs" TO "service_role";



GRANT ALL ON TABLE "public"."appointment_staff" TO "anon";
GRANT ALL ON TABLE "public"."appointment_staff" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_staff" TO "service_role";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."auto_reminder_rules" TO "anon";
GRANT ALL ON TABLE "public"."auto_reminder_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."auto_reminder_rules" TO "service_role";



GRANT ALL ON TABLE "public"."c_classification_question_mapping" TO "anon";
GRANT ALL ON TABLE "public"."c_classification_question_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."c_classification_question_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."cancel_reasons" TO "anon";
GRANT ALL ON TABLE "public"."cancel_reasons" TO "authenticated";
GRANT ALL ON TABLE "public"."cancel_reasons" TO "service_role";



GRANT ALL ON TABLE "public"."clinic_settings" TO "anon";
GRANT ALL ON TABLE "public"."clinic_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."clinic_settings" TO "service_role";



GRANT ALL ON TABLE "public"."clinic_training_customizations" TO "anon";
GRANT ALL ON TABLE "public"."clinic_training_customizations" TO "authenticated";
GRANT ALL ON TABLE "public"."clinic_training_customizations" TO "service_role";



GRANT ALL ON TABLE "public"."clinics" TO "anon";
GRANT ALL ON TABLE "public"."clinics" TO "authenticated";
GRANT ALL ON TABLE "public"."clinics" TO "service_role";



GRANT ALL ON TABLE "public"."daily_memos" TO "anon";
GRANT ALL ON TABLE "public"."daily_memos" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_memos" TO "service_role";



GRANT ALL ON TABLE "public"."device_accounts" TO "anon";
GRANT ALL ON TABLE "public"."device_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."device_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."disease_codes" TO "anon";
GRANT ALL ON TABLE "public"."disease_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."disease_codes" TO "service_role";



GRANT ALL ON TABLE "public"."disease_treatment_set_mapping" TO "anon";
GRANT ALL ON TABLE "public"."disease_treatment_set_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."disease_treatment_set_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."document_templates" TO "anon";
GRANT ALL ON TABLE "public"."document_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."document_templates" TO "service_role";



GRANT ALL ON TABLE "public"."evaluation_issue_rules" TO "anon";
GRANT ALL ON TABLE "public"."evaluation_issue_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluation_issue_rules" TO "service_role";



GRANT ALL ON TABLE "public"."facilities" TO "anon";
GRANT ALL ON TABLE "public"."facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."facilities" TO "service_role";



GRANT ALL ON TABLE "public"."hp_tab_click_events" TO "anon";
GRANT ALL ON TABLE "public"."hp_tab_click_events" TO "authenticated";
GRANT ALL ON TABLE "public"."hp_tab_click_events" TO "service_role";



GRANT ALL ON TABLE "public"."individual_holidays" TO "anon";
GRANT ALL ON TABLE "public"."individual_holidays" TO "authenticated";
GRANT ALL ON TABLE "public"."individual_holidays" TO "service_role";



GRANT ALL ON TABLE "public"."issue_training_mappings" TO "anon";
GRANT ALL ON TABLE "public"."issue_training_mappings" TO "authenticated";
GRANT ALL ON TABLE "public"."issue_training_mappings" TO "service_role";



GRANT ALL ON TABLE "public"."lab_orders" TO "anon";
GRANT ALL ON TABLE "public"."lab_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."lab_orders" TO "service_role";



GRANT ALL ON TABLE "public"."labs" TO "anon";
GRANT ALL ON TABLE "public"."labs" TO "authenticated";
GRANT ALL ON TABLE "public"."labs" TO "service_role";



GRANT ALL ON TABLE "public"."line_conversation_states" TO "anon";
GRANT ALL ON TABLE "public"."line_conversation_states" TO "authenticated";
GRANT ALL ON TABLE "public"."line_conversation_states" TO "service_role";



GRANT ALL ON TABLE "public"."line_invitation_codes" TO "anon";
GRANT ALL ON TABLE "public"."line_invitation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."line_invitation_codes" TO "service_role";



GRANT ALL ON TABLE "public"."line_patient_linkages" TO "anon";
GRANT ALL ON TABLE "public"."line_patient_linkages" TO "authenticated";
GRANT ALL ON TABLE "public"."line_patient_linkages" TO "service_role";



GRANT ALL ON TABLE "public"."line_qr_tokens" TO "anon";
GRANT ALL ON TABLE "public"."line_qr_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."line_qr_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."line_rich_menus" TO "anon";
GRANT ALL ON TABLE "public"."line_rich_menus" TO "authenticated";
GRANT ALL ON TABLE "public"."line_rich_menus" TO "service_role";



GRANT ALL ON TABLE "public"."line_user_links" TO "anon";
GRANT ALL ON TABLE "public"."line_user_links" TO "authenticated";
GRANT ALL ON TABLE "public"."line_user_links" TO "service_role";



GRANT ALL ON TABLE "public"."lip_closure_tests" TO "anon";
GRANT ALL ON TABLE "public"."lip_closure_tests" TO "authenticated";
GRANT ALL ON TABLE "public"."lip_closure_tests" TO "service_role";



GRANT ALL ON TABLE "public"."medical_documents" TO "anon";
GRANT ALL ON TABLE "public"."medical_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_documents" TO "service_role";



GRANT ALL ON TABLE "public"."medical_records" TO "anon";
GRANT ALL ON TABLE "public"."medical_records" TO "authenticated";
GRANT ALL ON TABLE "public"."medical_records" TO "service_role";



GRANT ALL ON TABLE "public"."medicine_codes" TO "anon";
GRANT ALL ON TABLE "public"."medicine_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."medicine_codes" TO "service_role";



GRANT ALL ON TABLE "public"."memo_templates" TO "anon";
GRANT ALL ON TABLE "public"."memo_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."memo_templates" TO "service_role";



GRANT ALL ON TABLE "public"."menu_trainings" TO "anon";
GRANT ALL ON TABLE "public"."menu_trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_trainings" TO "service_role";



GRANT ALL ON TABLE "public"."notification_failure_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_failure_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_failure_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."operation_logs" TO "anon";
GRANT ALL ON TABLE "public"."operation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."operation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."oral_function_assessments" TO "anon";
GRANT ALL ON TABLE "public"."oral_function_assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."oral_function_assessments" TO "service_role";



GRANT ALL ON TABLE "public"."patient_acquisition_channels" TO "anon";
GRANT ALL ON TABLE "public"."patient_acquisition_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_acquisition_channels" TO "service_role";



GRANT ALL ON TABLE "public"."patient_acquisition_sources" TO "anon";
GRANT ALL ON TABLE "public"."patient_acquisition_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_acquisition_sources" TO "service_role";



GRANT ALL ON TABLE "public"."patient_icons" TO "anon";
GRANT ALL ON TABLE "public"."patient_icons" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_icons" TO "service_role";



GRANT ALL ON TABLE "public"."patient_issue_records" TO "anon";
GRANT ALL ON TABLE "public"."patient_issue_records" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_issue_records" TO "service_role";



GRANT ALL ON TABLE "public"."patient_issues" TO "anon";
GRANT ALL ON TABLE "public"."patient_issues" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_issues" TO "service_role";



GRANT ALL ON TABLE "public"."patient_note_types" TO "anon";
GRANT ALL ON TABLE "public"."patient_note_types" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_note_types" TO "service_role";



GRANT ALL ON TABLE "public"."patient_notes" TO "anon";
GRANT ALL ON TABLE "public"."patient_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notes" TO "service_role";



GRANT ALL ON TABLE "public"."patient_notification_analytics" TO "anon";
GRANT ALL ON TABLE "public"."patient_notification_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notification_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."patient_notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."patient_notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."patient_notification_schedules" TO "anon";
GRANT ALL ON TABLE "public"."patient_notification_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_notification_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."patient_qr_codes" TO "anon";
GRANT ALL ON TABLE "public"."patient_qr_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_qr_codes" TO "service_role";



GRANT ALL ON TABLE "public"."patient_web_booking_settings" TO "anon";
GRANT ALL ON TABLE "public"."patient_web_booking_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_web_booking_settings" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."periodontal_examinations" TO "anon";
GRANT ALL ON TABLE "public"."periodontal_examinations" TO "authenticated";
GRANT ALL ON TABLE "public"."periodontal_examinations" TO "service_role";



GRANT ALL ON TABLE "public"."periodontal_tooth_data" TO "anon";
GRANT ALL ON TABLE "public"."periodontal_tooth_data" TO "authenticated";
GRANT ALL ON TABLE "public"."periodontal_tooth_data" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_questions" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_questions" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaire_responses" TO "anon";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaire_responses" TO "service_role";



GRANT ALL ON TABLE "public"."questionnaires" TO "anon";
GRANT ALL ON TABLE "public"."questionnaires" TO "authenticated";
GRANT ALL ON TABLE "public"."questionnaires" TO "service_role";



GRANT ALL ON TABLE "public"."receipts" TO "anon";
GRANT ALL ON TABLE "public"."receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."receipts" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."sales_import_history" TO "anon";
GRANT ALL ON TABLE "public"."sales_import_history" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_import_history" TO "service_role";



GRANT ALL ON TABLE "public"."self_pay_treatments" TO "anon";
GRANT ALL ON TABLE "public"."self_pay_treatments" TO "authenticated";
GRANT ALL ON TABLE "public"."self_pay_treatments" TO "service_role";



GRANT ALL ON TABLE "public"."shift_patterns" TO "anon";
GRANT ALL ON TABLE "public"."shift_patterns" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_patterns" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."staff_evaluation_results" TO "anon";
GRANT ALL ON TABLE "public"."staff_evaluation_results" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_evaluation_results" TO "service_role";



GRANT ALL ON TABLE "public"."staff_evaluation_settings" TO "anon";
GRANT ALL ON TABLE "public"."staff_evaluation_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_evaluation_settings" TO "service_role";



GRANT ALL ON TABLE "public"."staff_positions" TO "anon";
GRANT ALL ON TABLE "public"."staff_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_positions" TO "service_role";



GRANT ALL ON TABLE "public"."staff_shifts" TO "anon";
GRANT ALL ON TABLE "public"."staff_shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_shifts" TO "service_role";



GRANT ALL ON TABLE "public"."staff_unit_priorities" TO "anon";
GRANT ALL ON TABLE "public"."staff_unit_priorities" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_unit_priorities" TO "service_role";



GRANT ALL ON TABLE "public"."subkarte_attachments" TO "anon";
GRANT ALL ON TABLE "public"."subkarte_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."subkarte_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."subkarte_audio" TO "anon";
GRANT ALL ON TABLE "public"."subkarte_audio" TO "authenticated";
GRANT ALL ON TABLE "public"."subkarte_audio" TO "service_role";



GRANT ALL ON TABLE "public"."subkarte_entries" TO "anon";
GRANT ALL ON TABLE "public"."subkarte_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."subkarte_entries" TO "service_role";



GRANT ALL ON TABLE "public"."subkarte_handwriting" TO "anon";
GRANT ALL ON TABLE "public"."subkarte_handwriting" TO "authenticated";
GRANT ALL ON TABLE "public"."subkarte_handwriting" TO "service_role";



GRANT ALL ON TABLE "public"."subkarte_templates" TO "anon";
GRANT ALL ON TABLE "public"."subkarte_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."subkarte_templates" TO "service_role";



GRANT ALL ON TABLE "public"."system_cancel_reasons" TO "anon";
GRANT ALL ON TABLE "public"."system_cancel_reasons" TO "authenticated";
GRANT ALL ON TABLE "public"."system_cancel_reasons" TO "service_role";



GRANT ALL ON TABLE "public"."system_notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."system_notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."system_notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."system_questionnaire_template_questions" TO "anon";
GRANT ALL ON TABLE "public"."system_questionnaire_template_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."system_questionnaire_template_questions" TO "service_role";



GRANT ALL ON TABLE "public"."system_questionnaire_templates" TO "anon";
GRANT ALL ON TABLE "public"."system_questionnaire_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."system_questionnaire_templates" TO "service_role";



GRANT ALL ON TABLE "public"."system_staff_positions" TO "anon";
GRANT ALL ON TABLE "public"."system_staff_positions" TO "authenticated";
GRANT ALL ON TABLE "public"."system_staff_positions" TO "service_role";



GRANT ALL ON TABLE "public"."template_trainings" TO "anon";
GRANT ALL ON TABLE "public"."template_trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."template_trainings" TO "service_role";



GRANT ALL ON TABLE "public"."templates" TO "anon";
GRANT ALL ON TABLE "public"."templates" TO "authenticated";
GRANT ALL ON TABLE "public"."templates" TO "service_role";



GRANT ALL ON TABLE "public"."tracking_tags" TO "anon";
GRANT ALL ON TABLE "public"."tracking_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tracking_tags" TO "service_role";



GRANT ALL ON TABLE "public"."training_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."training_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."training_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."training_menus" TO "anon";
GRANT ALL ON TABLE "public"."training_menus" TO "authenticated";
GRANT ALL ON TABLE "public"."training_menus" TO "service_role";



GRANT ALL ON TABLE "public"."training_records" TO "anon";
GRANT ALL ON TABLE "public"."training_records" TO "authenticated";
GRANT ALL ON TABLE "public"."training_records" TO "service_role";



GRANT ALL ON TABLE "public"."trainings" TO "anon";
GRANT ALL ON TABLE "public"."trainings" TO "authenticated";
GRANT ALL ON TABLE "public"."trainings" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_codes" TO "anon";
GRANT ALL ON TABLE "public"."treatment_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_codes" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_menus" TO "anon";
GRANT ALL ON TABLE "public"."treatment_menus" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_menus" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_plans" TO "anon";
GRANT ALL ON TABLE "public"."treatment_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_plans" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_required_fields" TO "anon";
GRANT ALL ON TABLE "public"."treatment_required_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_required_fields" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_set_items" TO "anon";
GRANT ALL ON TABLE "public"."treatment_set_items" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_set_items" TO "service_role";



GRANT ALL ON TABLE "public"."treatment_sets" TO "anon";
GRANT ALL ON TABLE "public"."treatment_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."treatment_sets" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."visual_examinations" TO "anon";
GRANT ALL ON TABLE "public"."visual_examinations" TO "authenticated";
GRANT ALL ON TABLE "public"."visual_examinations" TO "service_role";



GRANT ALL ON TABLE "public"."visual_tooth_data" TO "anon";
GRANT ALL ON TABLE "public"."visual_tooth_data" TO "authenticated";
GRANT ALL ON TABLE "public"."visual_tooth_data" TO "service_role";



GRANT ALL ON TABLE "public"."web_booking_funnel_events" TO "anon";
GRANT ALL ON TABLE "public"."web_booking_funnel_events" TO "authenticated";
GRANT ALL ON TABLE "public"."web_booking_funnel_events" TO "service_role";



GRANT ALL ON TABLE "public"."web_booking_tokens" TO "anon";
GRANT ALL ON TABLE "public"."web_booking_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."web_booking_tokens" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
