'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, ChevronRight, ChevronLeft, Check, AlertCircle, Download, X } from 'lucide-react'

// D-MAX フィールド定義
const DMAX_FIELDS = [
  { key: 'patient_id', label: '患者番号', required: true, hints: ['患者番号', 'カルテno', 'カルテNo', 'カルテNO', '患者ID', 'patient_id', 'ID', 'No'] },
  { key: 'treatment_date', label: '診療日', required: true, hints: ['診療日', '来院日', '日付', 'treatment_date', '診療年月日'] },
  { key: 'total_amount', label: '合計金額', required: true, hints: ['合計', '合計金額', 'total_amount', '請求合計', '総合計', '合計額'] },
  { key: 'receipt_number', label: 'レセプト番号', required: false, hints: ['レセプト番号', 'receipt_number', 'レセNo', 'レセ番号'] },
  { key: 'insurance_type', label: '保険種別', required: false, hints: ['保険種別', 'insurance_type', '保険', '種別', '保険区分'] },
  { key: 'insurance_points', label: '保険点数', required: false, hints: ['保険点数', 'insurance_points', '点数', '総点数'] },
  { key: 'insurance_amount', label: '保険請求額', required: false, hints: ['保険請求額', 'insurance_amount', '保険点数金額', '請求額'] },
  { key: 'patient_copay', label: '患者負担額', required: false, hints: ['患者負担額', 'patient_copay', '患者負担', '一部負担金', '負担金'] },
  { key: 'self_pay_amount', label: '自費金額', required: false, hints: ['自費金額', 'self_pay_amount', '自費', '自由診療'] },
  { key: 'staff_name', label: '担当者名', required: false, hints: ['担当者', '担当者名', 'staff_name', '担当', 'ドクター', '医師名'] },
  { key: 'treatment_menu', label: '診療メニュー', required: false, hints: ['診療メニュー', 'treatment_menu', '診療内容', 'メニュー', '処置内容'] },
]

interface ColumnMapping {
  [dmaxKey: string]: string // dmaxKey -> csvColumnName
}

interface ImportWizardProps {
  clinicId: string
  onComplete?: () => void
  onClose?: () => void
}

