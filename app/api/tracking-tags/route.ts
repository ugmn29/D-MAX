import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const DATE_FIELDS = ['created_at', 'updated_at'] as const

// GET: トラッキングタグ設定を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinic_id = searchParams.get('clinic_id')

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const data = await prisma.tracking_tags.findUnique({
      where: { clinic_id },
    })

    // データがない場合はデフォルト値を返す
    if (!data) {
      return NextResponse.json({
        success: true,
        data: {
          clinic_id,
          gtm_container_id: '',
          gtm_enabled: false,
          ga4_measurement_id: '',
          ga4_enabled: false,
          google_ads_conversion_id: '',
          google_ads_conversion_label: '',
          google_ads_enabled: false,
          meta_pixel_id: '',
          meta_pixel_enabled: false,
          yahoo_ads_account_id: '',
          yahoo_ads_enabled: false,
          line_tag_id: '',
          line_tag_enabled: false,
          custom_tags: []
        }
      })
    }

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('トラッキングタグ取得APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST/PUT: トラッキングタグ設定を保存（UPSERT）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      clinic_id,
      gtm_container_id,
      gtm_enabled,
      ga4_measurement_id,
      ga4_enabled,
      google_ads_conversion_id,
      google_ads_conversion_label,
      google_ads_enabled,
      meta_pixel_id,
      meta_pixel_enabled,
      yahoo_ads_account_id,
      yahoo_ads_enabled,
      line_tag_id,
      line_tag_enabled,
      custom_tags
    } = body

    if (!clinic_id) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    const upsertData = {
      gtm_container_id: gtm_container_id || null,
      gtm_enabled: gtm_enabled || false,
      ga4_measurement_id: ga4_measurement_id || null,
      ga4_enabled: ga4_enabled || false,
      google_ads_conversion_id: google_ads_conversion_id || null,
      google_ads_conversion_label: google_ads_conversion_label || null,
      google_ads_enabled: google_ads_enabled || false,
      meta_pixel_id: meta_pixel_id || null,
      meta_pixel_enabled: meta_pixel_enabled || false,
      yahoo_ads_account_id: yahoo_ads_account_id || null,
      yahoo_ads_enabled: yahoo_ads_enabled || false,
      line_tag_id: line_tag_id || null,
      line_tag_enabled: line_tag_enabled || false,
      custom_tags: custom_tags || [],
      updated_at: new Date(),
    }

    // UPSERT（存在すれば更新、なければ作成）
    const data = await prisma.tracking_tags.upsert({
      where: { clinic_id },
      create: {
        clinic_id,
        ...upsertData,
      },
      update: upsertData,
    })

    return NextResponse.json({ success: true, data: convertDatesToStrings(data, [...DATE_FIELDS]) })
  } catch (error) {
    console.error('トラッキングタグ保存APIエラー:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
