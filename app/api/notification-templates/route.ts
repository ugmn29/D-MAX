import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

/**
 * GET /api/notification-templates?clinic_id=xxx&notification_type=xxx
 * テンプレート一覧を取得（notification_typeで絞り込み可能）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get('clinic_id')
    const notificationType = searchParams.get('notification_type')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const templates = await prisma.notification_templates.findMany({
      where: {
        clinic_id: clinicId,
        ...(notificationType ? { notification_type: notificationType } : {})
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    const result = templates.map(t =>
      convertDatesToStrings(t, [...DATE_FIELDS])
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/notification-templates
 * テンプレートを作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      name,
      notification_type,
      message_template,
      line_message,
      email_subject,
      email_message,
      sms_message,
      auto_send_enabled,
      auto_send_trigger,
      auto_send_timing_value,
      auto_send_timing_unit,
      default_timing_value,
      default_timing_unit,
      default_web_booking_menu_ids,
      default_staff_id
    } = body

    if (!clinic_id || !name || !notification_type) {
      return NextResponse.json(
        { error: 'clinic_id, name, and notification_type are required' },
        { status: 400 }
      )
    }

    // 少なくとも1つのチャネルのメッセージが必要
    if (!line_message && !email_message && !sms_message && !message_template) {
      return NextResponse.json(
        { error: 'At least one channel message is required' },
        { status: 400 }
      )
    }

    // SMS文字数チェック（警告のみ）
    if (sms_message && sms_message.length > 70) {
      console.warn(`SMS message is ${sms_message.length} characters. Recommended: 70 characters or less.`)
    }

    const prisma = getPrismaClient()

    const template = await prisma.notification_templates.create({
      data: {
        clinic_id,
        name,
        notification_type,
        message_template: message_template || line_message || email_message || sms_message || '',
        line_message: line_message ?? null,
        email_subject: email_subject ?? null,
        email_message: email_message ?? null,
        sms_message: sms_message ?? null,
        auto_send_enabled: auto_send_enabled ?? false,
        auto_send_trigger: auto_send_trigger ?? 'manual',
        auto_send_timing_value: auto_send_timing_value ?? null,
        auto_send_timing_unit: auto_send_timing_unit ?? null,
        default_timing_value: default_timing_value ?? null,
        default_timing_unit: default_timing_unit ?? null,
        default_web_booking_menu_ids: default_web_booking_menu_ids ?? [],
        default_staff_id: default_staff_id ?? null
      }
    })

    const result = convertDatesToStrings(template, [...DATE_FIELDS])
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating notification template:', error)
    return NextResponse.json(
      { error: 'Failed to create notification template' },
      { status: 500 }
    )
  }
}
