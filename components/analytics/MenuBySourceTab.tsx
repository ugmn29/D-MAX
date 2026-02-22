'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, TrendingUp, Download } from 'lucide-react'
import { exportToCSV, CSVColumn } from '@/lib/utils/export-csv'

interface MenuBySourceTabProps {
  clinicId: string
  startDate: string
  endDate: string
}

interface MenuBySource {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  final_source: string
  menu_name: string
  booking_count: number
  total_revenue: number
}

interface MenuSummary {
  menu_name: string
  total_bookings: number
  total_revenue: number
  source_count: number
}

interface SourceSummary {
  utm_source: string
  utm_medium: string
  total_bookings: number
  total_revenue: number
  menu_count: number
}

type InnerTab = 'menu' | 'cross'

export default function MenuBySourceTab({ clinicId, startDate, endDate }: MenuBySourceTabProps) {
  const [loading, setLoading] = useState(false)
  const [menuBySource, setMenuBySource] = useState<MenuBySource[]>([])
  const [menuSummary, setMenuSummary] = useState<MenuSummary[]>([])
  const [sourceSummary, setSourceSummary] = useState<SourceSummary[]>([])
  const [totalBookings, setTotalBookings] = useState(0)
  const [innerTab, setInnerTab] = useState<InnerTab>('menu')

  useEffect(() => {
    loadData()
  }, [clinicId, startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await fetch(
        `/api/analytics/menu-by-source?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
      )

      if (res.ok) {
        const json = await res.json()
        setMenuBySource(json.data.menu_by_source || [])
        setMenuSummary(json.data.menu_summary || [])
        setSourceSummary(json.data.source_summary || [])
        setTotalBookings(json.data.total_bookings || 0)
      }
    } catch (error) {
      console.error('診療メニュー分析データ取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportMenuBySourceCSV = () => {
    const columns: CSVColumn[] = [
      { key: 'utm_source', label: '流入元' },
      { key: 'utm_medium', label: 'メディア' },
      { key: 'utm_campaign', label: 'キャンペーン' },
      { key: 'menu_name', label: '診療メニュー' },
      { key: 'booking_count', label: '予約数' },
      { key: 'total_revenue', label: '売上', format: (v) => `¥${v.toLocaleString()}` },
    ]

    exportToCSV(menuBySource, columns, `menu_by_source_${startDate}_${endDate}.csv`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const innerTabs: { id: InnerTab; label: string }[] = [
    { id: 'menu', label: 'メニュー別予約数' },
    { id: 'cross', label: 'クロス分析' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">総予約数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {totalBookings}件
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">診療メニュー数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {menuSummary.length}種類
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">流入元数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sourceSummary.length}種類
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 内部タブ */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {innerTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setInnerTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                innerTab === tab.id
                  ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1 flex justify-end items-center pb-1">
            <Button onClick={exportMenuBySourceCSV} variant="outline" size="sm" disabled={menuBySource.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              CSVエクスポート
            </Button>
          </div>
        </nav>
      </div>

      {/* メニュー別予約数タブ */}
      {innerTab === 'menu' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5" />
              診療メニュー別予約数
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              どの診療メニューが最も予約されているか
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {menuSummary.length > 0 ? (
                menuSummary.map((menu, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{menu.menu_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{menu.total_bookings}件</div>
                          <div className="text-xs text-gray-500">予約数</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">¥{menu.total_revenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">売上</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-600">{menu.source_count}種類</div>
                          <div className="text-xs text-gray-500">流入元</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${totalBookings > 0 ? (menu.total_bookings / totalBookings) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">データがありません</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* クロス分析タブ */}
      {innerTab === 'cross' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                流入元×診療メニューのクロス分析
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                どの流入元から、どの診療メニューが選ばれているか
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">流入元</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">メディア</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">診療メニュー</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">予約数</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">売上</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuBySource.length > 0 ? (
                      menuBySource.map((item, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{item.utm_source}</td>
                          <td className="px-4 py-3 text-sm">{item.utm_medium}</td>
                          <td className="px-4 py-3 text-sm font-medium">{item.menu_name}</td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                            {item.booking_count}件
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                            ¥{item.total_revenue.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          データがありません
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* インサイト */}
          {menuBySource.length > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-900">💡 インサイト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-blue-900">
                {menuBySource.slice(0, 3).map((item, index) => (
                  <p key={index}>
                    <strong>{item.utm_source}/{item.utm_medium}</strong> 経由のユーザーは
                    <strong className="text-blue-600"> {item.menu_name} </strong>
                    を選ぶ傾向があります（{item.booking_count}件）
                  </p>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
