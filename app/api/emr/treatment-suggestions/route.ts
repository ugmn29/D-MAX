/**
 * 診療行為関連提案API Route
 * Treatment Suggestions API - Prisma版
 *
 * 選択された診療行為に基づいて、関連する処置や加算を自動提案
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

interface TreatmentSuggestion {
  code: string
  name: string
  points: number
  reason: string
  type: 'addition' | 'related' | 'commonly_used'
  priority: number
  autoAdd?: boolean
}

// POST - 選択された診療行為に基づいて関連処置を提案
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      selectedTreatmentCodes,
      patientAge,
      visitContext,
    }: {
      selectedTreatmentCodes: string[]
      patientAge?: number
      visitContext?: {
        isHoliday?: boolean
        isOvertime?: boolean
        isMidnight?: boolean
        isHomeVisit?: boolean
      }
    } = body

    if (!selectedTreatmentCodes || selectedTreatmentCodes.length === 0) {
      return NextResponse.json([])
    }

    const suggestions: TreatmentSuggestion[] = []
    const suggestedCodes = new Set<string>()

    // 直近に追加された処置のみを対象（最後の1件）
    const latestCode = selectedTreatmentCodes[selectedTreatmentCodes.length - 1]

    const treatment = await prisma.treatment_codes.findUnique({
      where: { code: latestCode },
    })

    if (!treatment) {
      return NextResponse.json([])
    }

    // 1. メタデータから加算ルールを抽出
    const additionSuggestions = extractAdditionSuggestions(
      treatment,
      patientAge,
      visitContext
    )
    additionSuggestions.forEach(s => {
      if (!suggestedCodes.has(s.code)) {
        suggestions.push(s)
        suggestedCodes.add(s.code)
      }
    })

    // 2. 前後処置の提案（優先度高）
    const sequentialSuggestions = await findSequentialTreatments(treatment)
    sequentialSuggestions.forEach(s => {
      if (!suggestedCodes.has(s.code) && !selectedTreatmentCodes.includes(s.code)) {
        suggestions.push(s)
        suggestedCodes.add(s.code)
      }
    })

    // 3. 同じカテゴリで併用される処置を検索
    const relatedSuggestions = await findRelatedTreatments(treatment)
    relatedSuggestions.forEach(s => {
      if (!suggestedCodes.has(s.code) && !selectedTreatmentCodes.includes(s.code)) {
        suggestions.push(s)
        suggestedCodes.add(s.code)
      }
    })

    // 優先度順にソート、重複削除
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.code, s])).values()
    )

    const result = uniqueSuggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8)

    return NextResponse.json(result)
  } catch (error) {
    console.error('治療提案API エラー:', error)
    return NextResponse.json(
      { error: '治療提案の生成に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * メタデータから加算ルールを抽出
 */
function extractAdditionSuggestions(
  treatment: any,
  patientAge?: number,
  visitContext?: any
): TreatmentSuggestion[] {
  const suggestions: TreatmentSuggestion[] = []
  const metadata = (treatment.metadata as any) || {}
  const additionRules = metadata.addition_rules || {}

  // 年齢加算
  if (additionRules.age_based_additions && patientAge !== undefined) {
    additionRules.age_based_additions.forEach((rule: any) => {
      if (patientAge < 6 && rule.type === 'under_6_infant') {
        suggestions.push({
          code: treatment.code + '_age_add',
          name: `${treatment.name} - 6歳未満乳幼児加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `患者が${patientAge}歳のため、6歳未満乳幼児加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: true,
        })
      }
    })
  }

  // 時間帯加算
  if (additionRules.time_based_additions && visitContext) {
    additionRules.time_based_additions.forEach((rule: any) => {
      if (visitContext.isHoliday && rule.type === 'holiday') {
        suggestions.push({
          code: treatment.code + '_holiday_add',
          name: `${treatment.name} - 休日加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `休日診療のため、休日加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false,
        })
      }
      if (visitContext.isOvertime && rule.type === 'overtime') {
        suggestions.push({
          code: treatment.code + '_overtime_add',
          name: `${treatment.name} - 時間外加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `時間外診療のため、時間外加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false,
        })
      }
      if (visitContext.isMidnight && rule.type === 'midnight') {
        suggestions.push({
          code: treatment.code + '_midnight_add',
          name: `${treatment.name} - 深夜加算`,
          points: Math.round(treatment.points * rule.rate),
          reason: `深夜診療のため、深夜加算(+${Math.round(rule.rate * 100)}%)が適用できます`,
          type: 'addition',
          priority: 5,
          autoAdd: false,
        })
      }
    })
  }

  return suggestions
}

/**
 * 前後処置の提案（治療の流れに基づく）
 */
