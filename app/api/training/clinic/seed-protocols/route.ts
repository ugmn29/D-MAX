import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// デフォルトのプロトコル定義
const DEFAULT_PROTOCOLS = [
  {
    name: '舌',
    icon: '👅',
    sort_order: 0,
    is_parallel_layout: false,
    steps: [
      {
        step_number: 1,
        checkpoint_name: '「あ」の口ができるか？',
        description: '口を大きく開けて「あ」の形が作れるか確認',
        trainingNames: ['「あ」の口の確認'],
      },
      {
        step_number: 2,
        checkpoint_name: '舌尖が前に伸びるか？',
        description: '舌の先端を前方に十分伸ばせるか確認',
        trainingNames: ['舌を前に出す', '舌を左右に振る', '口唇をなぞる', '舌小帯伸ばし'],
      },
      {
        step_number: 3,
        checkpoint_name: 'スポット位置に置けるか？',
        description: '舌を正しいスポット位置（上あごの前方）に置けるか確認',
        trainingNames: ['スポットの位置確認'],
      },
      {
        step_number: 4,
        checkpoint_name: '吸い上げができるか？',
        description: '舌を上あごに吸い付けた状態を保持できるか確認',
        trainingNames: ['吸い上げ', '吸い上げができない場合', 'チューブ吸い'],
      },
      {
        step_number: 5,
        checkpoint_name: '吸い上げ状態の嚥下ができるか？',
        description: '舌を吸い上げた状態で飲み込めるか確認',
        trainingNames: ['舌筋の訓練'],
      },
    ],
  },
  {
    name: '口唇',
    icon: '👄',
    sort_order: 1,
    is_parallel_layout: true,
    steps: [
      {
        step_number: 1,
        checkpoint_name: '口唇が弱い',
        description: '口唇の筋力を鍛える',
        trainingNames: ['口輪筋訓練'],
      },
      {
        step_number: 2,
        checkpoint_name: '口唇が強い',
        description: '口唇の緊張を除去し柔軟性を高める',
        trainingNames: ['口唇の緊張除去', '上唇小帯と下唇小帯を伸ばす'],
      },
    ],
  },
  {
    name: '体操',
    icon: '🤸',
    sort_order: 2,
    is_parallel_layout: false,
    steps: [
      {
        step_number: 1,
        checkpoint_name: '体操',
        description: '総合的な体操トレーニング',
        trainingNames: ['あいうべ体操', 'タラ体操'],
      },
    ],
  },
]

// POST /api/training/clinic/seed-protocols?clinicId=xxx
export async function POST(req: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const clinicId = new URL(req.url).searchParams.get('clinicId')
    if (!clinicId) return NextResponse.json({ error: 'clinicId is required' }, { status: 400 })

    // 既存プロトコルがあればスキップ
    const existingCount = await prisma.training_protocols.count({ where: { clinic_id: clinicId } })
    if (existingCount > 0) {
      return NextResponse.json({ message: 'Already seeded', skipped: true })
    }

    // トレーニングを名前→IDでマップ
    const allTrainings = await prisma.trainings.findMany({
      where: { is_deleted: false, OR: [{ clinic_id: null }, { clinic_id: clinicId }] },
      select: { id: true, training_name: true },
    })
    const trainingByName = new Map(allTrainings.map((t) => [t.training_name, t.id]))

    const createdProtocols = []

    for (const protoDef of DEFAULT_PROTOCOLS) {
      const protocol = await prisma.training_protocols.create({
        data: {
          clinic_id: clinicId,
          name: protoDef.name,
          sort_order: protoDef.sort_order,
          is_parallel_layout: protoDef.is_parallel_layout,
        },
      })

      for (const stepDef of protoDef.steps) {
        const step = await prisma.training_protocol_steps.create({
          data: {
            protocol_id: protocol.id,
            step_number: stepDef.step_number,
            checkpoint_name: stepDef.checkpoint_name,
            description: stepDef.description,
          },
        })

        const stepTrainings = stepDef.trainingNames
          .map((name, idx) => {
            const id = trainingByName.get(name)
            return id ? { step_id: step.id, training_id: id, sort_order: idx } : null
          })
          .filter(Boolean) as { step_id: string; training_id: string; sort_order: number }[]

        if (stepTrainings.length > 0) {
          await prisma.training_protocol_step_items.createMany({
            data: stepTrainings,
            skipDuplicates: true,
          })
        }
      }

      createdProtocols.push(protocol)
    }

    return NextResponse.json({ success: true, protocols: createdProtocols })
  } catch (error: any) {
    console.error('seed-protocols error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
