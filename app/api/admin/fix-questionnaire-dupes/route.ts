import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST /api/admin/fix-questionnaire-dupes
 * 問診票の重複質問を削除
 * section_name + question_text が同じ質問が同一questionnaire内に複数ある場合、最初の1件を残して削除
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    const where = clinicId ? { clinic_id: clinicId } : {}
    const questionnaires = await prisma.questionnaires.findMany({
      where,
      select: { id: true, name: true, clinic_id: true }
    })

    const results: any[] = []
    let totalDeleted = 0

    for (const questionnaire of questionnaires) {
      const questions = await prisma.questionnaire_questions.findMany({
        where: { questionnaire_id: questionnaire.id },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }]
      })

      // section_name + question_text でグループ化
      const groups = new Map<string, typeof questions>()
      for (const q of questions) {
        const key = `${q.section_name || ''}||${q.question_text}`
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(q)
      }

      const deleteIds: string[] = []
      for (const [, items] of groups) {
        if (items.length > 1) {
          // 最初の1件を残し、残りを削除
          for (let i = 1; i < items.length; i++) {
            deleteIds.push(items[i].id)
          }
        }
      }

      if (deleteIds.length > 0) {
        await prisma.questionnaire_questions.deleteMany({
          where: { id: { in: deleteIds } }
        })
        totalDeleted += deleteIds.length
        results.push({
          questionnaireId: questionnaire.id,
          name: questionnaire.name,
          deletedCount: deleteIds.length,
          before: questions.length,
          after: questions.length - deleteIds.length
        })
      } else {
        results.push({
          questionnaireId: questionnaire.id,
          name: questionnaire.name,
          deletedCount: 0,
          before: questions.length,
          after: questions.length
        })
      }
    }

    console.log(`問診票重複質問削除完了: ${totalDeleted}件削除`)

    return NextResponse.json({
      success: true,
      totalQuestionnaires: questionnaires.length,
      totalDeleted,
      results
    })
  } catch (error: any) {
    console.error('問診票重複質問削除エラー:', error)
    return NextResponse.json(
      { error: error.message || '重複質問の削除に失敗しました' },
      { status: 500 }
    )
  }
}
