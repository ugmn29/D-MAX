import { SpeechClient } from '@google-cloud/speech'

// Google Cloud Speech-to-Text API クライアント
const speechClient = new SpeechClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
})

export interface TranscriptionResult {
  transcript: string
  confidence: number
  languageCode: string
}

export interface TranscriptionOptions {
  languageCode?: string
  sampleRateHertz?: number
  encoding?: string
  enableAutomaticPunctuation?: boolean
  enableWordTimeOffsets?: boolean
  model?: string
}

/**
 * 音声ファイルを文字起こしする
 * @param audioBuffer 音声データのバッファ
 * @param options 文字起こしオプション
 * @returns 文字起こし結果
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  try {
    const {
      languageCode = 'ja-JP',
      sampleRateHertz = 16000,
      encoding = 'WEBM_OPUS',
      enableAutomaticPunctuation = true,
      enableWordTimeOffsets = false,
      model = 'latest_long'
    } = options

    const request = {
      audio: {
        content: audioBuffer.toString('base64'),
      },
      config: {
        encoding: encoding as any,
        sampleRateHertz,
        languageCode,
        enableAutomaticPunctuation,
        enableWordTimeOffsets,
        model,
        // 医療用語の認識精度向上のための設定
        alternativeLanguageCodes: ['ja-JP'],
        useEnhanced: true,
        // ノイズ除去とエコーキャンセレーション
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: false,
      },
    }

    const [response] = await speechClient.recognize(request)
    
    if (!response.results || response.results.length === 0) {
      throw new Error('音声認識結果がありません')
    }

    const result = response.results[0]
    const transcript = result.alternatives?.[0]?.transcript || ''
    const confidence = result.alternatives?.[0]?.confidence || 0

    return {
      transcript,
      confidence,
      languageCode
    }
  } catch (error) {
    console.error('音声文字起こしエラー:', error)
    throw new Error(`音声文字起こしに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * リアルタイム音声認識（ストリーミング）
 * @param audioStream 音声ストリーム
 * @param options 文字起こしオプション
 * @returns 文字起こしストリーム
 */
export async function* transcribeAudioStream(
  audioStream: AsyncIterable<Buffer>,
  options: TranscriptionOptions = {}
): AsyncGenerator<TranscriptionResult, void, unknown> {
  try {
    const {
      languageCode = 'ja-JP',
      sampleRateHertz = 16000,
      encoding = 'WEBM_OPUS',
      enableAutomaticPunctuation = true,
      model = 'latest_long'
    } = options

    const request = {
      config: {
        encoding: encoding as any,
        sampleRateHertz,
        languageCode,
        enableAutomaticPunctuation,
        model,
        useEnhanced: true,
        audioChannelCount: 1,
      },
      interimResults: true,
    }

    const recognizeStream = speechClient.streamingRecognize(request)

    // 音声ストリームを認識ストリームに送信
    for await (const chunk of audioStream) {
      recognizeStream.write(chunk)
    }
    recognizeStream.end()

    // 認識結果をストリーミング
    for await (const response of recognizeStream) {
      if (response.results && response.results.length > 0) {
        const result = response.results[0]
        const transcript = result.alternatives?.[0]?.transcript || ''
        const confidence = result.alternatives?.[0]?.confidence || 0

        if (transcript) {
          yield {
            transcript,
            confidence,
            languageCode
          }
        }
      }
    }
  } catch (error) {
    console.error('リアルタイム音声認識エラー:', error)
    throw new Error(`リアルタイム音声認識に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 医療用語辞書の設定
 * 医療分野特有の用語の認識精度を向上させる
 */
export const medicalPhrases = [
  '主訴', '症状', '診断', '処置', '治療', '検査', '薬剤', '副作用',
  'アレルギー', '既往歴', '家族歴', '現病歴', 'バイタルサイン',
  '血圧', '脈拍', '体温', '呼吸数', '酸素飽和度',
  '疼痛', '発熱', '倦怠感', '食欲不振', '睡眠障害',
  '高血圧', '糖尿病', '心疾患', '脳血管疾患', 'がん',
  'レントゲン', 'CT', 'MRI', '超音波', '内視鏡',
  '手術', '入院', '退院', '外来', '緊急',
  '禁忌', '注意事項', '副作用', '相互作用'
]

/**
 * 医療用語辞書を含む設定で文字起こしを実行
 */
export async function transcribeMedicalAudio(
  audioBuffer: Buffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const medicalOptions = {
    ...options,
    // 医療用語の認識精度向上
    speechContexts: [{
      phrases: medicalPhrases,
      boost: 20.0
    }]
  }

  return transcribeAudio(audioBuffer, medicalOptions)
}
