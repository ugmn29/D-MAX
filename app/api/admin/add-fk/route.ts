import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function POST() {
  try {
    const prisma = getPrismaClient()

    console.log('🚀 外部キー制約を追加中...')

    // 1. 既存の制約を削除
    let dropError = null
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE questionnaire_responses
        DROP CONSTRAINT IF EXISTS questionnaire_responses_patient_id_fkey;
      `)
    } catch (e: any) {
      dropError = e.message
    }

    // 2. 外部キー制約を追加
    let addError = null
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE questionnaire_responses
        ADD CONSTRAINT questionnaire_responses_patient_id_fkey
        FOREIGN KEY (patient_id)
        REFERENCES patients(id)
        ON DELETE SET NULL;
      `)
    } catch (e: any) {
      addError = e.message
    }

    console.log('✅ 外部キー制約の追加を試みました')

    return NextResponse.json({
      success: true,
      message: '外部キー制約の追加を完了しました',
      dropError,
      addError
    })

  } catch (error: any) {
    console.error('❌ エラーが発生しました:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
