import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

/**
 * POST /api/notification-templates/init
 * システムテンプレートからクリニック固有のテンプレートを初期化
 */
export async function POST(request: NextRequest) {
  try {
    const { clinic_id } = await request.json()

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 既存のテンプレートをチェック（重複防止）
    const existingTemplates = await prisma.notification_templates.findMany({
      where: { clinic_id },
      select: {
        notification_type: true,
        name: true
      }
    })

    // 既存のnotification_type + nameの組み合わせを取得（重複防止）
    const existingKeys = new Set(
      existingTemplates.map(t => `${t.notification_type}:${t.name}`)
    )

    // システムテンプレートを取得
    const systemTemplates = await prisma.system_notification_templates.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' }
    })

    if (!systemTemplates || systemTemplates.length === 0) {
      return NextResponse.json(
        { error: 'No system templates found' },
        { status: 404 }
      )
    }

    console.log(`${systemTemplates.length}件のシステムテンプレートを取得しました`)
    console.log(`既存のテンプレート数: ${existingTemplates.length}件`)

    // 重複しないテンプレートのみをフィルタリング
    const newTemplates = systemTemplates.filter(
      template => !existingKeys.has(`${template.notification_type}:${template.name}`)
    )

    if (newTemplates.length === 0) {
      console.log('すべてのテンプレートが既に存在します')
      return NextResponse.json({
        success: true,
        message: 'すべてのテンプレートが既に存在します',
        templates: [],
        skipped: systemTemplates.length
      })
    }

    // 新しいテンプレートのみをクリニック固有のテンプレートとしてコピー
    const clinicTemplatesData = newTemplates.map((template) => ({
      clinic_id,
      name: template.name,
      notification_type: template.notification_type,
      message_template: template.line_message || template.message_template || '',
      line_message: template.line_message,
      email_subject: template.email_subject,
      email_message: template.email_message,
      sms_message: template.sms_message,
      default_timing_value: template.default_timing_value ?? 3,
      default_timing_unit: template.default_timing_unit ?? 'days',
      default_web_booking_menu_ids: [] as string[],
      template_id: template.id
    }))

    // 一括挿入 (createMany はデフォルトで返り値を返さないため、個別に作成)
    const insertedTemplates = await Promise.all(
      clinicTemplatesData.map(data =>
        prisma.notification_templates.create({ data })
      )
    )

    const skippedCount = systemTemplates.length - newTemplates.length
    console.log(`${insertedTemplates.length}件のテンプレートを初期化しました（${skippedCount}件はスキップ）`)

    const result = insertedTemplates.map(t =>
      convertDatesToStrings(t, [...DATE_FIELDS])
    )

    return NextResponse.json({
      success: true,
      message: `${insertedTemplates.length}件のテンプレートを初期化しました`,
      templates: result,
      skipped: skippedCount
    })
  } catch (error) {
    console.error('テンプレート初期化エラー:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
