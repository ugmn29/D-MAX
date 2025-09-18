'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Edit,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  Heart,
  Shield,
  FileText,
  Clock
} from 'lucide-react'
import Link from 'next/link'

// 仮の患者詳細データ
const mockPatientDetail = {
  id: '1',
  patient_number: 1,
  last_name: '田中',
  first_name: '太郎',
  last_name_kana: 'タナカ',
  first_name_kana: 'タロウ',
  birth_date: '1980-05-15',
  gender: 'male' as const,
  phone: '090-1234-5678',
  email: 'tanaka@example.com',
  postal_code: '150-0001',
  prefecture: '東京都',
  city: '渋谷区',
  address_line: '神宮前1-1-1',
  allergies: '麻酔アレルギー、ペニシリンアレルギー',
  medical_history: '高血圧症（投薬治療中）、糖尿病（経過観察）',
  is_registered: true,
  created_at: '2024-01-15T10:00:00Z',

  // 追加の詳細情報
  recent_appointments: [
    {
      id: '1',
      date: '2024-02-15',
      time: '10:00',
      menu: 'う蝕治療',
      staff: '田中先生',
      status: '終了'
    },
    {
      id: '2',
      date: '2024-01-20',
      time: '14:30',
      menu: '定期検診',
      staff: '佐藤DH',
      status: '終了'
    },
    {
      id: '3',
      date: '2024-02-25',
      time: '11:00',
      menu: 'クリーニング',
      staff: '田中先生',
      status: '予約済み'
    }
  ],

  family_members: [
    {
      id: '2',
      name: '田中 花子',
      relation: '配偶者',
      patient_number: 15
    },
    {
      id: '3',
      name: '田中 一郎',
      relation: '息子',
      patient_number: 28
    }
  ]
}

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient] = useState(mockPatientDetail) // 後でSupabaseから取得

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/patients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                患者一覧に戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {patient.last_name} {patient.first_name}
              </h1>
              <p className="text-gray-600">
                診察券番号: {patient.patient_number.toString().padStart(6, '0')} |
                {calculateAge(patient.birth_date)}歳 |
                {patient.gender === 'male' ? '男性' : patient.gender === 'female' ? '女性' : 'その他'}
              </p>
            </div>
          </div>
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            編集
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 基本情報 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  基本情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">氏名</label>
                    <p className="text-gray-900 font-medium">
                      {patient.last_name} {patient.first_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">フリガナ</label>
                    <p className="text-gray-900">
                      {patient.last_name_kana} {patient.first_name_kana}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">生年月日</label>
                    <p className="text-gray-900">
                      {new Date(patient.birth_date).toLocaleDateString('ja-JP')}
                      ({calculateAge(patient.birth_date)}歳)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">性別</label>
                    <p className="text-gray-900">
                      {patient.gender === 'male' ? '男性' :
                       patient.gender === 'female' ? '女性' : 'その他'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 連絡先情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  連絡先情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 font-mono">{patient.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900">{patient.email || '未登録'}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-gray-900">
                      〒{patient.postal_code}
                    </p>
                    <p className="text-gray-900">
                      {patient.prefecture}{patient.city}{patient.address_line}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 医療情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  医療情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    アレルギー
                  </label>
                  <p className="text-gray-900 mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                    {patient.allergies || '特記事項なし'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">既往歴</label>
                  <p className="text-gray-900 mt-1 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    {patient.medical_history || '特記事項なし'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 診療履歴 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  最近の診療履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.recent_appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('ja-JP', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">{appointment.time}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.menu}</p>
                          <p className="text-sm text-gray-600">{appointment.staff}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === '終了'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム: サイドバー */}
          <div className="space-y-6">
            {/* ステータス */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">患者ステータス</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">登録状態</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      patient.is_registered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patient.is_registered ? '本登録' : '仮登録'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">登録日</span>
                    <span className="text-gray-900 text-sm">
                      {new Date(patient.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 家族連携 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">家族連携</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patient.family_members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.relation}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        #{member.patient_number.toString().padStart(6, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  新規予約作成
                </Button>
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  診療記録を見る
                </Button>
                <Button className="w-full" variant="outline">
                  <Clock className="w-4 h-4 mr-2" />
                  履歴を表示
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}