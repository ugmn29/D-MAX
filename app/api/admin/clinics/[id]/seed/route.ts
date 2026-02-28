import { NextRequest, NextResponse } from 'next/server'
import { initializeClinicMasterData } from '@/lib/api/clinic-initialization'

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

  const results: Record<string, { success: boolean; message: string }> = {}

  // 1. マスタデータ初期化（キャンセル理由・通知テンプレート・問診票）
  try {
    const masterResult = await initializeClinicMasterData(clinicId)
    results.cancel_reasons = { success: true, message: `${masterResult.cancelReasons ?? 0} 件投入` }
    results.notification_templates = { success: true, message: `${masterResult.notificationTemplates ?? 0} 件投入` }
    results.questionnaires = { success: true, message: `${masterResult.questionnaires ?? 0} 件投入` }
  } catch (e: any) {
    results.master_data = { success: false, message: e.message || 'マスタデータ投入に失敗' }
  }

  // 2. トレーニングデータ投入
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const trainingRes = await fetch(`${appUrl}/api/training/clinic/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId }),
    })
    if (trainingRes.ok) {
      const data = await trainingRes.json()
      results.training = { success: true, message: `${data.count ?? 0} 件投入` }
    } else {
      results.training = { success: false, message: 'トレーニングデータ投入に失敗' }
    }
  } catch (e: any) {
    results.training = { success: false, message: e.message || 'トレーニングデータ投入に失敗' }
  }

  return NextResponse.json({ ok: true, results })
}
