'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Code, Copy, CheckCircle, Layout, Sidebar, PanelTop, MousePointer } from 'lucide-react'

interface HPEmbedCodeGeneratorProps {
  clinicId: string
  clinicSlug?: string
}

interface EmbedPosition {
  id: string
  label: string
  description: string
  icon: React.ElementType
  utmContent: string
}

const EMBED_POSITIONS: EmbedPosition[] = [
  {
    id: 'header',
    label: 'ヘッダー',
    description: 'ページ上部の予約ボタン',
    icon: PanelTop,
    utmContent: 'header',
  },
  {
    id: 'sidebar',
    label: 'サイドバー',
    description: 'ページ横の予約ウィジェット',
    icon: Sidebar,
    utmContent: 'sidebar',
  },
  {
    id: 'footer',
    label: 'フッター',
    description: 'ページ下部の予約ボタン',
    icon: Layout,
    utmContent: 'footer',
  },
  {
    id: 'floating',
    label: 'フローティング',
    description: '画面追従型の予約ボタン',
    icon: MousePointer,
    utmContent: 'floating',
  },
  {
    id: 'inline',
    label: 'インライン',
    description: '記事内の予約リンク',
    icon: Code,
    utmContent: 'inline',
  },
]

const BUTTON_STYLES = [
  { id: 'primary', label: 'プライマリ', bgColor: '#3B82F6', textColor: '#FFFFFF' },
  { id: 'secondary', label: 'セカンダリ', bgColor: '#10B981', textColor: '#FFFFFF' },
  { id: 'outline', label: 'アウトライン', bgColor: 'transparent', textColor: '#3B82F6', border: '#3B82F6' },
  { id: 'custom', label: 'カスタム', bgColor: '', textColor: '', border: '' },
]

