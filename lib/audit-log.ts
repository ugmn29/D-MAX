import { getPrismaClient } from '@/lib/prisma-client'

// リスト操作（特定レコードを指定しない READ）用のセンチネルUUID
const LIST_OPERATION_ID = '00000000-0000-0000-0000-000000000000'

export async function writeAuditLog(params: {
  clinicId: string
  operatorId?: string | null
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  targetTable: string
  targetRecordId?: string
  beforeData?: object
  afterData?: object
}): Promise<void> {
  try {
    const prisma = getPrismaClient()
    await prisma.operation_logs.create({
      data: {
        clinic_id: params.clinicId,
        operator_id: params.operatorId ?? null,
        action_type: params.actionType,
        target_table: params.targetTable,
        target_record_id: params.targetRecordId ?? LIST_OPERATION_ID,
        before_data: params.beforeData ?? {},
        after_data: params.afterData ?? {},
      },
    })
  } catch (error) {
    // ログ失敗はメイン処理に影響させない
    console.error('[AuditLog] Failed to write audit log:', error)
  }
}
