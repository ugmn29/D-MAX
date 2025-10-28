import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/utils/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { clinic_id } = await request.json();

    if (!clinic_id) {
      return NextResponse.json(
        { error: "clinic_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // システムテンプレートを取得
    const { data: systemTemplates, error: fetchError } = await supabase
      .from("system_notification_templates")
      .select("*")
      .order("sort_order", { ascending: true });

    if (fetchError) {
      console.error("システムテンプレート取得エラー:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch system templates" },
        { status: 500 }
      );
    }

    if (!systemTemplates || systemTemplates.length === 0) {
      return NextResponse.json(
        { error: "No system templates found" },
        { status: 404 }
      );
    }

    console.log(`${systemTemplates.length}件のシステムテンプレートを取得しました`);

    // システムテンプレートをクリニック固有のテンプレートとしてコピー
    const clinicTemplates = systemTemplates.map((template) => ({
      clinic_id,
      name: template.name,
      notification_type: template.notification_type,
      message_template: template.message_template,
      line_message: template.line_message,
      email_subject: template.email_subject,
      email_message: template.email_message,
      sms_message: template.sms_message,
      is_system_template: true,
      system_template_id: template.id,
      auto_send_enabled: false, // デフォルトは手動送信
      auto_send_trigger: "manual",
      auto_send_timing_value: template.default_timing_value || 3,
      auto_send_timing_unit: template.default_timing_unit || "days_before",
    }));

    // 一括挿入
    const { data: insertedTemplates, error: insertError } = await supabase
      .from("notification_templates")
      .insert(clinicTemplates)
      .select();

    if (insertError) {
      console.error("テンプレート挿入エラー:", insertError);
      return NextResponse.json(
        { error: "Failed to insert templates", details: insertError },
        { status: 500 }
      );
    }

    console.log(`${insertedTemplates?.length}件のテンプレートを初期化しました`);

    return NextResponse.json({
      success: true,
      message: `${insertedTemplates?.length}件のテンプレートを初期化しました`,
      templates: insertedTemplates,
    });
  } catch (error) {
    console.error("テンプレート初期化エラー:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
