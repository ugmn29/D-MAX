import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings, convertArrayDatesToStrings } from '@/lib/prisma-helpers'
import { DEFAULT_DOCUMENT_TEMPLATES } from '@/lib/data/default-document-templates'

// デフォルトテンプレートを初期化
async function initializeDefaultTemplates() {
  const prisma = getPrismaClient()
  console.log('Initializing default document templates...')

  const insertData = DEFAULT_DOCUMENT_TEMPLATES.map(template => ({
    document_type: template.document_type,
    template_key: template.template_key,
    template_name: template.template_name,
    template_data: template.template_data,
    display_order: template.display_order,
    is_active: true
  }))

  try {
    await prisma.document_templates.createMany({
      data: insertData
    })
    console.log(`Initialized ${insertData.length} default document templates`)
    return true
  } catch (error) {
    console.error('Error initializing default templates:', error)
    return false
  }
}

// GET - テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const documentType = searchParams.get('documentType')
    const prisma = getPrismaClient()

    // まず全件数をチェック（初期化が必要かどうか）
    const totalCount = await prisma.document_templates.count()

    // テーブルが空の場合、デフォルトテンプレートを初期化
    if (totalCount === 0) {
      await initializeDefaultTemplates()
    }

    const where: any = { is_active: true }
    if (documentType) {
      where.document_type = documentType
    }

    const data = await prisma.document_templates.findMany({
      where,
      orderBy: { display_order: 'asc' }
    })

    const result = convertArrayDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/document-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 新規テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    const data = await prisma.document_templates.create({
      data: {
        document_type: body.document_type,
        template_key: body.template_key,
        template_name: body.template_name,
        template_data: body.template_data,
        display_order: body.display_order || 0
      }
    })

    const result = convertDatesToStrings(data, ['created_at', 'updated_at'])

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/document-templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
