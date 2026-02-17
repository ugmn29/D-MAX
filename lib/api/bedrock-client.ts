/**
 * AWS Bedrock Runtimeクライアント
 *
 * シングルトンパターンでBedrockRuntimeClientを管理
 * CRIS（東京+大阪の国内推論）で3省2ガイドライン準拠
 */

import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime'

// グローバル型定義（開発環境でのホットリロード対策）
declare global {
  var bedrockClient: BedrockRuntimeClient | undefined
}

/**
 * BedrockRuntimeClientのシングルトンインスタンスを作成
 */
function createBedrockClient(): BedrockRuntimeClient {
  if (global.bedrockClient) {
    return global.bedrockClient
  }

  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    requestHandler: {
      requestTimeout: 30000, // 30秒タイムアウト
    },
  })

  // 開発環境ではグローバルに保存（ホットリロード対策）
  if (process.env.NODE_ENV !== 'production') {
    global.bedrockClient = client
  }

  return client
}

/**
 * BedrockRuntimeClientのシングルトンインスタンス
 */
export const bedrockClient = createBedrockClient()

/**
 * BedrockRuntimeClientを取得する関数
 */
export function getBedrockClient(): BedrockRuntimeClient {
  return bedrockClient
}
