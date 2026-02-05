import { useAuth } from '@/components/providers/auth-provider'

const FALLBACK_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export function useClinicId(): string {
  const { clinicId } = useAuth()
  return clinicId || FALLBACK_CLINIC_ID
}
