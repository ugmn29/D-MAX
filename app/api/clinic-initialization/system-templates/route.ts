/**
 * Clinic Initialization API Route - System Templates
 * システム問診表テンプレートの取得
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/clinic-initialization/system-templates
 * Get all active system questionnaire templates with their questions
 */
export async function GET() {
  try {
    const templates = await prisma.system_questionnaire_templates.findMany({
      where: {
        is_active: true
      },
      include: {
        system_questionnaire_template_questions: {
          select: {
            id: true,
            section_name: true,
            question_text: true,
            question_type: true,
            options: true,
            is_required: true,
            conditional_logic: true,
            sort_order: true,
            linked_field: true
          },
          orderBy: {
            sort_order: 'asc'
          }
        }
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('システムテンプレート取得エラー:', error)
    return NextResponse.json(
      { error: error.message || 'システムテンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
