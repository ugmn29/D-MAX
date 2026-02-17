import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET() {
  try {
    const prisma = getPrismaClient()

    // 環境変数チェック
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30),
      isMockMode: process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
    }

    // データベース接続チェック
    let dbCheck: any
    try {
      const settings = await prisma.clinic_settings.findFirst({
        where: {
          clinic_id: '11111111-1111-1111-1111-111111111111',
          setting_key: 'web_reservation'
        },
        select: { setting_key: true, setting_value: true }
      })

      const settingValue = settings?.setting_value as any

      dbCheck = {
        canConnect: true,
        hasWebReservationSettings: !!settings,
        isEnabled: settingValue?.isEnabled,
        error: null
      }

      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          ...envCheck
        },
        database: {
          ...dbCheck,
          webReservationSettings: settingValue
        }
      })
    } catch (dbError: any) {
      dbCheck = {
        canConnect: false,
        hasWebReservationSettings: false,
        isEnabled: false,
        error: {
          message: dbError.message
        }
      }

      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
          ...envCheck
        },
        database: {
          ...dbCheck,
          webReservationSettings: null
        }
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}
