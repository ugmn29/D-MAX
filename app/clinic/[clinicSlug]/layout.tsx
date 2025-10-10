import { DynamicTrackingTags } from '@/components/tracking/DynamicTrackingTags'
import { UTMCapture } from '@/components/tracking/UTMCapture'
import { getSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

interface ClinicLayoutProps {
  children: React.ReactNode
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

export default async function ClinicLayout({ children, params }: ClinicLayoutProps) {
  const clinic = await getClinicBySlug(params.clinicSlug)

  // 病院が見つからない場合は404
  if (!clinic) {
    notFound()
  }

  return (
    <html lang="ja">
      <head>
        {/* 病院専用のトラッキングタグを自動挿入 */}
        <DynamicTrackingTags clinicId={clinic.id} />
      </head>
      <body>
        {/* UTMパラメータをキャプチャ */}
        <UTMCapture />

        {/* 病院名をヘッダーに表示 */}
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">{clinic.name}</h1>
            </div>
          </header>

          {children}
        </div>
      </body>
    </html>
  )
}
