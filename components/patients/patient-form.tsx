'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, Phone, MapPin, Heart, Save, X } from 'lucide-react'

interface PatientFormData {
  last_name: string
  first_name: string
  last_name_kana: string
  first_name_kana: string
  birth_date: string
  gender: 'male' | 'female' | 'other' | ''
  phone: string
  email: string
  postal_code: string
  prefecture: string
  city: string
  address_line: string
  allergies: string
  medical_history: string
}

interface PatientFormProps {
  initialData?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => void
  onCancel: () => void
  isEditing?: boolean
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export function PatientForm({ initialData, onSubmit, onCancel, isEditing = false }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    last_name: '',
    first_name: '',
    last_name_kana: '',
    first_name_kana: '',
    birth_date: '',
    gender: '',
    phone: '',
    email: '',
    postal_code: '',
    prefecture: '',
    city: '',
    address_line: '',
    allergies: '',
    medical_history: '',
    ...initialData
  })

  const [errors, setErrors] = useState<Partial<PatientFormData>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<PatientFormData> = {}

    if (!formData.last_name.trim()) {
      newErrors.last_name = '姓を入力してください'
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = '名を入力してください'
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号を入力してください'
    } else if (!/^(\d{2,4}-?\d{2,4}-?\d{4}|\d{10,11})$/.test(formData.phone.replace(/[^\d-]/g, ''))) {
      newErrors.phone = '正しい電話番号を入力してください'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleInputChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="last_name">姓 *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="田中"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="first_name">名 *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="太郎"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_name_kana">セイ</Label>
              <Input
                id="last_name_kana"
                value={formData.last_name_kana}
                onChange={(e) => handleInputChange('last_name_kana', e.target.value)}
                placeholder="タナカ"
              />
            </div>
            <div>
              <Label htmlFor="first_name_kana">メイ</Label>
              <Input
                id="first_name_kana"
                value={formData.first_name_kana}
                onChange={(e) => handleInputChange('first_name_kana', e.target.value)}
                placeholder="タロウ"
              />
            </div>
            <div>
              <Label htmlFor="birth_date">生年月日</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleInputChange('birth_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender">性別</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="性別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">電話番号 *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="090-1234-5678"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@email.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 住所情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            住所情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="postal_code">郵便番号</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                placeholder="150-0001"
              />
            </div>
            <div>
              <Label htmlFor="prefecture">都道府県</Label>
              <Select value={formData.prefecture} onValueChange={(value) => handleInputChange('prefecture', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((prefecture) => (
                    <SelectItem key={prefecture} value={prefecture}>
                      {prefecture}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">市区町村</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="渋谷区"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address_line">住所</Label>
            <Input
              id="address_line"
              value={formData.address_line}
              onChange={(e) => handleInputChange('address_line', e.target.value)}
              placeholder="神宮前1-1-1"
            />
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
            <Label htmlFor="allergies">アレルギー</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleInputChange('allergies', e.target.value)}
              placeholder="薬物アレルギー、食物アレルギーなど"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="medical_history">既往歴</Label>
            <Textarea
              id="medical_history"
              value={formData.medical_history}
              onChange={(e) => handleInputChange('medical_history', e.target.value)}
              placeholder="高血圧、糖尿病など"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          キャンセル
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {isEditing ? '更新' : '保存'}
        </Button>
      </div>
    </form>
  )
}