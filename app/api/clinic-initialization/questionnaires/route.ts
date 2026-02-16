/**
 * Clinic Initialization API Route - Questionnaires
 * 問診表テンプレートのコピー
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * POST /api/clinic-initialization/questionnaires?clinic_id=xxx
 * Copy all active system questionnaire templates to clinic
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const templateId = searchParams.get('template_id')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    // If template_id is provided, copy a single template
    if (templateId) {
      return await copySingleTemplate(clinicId, templateId)
    }

    // Otherwise, copy all active templates
    return await copyAllTemplates(clinicId)
  } catch (error: any) {
    console.error('問診表初期化エラー:', error)
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

async function copySingleTemplate(clinicId: string, templateId: string) {
  // 1. Get system template
  const template = await prisma.system_questionnaire_templates.findUnique({
    where: { id: templateId }
  })

  if (!template) {
    return NextResponse.json(
      { success: false, error: 'テンプレートが見つかりません' },
      { status: 404 }
    )
  }

  // 2. Get template questions
  const questions = await prisma.system_questionnaire_template_questions.findMany({
    where: { template_id: templateId },
    orderBy: { sort_order: 'asc' }
  })

  // 3. Check if already copied
  const existing = await prisma.questionnaires.findFirst({
    where: {
      clinic_id: clinicId,
      template_id: templateId
    },
    select: { id: true }
  })

  if (existing) {
    console.log(`Template ${templateId} already copied to clinic ${clinicId}`)
    return NextResponse.json({
      success: true,
      questionnaireId: existing.id
    })
  }

  // 4. Create clinic-specific questionnaire with questions in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const newQuestionnaire = await tx.questionnaires.create({
      data: {
        clinic_id: clinicId,
        template_id: templateId,
        name: template.name,
        description: template.description || '',
        is_active: true
      }
    })

    // 5. Copy questions
    if (questions.length > 0) {
      const newQuestions = questions.map(q => ({
        questionnaire_id: newQuestionnaire.id,
        section_name: q.section_name,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options as any,
        is_required: q.is_required,
        conditional_logic: q.conditional_logic as any,
        sort_order: q.sort_order,
        linked_field: q.linked_field
      }))

      await tx.questionnaire_questions.createMany({
        data: newQuestions
      })
    }

    return newQuestionnaire
  })

  console.log(`Successfully copied template ${templateId} to clinic ${clinicId}`)
  return NextResponse.json({
    success: true,
    questionnaireId: result.id
  })
}

async function copyAllTemplates(clinicId: string) {
  // Get all active system templates
  const templates = await prisma.system_questionnaire_templates.findMany({
    where: { is_active: true },
    orderBy: { sort_order: 'asc' },
    select: { id: true, name: true }
  })

  console.log(`Found ${templates.length} system templates to copy`)

  const errors: string[] = []
  let successCount = 0

  for (const template of templates) {
    try {
      // Check if already copied
      const existing = await prisma.questionnaires.findFirst({
        where: {
          clinic_id: clinicId,
          template_id: template.id
        },
        select: { id: true }
      })

      if (existing) {
        successCount++
        console.log(`Template ${template.name} already exists, skipping`)
        continue
      }

      // Get template questions
      const questions = await prisma.system_questionnaire_template_questions.findMany({
        where: { template_id: template.id },
        orderBy: { sort_order: 'asc' }
      })

      // Create questionnaire with questions in transaction
      await prisma.$transaction(async (tx) => {
        const newQuestionnaire = await tx.questionnaires.create({
          data: {
            clinic_id: clinicId,
            template_id: template.id,
            name: template.name,
            description: '',
            is_active: true
          }
        })

        if (questions.length > 0) {
          await tx.questionnaire_questions.createMany({
            data: questions.map(q => ({
              questionnaire_id: newQuestionnaire.id,
              section_name: q.section_name,
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options as any,
              is_required: q.is_required,
              conditional_logic: q.conditional_logic as any,
              sort_order: q.sort_order,
              linked_field: q.linked_field
            }))
          })
        }
      })

      successCount++
      console.log(`Copied template: ${template.name}`)
    } catch (err: any) {
      errors.push(`${template.name}: ${err.message || '不明なエラー'}`)
      console.error(`Failed to copy template: ${template.name}`, err)
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    count: successCount,
    errors
  })
}
