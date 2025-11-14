import { MOCK_MODE } from '@/lib/utils/mock-mode'

export type DocumentType =
  | '歯科疾患管理料'
  | '口腔機能低下症'
  | '口腔機能発達不全症'
  | '歯科衛生士実地指導'
  | '診療情報提供書'

export interface MedicalDocument {
  id: string
  clinic_id: string
  patient_id: string
  document_type: DocumentType
  document_subtype?: string
  title: string
  content: Record<string, any>
  created_by?: string
  created_at: string
  updated_at: string
  // 関連データ
  creator?: {
    id: string
    name: string
  }
}

export interface CreateMedicalDocumentParams {
  clinic_id: string
  patient_id: string
  document_type: DocumentType
  document_subtype?: string
  title: string
  content: Record<string, any>
  created_by?: string
}

export interface UpdateMedicalDocumentParams {
  title?: string
  content?: Record<string, any>
  document_subtype?: string
}

// モックモード用のストレージ
class MedicalDocumentStorage {
  private static instance: MedicalDocumentStorage
  private storageKey = 'medical_documents'

  private constructor() {}

  public static getInstance(): MedicalDocumentStorage {
    if (!MedicalDocumentStorage.instance) {
      MedicalDocumentStorage.instance = new MedicalDocumentStorage()
    }
    return MedicalDocumentStorage.instance
  }

  private getFromStorage(): MedicalDocument[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('ストレージからの読み込みエラー:', error)
      return []
    }
  }

  private saveToStorage(documents: MedicalDocument[]): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(documents))
    } catch (error) {
      console.error('ストレージへの保存エラー:', error)
    }
  }

  public getByPatientId(patientId: string): MedicalDocument[] {
    const documents = this.getFromStorage()
    return documents
      .filter(doc => doc.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  public getById(id: string): MedicalDocument | null {
    const documents = this.getFromStorage()
    return documents.find(doc => doc.id === id) || null
  }

  public add(document: MedicalDocument): void {
    const documents = this.getFromStorage()
    documents.push(document)
    this.saveToStorage(documents)
    console.log('文書を追加:', document)
  }

  public update(id: string, updates: Partial<MedicalDocument>): MedicalDocument | null {
    const documents = this.getFromStorage()
    const index = documents.findIndex(doc => doc.id === id)

    if (index === -1) return null

    documents[index] = {
      ...documents[index],
      ...updates,
      updated_at: new Date().toISOString()
    }

    this.saveToStorage(documents)
    return documents[index]
  }

  public delete(id: string): boolean {
    const documents = this.getFromStorage()
    const filtered = documents.filter(doc => doc.id !== id)

    if (filtered.length === documents.length) return false

    this.saveToStorage(filtered)
    return true
  }
}

const documentStorage = MedicalDocumentStorage.getInstance()

/**
 * 患者の提供文書一覧を取得
 */
export async function getMedicalDocuments(patientId: string): Promise<MedicalDocument[]> {
  console.log('getMedicalDocuments呼び出し:', { patientId, MOCK_MODE })

  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 提供文書をlocalStorageから取得')
    return documentStorage.getByPatientId(patientId)
  }

  try {
    const response = await fetch(`/api/medical-documents?patient_id=${patientId}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('提供文書の取得エラー:', errorData)
      throw new Error(errorData.error || '提供文書の取得に失敗しました')
    }

    const data = await response.json()
    return data || []
  } catch (error) {
    console.error('提供文書の取得に失敗:', error)
    throw error
  }
}

/**
 * 文書IDで提供文書を取得
 */
export async function getMedicalDocumentById(documentId: string): Promise<MedicalDocument | null> {
  console.log('getMedicalDocumentById呼び出し:', { documentId, MOCK_MODE })

  // モックモードの場合はlocalStorageから取得
  if (MOCK_MODE) {
    console.log('モックモード: 提供文書をlocalStorageから取得')
    return documentStorage.getById(documentId)
  }

  try {
    const response = await fetch(`/api/medical-documents/${documentId}`)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('提供文書の取得エラー:', errorData)
      throw new Error(errorData.error || '提供文書の取得に失敗しました')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('提供文書の取得に失敗:', error)
    throw error
  }
}

/**
 * 提供文書を作成
 */
export async function createMedicalDocument(
  params: CreateMedicalDocumentParams
): Promise<MedicalDocument> {
  console.log('createMedicalDocument呼び出し:', { params, MOCK_MODE })

  // モックモードの場合はlocalStorageに保存
  if (MOCK_MODE) {
    console.log('モックモード: 提供文書を作成してlocalStorageに保存')

    const document: MedicalDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: params.created_by
        ? {
            id: params.created_by,
            name: 'システム'
          }
        : undefined
    }

    documentStorage.add(document)
    return document
  }

  try {
    console.log('Calling server-side API to create medical document')

    const response = await fetch('/api/medical-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('提供文書の作成エラー:', errorData)
      throw new Error(errorData.error || '提供文書の作成に失敗しました')
    }

    const data = await response.json()
    console.log('Medical document created successfully:', data.id)
    return data
  } catch (error) {
    console.error('提供文書の作成に失敗:', error)
    throw error
  }
}

/**
 * 提供文書を更新
 */
export async function updateMedicalDocument(
  documentId: string,
  params: UpdateMedicalDocumentParams
): Promise<MedicalDocument> {
  console.log('updateMedicalDocument呼び出し:', { documentId, params, MOCK_MODE })

  // モックモードの場合はlocalStorageを更新
  if (MOCK_MODE) {
    console.log('モックモード: 提供文書を更新')
    const updated = documentStorage.update(documentId, params)

    if (!updated) {
      throw new Error('文書が見つかりません')
    }

    return updated
  }

  try {
    console.log('Calling server-side API to update medical document')

    const response = await fetch(`/api/medical-documents/${documentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('提供文書の更新エラー:', errorData)
      throw new Error(errorData.error || '提供文書の更新に失敗しました')
    }

    const data = await response.json()
    console.log('Medical document updated successfully:', data.id)
    return data
  } catch (error) {
    console.error('提供文書の更新に失敗:', error)
    throw error
  }
}

/**
 * 提供文書を削除
 */
export async function deleteMedicalDocument(documentId: string): Promise<void> {
  console.log('deleteMedicalDocument呼び出し:', { documentId, MOCK_MODE })

  // モックモードの場合はlocalStorageから削除
  if (MOCK_MODE) {
    console.log('モックモード: 提供文書を削除')
    const deleted = documentStorage.delete(documentId)

    if (!deleted) {
      throw new Error('文書が見つかりません')
    }

    return
  }

  try {
    console.log('Calling server-side API to delete medical document')

    const response = await fetch(`/api/medical-documents/${documentId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('提供文書の削除エラー:', errorData)
      throw new Error(errorData.error || '提供文書の削除に失敗しました')
    }

    console.log('Medical document deleted successfully:', documentId)
  } catch (error) {
    console.error('提供文書の削除に失敗:', error)
    throw error
  }
}
