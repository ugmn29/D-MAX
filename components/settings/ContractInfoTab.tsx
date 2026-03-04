'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Save, RefreshCw, ExternalLink, Download, CheckCircle, AlertCircle, XCircle, FileText, Receipt } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

interface ContractInfo {
  plan_name: string
  contract_start: string
  next_billing_date: string
  monthly_fee: number
  billing_email: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  stripe_status?: string
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

const DEFAULT_CONTRACT: ContractInfo = {
  plan_name: 'スタンダード',
  contract_start: '',
  next_billing_date: '',
  monthly_fee: 29800,
  billing_email: '',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: typeof CheckCircle }> = {
  active: { label: 'アクティブ', color: 'text-green-700 bg-green-50 border-green-200', Icon: CheckCircle },
  past_due: { label: '支払い遅延', color: 'text-red-700 bg-red-50 border-red-200', Icon: AlertCircle },
  canceled: { label: 'キャンセル済み', color: 'text-gray-600 bg-gray-50 border-gray-200', Icon: XCircle },
  cancelled: { label: 'キャンセル済み', color: 'text-gray-600 bg-gray-50 border-gray-200', Icon: XCircle },
  trialing: { label: 'トライアル中', color: 'text-blue-700 bg-blue-50 border-blue-200', Icon: CheckCircle },
  unpaid: { label: '未払い', color: 'text-orange-700 bg-orange-50 border-orange-200', Icon: AlertCircle },
}

function StripeStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200', Icon: AlertCircle }
  const { Icon } = cfg
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export function ContractInfoTab() {
  const { clinicId } = useAuth()
  const [info, setInfo] = useState<ContractInfo>(DEFAULT_CONTRACT)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)

  const hasStripe = !!info.stripe_customer_id

  // 月次請求書
  const now = new Date()
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const [invoiceYear, setInvoiceYear] = useState(prevYear)
  const [invoiceMonth, setInvoiceMonth] = useState(prevMonth)
  const [monthlyData, setMonthlyData] = useState<{
    plan_name: string
    plan_fee: number
    sms_count: number
    sms_unit_price: number
    sms_total: number
    subtotal: number
    tax: number
    total: number
  } | null>(null)
  const [monthlyLoading, setMonthlyLoading] = useState(false)

  const fetchMonthlyData = async (year: number, month: number) => {
    if (!clinicId) return
    setMonthlyLoading(true)
    try {
      const res = await fetch(`/api/clinics/${clinicId}/invoices/monthly?year=${year}&month=${month}`)
      const data = await res.json()
      if (!data.error) setMonthlyData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setMonthlyLoading(false)
    }
  }

  useEffect(() => {
    if (clinicId) fetchMonthlyData(invoiceYear, invoiceMonth)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId])

