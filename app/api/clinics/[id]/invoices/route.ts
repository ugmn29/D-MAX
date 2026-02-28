import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-request'
import { getPrismaClient } from '@/lib/prisma-client'
import { getStripe } from '@/lib/stripe'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyAuth(request)
    const { id: clinicId } = await params

    // 自分のクリニックのみ参照可能
    if (user.clinicId !== clinicId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 })
    }

    const prisma = getPrismaClient()
    const settings = await prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId } })
    const contractInfo = ((settings?.settings as any)?.contract_info) || {}
    const stripeCustomerId = contractInfo.stripe_customer_id

    if (!stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json([])
    }

    const stripe = getStripe()
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 6,
    })

    const result = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
    }))
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
