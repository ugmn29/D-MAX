/**
 * TC-SWE001〜SWE004: sendStaffWelcomeEmail
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── モック定義 ─────────────────────────────────────────────────────

const mockEmailsSend = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockEmailsSend },
  })),
}))

// ── テスト本体 ─────────────────────────────────────────────────────

import { sendStaffWelcomeEmail } from '@/lib/api/send-staff-welcome-email'

const validParams = {
  email: 'staff@example.com',
  name: '山田花子',
  clinicName: 'テスト歯科クリニック',
  passwordSetupLink: 'https://reset.example.com/setup-link',
}

describe('sendStaffWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    mockEmailsSend.mockResolvedValue({ data: { id: 'email-id-123' }, error: null })
  })

  it('TC-SWE001: 正常なパラメータ → Resend.emails.send呼び出し → true返却', async () => {
    const result = await sendStaffWelcomeEmail(validParams)

    expect(result).toBe(true)
    expect(mockEmailsSend).toHaveBeenCalledTimes(1)
  })

  it('TC-SWE002: メール内容の確認（from・to・subject・本文にリンク含む）', async () => {
    await sendStaffWelcomeEmail(validParams)

    expect(mockEmailsSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'HubDent (スタッフ案内) <yoyaku@hubdent.net>',
        to: 'staff@example.com',
        subject: '【HubDent】テスト歯科クリニック スタッフアカウントのご案内',
        text: expect.stringContaining('https://reset.example.com/setup-link'),
      })
    )
    const call = mockEmailsSend.mock.calls[0][0]
    expect(call.text).toContain('山田花子')
    expect(call.text).toContain('テスト歯科クリニック')
  })

  it('TC-SWE003: Resendがerrorオブジェクトを返す → false返却', async () => {
    mockEmailsSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } })

    const result = await sendStaffWelcomeEmail(validParams)

    expect(result).toBe(false)
  })

  it('TC-SWE004: Resend.emails.sendが例外をthrow → false返却', async () => {
    mockEmailsSend.mockRejectedValue(new Error('Network error'))

    const result = await sendStaffWelcomeEmail(validParams)

    expect(result).toBe(false)
  })

  it('TC-SWE005: RESEND_API_KEYが未設定 → false返却', async () => {
    vi.stubEnv('RESEND_API_KEY', '')

    const result = await sendStaffWelcomeEmail(validParams)

    expect(result).toBe(false)
    expect(mockEmailsSend).not.toHaveBeenCalled()
  })
})
