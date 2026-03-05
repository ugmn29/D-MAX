import { Resend } from 'resend'

export async function sendStaffWelcomeEmail(params: {
  email: string
  name: string
  clinicName: string
  passwordSetupLink: string
}): Promise<boolean> {
  const { email, name, clinicName, passwordSetupLink } = params

  if (!process.env.RESEND_API_KEY) {
    console.error('[sendStaffWelcomeEmail] RESEND_API_KEY が設定されていません')
    return false
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: 'HubDent (スタッフ案内) <yoyaku@d-smart.jp>',
      to: email,
      subject: `【HubDent】${clinicName} スタッフアカウントのご案内`,
      text: `${name} 様

${clinicName} のHubDentスタッフアカウントが作成されました。

以下のリンクからパスワードを設定してください。
（リンクの有効期限は1時間です）

${passwordSetupLink}

パスワード設定後は以下のURLからログインできます：
https://app.hubdent.jp/login

ご不明点はシステム管理者にお問い合わせください。`,
    })

    if (error) {
      console.error('[sendStaffWelcomeEmail] Resendエラー:', JSON.stringify(error))
      return false
    }
    return true
  } catch (err: any) {
    console.error('[sendStaffWelcomeEmail] 例外:', err?.message ?? err)
    return false
  }
}
