// Migrated to Prisma API Routes

const baseUrl = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  : ''

/**
 * Copy system questionnaire template to clinic
 */
export async function copySystemTemplateToClinic(
  templateId: string,
  clinicId: string
): Promise<{ success: boolean; questionnaireId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/questionnaires?clinic_id=${clinicId}&template_id=${templateId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Failed to copy template:', errorData)
      return { success: false, error: errorData.error || 'テンプレートのコピーに失敗しました' }
    }

    const data = await response.json()
    return {
      success: data.success,
      questionnaireId: data.questionnaireId,
      error: data.error
    }
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
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/questionnaires?clinic_id=${clinicId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('問診表初期化エラー (API):', errorData)
      return {
        success: false,
        count: 0,
        errors: errorData.errors || ['問診表の初期化に失敗しました']
      }
    }

    return await response.json()
  } catch (error) {
    console.error('問診表初期化エラー:', error)
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
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/system-templates`,
      { method: 'GET' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Failed to get system templates:', errorData)
      throw new Error(errorData.error || 'システムテンプレートの取得に失敗しました')
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('Failed to get system templates:', error)
    throw error
  }
}

/**
 * Initialize clinic with default staff positions
 */
export async function initializeClinicStaffPositions(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/staff-positions?clinic_id=${clinicId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('スタッフ役職初期化エラー (API):', errorData)
      return {
        success: false,
        count: 0,
        errors: errorData.errors || ['スタッフ役職の初期化に失敗しました']
      }
    }

    return await response.json()
  } catch (error) {
    console.error('スタッフ役職初期化エラー:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize clinic with default cancel reasons
 */
export async function initializeClinicCancelReasons(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/cancel-reasons?clinic_id=${clinicId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('キャンセル理由初期化エラー (API):', errorData)
      return {
        success: false,
        count: 0,
        errors: errorData.errors || ['キャンセル理由の初期化に失敗しました']
      }
    }

    return await response.json()
  } catch (error) {
    console.error('キャンセル理由初期化エラー:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize clinic with default shift patterns
 */
export async function initializeClinicShiftPatterns(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/shift-patterns?clinic_id=${clinicId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('シフトパターン初期化エラー (API):', errorData)
      return {
        success: false,
        count: 0,
        errors: errorData.errors || ['シフトパターンの初期化に失敗しました']
      }
    }

    return await response.json()
  } catch (error) {
    console.error('シフトパターン初期化エラー:', error)
    return { success: false, count: 0, errors: ['予期しないエラーが発生しました'] }
  }
}

/**
 * Initialize clinic with default notification templates
 */
export async function initializeClinicNotificationTemplates(
  clinicId: string
): Promise<{ success: boolean; count: number; errors: string[] }> {
  try {
    const response = await fetch(
      `${baseUrl}/api/clinic-initialization/notification-templates?clinic_id=${clinicId}`,
      { method: 'POST' }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('通知テンプレート初期化エラー (API):', errorData)
      return {
        success: false,
        count: 0,
        errors: errorData.errors || ['通知テンプレートの初期化に失敗しました']
      }
    }

    return await response.json()
  } catch (error) {
    console.error('通知テンプレート初期化エラー:', error)
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
  shiftPatterns: number
  notificationTemplates: number
  errors: string[]
}> {
  console.log(`Initializing master data for clinic: ${clinicId}`)

  const results = {
    questionnaires: 0,
    staffPositions: 0,
    cancelReasons: 0,
    shiftPatterns: 0,
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

  // 4. Initialize shift patterns
  const shiftPatternResult = await initializeClinicShiftPatterns(clinicId)
  results.shiftPatterns = shiftPatternResult.count
  results.errors.push(...shiftPatternResult.errors)

  // 5. Initialize notification templates
  const notificationResult = await initializeClinicNotificationTemplates(clinicId)
  results.notificationTemplates = notificationResult.count
  results.errors.push(...notificationResult.errors)

  return {
    success: results.errors.length === 0,
    ...results
  }
}