async function findSequentialTreatments(treatment: any): Promise<TreatmentSuggestion[]> {
  const suggestions: TreatmentSuggestion[] = []

  const sequentialPatterns = [
    {
      trigger: /抜髄/,
      next: [
        { keyword: '根管貼薬', excludeKeywords: ['加算', '抜歯前提'], reason: '抜髄後の基本処置' },
        { keyword: '感染根管', excludeKeywords: ['加算'], reason: '感染している場合の処置' },
      ],
    },
    {
      trigger: /根管貼薬/,
      next: [
        { keyword: '根管充填', excludeKeywords: ['加算'], reason: '根管治療の最終ステップ' },
        { keyword: '感染根管', excludeKeywords: ['加算'], reason: '追加の根管治療' },
      ],
    },
    {
      trigger: /抜歯/,
      next: [
        { keyword: '難抜歯', excludeKeywords: [], reason: '難症例の場合の加算' },
        { keyword: '埋伏', excludeKeywords: [], reason: '埋伏歯の場合の加算' },
      ],
    },
    {
      trigger: /充填/,
      next: [
        { keyword: 'う蝕', excludeKeywords: ['歯髄', '根管'], reason: '充填前のう蝕除去' },
        { keyword: '知覚過敏', excludeKeywords: [], reason: '充填後の知覚過敏処置' },
        { keyword: 'SC', excludeKeywords: [], reason: '知覚過敏抑制処置' },
      ],
    },
    {
      trigger: /形成/,
      next: [
        { keyword: '印象', excludeKeywords: ['形成'], reason: '形成後の印象採得' },
        { keyword: '仮封', excludeKeywords: [], reason: '形成後の仮封' },
        { keyword: '咬合採得', excludeKeywords: [], reason: '形成後の咬合記録' },
      ],
    },
    {
      trigger: /印象採得/,
      next: [
        { keyword: '咬合採得', excludeKeywords: [], reason: '印象採得と併せて行う処置' },
        { keyword: '仮着', excludeKeywords: [], reason: '印象採得後の仮着' },
      ],
    },
  ]

  for (const pattern of sequentialPatterns) {
    if (pattern.trigger.test(treatment.name)) {
      for (const nextItem of pattern.next) {
        const nextTreatments = await prisma.treatment_codes.findMany({
          where: {
            name: { contains: nextItem.keyword, mode: 'insensitive' },
            code: { not: treatment.code },
          },
          select: { code: true, name: true, points: true },
          take: 2,
        })

        if (nextTreatments) {
          for (const t of nextTreatments) {
            const shouldExclude = nextItem.excludeKeywords?.some(ex =>
              t.name.includes(ex)
            )

            if (!shouldExclude) {
              suggestions.push({
                code: t.code,
                name: t.name,
                points: t.points,
                reason: nextItem.reason,
                type: 'commonly_used',
                priority: 4,
                autoAdd: false,
              })
            }
          }
        }
      }
      break // 最初にマッチしたパターンのみ
    }
  }

  return suggestions
}

/**
 * 同じカテゴリで併用される処置を検索
 */
async function findRelatedTreatments(treatment: any): Promise<TreatmentSuggestion[]> {
  const suggestions: TreatmentSuggestion[] = []

  const relatedPatterns: { [key: string]: Array<{ keywords: string[]; reason: string; excludeKeywords?: string[] }> } = {
    '309': [
      {
        keywords: ['根管貼薬', '根管拡大', '根管洗浄'],
        reason: '根管治療の基本処置',
        excludeKeywords: ['加算', '顕微鏡'],
      },
      {
        keywords: ['感染根管', '根充'],
        reason: '根管治療の後続処置',
        excludeKeywords: ['加算'],
      },
    ],
    '310': [
      {
        keywords: ['消炎', '口腔内'],
        reason: '抜歯に伴う処置',
        excludeKeywords: ['悪性', '腫瘍', '手術'],
      },
      {
        keywords: ['難抜歯', '埋伏'],
        reason: '難症例の抜歯加算',
        excludeKeywords: [],
      },
    ],
    '313': [
      {
        keywords: ['う蝕'],
        reason: '充填前のう蝕処置',
        excludeKeywords: ['歯髄', '根管'],
      },
      {
        keywords: ['知覚過敏', 'SC'],
        reason: '充填前後の処置',
        excludeKeywords: [],
      },
    ],
    '316': [
      {
        keywords: ['支台歯形成', '形成加算'],
        reason: '歯冠修復の形成',
        excludeKeywords: [],
      },
      {
        keywords: ['印象採得', '咬合採得'],
        reason: '歯冠修復の印象・咬合記録',
        excludeKeywords: [],
      },
    ],
  }

  const category = treatment.code.substring(0, 3)
  const patterns = relatedPatterns[category]

  if (!patterns) return suggestions

  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      const relatedTreatments = await prisma.treatment_codes.findMany({
        where: {
          name: { contains: keyword, mode: 'insensitive' },
          code: { not: treatment.code },
        },
        select: { code: true, name: true, points: true },
        take: 3,
      })

      if (relatedTreatments) {
        for (const t of relatedTreatments) {
          const shouldExclude = pattern.excludeKeywords?.some(ex =>
            t.name.includes(ex)
          )

          if (!shouldExclude) {
            suggestions.push({
              code: t.code,
              name: t.name,
              points: t.points,
              reason: pattern.reason,
              type: 'related',
              priority: 3,
              autoAdd: false,
            })
          }
        }
      }
    }
  }

  return suggestions
}
