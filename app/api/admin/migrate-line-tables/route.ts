import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * GET /api/admin/migrate-line-tables
 * LINE関連テーブルのpatient_idをTEXT型に変更するマイグレーション
 *
 * セキュリティ: 本番環境では適切な認証を追加してください
 */
export async function GET(request: NextRequest) {
  try {
    const prisma = getPrismaClient()

    const results = []

    // 1. line_invitation_codes
    try {
      console.log('Migrating line_invitation_codes...')

      // 外部キー制約を削除
      await prisma.$executeRawUnsafe(
        'ALTER TABLE line_invitation_codes DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey'
      )

      // 型を変更
      await prisma.$executeRawUnsafe(
        'ALTER TABLE line_invitation_codes ALTER COLUMN patient_id TYPE TEXT'
      )

      results.push({
        table: 'line_invitation_codes',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'line_invitation_codes',
        status: 'error',
        message: error.message
      })
    }

    // 2. line_patient_linkages
    try {
      console.log('Migrating line_patient_linkages...')

      await prisma.$executeRawUnsafe(
        'ALTER TABLE line_patient_linkages DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey'
      )

      await prisma.$executeRawUnsafe(
        'ALTER TABLE line_patient_linkages ALTER COLUMN patient_id TYPE TEXT'
      )

      results.push({
        table: 'line_patient_linkages',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'line_patient_linkages',
        status: 'error',
        message: error.message
      })
    }

    // 3. patient_qr_codes
    try {
      console.log('Migrating patient_qr_codes...')

      await prisma.$executeRawUnsafe(
        'ALTER TABLE patient_qr_codes DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey'
      )

      await prisma.$executeRawUnsafe(
        'ALTER TABLE patient_qr_codes ALTER COLUMN patient_id TYPE TEXT'
      )

      results.push({
        table: 'patient_qr_codes',
        status: 'success',
        message: 'patient_idをTEXT型に変更しました'
      })
    } catch (error: any) {
      results.push({
        table: 'patient_qr_codes',
        status: 'error',
        message: error.message
      })
    }

    // 結果確認
    const verifyData = await prisma.$queryRaw<{ table_name: string; column_name: string; data_type: string }[]>`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('line_invitation_codes', 'line_patient_linkages', 'patient_qr_codes')
        AND column_name = 'patient_id'
    `

    return NextResponse.json({
      success: true,
      results,
      verification: verifyData,
      note: 'もしエラーが出た場合は、SQL Editorで手動実行してください',
      sql: `
-- LINE関連テーブルのpatient_idをTEXTに変更
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;
      `.trim()
    })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'マイグレーションに失敗しました',
        message: error.message,
        sql: `
-- 以下のSQLをSQL Editorで手動実行してください
ALTER TABLE line_invitation_codes
  DROP CONSTRAINT IF EXISTS line_invitation_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE line_patient_linkages
  DROP CONSTRAINT IF EXISTS line_patient_linkages_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;

ALTER TABLE patient_qr_codes
  DROP CONSTRAINT IF EXISTS patient_qr_codes_patient_id_fkey,
  ALTER COLUMN patient_id TYPE TEXT;
        `.trim()
      },
      { status: 500 }
    )
  }
}
