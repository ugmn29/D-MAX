/**
 * サブカルテ添付ファイルAPI Route - Prisma版
 * Subkarte Attachments API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

// POST - 添付ファイルを保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const prisma = getPrismaClient()

    const attachment = await prisma.subkarte_attachments.create({
      data: body,
    })

    const result = {
      ...attachment,
      created_at: attachment.created_at?.toISOString() ?? null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('添付ファイル保存エラー:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
