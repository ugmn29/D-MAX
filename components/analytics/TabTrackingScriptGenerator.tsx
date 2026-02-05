'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code, Copy, CheckCircle, ExternalLink } from 'lucide-react'
import { generateTabTrackingScript } from '@/lib/tracking/tab-tracker'

interface TabTrackingScriptGeneratorProps {
  clinicId: string
}

export default function TabTrackingScriptGenerator({ clinicId }: TabTrackingScriptGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const script = generateTabTrackingScript(clinicId)

  const copyScript = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exampleHTML = `<!-- 例1: ヘッダーの予約ボタン -->
<a href="予約ページURL"
   data-dmax-tab="header_button"
   data-dmax-position="header"
   class="booking-button">
  予約する
</a>

<!-- 例2: サイドバーの予約ボタン -->
<a href="予約ページURL"
   data-dmax-tab="sidebar_button"
   data-dmax-position="sidebar"
   class="booking-button">
  今すぐ予約
</a>

<!-- 例3: フッターの予約ボタン -->
<a href="予約ページURL"
   data-dmax-tab="footer_button"
   data-dmax-position="footer"
   class="booking-button">
  Web予約はこちら
</a>

<!-- 例4: 料金ページの予約ボタン -->
<a href="予約ページURL"
   data-dmax-tab="price_page_button"
   data-dmax-position="content"
   class="booking-button">
  この料金で予約する
</a>`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            HPタブクリックトラッキングスクリプト
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            クライアントのHPに埋め込むトラッキングスクリプトを生成します
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: スクリプトを埋め込む */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Step 1: スクリプトをHP の &lt;/body&gt; 直前に埋め込む</h3>
              <Button variant="outline" size="sm" onClick={copyScript}>
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    コピー済み
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    コピー
                  </>
                )}
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96">
              <pre>{script}</pre>
            </div>
          </div>

          {/* Step 2: ボタンにdata属性を追加 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Step 2: 予約ボタンに data-dmax-tab 属性を追加</h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto">
              <pre>{exampleHTML}</pre>
            </div>
          </div>

          {/* 説明 */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>
              <strong>data-dmax-tab 属性について:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><strong>data-dmax-tab</strong>: タブの識別ID（header_button, sidebar_button など）</li>
                <li><strong>data-dmax-position</strong>: タブの位置（header, sidebar, footer, content など）</li>
                <li>これらの属性を追加するだけで、自動的にクリックが記録されます</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* 手動トラッキング */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">手動トラッキング（任意）</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-700 mb-2">
                JavaScriptから直接トラッキングする場合は、以下の関数を使用できます:
              </p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs">
                <pre>{`window.dmaxTrackTab('tab_id', 'タブ名', 'position')`}</pre>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                例: <code className="bg-gray-200 px-1 rounded">window.dmaxTrackTab('floating_cta', 'フローティングCTA', 'floating')</code>
              </p>
            </div>
          </div>

          {/* 確認方法 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">確認方法</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>HPの予約ボタンをクリックする</li>
              <li>ブラウザのコンソール（F12 → Console）を開く</li>
              <li>「Tab tracking...」というログが表示されればOK</li>
              <li>DAXの「分析 → Web予約効果 → タブ分析」で数時間後にデータが表示されます</li>
            </ol>
          </div>

          {/* 推奨設定例 */}
          <Alert>
            <AlertDescription>
              <strong>推奨タブID命名規則:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li><code>header_button</code> - ヘッダーの予約ボタン</li>
                <li><code>sidebar_button</code> - サイドバーの予約ボタン</li>
                <li><code>footer_button</code> - フッターの予約ボタン</li>
                <li><code>top_page_cta</code> - トップページのCTA</li>
                <li><code>price_page_button</code> - 料金ページの予約ボタン</li>
                <li><code>staff_page_button</code> - スタッフ紹介ページの予約ボタン</li>
                <li><code>floating_cta</code> - フローティングCTA</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* GTM連携 */}
          <Alert className="bg-purple-50 border-purple-200">
            <AlertDescription>
              <strong>Google Tag Manager連携:</strong>
              <p className="text-sm mt-2">
                このスクリプトは自動的にGTMのdataLayerにイベントを送信します。
                GTM側で <code className="bg-purple-100 px-1 rounded">tab_click</code> イベントをトリガーとして設定すると、
                Google Analytics 4やGoogle Ads にもデータを送信できます。
              </p>
            </AlertDescription>
          </Alert>

          {/* Clarity連携 */}
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription>
              <strong>Microsoft Clarity連携:</strong>
              <p className="text-sm mt-2">
                タブクリック情報は自動的にClarityのカスタムタグに記録されます。
                Clarityのセッションレコーディングでフィルタリングできます。
              </p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
