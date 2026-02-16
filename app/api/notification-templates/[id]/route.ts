import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

/**
 * GET /api/notification-templates/[id]
 * テンプレートをIDで取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const template = await prisma.notification_templates.findUnique({
      where: { id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    const result = convertDatesToStrings(template, [...DATE_FIELDS])
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notification template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/notification-templates/[id]
 * テンプレートを更新
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
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

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // SMS文字数チェック（警告のみ）
    if (sms_message && sms_message.length > 70) {
      console.warn(`SMS message is ${sms_message.length} characters. Recommended: 70 characters or less.`)
    }

    const prisma = getPrismaClient()

    // 更新データを構築（undefinedのフィールドはスキップ）
    const updateData: Record<string, any> = {
      updated_at: new Date()
    }

    if (name !== undefined) updateData.name = name
    if (notification_type !== undefined) updateData.notification_type = notification_type
    if (line_message !== undefined) updateData.line_message = line_message
    if (email_subject !== undefined) updateData.email_subject = email_subject
    if (email_message !== undefined) updateData.email_message = email_message
    if (sms_message !== undefined) updateData.sms_message = sms_message
    if (auto_send_enabled !== undefined) updateData.auto_send_enabled = auto_send_enabled
    if (auto_send_trigger !== undefined) updateData.auto_send_trigger = auto_send_trigger
    if (auto_send_timing_value !== undefined) updateData.auto_send_timing_value = auto_send_timing_value
    if (auto_send_timing_unit !== undefined) updateData.auto_send_timing_unit = auto_send_timing_unit
    if (default_timing_value !== undefined) updateData.default_timing_value = default_timing_value
    if (default_timing_unit !== undefined) updateData.default_timing_unit = default_timing_unit
    if (default_web_booking_menu_ids !== undefined) updateData.default_web_booking_menu_ids = default_web_booking_menu_ids
    if (default_staff_id !== undefined) updateData.default_staff_id = default_staff_id

    // message_template の後方互換性対応
    if (message_template !== undefined) {
      updateData.message_template = message_template
    } else if (line_message !== undefined || email_message !== undefined || sms_message !== undefined) {
      updateData.message_template = line_message || email_message || sms_message || ''
    }

    const template = await prisma.notification_templates.update({
      where: { id },
      data: updateData
    })

    const result = convertDatesToStrings(template, [...DATE_FIELDS])
    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    console.error('Error updating notification template:', error)
    return NextResponse.json(
      { error: 'Failed to update notification template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/notification-templates/[id]
 * テンプレートを削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    await prisma.notification_templates.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting notification template:', error)
    return NextResponse.json(
      { error: 'Failed to delete notification template' },
      { status: 500 }
    )
  }
}
