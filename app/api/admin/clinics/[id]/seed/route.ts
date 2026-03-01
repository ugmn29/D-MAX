import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  const prisma = getPrismaClient()
  const results: Record<string, { success: boolean; message: string }> = {}

  // 1. キャンセル理由（システムテンプレートと同期）
  try {
    const existing = await prisma.cancel_reasons.findMany({
      where: { clinic_id: clinicId },
      select: { id: true, name: true, is_active: true },
    })
    const templates = await prisma.system_cancel_reasons.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    const templateNames = new Set(templates.map(t => t.name))
    const existingByName = new Map(existing.map(r => [r.name, r]))

    // テンプレートにない既存レコードを無効化（appointments参照があるため削除ではなく無効化）
    const toDeactivate = existing.filter(r => !templateNames.has(r.name) && r.is_active !== false)
    if (toDeactivate.length > 0) {
      await Promise.all(toDeactivate.map(r =>
        prisma.cancel_reasons.update({ where: { id: r.id }, data: { is_active: false } })
      ))
    }

    // テンプレートにあるが無効化されているものを再有効化
    const toActivate = existing.filter(r => templateNames.has(r.name) && r.is_active === false)
    if (toActivate.length > 0) {
      await Promise.all(toActivate.map(r =>
        prisma.cancel_reasons.update({ where: { id: r.id }, data: { is_active: true } })
      ))
    }

    // 新規追加（名前が存在しないもの）
    const newOnes = templates.filter(t => !existingByName.has(t.name))
    if (newOnes.length > 0) {
      await Promise.all(newOnes.map(t =>
        prisma.cancel_reasons.create({
          data: {
            clinic_id: clinicId,
            template_id: t.id,
            name: t.name,
            description: t.description,
            sort_order: t.sort_order,
            is_active: t.is_active,
          },
        })
      ))
    }

    results.cancel_reasons = {
      success: true,
      message: `新規: ${newOnes.length}件, 無効化: ${toDeactivate.length}件, 再有効化: ${toActivate.length}件`,
    }
  } catch (e: any) {
    results.cancel_reasons = { success: false, message: e.message || 'エラー' }
  }

  // 2. 通知テンプレート
  try {
    const existing = await prisma.notification_templates.findMany({
      where: { clinic_id: clinicId },
      select: { notification_type: true, name: true },
    })
    const existingKeys = new Set(existing.map(t => `${t.notification_type}:${t.name}`))
    const templates = await prisma.system_notification_templates.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
    })
    const newOnes = templates.filter(t => !existingKeys.has(`${t.notification_type}:${t.name}`))
    if (newOnes.length > 0) {
      await Promise.all(newOnes.map(t =>
        prisma.notification_templates.create({
          data: {
            clinic_id: clinicId,
            template_id: t.id,
            name: t.name,
            notification_type: t.notification_type,
            message_template: t.line_message || t.message_template,
            line_message: t.line_message,
            email_subject: t.email_subject,
            email_message: t.email_message,
            sms_message: t.sms_message,
            default_timing_value: t.default_timing_value,
            default_timing_unit: t.default_timing_unit,
          },
        })
      ))
    }
    results.notification_templates = { success: true, message: `${newOnes.length} 件投入` }
  } catch (e: any) {
    results.notification_templates = { success: false, message: e.message || 'エラー' }
  }

  // 3. 問診票
  try {
    const templates = await prisma.system_questionnaire_templates.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' },
      select: { id: true, name: true },
    })
    let count = 0
    for (const tmpl of templates) {
      const exists = await prisma.questionnaires.findFirst({
        where: { clinic_id: clinicId, template_id: tmpl.id },
        select: { id: true },
      })
      if (exists) continue
      const questions = await prisma.system_questionnaire_template_questions.findMany({
        where: { template_id: tmpl.id },
        orderBy: { sort_order: 'asc' },
      })
      await prisma.$transaction(async tx => {
        const q = await tx.questionnaires.create({
          data: { clinic_id: clinicId, template_id: tmpl.id, name: tmpl.name, description: '', is_active: true },
        })
        if (questions.length > 0) {
          await tx.questionnaire_questions.createMany({
            data: questions.map(q2 => ({
              questionnaire_id: q.id,
              section_name: q2.section_name,
              question_text: q2.question_text,
              question_type: q2.question_type,
              options: q2.options as any,
              is_required: q2.is_required,
              conditional_logic: q2.conditional_logic as any,
              sort_order: q2.sort_order,
              linked_field: q2.linked_field,
            })),
          })
        }
      })
      count++
    }
    results.questionnaires = { success: true, message: `${count} 件投入` }
  } catch (e: any) {
    results.questionnaires = { success: false, message: e.message || 'エラー' }
  }

  // 4. トレーニングデータ（グローバル is_default=true、トレーニングseedAPIで管理）
  try {
    const existingCount = await prisma.trainings.count({ where: { is_default: true } })
    results.training = { success: true, message: `既存 ${existingCount} 件` }
  } catch (e: any) {
    results.training = { success: false, message: e.message || 'エラー' }
  }

  return NextResponse.json({ ok: true, results })
}
