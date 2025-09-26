import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: '音声ファイルが見つかりません' },
        { status: 400 }
      )
    }

    // 一時的にモック実装を使用
    // TODO: Google Cloud APIの設定完了後に実際のAPIに切り替え
    await new Promise(resolve => setTimeout(resolve, 2000)) // 2秒の遅延をシミュレート
    
    const mockTranscription = 'こんにちは。動作、今日はどうされましたか? 歯が痛くて歯が痛くて、もう耐えられないんです。眠れないんですが、あそうなんですね。えっとどんな時に痛みがありますか? もう冷たいものを飲んでも熱いものを食べても何もしなくても痛いんです。'

    return NextResponse.json({
      transcript: mockTranscription,
      confidence: 0.85,
      languageCode: 'ja-JP'
    })
  } catch (error) {
    console.error('文字起こしAPI エラー:', error)
    return NextResponse.json(
      { error: '文字起こしに失敗しました' },
      { status: 500 }
    )
  }
}
