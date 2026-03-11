import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// デフォルトのグループ定義
const DEFAULT_GROUPS = [
  {
    name: '舌のトレーニング',
    icon: '👅',
    color: 'blue',
    sort_order: 0,
    categoryNames: ['舌系の訓練', '舌の運動'],
  },
  {
    name: '口唇のトレーニング',
    icon: '👄',
    color: 'pink',
    sort_order: 1,
    categoryNames: ['口唇系の訓練', '唇の運動', '頬の運動'],
  },
  {
    name: '咬合力・歯列のトレーニング',
    icon: '🦷',
    color: 'green',
    sort_order: 2,
    categoryNames: ['咬合力系の訓練', '歯列改善系の訓練'],
  },
  {
    name: 'その他のトレーニング',
    icon: '🏃',
    color: 'blue',
    sort_order: 3,
    categoryNames: ['発音', '口の開閉', '吸引', 'うがい', 'その他'],
  },
]

// POST /api/training/clinic/seed-groups?clinicId=xxx
// 医院のデフォルトグループを初期化（既存があればスキップ）
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const clinicId = new URL(req.url).searchParams.get('clinicId')
    if (!clinicId) return NextResponse.json({ error: 'clinicId is required' }, { status: 400 })

    // 既存グループがあればスキップ
    const existingCount = await prisma.training_groups.count({ where: { clinic_id: clinicId } })
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Already seeded', skipped: true })
    }

    // デフォルトトレーニングを名前→IDでマップ
    const allTrainings = await prisma.trainings.findMany({
      where: { is_deleted: false, OR: [{ clinic_id: null }, { clinic_id: clinicId }] },
      select: { id: true, training_name: true, category: true },
    })

    const createdGroups = []

    for (const groupDef of DEFAULT_GROUPS) {
      const group = await prisma.training_groups.create({
        data: {
          clinic_id: clinicId,
          name: groupDef.name,
          icon: groupDef.icon,
          color: groupDef.color,
          sort_order: groupDef.sort_order,
        },
      })

      // カテゴリに属するトレーニングをアイテムとして追加
      const categoryTrainings = allTrainings.filter(
        (t) => t.category && groupDef.categoryNames.includes(t.category)
      )

      if (categoryTrainings.length > 0) {
        await prisma.training_group_items.createMany({
          data: categoryTrainings.map((t, idx) => ({
            group_id: group.id,
            training_id: t.id,
            sort_order: idx,
          })),
          skipDuplicates: true,
        })
      }

      createdGroups.push({ ...group, itemCount: categoryTrainings.length })
    }

    return NextResponse.json({ success: true, groups: createdGroups })
  } catch (error: any) {
    console.error('seed-groups error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
