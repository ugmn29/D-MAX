import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'
import { convertDatesToStrings } from '@/lib/prisma-helpers'

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

// 住所をジオコーディングする
async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
  prefecture: string
  city: string
  district: string
} | null> {
  if (!googleMapsApiKey) {
    console.error('Google Maps API key is not configured')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleMapsApiKey}&language=ja&region=jp`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('Geocoding failed:', data.status)
      return null
    }

    const result = data.results[0]
    const location = result.geometry.location

    // 住所コンポーネントから都道府県、市区町村を抽出
    let prefecture = ''
    let city = ''
    let district = ''

    for (const component of result.address_components) {
      if (component.types.includes('administrative_area_level_1')) {
        prefecture = component.long_name
      } else if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        city = component.long_name
      } else if (component.types.includes('sublocality_level_1') || component.types.includes('sublocality')) {
        district = component.long_name
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      prefecture,
      city,
      district,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

// 2点間の距離を計算（Haversine formula）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // 地球の半径（km）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// POST: 患者の住所をジオコーディングしてキャッシュに保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clinic_id, patient_id, address, clinic_latitude, clinic_longitude } = body

    if (!clinic_id || !patient_id || !address) {
      return NextResponse.json(
        { error: 'clinic_id, patient_id, address are required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // 既にキャッシュがあるか確認（patient_idはunique）
    const existingCache = await prisma.patient_geocode_cache.findUnique({
      where: { patient_id },
    })

    if (existingCache && existingCache.geocode_status === 'success') {
      const serialized = convertDatesToStrings(existingCache, ['geocoded_at', 'created_at', 'updated_at'])
      return NextResponse.json({ data: serialized, cached: true })
    }

    // ジオコーディング実行
    const geocodeResult = await geocodeAddress(address)

    if (!geocodeResult) {
      // 失敗した場合もキャッシュに記録
      const data = await prisma.patient_geocode_cache.upsert({
        where: { patient_id },
        create: {
          patient_id,
          clinic_id,
          original_address: address,
          geocode_status: 'failed',
          geocode_error: 'Geocoding failed',
        },
        update: {
          original_address: address,
          geocode_status: 'failed',
          geocode_error: 'Geocoding failed',
          updated_at: new Date(),
        },
      })

      const serialized = convertDatesToStrings(data, ['geocoded_at', 'created_at', 'updated_at'])
      return NextResponse.json({ data: serialized, error: 'Geocoding failed' }, { status: 400 })
    }

    // クリニックからの距離を計算
    let distanceFromClinic = null
    if (clinic_latitude && clinic_longitude) {
      distanceFromClinic = calculateDistance(
        geocodeResult.latitude,
        geocodeResult.longitude,
        clinic_latitude,
        clinic_longitude
      )
    }

    // キャッシュに保存
    const data = await prisma.patient_geocode_cache.upsert({
      where: { patient_id },
      create: {
        patient_id,
        clinic_id,
        original_address: address,
        prefecture: geocodeResult.prefecture,
        city: geocodeResult.city,
        district: geocodeResult.district,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        geocode_status: 'success',
        distance_from_clinic: distanceFromClinic,
        geocoded_at: new Date(),
      },
      update: {
        original_address: address,
        prefecture: geocodeResult.prefecture,
        city: geocodeResult.city,
        district: geocodeResult.district,
        latitude: geocodeResult.latitude,
        longitude: geocodeResult.longitude,
        geocode_status: 'success',
        geocode_error: null,
        distance_from_clinic: distanceFromClinic,
        geocoded_at: new Date(),
        updated_at: new Date(),
      },
    })

    const serialized = convertDatesToStrings(data, ['geocoded_at', 'created_at', 'updated_at'])
    return NextResponse.json({ data: serialized, cached: false })
  } catch (error) {
    console.error('Geocode API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: 一括ジオコーディング（未処理の患者を処理）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clinicId = searchParams.get('clinic_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!clinicId) {
      return NextResponse.json(
        { error: 'clinic_id is required' },
        { status: 400 }
      )
    }

    const prisma = getPrismaClient()

    // クリニック情報を取得（緯度経度がある場合）
    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId },
      select: { prefecture: true, city: true, address_line: true },
    })

    // クリニックの住所をジオコーディング（距離計算用）
    let clinicCoords: { latitude: number; longitude: number } | null = null
    if (clinic && clinic.prefecture && clinic.city) {
      const clinicAddress = `${clinic.prefecture}${clinic.city}${clinic.address_line || ''}`
      const geocoded = await geocodeAddress(clinicAddress)
      if (geocoded) {
        clinicCoords = { latitude: geocoded.latitude, longitude: geocoded.longitude }
      }
    }

    // 未処理の患者を取得
    const patients = await prisma.patients.findMany({
      where: {
        clinic_id: clinicId,
        prefecture: { not: null },
      },
      select: {
        id: true,
        prefecture: true,
        city: true,
        address: true,
      },
      take: limit,
    })

    // 既にキャッシュされている患者を除外
    const cached = await prisma.patient_geocode_cache.findMany({
      where: {
        clinic_id: clinicId,
        geocode_status: 'success',
      },
      select: { patient_id: true },
    })

    const cachedIds = new Set(cached.map(c => c.patient_id))
    const uncachedPatients = patients.filter(p => !cachedIds.has(p.id))

    // 各患者をジオコーディング
    const results = []
    for (const patient of uncachedPatients.slice(0, limit)) {
      const address = `${patient.prefecture || ''}${patient.city || ''}${patient.address || ''}`
      if (!address.trim()) continue

      const geocodeResult = await geocodeAddress(address)

      let distanceFromClinic = null
      if (geocodeResult && clinicCoords) {
        distanceFromClinic = calculateDistance(
          geocodeResult.latitude,
          geocodeResult.longitude,
          clinicCoords.latitude,
          clinicCoords.longitude
        )
      }

      const data = await prisma.patient_geocode_cache.upsert({
        where: { patient_id: patient.id },
        create: {
          patient_id: patient.id,
          clinic_id: clinicId,
          original_address: address,
          prefecture: geocodeResult?.prefecture || patient.prefecture,
          city: geocodeResult?.city || patient.city,
          district: geocodeResult?.district || '',
          latitude: geocodeResult?.latitude,
          longitude: geocodeResult?.longitude,
          geocode_status: geocodeResult ? 'success' : 'failed',
          geocode_error: geocodeResult ? null : 'Geocoding failed',
          distance_from_clinic: distanceFromClinic,
          geocoded_at: geocodeResult ? new Date() : null,
        },
        update: {
          original_address: address,
          prefecture: geocodeResult?.prefecture || patient.prefecture,
          city: geocodeResult?.city || patient.city,
          district: geocodeResult?.district || '',
          latitude: geocodeResult?.latitude,
          longitude: geocodeResult?.longitude,
          geocode_status: geocodeResult ? 'success' : 'failed',
          geocode_error: geocodeResult ? null : 'Geocoding failed',
          distance_from_clinic: distanceFromClinic,
          geocoded_at: geocodeResult ? new Date() : null,
          updated_at: new Date(),
        },
      })

      if (data) {
        const serialized = convertDatesToStrings(data, ['geocoded_at', 'created_at', 'updated_at'])
        results.push(serialized)
      }

      // レートリミット対策（1秒に10リクエストまで）
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return NextResponse.json({
      processed: results.length,
      total_uncached: uncachedPatients.length,
      results,
    })
  } catch (error) {
    console.error('Bulk geocode error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
