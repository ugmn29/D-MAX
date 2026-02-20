import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const prisma = getPrismaClient()
    const clinic = await prisma.clinics.findFirst({
      where: { slug: params.slug },
      select: { id: true, name: true, slug: true }
    })

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 })
    }

    return NextResponse.json(clinic)
  } catch (error) {
    console.error('クリニックslug検索エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
