import { NextRequest, NextResponse } from 'next/server'
import speech from '@google-cloud/speech'

// Google Cloud Speech-to-Text client
let speechClient: speech.SpeechClient | null = null

function getSpeechClient() {
  if (!speechClient) {
    // 本番環境: 環境変数からサービスアカウントのJSON文字列を読み込む（Vercel/Cloud Run）
    // 開発環境: gcloud auth application-default login で認証
    if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON)
      speechClient = new speech.SpeechClient({
        credentials,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      })
    } else {
      // 開発環境: gcloud auth application-default login
      // または Cloud Run/GKE/GCE では自動的にサービスアカウントを使用
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
      speechClient = new speech.SpeechClient({
        projectId,
        // ADCを使用する場合も明示的にquotaProjectIdを設定
        ...(projectId && { quotaProjectId: projectId })
      })
    }
  }
  return speechClient
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const vocabulary = formData.get('vocabulary') as string | null

    if (!audioFile) {
      return NextResponse.json(
        { error: '音声ファイルが見つかりません' },
        { status: 400 }
      )
    }

    // 音声データをバッファに変換
    const audioBytes = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(audioBytes)

    console.log('🎤 受信した音声データ:', {
      size: audioBuffer.length,
      filename: audioFile.name,
      type: audioFile.type,
    })

    const client = getSpeechClient()

    // カスタム語彙の設定
    const customPhrases = vocabulary ? JSON.parse(vocabulary) : []

    // P検査専用の語彙を追加（拡張版）
    const periodontalPhrases = [
      // 歯科専門用語
      '遠心', '中央', '近心',
      '頬側', '舌側', '口蓋側',
      'えんしん', 'ちゅうおう', 'きんしん',
      'きょうそく', 'ほおがわ', 'ぜっそく', 'したがわ', 'こうがいそく',
      'BOP', 'ビーオーピー', '出血',
      '排膿', 'はいのう',
      '動揺度', 'どうようど',
      'スキップ', '欠損',
      // 位置の組み合わせ（よく使われるパターン）
      '近心頬側', '中央頬側', '遠心頬側',
      '近心舌側', '中央舌側', '遠心舌側',
      '近心口蓋側', '中央口蓋側', '遠心口蓋側',
      // 歯番号 (FDI表記)
      ...Array.from({ length: 8 }, (_, i) => `${i + 11}`),
      ...Array.from({ length: 8 }, (_, i) => `${i + 21}`),
      ...Array.from({ length: 8 }, (_, i) => `${i + 31}`),
      ...Array.from({ length: 8 }, (_, i) => `${i + 41}`),
      // 数値（0-15まで全バリエーション）
      '0', 'ゼロ', 'ぜろ', '零',
      '1', 'いち', 'イチ', '一',
      '2', 'に', 'ニ', '二',
      '3', 'さん', 'サン', '三',
      '4', 'よん', 'ヨン', 'し', 'シ', '四',
      '5', 'ご', 'ゴ', '五',
      '6', 'ろく', 'ロク', '六',
      '7', 'なな', 'ナナ', 'しち', 'シチ', '七',
      '8', 'はち', 'ハチ', '八',
      '9', 'きゅう', 'キュウ', 'く', 'ク', '九',
      '10', 'じゅう', 'ジュウ', '十',
      '11', 'じゅういち', 'ジュウイチ', '十一',
      '12', 'じゅうに', 'ジュウニ', '十二',
      '13', 'じゅうさん', 'ジュウサン', '十三',
      '14', 'じゅうよん', 'ジュウヨン', '十四',
      '15', 'じゅうご', 'ジュウゴ', '十五',
      // コマンド
      'ポケット', 'PPD', 'ピーピーディー',
      '戻る', 'もどる', '訂正',
      // 区切りとして使われる可能性のある言葉
      '次', 'つぎ', '続き', 'つづき'
    ]

    const allPhrases = [...new Set([...periodontalPhrases, ...customPhrases])]

    // 音声の推定長さを計算（WebM/Opus 48kHz mono ≈ 4KB/s）
    const estimatedDurationSec = audioBuffer.length / 4000
    const isLongAudio = estimatedDurationSec > 50 // 50秒以上は長時間認識APIを使用

    console.log(`⏱️ 推定音声長: ${Math.round(estimatedDurationSec)}秒 → ${isLongAudio ? 'longRunningRecognize' : 'recognize'} を使用`)

    // 認識設定（長い音声は latest_long、短い音声は latest_short）
    const config: speech.protos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'ja-JP',
      enableAutomaticPunctuation: true,
      model: isLongAudio ? 'latest_long' : 'latest_short',
      useEnhanced: true,
      maxAlternatives: 3,
      enableWordConfidence: true,
      speechContexts: allPhrases.length > 0 ? [
        {
          phrases: allPhrases.slice(0, 500),
          boost: 15,
        },
      ] : [],
      profanityFilter: false,
    }

    const audio = {
      content: audioBuffer.toString('base64'),
    }

    const recognitionRequest = {
      config,
      audio,
    }

    // 音声認識を実行
    let results: any[] | null | undefined
    let totalBilledTime: any
    let requestId: any

    if (isLongAudio) {
      // 60秒超の音声: 非同期API（longRunningRecognize）を使用
      console.log('📡 longRunningRecognize API呼び出し開始...')
      const [operation] = await client.longRunningRecognize(recognitionRequest)
      console.log('⏳ 処理中... operationを待機')
      const [longResponse] = await operation.promise()
      results = longResponse.results
      totalBilledTime = longResponse.totalBilledTime
      requestId = longResponse.requestId
      console.log('✅ longRunningRecognize完了')
    } else {
      // 60秒以下の音声: 同期API（recognize）を使用
      console.log('📡 recognize API呼び出し開始...')
      const [shortResponse] = await client.recognize(recognitionRequest)
      results = shortResponse.results
      totalBilledTime = shortResponse.totalBilledTime
      requestId = shortResponse.requestId
      console.log('✅ recognize完了')
    }

    if (!results || results.length === 0) {
      console.warn('⚠️ 認識結果が空です（無音または認識不可能な音声）')
      return NextResponse.json({
        transcript: '',
        confidence: 0,
        languageCode: 'ja-JP',
        alternatives: [],
        debug: {
          audioSize: audioBuffer.length,
          estimatedDurationSec: Math.round(estimatedDurationSec),
          resultsCount: 0,
          totalBilledTime,
          requestId,
        }
      })
    }

    console.log('🎯 認識成功:', results.length, '個の結果')

    const transcription = results
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim()

    const confidence = results[0]?.alternatives?.[0]?.confidence || 0

    // 代替候補も返す
    const alternatives = results[0]?.alternatives?.slice(1, 4).map(alt => ({
      transcript: alt.transcript || '',
      confidence: alt.confidence || 0,
    })) || []

    return NextResponse.json({
      transcript: transcription,
      confidence,
      languageCode: 'ja-JP',
      alternatives,
    })
  } catch (error) {
    console.error('Speech-to-Text API エラー:', error)
    return NextResponse.json(
      {
        error: '音声認識に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
