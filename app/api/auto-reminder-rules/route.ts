import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/utils/supabase-client";

// GET: 自動リマインドルールの取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clinic_id = searchParams.get("clinic_id");

    if (!clinic_id) {
      return NextResponse.json(
        { error: "clinic_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("auto_reminder_rules")
      .select("*")
      .eq("clinic_id", clinic_id)
      .single();

    if (error) {
      // レコードが存在しない場合はデフォルト値を返す
      if (error.code === "PGRST116") {
        return NextResponse.json({
          enabled: false,
          intervals: [
            { sequence: 1, months: 3 },
            { sequence: 2, months: 3 },
            { sequence: 3, months: 6 },
          ],
          on_cancel_resend_enabled: false,
          fallback_enabled: false,
          optimize_send_time: true,
          default_send_hour: 18,
        });
      }
      console.error("自動リマインドルール取得エラー:", error);
      return NextResponse.json(
        { error: "Failed to fetch auto reminder rule" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("自動リマインドルール取得エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 自動リマインドルールの作成・更新
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clinic_id, enabled, intervals, template_id } = body;

    if (!clinic_id) {
      return NextResponse.json(
        { error: "clinic_id is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // intervalsを正しいJSON形式に変換
    const formattedIntervals = intervals || [
      { sequence: 1, months: 3 },
      { sequence: 2, months: 3 },
      { sequence: 3, months: 6 },
    ];

    // UPSERTで作成または更新
    const { data, error } = await supabase
      .from("auto_reminder_rules")
      .upsert(
        {
          clinic_id,
          enabled: enabled ?? false,
          intervals: formattedIntervals,
          on_cancel_resend_enabled: body.on_cancel_resend_enabled ?? false,
          on_cancel_resend_delay_days: body.on_cancel_resend_delay_days,
          on_cancel_resend_template_id: template_id,
          fallback_enabled: body.fallback_enabled ?? false,
          fallback_order: body.fallback_order ?? ["line", "email", "sms"],
          optimize_send_time: body.optimize_send_time ?? true,
          default_send_hour: body.default_send_hour ?? 18,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "clinic_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("自動リマインドルール保存エラー:", error);
      return NextResponse.json(
        { error: "Failed to save auto reminder rule", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("自動リマインドルール保存エラー:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
