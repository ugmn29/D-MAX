/**
 * 売上集計API
 * KPI・月別推移・保険種別・診療メニュー別・インポート履歴
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { decodeInsuranceType } from '@/lib/api/sales-import'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!clinic_id) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    const dateWhere: any = {}
    if (start_date) dateWhere.gte = new Date(start_date)
    if (end_date) dateWhere.lte = new Date(end_date)

    const where: any = {
      clinic_id,
      ...(Object.keys(dateWhere).length > 0 ? { sale_date: dateWhere } : {})
    }

    // 全売上データを取得
    const sales = await prisma.sales.findMany({
      where,
      select: {
        id: true,
        sale_date: true,
        total_amount: true,
        amount: true,
        category: true,
        insurance_type: true,
        insurance_amount: true,
        patient_copay: true,
        self_pay_amount: true,
        insurance_points: true,
        patient_id: true,
        treatment_menu_id: true,
        treatment_menus: {
          select: { id: true, name: true }
        }
      },
      orderBy: { sale_date: 'asc' }
    })

    if (sales.length === 0) {
      // データなし
      return NextResponse.json({
        success: true,
        has_data: false,
        kpi: null,
        monthly: [],
        by_insurance_type: [],
        by_treatment_menu: [],
        import_history: await getImportHistory(prisma, clinic_id)
      })
    }

    // --- KPI 集計 ---
    const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount ?? s.amount ?? 0), 0)
    const insuranceRevenue = sales
      .filter(s => s.category !== 'self_pay')
      .reduce((sum, s) => sum + (s.insurance_amount ?? 0) + (s.patient_copay ?? 0), 0)
    const selfPayRevenue = sales
      .filter(s => s.category === 'self_pay')
      .reduce((sum, s) => sum + (s.self_pay_amount ?? s.total_amount ?? s.amount ?? 0), 0)
    const uniquePatients = new Set(sales.map(s => s.patient_id)).size
    const avgPerPatient = uniquePatients > 0 ? Math.round(totalRevenue / uniquePatients) : 0

    // --- 月別推移 ---
    const monthlyMap = new Map<string, { insurance: number; self_pay: number; total: number; count: number }>()
    for (const s of sales) {
      const d = s.sale_date
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap.has(key)) monthlyMap.set(key, { insurance: 0, self_pay: 0, total: 0, count: 0 })
      const m = monthlyMap.get(key)!
      const total = s.total_amount ?? s.amount ?? 0
      m.total += total
      m.count += 1
      if (s.category === 'self_pay') {
        m.self_pay += s.self_pay_amount ?? total
      } else {
        m.insurance += (s.insurance_amount ?? 0) + (s.patient_copay ?? 0)
      }
    }
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }))

    // --- 保険種別内訳 ---
    const insuranceTypeMap = new Map<string, { amount: number; count: number }>()
    for (const s of sales) {
      const rawType = s.insurance_type || (s.category === 'self_pay' ? '9' : '1')
      const label = decodeInsuranceType(rawType) || rawType
      if (!insuranceTypeMap.has(label)) insuranceTypeMap.set(label, { amount: 0, count: 0 })
      const entry = insuranceTypeMap.get(label)!
      entry.amount += s.total_amount ?? s.amount ?? 0
      entry.count += 1
    }
    const by_insurance_type = Array.from(insuranceTypeMap.entries())
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.amount - a.amount)

    // --- 診療メニュー別 ---
    const menuMap = new Map<string, { name: string; amount: number; count: number }>()
    for (const s of sales) {
      const menuId = s.treatment_menu_id ?? '__unknown__'
      const menuName = s.treatment_menus?.name ?? '未分類'
      if (!menuMap.has(menuId)) menuMap.set(menuId, { name: menuName, amount: 0, count: 0 })
      const entry = menuMap.get(menuId)!
      entry.amount += s.total_amount ?? s.amount ?? 0
      entry.count += 1
    }
    const by_treatment_menu = Array.from(menuMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)

    // --- インポート履歴 ---
    const import_history = await getImportHistory(prisma, clinic_id)

    return NextResponse.json({
      success: true,
      has_data: true,
      kpi: {
        total_revenue: totalRevenue,
        insurance_revenue: insuranceRevenue,
        self_pay_revenue: selfPayRevenue,
        avg_per_patient: avgPerPatient,
        total_records: sales.length,
        unique_patients: uniquePatients
      },
      monthly,
      by_insurance_type,
      by_treatment_menu,
      import_history
    })
  } catch (error: any) {
    console.error('売上集計APIエラー:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function getImportHistory(prisma: any, clinic_id: string) {
  const history = await prisma.sales_import_history.findMany({
    where: { clinic_id },
    orderBy: { import_date: 'desc' },
    take: 10,
    select: {
      id: true,
      file_name: true,
      import_date: true,
      total_records: true,
      success_records: true,
      failed_records: true,
      status: true
    }
  })
  return history
}
