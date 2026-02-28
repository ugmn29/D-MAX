'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CreditCard,
  FileText,
  RefreshCw,
  ExternalLink,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle,
  Link,
} from 'lucide-react'

interface BillingData {
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_name: string
  monthly_fee: number
  contract_start: string | null
  next_billing_date: string | null
  billing_email: string | null
  subscription: {
    id: string
    status: string
    cancel_at_period_end: boolean
    current_period_end: number
    items: { data: Array<{ id: string; price: { id: string; nickname: string | null; unit_amount: number | null } }> }
  } | null
}

interface Invoice {
  id: string
  number: string | null
  status: string | null
  amount_paid: number
  currency: string
  created: number
  period_start: number
  period_end: number
  hosted_invoice_url: string | null
  invoice_pdf: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'アクティブ', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle },
  past_due: { label: '支払い遅延', color: 'text-red-700 bg-red-50 border-red-200', icon: AlertCircle },
  canceled: { label: 'キャンセル済み', color: 'text-gray-600 bg-gray-50 border-gray-200', icon: XCircle },
  trialing: { label: 'トライアル中', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: CheckCircle },
  unpaid: { label: '未払い', color: 'text-orange-700 bg-orange-50 border-orange-200', icon: AlertCircle },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: AlertCircle }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function AdminBillingPage() {
  const params = useParams()
  const router = useRouter()
  const clinicId = params.id as string

  const [billing, setBilling] = useState<BillingData | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Link customer form
  const [customerId, setCustomerId] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [planName, setPlanName] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  // Action state
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const fetchBilling = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bRes, iRes] = await Promise.all([
        fetch(`/api/admin/clinics/${clinicId}/billing`),
        fetch(`/api/admin/clinics/${clinicId}/invoices`),
      ])
      if (!bRes.ok) throw new Error('請求情報の取得に失敗しました')
      const bData = await bRes.json()
      setBilling(bData)
      setCustomerId(bData.stripe_customer_id || '')
      setSubscriptionId(bData.stripe_subscription_id || '')
      setPlanName(bData.plan_name || '')
      setMonthlyFee(bData.monthly_fee ? String(bData.monthly_fee) : '')
      setBillingEmail(bData.billing_email || '')
      if (iRes.ok) {
        const iData = await iRes.json()
        setInvoices(Array.isArray(iData) ? iData : [])
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [clinicId])

  useEffect(() => { fetchBilling() }, [fetchBilling])

  const handleLinkCustomer = async () => {
    setLinking(true)
    setLinkMsg('')
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_customer',
          stripe_customer_id: customerId.trim() || undefined,
          stripe_subscription_id: subscriptionId.trim() || undefined,
          plan_name: planName.trim() || undefined,
          monthly_fee: monthlyFee ? Number(monthlyFee) : undefined,
          billing_email: billingEmail.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || '保存に失敗しました')
      setLinkMsg('保存しました')
      await fetchBilling()
    } catch (e: any) {
      setLinkMsg(e.message)
    } finally {
      setLinking(false)
    }
  }

  const handleAction = async (action: string) => {
    setActionLoading(true)
    setActionMsg('')
    try {
      const res = await fetch(`/api/admin/clinics/${clinicId}/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '操作に失敗しました')
      setActionMsg('操作が完了しました')
      await fetchBilling()
    } catch (e: any) {
      setActionMsg(e.message)
    } finally {
      setActionLoading(false)
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
  }

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        読み込み中...
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/clinics/${clinicId}`)}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          クリニック詳細へ
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          請求管理
        </h1>
        <p className="text-sm text-gray-500 mt-1">Stripe連携と請求情報を管理します</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stripe連携設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="w-4 h-4 text-blue-600" />
            Stripe連携設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Stripe Customer ID</Label>
              <Input
                value={customerId}
                onChange={e => setCustomerId(e.target.value)}
                placeholder="cus_xxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Stripe Subscription ID</Label>
              <Input
                value={subscriptionId}
                onChange={e => setSubscriptionId(e.target.value)}
                placeholder="sub_xxxxxxxxxxxx"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>プラン名</Label>
              <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="スタンダード" />
            </div>
            <div className="space-y-1.5">
              <Label>月額費用（税別・円）</Label>
              <Input
                type="number"
                value={monthlyFee}
                onChange={e => setMonthlyFee(e.target.value)}
                placeholder="29800"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>請求先メールアドレス</Label>
              <Input
                type="email"
                value={billingEmail}
                onChange={e => setBillingEmail(e.target.value)}
                placeholder="billing@clinic.com"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleLinkCustomer} disabled={linking}>
              {linking ? '保存中...' : '保存'}
            </Button>
            {linkMsg && (
              <span className={`text-sm ${linkMsg === '保存しました' ? 'text-green-600' : 'text-red-600'}`}>
                {linkMsg}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* サブスクリプション情報 */}
      {billing?.subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4 text-green-600" />
              サブスクリプション
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">ステータス</p>
                <StatusBadge status={billing.subscription.status} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">プラン</p>
                <p className="text-sm font-medium">{billing.plan_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">月額</p>
                <p className="text-sm font-medium">
                  ¥{billing.monthly_fee.toLocaleString('ja-JP')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">次回更新日</p>
                <p className="text-sm font-medium">
                  {formatDate(billing.subscription.current_period_end)}
                </p>
              </div>
            </div>

            {billing.subscription.cancel_at_period_end && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
                期間終了時にキャンセル予定です（{formatDate(billing.subscription.current_period_end)}）
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {billing.subscription.status === 'active' && !billing.subscription.cancel_at_period_end && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('cancel')}
                  disabled={actionLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  キャンセル
                </Button>
              )}
              {billing.subscription.cancel_at_period_end && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('resume')}
                  disabled={actionLoading}
                >
                  キャンセルを取り消す
                </Button>
              )}
            </div>

            {actionMsg && (
              <p className={`text-sm ${actionMsg === '操作が完了しました' ? 'text-green-600' : 'text-red-600'}`}>
                {actionMsg}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* インボイス一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-blue-600" />
            請求書一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {billing?.stripe_customer_id ? '請求書はありません' : 'Stripe Customer IDを設定すると請求書が表示されます'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="text-left py-2 pr-4 font-medium">請求書番号</th>
                    <th className="text-left py-2 pr-4 font-medium">ステータス</th>
                    <th className="text-left py-2 pr-4 font-medium">金額</th>
                    <th className="text-left py-2 pr-4 font-medium">対象期間</th>
                    <th className="text-left py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-mono text-xs">{inv.number || inv.id.slice(-8)}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={inv.status || 'unknown'} />
                      </td>
                      <td className="py-3 pr-4 font-medium">{formatAmount(inv.amount_paid, inv.currency)}</td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">
                        {formatDate(inv.period_start)} 〜 {formatDate(inv.period_end)}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {inv.hosted_invoice_url && (
                            <a
                              href={inv.hosted_invoice_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                              表示
                            </a>
                          )}
                          {inv.invoice_pdf && (
                            <a
                              href={inv.invoice_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
