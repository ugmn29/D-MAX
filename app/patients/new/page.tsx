'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { PatientForm } from '@/components/patients/patient-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createPatient } from '@/lib/api/patients'

// 仮のクリニックID（後で認証システムから取得）
const DEMO_CLINIC_ID = '11111111-1111-1111-1111-111111111111'

export default function NewPatientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true)

    try {
      // 住所フィールドを結合
      const addressParts = [
        formData.postal_code,
        formData.prefecture,
        formData.city,
        formData.address_line
      ].filter(Boolean) // 空でない要素のみ

      const address = addressParts.join(' ')

      // Supabaseに患者データを保存（本登録として作成）
      await createPatient(DEMO_CLINIC_ID, {
        ...formData,
        address, // 結合された住所
        is_registered: true  // 本登録として作成
      })

      // 成功したら患者一覧に戻る
      router.push('/patients')
    } catch (error) {
      console.error('患者登録エラー:', error)
      alert('患者の登録に失敗しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/patients')
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center space-x-4">
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              患者一覧に戻る
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserPlus className="w-6 h-6 mr-2" />
              新規患者登録
            </h1>
            <p className="text-gray-600">患者の基本情報を入力してください</p>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                登録について
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>* マークの付いた項目は必須入力です</li>
                  <li>電話番号と氏名は最低限必要な情報です</li>
                  <li>詳細情報は後から編集・追加できます</li>
                  <li>診察券番号は自動で採番されます</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* フォーム */}
        {isSubmitting ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-dmax-primary"></div>
            <p className="mt-4 text-gray-600">患者情報を登録しています...</p>
          </div>
        ) : (
          <PatientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={false}
          />
        )}
      </div>
    </MainLayout>
  )
}