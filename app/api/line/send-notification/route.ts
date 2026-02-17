import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import {
  getLineSettings,
  sendFlexMessage,
  sendTextMessage,
  createAppointmentReminderFlex,
  createPeriodicCheckupFlex
} from '@/lib/line/messaging'

/**
 * POST /api/line/send-notification
 * 通知テンプレートを使ってLINE通知を送信
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const {
      clinic_id,
      patient_id,
      notification_type,
      template_id,
      custom_data
    } = body

    // バリデーション
    if (!clinic_id) {
      return NextResponse.json(
        { error: 'クリニックIDは必須です' },
        { status: 400 }
      )
    }

    if (!patient_id) {
      return NextResponse.json(
        { error: '患者IDは必須です' },
        { status: 400 }
      )
    }

    if (!notification_type) {
      return NextResponse.json(
        { error: '通知タイプは必須です' },
        { status: 400 }
      )
    }

    // 1. 患者のLINE連携情報を取得
    const linkage = await prisma.line_patient_linkages.findFirst({
      where: {
        patient_id,
        is_primary: true
      },
      select: {
        line_user_id: true,
        is_primary: true
      }
    })

    if (!linkage) {
      return NextResponse.json(
        { error: 'この患者はLINE連携されていません' },
        { status: 404 }
      )
    }

    const lineUserId = linkage.line_user_id

    // 2. 患者情報を取得
    const patient = await prisma.patients.findUnique({
      where: { id: patient_id },
      select: { last_name: true, first_name: true }
    })

    if (!patient) {
      return NextResponse.json(
        { error: '患者情報が見つかりません' },
        { status: 404 }
      )
    }

    const patientName = `${patient.last_name} ${patient.first_name}`

    // 3. クリニック情報を取得
    const clinic = await prisma.clinics.findUnique({
      where: { id: clinic_id },
      select: { name: true }
    })

    if (!clinic) {
      return NextResponse.json(
        { error: 'クリニック情報が見つかりません' },
        { status: 404 }
      )
    }

    // 4. LINE設定を取得
    const lineSettings = await getLineSettings(clinic_id)

    // 5. 通知テンプレートを取得（template_idが指定されている場合）
    let template: any = null
    if (template_id) {
      template = await prisma.notification_templates.findUnique({
        where: { id: template_id }
      })
    }

    // 6. 通知タイプに応じてメッセージを生成
    let messages: any[]

    switch (notification_type) {
      case 'appointment_reminder':
        // 予約リマインド
        if (!custom_data?.appointment_date || !custom_data?.appointment_time) {
          return NextResponse.json(
            { error: '予約日時の情報が不足しています' },
            { status: 400 }
          )
        }

        const appointmentFlex = createAppointmentReminderFlex({
          patientName,
          appointmentDate: custom_data.appointment_date,
          appointmentTime: custom_data.appointment_time,
          clinicName: clinic.name,
          treatmentMenuName: custom_data.treatment_menu_name,
          webBookingUrl: custom_data.web_booking_url
        })

        messages = [
          {
            type: 'flex',
            altText: `【${clinic.name}】予約リマインド`,
            contents: appointmentFlex
          }
        ]
        break

      case 'periodic_checkup':
        // 定期検診
        const checkupFlex = createPeriodicCheckupFlex({
          patientName,
          clinicName: clinic.name,
          lastVisitDate: custom_data?.last_visit_date,
          webBookingUrl: custom_data?.web_booking_url,
          treatmentMenuNames: custom_data?.treatment_menu_names
        })

        messages = [
          {
            type: 'flex',
            altText: `【${clinic.name}】定期検診のお知らせ`,
            contents: checkupFlex
          }
        ]
        break

      case 'treatment_reminder':
        // 治療リマインド（シンプルなテキスト）
        const treatmentMessage = template?.line_message ||
          `${patientName}様\n\n${clinic.name}です。\n${custom_data?.message || '治療のお知らせです。'}`

        messages = [
          {
            type: 'text',
            text: treatmentMessage
          }
        ]
        break

      case 'custom':
        // カスタム通知
        const customMessage = template?.line_message || custom_data?.message

        if (!customMessage) {
          return NextResponse.json(
            { error: 'メッセージが指定されていません' },
            { status: 400 }
          )
        }

        messages = [
          {
            type: 'text',
            text: customMessage
          }
        ]
        break

      default:
        return NextResponse.json(
          { error: `未対応の通知タイプです: ${notification_type}` },
          { status: 400 }
        )
    }

    // 7. LINEメッセージを送信
    await sendLineMessage({
      channelAccessToken: lineSettings.channelAccessToken,
      to: lineUserId,
      messages
    })

    console.log('LINE通知送信成功:', {
      patient_id,
      line_user_id: lineUserId,
      notification_type
    })

    return NextResponse.json({
      success: true,
      message: 'LINE通知を送信しました',
      sent_to: lineUserId
    })

  } catch (error: any) {
    console.error('LINE通知送信エラー:', error)
    return NextResponse.json(
      {
        error: 'LINE通知の送信に失敗しました',
        message: error.message
      },
      { status: 500 }
    )
  }
}
