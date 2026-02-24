'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Save, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'

interface ContractInfo {
  plan_name: string
  contract_start: string
  next_billing_date: string
  monthly_fee: number
  billing_email: string
}

const DEFAULT_CONTRACT: ContractInfo = {
  plan_name: 'スタンダード',
  contract_start: '',
  next_billing_date: '',
  monthly_fee: 29800,
  billing_email: '',
}

export function ContractInfoTab() {
  const { clinicId } = useAuth()
  const [info, setInfo] = useState<ContractInfo>(DEFAULT_CONTRACT)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
          <p className="text-sm text-gray-500">Dスマートのご契約内容と請求先情報を管理します</p>
        </CardHeader>
        <CardContent className="space-y-5">
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
        </CardContent>
      </Card>

      <Card className="bg-blue-50/50 border-blue-100">
        <CardContent className="pt-4 pb-4 text-sm text-blue-800">
          <p className="font-medium mb-1">お問い合わせ</p>
          <p className="text-xs text-blue-700">プラン変更・解約・請求に関するご質問は <strong>support@d-smart.jp</strong> までご連絡ください</p>
        </CardContent>
      </Card>
    </div>
  )
}
