/**
 * Clinic Initialization API Route - Cancel Reasons
 * キャンセル理由の初期化
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

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

    // 既存のキャンセル理由をチェック（重複防止）
    const existingReasons = await prisma.cancel_reasons.findMany({
      where: {
        clinic_id: clinicId
      },
      select: {
        name: true
      }
    })

    const existingNames = new Set(existingReasons.map(r => r.name))

    console.log(`既存のキャンセル理由: ${existingNames.size}件`, Array.from(existingNames))

    // システムテンプレートを取得
    const templates = await prisma.system_cancel_reasons.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        sort_order: 'asc'
      }
    })

    console.log(`キャンセル理由テンプレート: ${templates.length}件`)

    // 重複しないものだけフィルタリング
    const newTemplates = templates.filter(t => !existingNames.has(t.name))

    if (newTemplates.length === 0) {
      console.log('すべてのキャンセル理由が既に存在します')
      return NextResponse.json({
        success: true,
        count: 0,
        errors: []
      })
    }

    console.log(`新規作成するキャンセル理由: ${newTemplates.length}件`, newTemplates.map(t => t.name))

    // 新しいキャンセル理由を作成
    const createPromises = newTemplates.map(template =>
      prisma.cancel_reasons.create({
        data: {
          clinic_id: clinicId,
          template_id: template.id,
          name: template.name,
          description: template.description,
          sort_order: template.sort_order,
          is_active: template.is_active
        }
      })
    )

    await Promise.all(createPromises)

    console.log(`✓ ${newTemplates.length}件のキャンセル理由を作成しました (${templates.length - newTemplates.length}件スキップ)`)

    return NextResponse.json({
      success: true,
      count: newTemplates.length,
      errors: []
    })
  } catch (error: any) {
    console.error('キャンセル理由初期化エラー:', error)
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
