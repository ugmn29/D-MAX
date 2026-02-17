import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

interface DeviceAccountsRequest {
  deviceId: string
}

interface DeviceAccount {
  patientId: string
  patientNumber: number
  name: string
  lastLoginAt: string
}

interface DeviceAccountsResponse {
  success: boolean
  accounts?: DeviceAccount[]
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body: DeviceAccountsRequest = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'デバイスIDが必要です' },
        { status: 400 }
      )
    }

    // デバイスに紐づくアカウント一覧を取得（最大5件）
    const deviceAccounts = await prisma.device_accounts.findMany({
      where: {
        device_identifier: deviceId,
      },
      include: {
        patients: {
          select: {
            patient_number: true,
            last_name: true,
            first_name: true,
          },
        },
      },
      orderBy: {
        last_login_at: 'desc',
      },
      take: 5,
    })

    // レスポンス整形
    const accounts: DeviceAccount[] = deviceAccounts.map((da) => ({
      patientId: da.patient_id,
      patientNumber: da.patients.patient_number!,
      name: `${da.patients.last_name} ${da.patients.first_name}`,
      lastLoginAt: da.last_login_at instanceof Date
        ? da.last_login_at.toISOString()
        : da.last_login_at?.toString() || ''
    }))

    return NextResponse.json({
      success: true,
      accounts
    } as DeviceAccountsResponse)

  } catch (error) {
    console.error('Device accounts error:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// アカウント削除API
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const patientId = searchParams.get('patientId')

    if (!deviceId || !patientId) {
      return NextResponse.json(
        { success: false, error: '必要なパラメータが不足しています' },
        { status: 400 }
      )
    }

    // デバイスアカウントを削除
    await prisma.device_accounts.deleteMany({
      where: {
        device_identifier: deviceId,
        patient_id: patientId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'アカウントを削除しました'
    })

  } catch (error) {
    console.error('Delete device account error:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
