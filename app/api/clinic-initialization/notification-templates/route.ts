/**
 * Clinic Initialization API Route - Notification Templates
 * 通知テンプレートの初期化 (Prisma版)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * POST /api/clinic-initialization/notification-templates?clinic_id=xxx
 * Copy all active system notification templates to clinic
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // 既存の通知テンプレートをチェック（重複防止）
    const existingTemplates = await prisma.notification_templates.findMany({
      where: {
        clinic_id: clinicId
      },
      select: {
        notification_type: true,
        name: true
      }
    })

    const existingKeys = new Set(
      existingTemplates.map(t => `${t.notification_type}:${t.name}`)
    )

    console.log(`既存の通知テンプレート: ${existingKeys.size}件`, Array.from(existingKeys))

    // Get all active system notification templates
    const templates = await prisma.system_notification_templates.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    if (!templates || templates.length === 0) {
      console.log('システム通知テンプレートが見つかりません')
      return NextResponse.json({
        success: true,
        count: 0,
        errors: []
      })
    }

    console.log(`通知テンプレート: ${templates.length}件`)

    // 重複しないものだけフィルタリング
    const filteredTemplates = templates.filter(
      t => !existingKeys.has(`${t.notification_type}:${t.name}`)
    )

    if (filteredTemplates.length === 0) {
      console.log('すべての通知テンプレートが既に存在します')
      return NextResponse.json({
        success: true,
        count: 0,
        errors: []
      })
    }

    console.log(`新規作成する通知テンプレート: ${filteredTemplates.length}件`)

    // 新しい通知テンプレートを作成
    const createPromises = filteredTemplates.map(template =>
      prisma.notification_templates.create({
        data: {
          clinic_id: clinicId,
          template_id: template.id,
          name: template.name,
          notification_type: template.notification_type,
          message_template: template.line_message || template.message_template,
          line_message: template.line_message,
          email_subject: template.email_subject,
          email_message: template.email_message,
          sms_message: template.sms_message,
          default_timing_value: template.default_timing_value,
          default_timing_unit: template.default_timing_unit
        }
      })
    )

    await Promise.all(createPromises)

    console.log(`${filteredTemplates.length}件の通知テンプレートを作成しました (${templates.length - filteredTemplates.length}件スキップ)`)

    return NextResponse.json({
      success: true,
      count: filteredTemplates.length,
      errors: []
    })
  } catch (error: any) {
    console.error('通知テンプレート初期化エラー:', error)
    return NextResponse.json(
      {
        success: false,
        count: 0,
        errors: [error.message || '予期しないエラーが発生しました']
      },
      { status: 500 }
    )
  }
}
