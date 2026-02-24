import { z } from 'zod'

export const patientCreateSchema = z.object({
  clinic_id: z.string().uuid(),
  last_name: z.string().min(1).max(50),
  first_name: z.string().max(50).optional(),
  last_name_kana: z.string().max(50).optional(),
  first_name_kana: z.string().max(50).optional(),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  emergency_contact: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  insurance_type: z.string().max(50).optional().nullable(),
  insurance_number: z.string().max(50).optional().nullable(),
})

export const patientUpdateSchema = patientCreateSchema.partial().omit({ clinic_id: true })
