"use client"

import { useState, useRef, useCallback } from "react"
import Papa from "papaparse"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  RefreshCw,
  Upload,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  FileSpreadsheet
} from "lucide-react"
import { useClinicId } from '@/hooks/use-clinic-id'

interface CSVData {
  headers: string[]
  rows: any[]
  fileName: string
  rowCount: number
}

export default function DataImportPage() {
  const clinicId = useClinicId()
  const [activeTab, setActiveTab] = useState<'patients' | 'appointments' | 'history'>('patients')
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<string>('other')
  const [customSystemName, setCustomSystemName] = useState<string>('')
  const [numberHandling, setNumberHandling] = useState<'keep' | 'new'>('keep')
  const [startNumber, setStartNumber] = useState<number>(10000)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // データ検証関数
  const validateCSVData = useCallback((data: CSVData) => {
    const errors: string[] = []
    const warnings: string[] = []

    // 必須フィールドのチェック（患者データの場合）
    const requiredFields = ['姓', '名', '生年月日']
    const missingFields = requiredFields.filter(field => !data.headers.includes(field))

    if (missingFields.length > 0) {
      errors.push(`必須フィールドが不足しています: ${missingFields.join(', ')}`)
    }

    // 患者番号フィールドの確認
    const patientNumberFields = ['患者番号', '診察券番号', 'ID', 'patient_number']
    const hasPatientNumber = patientNumberFields.some(field => data.headers.includes(field))

    if (!hasPatientNumber && numberHandling === 'keep') {
      warnings.push('患者番号フィールドが見つかりません。新規採番に変更することをお勧めします。')
    }

    // データの整合性チェック
    if (data.rows.length === 0) {
      errors.push('データが含まれていません')
    } else if (data.rows.length > 10000) {
      warnings.push(`データ件数が多いため、処理に時間がかかる可能性があります（${data.rowCount}件）`)
    }

    // 重複チェック（サンプル）
    const firstPatientNumberField = patientNumberFields.find(field => data.headers.includes(field))
    if (firstPatientNumberField) {
      const patientNumbers = data.rows.map(row => row[firstPatientNumberField]).filter(Boolean)
      const uniqueNumbers = new Set(patientNumbers)
      if (patientNumbers.length !== uniqueNumbers.size) {
        warnings.push('CSVファイル内に重複する患者番号が存在します')
      }
    }

    setValidationErrors(errors)
    setValidationWarnings(warnings)

    return { errors, warnings }
  }, [numberHandling])

  // ファイル処理関数
  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('CSVファイルのみ対応しています')
      return
    }

    setIsProcessing(true)

    // 文字コード自動検出のためにArrayBufferとして読み込み
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer

      // UTF-8として試行
      let text = new TextDecoder('utf-8').decode(arrayBuffer)

      // UTF-8でない場合はShift_JISとして試行
      if (text.includes('�')) {
        text = new TextDecoder('shift-jis').decode(arrayBuffer)
      }

      // CSVをパース
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            alert('CSVファイルにデータがありません')
            setIsProcessing(false)
            return
          }

          const parsedData: CSVData = {
            headers: results.meta.fields || [],
            rows: results.data,
            fileName: file.name,
            rowCount: results.data.length
          }

          setCsvData(parsedData)

          // データ検証を実行
          validateCSVData(parsedData)

          setIsProcessing(false)
          console.log('CSVパース完了:', {
            headers: results.meta.fields,
            rowCount: results.data.length,
            preview: results.data.slice(0, 3)
          })
        },
        error: (error) => {
          console.error('CSV解析エラー:', error)
          alert('CSVファイルの解析に失敗しました')
          setIsProcessing(false)
        }
      })
    }

    reader.onerror = () => {
      alert('ファイルの読み込みに失敗しました')
      setIsProcessing(false)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  // ドラッグ&ドロップハンドラ
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  // ファイル削除ハンドラ
  const handleRemoveFile = useCallback(() => {
    setCsvData(null)
    setValidationErrors([])
    setValidationWarnings([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // numberHandling変更時に再検証
  useCallback(() => {
    if (csvData) {
      validateCSVData(csvData)
    }
  }, [csvData, numberHandling, validateCSVData])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="w-8 h-8" />
            データ移行
          </h1>
          <p className="text-gray-600 mt-2">
            他社予約システムからD-MAXへ患者データや予約履歴を移行します
          </p>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex space-x-2 border-b">
        <button
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'patients'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          患者データ
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'appointments'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          予約データ
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          移行履歴
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTab === 'patients' && (
          <Card>
            <CardHeader>
              <CardTitle>患者データのインポート</CardTitle>
              <CardDescription>
                CSVファイルから患者情報を一括インポートします。診察券番号もそのまま引き継げます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ステップ1: ファイルアップロード */}
              <div>
                <h3 className="text-lg font-semibold mb-3">ステップ1: CSVファイルをアップロード</h3>

                {!csvData ? (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="space-y-3">
                        <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                        <p className="text-gray-600">ファイルを処理中...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">
                          ここにファイルをドラッグ&ドロップ
                        </p>
                        <p className="text-sm text-gray-500 mb-4">または</p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          ファイルを選択
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500 mt-4">
                          対応形式: CSV (UTF-8, Shift_JIS)
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-medium text-gray-900">{csvData.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {csvData.rowCount}件のデータ / {csvData.headers.length}列
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ステップ2: 移行元システム選択 */}
              <div>
                <h3 className="text-lg font-semibold mb-3">ステップ2: 移行元システムを選択</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="system"
                      value="dentnet"
                      checked={selectedSystem === 'dentnet'}
                      onChange={(e) => setSelectedSystem(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>デントネット</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="system"
                      value="apotool"
                      checked={selectedSystem === 'apotool'}
                      onChange={(e) => setSelectedSystem(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Apotool & Box</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="system"
                      value="dentalx"
                      checked={selectedSystem === 'dentalx'}
                      onChange={(e) => setSelectedSystem(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>デンタルX</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="system"
                      value="other"
                      checked={selectedSystem === 'other'}
                      onChange={(e) => setSelectedSystem(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>その他:</span>
                    <input
                      type="text"
                      placeholder="システム名を入力"
                      value={customSystemName}
                      onChange={(e) => setCustomSystemName(e.target.value)}
                      disabled={selectedSystem !== 'other'}
                      className="border rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </label>
                </div>
              </div>

              {/* ステップ3: 患者番号の扱い */}
              <div>
                <h3 className="text-lg font-semibold mb-3">ステップ3: 患者番号の扱い</h3>
                <div className="space-y-3">
                  <label className="flex items-start space-x-2">
                    <input
                      type="radio"
                      name="number-handling"
                      value="keep"
                      checked={numberHandling === 'keep'}
                      onChange={(e) => setNumberHandling(e.target.value as 'keep' | 'new')}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <div className="font-medium">旧システムの番号をそのまま使用（推奨）</div>
                      <p className="text-sm text-gray-600">
                        診察券番号を変更せず、患者様の混乱を防ぎます。
                        文字列番号（例: P-1001）の場合は数字部分を抽出し、元の番号も保存します。
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-2">
                    <input
                      type="radio"
                      name="number-handling"
                      value="new"
                      checked={numberHandling === 'new'}
                      onChange={(e) => setNumberHandling(e.target.value as 'keep' | 'new')}
                      className="w-4 h-4 mt-1"
                    />
                    <div>
                      <div className="font-medium">新しい番号を自動採番</div>
                      <p className="text-sm text-gray-600">
                        D-MAXで新しい患者番号を発行します。旧番号は参照用として保存されます。
                      </p>
                      <div className="mt-2">
                        <label className="text-sm">
                          開始番号:
                          <input
                            type="number"
                            value={startNumber}
                            onChange={(e) => setStartNumber(parseInt(e.target.value) || 10000)}
                            disabled={numberHandling !== 'new'}
                            className="border rounded px-2 py-1 text-sm ml-2 w-24 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </label>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* 検証結果 */}
              {csvData && (validationErrors.length > 0 || validationWarnings.length > 0) && (
                <div className="space-y-3">
                  {validationErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 mb-2">エラー</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                            {validationErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {validationWarnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900 mb-2">警告</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                            {validationWarnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CSVデータプレビュー */}
              {csvData && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">データプレビュー</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            {csvData.headers.slice(0, 8).map((header, index) => (
                              <th
                                key={index}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {header}
                              </th>
                            ))}
                            {csvData.headers.length > 8 && (
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ...
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {rowIndex + 1}
                              </td>
                              {csvData.headers.slice(0, 8).map((header, colIndex) => (
                                <td
                                  key={colIndex}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {row[header] || '-'}
                                </td>
                              ))}
                              {csvData.headers.length > 8 && (
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  ...
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.rowCount > 10 && (
                      <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-t">
                        最初の10件を表示しています（全{csvData.rowCount}件）
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSVテンプレートをダウンロード
                </Button>
                <Button
                  disabled={!csvData || validationErrors.length > 0}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  次へ: フィールドマッピング
                </Button>
              </div>

              {/* 検証成功メッセージ */}
              {csvData && validationErrors.length === 0 && validationWarnings.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">検証が完了しました</p>
                      <p className="text-sm text-green-800 mt-1">
                        すべてのデータが正常です。「次へ: フィールドマッピング」をクリックして続けてください。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'appointments' && (
          <Card>
            <CardHeader>
              <CardTitle>予約データのインポート</CardTitle>
              <CardDescription>
                過去の予約履歴をCSVファイルから一括インポートします
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>予約データインポート機能は準備中です</p>
                <p className="text-sm mt-2">まず患者データをインポートしてください</p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>移行履歴</CardTitle>
              <CardDescription>
                過去のデータ移行の履歴を確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>移行履歴はありません</p>
                <p className="text-sm mt-2">データをインポートすると履歴が表示されます</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 注意事項 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">インポート前の確認事項</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>CSVファイルの文字コードはUTF-8またはShift_JISに対応しています</li>
                <li>患者番号が重複する場合は、スキップまたは新規番号を自動採番します</li>
                <li>インポート後24時間以内であれば、「元に戻す」機能で取り消しできます</li>
                <li>大量データの場合、処理に数分かかる場合があります</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
