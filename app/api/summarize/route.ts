import { NextRequest, NextResponse } from 'next/server'
import { summarizeText, getSummaryTemplates } from '@/lib/api/text-summarization'
import { getPrismaClient } from '@/lib/prisma-client'

export async function POST(request: NextRequest) {
  try {
    const { text, templateId, clinicId, operatorId } = await request.json()

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: '要約するテキストが空です' },
        { status: 400 }
      )
    }

    const startTime = Date.now()
    const result = await summarizeText(text, templateId || 'soap')
    const processingTimeMs = Date.now() - startTime

    // 監査ログ記録（非ブロッキング）
    if (clinicId) {
      logAiInference(clinicId, operatorId, templateId || 'soap', text.length, processingTimeMs)
        .catch(err => console.error('監査ログ記録エラー:', err))
    }

    return NextResponse.json({
      summary: result.summary,
      template: result.template,
      confidence: result.confidence,
      wordCount: result.wordCount,
    })
  } catch (error) {
    console.error('要約API エラー:', error)

    const message = error instanceof Error ? error.message : '要約に失敗しました'
    const isBedrockError = message.includes('AI要約サービス') || message.includes('Bedrock')

    return NextResponse.json(
      {
        error: '要約に失敗しました',
        details: process.env.NODE_ENV === 'development' ? message : undefined
      },
      { status: isBedrockError ? 503 : 500 }
    )
  }
}

/**
 * AI推論の監査ログを記録
 * 患者データ（テキスト内容）は含めず、メタデータのみ記録
 */
async function logAiInference(
  clinicId: string,
  operatorId: string | null,
  templateId: string,
  inputLength: number,
  processingTimeMs: number
) {
  const prisma = getPrismaClient()
  await prisma.operation_logs.create({
    data: {
      clinic_id: clinicId,
      operator_id: operatorId || undefined,
      action_type: 'AI_SUMMARIZE',
      target_table: 'subkarte_entries',
      target_record_id: '00000000-0000-0000-0000-000000000000',
      after_data: {
        template_id: templateId,
        input_char_count: inputLength,
        processing_time_ms: processingTimeMs,
        model: 'claude-sonnet-4-5',
        provider: 'aws-bedrock-cris',
        region: 'ap-northeast-1',
      },
    },
  })
}

export async function GET() {
  try {
    const templates = getSummaryTemplates().map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
    }))
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('テンプレート取得エラー:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
