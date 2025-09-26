import { VertexAI } from '@google-cloud/vertexai'

// Vertex AI クライアント
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID,
  location: process.env.GOOGLE_CLOUD_REGION || 'asia-northeast1',
})

const model = vertexAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export interface SummaryTemplate {
  id: string
  name: string
  prompt: string
  description: string
}

export interface SummaryResult {
  summary: string
  template: string
  confidence: number
  wordCount: number
}

/**
 * 要約テンプレートの定義
 */
export const summaryTemplates: SummaryTemplate[] = [
  {
    id: 'soap',
    name: 'SOAP形式',
    description: '標準的な医療記録形式',
    prompt: `以下の会話をSOAP形式で要約してください：

主訴（S）: 患者の主な訴えや症状
客観的所見（O）: 医師が観察した事実、検査結果、バイタルサインなど
評価（A）: 医師の判断、診断、鑑別診断
計画（P）: 今後の治療計画、検査予定、薬剤処方など

会話内容：
{transcription}

注意事項：
- 医療用語は正確に使用してください
- 患者のプライバシーに配慮してください
- 具体的な数値や時間は正確に記録してください`
  },
  {
    id: 'simple',
    name: '簡単要約',
    description: '要点のみを簡潔にまとめた要約',
    prompt: `以下の会話を簡潔に要約してください：

- 主な症状・訴え
- 診断・判断
- 処置・治療内容
- 注意事項・禁忌
- 次回予定

会話内容：
{transcription}

注意事項：
- 重要な情報のみを抽出してください
- 専門用語は分かりやすく説明してください
- 患者の状態変化を明確に記録してください`
  },
  {
    id: 'detailed',
    name: '詳細要約',
    description: '包括的で詳細な医療記録',
    prompt: `以下の会話を詳細に要約してください：

## 主訴・症状
- 患者の主な訴え
- 症状の詳細（発症時期、程度、経過など）
- 随伴症状

## 診断・評価
- 診断名・鑑別診断
- 診断根拠
- 重症度評価

## 処置・治療
- 実施した処置
- 処方薬剤（用量、用法、期間）
- 検査指示

## 注意事項・禁忌
- 薬剤の副作用・相互作用
- 生活指導
- 緊急時の対応

## 次回計画
- 再診予定
- 検査予定
- 治療計画

## その他
- 重要な情報
- 家族への説明内容
- 患者の理解度

会話内容：
{transcription}

注意事項：
- 医療記録として適切な詳細レベルで記録してください
- 法的要件を満たす記録として作成してください
- 他の医療従事者が理解できる内容にしてください`
  }
]

/**
 * テキストを要約する
 * @param text 要約するテキスト
 * @param templateId 使用するテンプレートID
 * @returns 要約結果
 */
export async function summarizeText(
  text: string,
  templateId: string = 'soap'
): Promise<SummaryResult> {
  try {
    const template = summaryTemplates.find(t => t.id === templateId)
    if (!template) {
      throw new Error(`テンプレート '${templateId}' が見つかりません`)
    }

    if (!text.trim()) {
      throw new Error('要約するテキストが空です')
    }

    // テンプレートのプロンプトにテキストを挿入
    const prompt = template.prompt.replace('{transcription}', text)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const summary = response.text()

    return {
      summary,
      template: template.name,
      confidence: 0.85, // 実際の実装では信頼度を計算
      wordCount: summary.length
    }
  } catch (error) {
    console.error('テキスト要約エラー:', error)
    throw new Error(`テキスト要約に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 複数のテンプレートで要約を生成
 * @param text 要約するテキスト
 * @param templateIds 使用するテンプレートIDの配列
 * @returns 要約結果の配列
 */
export async function summarizeWithMultipleTemplates(
  text: string,
  templateIds: string[] = ['soap', 'simple', 'detailed']
): Promise<SummaryResult[]> {
  try {
    const promises = templateIds.map(templateId => 
      summarizeText(text, templateId)
    )
    
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    console.error('複数テンプレート要約エラー:', error)
    throw new Error(`複数テンプレート要約に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 要約の品質を評価する
 * @param summary 要約テキスト
 * @param originalText 元のテキスト
 * @returns 品質スコア（0-1）
 */
export function evaluateSummaryQuality(
  summary: string,
  originalText: string
): number {
  // 基本的な品質評価指標
  const summaryLength = summary.length
  const originalLength = originalText.length
  const compressionRatio = summaryLength / originalLength
  
  // 適切な圧縮率（0.1-0.5）を評価
  const compressionScore = compressionRatio >= 0.1 && compressionRatio <= 0.5 ? 1 : 0.5
  
  // 医療用語の含有率を評価
  const medicalTerms = ['症状', '診断', '処置', '治療', '検査', '薬剤', '副作用']
  const medicalTermCount = medicalTerms.filter(term => summary.includes(term)).length
  const medicalTermScore = Math.min(medicalTermCount / medicalTerms.length, 1)
  
  // 総合スコア
  const overallScore = (compressionScore + medicalTermScore) / 2
  
  return Math.min(Math.max(overallScore, 0), 1)
}

/**
 * 要約テンプレートを取得
 * @returns 要約テンプレートの配列
 */
export function getSummaryTemplates(): SummaryTemplate[] {
  return summaryTemplates
}

/**
 * 特定のテンプレートを取得
 * @param templateId テンプレートID
 * @returns テンプレート情報
 */
export function getSummaryTemplate(templateId: string): SummaryTemplate | undefined {
  return summaryTemplates.find(t => t.id === templateId)
}
