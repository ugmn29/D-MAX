import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { getStripe } from '@/lib/stripe'

const isStripeConfigured = () => !!process.env.STRIPE_SECRET_KEY

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('__admin_session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  return !!session && !!secret && session === secret
}

async function getClinicContractInfo(clinicId: string) {
  const prisma = getPrismaClient()
  const settings = await prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId } })
  const s = (settings?.settings as any) || {}
  return s.contract_info || {}
}

async function saveClinicContractInfo(clinicId: string, contractInfo: Record<string, any>) {
  const prisma = getPrismaClient()
  const settings = await prisma.clinic_settings.findFirst({ where: { clinic_id: clinicId } })
  const current = (settings?.settings as any) || {}
  const updated = { ...current, contract_info: { ...(current.contract_info || {}), ...contractInfo } }
  if (settings) {
    await prisma.clinic_settings.update({
      where: { id: settings.id },
      data: { settings: updated, updated_at: new Date() },
    })
  } else {
    await prisma.clinic_settings.create({
      data: { clinic_id: clinicId, settings: updated },
    })
  }
}

// GET: Stripe情報取得
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  const contractInfo = await getClinicContractInfo(clinicId)
  const stripeCustomerId = contractInfo.stripe_customer_id
  const stripeSubscriptionId = contractInfo.stripe_subscription_id

  let subscription = null
  if (stripeCustomerId && stripeSubscriptionId) {
    try {
      const stripe = getStripe()
      subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
    } catch {
      subscription = null
    }
  }

  return NextResponse.json({
    stripe_customer_id: stripeCustomerId || null,
    stripe_subscription_id: stripeSubscriptionId || null,
    plan_name: contractInfo.plan_name || 'スタンダード',
    monthly_fee: contractInfo.monthly_fee ?? 29800,
    contract_start: contractInfo.contract_start || null,
    next_billing_date: contractInfo.next_billing_date || null,
    billing_email: contractInfo.billing_email || null,
    subscription,
  })
}

// POST: Stripe操作（プラン変更・キャンセル・再開・Customer ID紐付け）
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }
  const { id: clinicId } = await params
  const body = await request.json()
  const { action, stripe_customer_id, stripe_subscription_id, price_id, plan_name, monthly_fee, billing_email } = body

  const contractInfo = await getClinicContractInfo(clinicId)

  if (action === 'link_customer') {
    await saveClinicContractInfo(clinicId, {
      stripe_customer_id,
      ...(stripe_subscription_id && { stripe_subscription_id }),
      ...(plan_name && { plan_name }),
      ...(monthly_fee !== undefined && { monthly_fee }),
      ...(billing_email && { billing_email }),
    })
    return NextResponse.json({ ok: true })
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripeが設定されていません' }, { status: 503 })
  }

  const stripe = getStripe()
  const subscriptionId = contractInfo.stripe_subscription_id
  if (!subscriptionId) {
    return NextResponse.json({ error: 'サブスクリプションIDが未設定です' }, { status: 400 })
  }

  if (action === 'cancel') {
    await stripe.subscriptions.cancel(subscriptionId)
    await saveClinicContractInfo(clinicId, { stripe_status: 'cancelled' })
    return NextResponse.json({ ok: true })
  }

  if (action === 'resume') {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    if (sub.status === 'canceled') {
      return NextResponse.json({ error: 'キャンセル済みのサブスクリプションは再開できません' }, { status: 400 })
    }
    await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: false })
    return NextResponse.json({ ok: true })
  }

  if (action === 'change_plan' && price_id) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const itemId = sub.items.data[0]?.id
    if (!itemId) return NextResponse.json({ error: 'サブスクリプションアイテムが見つかりません' }, { status: 400 })
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: itemId, price: price_id }],
      proration_behavior: 'create_prorations',
    })
    if (plan_name || monthly_fee !== undefined) {
      await saveClinicContractInfo(clinicId, {
        ...(plan_name && { plan_name }),
        ...(monthly_fee !== undefined && { monthly_fee }),
      })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: '不明なアクションです' }, { status: 400 })
}
