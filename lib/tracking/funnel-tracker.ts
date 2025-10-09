/**
 * Web予約ファネルのトラッキング機能
 */

import { getOrCreateSessionId, getStoredUTMData } from './utm-tracker'

export const FUNNEL_STEPS = {
  LANDING: { name: 'landing', number: 1, label: 'ランディング' },
  DATE_SELECTION: { name: 'date_selection', number: 2, label: '日付選択' },
  TIME_SELECTION: { name: 'time_selection', number: 3, label: '時間選択' },
  MENU_SELECTION: { name: 'menu_selection', number: 4, label: 'メニュー選択' },
  PATIENT_INFO: { name: 'patient_info', number: 5, label: '患者情報入力' },
  COMPLETE: { name: 'complete', number: 6, label: '予約完了' },
} as const

export type FunnelStepName = keyof typeof FUNNEL_STEPS
export type EventType = 'page_view' | 'button_click' | 'form_submit'

export interface FunnelEventData {
  clinic_id: string
  step_name: string
  step_number: number
  event_type: EventType
  metadata?: Record<string, any>
}

/**
 * ファネルイベントを記録
 */
export async function trackFunnelEvent(
  clinicId: string,
  stepName: FunnelStepName,
  eventType: EventType,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId()
    const utmData = getStoredUTMData()
    const step = FUNNEL_STEPS[stepName]

    const eventData = {
      session_id: sessionId,
      clinic_id: clinicId,
      step_name: step.name,
      step_number: step.number,
      event_type: eventType,
      utm_source: utmData?.utm.utm_source || null,
      utm_medium: utmData?.utm.utm_medium || null,
      utm_campaign: utmData?.utm.utm_campaign || null,
      device_type: utmData?.device.device_type || null,
      metadata: metadata || null,
    }

    console.log('[Funnel] Tracking event:', eventData)

    const response = await fetch('/api/tracking/funnel-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      console.error('[Funnel] Failed to track event:', await response.text())
    }
  } catch (error) {
    console.error('[Funnel] Error tracking event:', error)
  }
}

/**
 * ページビューを記録
 */
export async function trackPageView(
  clinicId: string,
  stepName: FunnelStepName,
  metadata?: Record<string, any>
): Promise<void> {
  await trackFunnelEvent(clinicId, stepName, 'page_view', metadata)
}

/**
 * ボタンクリックを記録
 */
export async function trackButtonClick(
  clinicId: string,
  stepName: FunnelStepName,
  buttonLabel: string,
  metadata?: Record<string, any>
): Promise<void> {
  await trackFunnelEvent(clinicId, stepName, 'button_click', {
    button_label: buttonLabel,
    ...metadata,
  })
}

/**
 * フォーム送信を記録
 */
export async function trackFormSubmit(
  clinicId: string,
  stepName: FunnelStepName,
  metadata?: Record<string, any>
): Promise<void> {
  await trackFunnelEvent(clinicId, stepName, 'form_submit', metadata)
}
