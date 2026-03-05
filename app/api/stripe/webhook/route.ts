import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { getPrismaClient } from '@/lib/prisma-client'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

async function findClinicByCustomerId(customerId: string) {
  const prisma = getPrismaClient()
  const rows = await prisma.$queryRaw<Array<{ clinic_id: string; billing_email: string | null }>>`
    SELECT clinic_id, settings->'contract_info'->>'billing_email' AS billing_email
    FROM clinic_settings
    WHERE settings->'contract_info'->>'stripe_customer_id' = ${customerId}
    LIMIT 1
  `
  if (!rows.length) return null
  const { clinic_id, billing_email } = rows[0]
  const clinic = await prisma.clinics.findUnique({
    where: { id: clinic_id },
    select: { email: true, name: true },
  })
  if (!clinic) return null
  return { clinicId: clinic_id, email: billing_email || clinic.email || '', name: clinic.name || '' }
}

async function sendBillingEmail(to: string, subject: string, html: string) {
  if (!to) return
  const resend = getResend()
  await resend.emails.send({
    from: 'HubDent <billing@hubdent.net>',
    to,
    subject,
    html,
  })
}

async function updateStripeStatus(clinicId: string, status: string) {
  const prisma = getPrismaClient()
  const settings = await prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId } })
  if (!settings) return
  const current = (settings.settings as any) || {}
  await prisma.clinic_settings.update({
    where: { id: settings.id },
    data: {
      settings: {
        ...current,
        contract_info: { ...(current.contract_info || {}), stripe_status: status },
      },
      updated_at: new Date(),
    },
  })
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const obj = event.data.object as any
  const customerId: string | null =
    obj.customer ? (typeof obj.customer === 'string' ? obj.customer : obj.customer?.id) : null

  if (!customerId) {
    return NextResponse.json({ received: true })
  }

  const clinic = await findClinicByCustomerId(customerId)
  if (!clinic) {
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const inv = obj as Stripe.Invoice
        const amount = ((inv.amount_paid ?? 0) / 100).toLocaleString('ja-JP')
        const pdfUrl = inv.invoice_pdf || ''
        const pdfLink = pdfUrl ? `<p><a href="${pdfUrl}" style="color:#2563eb">請求書PDFをダウンロード</a></p>` : ''
        await sendBillingEmail(
          clinic.email,
          '【HubDent】お支払いを承りました',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1e40af">お支払い確認</h2>
            <p>${clinic.name} ご担当者様</p>
            <p>この度はHubDentをご利用いただきありがとうございます。<br>以下のお支払いを承りました。</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">お支払い金額</td><td style="padding:8px;border:1px solid #e5e7eb">¥${amount}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">請求書番号</td><td style="padding:8px;border:1px solid #e5e7eb">${inv.number || '-'}</td></tr>
            </table>
            ${pdfLink}
            <p style="color:#6b7280;font-size:14px">ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までお問い合わせください。</p>
            <p style="color:#6b7280;font-size:14px">HubDent サポートチーム</p>
          </div>`
        )
        await updateStripeStatus(clinic.clinicId, 'active')
        break
      }

      case 'invoice.payment_failed': {
        await sendBillingEmail(
          clinic.email,
          '【HubDent】お支払いに失敗しました',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#dc2626">お支払い失敗のお知らせ</h2>
            <p>${clinic.name} ご担当者様</p>
            <p>大変恐れ入りますが、HubDentのご利用料金のお支払い処理に失敗しました。</p>
            <p>クレジットカード情報をご確認のうえ、お支払い情報を更新してください。</p>
            <p>サービスが停止される前に、お早めのご対応をお願いいたします。</p>
            <p style="color:#6b7280;font-size:14px">ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までお問い合わせください。</p>
            <p style="color:#6b7280;font-size:14px">HubDent サポートチーム</p>
          </div>`
        )
        await updateStripeStatus(clinic.clinicId, 'past_due')
        break
      }

      case 'customer.subscription.trial_will_end': {
        const sub = obj as Stripe.Subscription
        const trialEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toLocaleDateString('ja-JP')
          : '近日中'
        await sendBillingEmail(
          clinic.email,
          '【HubDent】トライアル期間終了のお知らせ（7日前）',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#d97706">トライアル期間終了のお知らせ</h2>
            <p>${clinic.name} ご担当者様</p>
            <p>HubDentのトライアル期間が <strong>${trialEnd}</strong> に終了します。</p>
            <p>引き続きHubDentをご利用いただくために、お支払い情報をご確認ください。<br>
            トライアル期間終了後は自動的に有料プランへ移行します。</p>
            <p style="color:#6b7280;font-size:14px">ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までお問い合わせください。</p>
            <p style="color:#6b7280;font-size:14px">HubDent サポートチーム</p>
          </div>`
        )
        break
      }

      case 'customer.subscription.deleted': {
        await sendBillingEmail(
          clinic.email,
          '【HubDent】ご解約完了のお知らせ',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#374151">ご解約完了のお知らせ</h2>
            <p>${clinic.name} ご担当者様</p>
            <p>HubDentのサブスクリプションが解約されました。<br>
            これまでご利用いただきありがとうございました。</p>
            <p>またのご利用をお待ちしております。</p>
            <p style="color:#6b7280;font-size:14px">ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までお問い合わせください。</p>
            <p style="color:#6b7280;font-size:14px">HubDent サポートチーム</p>
          </div>`
        )
        await updateStripeStatus(clinic.clinicId, 'cancelled')
        break
      }

      case 'customer.subscription.updated': {
        const sub = obj as Stripe.Subscription
        const planName =
          sub.items.data[0]?.price?.nickname ||
          sub.items.data[0]?.price?.id ||
          'プラン'
        const nextBilling = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toLocaleDateString('ja-JP')
          : '-'
        await sendBillingEmail(
          clinic.email,
          '【HubDent】ご契約プラン変更のお知らせ',
          `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1e40af">プラン変更のお知らせ</h2>
            <p>${clinic.name} ご担当者様</p>
            <p>HubDentのご契約プランが変更されました。</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">現在のプラン</td><td style="padding:8px;border:1px solid #e5e7eb">${planName}</td></tr>
              <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600">次回更新日</td><td style="padding:8px;border:1px solid #e5e7eb">${nextBilling}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:14px">ご不明点は <a href="mailto:support@hubdent.net">support@hubdent.net</a> までお問い合わせください。</p>
            <p style="color:#6b7280;font-size:14px">HubDent サポートチーム</p>
          </div>`
        )
        await updateStripeStatus(clinic.clinicId, sub.status)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}
