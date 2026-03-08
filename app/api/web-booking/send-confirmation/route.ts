/**
 * Web予約 確認メール送信API（認証不要）
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const FROM = 'noreply@hubdent.net'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientEmail, patientName, clinicName, appointmentDate, appointmentTime, menuName } = body

    if (!patientEmail || !patientName || !appointmentDate || !appointmentTime) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('[web-booking/send-confirmation] RESEND_API_KEY が設定されていません')
      return NextResponse.json({ sent: false, reason: 'RESEND_API_KEY not set' })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const clinicDisplayName = clinicName || 'クリニック'
    const subject = `【${clinicDisplayName}】ご予約確認`

    const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
  <h2 style="color: #1d4ed8; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px;">ご予約ありがとうございます</h2>

  <p>${patientName} 様</p>
  <p>以下の内容でご予約を承りました。</p>

  <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280; width: 120px;">医院名</td>
        <td style="padding: 8px 0; font-weight: bold;">${clinicDisplayName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">予約日時</td>
        <td style="padding: 8px 0; font-weight: bold;">${appointmentDate} ${appointmentTime}</td>
      </tr>
      ${menuName ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">診療メニュー</td>
        <td style="padding: 8px 0; font-weight: bold;">${menuName}</td>
      </tr>` : ''}
    </table>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    キャンセルや日時変更の際はお早めにご連絡ください。
  </p>
  <p style="color: #6b7280; font-size: 14px;">
    このメールは自動送信です。返信はできません。
  </p>
</div>
`

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: patientEmail,
      subject,
      html,
    })

    if (error) {
      console.error('[web-booking/send-confirmation] Resendエラー:', error)
      return NextResponse.json({ sent: false, reason: error.message })
    }

    console.log('[web-booking/send-confirmation] 送信成功:', data?.id)
    return NextResponse.json({ sent: true, id: data?.id })
  } catch (error) {
    console.error('[web-booking/send-confirmation] エラー:', error)
    return NextResponse.json({ sent: false, reason: 'server error' })
  }
}
