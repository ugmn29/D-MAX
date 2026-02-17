// Migrated to Prisma API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// GET: 新しい患者番号を生成（欠番を優先的に再利用）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')

    if (!clinicId) {
      return NextResponse.json({ error: 'clinic_id is required' }, { status: 400 })
    }

    const prisma = getPrismaClient()

    // 既に診察券番号を持っている患者の番号を全て取得
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId,
        patient_number: { not: null }
      },
      select: {
        patient_number: true
      },
      orderBy: {
        patient_number: 'asc'
      }
    })

    if (patients.length === 0) {
      return NextResponse.json({ patient_number: 1 })
    }

    // 欠番を探す
    const numbers = patients
      .map(p => p.patient_number as number)
      .sort((a, b) => a - b)

    for (let i = 0; i < numbers.length; i++) {
      const expectedNumber = i + 1
      if (numbers[i] !== expectedNumber) {
        return NextResponse.json({ patient_number: expectedNumber })
      }
    }

    // 欠番がない場合は最大番号+1
    const nextNumber = numbers[numbers.length - 1] + 1
    return NextResponse.json({ patient_number: nextNumber })
  } catch (error) {
    console.error('患者番号生成API エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
