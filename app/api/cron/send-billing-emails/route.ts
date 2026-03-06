import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { Resend } from 'resend'

/**
 * GET /api/cron/send-billing-emails
 *
 * 毎日実行: 当日が契約更新日のクリニックへ前月分の請求書メールを送信
 * contract_start の日（day of month）と今日の日が一致するクリニックが対象
 *
 * GitHub Actions から毎日 09:00 JST に呼び出す
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 })
  }

  const prisma = getPrismaClient()
  const today = new Date()
  const todayDay = today.getDate()

  // 前月の年月を計算
  const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
  const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()

  console.log(`請求書メール送信ジョブ開始: ${today.toISOString()} (対象: ${prevYear}年${prevMonth}月分)`)

  // contract_info を持つ全クリニックを取得
  const rows = await prisma.clinic_settings.findMany({
    where: { setting_key: 'contract_info' },
    include: {
      clinics: { select: { id: true, name: true, email: true, status: true } },
    },
  })

  const sysSettings = await (prisma as any).admin_system_settings.findFirst({ where: { id: 1 } }).catch(() => null)
  const smsUnitPrice: number = sysSettings?.sms_unit_price_jpy ?? 10

  const results: { clinicId: string; clinicName: string; status: string; reason?: string }[] = []

  for (const row of rows) {
    const info = row.setting_value as any
    const contractStart = info?.contract_start
    const clinic = row.clinics

    if (!contractStart || !clinic) continue
    if (clinic.status !== 'active') continue

    const startDay = new Date(contractStart).getDate()
    if (startDay !== todayDay) continue

    const clinicId = row.clinic_id
    const billingEmail = info.billing_email || clinic.email
    const clinicName = clinic.name || clinicId

    if (!billingEmail) {
      results.push({ clinicId, clinicName, status: 'skipped', reason: 'メールアドレス未設定' })
      continue
    }

    try {
      // 前月のSMS送信数を集計
      const periodStart = new Date(prevYear, prevMonth - 1, 1)
      const periodEnd = new Date(prevYear, prevMonth, 1)

      const smsCount = await prisma.patient_notification_schedules.count({
        where: {
          clinic_id: clinicId,
          send_channel: 'sms',
          status: 'sent',
          sent_at: { gte: periodStart, lt: periodEnd },
        },
      })

      const planName = info.plan_name || 'スタンダード'
      const planFee: number = info.monthly_fee ?? 0
      const smsTotal = smsCount * smsUnitPrice
      const subtotal = planFee + smsTotal
      const tax = Math.floor(subtotal * 0.1)
      const total = subtotal + tax

      const pdfUrl = `https://hubdent.net/api/clinics/${clinicId}/invoices/pdf?year=${prevYear}&month=${prevMonth}&type=invoice`

      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({
        from: 'HubDent <billing@hubdent.net>',
        to: billingEmail,
        subject: `【HubDent】${prevYear}年${prevMonth}月分 請求書`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e40af;">【HubDent】${prevYear}年${prevMonth}月分 請求書</h2>
            <p>${clinicName} 御中</p>
            <p>${prevYear}年${prevMonth}月分の請求書をお送りします。</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background: #f3f4f6;">
                <th style="text-align: left; padding: 8px 12px; border: 1px solid #e5e7eb;">品目</th>
                <th style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">金額</th>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">プラン（${planName}）</td>
                <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">¥${planFee.toLocaleString('ja-JP')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">SMS送信料（${smsCount}通 × ¥${smsUnitPrice}）</td>
                <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">¥${smsTotal.toLocaleString('ja-JP')}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">消費税（10%）</td>
                <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">¥${tax.toLocaleString('ja-JP')}</td>
              </tr>
              <tr style="font-weight: bold;">
                <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">合計（税込）</td>
                <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">¥${total.toLocaleString('ja-JP')}</td>
              </tr>
            </table>

            <p>
              <a href="${pdfUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
                請求書PDFをダウンロード
              </a>
            </p>

            <p style="color: #6b7280; font-size: 14px;">
              ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までご連絡ください。
            </p>
          </div>
        `,
      })

      if (error) {
        console.error(`Resendエラー (clinic: ${clinicId}):`, error)
        results.push({ clinicId, clinicName, status: 'error', reason: error.message })
      } else {
        console.log(`請求書メール送信成功: ${clinicName} → ${billingEmail}`)
        results.push({ clinicId, clinicName, status: 'sent' })
      }
    } catch (err: any) {
      console.error(`請求書メール送信エラー (clinic: ${clinicId}):`, err)
      results.push({ clinicId, clinicName, status: 'error', reason: err.message })
    }
  }

  console.log(`請求書メール送信ジョブ完了: ${results.length}件処理`)
  return NextResponse.json({
    ok: true,
    date: today.toISOString(),
    billingDay: todayDay,
    targetPeriod: `${prevYear}年${prevMonth}月`,
    processed: results.length,
    results,
  })
}
