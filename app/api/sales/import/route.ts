/**
 * 売上データCSVインポートAPIエンドポイント
 * POST /api/sales/import
 */

import { NextRequest, NextResponse } from 'next/server'
import { importSalesData } from '@/lib/api/sales-import'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const clinicId = formData.get('clinic_id') as string
    const skipErrors = formData.get('skip_errors') === 'true'
    const dryRun = formData.get('dry_run') === 'true'
    const importedBy = formData.get('imported_by') as string | undefined

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが指定されていません' },
        { status: 400 }
      )
    }

    if (!clinicId) {
      return NextResponse.json(
        { error: 'クリニックIDが指定されていません' },
        { status: 400 }
      )
    }

    // ファイルを読み込み
    const csvText = await file.text()

    // インポート実行
    const result = await importSalesData(csvText, clinicId, {
      skipErrors,
      dryRun,
      importedBy
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'インポート中にエラーが発生しました',
          ...result
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: dryRun
        ? 'テストインポートが完了しました'
        : `${result.success_records}件のデータをインポートしました`,
      ...result
    })
  } catch (error: any) {
    console.error('売上インポートエラー:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'インポート処理中にエラーが発生しました',
        details: error.message
      },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