  useEffect(() => {
    if (!clinicId) return
    setLoading(true)
    fetch(`/api/clinic/settings?clinic_id=${clinicId}`)
      .then(r => r.json())
      .then(data => {
        if (data.contract_info) {
          setInfo({ ...DEFAULT_CONTRACT, ...data.contract_info })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [clinicId])

  useEffect(() => {
    if (!clinicId || !hasStripe) return
    setInvoicesLoading(true)
    fetch(`/api/clinics/${clinicId}/invoices`)
      .then(r => r.json())
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setInvoicesLoading(false))
  }, [clinicId, hasStripe])

  const handleSave = async () => {
    if (!clinicId) return
    setSaving(true)
    try {
      await fetch('/api/clinic/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinic_id: clinicId, contract_info: info }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        読み込み中...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5 text-blue-600" />
            契約・請求情報
          </CardTitle>
          <p className="text-sm text-gray-500">HubDentのご契約内容と請求先情報を管理します</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Stripe連携済みの場合: 情報を読み取り専用で表示 */}
          {hasStripe ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">プラン</p>
                  <p className="text-sm font-semibold text-gray-900">{info.plan_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">月額費用（税別）</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ¥{info.monthly_fee.toLocaleString('ja-JP')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">ステータス</p>
                  {info.stripe_status ? (
                    <StripeStatusBadge status={info.stripe_status} />
                  ) : (
                    <p className="text-sm text-gray-500">-</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">次回更新日</p>
                  <p className="text-sm text-gray-900">{info.next_billing_date || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 font-medium">契約開始日</p>
                  <p className="text-sm text-gray-900">{info.contract_start || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-1.5">
                <label className="text-sm font-medium text-gray-700">請求先メールアドレス</label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={info.billing_email}
                  onChange={e => setInfo(p => ({ ...p, billing_email: e.target.value }))}
                  placeholder="billing@clinic.com"
                />
                <div className="pt-2 flex items-center gap-3">
                  <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                  {saved && <span className="text-sm text-green-600">保存しました</span>}
                </div>
              </div>
            </div>
          ) : (
            /* Stripe未連携: 手動入力フォーム */
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">プラン名</label>
                  <input
                    type="text"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={info.plan_name}
                    onChange={e => setInfo(p => ({ ...p, plan_name: e.target.value }))}
                    placeholder="スタンダード"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">月額費用（税別）</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">¥</span>
                    <input
                      type="number"
                      className="w-full border rounded-md pl-7 pr-3 py-2 text-sm"
                      value={info.monthly_fee}
                      onChange={e => setInfo(p => ({ ...p, monthly_fee: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">契約開始日</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={info.contract_start}
                    onChange={e => setInfo(p => ({ ...p, contract_start: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">次回更新日</label>
                  <input
                    type="date"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={info.next_billing_date}
                    onChange={e => setInfo(p => ({ ...p, next_billing_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">請求先メールアドレス</label>
                  <input
                    type="email"
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={info.billing_email}
                    onChange={e => setInfo(p => ({ ...p, billing_email: e.target.value }))}
                    placeholder="billing@clinic.com"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? '保存中...' : '保存'}
                </Button>
                {saved && <span className="text-sm text-green-600">保存しました</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 月次請求書・領収書 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-5 w-5 text-blue-600" />
            月次請求書・領収書
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 年月セレクタ */}
          <div className="flex items-center gap-3">
            <select
              className="border rounded-md px-3 py-1.5 text-sm"
              value={invoiceYear}
              onChange={e => setInvoiceYear(Number(e.target.value))}
            >
              {[now.getFullYear() - 1, now.getFullYear()].map(y => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              className="border rounded-md px-3 py-1.5 text-sm"
              value={invoiceMonth}
              onChange={e => setInvoiceMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMonthlyData(invoiceYear, invoiceMonth)}
              disabled={monthlyLoading}
              className="flex items-center gap-1"
            >
              {monthlyLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              表示
            </Button>
          </div>

          {/* 請求内訳プレビュー */}
          {monthlyData && (
            <div className="bg-gray-50 rounded-md p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-600">プラン（{monthlyData.plan_name}）</span>
                <span>¥{monthlyData.plan_fee.toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">SMS送信料（{monthlyData.sms_count}通 × ¥{monthlyData.sms_unit_price}）</span>
                <span>¥{monthlyData.sms_total.toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1.5">
                <span className="text-gray-600">小計</span>
                <span>¥{monthlyData.subtotal.toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">消費税（10%）</span>
                <span>¥{monthlyData.tax.toLocaleString('ja-JP')}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 mt-1.5 font-semibold">
                <span>合計（税込）</span>
                <span>¥{monthlyData.total.toLocaleString('ja-JP')}</span>
              </div>
            </div>
          )}

          {/* ダウンロードボタン */}
          <div className="flex gap-3">
            <a
              href={clinicId ? `/api/clinics/${clinicId}/invoices/pdf?year=${invoiceYear}&month=${invoiceMonth}&type=invoice` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              請求書PDF
            </a>
            <a
              href={clinicId ? `/api/clinics/${clinicId}/invoices/pdf?year=${invoiceYear}&month=${invoiceMonth}&type=receipt` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              領収書PDF
            </a>
          </div>
        </CardContent>
      </Card>

      {/* インボイス一覧（Stripe連携済みの場合のみ） */}
      {hasStripe && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-blue-600" />
              請求書一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex items-center justify-center h-20 text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                読み込み中...
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">請求書はありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="text-left py-2 pr-4 font-medium">請求書番号</th>
                      <th className="text-left py-2 pr-4 font-medium">ステータス</th>
                      <th className="text-left py-2 pr-4 font-medium">金額</th>
                      <th className="text-left py-2 pr-4 font-medium">対象期間</th>
                      <th className="text-left py-2 font-medium">ダウンロード</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs">{inv.number || inv.id.slice(-8)}</td>
                        <td className="py-3 pr-4">
                          {inv.status && <StripeStatusBadge status={inv.status} />}
                        </td>
                        <td className="py-3 pr-4 font-medium">{formatAmount(inv.amount_paid, inv.currency)}</td>
                        <td className="py-3 pr-4 text-gray-500 text-xs">
                          {formatDate(inv.period_start)} 〜 {formatDate(inv.period_end)}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-3">
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
      )}

      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="pt-4 pb-4 text-sm text-blue-800">
          <p className="font-medium mb-1">お問い合わせ</p>
          <p className="text-xs text-blue-700">プラン変更・解約・請求に関するご質問は <strong>support@d-smart.jp</strong> までご連絡ください</p>
        </CardContent>
      </Card>
    </div>
  )
}
