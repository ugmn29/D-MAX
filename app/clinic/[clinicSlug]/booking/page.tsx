import { getSupabaseClient } from '@/lib/utils/supabase-client'
import { notFound, redirect } from 'next/navigation'

interface BookingPageProps {
  params: {
    clinicSlug: string
  }
}

// clinic_slugからclinic_idを取得
async function getClinicBySlug(slug: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !data) {
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
