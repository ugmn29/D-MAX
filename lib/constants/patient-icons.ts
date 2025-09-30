import {
  User,
  AlertCircle,
  MessageSquare,
  Heart,
  Zap,
  Receipt,
  Accessibility,
  Frown,
  Star,
  Car,
  DollarSign,
  FileText,
  HelpCircle,
  Calendar
} from 'lucide-react'

export interface PatientIcon {
  id: string
  icon: any
  title: string
  enabled: boolean
}

// アイコンマスターデータ
export const PATIENT_ICONS: PatientIcon[] = [
  { id: 'child', icon: User, title: 'お子さん', enabled: true },
  { id: 'no_contact', icon: AlertCircle, title: '連絡いらない・しない', enabled: true },
  { id: 'long_talk', icon: MessageSquare, title: 'お話長め', enabled: true },
  { id: 'pregnant', icon: Heart, title: '妊娠・授乳中', enabled: true },
  { id: 'implant', icon: Zap, title: 'インプラント', enabled: true },
  { id: 'no_receipt', icon: Receipt, title: '領収書不要', enabled: true },
  { id: 'handicap', icon: Accessibility, title: 'ハンディキャップ有り', enabled: true },
  { id: 'anxious', icon: Frown, title: '心配・恐怖心あり', enabled: true },
  { id: 'review_requested', icon: Star, title: 'ロコミお願い済', enabled: true },
  { id: 'parking', icon: Car, title: '駐車券利用する', enabled: true },
  { id: 'taxi', icon: Car, title: 'タクシーを呼ばれる方', enabled: true },
  { id: 'accompanied', icon: User, title: '付き添い者あり', enabled: true },
  { id: 'caution', icon: AlertCircle, title: '要注意!', enabled: true },
  { id: 'money_caution', icon: DollarSign, title: 'お金関係注意!', enabled: true },
  { id: 'cancellation_policy', icon: FileText, title: 'キャンセルポリシーお渡し済み', enabled: true },
  { id: 'assistance_required', icon: HelpCircle, title: '要介助必要', enabled: true },
  { id: 'referrer', icon: User, title: '紹介者', enabled: true },
  { id: 'time_specified', icon: Calendar, title: '時間指定あり', enabled: true }
]

// アイコンIDから情報を取得
export function getPatientIcon(iconId: string): PatientIcon | undefined {
  return PATIENT_ICONS.find(icon => icon.id === iconId)
}

// 有効なアイコンのみを取得
export function getEnabledPatientIcons(): PatientIcon[] {
  return PATIENT_ICONS.filter(icon => icon.enabled)
}
