import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import path from 'path'

Font.register({
  family: 'NotoSansJP',
  src: path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP.ttf'),
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 10,
    padding: 40,
    color: '#111',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaLeft: {
    flex: 1,
  },
  metaRight: {
    textAlign: 'right',
    fontSize: 9,
    color: '#444',
    gap: 2,
  },
  to: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subText: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  notice: {
    fontSize: 10,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colItem: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnit: { flex: 1, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  headerText: { fontSize: 9, fontWeight: 'bold', color: '#374151' },
  totals: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 2,
  },
  totalLabel: { width: 100, textAlign: 'right', fontSize: 9, color: '#555' },
  totalValue: { width: 80, textAlign: 'right', fontSize: 9 },
  grandTotalLabel: { width: 100, textAlign: 'right', fontSize: 11, fontWeight: 'bold' },
  grandTotalValue: { width: 80, textAlign: 'right', fontSize: 11, fontWeight: 'bold' },
  issuer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    paddingTop: 12,
    fontSize: 9,
    color: '#444',
  },
  receiptNote: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    fontSize: 10,
  },
})

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export interface MonthlyInvoiceData {
  clinic_name: string
  year: number
  month: number
  plan_name: string
  plan_fee: number
  sms_count: number
  sms_unit_price: number
  sms_total: number
  subtotal: number
  tax: number
  total: number
  issuer: {
    issuer_company_name?: string | null
    issuer_postal_code?: string | null
    issuer_prefecture?: string | null
    issuer_city?: string | null
    issuer_address_line?: string | null
    issuer_phone?: string | null
    issuer_registration_number?: string | null
  } | null
}

export function InvoicePDF({ data, type }: { data: MonthlyInvoiceData; type: 'invoice' | 'receipt' }) {
  const isReceipt = type === 'receipt'
  const title = isReceipt ? '領収書' : '請求書'
  const now = new Date()
  const issueDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  const docNumber = `${isReceipt ? 'REC' : 'INV'}-${data.year}-${pad(data.month)}-${data.clinic_name.slice(0, 4)}`
  const periodLabel = `${data.year}年${data.month}月分`
  const issuer = data.issuer

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.meta}>
          <View style={styles.metaLeft}>
            <Text style={styles.to}>{data.clinic_name} 御中</Text>
            <Text style={styles.subText}>対象期間: {periodLabel}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text>{title}番号: {docNumber}</Text>
            <Text>発行日: {issueDate}</Text>
            {!isReceipt && <Text>支払期限: 発行月末日</Text>}
          </View>
        </View>

        {isReceipt ? (
          <View style={styles.receiptNote}>
            <Text>上記{fmt(data.total)}を確かに領収いたしました。</Text>
          </View>
        ) : (
          <Text style={styles.notice}>下記のとおりご請求申し上げます。</Text>
        )}

        {/* 合計金額ハイライト */}
        <View style={{ marginBottom: 16, padding: 10, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' }}>
          <Text style={{ fontSize: 9, color: '#1d4ed8' }}>
            {isReceipt ? '領収金額' : 'ご請求金額（税込）'}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' }}>{fmt(data.total)}</Text>
        </View>

        {/* 明細テーブル */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colItem]}>品目</Text>
          <Text style={[styles.headerText, styles.colQty]}>数量</Text>
          <Text style={[styles.headerText, styles.colUnit]}>単価</Text>
          <Text style={[styles.headerText, styles.colAmount]}>金額</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.colItem}>HubDent {data.plan_name}（{periodLabel}）</Text>
          <Text style={styles.colQty}>1</Text>
          <Text style={styles.colUnit}>{fmt(data.plan_fee)}</Text>
          <Text style={styles.colAmount}>{fmt(data.plan_fee)}</Text>
        </View>

        {data.sms_count > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.colItem}>SMS送信料（{data.sms_count}通）</Text>
            <Text style={styles.colQty}>{data.sms_count}</Text>
            <Text style={styles.colUnit}>{fmt(data.sms_unit_price)}</Text>
            <Text style={styles.colAmount}>{fmt(data.sms_total)}</Text>
          </View>
        )}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小計</Text>
            <Text style={styles.totalValue}>{fmt(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>消費税（10%）</Text>
            <Text style={styles.totalValue}>{fmt(data.tax)}</Text>
          </View>
          <View style={[styles.totalRow, { marginTop: 4 }]}>
            <Text style={styles.grandTotalLabel}>合計</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.total)}</Text>
          </View>
        </View>

        {/* 発行者情報 */}
        {issuer && (
          <View style={styles.issuer}>
            {issuer.issuer_company_name && <Text style={{ fontWeight: 'bold' }}>{issuer.issuer_company_name}</Text>}
            {(issuer.issuer_postal_code || issuer.issuer_prefecture) && (
              <Text>〒{issuer.issuer_postal_code} {issuer.issuer_prefecture}{issuer.issuer_city}{issuer.issuer_address_line}</Text>
            )}
            {issuer.issuer_phone && <Text>TEL: {issuer.issuer_phone}</Text>}
            {issuer.issuer_registration_number && (
              <Text>適格請求書登録番号: {issuer.issuer_registration_number}</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}
