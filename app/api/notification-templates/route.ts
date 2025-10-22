import { NextRequest, NextResponse } from 'next/server'
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate
} from '@/lib/api/notification-templates'

// GET: テンプレート一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const templates = await getNotificationTemplates(clinicId)
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    )
  }
}

// POST: テンプレートを作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      name,
      notification_type,
      line_message,
      email_subject,
      email_message,
      sms_message,
      auto_send_enabled,
      auto_send_trigger,
      auto_send_timing_value,
      auto_send_timing_unit
    } = body

    if (!clinic_id || !name || !notification_type) {
      return NextResponse.json(
        { error: 'clinic_id, name, and notification_type are required' },
        { status: 400 }
      )
    }

    // 少なくとも1つのチャネルのメッセージが必要
    if (!line_message && !email_message && !sms_message) {
      return NextResponse.json(
        { error: 'At least one channel message is required' },
        { status: 400 }
      )
    }

    // SMS文字数チェック（警告のみ）
    if (sms_message && sms_message.length > 70) {
      console.warn(`SMS message is ${sms_message.length} characters. Recommended: 70 characters or less.`)
    }

    const template = await createNotificationTemplate({
      clinic_id,
      name,
      notification_type,
      message_template: line_message || email_message || sms_message || '',  // 後方互換性用
      line_message,
      email_subject,
      email_message,
      sms_message,
      auto_send_enabled,
      auto_send_trigger,
      auto_send_timing_value,
      auto_send_timing_unit,
      default_timing_value: null,
      default_timing_unit: null,
      default_web_booking_menu_ids: null,
      default_staff_id: null
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating notification template:', error)
    return NextResponse.json(
      { error: 'Failed to create notification template' },
      { status: 500 }
    )
  }
}

// PUT: テンプレートを更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      notification_type,
      line_message,
      email_subject,
      email_message,
      sms_message,
      auto_send_enabled,
      auto_send_trigger,
      auto_send_timing_value,
      auto_send_timing_unit
    } = body

    if (!id || !name || !notification_type) {
      return NextResponse.json(
        { error: 'id, name, and notification_type are required' },
        { status: 400 }
      )
    }

    // SMS文字数チェック（警告のみ）
    if (sms_message && sms_message.length > 70) {
      console.warn(`SMS message is ${sms_message.length} characters. Recommended: 70 characters or less.`)
    }

    const template = await updateNotificationTemplate(id, {
      name,
      notification_type,
      message_template: line_message || email_message || sms_message || '',  // 後方互換性用
      line_message,
      email_subject,
      email_message,
      sms_message,
      auto_send_enabled,
      auto_send_trigger,
      auto_send_timing_value,
      auto_send_timing_unit
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating notification template:', error)
    return NextResponse.json(
      { error: 'Failed to update notification template' },
      { status: 500 }
    )
  }
}

// DELETE: テンプレートを削除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    await deleteNotificationTemplate(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification template:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification template' },
      { status: 500 }
    )
  }
}
