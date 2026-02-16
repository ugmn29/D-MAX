/**
 * Sales Import API Route - Prisma版
 * 売上データCSVインポート処理（サーバーサイド）
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import {
  parseCSV,
  validateRow,
  normalizeDate,
  normalizeNumber,
  normalizeInsuranceType,
  ImportError
} from '@/lib/api/sales-import'

/**
 * 患者IDで既存患者を検索（Prisma版）
 */
async function findPatientByExternalId(
  clinicId: string,
  externalPatientId: string
): Promise<string | null> {
  // patient_number（数値）で検索を試みる
  const patientNumber = parseInt(externalPatientId, 10)

  const patient = await prisma.patients.findFirst({
    where: {
      clinic_id: clinicId,
      OR: [
        // patient_number が数値の場合
        ...(isNaN(patientNumber) ? [] : [{ patient_number: patientNumber }]),
        // legacy_patient_number（文字列）で検索
        { legacy_patient_number: externalPatientId }
      ]
    },
    select: { id: true }
  })

  return patient?.id ?? null
}

/**
 * スタッフ名で既存スタッフを検索（Prisma版）
 */
async function findStaffByName(
  clinicId: string,
  staffName: string
): Promise<string | null> {
  if (!staffName) return null

  const staffMember = await prisma.staff.findFirst({
    where: {
      clinic_id: clinicId,
      OR: [
        { name: staffName },
        { name_kana: staffName }
      ]
    },
    select: { id: true }
  })

  return staffMember?.id ?? null
}

/**
 * 診療メニュー名で既存メニューを検索（Prisma版）
 */
async function findTreatmentMenuByName(
  clinicId: string,
  menuName: string
): Promise<string | null> {
  if (!menuName) return null

  const menu = await prisma.treatment_menus.findFirst({
    where: {
      clinic_id: clinicId,
      name: menuName
    },
    select: { id: true }
  })

  return menu?.id ?? null
}

/**
 * POST: 売上データCSVインポート
 */
export async function POST(request: NextRequest) {
  try {
    const { csvText, clinicId, options = {} } = await request.json()

    if (!csvText || !clinicId) {
      return NextResponse.json(
        { error: 'csvText and clinicId are required' },
        { status: 400 }
      )
    }

    const { skipErrors = false, dryRun = false, importedBy } = options

    // CSVパース
    const rows = parseCSV(csvText)
    const errors: ImportError[] = []
    let successCount = 0

    // インポート履歴レコード作成
    const importHistory = await prisma.sales_import_history.create({
      data: {
        clinic_id: clinicId,
        file_name: 'upload.csv',
        total_records: rows.length,
        success_records: 0,
        failed_records: 0,
        imported_by: importedBy || null,
        status: 'processing'
      }
    })

    // 各行を処理
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // ヘッダー行を考慮

      // バリデーション
      const validationError = validateRow(row, rowNum)
      if (validationError) {
        errors.push({ row: rowNum, error: validationError, data: row })
        if (!skipErrors) break
        continue
      }

      try {
        // 患者検索
        const patientId = await findPatientByExternalId(clinicId, row.patient_id!)
        if (!patientId) {
          errors.push({
            row: rowNum,
            error: `患者ID「${row.patient_id}」が見つかりません`,
            data: row
          })
          if (!skipErrors) break
          continue
        }

        // スタッフ検索
        const staffId = row.staff_name
          ? await findStaffByName(clinicId, row.staff_name)
          : null

        // 診療メニュー検索
        const treatmentMenuId = row.treatment_menu
          ? await findTreatmentMenuByName(clinicId, row.treatment_menu)
          : null

        // 診療行為コードの配列化
        const treatmentCodes = row.treatment_codes
          ? row.treatment_codes.split(',').map(c => c.trim())
          : []

        // 売上データ作成
        const treatmentDate = normalizeDate(row.treatment_date!)
        const saleDate = row.sale_date ? normalizeDate(row.sale_date) : treatmentDate

        // ドライラン時はスキップ
        if (!dryRun) {
          await prisma.sales.create({
            data: {
              clinic_id: clinicId,
              patient_id: patientId,
              staff_id: staffId,
              treatment_menu_id: treatmentMenuId,
              receipt_number: row.receipt_number || null,
              treatment_date: treatmentDate ? new Date(treatmentDate) : null,
              sale_date: saleDate ? new Date(saleDate) : new Date(),
              insurance_type: row.insurance_type || '',
              insurance_points: normalizeNumber(row.insurance_points || 0),
              insurance_amount: normalizeNumber(row.insurance_amount || 0),
              patient_copay: normalizeNumber(row.patient_copay || 0),
              self_pay_amount: normalizeNumber(row.self_pay_amount || 0),
              total_amount: normalizeNumber(row.total_amount!),
              amount: normalizeNumber(row.total_amount!),
              category: normalizeInsuranceType(row.insurance_type || ''),
              payment_method: row.payment_method || '',
              treatment_codes: treatmentCodes,
              notes: row.notes || '',
              imported_at: new Date(),
              import_file_name: 'upload.csv'
            }
          })
        }

        successCount++
      } catch (error: any) {
        errors.push({
          row: rowNum,
          error: `予期しないエラー: ${error.message}`,
          data: row
        })
        if (!skipErrors) break
      }
    }

    // インポート履歴を更新
    const finalStatus = errors.length === 0 ? 'completed' :
                       successCount > 0 ? 'completed' : 'failed'

    await prisma.sales_import_history.update({
      where: { id: importHistory.id },
      data: {
        success_records: successCount,
        failed_records: errors.length,
        status: finalStatus,
        error_details: errors.length > 0 ? errors : undefined,
        updated_at: new Date()
      }
    })

    const result = {
      success: errors.length === 0 || (skipErrors && successCount > 0),
      import_id: importHistory.id,
      total_records: rows.length,
      success_records: successCount,
      failed_records: errors.length,
      errors
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('売上インポートエラー:', error)
    return NextResponse.json(
      { error: error.message || '売上データのインポートに失敗しました' },
      { status: 500 }
    )
  }
}
