import { NextResponse } from 'next/server'
import { initializeClinicMasterData } from '@/lib/api/clinic-initialization'

export async function POST(request: Request) {
  try {
    const { clinicId } = await request.json()

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinicId is required' },
        { status: 400 }
      )
    }

    console.log(`Initializing master data for clinic: ${clinicId}`)

    const result = await initializeClinicMasterData(clinicId)

    if (result.success) {
      const totalCount = result.questionnaires + result.staffPositions + result.cancelReasons + result.notificationTemplates
      return NextResponse.json({
        success: true,
        message: `マスタデータの初期化が完了しました（合計${totalCount}件）`,
        details: {
          questionnaires: result.questionnaires,
          staffPositions: result.staffPositions,
          cancelReasons: result.cancelReasons,
          notificationTemplates: result.notificationTemplates
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'マスタデータの初期化に一部失敗しました',
        errors: result.errors,
        details: {
          questionnaires: result.questionnaires,
          staffPositions: result.staffPositions,
          cancelReasons: result.cancelReasons,
          notificationTemplates: result.notificationTemplates
        }
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error initializing master data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