export default function SalesImportWizard({ clinicId, onComplete, onClose }: ImportWizardProps) {
  const [step, setStep] = useState(1)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([])
  const [csvText, setCsvText] = useState('')
  const [fileName, setFileName] = useState('')
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [skipErrors, setSkipErrors] = useState(true)
  const [dryRunResult, setDryRunResult] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 自動列マッピング推定
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const detected: ColumnMapping = {}
    for (const field of DMAX_FIELDS) {
      for (const header of headers) {
        if (field.hints.some(hint => header.includes(hint) || hint.includes(header))) {
          detected[field.key] = header
          break
        }
      }
    }
    return detected
  }

  // CSVファイルを読み込む（Shift-JIS / UTF-8 両対応）
  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        // Shift-JIS を試みる
        let text = ''
        try {
          text = new TextDecoder('shift-jis').decode(buffer)
          // 文字化けチェック（置換文字が多い場合はUTF-8として再試行）
          if ((text.match(/\uFFFD/g) || []).length > 5) {
            text = new TextDecoder('utf-8').decode(buffer)
          }
        } catch {
          text = new TextDecoder('utf-8').decode(buffer)
        }

        const lines = text.split(/\r?\n/).filter(l => l.trim())
        if (lines.length < 2) {
          alert('CSVにデータが含まれていません')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const preview = lines.slice(1, 4).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
          const row: Record<string, string> = {}
          headers.forEach((h, i) => { row[h] = values[i] || '' })
          return row
        })

        setCsvHeaders(headers)
        setCsvPreview(preview)
        setCsvText(text)
        setFileName(file.name)
        setMapping(autoDetectMapping(headers))
        setStep(2)
      } catch (err) {
        alert('ファイルの読み込みに失敗しました')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('CSVファイルを選択してください')
      return
    }
    readFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  // CSVを列マッピングに基づいて変換
  const buildMappedCsvText = (): string => {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim())
    const originalHeaders = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

    // 新しいヘッダー行（D-MAXのキー名）
    const newHeaders = DMAX_FIELDS
      .filter(f => mapping[f.key])
      .map(f => f.key)
    const csvColNames = DMAX_FIELDS
      .filter(f => mapping[f.key])
      .map(f => mapping[f.key])

    const result = [newHeaders.join(',')]
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row = csvColNames.map(col => {
        const idx = originalHeaders.indexOf(col)
        return idx >= 0 ? values[idx] || '' : ''
      })
      result.push(row.join(','))
    }
    return result.join('\n')
  }

  // ドライラン
  const handleDryRun = async () => {
    setLoading(true)
    try {
      const mappedCsv = buildMappedCsvText()
      const res = await fetch('/api/sales-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: mappedCsv,
          clinicId,
          options: { dryRun: true, skipErrors }
        })
      })
      const data = await res.json()
      setDryRunResult(data)
      setStep(3)
    } catch (err) {
      alert('ドライランに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 本番インポート
  const handleImport = async () => {
    setLoading(true)
    try {
      const mappedCsv = buildMappedCsvText()
      const res = await fetch('/api/sales-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvText: mappedCsv,
          clinicId,
          options: { dryRun: false, skipErrors }
        })
      })
      const data = await res.json()
      setImportResult(data)
      setStep(4)
      if (data.success && onComplete) onComplete()
    } catch (err) {
      alert('インポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // エラーCSVダウンロード
  const downloadErrors = (errors: any[]) => {
    const lines = ['行番号,エラー内容', ...errors.map((e: any) => `${e.row},"${e.error}"`)]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import_errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const requiredMapped = DMAX_FIELDS.filter(f => f.required).every(f => mapping[f.key])

  return (
    <div className="space-y-6">
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step > s ? 'bg-green-500 text-white' :
              step === s ? 'bg-blue-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${step === s ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              {s === 1 ? 'アップロード' : s === 2 ? '列マッピング' : s === 3 ? '確認' : '完了'}
            </span>
            {s < 4 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: ファイルアップロード */}
      {step === 1 && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">CSVファイルをドロップ</p>
            <p className="text-sm text-gray-500 mb-4">または</p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              ファイルを選択
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <p className="text-xs text-gray-400 mt-4">Shift-JIS / UTF-8 対応</p>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4 text-sm text-blue-800 space-y-1">
              <p className="font-semibold">power5G からのエクスポート方法（例）</p>
              <p>「月次集計」または「日計表」メニューから CSV エクスポートを選択してください。</p>
              <p>列名が違っても、次のステップで手動マッピングできます。</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: 列マッピング */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{fileName}</span> を読み込みました。
            CSVの列をD-MAXの項目に対応させてください。
          </div>

          {/* プレビュー */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">CSVプレビュー（先頭3行）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      {csvHeaders.map(h => (
                        <th key={h} className="px-2 py-1 text-left border font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, i) => (
                      <tr key={i} className="border-b">
                        {csvHeaders.map(h => (
                          <td key={h} className="px-2 py-1 border text-gray-600">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* マッピング設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">列マッピング設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DMAX_FIELDS.map(field => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-40 text-sm">
                      <span>{field.label}</span>
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <select
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={mapping[field.key] || ''}
                      onChange={(e) => setMapping(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                    >
                      <option value="">（使用しない）</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    {mapping[field.key] && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> 設定済
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {!requiredMapped && (
                <p className="text-red-500 text-sm mt-3 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  必須項目（患者番号・診療日・合計金額）を設定してください
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
                className="w-4 h-4"
              />
              エラー行をスキップして続行
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
            </Button>
            <Button onClick={handleDryRun} disabled={!requiredMapped || loading}>
              {loading ? '確認中...' : '内容を確認する'}
              {!loading && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: ドライラン結果・確認 */}
      {step === 3 && dryRunResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">総レコード数</p>
                <p className="text-3xl font-bold text-gray-900">{dryRunResult.total_records}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">インポート可能</p>
                <p className="text-3xl font-bold text-green-600">{dryRunResult.success_records}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">エラー</p>
                <p className="text-3xl font-bold text-red-500">{dryRunResult.failed_records}</p>
              </CardContent>
            </Card>
          </div>

          {dryRunResult.errors?.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" /> エラー詳細
                  </span>
                  <Button variant="outline" size="sm" onClick={() => downloadErrors(dryRunResult.errors)}>
                    <Download className="w-3 h-3 mr-1" /> エラー一覧をDL
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {dryRunResult.errors.slice(0, 20).map((e: any, i: number) => (
                    <div key={i} className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      行{e.row}: {e.error}
                    </div>
                  ))}
                  {dryRunResult.errors.length > 20 && (
                    <p className="text-xs text-gray-500 text-center">... 他{dryRunResult.errors.length - 20}件</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || dryRunResult.success_records === 0}
            >
              {loading ? 'インポート中...' : `${dryRunResult.success_records}件をインポート`}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: 完了 */}
      {step === 4 && importResult && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">インポート完了</h3>
            <p className="text-gray-600">
              {importResult.success_records}件の売上データを取り込みました
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">総レコード数</p>
                <p className="text-2xl font-bold">{importResult.total_records}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">成功</p>
                <p className="text-2xl font-bold text-green-600">{importResult.success_records}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-sm text-gray-600">失敗</p>
                <p className="text-2xl font-bold text-red-500">{importResult.failed_records}</p>
              </CardContent>
            </Card>
          </div>

          {importResult.failed_records > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => downloadErrors(importResult.errors)}>
                <Download className="w-4 h-4 mr-2" /> エラー一覧をダウンロード
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-3">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-1" /> 閉じる
              </Button>
            )}
            <Button onClick={() => { setStep(1); setCsvText(''); setCsvHeaders([]); setImportResult(null) }}>
              続けてインポート
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
