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

    // 既存のテンプレートをチェック（重複防止）
    const { data: existingTemplates, error: existingError } = await supabase
      .from("notification_templates")
      .select("notification_type, name")
      .eq("clinic_id", clinic_id);

    if (existingError) {
      console.error("既存テンプレート確認エラー:", existingError);
      return NextResponse.json(
        { error: "Failed to check existing templates" },
        { status: 500 }
      );
    }

    // 既存のnotification_type + nameの組み合わせを取得（重複防止）
    const existingKeys = new Set(
      existingTemplates?.map(t => `${t.notification_type}:${t.name}`) || []
    );

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
    console.log(`既存のテンプレート数: ${existingTemplates?.length || 0}件`);

    // 重複しないテンプレートのみをフィルタリング
    const newTemplates = systemTemplates.filter(
      template => !existingKeys.has(`${template.notification_type}:${template.name}`)
    );

    if (newTemplates.length === 0) {
      console.log("すべてのテンプレートが既に存在します");
      return NextResponse.json({
        success: true,
        message: "すべてのテンプレートが既に存在します",
        templates: [],
        skipped: systemTemplates.length
      });
    }

    // 新しいテンプレートのみをクリニック固有のテンプレートとしてコピー
    const clinicTemplates = newTemplates.map((template) => ({
      clinic_id,
      name: template.name,
      notification_type: template.notification_type,
      message_template: template.line_message || template.message_template,
      line_message: template.line_message,
      email_subject: template.email_subject,
      email_message: template.email_message,
      sms_message: template.sms_message,
      default_timing_value: template.default_timing_value || 3,
      default_timing_unit: template.default_timing_unit || 'days',
      template_id: template.id,
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

    const skippedCount = systemTemplates.length - newTemplates.length;
    console.log(`${insertedTemplates?.length}件のテンプレートを初期化しました（${skippedCount}件はスキップ）`);

    return NextResponse.json({
      success: true,
      message: `${insertedTemplates?.length}件のテンプレートを初期化しました`,
      templates: insertedTemplates,
      skipped: skippedCount
    });
  } catch (error) {
    console.error("テンプレート初期化エラー:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
