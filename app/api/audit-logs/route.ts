import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { verifyAdmin } from '@/lib/auth/verify-request'

// GET /api/audit-logs?start=yyyy-mm-dd&end=yyyy-mm-dd&action_type=UPDATE&target_table=patients&format=csv
// 管理者のみアクセス可能
export async function GET(request: NextRequest) {
  // 管理者認証
  let user
  try {
    user = await verifyAdmin(request)
  } catch {
    return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const actionType = searchParams.get('action_type')
    const targetTable = searchParams.get('target_table')
    const format = searchParams.get('format')

    const prisma = getPrismaClient()

    const where: any = { clinic_id: user.clinicId }

    if (start || end) {
      where.created_at = {}
      if (start) where.created_at.gte = new Date(start)
      if (end) {
        // end日付の末尾まで含める
        const endDate = new Date(end)
        endDate.setHours(23, 59, 59, 999)
        where.created_at.lte = endDate
      }
    }

    if (actionType) {
      where.action_type = actionType
    }

    if (targetTable) {
      where.target_table = targetTable
    }

    const logs = await prisma.operation_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 1000,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    // CSVエクスポート対応
    if (format === 'csv') {
      const headers = ['日時', '操作者', '役職', '操作種別', '対象テーブル', '対象レコードID', '変更前', '変更後']
      const rows = logs.map(log => [
        log.created_at?.toISOString() ?? '',
        log.staff?.name ?? '不明',
        log.staff?.role ?? '',
        log.action_type,
        log.target_table,
        log.target_record_id,
        JSON.stringify(log.before_data ?? {}),
        JSON.stringify(log.after_data ?? {}),
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // JSON レスポンス
    const formattedLogs = logs.map(log => ({
      id: log.id,
      created_at: log.created_at?.toISOString(),
      action_type: log.action_type,
      target_table: log.target_table,
      target_record_id: log.target_record_id,
      operator: log.staff ? { id: log.staff.id, name: log.staff.name, role: log.staff.role } : null,
      before_data: log.before_data,
      after_data: log.after_data,
    }))

    return NextResponse.json({ success: true, data: formattedLogs, total: formattedLogs.length })
  } catch (error) {
    console.error('[監査ログAPI] 取得エラー:', error)
    return NextResponse.json({ error: '処理中にエラーが発生しました' }, { status: 500 })
  }
}
