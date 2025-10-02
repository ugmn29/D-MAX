import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

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
    const body: DeviceAccountsRequest = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'デバイスIDが必要です' },
        { status: 400 }
      )
    }

    // デバイスに紐づくアカウント一覧を取得（最大5件）
    const { data: deviceAccounts, error: fetchError } = await supabaseAdmin
      .from('device_accounts')
      .select(`
        patient_id,
        last_login_at,
        patients (
          patient_number,
          last_name,
          first_name
        )
      `)
      .eq('device_identifier', deviceId)
      .order('last_login_at', { ascending: false })
      .limit(5)

    if (fetchError) {
      console.error('Fetch device accounts error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'アカウント取得に失敗しました' },
        { status: 500 }
      )
    }

    // レスポンス整形
    const accounts: DeviceAccount[] = deviceAccounts?.map((da: any) => ({
      patientId: da.patient_id,
      patientNumber: da.patients.patient_number,
      name: `${da.patients.last_name} ${da.patients.first_name}`,
      lastLoginAt: da.last_login_at
    })) || []

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
    const { error: deleteError } = await supabaseAdmin
      .from('device_accounts')
      .delete()
      .eq('device_identifier', deviceId)
      .eq('patient_id', patientId)

    if (deleteError) {
      console.error('Delete device account error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'アカウント削除に失敗しました' },
        { status: 500 }
      )
    }

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
