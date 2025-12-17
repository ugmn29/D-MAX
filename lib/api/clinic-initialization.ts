import { getSupabaseClient } from '@/lib/utils/supabase-client'

/**
 * Copy system questionnaire template to clinic
 */
export async function copySystemTemplateToClinic(
  templateId: string,
  clinicId: string
): Promise<{ success: boolean; questionnaireId?: string; error?: string }> {
  const client = getSupabaseClient()

  try {
    // 1. Get system template
    const { data: template, error: templateError } = await client
      .from('system_questionnaire_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      console.error('Failed to get template:', templateError)
      return { success: false, error: 'テンプレートが見つかりません' }
    }

    // 2. Get template questions
    const { data: questions, error: questionsError } = await client
      .from('system_questionnaire_template_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('sort_order', { ascending: true })

    if (questionsError) {
      console.error('Failed to get template questions:', questionsError)
      return { success: false, error: 'テンプレート質問の取得に失敗しました' }
    }

    // 3. Check if already copied
    const { data: existing } = await client
      .from('questionnaires')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('template_id', templateId)
      .single()

    if (existing) {
      console.log(`Template ${templateId} already copied to clinic ${clinicId}`)
      return { success: true, questionnaireId: existing.id }
    }

    // 4. Create clinic-specific questionnaire
    const { data: newQuestionnaire, error: questionnaireError } = await client
      .from('questionnaires')
      .insert({
        clinic_id: clinicId,
        template_id: templateId,
        name: template.name,
        description: template.description,
        is_active: true
      })
      .select()
      .single()

    if (questionnaireError || !newQuestionnaire) {
      console.error('Failed to create questionnaire:', questionnaireError)
      return { success: false, error: '問診表の作成に失敗しました' }
    }

    // 5. Copy questions
    const newQuestions = (questions || []).map(q => ({
      questionnaire_id: newQuestionnaire.id,
      section_name: q.section_name,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      is_required: q.is_required,
      conditional_logic: q.conditional_logic,
      sort_order: q.sort_order,
      linked_field: q.linked_field
    }))

    if (newQuestions.length > 0) {
      const { error: insertQuestionsError } = await client
        .from('questionnaire_questions')
        .insert(newQuestions)

      if (insertQuestionsError) {
        console.error('Failed to insert questions:', insertQuestionsError)
        // Rollback: delete the questionnaire
        await client
          .from('questionnaires')
          .delete()
          .eq('id', newQuestionnaire.id)
        return { success: false, error: '質問の作成に失敗しました' }
      }
    }

    console.log(`Successfully copied template ${templateId} to clinic ${clinicId}`)
    return { success: true, questionnaireId: newQuestionnaire.id }
  } catch (error) {
    console.error('Unexpected error copying template:', error)
    return { success: false, error: '予期しないエラーが発生しました' }
  }
}

/**
 * Initialize clinic with default questionnaire templates
 */
export async function initializeClinicQuestionnaires(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const client = getSupabaseClient()

  try {
    // Get all active system templates
    const { data: templates, error: templatesError } = await client
      .from('system_questionnaire_templates')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (templatesError || !templates) {
      console.error('Failed to get templates:', templatesError)
      return { success: false, count: 0, errors: ['テンプレートの取得に失敗しました'] }
    }

    console.log(`Found ${templates.length} system templates to copy`)

    const errors: string[] = []
    let successCount = 0

    // Copy each template
    for (const template of templates) {
      const result = await copySystemTemplateToClinic(template.id, clinicId)

      if (result.success) {
        successCount++
        console.log(`✓ Copied template: ${template.name}`)
      } else {
        errors.push(`${template.name}: ${result.error}`)
        console.error(`✗ Failed to copy template: ${template.name}`, result.error)
      }
    }

    return {
      success: errors.length === 0,
      count: successCount,
      errors
    }
  } catch (error) {
    console.error('Unexpected error initializing clinic:', error)
    return {
      success: false,
      count: 0,
      errors: ['予期しないエラーが発生しました']
    }
  }
}

/**
 * Get all system questionnaire templates
 */
export async function getSystemQuestionnaireTemplates() {
  const client = getSupabaseClient()

  const { data, error } = await client
    .from('system_questionnaire_templates')
    .select(`
      *,
      system_questionnaire_template_questions (
        id,
        section_name,
        question_text,
        question_type,
        options,
        is_required,
        conditional_logic,
        sort_order,
        linked_field
      )
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to get system templates:', error)
    throw error
  }

  return data || []
}

/**
 * Initialize clinic with default staff positions
 */
export async function initializeClinicStaffPositions(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const client = getSupabaseClient()

  try {
    // 既存のスタッフ役職をチェック（重複防止）
    const { data: existingPositions } = await client
      .from('staff_positions')
      .select('name')
      .eq('clinic_id', clinicId)

    const existingNames = new Set(existingPositions?.map(p => p.name) || [])

    // Get all active system templates
    const { data: templates, error: templatesError } = await client
      .from('system_staff_positions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (templatesError || !templates) {
      console.error('Failed to get staff position templates:', templatesError)
      return { success: false, count: 0, errors: ['スタッフ役職テンプレートの取得に失敗しました'] }
    }

    console.log(`Found ${templates.length} staff position templates to copy`)

    // 重複しないものだけフィルタリング
    const newTemplates = templates.filter(t => !existingNames.has(t.name))

    if (newTemplates.length === 0) {
      console.log('すべてのスタッフ役職が既に存在します')
      return { success: true, count: 0, errors: [] }
    }

    const newPositions = newTemplates.map(template => ({
      clinic_id: clinicId,
      template_id: template.id,
      name: template.name,
      sort_order: template.sort_order
    }))

    const { error: insertError } = await client
      .from('staff_positions')
      .insert(newPositions)

    if (insertError) {
      console.error('Failed to insert staff positions:', insertError)
      return { success: false, count: 0, errors: ['スタッフ役職の作成に失敗しました'] }
    }

    console.log(`✓ Copied ${newTemplates.length} staff positions (${templates.length - newTemplates.length} skipped)`)
    return { success: true, count: newTemplates.length, errors: [] }
  } catch (error) {
    console.error('Unexpected error initializing staff positions:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize clinic with default cancel reasons
 */
export async function initializeClinicCancelReasons(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const client = getSupabaseClient()

  try {
    // 既存のキャンセル理由をチェック（重複防止）
    const { data: existingReasons } = await client
      .from('cancel_reasons')
      .select('name')
      .eq('clinic_id', clinicId)

    const existingNames = new Set(existingReasons?.map(r => r.name) || [])

    // Get all active system templates
    const { data: templates, error: templatesError } = await client
      .from('system_cancel_reasons')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (templatesError || !templates) {
      console.error('Failed to get cancel reason templates:', templatesError)
      return { success: false, count: 0, errors: ['キャンセル理由テンプレートの取得に失敗しました'] }
    }

    console.log(`Found ${templates.length} cancel reason templates to copy`)

    // 重複しないものだけフィルタリング
    const newTemplates = templates.filter(t => !existingNames.has(t.name))

    if (newTemplates.length === 0) {
      console.log('すべてのキャンセル理由が既に存在します')
      return { success: true, count: 0, errors: [] }
    }

    const newReasons = newTemplates.map(template => ({
      clinic_id: clinicId,
      template_id: template.id,
      name: template.name,
      description: template.description,
      sort_order: template.sort_order,
      is_active: template.is_active
    }))

    const { error: insertError } = await client
      .from('cancel_reasons')
      .insert(newReasons)

    if (insertError) {
      console.error('Failed to insert cancel reasons:', insertError)
      return { success: false, count: 0, errors: ['キャンセル理由の作成に失敗しました'] }
    }

    console.log(`✓ Copied ${newTemplates.length} cancel reasons (${templates.length - newTemplates.length} skipped)`)
    return { success: true, count: newTemplates.length, errors: [] }
  } catch (error) {
    console.error('Unexpected error initializing cancel reasons:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize clinic with default notification templates
 */
export async function initializeClinicNotificationTemplates(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  const client = getSupabaseClient()

  try {
    // 既存の通知テンプレートをチェック（重複防止）
    const { data: existingTemplates } = await client
      .from('notification_templates')
      .select('notification_type, name')
      .eq('clinic_id', clinicId)

    const existingKeys = new Set(
      existingTemplates?.map(t => `${t.notification_type}:${t.name}`) || []
    )

    // Get all active system templates
    const { data: templates, error: templatesError } = await client
      .from('system_notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (templatesError || !templates) {
      console.error('Failed to get notification template templates:', templatesError)
      return { success: false, count: 0, errors: ['通知テンプレートの取得に失敗しました'] }
    }

    console.log(`Found ${templates.length} notification templates to copy`)

    // 重複しないものだけフィルタリング
    const filteredTemplates = templates.filter(
      t => !existingKeys.has(`${t.notification_type}:${t.name}`)
    )

    if (filteredTemplates.length === 0) {
      console.log('すべての通知テンプレートが既に存在します')
      return { success: true, count: 0, errors: [] }
    }

    const newTemplates = filteredTemplates.map(template => ({
      clinic_id: clinicId,
      template_id: template.id,
      name: template.name,
      notification_type: template.notification_type,
      message_template: template.message_template,
      line_message: template.line_message,
      email_subject: template.email_subject,
      email_message: template.email_message,
      sms_message: template.sms_message,
      default_timing_value: template.default_timing_value,
      default_timing_unit: template.default_timing_unit
    }))

    const { error: insertError } = await client
      .from('notification_templates')
      .insert(newTemplates)

    if (insertError) {
      console.error('Failed to insert notification templates:', insertError)
      return { success: false, count: 0, errors: ['通知テンプレートの作成に失敗しました'] }
    }

    console.log(`✓ Copied ${filteredTemplates.length} notification templates (${templates.length - filteredTemplates.length} skipped)`)
    return { success: true, count: filteredTemplates.length, errors: [] }
  } catch (error) {
    console.error('Unexpected error initializing notification templates:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize all clinic master data
 */
export async function initializeClinicMasterData(
  clinicId: string
): Promise<{
  success: boolean
  questionnaires: number
  staffPositions: number
  cancelReasons: number
  notificationTemplates: number
  errors: string[]
}> {
  console.log(`Initializing master data for clinic: ${clinicId}`)

  const results = {
    questionnaires: 0,
    staffPositions: 0,
    cancelReasons: 0,
    notificationTemplates: 0,
    errors: [] as string[]
  }

  // 1. Initialize questionnaires
  const questionnaireResult = await initializeClinicQuestionnaires(clinicId)
  results.questionnaires = questionnaireResult.count
  results.errors.push(...questionnaireResult.errors)

  // 2. Initialize staff positions
  const staffResult = await initializeClinicStaffPositions(clinicId)
  results.staffPositions = staffResult.count
  results.errors.push(...staffResult.errors)

  // 3. Initialize cancel reasons
  const cancelResult = await initializeClinicCancelReasons(clinicId)
  results.cancelReasons = cancelResult.count
  results.errors.push(...cancelResult.errors)

  // 4. Initialize notification templates
  const notificationResult = await initializeClinicNotificationTemplates(clinicId)
  results.notificationTemplates = notificationResult.count
  results.errors.push(...notificationResult.errors)

  return {
    success: results.errors.length === 0,
    ...results
  }
}
