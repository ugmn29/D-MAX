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
    const { clinic_id, name, notification_type, channel, subject, message } = body

    if (!clinic_id || !name || !notification_type || !message) {
      return NextResponse.json(
        { error: 'clinic_id, name, notification_type, and message are required' },
        { status: 400 }
      )
    }

    const template = await createNotificationTemplate({
      clinic_id,
      name,
      notification_type,
      message_template: message,
      // チャンネルと件名は追加フィールドとして保存
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
    const { id, name, notification_type, message } = body

    if (!id || !name || !notification_type || !message) {
      return NextResponse.json(
        { error: 'id, name, notification_type, and message are required' },
        { status: 400 }
      )
    }

    const template = await updateNotificationTemplate(id, {
      name,
      notification_type,
      message_template: message
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
