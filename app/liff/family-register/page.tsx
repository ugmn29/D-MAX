'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Search,
  Calendar,
  Phone,
  User,
  Check,
  AlertCircle,
  Loader2,
  UserPlus,
  ChevronRight
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

declare global {
  interface Window {
    liff: any
  }
}

interface SearchResult {
  id: string
  patient_number: number
  last_name: string
  first_name: string
  birth_date: string
  phone: string
}

export default function FamilyRegisterPage() {
  const [liffReady, setLiffReady] = useState(false)
  const [lineUserId, setLineUserId] = useState<string | null>(null)
  const [searchName, setSearchName] = useState('')
  const [searchBirthDate, setSearchBirthDate] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedPatient, setSelectedPatient] = useState<SearchResult | null>(null)
  const [relationship, setRelationship] = useState<'parent' | 'spouse' | 'child' | 'other'>('child')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // LIFF初期化
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // LIFF SDK待機（50msごとにチェック、10秒でタイムアウト）
        const liffLoaded = await new Promise<boolean>((resolve) => {
          if (typeof window !== 'undefined' && window.liff) {
            resolve(true)
            return
          }
          const checkLiff = setInterval(() => {
            if (typeof window !== 'undefined' && window.liff) {
              clearInterval(checkLiff)
              resolve(true)
            }
          }, 50)
          setTimeout(() => {
            clearInterval(checkLiff)
            resolve(false)
          }, 10000)
        })

        if (!liffLoaded) {
          setError('LIFF SDKの読み込みに失敗しました')
          setLiffReady(true) // エラー画面を表示するためにtrueにする
          return
        }

        // LIFF ID取得
        let liffId = process.env.NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER
        if (!liffId) {
          try {
            const response = await fetch('/api/liff-settings')
            if (response.ok) {
              const data = await response.json()
              liffId = data.family_register || null
            }
          } catch (e) {
            console.warn('API LIFF ID取得エラー:', e)
          }
        }

        if (!liffId) {
          setError('LIFF IDが設定されていません')
          setLiffReady(true) // エラー画面を表示するためにtrueにする
          return
        }

        await window.liff.init({ liffId })

        if (window.liff.isLoggedIn()) {
          const profile = await window.liff.getProfile()
          setLineUserId(profile.userId)
          setLiffReady(true)
        } else {
          window.liff.login()
        }
      } catch (err: any) {
        console.error('LIFF初期化エラー:', err)
        const errorMessage = err?.message || err?.toString() || '不明なエラー'
        setError(`初期化に失敗しました: ${errorMessage}`)
        setLiffReady(true) // エラー画面を表示するためにtrueにする
      }
    }

    initializeLiff()
  }, [])

  // 生年月日をフォーマット
  const formatBirthDate = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')

    if (cleaned.length <= 4) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 4)}/${cleaned.slice(4)}`
    } else {
      return `${cleaned.slice(0, 4)}/${cleaned.slice(4, 6)}/${cleaned.slice(6, 8)}`
    }
  }

  // 電話番号をフォーマット
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '')

    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`
    }
  }

  // 患者検索
  const handleSearch = async () => {
    if (!searchName || !searchBirthDate || !searchPhone) {
      setError('すべての項目を入力してください')
      return
    }

    if (searchBirthDate.length !== 10) {
      setError('生年月日を正しく入力してください（例: 1990/01/01）')
      return
    }

    setSearching(true)
    setError(null)
    setSearchResults([])
    setSelectedPatient(null)

    try {
      const formattedBirthDate = searchBirthDate.replace(/\//g, '-')
      const formattedPhone = searchPhone.replace(/-/g, '')

      const response = await fetch(`/api/patients/search?name=${encodeURIComponent(searchName)}&birth_date=${formattedBirthDate}&phone=${formattedPhone}`)
      const data = await response.json()

      if (response.ok) {
        if (data.results.length === 0) {
          setError('該当する患者が見つかりませんでした。入力内容をご確認ください。')
        } else {
          setSearchResults(data.results)
        }
      } else {
        setError(data.error || '検索に失敗しました')
      }
    } catch (err) {
      console.error('検索エラー:', err)
      setError('検索処理中にエラーが発生しました')
    } finally {
      setSearching(false)
    }
  }

  // 家族登録
  const handleRegister = async () => {
    if (!lineUserId || !selectedPatient) {
      setError('登録する患者を選択してください')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/line/family-linkage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          patient_id: selectedPatient.id,
          relationship: relationship
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)

        // 3秒後にLIFFを閉じる
        setTimeout(() => {
          if (window.liff) {
            window.liff.closeWindow()
          }
        }, 3000)
      } else {
        setError(data.error || '登録に失敗しました')
      }
    } catch (err) {
      console.error('登録エラー:', err)
      setError('登録処理中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // LIFF読み込み中
  if (!liffReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <p className="text-gray-600">初期化中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 登録成功画面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">登録完了！</h2>
              <p className="text-gray-600">
                {selectedPatient?.last_name} {selectedPatient?.first_name}様を<br />
                家族として登録しました
              </p>
              <div className="pt-4 text-sm text-gray-500">
                このウィンドウは自動的に閉じます
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // メイン画面
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto max-w-md p-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            家族の登録
          </h1>
          <p className="text-gray-600 text-sm">
            ご家族の患者情報を検索して登録できます
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 検索フォーム */}
        {!selectedPatient && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">患者情報を検索</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 氏名入力 */}
              <div className="space-y-2">
                <Label htmlFor="search-name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  氏名（姓または名）
                </Label>
                <Input
                  id="search-name"
                  type="text"
                  placeholder="山田"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  disabled={searching}
                />
                <p className="text-xs text-gray-500">
                  姓または名の一部でも検索できます
                </p>
              </div>

              {/* 生年月日入力 */}
              <div className="space-y-2">
                <Label htmlFor="search-birth-date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  生年月日
                </Label>
                <Input
                  id="search-birth-date"
                  type="text"
                  placeholder="2000/01/01"
                  value={searchBirthDate}
                  onChange={(e) => {
                    const formatted = formatBirthDate(e.target.value)
                    setSearchBirthDate(formatted)
                  }}
                  maxLength={10}
                  className="text-center"
                  disabled={searching}
                />
              </div>

              {/* 電話番号入力 */}
              <div className="space-y-2">
                <Label htmlFor="search-phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  電話番号
                </Label>
                <Input
                  id="search-phone"
                  type="tel"
                  placeholder="090-1234-5678"
                  value={searchPhone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setSearchPhone(formatted)
                  }}
                  maxLength={13}
                  className="text-center"
                  disabled={searching}
                />
              </div>

              {/* 検索ボタン */}
              <Button
                onClick={handleSearch}
                disabled={searching || !searchName || !searchBirthDate || !searchPhone}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    検索中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    検索する
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 検索結果 */}
        {searchResults.length > 0 && !selectedPatient && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">検索結果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedPatient(result)}
                    className="w-full p-4 text-left rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.last_name} {result.first_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          患者番号: {result.patient_number}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          生年月日: {result.birth_date}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 関係性選択・登録 */}
        {selectedPatient && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">登録内容の確認</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 選択された患者情報 */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="font-medium text-gray-900 mb-1">
                  {selectedPatient.last_name} {selectedPatient.first_name}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>患者番号: {selectedPatient.patient_number}</div>
                  <div>生年月日: {selectedPatient.birth_date}</div>
                </div>
              </div>

              {/* 関係性選択 */}
              <div className="space-y-2">
                <Label htmlFor="relationship">あなたとの関係</Label>
                <Select
                  value={relationship}
                  onValueChange={(value: any) => setRelationship(value)}
                  disabled={loading}
                >
                  <SelectTrigger id="relationship">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="child">子供</SelectItem>
                    <SelectItem value="parent">親</SelectItem>
                    <SelectItem value="spouse">配偶者</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  登録する患者とあなたの関係を選択してください
                </p>
              </div>

              {/* アクションボタン */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPatient(null)
                    setSearchResults([])
                  }}
                  disabled={loading}
                >
                  戻る
                </Button>
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      登録中...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      登録する
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 案内 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">ご注意</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>検索には正確な生年月日と電話番号が必要です</li>
                  <li>ご本人または保護者の方のみ登録できます</li>
                  <li>不明な点は受付スタッフにお尋ねください</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
