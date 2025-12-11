'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  QrCode,
  Copy,
  Check,
  Calendar,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface LineLinkageSectionProps {
  patientId: string
  clinicId: string
}

interface InvitationCode {
  id: string
  invitation_code: string
  status: 'pending' | 'used' | 'expired'
  expires_at: string
  used_at: string | null
  created_at: string
}

interface Linkage {
  id: string
  line_user_id: string
  relationship: 'self' | 'parent' | 'spouse' | 'child' | 'other'
  is_primary: boolean
  linked_at: string
}

export function LineLinkageSection({ patientId, clinicId }: LineLinkageSectionProps) {
  const [invitationCode, setInvitationCode] = useState<InvitationCode | null>(null)
  const [linkages, setLinkages] = useState<Linkage[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)

  // 招待コード・連携情報を読み込む
  useEffect(() => {
    loadLineLinkageData()
  }, [patientId])

  const loadLineLinkageData = async () => {
    try {
      // 招待コード取得
      const invitationRes = await fetch(`/api/line/invitation-codes?patient_id=${patientId}`)
      if (invitationRes.ok) {
        const { codes } = await invitationRes.json()
        // 最新の有効な招待コードを取得
        const validCode = codes?.find((c: InvitationCode) =>
          c.status === 'pending' && new Date(c.expires_at) > new Date()
        )
        setInvitationCode(validCode || null)
      }

      // 連携情報取得（patient_idから逆引き）
      const linkageRes = await fetch(`/api/line/patient-linkages?patient_id=${patientId}`)
      if (linkageRes.ok) {
        const { linkages: linkageData } = await linkageRes.json()
        setLinkages(linkageData || [])
      }
    } catch (error) {
      console.error('LINE連携情報の読み込みエラー:', error)
    }
  }

  // 招待コード発行
  const handleGenerateCode = async () => {
    setLoading(true)
    try {
      // 現在のユーザーID（スタッフID）を取得
      // TODO: 認証から取得する実装が必要
      const demoStaffId = '11111111-1111-1111-1111-111111111111'

      const response = await fetch('/api/line/invitation-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          clinic_id: clinicId,
          created_by: demoStaffId,
          expires_in_days: 30
        })
      })

      if (response.ok) {
        const data = await response.json()
        setInvitationCode({
          id: '',
          invitation_code: data.invitation_code,
          status: 'pending',
          expires_at: data.expires_at,
          used_at: null,
          created_at: new Date().toISOString()
        })
      } else {
        const error = await response.json()
        alert(error.error || '招待コードの発行に失敗しました')
      }
    } catch (error) {
      console.error('招待コード発行エラー:', error)
      alert('招待コードの発行に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 招待コードをクリップボードにコピー
  const handleCopyCode = async () => {
    if (!invitationCode) return

    try {
      await navigator.clipboard.writeText(invitationCode.invitation_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('コピーエラー:', error)
    }
  }

  // 招待コード無効化
  const handleInvalidateCode = async () => {
    if (!invitationCode?.id) return
    if (!confirm('この招待コードを無効化しますか？')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/line/invitation-codes?id=${invitationCode.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInvitationCode(null)
      } else {
        alert('招待コードの無効化に失敗しました')
      }
    } catch (error) {
      console.error('招待コード無効化エラー:', error)
      alert('招待コードの無効化に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // QRコード印刷
  const handlePrintQR = () => {
    setShowQRDialog(true)
  }

  const hasLinkage = linkages.length > 0
  const isCodeExpired = invitationCode && new Date(invitationCode.expires_at) < new Date()

  return (
    <div className="space-y-4">
        {/* 連携状態 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${hasLinkage ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <div className="font-medium text-gray-900">
                {hasLinkage ? 'LINE連携済み' : 'LINE未連携'}
              </div>
              {hasLinkage && (
                <div className="text-sm text-gray-500">
                  {linkages.length}件のアカウントと連携中
                </div>
              )}
            </div>
          </div>
          {hasLinkage && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              連携済み
            </Badge>
          )}
        </div>

        {/* 招待コードセクション */}
        {!hasLinkage && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">招待コード発行</div>

            {!invitationCode || isCodeExpired ? (
              <Button
                onClick={handleGenerateCode}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    発行中...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    招待コードを発行
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                {/* 招待コード表示 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">招待コード</span>
                    <Badge variant="outline" className="bg-white">
                      {invitationCode.status === 'pending' ? '有効' : '無効'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 text-2xl font-bold text-blue-600 tracking-wider">
                      {invitationCode.invitation_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyCode}
                      className="flex-shrink-0"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      有効期限: {new Date(invitationCode.expires_at).toLocaleDateString('ja-JP')}
                      （あと{formatDistanceToNow(new Date(invitationCode.expires_at), { locale: ja })}）
                    </span>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrintQR}
                    disabled={loading}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR印刷
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleInvalidateCode}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    無効化
                  </Button>
                </div>

                {/* 使い方ガイド */}
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700">
                      <div className="font-medium mb-1">患者さまへの案内</div>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>LINE公式アカウントを友だち追加</li>
                        <li>リッチメニューから「初回登録」をタップ</li>
                        <li>この招待コードと生年月日を入力</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 連携済みアカウント一覧 */}
        {hasLinkage && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">連携中のアカウント</div>
            {linkages.map((linkage) => (
              <div key={linkage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      LINE User
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(linkage.linked_at).toLocaleDateString('ja-JP')}に連携
                    </div>
                  </div>
                </div>
                {linkage.is_primary && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    メイン
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
