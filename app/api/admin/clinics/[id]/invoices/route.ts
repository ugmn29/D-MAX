import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { getStripe } from '@/lib/stripe'

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  const prisma = getPrismaClient()
  const settings = await prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId } })
  const contractInfo = ((settings?.settings as any)?.contract_info) || {}
  const stripeCustomerId = contractInfo.stripe_customer_id

  if (!stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json([])
  }

  try {
    const stripe = getStripe()
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 12,
    })
    const result = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amount_paid: inv.amount_paid,
      amount_due: inv.amount_due,
      currency: inv.currency,
      created: inv.created,
      period_start: inv.period_start,
      period_end: inv.period_end,
      hosted_invoice_url: inv.hosted_invoice_url,
      invoice_pdf: inv.invoice_pdf,
    }))
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
