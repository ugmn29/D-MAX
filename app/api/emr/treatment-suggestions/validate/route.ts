/**
 * 診療行為追加バリデーションAPI Route
 * Treatment Addition Validation API - Prisma版
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

interface ValidationResult {
  canAdd: boolean
  errors: string[]
  warnings: string[]
  inclusionConflicts: string[]
  exclusionConflicts: string[]
}

// POST - 診療行為の追加が可能かバリデーション
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      newTreatmentCode,
      existingTreatmentCodes,
    }: {
      newTreatmentCode: string
      existingTreatmentCodes: string[]
    } = body

    const result: ValidationResult = {
      canAdd: true,
      errors: [],
      warnings: [],
      inclusionConflicts: [],
      exclusionConflicts: [],
    }

    // 新規処置の情報を取得
    const newTreatment = await prisma.treatment_codes.findUnique({
      where: { code: newTreatmentCode },
    })

    if (!newTreatment) {
      result.canAdd = false
      result.errors.push('診療行為が見つかりません')
      return NextResponse.json(result)
    }

    // 既存処置との包括・背反チェック
    for (const existingCode of existingTreatmentCodes) {
      const existingTreatment = await prisma.treatment_codes.findUnique({
        where: { code: existingCode },
      })

      if (!existingTreatment) continue

      // 包括チェック（新規処置が既存処置に包括される）
      if (existingTreatment.inclusion_rules?.includes(newTreatmentCode)) {
        result.inclusionConflicts.push(
          `${newTreatment.name}は${existingTreatment.name}に包括されるため、別途算定できません`
        )
        result.canAdd = false
      }

      // 包括チェック（既存処置が新規処置に包括される）
      if (newTreatment.inclusion_rules?.includes(existingCode)) {
        result.warnings.push(
          `${existingTreatment.name}は${newTreatment.name}に包括されるため、削除を検討してください`
        )
      }

      // 背反チェック
      const exclusionRules = (newTreatment.exclusion_rules as any) || {}

      if (exclusionRules.simultaneous?.includes(existingCode)) {
        result.exclusionConflicts.push(
          `${newTreatment.name}と${existingTreatment.name}は同時算定できません`
        )
        result.canAdd = false
      }

      if (exclusionRules.same_day?.includes(existingCode)) {
        result.exclusionConflicts.push(
          `${newTreatment.name}と${existingTreatment.name}は同日算定できません`
        )
        result.canAdd = false
      }

      if (exclusionRules.same_month?.includes(existingCode)) {
        result.warnings.push(
          `${newTreatment.name}と${existingTreatment.name}は同月算定の制限があります`
        )
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('バリデーションAPI エラー:', error)
    return NextResponse.json(
      { error: 'バリデーションに失敗しました' },
      { status: 500 }
    )
  }
}
