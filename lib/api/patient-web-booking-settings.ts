import { getSupabaseClient } from '@/lib/utils/supabase-client'

export interface PatientWebBookingSettings {
  id: string
  patient_id: string
  clinic_id: string
  web_booking_enabled: boolean
  web_cancel_enabled: boolean
  web_reschedule_enabled: boolean
  web_cancel_limit: number | null
  cancel_deadline_hours: number | null
  max_concurrent_bookings: number | null
  created_at: string
  updated_at: string
}

export interface PatientWebBookingSettingsUpdate {
  web_booking_enabled?: boolean
  web_cancel_enabled?: boolean
  web_reschedule_enabled?: boolean
  web_cancel_limit?: number | null
  cancel_deadline_hours?: number | null
  max_concurrent_bookings?: number | null
}

/**
 * Get patient web booking settings
 */
export async function getPatientWebBookingSettings(
  patientId: string,
  clinicId: string
): Promise<PatientWebBookingSettings | null> {
  try {
    // Temporary patients: read from localStorage
    if (patientId.startsWith('web-booking-temp-')) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`web_booking_settings_${patientId}`)
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch (e) {
            console.error('Failed to parse web booking settings:', e)
          }
        }
      }
      return null
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('patient_web_booking_settings')
      .select('*')
      .eq('patient_id', patientId)
      .eq('clinic_id', clinicId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Failed to get web booking settings:', JSON.stringify(error, null, 2))
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error getting web booking settings:', error)
    return null
  }
}

/**
 * Create or update patient web booking settings
 */
export async function upsertPatientWebBookingSettings(
  patientId: string,
  clinicId: string,
  settings: PatientWebBookingSettingsUpdate
): Promise<PatientWebBookingSettings | null> {
  try {
    // Temporary patients: save to localStorage
    if (patientId.startsWith('web-booking-temp-')) {
      console.log('Temporary patient: saving web booking settings to localStorage')
      if (typeof window !== 'undefined') {
        const data: PatientWebBookingSettings = {
          id: `temp-${patientId}`,
          patient_id: patientId,
          clinic_id: clinicId,
          web_booking_enabled: settings.web_booking_enabled ?? true,
          web_cancel_enabled: settings.web_cancel_enabled ?? true,
          web_reschedule_enabled: settings.web_reschedule_enabled ?? true,
          web_cancel_limit: settings.web_cancel_limit ?? null,
          cancel_deadline_hours: settings.cancel_deadline_hours ?? null,
          max_concurrent_bookings: settings.max_concurrent_bookings ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        localStorage.setItem(`web_booking_settings_${patientId}`, JSON.stringify(data))
        return data
      }
      return null
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('patient_web_booking_settings')
      .upsert({
        patient_id: patientId,
        clinic_id: clinicId,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'patient_id,clinic_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to update web booking settings:', error)
      throw new Error('Failed to update web booking settings')
    }

    return data
  } catch (error) {
    console.error('Unexpected error updating web booking settings:', error)
    throw error
  }
}

/**
 * Check if patient can book via web
 */
export async function canBookViaWeb(
  patientId: string,
  clinicId: string
): Promise<boolean> {
  const settings = await getPatientWebBookingSettings(patientId, clinicId)
  if (!settings) {
    return true // Default: enabled
  }
  return settings.web_booking_enabled
}

/**
 * Check if patient can cancel via web
 */
export async function canCancelViaWeb(
  patientId: string,
  clinicId: string
): Promise<boolean> {
  const settings = await getPatientWebBookingSettings(patientId, clinicId)
  if (!settings) {
    return true // Default: enabled
  }
  return settings.web_cancel_enabled
}

/**
 * Check if patient can reschedule via web
 */
export async function canRescheduleViaWeb(
  patientId: string,
  clinicId: string
): Promise<boolean> {
  const settings = await getPatientWebBookingSettings(patientId, clinicId)
  if (!settings) {
    return true // Default: enabled
  }
  return settings.web_reschedule_enabled
}