export default function HPEmbedCodeGenerator({ clinicId, clinicSlug }: HPEmbedCodeGeneratorProps) {
  const [position, setPosition] = useState<string>('header')
  const [buttonStyle, setButtonStyle] = useState<string>('primary')
  const [buttonText, setButtonText] = useState('Web予約はこちら')
  const [customBgColor, setCustomBgColor] = useState('#3B82F6')
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF')
  const [copied, setCopied] = useState<string | null>(null)

  const dmaxBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dmax.com'
  const bookingUrl = clinicSlug
    ? `${dmaxBaseUrl}/clinic/${clinicSlug}/booking`
    : `${dmaxBaseUrl}/web-booking`

  const selectedPosition = EMBED_POSITIONS.find(p => p.id === position)
  const selectedStyle = BUTTON_STYLES.find(s => s.id === buttonStyle)

  const getBgColor = () => buttonStyle === 'custom' ? customBgColor : selectedStyle?.bgColor || '#3B82F6'
  const getTextColor = () => buttonStyle === 'custom' ? customTextColor : selectedStyle?.textColor || '#FFFFFF'
  const getBorderColor = () => selectedStyle?.border || 'transparent'

  const generateTrackingUrl = () => {
    const params = new URLSearchParams({
      utm_source: 'hp',
      utm_medium: 'embed',
      utm_content: selectedPosition?.utmContent || position,
    })
    return `${bookingUrl}?${params.toString()}`
  }

  // 各種埋め込みコードを生成
  const generateButtonCode = () => {
    const url = generateTrackingUrl()
    const bgColor = getBgColor()
    const textColor = getTextColor()
    const borderColor = getBorderColor()

    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 12px 24px; background-color: ${bgColor}; color: ${textColor}; border: 2px solid ${borderColor || bgColor}; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">${buttonText}</a>`
  }

  const generateWidgetCode = () => {
    const url = generateTrackingUrl()
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`
  }

  const generateFloatingCode = () => {
    const url = generateTrackingUrl()
    const bgColor = getBgColor()
    const textColor = getTextColor()

    return `<style>
.dmax-floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  padding: 16px 24px;
  background-color: ${bgColor};
  color: ${textColor};
  border: none;
  border-radius: 50px;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dmax-floating-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.dmax-floating-btn svg {
  width: 20px;
  height: 20px;
}
</style>
<a href="${url}" target="_blank" rel="noopener noreferrer" class="dmax-floating-btn">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
  ${buttonText}
</a>`
  }

  const generateTrackingScript = () => {
    return `<!-- DAX トラッキングスクリプト -->
<script>
(function() {
  var dmaxClinicId = '${clinicId}';
  var script = document.createElement('script');
  script.src = '${dmaxBaseUrl}/tracking.js';
  script.async = true;
  script.dataset.clinicId = dmaxClinicId;
  document.head.appendChild(script);
})();
</script>`
  }

  const copyToClipboard = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const CodeBlock = ({ code, type, title }: { code: string; type: string; title: string }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{title}</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => copyToClipboard(code, type)}
        >
          {copied === type ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="ml-1">{copied === type ? 'コピー完了' : 'コピー'}</span>
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            HP埋め込みコード生成
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            ホームページに設置する予約ボタン・ウィジェットのコードを生成します。
            設置位置ごとにUTMパラメータが自動付与され、効果測定が可能です。
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 設置位置選択 */}
          <div>
            <Label>設置位置</Label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              {EMBED_POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => setPosition(pos.id)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    position === pos.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <pos.icon className={`w-6 h-6 mx-auto mb-1 ${
                    position === pos.id ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <p className="text-sm font-medium">{pos.label}</p>
                  <p className="text-xs text-gray-500">{pos.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ボタンスタイル */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ボタンスタイル</Label>
              <Select value={buttonStyle} onValueChange={setButtonStyle}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUTTON_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ボタンテキスト</Label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* カスタムカラー */}
          {buttonStyle === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>背景色</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>文字色</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* プレビュー */}
          <div>
            <Label>プレビュー</Label>
            <div className="mt-2 p-6 bg-gray-100 rounded-lg flex items-center justify-center">
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: getBgColor(),
                  color: getTextColor(),
                  border: `2px solid ${getBorderColor() || getBgColor()}`,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {buttonText}
              </a>
            </div>
          </div>

          {/* UTM情報 */}
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              <strong>自動付与されるUTMパラメータ:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">utm_source=hp</Badge>
                <Badge variant="outline">utm_medium=embed</Badge>
                <Badge variant="outline">utm_content={selectedPosition?.utmContent}</Badge>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* コード出力 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">埋め込みコード</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="button">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="button">ボタン</TabsTrigger>
              <TabsTrigger value="widget">ウィジェット</TabsTrigger>
              <TabsTrigger value="floating">フローティング</TabsTrigger>
              <TabsTrigger value="tracking">トラッキング</TabsTrigger>
            </TabsList>

            <TabsContent value="button" className="mt-4">
              <CodeBlock
                code={generateButtonCode()}
                type="button"
                title="ボタンコード（HTMLに貼り付け）"
              />
              <p className="text-xs text-gray-500 mt-2">
                このコードをHP内の任意の場所に貼り付けてください。
              </p>
            </TabsContent>

            <TabsContent value="widget" className="mt-4">
              <CodeBlock
                code={generateWidgetCode()}
                type="widget"
                title="ウィジェットコード（iframe）"
              />
              <p className="text-xs text-gray-500 mt-2">
                予約画面をそのまま埋め込むことができます。高さは調整してください。
              </p>
            </TabsContent>

            <TabsContent value="floating" className="mt-4">
              <CodeBlock
                code={generateFloatingCode()}
                type="floating"
                title="フローティングボタンコード"
              />
              <p className="text-xs text-gray-500 mt-2">
                画面右下に追従するボタンを表示します。bodyの閉じタグ直前に貼り付けてください。
              </p>
            </TabsContent>

            <TabsContent value="tracking" className="mt-4">
              <CodeBlock
                code={generateTrackingScript()}
                type="tracking"
                title="トラッキングスクリプト"
              />
              <p className="text-xs text-gray-500 mt-2">
                HPへの訪問者をトラッキングします。headタグ内に貼り付けてください。
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 設置ガイド */}
      <Alert>
        <AlertDescription className="text-sm">
          <strong>設置手順:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>設置位置とスタイルを選択</li>
            <li>必要なコードをコピー</li>
            <li>HPの該当箇所にコードを貼り付け</li>
            <li>アナリティクス画面で効果を確認</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  )
}
