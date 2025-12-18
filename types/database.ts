// D-MAX データベース型定義

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: string
          name: string
          name_kana?: string
          phone?: string
          email?: string
          website_url?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          business_hours?: BusinessHours
          break_times?: BreakTimes
          time_slot_minutes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_kana?: string
          phone?: string
          email?: string
          website_url?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          business_hours?: BusinessHours
          break_times?: BreakTimes
          time_slot_minutes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_kana?: string
          phone?: string
          email?: string
          website_url?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          business_hours?: BusinessHours
          break_times?: BreakTimes
          time_slot_minutes?: number
          created_at?: string
          updated_at?: string
        }
      }
      staff_positions: {
        Row: {
          id: string
          clinic_id: string
          name: string
          sort_order: number
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          sort_order?: number
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          sort_order?: number
          enabled?: boolean
          created_at?: string
        }
      }
      shift_patterns: {
        Row: {
          id: string
          clinic_id: string
          abbreviation: string
          name: string
          start_time: string
          end_time: string
          break_start: string | null
          break_end: string | null
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          abbreviation: string
          name: string
          start_time: string
          end_time: string
          break_start?: string | null
          break_end?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          abbreviation?: string
          name?: string
          start_time?: string
          end_time?: string
          break_start?: string | null
          break_end?: string | null
          memo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_shifts: {
        Row: {
          id: string
          clinic_id: string
          staff_id: string
          date: string
          shift_pattern_id: string | null
          is_holiday: boolean
          created_at: string
          updated_at: string
          staff?: {
            id: string
            name: string
            name_kana?: string
            position_id?: string
            role: string
            is_active: boolean
            position?: {
              id: string
              name: string
              sort_order: number
            }
          }
          shift_patterns?: {
            abbreviation: string
            name: string
            start_time: string
            end_time: string
            break_start: string | null
            break_end: string | null
          }
        }
        Insert: {
          id?: string
          clinic_id: string
          staff_id: string
          date: string
          shift_pattern_id?: string | null
          is_holiday?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          staff_id?: string
          date?: string
          shift_pattern_id?: string | null
          is_holiday?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          clinic_id: string
          user_id?: string
          position_id?: string
          name: string
          name_kana?: string
          email?: string
          phone?: string
          employee_number?: string
          role: StaffRole
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          user_id?: string
          position_id?: string
          name: string
          name_kana?: string
          email?: string
          phone?: string
          employee_number?: string
          role?: StaffRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          user_id?: string
          position_id?: string
          name?: string
          name_kana?: string
          email?: string
          phone?: string
          employee_number?: string
          role?: StaffRole
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          clinic_id: string
          name: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      treatment_menus: {
        Row: {
          id: string
          clinic_id: string
          parent_id?: string
          level: number
          name: string
          standard_duration?: number
          color?: string
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          parent_id?: string
          level: number
          name: string
          standard_duration?: number
          color?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          parent_id?: string
          level?: number
          name?: string
          standard_duration?: number
          color?: string
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      patient_note_types: {
        Row: {
          id: string
          clinic_id: string
          name: string
          icon?: string
          color?: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          name: string
          icon?: string
          color?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          name?: string
          icon?: string
          color?: string
          sort_order?: number
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          clinic_id: string
          patient_number: number | null
          global_uuid: string
          last_name: string
          first_name: string
          last_name_kana?: string
          first_name_kana?: string
          birth_date?: string
          gender?: Gender
          phone?: string
          email?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          address?: string
          preferred_contact_method?: string
          visit_reason?: string
          allergies?: string
          medical_history?: string
          medications?: string
          primary_doctor_id?: string
          primary_hygienist_id?: string
          insurance_data?: any
          is_registered: boolean
          family_group_id?: string
          legacy_patient_number?: string
          legacy_system_name?: string
          migrated_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_number?: number | null
          global_uuid?: string
          last_name: string
          first_name: string
          last_name_kana?: string
          first_name_kana?: string
          birth_date?: string
          gender?: Gender
          phone?: string
          email?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          address?: string
          preferred_contact_method?: string
          visit_reason?: string
          allergies?: string
          medical_history?: string
          medications?: string
          primary_doctor_id?: string
          primary_hygienist_id?: string
          insurance_data?: any
          is_registered?: boolean
          family_group_id?: string
          legacy_patient_number?: string
          legacy_system_name?: string
          migrated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_number?: number | null
          global_uuid?: string
          last_name?: string
          first_name?: string
          last_name_kana?: string
          first_name_kana?: string
          birth_date?: string
          gender?: Gender
          phone?: string
          email?: string
          postal_code?: string
          prefecture?: string
          city?: string
          address_line?: string
          address?: string
          preferred_contact_method?: string
          visit_reason?: string
          allergies?: string
          medical_history?: string
          medications?: string
          primary_doctor_id?: string
          primary_hygienist_id?: string
          insurance_data?: any
          is_registered?: boolean
          family_group_id?: string
          legacy_patient_number?: string
          legacy_system_name?: string
          migrated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          appointment_date: string
          start_time: string
          end_time: string
          unit_id?: string
          menu1_id?: string
          menu2_id?: string
          menu3_id?: string
          staff1_id?: string
          staff2_id?: string
          staff3_id?: string
          status: AppointmentStatus
          memo?: string
          created_by?: string
          created_at: string
          updated_at: string
          is_block?: boolean
          block_color?: string
          block_text?: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          appointment_date: string
          start_time: string
          end_time: string
          unit_id?: string
          menu1_id?: string
          menu2_id?: string
          menu3_id?: string
          staff1_id?: string
          staff2_id?: string
          staff3_id?: string
          status?: AppointmentStatus
          memo?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_block?: boolean
          block_color?: string
          block_text?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          unit_id?: string
          menu1_id?: string
          menu2_id?: string
          menu3_id?: string
          staff1_id?: string
          staff2_id?: string
          staff3_id?: string
          status?: AppointmentStatus
          memo?: string
          created_by?: string
          created_at?: string
          updated_at?: string
          is_block?: boolean
          block_color?: string
          block_text?: string
        }
      }
      appointment_logs: {
        Row: {
          id: string
          appointment_id?: string
          action: LogAction
          before_data?: any
          after_data?: any
          reason: string
          operator_id?: string
          ip_address?: string
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id?: string
          action: LogAction
          before_data?: any
          after_data?: any
          reason: string
          operator_id?: string
          ip_address?: string
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          action?: LogAction
          before_data?: any
          after_data?: any
          reason?: string
          operator_id?: string
          ip_address?: string
          created_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          clinic_id: string
          staff_id: string
          date: string
          start_time?: string
          end_time?: string
          break_start_time?: string
          break_end_time?: string
          pattern_name?: string
          is_absent: boolean
          substitute_for_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          staff_id: string
          date: string
          start_time?: string
          end_time?: string
          break_start_time?: string
          break_end_time?: string
          pattern_name?: string
          is_absent?: boolean
          substitute_for_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          staff_id?: string
          date?: string
          start_time?: string
          end_time?: string
          break_start_time?: string
          break_end_time?: string
          pattern_name?: string
          is_absent?: boolean
          substitute_for_id?: string
          created_at?: string
        }
      }
      clinic_settings: {
        Row: {
          id: string
          clinic_id: string
          setting_key: string
          setting_value?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          setting_key: string
          setting_value?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          setting_key?: string
          setting_value?: any
          created_at?: string
          updated_at?: string
        }
      }
      daily_memos: {
        Row: {
          id: string
          clinic_id: string
          date: string
          memo?: string
          created_by?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          date: string
          memo?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          date?: string
          memo?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      visual_examinations: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string
          examination_date: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id: string
          examination_date?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string
          examination_date?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      visual_tooth_data: {
        Row: {
          id: string
          examination_id: string
          tooth_number: number
          status: string
          caries_level?: string
          restoration_type?: string
          material_type?: string
          notes?: string
          created_at: string
        }
        Insert: {
          id?: string
          examination_id: string
          tooth_number: number
          status: string
          caries_level?: string
          restoration_type?: string
          material_type?: string
          notes?: string
          created_at?: string
        }
        Update: {
          id?: string
          examination_id?: string
          tooth_number?: number
          status?: string
          caries_level?: string
          restoration_type?: string
          material_type?: string
          notes?: string
          created_at?: string
        }
      }
      trainings: {
        Row: {
          id: string
          clinic_id: string | null
          training_name: string
          description: string | null
          category: string | null
          animation_storage_path: string | null
          mirror_display: boolean
          is_default: boolean
          default_action_seconds: number
          default_rest_seconds: number
          default_sets: number
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clinic_id?: string | null
          training_name: string
          description?: string | null
          category?: string | null
          animation_storage_path?: string | null
          mirror_display?: boolean
          is_default?: boolean
          default_action_seconds?: number
          default_rest_seconds?: number
          default_sets?: number
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string | null
          training_name?: string
          description?: string | null
          category?: string | null
          animation_storage_path?: string | null
          mirror_display?: boolean
          is_default?: boolean
          default_action_seconds?: number
          default_rest_seconds?: number
          default_sets?: number
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      training_menus: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string
          menu_name: string | null
          prescribed_at: string
          is_active: boolean
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id: string
          menu_name?: string | null
          prescribed_at?: string
          is_active?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string
          menu_name?: string | null
          prescribed_at?: string
          is_active?: boolean
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      menu_trainings: {
        Row: {
          id: string
          menu_id: string
          training_id: string
          sort_order: number
          action_seconds: number
          rest_seconds: number
          sets: number
          auto_progress: boolean
          created_at: string
        }
        Insert: {
          id?: string
          menu_id: string
          training_id: string
          sort_order: number
          action_seconds: number
          rest_seconds: number
          sets: number
          auto_progress?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          menu_id?: string
          training_id?: string
          sort_order?: number
          action_seconds?: number
          rest_seconds?: number
          sets?: number
          auto_progress?: boolean
          created_at?: string
        }
      }
      training_evaluations: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string
          menu_id: string | null
          training_id: string
          menu_training_id: string | null
          evaluated_at: string
          evaluator_id: string | null
          evaluation_level: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id: string
          menu_id?: string | null
          training_id: string
          menu_training_id?: string | null
          evaluated_at?: string
          evaluator_id?: string | null
          evaluation_level: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string
          menu_id?: string | null
          training_id?: string
          menu_training_id?: string | null
          evaluated_at?: string
          evaluator_id?: string | null
          evaluation_level?: number
          comment?: string | null
          created_at?: string
        }
      }
      periodontal_examinations: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string
          examination_date: string
          examiner_id: string | null
          measurement_type: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id: string
          examination_date?: string
          examiner_id?: string | null
          measurement_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string
          examination_date?: string
          examiner_id?: string | null
          measurement_type?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      periodontal_tooth_data: {
        Row: {
          id: string
          examination_id: string
          tooth_number: number
          plaque_top: boolean
          plaque_right: boolean
          plaque_bottom: boolean
          plaque_left: boolean
          is_missing: boolean
          mobility: number | null
          ppd_mb: number | null
          ppd_b: number | null
          ppd_db: number | null
          ppd_ml: number | null
          ppd_l: number | null
          ppd_dl: number | null
          bop_mb: boolean
          bop_b: boolean
          bop_db: boolean
          bop_ml: boolean
          bop_l: boolean
          bop_dl: boolean
          pus_mb: boolean
          pus_b: boolean
          pus_db: boolean
          pus_ml: boolean
          pus_l: boolean
          pus_dl: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          examination_id: string
          tooth_number: number
          plaque_top?: boolean
          plaque_right?: boolean
          plaque_bottom?: boolean
          plaque_left?: boolean
          is_missing?: boolean
          mobility?: number | null
          ppd_mb?: number | null
          ppd_b?: number | null
          ppd_db?: number | null
          ppd_ml?: number | null
          ppd_l?: number | null
          ppd_dl?: number | null
          bop_mb?: boolean
          bop_b?: boolean
          bop_db?: boolean
          bop_ml?: boolean
          bop_l?: boolean
          bop_dl?: boolean
          pus_mb?: boolean
          pus_b?: boolean
          pus_db?: boolean
          pus_ml?: boolean
          pus_l?: boolean
          pus_dl?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          examination_id?: string
          tooth_number?: number
          plaque_top?: boolean
          plaque_right?: boolean
          plaque_bottom?: boolean
          plaque_left?: boolean
          is_missing?: boolean
          mobility?: number | null
          ppd_mb?: number | null
          ppd_b?: number | null
          ppd_db?: number | null
          ppd_ml?: number | null
          ppd_l?: number | null
          ppd_dl?: number | null
          bop_mb?: boolean
          bop_b?: boolean
          bop_db?: boolean
          bop_ml?: boolean
          bop_l?: boolean
          bop_dl?: boolean
          pus_mb?: boolean
          pus_b?: boolean
          pus_db?: boolean
          pus_ml?: boolean
          pus_l?: boolean
          pus_dl?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      line_invitation_codes: {
        Row: {
          id: string
          clinic_id: string
          patient_id: string
          invitation_code: string
          status: 'pending' | 'used' | 'expired'
          expires_at: string
          used_at: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          clinic_id: string
          patient_id: string
          invitation_code: string
          status?: 'pending' | 'used' | 'expired'
          expires_at: string
          used_at?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          clinic_id?: string
          patient_id?: string
          invitation_code?: string
          status?: 'pending' | 'used' | 'expired'
          expires_at?: string
          used_at?: string | null
          created_by?: string
          created_at?: string
        }
      }
      line_patient_linkages: {
        Row: {
          id: string
          line_user_id: string
          patient_id: string
          clinic_id: string
          relationship: 'self' | 'parent' | 'spouse' | 'child' | 'other'
          is_primary: boolean
          linked_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          line_user_id: string
          patient_id: string
          clinic_id: string
          relationship?: 'self' | 'parent' | 'spouse' | 'child' | 'other'
          is_primary?: boolean
          linked_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          line_user_id?: string
          patient_id?: string
          clinic_id?: string
          relationship?: 'self' | 'parent' | 'spouse' | 'child' | 'other'
          is_primary?: boolean
          linked_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      patient_qr_codes: {
        Row: {
          id: string
          patient_id: string
          clinic_id: string
          qr_token: string
          expires_at: string | null
          last_used_at: string | null
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          clinic_id: string
          qr_token: string
          expires_at?: string | null
          last_used_at?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          clinic_id?: string
          qr_token?: string
          expires_at?: string | null
          last_used_at?: string | null
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Enum型定義
export type StaffRole = 'admin' | 'clinic' | 'staff'
export type Gender = 'male' | 'female' | 'other'
export type AppointmentStatus = '未来院' | '遅刻' | '来院済み' | '診療中' | '会計' | '終了' | 'キャンセル'
export type LogAction = '作成' | '変更' | 'キャンセル' | '削除'

// 複合型定義
export type BusinessHours = {
  [key: string]: {
    isOpen: boolean
    start?: string
    end?: string
    timeSlots?: Array<{
      id: string
      start: string
      end: string
      period: 'morning' | 'afternoon'
    }>
  }
}

export type BreakTimes = {
  [key: string]: {
    start?: string
    end?: string
  }
}

// アプリケーション用型定義
export type Patient = Database['public']['Tables']['patients']['Row']
export type PatientInsert = Database['public']['Tables']['patients']['Insert']
export type PatientUpdate = Database['public']['Tables']['patients']['Update']

export type Appointment = Database['public']['Tables']['appointments']['Row']
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert']
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update']

export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffInsert = Database['public']['Tables']['staff']['Insert']
export type StaffUpdate = Database['public']['Tables']['staff']['Update']

export type Clinic = Database['public']['Tables']['clinics']['Row']
export type ClinicInsert = Database['public']['Tables']['clinics']['Insert']
export type ClinicUpdate = Database['public']['Tables']['clinics']['Update']

export type StaffPosition = Database['public']['Tables']['staff_positions']['Row']
export type StaffPositionInsert = Database['public']['Tables']['staff_positions']['Insert']
export type StaffPositionUpdate = Database['public']['Tables']['staff_positions']['Update']

export type ShiftPattern = Database['public']['Tables']['shift_patterns']['Row']
export type ShiftPatternInsert = Database['public']['Tables']['shift_patterns']['Insert']
export type ShiftPatternUpdate = Database['public']['Tables']['shift_patterns']['Update']

export type StaffShift = Database['public']['Tables']['staff_shifts']['Row']
export type StaffShiftInsert = Database['public']['Tables']['staff_shifts']['Insert']
export type StaffShiftUpdate = Database['public']['Tables']['staff_shifts']['Update']

export type TreatmentMenu = Database['public']['Tables']['treatment_menus']['Row']
export type TreatmentMenuInsert = Database['public']['Tables']['treatment_menus']['Insert']
export type TreatmentMenuUpdate = Database['public']['Tables']['treatment_menus']['Update']

export type DailyMemo = Database['public']['Tables']['daily_memos']['Row']
export type DailyMemoInsert = Database['public']['Tables']['daily_memos']['Insert']
export type DailyMemoUpdate = Database['public']['Tables']['daily_memos']['Update']

export type LineInvitationCode = Database['public']['Tables']['line_invitation_codes']['Row']
export type LineInvitationCodeInsert = Database['public']['Tables']['line_invitation_codes']['Insert']
export type LineInvitationCodeUpdate = Database['public']['Tables']['line_invitation_codes']['Update']

export type LinePatientLinkage = Database['public']['Tables']['line_patient_linkages']['Row']
export type LinePatientLinkageInsert = Database['public']['Tables']['line_patient_linkages']['Insert']
export type LinePatientLinkageUpdate = Database['public']['Tables']['line_patient_linkages']['Update']

export type PatientQRCode = Database['public']['Tables']['patient_qr_codes']['Row']
export type PatientQRCodeInsert = Database['public']['Tables']['patient_qr_codes']['Insert']
export type PatientQRCodeUpdate = Database['public']['Tables']['patient_qr_codes']['Update']

// 拡張型定義（JOIN結果など）
export type AppointmentWithPatient = Appointment & {
  patient: Patient
  staff1?: Staff
  staff2?: Staff
  staff3?: Staff
  menu1?: TreatmentMenu
  menu2?: TreatmentMenu
  menu3?: TreatmentMenu
}

export type PatientWithNotes = Patient & {
  patient_notes: Array<{
    id: string
    note_type: {
      name: string
      icon?: string
      color?: string
    }
  }>
}

// 通知システムの型をre-export
export * from './notification'

// 電子カルテ (EMR) システムの型をre-export
export * from './emr'