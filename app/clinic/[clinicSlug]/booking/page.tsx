import { getPrismaClient } from '@/lib/prisma-client'
import { notFound, redirect } from 'next/navigation'

interface BookingPageProps {
  params: {
    clinicSlug: string
  }
  searchParams: { [key: string]: string | string[] | undefined }
}

// clinic_slugからclinic_idを取得
async function getClinicBySlug(slug: string) {
  const prisma = getPrismaClient()
  const data = await prisma.clinics.findFirst({
    where: { slug },
    select: { id: true, name: true, slug: true },
  })

  if (!data) {
    return null
  }

  return data
}

export default async function ClinicBookingPage({ params, searchParams }: BookingPageProps) {
  const clinic = await getClinicBySlug(params.clinicSlug)

  if (!clinic) {
    notFound()
  }

  // UTMパラメータを保持したままリダイレクト
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  const utmParts = utmKeys
    .filter(key => searchParams[key])
    .map(key => `${key}=${encodeURIComponent(String(searchParams[key]))}`)
  const utmString = utmParts.length > 0 ? `&${utmParts.join('&')}` : ''

  redirect(`/web-booking?clinic_id=${clinic.id}${utmString}`)
}
