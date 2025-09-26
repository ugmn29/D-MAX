import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text, templateId } = await request.json()
    
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: '要約するテキストが空です' },
        { status: 400 }
      )
    }

    // 一時的にモック実装を使用
    // TODO: Google Cloud APIの設定完了後に実際のAPIに切り替え
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3秒の遅延をシミュレート
    
    let mockSummary = ''
    if (templateId === 'soap') {
      mockSummary = `*主訴: 激しい歯痛 (冷・温刺激、安静時にも痛みあり)
*睡眠障害:痛みのため睡眠不足
*診断:後日検査にて確定 (会話内容からは診断名不明)
*処置:なし(現状では痛みの原因究明のための検査が必要と推測)
*注意事項:痛み止め等の服用を検討する必要があると思われる。
*次回計画:精密検査 (レントゲン撮影など)のため、次回予約が必要。`
    } else if (templateId === 'simple') {
      mockSummary = `主訴: 歯痛
症状: 冷温刺激、安静時にも痛み
診断: 要検査
処置: 検査予定
注意事項: 痛み止め検討`
    } else {
      mockSummary = `【主訴・症状】
患者は激しい歯痛を訴えており、冷たいものや熱いものを摂取した際、また安静時にも痛みが生じている。痛みのため睡眠が取れない状況。

【診断・評価】
会話内容からは具体的な診断名は不明。詳細な検査（レントゲン撮影等）が必要。

【処置・治療】
現時点では処置は実施せず、原因究明のための検査を優先。

【注意事項】
痛み止め等の対症療法を検討する必要がある。

【次回計画】
精密検査のため、次回予約が必要。`
    }

    return NextResponse.json({
      summary: mockSummary,
      template: templateId === 'soap' ? 'SOAP形式' : templateId === 'simple' ? '簡単要約' : '詳細要約',
      confidence: 0.85,
      wordCount: mockSummary.length
    })
  } catch (error) {
    console.error('要約API エラー:', error)
    return NextResponse.json(
      { error: '要約に失敗しました' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // 一時的にモック実装を使用
    const templates = [
      { id: 'soap', name: 'SOAP形式', description: '標準的な医療記録形式' },
      { id: 'simple', name: '簡単要約', description: '要点のみを簡潔にまとめた要約' },
      { id: 'detailed', name: '詳細要約', description: '包括的で詳細な医療記録' }
    ]
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('テンプレート取得エラー:', error)
    return NextResponse.json(
      { error: 'テンプレートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
