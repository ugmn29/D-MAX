import { getPrismaClient } from '@/lib/prisma-client'
import { notFound, redirect } from 'next/navigation'

interface BookingPageProps {
  params: {
    clinicSlug: string
  }
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

export default async function ClinicBookingPage({ params }: BookingPageProps) {
  const clinic = await getClinicBySlug(params.clinicSlug)

  if (!clinic) {
    notFound()
  }

  // 既存のWeb予約ページにクリニックIDを渡してリダイレクト
  // または、このページ内でWeb予約コンポーネントを表示
  redirect(`/web-booking?clinic_id=${clinic.id}`)
}
