"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { getPatients, getPatientLinkStatus, linkPatientToQuestionnaire, unlinkPatientFromQuestionnaire } from "@/lib/api/patients";
import {
  getQuestionnaires,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  Questionnaire,
  QuestionnaireQuestion
} from "@/lib/api/questionnaires";
import { QuestionnaireForm } from "@/components/forms/questionnaire-form";
import { PatientForm } from "@/components/patients/patient-form";
import { ShiftPatterns } from "@/components/shift/shift-patterns";
import { ShiftTable } from "@/components/shift/shift-table";
import { CalendarMiniPreview } from "@/components/calendar/calendar-mini-preview";
import {
  Settings,
  Building2,
  Calendar,
  Users,
  Stethoscope,
  MessageSquare,
  Globe,
  Bell,
  Database,
  BarChart3,
  Grid3X3,
  Edit,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
  ChevronLeft,
  Save,
  FolderOpen,
  X,
  Tag,
  Edit3,
  User,
  CheckCircle,
  AlertCircle,
  Heart,
  Zap,
  Receipt,
  Accessibility,
  Frown,
  GripVertical,
  Star,
  Car,
  DollarSign,
  FileText,
  HelpCircle,
  ExternalLink,
  Copy,
  Mail,
  MessageCircle,
  Info,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
  Upload,
  Link2,
  Check,
  Armchair,
  Dumbbell,
  Eye,
  RockingChair,
  Smartphone,
  Search,
  Phone,
  CreditCard,
  AlertTriangle,
  Gift,
  Shield,
} from "lucide-react";
import {
  updateClinicSettings,
  setClinicSetting,
  getClinicSettings,
} from "@/lib/api/clinic";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "@/lib/api/staff";
import {
  getStaffPositions,
  createStaffPosition,
  updateStaffPosition,
  deleteStaffPosition,
} from "@/lib/api/staff-positions";
import {
  getPatientNoteTypes,
  createPatientNoteType,
  updatePatientNoteType,
  deletePatientNoteType,
} from "@/lib/api/patient-note-types";
import {
  getCancelReasons,
  createCancelReason,
  updateCancelReason,
  deleteCancelReason,
} from "@/lib/api/cancel-reasons";
import {
  getMemoTemplates,
  createMemoTemplate,
  updateMemoTemplate,
  deleteMemoTemplate,
  MemoTemplate,
} from "@/lib/api/memo-templates";
import {
  initializeClinicStaffPositions,
  initializeClinicCancelReasons,
} from "@/lib/api/clinic-initialization";
import {
  getTreatmentMenus,
  createTreatmentMenu,
  updateTreatmentMenu,
  deleteTreatmentMenu,
} from "@/lib/api/treatment";
import { QuestionnaireEditModal } from "@/components/forms/questionnaire-edit-modal";
import { DocumentTemplatesManager } from "@/components/settings/document-templates-manager";
import {
  getUnits,
  createUnit, 
  updateUnit, 
  deleteUnit,
  getStaffUnitPriorities,
  createStaffUnitPriority,
  updateStaffUnitPriorities,
  updateStaffUnitPriority,
  deleteStaffUnitPriority,
  Unit,
  StaffUnitPriority,
  CreateUnitData,
  UpdateUnitData,
} from "@/lib/api/units";

// 仮のクリニックID
const DEMO_CLINIC_ID = "11111111-1111-1111-1111-111111111111";

const WEEKDAYS = [
  { id: "monday", name: "月曜日" },
  { id: "tuesday", name: "火曜日" },
  { id: "wednesday", name: "水曜日" },
  { id: "thursday", name: "木曜日" },
  { id: "friday", name: "金曜日" },
  { id: "saturday", name: "土曜日" },
  { id: "sunday", name: "日曜日" },
];

const TIME_SLOT_OPTIONS = [
  { value: 10, label: "10分" },
  { value: 15, label: "15分" },
  { value: 20, label: "20分" },
  { value: 30, label: "30分" },
  { value: 60, label: "60分" },
];

// アイコンマスターデータ
const ICON_MASTER_DATA = [
  { id: "child", icon: User, title: "お子さん", enabled: true },
  {
    id: "no_contact",
    icon: AlertCircle,
    title: "連絡いらない・しない",
    enabled: true,
  },
  { id: "long_talk", icon: MessageSquare, title: "お話長め", enabled: true },
  { id: "pregnant", icon: Heart, title: "妊娠・授乳中", enabled: true },
  { id: "implant", icon: Zap, title: "インプラント", enabled: true },
  { id: "no_receipt", icon: Receipt, title: "領収書不要", enabled: true },
  {
    id: "handicap",
    icon: Accessibility,
    title: "ハンディキャップ有り",
    enabled: true,
  },
  { id: "anxious", icon: Frown, title: "心配・恐怖心あり", enabled: true },
  {
    id: "review_requested",
    icon: Star,
    title: "ロコミお願い済",
    enabled: true,
  },
  { id: "parking", icon: Car, title: "駐車券利用する", enabled: true },
  {
    id: "money_caution",
    icon: DollarSign,
    title: "お金関係注意!",
    enabled: true,
  },
  {
    id: "cancellation_policy",
    icon: FileText,
    title: "キャンセルポリシーお渡し済み",
    enabled: true,
  },
  {
    id: "assistance_required",
    icon: HelpCircle,
    title: "要介助必要",
    enabled: true,
  },
  {
    id: "time_specified",
    icon: Calendar,
    title: "時間指定あり",
    enabled: true,
  },
  {
    id: "phone_contact",
    icon: Phone,
    title: "電話連絡希望",
    enabled: true,
  },
  {
    id: "payment_plan",
    icon: CreditCard,
    title: "分割払い",
    enabled: true,
  },
  {
    id: "allergy",
    icon: AlertTriangle,
    title: "アレルギー有り",
    enabled: true,
  },
  {
    id: "gift_certificate",
    icon: Gift,
    title: "ギフト券利用",
    enabled: true,
  },
  {
    id: "insurance",
    icon: Shield,
    title: "保険適用",
    enabled: true,
  },
];

const DISPLAY_ITEMS = [
  {
    id: "reservation_time",
    name: "予約時間",
    description: "予約の開始・終了時間を表示",
  },
  {
    id: "medical_card_number",
    name: "診察券番号",
    description: "患者の診察券番号を表示",
  },
  { id: "name", name: "名前", description: "患者の氏名を表示" },
  { id: "furigana", name: "フリガナ", description: "患者のフリガナを表示" },
  { id: "age", name: "年齢(月齢)", description: "患者の年齢または月齢を表示" },
  {
    id: "patient_icon",
    name: "患者アイコン",
    description: "患者の特記事項アイコンを表示",
  },
  { id: "patient_rank", name: "患者ランク", description: "患者のランクを表示" },
  {
    id: "patient_color",
    name: "患者カラー",
    description: "患者のカラーを表示",
  },
  {
    id: "treatment_content",
    name: "診療内容",
    description: "診療メニューの全階層を表示（大分類/中分類/詳細）",
  },
  {
    id: "staff",
    name: "担当者",
    description: "担当者の全階層を表示（主担当者/副担当者1/副担当者2）",
  },
];

const settingCategories = [
  {
    id: "clinic",
    name: "クリニック",
    icon: Building2,
    href: "/settings/clinic",
  },
  {
    id: "calendar",
    name: "カレンダー",
    icon: Calendar,
    href: "/settings/calendar",
  },
  {
    id: "treatment",
    name: "診療メニュー",
    icon: Stethoscope,
    href: "/settings/treatment",
  },
  {
    id: "questionnaire",
    name: "問診表",
    icon: MessageSquare,
    href: "/settings/questionnaire",
  },
  {
    id: "units",
    name: "ユニット",
    icon: Armchair,
    href: "/settings/units",
  },
  {
    id: "staff",
    name: "スタッフ",
    icon: Users,
    href: "/settings/staff",
  },
  {
    id: "shift",
    name: "シフト",
    icon: Clock,
    href: "/settings/shift",
  },
  {
    id: "web",
    name: "Web予約",
    icon: Globe,
  },
  {
    id: "notification",
    name: "通知",
    icon: Bell,
    href: "/settings/notification",
  },
  {
    id: "master",
    name: "マスタ",
    icon: Database,
  },
  {
    id: "training",
    name: "トレーニング",
    icon: Dumbbell,
    href: "/settings/training",
  },
  {
    id: "patient-list",
    name: "患者一覧",
    icon: Users,
  },
  {
    id: "data-import",
    name: "データ移行",
    icon: RefreshCw,
  },
];

interface CSVData {
  headers: string[]
  rows: any[]
  fileName: string
  rowCount: number
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    "clinic",
  );
  const [selectedMasterTab, setSelectedMasterTab] = useState("icons");
  const [selectedClinicTab, setSelectedClinicTab] = useState("info");
  const [selectedShiftTab, setSelectedShiftTab] = useState("table");
  const [selectedWebTab, setSelectedWebTab] = useState<'basic' | 'flow' | 'menu' | 'notification-flow'>('basic');
  const [previewPatientType, setPreviewPatientType] = useState<'new' | 'returning'>('new'); // 右側プレビューで選択された患者タイプ
  const [notificationTab, setNotificationTab] = useState("connection");
  const [richMenuSubTab, setRichMenuSubTab] = useState<"registered" | "unregistered">("registered"); // リッチメニューのサブタブ
  const [questionnaireTab, setQuestionnaireTab] = useState("basic");
  const [trainingSubTab, setTrainingSubTab] = useState('patients');
  const [useQuestionnaire, setUseQuestionnaire] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 未保存の変更管理（タブごとに個別管理）
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const isSavingRef = useRef(false); // 保存中フラグ

  // 各タブごとの初期データと初回ロードフラグ
  const initialClinicDataRef = useRef<any>(null);
  const initialCalendarDataRef = useRef<any>(null);
  const initialWebDataRef = useRef<any>(null);
  const initialStaffDataRef = useRef<any>(null);
  const initialMenuDataRef = useRef<any>(null);
  const initialUnitDataRef = useRef<any>(null);
  const initialNotificationDataRef = useRef<any>(null);

  const isClinicInitialLoadRef = useRef(true);
  const isCalendarInitialLoadRef = useRef(true);
  const isWebInitialLoadRef = useRef(true);
  const isStaffInitialLoadRef = useRef(true);
  const isMenuInitialLoadRef = useRef(true);
  const isUnitInitialLoadRef = useRef(true);
  const isNotificationInitialLoadRef = useRef(true);

  // 保存完了モーダル
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);

  // 削除確認モーダル関連
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingMenuId, setDeletingMenuId] = useState<string | null>(null);

  // 汎用確認モーダル
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 汎用通知モーダル（alert代替）
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState<{
    title: string;
    message: string;
    type?: "success" | "error" | "info";
  }>({
    title: "",
    message: "",
    type: "info",
  });

  // 連携状況管理の状態
  const [linkStatusData, setLinkStatusData] = useState({
    unlinkedPatients: [],
    linkedPatients: []
  });
  const [linkStatusFilters, setLinkStatusFilters] = useState({
    searchName: '',
    linkStatus: '',
    questionnaireId: ''
  });

  // 通知設定の状態
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: false,
      smtp_host: "",
      smtp_port: 587,
      smtp_user: "",
      smtp_password: "",
      from_address: "",
      from_name: "",
    },
    sms: {
      enabled: false,
      provider: "twilio",
      api_key: "",
      api_secret: "",
      sender_number: "",
    },
    line: {
      enabled: false,
      channel_id: "",
      channel_secret: "",
      channel_access_token: "",
      webhook_url:
        typeof window !== "undefined"
          ? `${window.location.origin}/api/line/webhook`
          : "",
      liff_id_initial_link: "",
      liff_id_qr_code: "",
      liff_id_family_register: "",
      liff_id_appointments: "",
      liff_id_web_booking: "",
    },
  });

  // テンプレート管理の状態
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    notification_type: "appointment_reminder",
    line_message: "",
    email_subject: "",
    email_message: "",
    sms_message: "",
    auto_send_enabled: false,
    auto_send_trigger: "manual" as "appointment_created" | "appointment_date" | "line_linked" | "manual",
    auto_send_timing_value: 3,
    auto_send_timing_unit: "days_before" as "days_before" | "days_after" | "immediate",
  });
  const [activeChannelTab, setActiveChannelTab] = useState<
    "line" | "email" | "sms"
  >("line");

  // 自動リマインドルールの状態
  const [autoReminderRule, setAutoReminderRule] = useState({
    enabled: false,
    intervals: [
      { sequence: 1, months: 3 },
      { sequence: 2, months: 3 },
      { sequence: 3, months: 6 },
    ],
    template_id: "",
  });

  // リッチメニューの状態（連携済みユーザー用）
  const [richMenuLayout, setRichMenuLayout] = useState<"fixed">("fixed"); // 固定5つレイアウト
  const [richMenuButtons, setRichMenuButtons] = useState([
    { id: 1, label: "QRコード", action: "url", url: "/qr-checkin", icon: "qr" },
    {
      id: 2,
      label: "予約確認",
      action: "url",
      url: "/booking",
      icon: "calendar",
    },
    { id: 3, label: "家族登録", action: "url", url: "/family", icon: "users" },
    {
      id: 4,
      label: "Webサイト",
      action: "url",
      url: "",
      icon: "web",
    },
    {
      id: 5,
      label: "お問合せ",
      action: "message",
      url: "お問い合わせ",
      icon: "chat",
    },
    {
      id: 6,
      label: "予約を取る",
      action: "url",
      url: "/appointment",
      icon: "booking",
    },
  ]);

  // リッチメニューの状態（未連携ユーザー用）
  const [unregisteredRichMenuButtons, setUnregisteredRichMenuButtons] = useState([
    { id: 1, label: "初回登録", action: "url", url: "/line-registration", icon: "user" },
    {
      id: 2,
      label: "Webサイト",
      action: "url",
      url: "",
      icon: "web",
    },
    {
      id: 3,
      label: "お問合せ",
      action: "message",
      url: "CONTACT_REQUEST",
      icon: "chat",
    },
  ]);

  const [editingButton, setEditingButton] = useState<number | null>(null);

  // 問診票の状態
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false);
  const [copiedQuestionnaireId, setCopiedQuestionnaireId] = useState<string | null>(null);
  const [previewQuestionnaireId, setPreviewQuestionnaireId] = useState<string | null>(null); // プレビュー表示する問診表ID
  const [newQuestionnaire, setNewQuestionnaire] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  // クリニック設定の状態
  const [clinicInfo, setClinicInfo] = useState({
    name: "",
    website_url: "",
    postal_code: "",
    address_line: "",
    phone: "",
  });
  const [businessHours, setBusinessHours] = useState<
    Record<
      string,
      {
        isOpen: boolean;
        start: string;
        end: string;
    timeSlots: Array<{
          id: string;
          start: string;
          end: string;
          period: "morning" | "afternoon";
        }>;
      }
    >
  >({});
  const [breakTimes, setBreakTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [timeSlotMinutes, setTimeSlotMinutes] = useState(15);
  const [holidays, setHolidays] = useState<string[]>([]); // 休診日は空で開始
  const treatmentMenusLoadedRef = useRef(false); // 診療メニューの初回読み込み完了フラグ

  // カレンダー設定の状態
  const [displayItems, setDisplayItems] = useState<string[]>([]);
  const [cellHeight, setCellHeight] = useState(40);

  // ユニット管理の状態
  const [unitsData, setUnitsData] = useState<any[]>([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  // 診療時間コピー用の状態
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceDay, setCopySourceDay] = useState<string>('');
  const [selectedDaysToCopy, setSelectedDaysToCopy] = useState<string[]>([]);

  // 患者一覧の状態
  const [patients, setPatients] = useState<any[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientFilter, setPatientFilter] = useState<'all' | 'registered' | 'temporary'>('all');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // データ移行の状態
  const [dataImportTab, setDataImportTab] = useState<'patients' | 'appointments' | 'history'>('patients');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string>('other');
  const [customSystemName, setCustomSystemName] = useState<string>('');
  const [numberHandling, setNumberHandling] = useState<'keep' | 'new'>('keep');
  const [startNumber, setStartNumber] = useState<number>(10000);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unitFormData, setUnitFormData] = useState({
    name: "",
    sort_order: 0,
    is_active: true,
  });

  // スタッフユニット優先順位の状態
  const [staffUnitPriorities, setStaffUnitPriorities] = useState<any[]>([]);
  const [draggedPriority, setDraggedPriority] = useState<any>(null);
  const [unitsActiveTab, setUnitsActiveTab] = useState<"units" | "priorities">(
    "units",
  );
  const [draggedUnitIndex, setDraggedUnitIndex] = useState<number | null>(null);

  // ユニット管理の関数
  const loadUnitsData = async () => {
    try {
      const data = await getUnits(DEMO_CLINIC_ID);
      setUnitsData(data);
    } catch (error) {
      console.error("ユニットデータ読み込みエラー:", error);
    }
  };

  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitFormData({
      name: "",
      sort_order: unitsData.length + 1,
      is_active: true,
    });
    setShowUnitModal(true);
  };

  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setUnitFormData({
      name: unit.name,
      sort_order: unit.sort_order,
      is_active: unit.is_active,
    });
    setShowUnitModal(true);
  };

  const handleSaveUnit = () => {
    // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
    if (editingUnit) {
      // 更新
      setUnitsData(
        unitsData.map((u) =>
          u.id === editingUnit.id ? { ...u, ...unitFormData } : u
        )
      );
    } else {
      // 新規作成（一時IDを使用）
      const newUnit = {
        id: `temp-unit-${Date.now()}`,
        clinic_id: DEMO_CLINIC_ID,
        ...unitFormData,
        created_at: new Date().toISOString(),
      };
      setUnitsData([...unitsData, newUnit]);
    }

    setShowUnitModal(false);
  };

  const handleDeleteUnit = (unit: any) => {
    showConfirm(
      `ユニット「${unit.name}」を削除しますか？`,
      () => {
        // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
        // 削除フラグを立てる
        setUnitsData(
          unitsData.map((u) =>
            u.id === unit.id ? { ...u, _deleted: true } : u
          )
        );
      },
      { isDanger: true, confirmText: "削除" }
    );
  };

  const handleDropUnit = (targetIndex: number) => {
    if (draggedUnitIndex === null || draggedUnitIndex === targetIndex) {
      setDraggedUnitIndex(null);
      return;
    }

    // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
    // ソート済みのユニット配列を作成
    const sortedUnits = [...unitsData].sort((a, b) => a.sort_order - b.sort_order);

    // 配列を並び替え
    const [draggedItem] = sortedUnits.splice(draggedUnitIndex, 1);
    sortedUnits.splice(targetIndex, 0, draggedItem);

    // 新しい並び順を設定
    const updatedUnits = sortedUnits.map((unit, index) => ({
      ...unit,
      sort_order: index + 1,
    }));

    // 状態を更新
    setUnitsData(updatedUnits);
    setDraggedUnitIndex(null);
  };

  // スタッフユニット優先順位の関数
  const loadStaffUnitPriorities = async () => {
    try {
      const priorities = await getStaffUnitPriorities(DEMO_CLINIC_ID);
      setStaffUnitPriorities(priorities);
    } catch (error) {
      console.error("スタッフユニット優先順位読み込みエラー:", error);
    }
  };

  const handleAddStaffToUnit = async (unitId: string, staffId: string) => {
    console.log("handleAddStaffToUnit called:", { unitId, staffId });
    try {
      // そのユニットの現在の最大優先順位を取得
      const unitPriorities = staffUnitPriorities.filter(
        (p) => p.unit_id === unitId,
      );
      const maxPriority = Math.max(
        0,
        ...unitPriorities.map((p) => p.priority_order),
      );

      console.log("Creating staff unit priority:", {
        clinicId: DEMO_CLINIC_ID,
        staff_id: staffId,
        unit_id: unitId,
        priority_order: maxPriority + 1,
      });
      
      const result = await createStaffUnitPriority(DEMO_CLINIC_ID, {
        staff_id: staffId,
        unit_id: unitId,
        priority_order: maxPriority + 1,
        is_active: true,
      });
      
      console.log("Staff unit priority created:", result);
      loadStaffUnitPriorities();
    } catch (error) {
      console.error("スタッフ割り当てエラー:", error);
      showAlert("スタッフの割り当てに失敗しました: " + error.message, "error");
    }
  };

  const handleDeletePriority = async (priorityId: string) => {
    try {
      await deleteStaffUnitPriority(DEMO_CLINIC_ID, priorityId);
      loadStaffUnitPriorities();
    } catch (error) {
      console.error("優先順位削除エラー:", error);
      showAlert("優先順位の削除に失敗しました", "error");
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragStart = (e: React.DragEvent, priority: any) => {
    setDraggedPriority(priority);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetPriority: any) => {
    e.preventDefault();
    
    if (!draggedPriority || draggedPriority.id === targetPriority.id) {
      setDraggedPriority(null);
      return;
    }

    // 同じユニット内でのみ並び替え可能
    if (draggedPriority.unit_id !== targetPriority.unit_id) {
      setDraggedPriority(null);
      return;
    }

    try {
      // 同じユニット内の優先順位を再計算
      const unitId = draggedPriority.unit_id;
      const unitPriorities = staffUnitPriorities
        .filter((p) => p.unit_id === unitId)
        .sort((a, b) => a.priority_order - b.priority_order);

      const draggedIndex = unitPriorities.findIndex(
        (p) => p.id === draggedPriority.id,
      );
      const targetIndex = unitPriorities.findIndex(
        (p) => p.id === targetPriority.id,
      );
      
      // 配列を並び替え
      const [draggedItem] = unitPriorities.splice(draggedIndex, 1);
      unitPriorities.splice(targetIndex, 0, draggedItem);
      
      // 新しい優先順位を設定
      const newPriorities = unitPriorities.map((p, index) => ({
        id: p.id,
        priority_order: index + 1,
      }));
      
      // 各優先順位を個別に更新
      for (const priority of newPriorities) {
        await updateStaffUnitPriority(DEMO_CLINIC_ID, priority.id, {
          priority_order: priority.priority_order,
        });
      }
      
      loadStaffUnitPriorities();
    } catch (error) {
      console.error("優先順位更新エラー:", error);
      showAlert("優先順位の更新に失敗しました", "error");
    } finally {
      setDraggedPriority(null);
    }
  };

  // 診療メニューの状態
  const [menus, setMenus] = useState<any[]>([]);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: "",
    level: 1,
    parent_id: "",
    standard_duration: 30,
    color: "#3B82F6",
    sort_order: 0,
  });

  // Web予約設定の状態
  const [webSettings, setWebSettings] = useState({
    isEnabled: false,
    reservationPeriod: 30,
    allowCurrentTime: true,
    openAllSlots: false,
    allowStaffSelection: true,
    webPageUrl: "",
    showCancelPolicy: false,
    cancelPolicyText: `◆当院のキャンセルポリシー◆

数ある歯科医院の中から〇〇歯科・矯正歯科をお選びいただき誠にありがとうございます。
当クリニックでは患者さま一人一人により良い医療を提供するため、30〜45分の長い治療時間を確保してお待ちしております。尚かつ適切な処置時間を確保するために予約制となっております。

予約時間に遅れての来院は十分な時間が確保できず、予定通りの処置が行えない場合があります。
また、予定時間に遅れが生じる事で、次に来院予定の患者さまに多大なご迷惑をおかけする恐れがありますので、予約時間前の来院にご協力をお願い致します。
止むを得ず遅れる場合や、体調不良などでキャンセルを希望される場合は早めのご連絡をお願い致します。
予約の際には確実に来院できる日にちと時間をご確認下さい。`,
    acceptNewPatient: true,      // 初診患者を受け付けるか
    acceptReturningPatient: true, // 再診患者を受け付けるか
    patientInfoFields: {
      phoneRequired: true,
      phoneEnabled: true,
      emailRequired: false,
      emailEnabled: true,
    },
    flow: {
      initialSelection: true,
      menuSelection: true,
      staffSelection: true,
      calendarDisplay: true,
      patientInfo: true,
      confirmation: true,
    },
  });

  // Web予約メニュー
  const [webBookingMenus, setWebBookingMenus] = useState<any[]>([]);

  // Web予約メニュー追加ダイアログ
  const [isAddWebMenuDialogOpen, setIsAddWebMenuDialogOpen] = useState(false);
  const [isEditWebMenuDialogOpen, setIsEditWebMenuDialogOpen] = useState(false);
  const [editingWebMenu, setEditingWebMenu] = useState<any>(null);
  
  // キャンセルポリシー編集ダイアログ
  const [isCancelPolicyDialogOpen, setIsCancelPolicyDialogOpen] =
    useState(false);
  const [tempCancelPolicyText, setTempCancelPolicyText] = useState("");

  // 患者情報フィールド設定ダイアログ
  const [isPatientInfoFieldsDialogOpen, setIsPatientInfoFieldsDialogOpen] =
    useState(false);
  const [tempPatientInfoFields, setTempPatientInfoFields] = useState({
    phoneRequired: true,
    phoneEnabled: true,
    emailRequired: false,
    emailEnabled: true,
  });
  
  type StaffAssignment = {
    staff_id: string;
    priority: number;
    is_required: boolean;
  };
  
  type BookingStep = {
    id: string;
    step_order: number;
    start_time: number;
    end_time: number;
    duration: number;
    type: "serial" | "parallel";
    description: string;
    staff_assignments: StaffAssignment[];
  };
  
  const [newWebMenu, setNewWebMenu] = useState({
    treatment_menu_id: "",
    treatment_menu_level2_id: "",
    treatment_menu_level3_id: "",
    display_name: "",
    duration: 30,
    steps: [] as BookingStep[],
    allow_new_patient: true,
    allow_returning: true,
  });

  // スタッフ管理の状態
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({
    name: "",
    name_kana: "",
    email: "",
    phone: "",
    role: "staff",
    position_id: "",
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // マスタ設定の状態
  const [staffPositions, setStaffPositions] = useState<any[]>([]);
  const [patientNoteTypes, setPatientNoteTypes] = useState<any[]>([]);
  const [cancelReasons, setCancelReasons] = useState<any[]>([]);
  const [memoTemplates, setMemoTemplates] = useState<MemoTemplate[]>([]);
  const [draggedTemplateIndex, setDraggedTemplateIndex] = useState<number | null>(null);
  const [iconMaster, setIconMaster] = useState(ICON_MASTER_DATA);
  const [editingIconId, setEditingIconId] = useState<string | null>(null);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showAddNoteType, setShowAddNoteType] = useState(false);
  const [showAddCancelReason, setShowAddCancelReason] = useState(false);
  const [showAddMemoTemplate, setShowAddMemoTemplate] = useState(false);
  const [showEditCancelReason, setShowEditCancelReason] = useState(false);
  const [editingCancelReason, setEditingCancelReason] = useState<any>(null);
  const [newPosition, setNewPosition] = useState({
    name: "",
    sort_order: 0,
    enabled: true,
  });
  const [newNoteType, setNewNoteType] = useState({
    name: "",
    description: "",
    sort_order: 0,
    is_active: true,
  });
  const [newCancelReason, setNewCancelReason] = useState({
    name: "",
    is_active: true,
  });
  const [newMemoTemplate, setNewMemoTemplate] = useState({
    name: "",
    is_active: true,
  });

  // デフォルトテキストの状態
  const [defaultTexts, setDefaultTexts] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [showAddDefaultTextModal, setShowAddDefaultTextModal] = useState(false);
  const [editingDefaultText, setEditingDefaultText] = useState<any>(null);
  const [newDefaultText, setNewDefaultText] = useState({
    title: "",
    content: "",
  });

  // 診療メニュー関連の状態
  const [treatmentMenus, setTreatmentMenus] = useState<any[]>([]);
  const [editingTreatmentMenu, setEditingTreatmentMenu] = useState<any>(null);
  const [showTreatmentAddForm, setShowTreatmentAddForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState("menu1");
  const [parentMenuForChild, setParentMenuForChild] = useState<any>(null); // 子メニュー作成用の親メニュー
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set()); // 展開されたメニューのID
  const [useParentColor, setUseParentColor] = useState(true); // 親の色を使用するかどうか
  const [newTreatmentMenu, setNewTreatmentMenu] = useState({
    name: "",
    level: 1,
    parent_id: "",
    standard_duration: 30,
    color: "#3B82F6",
    sort_order: 0,
  });

  const handleCategoryClick = (categoryId: string) => {
    // 編集中のデータがあるかチェック
    const hasEditingData =
      editingTemplate !== null ||
      editingUnit !== null ||
      editingWebMenu !== null ||
      editingStaff !== null ||
      editingCancelReason !== null ||
      editingDefaultText !== null ||
      editingTreatmentMenu !== null;

    if (hasUnsavedChanges || hasEditingData) {
      setPendingCategory(categoryId);
      setShowUnsavedWarning(true);
    } else {
      setSelectedCategory(categoryId);
    }
  };

  // 未保存の変更を破棄してページ遷移
  const discardChanges = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    // 全ての編集状態をリセット
    setEditingTemplate(null);
    setEditingUnit(null);
    setEditingWebMenu(null);
    setEditingStaff(null);
    setEditingCancelReason(null);
    setEditingDefaultText(null);
    setEditingTreatmentMenu(null);
    if (pendingCategory) {
      setSelectedCategory(pendingCategory);
      setPendingCategory(null);
    }
  };

  // ページ遷移をキャンセル
  const cancelNavigation = () => {
    setShowUnsavedWarning(false);
    setPendingCategory(null);
  };

  // CSV データ検証関数
  const validateCSVData = useCallback((data: CSVData) => {
    const errors: string[] = []
    const warnings: string[] = []

    // 必須フィールドのチェック（患者データの場合）
    const requiredFields = ['姓', '名', '生年月日']
    const missingFields = requiredFields.filter(field => !data.headers.includes(field))

    if (missingFields.length > 0) {
      errors.push(`必須フィールドが不足しています: ${missingFields.join(', ')}`)
    }

    // 患者番号フィールドの確認
    const patientNumberFields = ['患者番号', '診察券番号', 'ID', 'patient_number']
    const hasPatientNumber = patientNumberFields.some(field => data.headers.includes(field))

    if (!hasPatientNumber && numberHandling === 'keep') {
      warnings.push('患者番号フィールドが見つかりません。新規採番に変更することをお勧めします。')
    }

    // データの整合性チェック
    if (data.rows.length === 0) {
      errors.push('データが含まれていません')
    } else if (data.rows.length > 10000) {
      warnings.push(`データ件数が多いため、処理に時間がかかる可能性があります（${data.rowCount}件）`)
    }

    // 重複チェック（サンプル）
    const firstPatientNumberField = patientNumberFields.find(field => data.headers.includes(field))
    if (firstPatientNumberField) {
      const patientNumbers = data.rows.map(row => row[firstPatientNumberField]).filter(Boolean)
      const uniqueNumbers = new Set(patientNumbers)
      if (patientNumbers.length !== uniqueNumbers.size) {
        warnings.push('CSVファイル内に重複する患者番号が存在します')
      }
    }

    setValidationErrors(errors)
    setValidationWarnings(warnings)

    return { errors, warnings }
  }, [numberHandling])

  // ファイル処理関数
  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      showAlert('CSVファイルのみ対応しています', 'error')
      return
    }

    setIsProcessing(true)

    // 文字コード自動検出のためにArrayBufferとして読み込み
    const reader = new FileReader()

    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer

      // UTF-8として試行
      let text = new TextDecoder('utf-8').decode(arrayBuffer)

      // UTF-8でない場合はShift_JISとして試行
      if (text.includes('�')) {
        text = new TextDecoder('shift-jis').decode(arrayBuffer)
      }

      // CSVをパース
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            showAlert('CSVファイルにデータがありません', 'error')
            setIsProcessing(false)
            return
          }

          const parsedData: CSVData = {
            headers: results.meta.fields || [],
            rows: results.data,
            fileName: file.name,
            rowCount: results.data.length
          }

          setCsvData(parsedData)

          // データ検証を実行
          validateCSVData(parsedData)

          setIsProcessing(false)
        },
        error: (error) => {
          console.error('CSV解析エラー:', error)
          showAlert('CSVファイルの解析に失敗しました', 'error')
          setIsProcessing(false)
        }
      })
    }

    reader.onerror = () => {
      showAlert('ファイルの読み込みに失敗しました', 'error')
      setIsProcessing(false)
    }

    reader.readAsArrayBuffer(file)
  }, [validateCSVData])

  // CSVドラッグ&ドロップハンドラ
  const handleCsvDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleCsvDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleCsvDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  // ファイル選択ハンドラ
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  // ファイル削除ハンドラ
  const handleRemoveFile = useCallback(() => {
    setCsvData(null)
    setValidationErrors([])
    setValidationWarnings([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // デフォルトテキストの保存
  const saveDefaultTexts = (
    texts: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
      updatedAt: string;
    }>,
  ) => {
    setDefaultTexts(texts);
    localStorage.setItem("default_texts", JSON.stringify(texts));
  };

  // デフォルトテキストの追加
  const handleAddDefaultText = () => {
    if (!newDefaultText.title.trim() || !newDefaultText.content.trim()) {
      showAlert("タイトルと内容を入力してください", "error");
      return;
    }

    const newText = {
      id: Date.now().toString(),
      title: newDefaultText.title,
      content: newDefaultText.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTexts = [...defaultTexts, newText];
    saveDefaultTexts(updatedTexts);
    setNewDefaultText({ title: "", content: "" });
    setShowAddDefaultTextModal(false);
  };

  // デフォルトテキストの編集
  const handleEditDefaultText = (text: any) => {
    setEditingDefaultText(text);
    setNewDefaultText({ title: text.title, content: text.content });
    setShowAddDefaultTextModal(true);
  };

  // デフォルトテキストの編集保存
  const handleEditDefaultTextSave = () => {
    if (!newDefaultText.title.trim() || !newDefaultText.content.trim()) {
      showAlert("タイトルと内容を入力してください", "error");
      return;
    }

    const updatedTexts = defaultTexts.map((text) =>
      text.id === editingDefaultText?.id
        ? {
            ...text,
            title: newDefaultText.title,
            content: newDefaultText.content,
            updatedAt: new Date().toISOString(),
          }
        : text,
    );

    saveDefaultTexts(updatedTexts);
    setNewDefaultText({ title: "", content: "" });
    setEditingDefaultText(null);
    setShowAddDefaultTextModal(false);
  };

  // デフォルトテキストの削除
  const handleDeleteDefaultText = (id: string) => {
    showConfirm("このデフォルトテキストを削除しますか？", () => {
      const updatedTexts = defaultTexts.filter((text) => text.id !== id);
      saveDefaultTexts(updatedTexts);
    }, { isDanger: true, confirmText: "削除" });
  };

  // 連携状況データを取得
  const loadLinkStatusData = async () => {
    try {
      console.log('📋 連携状況データ取得開始（設定画面）')
      const data = await getPatientLinkStatus(DEMO_CLINIC_ID);
      console.log('📋 受信データ:', data)
      console.log('📋 未連携:', data.unlinkedPatients.length, '件')
      console.log('📋 連携済み:', data.linkedPatients.length, '件')
      setLinkStatusData(data);
      console.log('📋 状態更新完了')
    } catch (error) {
      console.error('連携状況データ取得エラー:', error);
    }
  };

  // 患者を連携（本登録）
  const handleLinkPatient = async (patientId: string) => {
    showConfirm('この患者を本登録に変更しますか？', async () => {
      try {
        await linkPatientToQuestionnaire(patientId);
        showAlert('患者を本登録に変更しました', 'success');
        loadLinkStatusData(); // データを再取得
      } catch (error) {
        console.error('患者連携エラー:', error);
        showAlert('患者の連携に失敗しました', 'error');
      }
    });
  };

  // 患者の連携を解除（仮登録に戻す）
  const handleUnlinkPatient = async (patientId: string) => {
    showConfirm('この患者を仮登録に戻しますか？\n過去の問診データは保持されます。', async () => {
      try {
        console.log('🔓 連携解除処理開始 - patientId:', patientId)
        await unlinkPatientFromQuestionnaire(patientId);
        console.log('✅ 連携解除成功')
        showAlert('患者を仮登録に戻しました', 'success');
        await loadLinkStatusData(); // データを再取得
        console.log('✅ データ再取得完了')
      } catch (error) {
        console.error('❌ 患者連携解除エラー:', error);
        console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
        showAlert('患者の連携解除に失敗しました', 'error');
      }
    });
  };

  // 連携状況データの読み込み
  useEffect(() => {
    if (selectedCategory === "questionnaire" && questionnaireTab === "link-status") {
      loadLinkStatusData();
    }
  }, [selectedCategory, questionnaireTab]);

  // 患者一覧データの読み込み
  useEffect(() => {
    const loadPatients = async () => {
      if (selectedCategory === "patient-list") {
        try {
          const data = await getPatients(DEMO_CLINIC_ID);
          setPatients(data);
          setFilteredPatients(data);
        } catch (error) {
          console.error("患者データの読み込みエラー:", error);
        }
      }
    };
    loadPatients();
  }, [selectedCategory]);

  // 患者フィルタリングと検索
  useEffect(() => {
    let filtered = [...patients];

    // 登録状態でフィルタ
    if (patientFilter === 'registered') {
      filtered = filtered.filter(p => p.is_registered);
    } else if (patientFilter === 'temporary') {
      filtered = filtered.filter(p => !p.is_registered);
    }

    // 検索クエリでフィルタ
    if (patientSearchQuery.trim()) {
      const query = patientSearchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.last_name?.toLowerCase().includes(query) ||
        p.first_name?.toLowerCase().includes(query) ||
        p.last_name_kana?.toLowerCase().includes(query) ||
        p.first_name_kana?.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        p.patient_number?.toString().includes(query)
      );
    }

    setFilteredPatients(filtered);
  }, [patients, patientFilter, patientSearchQuery]);

  // 問診票データの読み込み
  useEffect(() => {
    const loadQuestionnaires = async () => {
      console.log("loadQuestionnaires実行 - selectedCategory:", selectedCategory);
      if (selectedCategory === "questionnaire") {
        try {
          console.log("問診票取得開始 - DEMO_CLINIC_ID:", DEMO_CLINIC_ID);
          const data = await getQuestionnaires(DEMO_CLINIC_ID);
          console.log("問診票取得完了 - データ:", data);
          console.log("問診票取得完了 - 件数:", data.length);

          // 標準問診表を最初に表示（名前でソート）
          const sortedData = [...data].sort((a, b) => {
            // 優先順位: 標準問診表 > 習慣チェック表 > 習慣チェック表 簡潔 > その他
            const order: Record<string, number> = {
              '標準問診表': 1,
              '習慣チェック表': 2,
              '習慣チェック表 簡潔': 3,
            };

            const aOrder = order[a.name] || 999;
            const bOrder = order[b.name] || 999;

            if (aOrder !== bOrder) {
              return aOrder - bOrder;
            }

            return a.name.localeCompare(b.name, 'ja');
          });

          setQuestionnaires(sortedData);
        } catch (error) {
          console.error("問診票データの読み込みエラー:", error);
        }
      }
    };
    loadQuestionnaires();
  }, [selectedCategory]);

  // ユニットデータの読み込み
  useEffect(() => {
    const loadUnitsAndStaff = async () => {
      if (selectedCategory === "units") {
        try {
          setStaffLoading(true);

          // ユニットデータとスタッフデータを並行読み込み
          const [unitsResult, staffResult, prioritiesResult] = await Promise.all([
            getUnits(DEMO_CLINIC_ID),
            getStaff(DEMO_CLINIC_ID),
            getStaffUnitPriorities(DEMO_CLINIC_ID)
          ]);

          console.log("ユニットデータ:", unitsResult);
          console.log("スタッフデータ:", staffResult);
          console.log("優先順位データ:", prioritiesResult);

          setUnitsData(unitsResult);
          setStaff(staffResult);
          setStaffUnitPriorities(prioritiesResult);

          // データロード完了後、初期データRefを設定
          initialUnitDataRef.current = JSON.parse(JSON.stringify({
            unitsData: unitsResult,
            staffUnitPriorities: prioritiesResult
          }));

        } catch (error) {
          console.error("ユニット関連データ読み込みエラー:", error);
        } finally {
          setStaffLoading(false);
        }
      }
    };

    loadUnitsAndStaff();
  }, [selectedCategory]);

  // スタッフユニット優先順位を読み込み（タブ切り替え時のみ）
  useEffect(() => {
    if (selectedCategory === "units" && unitsActiveTab === "priorities") {
      loadStaffUnitPriorities();
    }
  }, [unitsActiveTab]); // selectedCategoryを依存配列から削除

  // デフォルトテキストの読み込み
  useEffect(() => {
    const savedTexts = localStorage.getItem("default_texts");
    if (savedTexts) {
      setDefaultTexts(JSON.parse(savedTexts));
    }
  }, []);

  // 問診票利用設定の読み込み
  useEffect(() => {
    const savedSetting = localStorage.getItem("useQuestionnaire");
    if (savedSetting !== null) {
      const parsedSetting = JSON.parse(savedSetting);
      console.log("問診票利用設定をlocalStorageから読み込み:", parsedSetting);
      setUseQuestionnaire(parsedSetting);
    }
  }, []);

  // 通知設定の読み込み
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (selectedCategory === "notification") {
        try {
          const response = await fetch(
            `/api/notification-settings?clinic_id=${DEMO_CLINIC_ID}`,
          );
          if (response.ok) {
            const settings = await response.json();
            // Webhook URLを常に現在のオリジンで設定
            const webhookUrl = `${window.location.origin}/api/line/webhook`;

            const notificationData = {
              ...settings,
              line: {
                ...settings.line,
                webhook_url: webhookUrl,
                // LIFF IDフィールドのデフォルト値を保証
                liff_id_initial_link: settings.line?.liff_id_initial_link || "",
                liff_id_qr_code: settings.line?.liff_id_qr_code || "",
                liff_id_family_register: settings.line?.liff_id_family_register || "",
                liff_id_appointments: settings.line?.liff_id_appointments || "",
                liff_id_web_booking: settings.line?.liff_id_web_booking || "",
              },
            };
            setNotificationSettings(notificationData);
            // データ読み込み後に初期データとして保存（変更検知の基準）
            if (isNotificationInitialLoadRef.current) {
              initialNotificationDataRef.current = JSON.parse(JSON.stringify({ notificationSettings: notificationData }));
              isNotificationInitialLoadRef.current = false;
            }
          }
        } catch (error) {
          console.error("通知設定の読み込みエラー:", error);
        }

        // テンプレートの読み込み
        try {
          const templatesResponse = await fetch(
            `/api/notification-templates?clinic_id=${DEMO_CLINIC_ID}`,
          );
          if (templatesResponse.ok) {
            const templatesData = await templatesResponse.json();

            // テンプレートが空の場合、システムテンプレートを初期化
            if (templatesData.length === 0) {
              console.log("テンプレートが空です。システムテンプレートを初期化します。");
              try {
                const initResponse = await fetch('/api/notification-templates/init', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clinic_id: DEMO_CLINIC_ID }),
                });

                if (initResponse.ok) {
                  const initData = await initResponse.json();
                  console.log("システムテンプレート初期化成功:", initData);

                  // 再度テンプレートを読み込み
                  const reloadResponse = await fetch(
                    `/api/notification-templates?clinic_id=${DEMO_CLINIC_ID}`,
                  );
                  if (reloadResponse.ok) {
                    const reloadData = await reloadResponse.json();
                    setTemplates(
                      reloadData.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        notification_type: t.notification_type,
                        line_message: t.line_message || "",
                        email_subject: t.email_subject || "",
                        email_message: t.email_message || "",
                        sms_message: t.sms_message || "",
                        auto_send_enabled: t.auto_send_enabled || false,
                        auto_send_trigger: t.auto_send_trigger || "manual",
                        auto_send_timing_value: t.auto_send_timing_value || 3,
                        auto_send_timing_unit: t.auto_send_timing_unit || "days_before",
                      })),
                    );
                  }
                }
              } catch (initError) {
                console.error("システムテンプレート初期化エラー:", initError);
              }
            } else {
              setTemplates(
                templatesData.map((t: any) => ({
                id: t.id,
                name: t.name,
                notification_type: t.notification_type,
                  line_message: t.line_message || "",
                  email_subject: t.email_subject || "",
                  email_message: t.email_message || "",
                  sms_message: t.sms_message || "",
                  auto_send_enabled: t.auto_send_enabled || false,
                  auto_send_trigger: t.auto_send_trigger || "manual",
                  auto_send_timing_value: t.auto_send_timing_value || 3,
                  auto_send_timing_unit: t.auto_send_timing_unit || "days_before",
                })),
              );
            }
          }
        } catch (error) {
          console.error("テンプレートの読み込みエラー:", error);
        }

        // 自動リマインドルールの読み込み
        try {
          const autoReminderResponse = await fetch(
            `/api/auto-reminder-rules?clinic_id=${DEMO_CLINIC_ID}`,
          );
          if (autoReminderResponse.ok) {
            const autoReminderData = await autoReminderResponse.json();

            setAutoReminderRule({
              enabled: autoReminderData.enabled || false,
              intervals: autoReminderData.intervals || [
                { sequence: 1, months: 3 },
                { sequence: 2, months: 3 },
                { sequence: 3, months: 6 },
              ],
              template_id: autoReminderData.on_cancel_resend_template_id || "",
            });
          }
        } catch (error) {
          console.error("自動リマインドルールの読み込みエラー:", error);
        }
      }
    };
    loadNotificationSettings();
  }, [selectedCategory]);

  // 初期データの設定
  useEffect(() => {
    const loadClinicSettings = async () => {
      try {
        console.log("クリニック設定読み込み開始");
        const settings = await getClinicSettings(DEMO_CLINIC_ID);
        console.log("読み込んだ設定:", settings);

        let loadedBusinessHours;
        let loadedBreakTimes = {};
        let loadedHolidays: string[] = [];
        let loadedClinicInfo = {
          name: "",
          website_url: "",
          postal_code: "",
          address_line: "",
          phone: "",
        };

        // 保存された設定があれば使用、なければデフォルト値を使用
        if (settings.business_hours) {
          loadedBusinessHours = settings.business_hours;
          setBusinessHours(settings.business_hours);
        } else {
          // デフォルトの診療時間を設定
          const defaultBusinessHours: Record<string, any> = {};
          WEEKDAYS.forEach((day) => {
            if (day.id !== "sunday") {
              defaultBusinessHours[day.id] = {
                isOpen: true,
                start: "09:00",
                end: "18:00",
                timeSlots: [
                  {
                    id: `${day.id}_morning`,
                    start: "09:00",
                    end: "13:00",
                    period: "morning" as "morning",
                  },
                  {
                    id: `${day.id}_afternoon`,
                    start: "14:30",
                    end: "18:00",
                    period: "afternoon" as "afternoon",
                  },
                ],
              };
            } else {
              defaultBusinessHours[day.id] = {
                isOpen: false,
                start: "09:00",
                end: "18:00",
                timeSlots: [],
              };
            }
          });
          loadedBusinessHours = defaultBusinessHours;
          setBusinessHours(defaultBusinessHours);
        }

        if (settings.break_times) {
          loadedBreakTimes = settings.break_times;
          setBreakTimes(settings.break_times);
        }

        if (settings.time_slot_minutes) {
          setTimeSlotMinutes(settings.time_slot_minutes);
        }

        if (settings.holidays) {
          console.log("読み込んだ休診日:", settings.holidays);
          loadedHolidays = settings.holidays;
          setHolidays(settings.holidays);
        }

        if (settings.clinic_info) {
          loadedClinicInfo = settings.clinic_info;
          setClinicInfo(settings.clinic_info);
        }

        // データロード完了後、初期データRefを設定
        initialClinicDataRef.current = JSON.parse(JSON.stringify({
          clinicInfo: loadedClinicInfo,
          businessHours: loadedBusinessHours,
          breakTimes: loadedBreakTimes,
          holidays: loadedHolidays
        }));

        // カレンダー設定を読み込み
        if (settings.display_items) {
          console.log("displayItems読み込み:", settings.display_items);
          setDisplayItems(settings.display_items);
        }

        // cell_heightとtimeSlotMinutesの整合性をチェック
        let finalCellHeight = settings.cell_height || 40;
        const currentTimeSlotMinutes = settings.time_slot_minutes || 15;

        // 整合性チェック: 15分スロットの場合は40px以上を推奨
        if (currentTimeSlotMinutes === 15 && finalCellHeight < 40) {
          console.warn(
            `セル高さ（${finalCellHeight}px）が15分スロットに対して低すぎるため、40pxに自動調整します`,
          );
          finalCellHeight = 40;
          // 自動修正した値を保存
          await setClinicSetting(DEMO_CLINIC_ID, "cell_height", 40);
        } else if (currentTimeSlotMinutes === 30 && finalCellHeight < 60) {
          console.warn(
            `セル高さ（${finalCellHeight}px）が30分スロットに対して低すぎるため、60pxに自動調整します`,
          );
          finalCellHeight = 60;
          // 自動修正した値を保存
          await setClinicSetting(DEMO_CLINIC_ID, "cell_height", 60);
        }

        setCellHeight(finalCellHeight);

        // Web予約設定を読み込み
        if (settings.web_reservation) {
          const webReservationSettings = {
            ...settings.web_reservation,
            // デフォルト値でpatientInfoFieldsを設定
            patientInfoFields: {
              phoneRequired:
                settings.web_reservation.patientInfoFields?.phoneRequired ??
                true,
              phoneEnabled:
                settings.web_reservation.patientInfoFields?.phoneEnabled ??
                true,
              emailRequired:
                settings.web_reservation.patientInfoFields?.emailRequired ??
                false,
              emailEnabled:
                settings.web_reservation.patientInfoFields?.emailEnabled ??
                true,
            },
          };
          setWebSettings(webReservationSettings);
          setWebBookingMenus(settings.web_reservation.booking_menus || []);
        }
      } catch (error) {
        console.error("クリニック設定読み込みエラー:", error);
        // エラーの場合はデフォルト値を使用
        const defaultBusinessHours: Record<string, any> = {};
        WEEKDAYS.forEach((day) => {
          if (day.id !== "sunday") {
            defaultBusinessHours[day.id] = {
              isOpen: true,
              start: "09:00",
              end: "18:00",
              timeSlots: [
                {
                  id: `${day.id}_morning`,
                  start: "09:00",
                  end: "13:00",
                  period: "morning" as "morning",
                },
                {
                  id: `${day.id}_afternoon`,
                  start: "14:30",
                  end: "18:00",
                  period: "afternoon" as "afternoon",
                },
              ],
            };
          } else {
            defaultBusinessHours[day.id] = {
              isOpen: false,
              start: "09:00",
              end: "18:00",
              timeSlots: [],
            };
          }
        });
        setBusinessHours(defaultBusinessHours);
      }
    };

    // 全データの読み込みを待ってから初期読み込みフラグをfalseにする
    const initializeData = async () => {
      await loadClinicSettings();
    };

    initializeData();

    // スタッフデータの読み込み
    const loadStaff = async () => {
      try {
        console.log("スタッフデータ読み込み開始:", DEMO_CLINIC_ID);
        setStaffLoading(true);
        const data = await getStaff(DEMO_CLINIC_ID);
        console.log("読み込んだスタッフデータ:", data);
        setStaff(data);
      } catch (error) {
        console.error("スタッフデータ読み込みエラー:", error);
      } finally {
        setStaffLoading(false);
      }
    };
    
    loadStaff();

    // マスタデータの読み込み
    const loadMasterData = async () => {
      try {
        const [positionsData, noteTypesData, cancelReasonsData, memoTemplatesData] =
          await Promise.all([
          getStaffPositions(DEMO_CLINIC_ID),
          getPatientNoteTypes(DEMO_CLINIC_ID),
            getCancelReasons(DEMO_CLINIC_ID),
            getMemoTemplates(DEMO_CLINIC_ID),
          ]);

        // スタッフ役職が空の場合、デフォルトデータを初期化
        if (positionsData.length === 0) {
          console.log('スタッフ役職が空です。デフォルトデータを初期化します...');
          const initResult = await initializeClinicStaffPositions(DEMO_CLINIC_ID);
          if (initResult.success) {
            console.log(`✓ ${initResult.count}件のスタッフ役職を初期化しました`);
            const reloadedPositions = await getStaffPositions(DEMO_CLINIC_ID);
            setStaffPositions(reloadedPositions);
          } else {
            console.error('スタッフ役職の初期化に失敗:', initResult.errors);
            setStaffPositions(positionsData);
          }
        } else {
          setStaffPositions(positionsData);
        }

        // キャンセル理由が空の場合、デフォルトデータを初期化
        if (cancelReasonsData.length === 0) {
          console.log('キャンセル理由が空です。デフォルトデータを初期化します...');
          const initResult = await initializeClinicCancelReasons(DEMO_CLINIC_ID);
          if (initResult.success) {
            console.log(`✓ ${initResult.count}件のキャンセル理由を初期化しました`);
            const reloadedReasons = await getCancelReasons(DEMO_CLINIC_ID);
            setCancelReasons(reloadedReasons);
          } else {
            console.error('キャンセル理由の初期化に失敗:', initResult.errors);
            setCancelReasons(cancelReasonsData);
          }
        } else {
          setCancelReasons(cancelReasonsData);
        }

        setPatientNoteTypes(noteTypesData);
        setMemoTemplates(memoTemplatesData);
      } catch (error) {
        console.error("マスタデータ読み込みエラー:", error);
      }
    };
    
    loadMasterData();

    // 診療メニューデータの読み込み（初期読み込み時のみ）
    const loadTreatmentMenus = async () => {
      // 既に読み込み済みの場合はスキップ（ローカルの変更を保持）
      if (treatmentMenusLoadedRef.current) {
        console.log("診療メニューは既に読み込み済み、スキップします");
        return;
      }

      try {
        console.log("メニュー読み込み開始:", DEMO_CLINIC_ID);
        const data = await getTreatmentMenus(DEMO_CLINIC_ID);
        console.log("読み込んだメニューデータ:", data);
        setTreatmentMenus(data);
        treatmentMenusLoadedRef.current = true; // 読み込み完了フラグを立てる
      } catch (error) {
        console.error("メニュー読み込みエラー:", error);
      }
    };

    loadTreatmentMenus();
  }, []);

  // clinicInfo.website_urlが変更されたら、リッチメニューのWebサイトボタンのURLを更新
  useEffect(() => {
    if (clinicInfo.website_url) {
      setRichMenuButtons((prevButtons) =>
        prevButtons.map((button) =>
          button.id === 4
            ? { ...button, url: clinicInfo.website_url }
            : button
        )
      );
    }
  }, [clinicInfo.website_url]);

  // クリニックタブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'clinic') return;
    if (isSavingRef.current) return;

    const currentData = { clinicInfo, businessHours, breakTimes, holidays };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialClinicDataRef.current === null) {
      initialClinicDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialClinicDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [clinicInfo, businessHours, breakTimes, holidays, selectedCategory]);

  // カレンダータブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'calendar') return;
    if (isSavingRef.current) return;

    const currentData = { displayItems, cellHeight };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialCalendarDataRef.current === null) {
      initialCalendarDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialCalendarDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [displayItems, cellHeight, selectedCategory]);

  // Web予約タブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'web') return;
    if (isSavingRef.current) return;

    const currentData = { webSettings, webBookingMenus };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialWebDataRef.current === null) {
      initialWebDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialWebDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [webSettings, webBookingMenus, selectedCategory]);

  // スタッフタブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'staff') return;
    if (isSavingRef.current) return;

    const currentData = { staff, staffUnitPriorities };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialStaffDataRef.current === null) {
      initialStaffDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialStaffDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [staff, staffUnitPriorities, selectedCategory]);

  // 診療メニュータブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'treatment') return;
    if (isSavingRef.current) return;

    const currentData = { treatmentMenus };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialMenuDataRef.current === null) {
      initialMenuDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialMenuDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [treatmentMenus, selectedCategory]);

  // ユニットタブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'units') return;
    if (isSavingRef.current) return;

    const currentData = { unitsData, staffUnitPriorities };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialUnitDataRef.current === null) {
      initialUnitDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialUnitDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [unitsData, staffUnitPriorities, selectedCategory]);

  // 通知タブの変更検知
  useEffect(() => {
    if (selectedCategory !== 'notification') return;
    if (isSavingRef.current) return;

    // 初回ロード中はスキップ（データ読み込み完了後に初期データが設定される）
    if (isNotificationInitialLoadRef.current) return;

    const currentData = { notificationSettings };

    // 初期データがnullの場合は何もしない（データ読み込み時に設定される）
    if (initialNotificationDataRef.current === null) {
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialNotificationDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [notificationSettings, selectedCategory]);
  // 注: questionnairesは即座に保存されるため、未保存変更として扱わない

  // マスタタブの変更検知
  const initialMasterDataRef = useRef<any>(null);

  useEffect(() => {
    if (selectedCategory !== 'master') return;
    if (isSavingRef.current) return;

    const currentData = {
      iconMaster,
      staffPositions,
      patientNoteTypes,
      cancelReasons,
      memoTemplates
    };

    // 初期データがnullの場合のみ初期化（初回ロード時）
    if (initialMasterDataRef.current === null) {
      initialMasterDataRef.current = JSON.parse(JSON.stringify(currentData));
      return;
    }

    const hasChanged = JSON.stringify(currentData) !== JSON.stringify(initialMasterDataRef.current);
    setHasUnsavedChanges(hasChanged);
  }, [iconMaster, staffPositions, patientNoteTypes, cancelReasons, memoTemplates, selectedCategory]);

  // タブ切り替え時に未保存フラグをリセット
  useEffect(() => {
    setHasUnsavedChanges(false);
  }, [selectedCategory]);

  // 未保存の変更がある場合、ページ離脱時に警告を表示
  useEffect(() => {
    // localStorageに未保存状態を保存（他のページから参照できるように）
    if (hasUnsavedChanges) {
      localStorage.setItem('settings_has_unsaved_changes', 'true');
    } else {
      localStorage.removeItem('settings_has_unsaved_changes');
    }

    // beforeunloadイベントで警告
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // timeSlotMinutesの変更を監視して自動保存
  useEffect(() => {
    console.log(
      "設定ページ: 自動保存useEffect実行 - isCalendarInitialLoad:",
      isCalendarInitialLoadRef.current,
      "timeSlotMinutes:",
      timeSlotMinutes,
    );

    if (isCalendarInitialLoadRef.current) {
      console.log("設定ページ: 初期読み込み中のため自動保存をスキップ");
      return; // 初期読み込み時は保存しない
    }
    
    console.log("設定ページ: timeSlotMinutes変更検知:", timeSlotMinutes);
    
    // デバウンス処理（500ms後に保存）
    const timeoutId = setTimeout(async () => {
      try {
        console.log("設定ページ: 自動保存開始");
        console.log("設定ページ: timeSlotMinutes保存値:", timeSlotMinutes);
        
        // 数値として保存することを確認
        const numericTimeSlotMinutes = Number(timeSlotMinutes);
        console.log("設定ページ: 数値変換後の値:", numericTimeSlotMinutes);

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "time_slot_minutes",
          numericTimeSlotMinutes,
        );
        console.log("設定ページ: time_slot_minutes保存完了");

        // timeSlotMinutesに応じてcell_heightを自動調整
        let recommendedCellHeight = cellHeight;
        if (numericTimeSlotMinutes === 15 && cellHeight < 40) {
          recommendedCellHeight = 40;
          setCellHeight(40);
          await setClinicSetting(DEMO_CLINIC_ID, "cell_height", 40);
          console.log(
            "設定ページ: セルの高さを15分スロットに合わせて40pxに自動調整しました",
          );
        } else if (numericTimeSlotMinutes === 30 && cellHeight < 60) {
          recommendedCellHeight = 60;
          setCellHeight(60);
          await setClinicSetting(DEMO_CLINIC_ID, "cell_height", 60);
          console.log(
            "設定ページ: セルの高さを30分スロットに合わせて60pxに自動調整しました",
          );
        }

        // メインページに設定変更を通知
        const updateData = {
          timestamp: Date.now(),
          timeSlotMinutes: numericTimeSlotMinutes,
          cellHeight: recommendedCellHeight,
        };
        window.localStorage.setItem(
          "clinic_settings_updated",
          JSON.stringify(updateData),
        );
        console.log(
          "設定ページ: localStorageに設定更新通知を保存:",
          updateData,
        );

        // カスタムイベントを発火
        const customEvent = new CustomEvent("clinicSettingsUpdated", {
          detail: {
            timeSlotMinutes: numericTimeSlotMinutes,
            cellHeight: recommendedCellHeight,
          },
        });
        window.dispatchEvent(customEvent);
        console.log("設定ページ: カスタムイベントを発火:", customEvent.detail);

        // postMessageも発火（追加の通知方法）
        window.postMessage(
          {
            type: "clinicSettingsUpdated",
            data: { timeSlotMinutes: numericTimeSlotMinutes },
          },
          window.location.origin,
        );
        console.log("設定ページ: postMessageを発火:", {
          timeSlotMinutes: numericTimeSlotMinutes,
        });
      } catch (error) {
        console.error("自動保存エラー:", error);
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [timeSlotMinutes]);

  // 診療時間の変更
  const handleBusinessHoursChange = (
    day: string,
    field: string,
    value: any,
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // 休憩時間の変更
  const handleBreakTimesChange = (
    day: string,
    field: string,
    value: string,
  ) => {
    setBreakTimes((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  // 休診日の変更
  const handleHolidayChange = (day: string, checked: boolean) => {
    console.log("休診日変更:", day, checked);
    if (checked) {
      setHolidays((prev) => {
        const newHolidays = [...prev, day];
        console.log("新しい休診日リスト:", newHolidays);
        return newHolidays;
      });
      // 休診日がチェックされた場合、その日の診療時間をクリア
      setBusinessHours((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          isOpen: false,
          timeSlots: [],
        },
      }));
    } else {
      setHolidays((prev) => {
        const newHolidays = prev.filter((d) => d !== day);
        console.log("新しい休診日リスト:", newHolidays);
        return newHolidays;
      });
      // 休診日がチェック解除された場合、デフォルトの診療時間を設定
      setBusinessHours((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          isOpen: true,
          timeSlots: [
            {
              id: `${day}_morning`,
              start: "09:00",
              end: "13:00",
              period: "morning" as "morning",
            },
            {
              id: `${day}_afternoon`,
              start: "14:30",
              end: "18:00",
              period: "afternoon" as "afternoon",
            },
          ],
        },
      }));
    }
  };

  // 時間枠の追加
  const addTimeSlot = (day: string) => {
    const currentSlots = businessHours[day]?.timeSlots || [];
    const newSlot = {
      id: Date.now().toString(),
      start: "09:00",
      end: "18:00",
      period: "morning" as "morning",
    };

    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...currentSlots, newSlot],
      },
    }));
  };

  // 時間枠の削除
  const removeTimeSlot = (day: string, slotId: string) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots:
          prev[day]?.timeSlots?.filter((slot) => slot.id !== slotId) || [],
      },
    }));
  };

  // 時間枠の変更
  const updateTimeSlot = (
    day: string,
    slotId: string,
    field: string,
    value: string,
  ) => {
    setBusinessHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots:
          prev[day]?.timeSlots?.map((slot) =>
            slot.id === slotId ? { ...slot, [field]: value } : slot,
          ) || [],
      },
    }));
  };

  // 曜日選択モーダルを開く
  const openCopyModal = (sourceDay: string) => {
    setCopySourceDay(sourceDay);
    setSelectedDaysToCopy([]);
    setShowCopyModal(true);
  };

  // 選択した曜日に適用
  const applyToSelectedDays = () => {
    const sourceSlots = businessHours[copySourceDay]?.timeSlots || [];
    const isSourceHoliday = holidays.includes(copySourceDay);

    setBusinessHours((prev) => {
      const newBusinessHours = { ...prev };
      selectedDaysToCopy.forEach((dayId) => {
        // 新しいIDを生成してスロットをコピー
        const copiedSlots = sourceSlots.map(slot => ({
          ...slot,
          id: `${dayId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
        newBusinessHours[dayId] = {
          isOpen: !isSourceHoliday,
          timeSlots: copiedSlots
        };
      });
      return newBusinessHours;
    });

    // 休診日の設定も適用
    setHolidays(prev => {
      const newHolidays = [...prev];
      if (isSourceHoliday) {
        // 選択した曜日を休診日に追加
        selectedDaysToCopy.forEach(dayId => {
          if (!newHolidays.includes(dayId)) {
            newHolidays.push(dayId);
          }
        });
      } else {
        // 選択した曜日を休診日から削除
        return newHolidays.filter(h => !selectedDaysToCopy.includes(h));
      }
      return newHolidays;
    });

    // モーダルを閉じる
    setShowCopyModal(false);
    setSelectedDaysToCopy([]);
  };

  // 曜日選択のトグル
  const toggleDaySelection = (dayId: string) => {
    setSelectedDaysToCopy(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(id => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  // 表示項目の変更
  const handleDisplayItemChange = (itemId: string, checked: boolean) => {
    if (checked) {
      // DISPLAY_ITEMSの定義順を維持するため、ソートして追加
      setDisplayItems((prev) => {
        const newItems = [...prev, itemId];
        return newItems.sort((a, b) => {
          const indexA = DISPLAY_ITEMS.findIndex((item) => item.id === a);
          const indexB = DISPLAY_ITEMS.findIndex((item) => item.id === b);
          return indexA - indexB;
        });
      });
    } else {
      setDisplayItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // 診療メニューのWeb予約設定を更新
  const handleMenuUpdate = async (menuId: string, updates: any) => {
    try {
      // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
      setTreatmentMenus((prev) =>
        prev.map((menu) =>
          menu.id === menuId ? { ...menu, ...updates } : menu,
        ),
      );
    } catch (error) {
      console.error("診療メニュー更新エラー:", error);
      showAlert("診療メニューの更新に失敗しました", "error");
    }
  };

  // スタッフ選択の切り替え
  const toggleStaffForMenu = (menuId: string, staffId: string) => {
    const menu = treatmentMenus.find((m) => m.id === menuId);
    if (!menu) return;

    const currentStaffIds = menu.web_booking_staff_ids || [];
    const newStaffIds = currentStaffIds.includes(staffId)
      ? currentStaffIds.filter((id: string) => id !== staffId)
      : [...currentStaffIds, staffId];

    handleMenuUpdate(menuId, { web_booking_staff_ids: newStaffIds });
  };

  // ステップを追加
  const handleAddStep = () => {
    const lastStep = newWebMenu.steps[newWebMenu.steps.length - 1];
    const startTime = lastStep ? lastStep.end_time : 0;
    
    const newStep: BookingStep = {
      id: `step_${Date.now()}`,
      step_order: newWebMenu.steps.length + 1,
      start_time: startTime,
      end_time: startTime + 30,
      duration: 30,
      type: "serial",
      description: "",
      staff_assignments: [],
    };

    setNewWebMenu((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
      duration: newStep.end_time,
    }));
  };

  // ステップを削除
  const handleRemoveStep = (stepId: string) => {
    const updatedSteps = newWebMenu.steps
      .filter((s) => s.id !== stepId)
      .map((step, index) => {
        // ステップ順序を再計算
        let startTime = 0;
        if (index > 0) {
          const prevStep = newWebMenu.steps[index - 1];
          startTime =
            prevStep.type === "serial"
              ? prevStep.end_time
              : prevStep.start_time;
        }
        return {
          ...step,
          step_order: index + 1,
          start_time: startTime,
          end_time: startTime + step.duration,
        };
      });

    const totalDuration =
      updatedSteps.length > 0
        ? Math.max(...updatedSteps.map((s) => s.end_time))
        : 30;

    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
      duration: totalDuration,
    }));
  };

  // ステップの時間を更新
  const handleUpdateStepTime = (stepId: string, endTime: number) => {
    const stepIndex = newWebMenu.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const updatedSteps = [...newWebMenu.steps];
    const step = updatedSteps[stepIndex];
    step.end_time = endTime;
    step.duration = endTime - step.start_time;
    
    // 後続のステップの時間を再計算
    for (let i = stepIndex + 1; i < updatedSteps.length; i++) {
      const prevStep = updatedSteps[i - 1];
      if (prevStep.type === "serial") {
        updatedSteps[i].start_time = prevStep.end_time;
        updatedSteps[i].end_time =
          updatedSteps[i].start_time + updatedSteps[i].duration;
      }
    }

    const totalDuration = Math.max(...updatedSteps.map((s) => s.end_time));

    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
      duration: totalDuration,
    }));
  };

  // ステップのタイプを変更
  const handleToggleStepType = (stepId: string) => {
    const updatedSteps = newWebMenu.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          type:
            step.type === "serial"
              ? ("parallel" as const)
              : ("serial" as const),
        };
      }
      return step;
    });

    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
  };

  // 担当者を追加
  const handleAddStaffToStep = (stepId: string, staffId: string) => {
    const updatedSteps = newWebMenu.steps.map((step) => {
      if (step.id === stepId) {
        const exists = step.staff_assignments.find(
          (sa) => sa.staff_id === staffId,
        );
        if (!exists) {
          const newAssignment: StaffAssignment = {
            staff_id: staffId,
            priority: step.staff_assignments.length + 1,
            is_required: step.type === "parallel",
          };
          return {
            ...step,
            staff_assignments: [...step.staff_assignments, newAssignment],
          };
          }
        }
      return step;
    });
    
    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
  };

  // 担当者を削除
  const handleRemoveStaffFromStep = (stepId: string, staffId: string) => {
    const updatedSteps = newWebMenu.steps.map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          staff_assignments: step.staff_assignments
            .filter((sa) => sa.staff_id !== staffId)
            .map((sa, index) => ({ ...sa, priority: index + 1 })),
        };
        }
      return step;
    });
    
    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
  };

  // 担当者の優先順位を変更
  const handleMoveStaffPriority = (
    stepId: string,
    staffId: string,
    direction: "up" | "down",
  ) => {
    const updatedSteps = newWebMenu.steps.map((step) => {
      if (step.id === stepId) {
        const currentIndex = step.staff_assignments.findIndex(
          (sa) => sa.staff_id === staffId,
        );
        if (currentIndex === -1) return step;

        const newIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (newIndex < 0 || newIndex >= step.staff_assignments.length)
          return step;

        const newAssignments = [...step.staff_assignments];
        const temp = newAssignments[currentIndex];
        newAssignments[currentIndex] = newAssignments[newIndex];
        newAssignments[newIndex] = temp;
        
        // 優先順位を再設定
        return {
          ...step,
          staff_assignments: newAssignments.map((sa, index) => ({
            ...sa,
            priority: index + 1,
          })),
        };
      }
      return step;
    });

    setNewWebMenu((prev) => ({
      ...prev,
      steps: updatedSteps,
    }));
  };

  // Web予約メニューを追加
  const handleAddWebBookingMenu = () => {
    if (!newWebMenu.treatment_menu_id) {
      showAlert("診療メニューを選択してください", "error");
      return;
    }
    if (newWebMenu.steps.length === 0) {
      showAlert("少なくとも1つのステップを追加してください", "error");
      return;
    }

    // 最終的に選択されたメニューを取得（レベル3 > レベル2 > レベル1の順）
    const selectedMenuId =
      newWebMenu.treatment_menu_level3_id ||
      newWebMenu.treatment_menu_level2_id ||
      newWebMenu.treatment_menu_id;
    const menu = treatmentMenus.find((m) => m.id === selectedMenuId);
    if (!menu) return;

    // メニュー階層の名前を構築
    const level1Menu = treatmentMenus.find(
      (m) => m.id === newWebMenu.treatment_menu_id,
    );
    const level2Menu = newWebMenu.treatment_menu_level2_id
      ? treatmentMenus.find((m) => m.id === newWebMenu.treatment_menu_level2_id)
      : null;
    const level3Menu = newWebMenu.treatment_menu_level3_id
      ? treatmentMenus.find((m) => m.id === newWebMenu.treatment_menu_level3_id)
      : null;

    const menuNameParts = [
      level1Menu?.name,
      level2Menu?.name,
      level3Menu?.name,
    ].filter(Boolean);
    const fullMenuName = menuNameParts.join(" > ");

    const webMenu = {
      id: `web_${Date.now()}`,
      treatment_menu_id: newWebMenu.treatment_menu_id,
      treatment_menu_level2_id: newWebMenu.treatment_menu_level2_id,
      treatment_menu_level3_id: newWebMenu.treatment_menu_level3_id,
      treatment_menu_name: fullMenuName,
      display_name: newWebMenu.display_name || fullMenuName,
      treatment_menu_color: menu.color,
      duration: newWebMenu.duration,
      steps: newWebMenu.steps,
      allow_new_patient: newWebMenu.allow_new_patient,
      allow_returning: newWebMenu.allow_returning,
    };

    const updatedMenus = [...webBookingMenus, webMenu];
    setWebBookingMenus(updatedMenus);

    // データベースに保存
    saveWebBookingMenus(updatedMenus);

    setIsAddWebMenuDialogOpen(false);
    setNewWebMenu({
      treatment_menu_id: "",
      treatment_menu_level2_id: "",
      treatment_menu_level3_id: "",
      display_name: "",
      duration: 30,
      steps: [],
      allow_new_patient: true,
      allow_returning: true,
    });
  };

  // Web予約メニューを削除
  const handleRemoveWebBookingMenu = (id: string) => {
    const updatedMenus = webBookingMenus.filter((m) => m.id !== id);
    setWebBookingMenus(updatedMenus);

    // データベースに保存
    saveWebBookingMenus(updatedMenus);
  };

  // Web予約メニューを編集開始
  const handleEditWebMenu = (menu: any) => {
    setEditingWebMenu(menu);
    setNewWebMenu({
      treatment_menu_id: menu.treatment_menu_id || "",
      treatment_menu_level2_id: menu.treatment_menu_level2_id || "",
      treatment_menu_level3_id: menu.treatment_menu_level3_id || "",
      display_name: menu.display_name || "",
      duration: menu.duration || 30,
      steps: menu.steps || [],
      allow_new_patient:
        menu.allow_new_patient !== undefined ? menu.allow_new_patient : true,
      allow_returning:
        menu.allow_returning !== undefined ? menu.allow_returning : true,
    });
    setIsEditWebMenuDialogOpen(true);
  };

  // Web予約メニューの編集を保存
  const handleSaveEditWebMenu = () => {
    if (!editingWebMenu) return;
    if (!newWebMenu.treatment_menu_id) {
      showAlert("診療メニューを選択してください", "error");
      return;
    }
    if (newWebMenu.steps.length === 0) {
      showAlert("少なくとも1つのステップを追加してください", "error");
      return;
    }

    // 最終的に選択されたメニューを取得
    const selectedMenuId =
      newWebMenu.treatment_menu_level3_id ||
      newWebMenu.treatment_menu_level2_id ||
      newWebMenu.treatment_menu_id;
    const menu = treatmentMenus.find((m) => m.id === selectedMenuId);
    if (!menu) return;

    // メニュー階層の名前を構築
    const level1Menu = treatmentMenus.find(
      (m) => m.id === newWebMenu.treatment_menu_id,
    );
    const level2Menu = newWebMenu.treatment_menu_level2_id
      ? treatmentMenus.find((m) => m.id === newWebMenu.treatment_menu_level2_id)
      : null;
    const level3Menu = newWebMenu.treatment_menu_level3_id
      ? treatmentMenus.find((m) => m.id === newWebMenu.treatment_menu_level3_id)
      : null;

    const menuNameParts = [
      level1Menu?.name,
      level2Menu?.name,
      level3Menu?.name,
    ].filter(Boolean);
    const fullMenuName = menuNameParts.join(" > ");

    const updatedMenu = {
      ...editingWebMenu,
      treatment_menu_id: newWebMenu.treatment_menu_id,
      treatment_menu_level2_id: newWebMenu.treatment_menu_level2_id,
      treatment_menu_level3_id: newWebMenu.treatment_menu_level3_id,
      treatment_menu_name: fullMenuName,
      display_name: newWebMenu.display_name || fullMenuName,
      treatment_menu_color: menu.color,
      duration: newWebMenu.duration,
      steps: newWebMenu.steps,
      allow_new_patient: newWebMenu.allow_new_patient,
      allow_returning: newWebMenu.allow_returning,
    };

    const updatedMenus = webBookingMenus.map((m) =>
      m.id === editingWebMenu.id ? updatedMenu : m,
    );
    setWebBookingMenus(updatedMenus);

    // データベースに保存
    saveWebBookingMenus(updatedMenus);

    setIsEditWebMenuDialogOpen(false);
    setEditingWebMenu(null);
    setNewWebMenu({
      treatment_menu_id: "",
      treatment_menu_level2_id: "",
      treatment_menu_level3_id: "",
      display_name: "",
      duration: 30,
      steps: [],
      allow_new_patient: true,
      allow_returning: true,
    });
  };

  // キャンセルポリシー編集ダイアログを開く
  const handleOpenCancelPolicyDialog = () => {
    setTempCancelPolicyText(webSettings.cancelPolicyText);
    setIsCancelPolicyDialogOpen(true);
  };

  // キャンセルポリシーを保存
  const handleSaveCancelPolicy = () => {
    setWebSettings((prev) => ({
      ...prev,
      cancelPolicyText: tempCancelPolicyText,
    }));
    setIsCancelPolicyDialogOpen(false);
  };

  // キャンセルポリシー編集をキャンセル
  const handleCancelPolicyDialogClose = () => {
    setIsCancelPolicyDialogOpen(false);
  };

  // 患者情報フィールド設定ダイアログの関数
  const handleOpenPatientInfoFieldsDialog = () => {
    setTempPatientInfoFields(webSettings.patientInfoFields);
    setIsPatientInfoFieldsDialogOpen(true);
  };

  const handleSavePatientInfoFields = () => {
    setWebSettings((prev) => ({
      ...prev,
      patientInfoFields: tempPatientInfoFields,
    }));
    setIsPatientInfoFieldsDialogOpen(false);
  };

  const handlePatientInfoFieldsDialogClose = () => {
    setIsPatientInfoFieldsDialogOpen(false);
    setTempPatientInfoFields(webSettings.patientInfoFields);
  };

  // Web予約メニューをデータベースに保存
  const saveWebBookingMenus = async (menus: any[]) => {
    try {
      console.log("Web予約メニュー保存開始");
      console.log("保存するメニュー:", menus);

      const settingsToSave = {
        ...webSettings,
        booking_menus: menus,
      };

      await setClinicSetting(DEMO_CLINIC_ID, "web_reservation", settingsToSave);
      console.log("Web予約メニュー保存完了");
    } catch (error) {
      console.error("Web予約メニュー保存エラー:", error);
      showAlert("Web予約メニューの保存に失敗しました", "error");
    }
  };

  // Web予約設定を保存
  const handleSaveWebSettings = async () => {
    try {
      console.log("Web予約設定保存開始");
      console.log("保存するwebSettings:", webSettings);
      console.log("保存するwebBookingMenus:", webBookingMenus);
      
      const settingsToSave = {
        ...webSettings,
        booking_menus: webBookingMenus,
      };
      
      console.log("保存データ:", settingsToSave);
      await setClinicSetting(DEMO_CLINIC_ID, "web_reservation", settingsToSave);
      
      // 保存後にデータを再読み込み
      const reloadedSettings = await getClinicSettings(DEMO_CLINIC_ID);
      console.log("再読み込みした設定:", reloadedSettings);

      if (reloadedSettings.web_reservation) {
        setWebSettings(reloadedSettings.web_reservation);
        setWebBookingMenus(
          reloadedSettings.web_reservation.booking_menus || [],
        );
        console.log(
          "Web予約メニュー再読み込み完了:",
          reloadedSettings.web_reservation.booking_menus,
        );
      }

      // 保存成功時に未保存フラグをクリアし、初期データを更新
      setHasUnsavedChanges(false);
      initialWebDataRef.current = JSON.parse(JSON.stringify({
        webSettings,
        webBookingMenus
      }));

      showAlert("Web予約設定を保存しました", "success");
    } catch (error) {
      console.error("Web予約設定保存エラー:", error);
      showAlert("Web予約設定の保存に失敗しました", "error");
    }
  };

  // 汎用確認ダイアログヘルパー
  const showConfirm = (
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      isDanger?: boolean;
    }
  ) => {
    setConfirmModalConfig({
      title: options?.title || "確認",
      message,
      confirmText: options?.confirmText || "OK",
      cancelText: options?.cancelText || "キャンセル",
      onConfirm,
      isDanger: options?.isDanger || false,
    });
    setShowConfirmModal(true);
  };

  // 汎用アラートヘルパー
  const showAlert = (
    message: string,
    type: "success" | "error" | "info" = "info",
    title?: string
  ) => {
    setAlertModalConfig({
      title: title || (type === "error" ? "エラー" : type === "success" ? "成功" : "通知"),
      message,
      type,
    });
    setShowAlertModal(true);
  };

  // 保存処理
  const handleSave = async () => {
    console.log("=== handleSave 呼び出し開始 ===");
    console.log("selectedCategory:", selectedCategory);
    console.log("現在のclinicInfo:", clinicInfo);
    console.log("現在のbusinessHours:", businessHours);
    console.log("現在のbreakTimes:", breakTimes);
    console.log("現在のtimeSlotMinutes:", timeSlotMinutes);
    console.log("現在のholidays:", holidays);

    try {
      setSaving(true);

      // カテゴリに応じて保存データを準備
      const settings: any = {};

      if (selectedCategory === "clinic") {
        settings.clinicInfo = clinicInfo;
        settings.businessHours = businessHours;
        settings.breakTimes = breakTimes;
        settings.timeSlotMinutes = timeSlotMinutes;
        settings.holidays = holidays;
      } else if (selectedCategory === "calendar") {
        settings.timeSlotMinutes = timeSlotMinutes;
        settings.displayItems = displayItems;
        settings.cellHeight = cellHeight;
      }

      console.log("保存データ:", settings);
      console.log("クリニックID:", DEMO_CLINIC_ID);
      console.log("現在の timeSlotMinutes:", timeSlotMinutes);
      console.log("現在の holidays:", holidays);
      console.log("現在の businessHours:", businessHours);

      // Supabaseに保存
      if (selectedCategory === "clinic") {
        console.log("=== クリニック設定を保存中 ===");
        // クリニック設定は個別に保存
        await setClinicSetting(
          DEMO_CLINIC_ID,
          "clinic_info",
          settings.clinicInfo,
        );
        console.log("✓ clinic_info保存完了");

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "business_hours",
          settings.businessHours,
        );
        console.log("✓ business_hours保存完了");

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "break_times",
          settings.breakTimes,
        );
        console.log("✓ break_times保存完了");

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "time_slot_minutes",
          settings.timeSlotMinutes,
        );
        console.log("✓ time_slot_minutes保存完了");

        await setClinicSetting(DEMO_CLINIC_ID, "holidays", settings.holidays);
        console.log("✓ holidays保存完了:", settings.holidays);
        console.log("クリニック設定をclinic_settingsテーブルに保存しました");
      } else if (selectedCategory === "calendar") {
        console.log("=== カレンダー設定を保存中 ===");
        // カレンダー設定を個別に保存
        await setClinicSetting(
          DEMO_CLINIC_ID,
          "time_slot_minutes",
          settings.timeSlotMinutes,
        );
        console.log("✓ time_slot_minutes保存完了");

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "display_items",
          settings.displayItems,
        );
        console.log("✓ display_items保存完了");

        await setClinicSetting(
          DEMO_CLINIC_ID,
          "cell_height",
          settings.cellHeight,
        );
        console.log("✓ cell_height保存完了");
        console.log("カレンダー設定をclinic_settingsテーブルに保存しました");
      } else if (selectedCategory === "treatment") {
        console.log("=== 診療メニュー設定を保存中 ===");

        // 診療メニューを一括保存
        for (const menu of treatmentMenus) {
          if (menu._deleted) {
            // 削除フラグが立っているメニューを削除
            if (!menu.id.startsWith('temp-')) {
              await deleteTreatmentMenu(DEMO_CLINIC_ID, menu.id);
              console.log(`✓ メニュー削除: ${menu.name}`);
            }
          } else if (menu.id.startsWith('temp-')) {
            // 一時IDのメニューを新規作成
            const { id, _deleted, ...menuData } = menu;
            const result = await createTreatmentMenu(DEMO_CLINIC_ID, menuData);
            console.log(`✓ メニュー作成: ${menu.name}`, result);
          } else {
            // 既存メニューを更新
            const { id, _deleted, ...menuData } = menu;
            await updateTreatmentMenu(DEMO_CLINIC_ID, menu.id, menuData);
            console.log(`✓ メニュー更新: ${menu.name}`);
          }
        }

        // 保存後にデータを再読み込み
        treatmentMenusLoadedRef.current = false; // フラグをリセットして再読み込み可能に
        const reloadedMenus = await getTreatmentMenus(DEMO_CLINIC_ID);
        treatmentMenusLoadedRef.current = true; // 再度フラグを立てる

        setTreatmentMenus(reloadedMenus);

        // 未保存フラグをクリアし、初期データを更新
        setHasUnsavedChanges(false);
        initialMenuDataRef.current = JSON.parse(JSON.stringify({ treatmentMenus: reloadedMenus }));

        console.log("診療メニュー保存完了");

        // 早期リターンして、下のsetHasUnsavedChanges(false)の二重実行を防ぐ
        setShowSaveSuccessModal(true);
        setSaving(false);
        isSavingRef.current = false;
        return;
      } else if (selectedCategory === "questionnaire") {
        console.log("=== 問診表設定を保存中 ===");
        // 問診票利用設定をlocalStorageに保存
        localStorage.setItem('useQuestionnaire', JSON.stringify(useQuestionnaire));
        console.log("問診票利用設定を保存しました:", useQuestionnaire);
      } else if (selectedCategory === "units") {
        console.log("=== ユニット設定を保存中 ===");

        // 保存中フラグを立てる
        isSavingRef.current = true;

        // ユニットを一括保存
        for (const unit of unitsData) {
          if (unit._deleted) {
            // 削除フラグが立っているユニットを削除
            if (!unit.id.startsWith('temp-')) {
              await deleteUnit(DEMO_CLINIC_ID, unit.id);
              console.log(`✓ ユニット削除: ${unit.name}`);
            }
          } else if (unit.id.startsWith('temp-')) {
            // 一時IDのユニットを新規作成
            const { id, _deleted, ...unitData } = unit;
            const result = await createUnit(DEMO_CLINIC_ID, unitData);
            console.log(`✓ ユニット作成: ${unit.name}`, result);
          } else {
            // 既存ユニットを更新
            const { id, _deleted, clinic_id, created_at, ...unitData } = unit;
            await updateUnit(DEMO_CLINIC_ID, unit.id, unitData);
            console.log(`✓ ユニット更新: ${unit.name}`);
          }
        }

        // 保存後にデータを再読み込み（UIに反映するため）
        const reloadedUnits = await getUnits(DEMO_CLINIC_ID);
        const reloadedPriorities = await getStaffUnitPriorities(DEMO_CLINIC_ID);

        setUnitsData(reloadedUnits);
        setStaffUnitPriorities(reloadedPriorities);

        // 未保存フラグをクリアし、初期データを更新
        setHasUnsavedChanges(false);
        initialUnitDataRef.current = JSON.parse(JSON.stringify({
          unitsData: reloadedUnits,
          staffUnitPriorities: reloadedPriorities
        }));

        console.log("ユニット設定保存完了");

        // 早期リターンして、下のsetHasUnsavedChanges(false)の二重実行を防ぐ
        setShowSaveSuccessModal(true);
        setSaving(false);

        // すべてのstate更新とタブ切り替えによるデータ読み込みが完了するまで待機
        // この間、変更検知をスキップする
        setTimeout(() => {
          isSavingRef.current = false;
        }, 500);

        return;
      } else if (selectedCategory === "staff") {
        console.log("=== スタッフ設定を保存中 ===");

        // スタッフを一括保存
        for (const member of staff) {
          if (member._deleted) {
            // 削除フラグが立っているスタッフを削除
            if (!member.id.startsWith('temp-')) {
              await deleteStaff(DEMO_CLINIC_ID, member.id);
              console.log(`✓ スタッフ削除: ${member.name}`);
            }
          } else if (member.id.startsWith('temp-')) {
            // 一時IDのスタッフを新規作成
            const { id, _deleted, position, created_at, ...memberData } = member;
            const result = await createStaff(DEMO_CLINIC_ID, memberData);
            console.log(`✓ スタッフ作成: ${member.name}`, result);
          } else {
            // 既存スタッフを更新
            const { id, _deleted, position, clinic_id, created_at, updated_at, ...memberData } = member;
            await updateStaff(DEMO_CLINIC_ID, member.id, memberData);
            console.log(`✓ スタッフ更新: ${member.name}`);
          }
        }

        // 保存後にデータを再読み込み
        const reloadedStaff = await getStaff(DEMO_CLINIC_ID);
        const reloadedPriorities = await getStaffUnitPriorities(DEMO_CLINIC_ID);

        setStaff(reloadedStaff);
        setStaffUnitPriorities(reloadedPriorities);

        // シフト表をリフレッシュ
        setRefreshTrigger((prev) => prev + 1);

        // 未保存フラグをクリアし、初期データを更新
        setHasUnsavedChanges(false);
        initialStaffDataRef.current = JSON.parse(JSON.stringify({
          staff: reloadedStaff,
          staffUnitPriorities: reloadedPriorities
        }));

        console.log("スタッフ設定保存完了");

        // 早期リターンして、下のsetHasUnsavedChanges(false)の二重実行を防ぐ
        setShowSaveSuccessModal(true);
        setSaving(false);
        isSavingRef.current = false;
        return;
      } else if (selectedCategory === "shift") {
        console.log("=== シフト設定を保存中 ===");
        // シフトは個別のAPIで管理されているため、ここでは何もしない
        console.log("シフトは個別に保存されています");
      } else if (selectedCategory === "web") {
        console.log("=== Web予約設定を保存中 ===");
        // Web予約設定を保存
        await handleSaveWebSettings();
        return; // handleSaveWebSettingsで完了メッセージを表示するため、ここでreturn
      } else if (selectedCategory === "notification") {
        console.log("=== 通知設定を保存中 ===");
        // 通知設定はnotificationSettings変数から保存
        const response = await fetch("/api/notification-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinic_id: DEMO_CLINIC_ID,
            settings: notificationSettings,
          }),
        });
        if (!response.ok) {
          throw new Error("通知設定の保存に失敗しました");
        }
        console.log("✓ 通知設定保存完了");
      } else if (selectedCategory === "master") {
        console.log("=== マスタ設定を保存中 ===");
        // マスタデータは個別のAPIで管理されているため、ここでは何もしない
        console.log("マスタデータは個別に保存されています");
      } else if (selectedCategory === "subkarte") {
        console.log("=== サブカルテ設定を保存中 ===");
        // サブカルテ設定を保存
        await setClinicSetting(DEMO_CLINIC_ID, "subkarte_settings", {
          defaultTexts: defaultTexts,
        });
        console.log("✓ サブカルテ設定保存完了");
      } else if (selectedCategory === "training") {
        console.log("=== トレーニング設定を保存中 ===");
        // トレーニング設定は個別に管理されているため、ここでは何もしない
        console.log("トレーニング設定は個別に保存されています");
      } else if (selectedCategory === "data-import") {
        console.log("=== データ移行設定を保存中 ===");
        // データ移行はインポート処理のため、保存不要
        console.log("データ移行は保存不要です");
      } else {
        console.warn("⚠ 不明なカテゴリ:", selectedCategory);
        showAlert(`不明なカテゴリです: ${selectedCategory}`, "error");
        setSaving(false);
        return;
      }

      // 保存成功時に該当タブの初期データを更新
      if (selectedCategory === "clinic") {
        initialClinicDataRef.current = JSON.parse(JSON.stringify({
          clinicInfo,
          businessHours,
          breakTimes,
          holidays
        }));
      } else if (selectedCategory === "calendar") {
        initialCalendarDataRef.current = JSON.parse(JSON.stringify({
          displayItems,
          cellHeight
        }));
      } else if (selectedCategory === "web") {
        initialWebDataRef.current = JSON.parse(JSON.stringify({
          webSettings,
          webBookingMenus
        }));
      } else if (selectedCategory === "staff") {
        initialStaffDataRef.current = JSON.parse(JSON.stringify({
          staff,
          staffUnitPriorities
        }));
      } else if (selectedCategory === "treatment") {
        initialMenuDataRef.current = JSON.parse(JSON.stringify({
          treatmentMenus
        }));
      } else if (selectedCategory === "units") {
        initialUnitDataRef.current = JSON.parse(JSON.stringify({
          unitsData,
          staffUnitPriorities
        }));
      } else if (selectedCategory === "notification") {
        initialNotificationDataRef.current = JSON.parse(JSON.stringify({
          notificationSettings
        }));
      } else if (selectedCategory === "master") {
        initialMasterDataRef.current = JSON.parse(JSON.stringify({
          iconMaster,
          staffPositions,
          patientNoteTypes,
          cancelReasons,
          memoTemplates
        }));
      }

      setHasUnsavedChanges(false);
      setShowSaveSuccessModal(true);
    } catch (error) {
      console.error("保存エラー:", error);
      showAlert("保存に失敗しました: " + (error as Error).message, "error");
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };

  // クリニック設定コンテンツ
  const renderClinicSettings = () => (
    <div className="space-y-6">
      {/* サブタブ */}
      <div className="flex space-x-0 mb-6 border-b border-gray-200">
        <button
          onMouseEnter={() => setSelectedClinicTab("info")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedClinicTab === "info"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          医院情報
        </button>
        <button
          onMouseEnter={() => setSelectedClinicTab("hours")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedClinicTab === "hours"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          診療時間
        </button>
      </div>

      {/* 医院情報タブ */}
      {selectedClinicTab === "info" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  クリニック名
                </Label>
                <Input
                  id="name"
                  value={clinicInfo.name}
                  onChange={(e) =>
                    setClinicInfo((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="例: 田中歯科医院"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label
                  htmlFor="website_url"
                  className="text-sm font-medium text-gray-700"
                >
                  ホームページURL
                </Label>
                <Input
                  id="website_url"
                  value={clinicInfo.website_url}
                  onChange={(e) =>
                    setClinicInfo((prev) => ({
                      ...prev,
                      website_url: e.target.value,
                    }))
                  }
                  placeholder="例: https://example.com"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ※ このURLはLINEリッチメニューの「Webサイト」ボタンにも自動的に反映されます
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="postal_code"
                    className="text-sm font-medium text-gray-700"
                  >
                    郵便番号
                  </Label>
                  <Input
                    id="postal_code"
                    value={clinicInfo.postal_code}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                    placeholder="例: 123-4567"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="address_line"
                    className="text-sm font-medium text-gray-700"
                  >
                    住所
                  </Label>
                  <Input
                    id="address_line"
                    value={clinicInfo.address_line}
                    onChange={(e) =>
                      setClinicInfo((prev) => ({
                        ...prev,
                        address_line: e.target.value,
                      }))
                    }
                    placeholder="例: 東京都渋谷区1-2-3 田中ビル 2F"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700"
                >
                  電話番号
                </Label>
                <Input
                  id="phone"
                  value={clinicInfo.phone}
                  onChange={(e) =>
                    setClinicInfo((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="例: 03-1234-5678"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 診療時間タブ */}
      {selectedClinicTab === "hours" && (
        <React.Fragment>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                {WEEKDAYS.map((day) => {
                  const isHoliday = holidays.includes(day.id);
                  const timeSlots = businessHours[day.id]?.timeSlots || [];
                  
                  return (
                    <div
                      key={day.id}
                      className={`flex items-center p-2 rounded-lg border ${
                      isHoliday 
                          ? "bg-gray-50 border-gray-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {/* 曜日名 */}
                      <div className="w-20 flex-shrink-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {day.name}
                        </h4>
                      </div>
                      
                      {/* 休診チェックボックス */}
                      <div className="w-20 flex-shrink-0 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`holiday_${day.id}`}
                          checked={isHoliday}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            console.log(
                              "チェックボックス変更:",
                              day.id,
                              checked,
                            );
                            handleHolidayChange(day.id, checked);
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <Label
                          htmlFor={`holiday_${day.id}`}
                          className="text-xs text-gray-600 cursor-pointer"
                        >
                          休診
                        </Label>
                      </div>
                      
                      {/* 時間枠 */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          {timeSlots.map((slot, index) => (
                            <div
                              key={`${day.id}-${slot.id}`}
                              className={`flex items-center space-x-2 rounded-md px-3 py-2 ${
                                isHoliday ? "bg-gray-100" : "bg-gray-50"
                              }`}
                            >
                              <span
                                className={`text-xs font-medium ${
                                  isHoliday ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {slot.period === "morning" ? "午前" : "午後"}
                              </span>
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day.id,
                                    slot.id,
                                    "start",
                                    e.target.value,
                                  )
                                }
                                disabled={isHoliday}
                                className={`w-24 text-xs ${
                                  isHoliday
                                    ? "border-gray-200 bg-gray-100 text-gray-400"
                                    : "border-gray-200"
                                }`}
                              />
                              <span className="text-gray-400">～</span>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day.id,
                                    slot.id,
                                    "end",
                                    e.target.value,
                                  )
                                }
                                disabled={isHoliday}
                                className={`w-24 text-xs ${
                                  isHoliday
                                    ? "border-gray-200 bg-gray-100 text-gray-400"
                                    : "border-gray-200"
                                }`}
                              />
                              <button
                                onClick={() => removeTimeSlot(day.id, slot.id)}
                                disabled={isHoliday}
                                className={`${
                                  isHoliday
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-400 hover:text-red-500"
                                }`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}

                          {!isHoliday && (
                            <button
                              onClick={() => addTimeSlot(day.id)}
                              className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 border border-dashed border-blue-300 rounded-md hover:bg-blue-50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>追加</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 他の曜日にコピーボタン */}
                      <div className="w-32 flex-shrink-0 flex items-center justify-end">
                        <button
                          onClick={() => openCopyModal(day.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400"
                        >
                          <Copy className="w-3 h-3" />
                          <span>他の曜日へ</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 曜日選択モーダル */}
        <Modal
          isOpen={showCopyModal}
          onClose={() => setShowCopyModal(false)}
          title="コピー先の曜日を選択"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {WEEKDAYS.find(d => d.id === copySourceDay)?.name}の設定をコピーする曜日を選択してください
            </p>
            <div className="space-y-2">
              {WEEKDAYS.filter(day => day.id !== copySourceDay).map((day) => (
                <label
                  key={day.id}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDaysToCopy.includes(day.id)}
                    onChange={() => toggleDaySelection(day.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">{day.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCopyModal(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={applyToSelectedDays}
                disabled={selectedDaysToCopy.length === 0}
              >
                適用 ({selectedDaysToCopy.length}曜日)
              </Button>
            </div>
          </div>
        </Modal>
        </React.Fragment>
      )}
    </div>
  );

  // カレンダー設定コンテンツ
  const renderCalendarSettings = () => (
    <div className="flex gap-6">
      {/* 左側: 設定項目 (60%) */}
      <div className="flex-1 space-y-8" style={{ maxWidth: '60%' }}>
        {/* 1コマの時間 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">1コマの時間</h3>
            <div className="max-w-xs">
              <Select
                value={timeSlotMinutes.toString()}
                onValueChange={(value) => setTimeSlotMinutes(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOT_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* 表示項目 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">表示項目</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DISPLAY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 p-1.5 rounded hover:bg-gray-50"
                >
                  <Checkbox
                    id={item.id}
                    checked={displayItems.includes(item.id)}
                    onCheckedChange={(checked) =>
                      handleDisplayItemChange(item.id, checked as boolean)
                    }
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={item.id}
                      className="text-sm font-medium text-gray-900 cursor-pointer block truncate"
                    >
                      {item.name}
                    </Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* セル表示設定 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">セル表示設定</h3>
            <div className="max-w-md">
              <Label className="text-sm font-medium text-gray-700">
                セルの高さ: {cellHeight}px
              </Label>
              <Slider
                value={[cellHeight]}
                onValueChange={(value) => setCellHeight(value[0])}
                min={20}
                max={80}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右側: プレビュー (40%) */}
      <div className="flex-1" style={{ maxWidth: '40%' }}>
        <div className="sticky top-4">
          <CalendarMiniPreview
            timeSlotMinutes={timeSlotMinutes}
            cellHeight={cellHeight}
            displayItems={displayItems}
          />
        </div>
      </div>
    </div>
  );

  // 診療メニュー設定コンテンツ

  // マスタ設定のハンドラー
  const handleAddPosition = async () => {
    try {
      setSaving(true);
      await createStaffPosition(DEMO_CLINIC_ID, newPosition);

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID);
      setStaffPositions(data);

      setNewPosition({
        name: "",
        sort_order: 0,
        enabled: true,
      });
      setShowAddPosition(false);
    } catch (error) {
      console.error("役職追加エラー:", error);
      const errorMessage =
        error instanceof Error ? error.message : "役職の追加に失敗しました";
      showAlert(`役職の追加に失敗しました: ${errorMessage}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePosition = async (positionId: string, updates: any) => {
    try {
      setSaving(true);
      await updateStaffPosition(DEMO_CLINIC_ID, positionId, updates);

      // データを再読み込み
      const data = await getStaffPositions(DEMO_CLINIC_ID);
      setStaffPositions(data);
    } catch (error) {
      console.error("役職更新エラー:", error);
      showAlert("役職の更新に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    showConfirm("この役職を削除しますか？", async () => {
      try {
        setSaving(true);
        await deleteStaffPosition(DEMO_CLINIC_ID, positionId);

        // データを再読み込み
        const data = await getStaffPositions(DEMO_CLINIC_ID);
        setStaffPositions(data);
      } catch (error) {
        console.error("役職削除エラー:", error);
        showAlert("役職の削除に失敗しました", "error");
      } finally {
        setSaving(false);
      }
    }, { isDanger: true, confirmText: "削除" });
  };

  const handleAddNoteType = async () => {
    try {
      setSaving(true);
      await createPatientNoteType(DEMO_CLINIC_ID, newNoteType);

      // データを再読み込み
      const data = await getPatientNoteTypes(DEMO_CLINIC_ID);
      setPatientNoteTypes(data);

      setNewNoteType({
        name: "",
        description: "",
        sort_order: 0,
        is_active: true,
      });
      setShowAddNoteType(false);
    } catch (error) {
      console.error("ノートタイプ追加エラー:", error);
      showAlert("ノートタイプの追加に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleIconTitleEdit = (iconId: string, newTitle: string) => {
    setIconMaster((prev) =>
      prev.map((icon) =>
        icon.id === iconId ? { ...icon, title: newTitle } : icon,
      ),
    );
  };

  const handleIconToggle = (iconId: string) => {
    setIconMaster((prev) =>
      prev.map((icon) =>
        icon.id === iconId ? { ...icon, enabled: !icon.enabled } : icon,
      ),
    );
  };

  // キャンセル理由追加
  const handleAddCancelReason = async () => {
    try {
      setSaving(true);
      await createCancelReason(DEMO_CLINIC_ID, newCancelReason);

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID);
      setCancelReasons(data);

      setNewCancelReason({
        name: "",
        is_active: true,
      });
      setShowAddCancelReason(false);
    } catch (error) {
      console.error("キャンセル理由追加エラー:", error);
      showAlert("キャンセル理由の追加に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCancelReason = async (reasonId: string, updates: any) => {
    try {
      setSaving(true);
      await updateCancelReason(DEMO_CLINIC_ID, reasonId, updates);

      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID);
      setCancelReasons(data);
    } catch (error) {
      console.error("キャンセル理由更新エラー:", error);
      showAlert("キャンセル理由の更新に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCancelReason = async (reasonId: string) => {
    showConfirm("このキャンセル理由を削除しますか？", async () => {
      try {
        setSaving(true);
        await deleteCancelReason(DEMO_CLINIC_ID, reasonId);

        // データを再読み込み
        const data = await getCancelReasons(DEMO_CLINIC_ID);
        setCancelReasons(data);
      } catch (error) {
        console.error("キャンセル理由削除エラー:", error);
        showAlert("キャンセル理由の削除に失敗しました", "error");
      } finally {
        setSaving(false);
      }
    }, { isDanger: true, confirmText: "削除" });
  };

  const handleEditCancelReason = (reason: any) => {
    console.log("編集開始:", reason);
    setEditingCancelReason(reason);
    setShowEditCancelReason(true);
  };

  // メモテンプレート追加
  const handleAddMemoTemplate = async () => {
    try {
      setSaving(true);
      await createMemoTemplate(DEMO_CLINIC_ID, newMemoTemplate);

      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID);
      setMemoTemplates(data);

      setNewMemoTemplate({
        name: "",
        is_active: true,
      });
      setShowAddMemoTemplate(false);
    } catch (error) {
      console.error("メモテンプレート追加エラー:", error);
      showAlert("メモテンプレートの追加に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMemoTemplate = async (templateId: string, updates: Partial<MemoTemplate>) => {
    try {
      setSaving(true);
      await updateMemoTemplate(DEMO_CLINIC_ID, templateId, updates);

      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID);
      setMemoTemplates(data);
    } catch (error) {
      console.error("メモテンプレート更新エラー:", error);
      showAlert("メモテンプレートの更新に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMemoTemplate = async (templateId: string) => {
    showConfirm("このメモテンプレートを削除しますか？", async () => {
      try {
        setSaving(true);
        await deleteMemoTemplate(DEMO_CLINIC_ID, templateId);

        // データを再読み込み
        const data = await getMemoTemplates(DEMO_CLINIC_ID);
        setMemoTemplates(data);
      } catch (error) {
        console.error("メモテンプレート削除エラー:", error);
        showAlert("メモテンプレートの削除に失敗しました", "error");
      } finally {
        setSaving(false);
      }
    }, { isDanger: true, confirmText: "削除" });
  };

  // メモテンプレートの並び順を更新
  const handleReorderMemoTemplates = async (startIndex: number, endIndex: number) => {
    console.log('並び替え開始:', { startIndex, endIndex });
    console.log('現在のテンプレート:', memoTemplates);

    const result = Array.from(memoTemplates);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    console.log('並び替え後のテンプレート:', result);

    // 楽観的更新
    setMemoTemplates(result);

    try {
      // 各テンプレートの並び順を更新
      for (let i = 0; i < result.length; i++) {
        console.log(`更新中: ${result[i].name} の並び順を ${i} に設定`);
        await updateMemoTemplate(DEMO_CLINIC_ID, result[i].id, {
          sort_order: i
        });
      }

      console.log('並び順更新完了、データを再読み込み');
      // データを再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID);
      console.log('再読み込み後のデータ:', data);
      setMemoTemplates(data);
    } catch (error) {
      console.error("並び順更新エラー:", error);
      showAlert("並び順の更新に失敗しました", "error");
      // エラー時は再読み込み
      const data = await getMemoTemplates(DEMO_CLINIC_ID);
      setMemoTemplates(data);
    }
  };

  const handleSaveEditCancelReason = async () => {
    if (!editingCancelReason) {
      console.error("編集するキャンセル理由がありません");
      return;
    }
    
    console.log("編集保存開始:", editingCancelReason);
    
    try {
      setSaving(true);
      await updateCancelReason(DEMO_CLINIC_ID, editingCancelReason.id, {
        name: editingCancelReason.name,
        is_active: editingCancelReason.is_active,
      });

      console.log("更新完了、データを再読み込み中...");
      // データを再読み込み
      const data = await getCancelReasons(DEMO_CLINIC_ID);
      setCancelReasons(data);

      console.log("編集モーダルを閉じます");
      setShowEditCancelReason(false);
      setEditingCancelReason(null);
    } catch (error) {
      console.error("キャンセル理由更新エラー:", error);
      showAlert("キャンセル理由の更新に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  // スタッフ追加
  const handleAddStaff = () => {
    // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
    const newStaffMember = {
      id: `temp-staff-${Date.now()}`,
      clinic_id: DEMO_CLINIC_ID,
      ...newStaff,
      is_active: true,
      created_at: new Date().toISOString(),
      // position情報を追加（表示用）
      position: staffPositions.find(p => p.id === newStaff.position_id) || null,
    };

    setStaff([...staff, newStaffMember]);

    setNewStaff({
      name: "",
      name_kana: "",
      email: "",
      phone: "",
      role: "staff",
      position_id: "",
    });
    setShowAddStaff(false);
  };

  // スタッフ編集
  const handleUpdateStaff = () => {
    if (!editingStaff) return;

    // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
    // position情報を更新
    const updatedStaff = {
      ...editingStaff,
      position: staffPositions.find(p => p.id === editingStaff.position_id) || editingStaff.position,
    };

    setStaff(
      staff.map((s) =>
        s.id === editingStaff.id ? updatedStaff : s
      )
    );

    setEditingStaff(null);
  };

  const renderMasterSettings = () => (
    <div className="space-y-6">
      {/* サブタブ */}
      <div className="flex space-x-0 border-b border-gray-200">
        <button
          onMouseEnter={() => setSelectedMasterTab("icons")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "icons"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          アイコン
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("staff")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "staff"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          スタッフ
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("files")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "files"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          ファイル
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("cancel")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "cancel"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          キャンセル
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("memo")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "memo"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          メモ
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("documents")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "documents"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          提供文書
        </button>
        <button
          onMouseEnter={() => setSelectedMasterTab("subkarte")}
          className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
            selectedMasterTab === "subkarte"
              ? "border-blue-500 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          サブカルテ
        </button>
      </div>

      {/* アイコンタブのコンテンツ */}
      {selectedMasterTab === "icons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">アイコン</h3>
              <p className="text-sm text-gray-500">
                患者の特記事項を管理します
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {iconMaster.map((icon) => {
              const IconComponent = icon.icon;
              return (
                <div
                  key={icon.id}
                  className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {IconComponent ? (
                        <IconComponent className="w-6 h-6 text-gray-600" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {editingIconId === icon.id ? (
                        <Input
                          value={icon.title}
                          onChange={(e) =>
                            handleIconTitleEdit(icon.id, e.target.value)
                          }
                          onBlur={() => setEditingIconId(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingIconId(null);
                            }
                          }}
                          className="text-sm font-medium"
                          autoFocus
                        />
                      ) : (
                        <span 
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                          onClick={() => setEditingIconId(icon.id)}
                        >
                          {icon.title}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={icon.enabled}
                        onChange={() => handleIconToggle(icon.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => setEditingIconId(icon.id)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* スタッフタブのコンテンツ */}
      {selectedMasterTab === "staff" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">スタッフ</h2>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>役職管理</CardTitle>
                <Button
                  onClick={() => {
                  setNewPosition({
                      name: "",
                    sort_order: staffPositions.length,
                      enabled: true,
                    });
                    setShowAddPosition(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  役職追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPositions.map((position) => (
                  <div
                    key={position.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {position.name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const newName = prompt(
                            "新しい役職名を入力してください:",
                            position.name,
                          );
                          if (newName && newName.trim()) {
                            handleUpdatePosition(position.id, {
                              name: newName.trim(),
                            });
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePosition(position.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {staffPositions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">役職が登録されていません</p>
                    <Button 
                      onClick={() => setShowAddPosition(true)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初の役職を追加
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 役職追加モーダル */}
          {showAddPosition && (
            <Modal
              isOpen={showAddPosition}
              onClose={() => setShowAddPosition(false)}
              title="新しい役職を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="position_name">役職名</Label>
                  <Input
                    id="position_name"
                    value={newPosition.name}
                    onChange={(e) =>
                      setNewPosition((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="例: 歯科医師"
                  />
                </div>
                
                <div>
                  <Label htmlFor="position_sort_order">並び順</Label>
                  <Input
                    id="position_sort_order"
                    type="number"
                    value={newPosition.sort_order}
                    onChange={(e) =>
                      setNewPosition((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="position_enabled"
                    checked={newPosition.enabled}
                    onCheckedChange={(checked) =>
                      setNewPosition((prev) => ({
                        ...prev,
                        enabled: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="position_enabled">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPosition(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddPosition}
                    disabled={saving || !newPosition.name.trim()}
                  >
                    {saving ? "追加中..." : "追加"}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ファイルタブのコンテンツ */}
      {selectedMasterTab === "files" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                患者ノートタイプ
              </h3>
              <p className="text-sm text-gray-500">
                患者ノートの分類を管理します
              </p>
            </div>
            <Button onClick={() => setShowAddNoteType(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {patientNoteTypes.map((noteType) => (
              <div
                key={noteType.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {noteType.name}
                  </div>
                  {noteType.description && (
                    <div className="text-sm text-gray-500">
                      {noteType.description}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    並び順: {noteType.sort_order} | ステータス:{" "}
                    {noteType.is_active ? "有効" : "無効"}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={noteType.is_active}
                    onChange={(e) => {
                      updatePatientNoteType(DEMO_CLINIC_ID, noteType.id, {
                        is_active: e.target.checked,
                      }).then(() => {
                        const data = getPatientNoteTypes(DEMO_CLINIC_ID);
                        data.then((d) => setPatientNoteTypes(d));
                      });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      showConfirm("このノートタイプを削除しますか？", () => {
                        deletePatientNoteType(DEMO_CLINIC_ID, noteType.id).then(
                          () => {
                            const data = getPatientNoteTypes(DEMO_CLINIC_ID);
                            data.then((d) => setPatientNoteTypes(d));
                          },
                        );
                      }, { isDanger: true, confirmText: "削除" });
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {patientNoteTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">ノートタイプが登録されていません</p>
              </div>
            )}
          </div>

          {/* ノートタイプ追加モーダル */}
          {showAddNoteType && (
            <Modal
              isOpen={showAddNoteType}
              onClose={() => setShowAddNoteType(false)}
              title="新しいノートタイプを追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note_type_name">ノートタイプ名</Label>
                  <Input
                    id="note_type_name"
                    value={newNoteType.name}
                    onChange={(e) =>
                      setNewNoteType((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="例: 診療メモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_description">説明</Label>
                  <Input
                    id="note_type_description"
                    value={newNoteType.description}
                    onChange={(e) =>
                      setNewNoteType((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="例: 診療内容のメモ"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note_type_sort_order">並び順</Label>
                  <Input
                    id="note_type_sort_order"
                    type="number"
                    value={newNoteType.sort_order}
                    onChange={(e) =>
                      setNewNoteType((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="note_type_active"
                    checked={newNoteType.is_active}
                    onCheckedChange={(checked) =>
                      setNewNoteType((prev) => ({
                        ...prev,
                        is_active: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="note_type_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddNoteType(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddNoteType}
                    disabled={saving || !newNoteType.name.trim()}
                  >
                    {saving ? "追加中..." : "追加"}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* キャンセルタブのコンテンツ */}
      {selectedMasterTab === "cancel" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                キャンセル理由
              </h3>
              <p className="text-sm text-gray-500">
                予約キャンセル時の理由を管理します
              </p>
            </div>
            <Button onClick={() => setShowAddCancelReason(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {cancelReasons.map((reason) => (
              <div
                key={reason.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{reason.name}</div>
                  <div className="text-sm text-gray-500">
                    ステータス: {reason.is_active ? "有効" : "無効"}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={reason.is_active}
                    onChange={(e) => {
                      handleUpdateCancelReason(reason.id, {
                        is_active: e.target.checked,
                      });
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleEditCancelReason(reason)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCancelReason(reason.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {cancelReasons.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">キャンセル理由が登録されていません</p>
                <Button 
                  onClick={() => setShowAddCancelReason(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初のキャンセル理由を追加
                </Button>
              </div>
            )}
          </div>

          {/* キャンセル理由追加モーダル */}
          {showAddCancelReason && (
            <Modal
              isOpen={showAddCancelReason}
              onClose={() => setShowAddCancelReason(false)}
              title="新しいキャンセル理由を追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cancel_reason_name">キャンセル理由名</Label>
                  <Input
                    id="cancel_reason_name"
                    value={newCancelReason.name}
                    onChange={(e) =>
                      setNewCancelReason((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="例: 無断キャンセル"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cancel_reason_active"
                    checked={newCancelReason.is_active}
                    onCheckedChange={(checked) =>
                      setNewCancelReason((prev) => ({
                        ...prev,
                        is_active: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="cancel_reason_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddCancelReason(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddCancelReason}
                    disabled={saving || !newCancelReason.name.trim()}
                  >
                    {saving ? "追加中..." : "追加"}
                  </Button>
                </div>
              </div>
            </Modal>
          )}

          {/* キャンセル理由編集モーダル */}
          {showEditCancelReason && editingCancelReason && (
            <Modal
              isOpen={showEditCancelReason}
              onClose={() => {
                setShowEditCancelReason(false);
                setEditingCancelReason(null);
              }}
              title="キャンセル理由を編集"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_cancel_reason_name">
                    キャンセル理由名
                  </Label>
                  <Input
                    id="edit_cancel_reason_name"
                    value={editingCancelReason.name}
                    onChange={(e) => {
                      console.log("名前変更:", e.target.value);
                      setEditingCancelReason((prev) =>
                        prev ? { ...prev, name: e.target.value } : null,
                      );
                    }}
                    placeholder="例: 無断キャンセル"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit_cancel_reason_active"
                    checked={editingCancelReason.is_active}
                    onCheckedChange={(checked) =>
                      setEditingCancelReason((prev) =>
                        prev
                          ? { ...prev, is_active: checked as boolean }
                          : null,
                      )
                    }
                  />
                  <Label htmlFor="edit_cancel_reason_active">有効</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditCancelReason(false);
                      setEditingCancelReason(null);
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSaveEditCancelReason}
                    disabled={saving || !editingCancelReason.name.trim()}
                  >
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* メモタブのコンテンツ */}
      {selectedMasterTab === "memo" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">メモテンプレート</h3>
              <p className="text-sm text-gray-500">予約メモで使用するテンプレートを管理します</p>
            </div>
            <Button onClick={() => setShowAddMemoTemplate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規追加
            </Button>
          </div>

          <div className="space-y-3">
            {memoTemplates.map((template, index) => (
              <div
                key={template.id}
                draggable
                onDragStart={(e) => {
                  console.log('ドラッグ開始:', index);
                  setDraggedTemplateIndex(index);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('ドロップ:', { from: draggedTemplateIndex, to: index });
                  if (draggedTemplateIndex !== null && draggedTemplateIndex !== index) {
                    handleReorderMemoTemplates(draggedTemplateIndex, index);
                  }
                  setDraggedTemplateIndex(null);
                }}
                onDragEnd={() => {
                  console.log('ドラッグ終了');
                  setDraggedTemplateIndex(null);
                }}
                className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg cursor-move ${
                  draggedTemplateIndex === index ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                  <div className="font-medium text-gray-900">{template.name}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={template.is_active}
                    onChange={(e) => {
                      handleUpdateMemoTemplate(template.id, { is_active: e.target.checked })
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newName = prompt('新しいテンプレート名を入力してください:', template.name)
                      if (newName && newName.trim()) {
                        handleUpdateMemoTemplate(template.id, {
                          name: newName.trim()
                        })
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMemoTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {memoTemplates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">メモテンプレートが登録されていません</p>
                <Button
                  onClick={() => setShowAddMemoTemplate(true)}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  最初のメモテンプレートを追加
                </Button>
              </div>
            )}
          </div>

          {/* メモテンプレート追加モーダル */}
          {showAddMemoTemplate && (
            <Modal
              isOpen={showAddMemoTemplate}
              onClose={() => setShowAddMemoTemplate(false)}
              title="新しいメモテンプレートを追加"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="memo_template_name">テンプレート名</Label>
                  <Input
                    id="memo_template_name"
                    value={newMemoTemplate.name}
                    onChange={(e) => setNewMemoTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例: 初診"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="memo_template_active"
                    checked={newMemoTemplate.is_active}
                    onCheckedChange={(checked) => setNewMemoTemplate(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="memo_template_active">有効</Label>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddMemoTemplate(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleAddMemoTemplate}
                    disabled={saving || !newMemoTemplate.name.trim()}
                  >
                    {saving ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* 提供文書タブのコンテンツ */}
      {selectedMasterTab === "documents" && (
        <DocumentTemplatesManager />
      )}

      {selectedMasterTab === "subkarte" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              デフォルトテキスト管理
            </h2>

            <div className="space-y-4">
              {defaultTexts.map((text) => (
                <div
                  key={text.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {text.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        作成日:{" "}
                        {new Date(text.createdAt).toLocaleDateString("ja-JP")}
                        {text.updatedAt !== text.createdAt && (
                          <span className="ml-2">
                            更新日:{" "}
                            {new Date(text.updatedAt).toLocaleDateString(
                              "ja-JP",
                            )}
                          </span>
                        )}
                      </p>
                      <div className="mt-2 bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                        {text.content}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditDefaultText(text)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDefaultText(text.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {defaultTexts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  デフォルトテキストがありません
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowAddDefaultTextModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                新規追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTreatmentSettings = () => (
    <div className="space-y-6">
      {/* 上部ナビゲーションバー */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button 
                onMouseEnter={() => setSelectedTab("menu1")}
                className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center ${
                    selectedTab === "menu1" ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 ${
                      selectedTab === "menu1"
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  />
                      </div>
                <span
                  className={`font-medium text-xs ${
                    selectedTab === "menu1" ? "text-blue-600" : "text-gray-600"
                  }`}
                >
                  メニュー1
                </span>
              </button>
                    </div>
            
            <button 
              onMouseEnter={() => setSelectedTab("menu2")}
              className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
            >
              <div
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  selectedTab === "menu2" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <FolderOpen
                  className={`w-4 h-4 ${
                    selectedTab === "menu2" ? "text-blue-600" : "text-gray-600"
                  }`}
                />
                  </div>
              <span
                className={`font-medium text-xs ${
                  selectedTab === "menu2" ? "text-blue-600" : "text-gray-600"
                }`}
              >
                  メニュー2
                </span>
            </button>
            
            <button 
              onMouseEnter={() => setSelectedTab("submenu")}
              className="flex items-center space-x-1 hover:bg-gray-50 p-1.5 rounded transition-colors"
            >
              <div
                className={`w-6 h-6 rounded flex items-center justify-center ${
                  selectedTab === "submenu" ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <Tag
                  className={`w-4 h-4 ${
                    selectedTab === "submenu"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <span
                className={`font-medium text-xs ${
                  selectedTab === "submenu" ? "text-blue-600" : "text-gray-600"
                }`}
              >
                  サブメニュー
                </span>
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-y-auto bg-white flex items-center justify-start">
        <div className="p-4 w-full max-w-2xl">
          {/* タブに応じたメニュー一覧（階層表示） */}
          <div className="space-y-1">
            <div className="space-y-1">
              {getFilteredTreatmentMenus().map((menu) => (
                <div key={`root-${menu.id}`}>{renderMenuItem(menu, 0)}</div>
              ))}

              {/* メニュー-1を追加ボタン */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParentMenuForChild(null);
                    setUseParentColor(true);
                    setNewTreatmentMenu((prev) => ({
                      ...prev,
                      level: 1,
                      color: "#3B82F6",
                    }));
                    setShowTreatmentAddForm(true);
                  }}
                  className="flex items-center space-x-2 text-sm px-4 py-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>メニュー1を追加</span>
                </Button>
              </div>
            </div>
          </div>

          {/* メニュー追加モーダル */}
          {showTreatmentAddForm && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => {
                setShowTreatmentAddForm(false);
                setParentMenuForChild(null);
                setUseParentColor(true);
                setNewTreatmentMenu({
                  name: "",
                  level:
                    selectedTab === "menu1"
                      ? 1
                      : selectedTab === "menu2"
                        ? 2
                        : 3,
                  parent_id: "",
                  standard_duration: 30,
                  color: "#3B82F6",
                  sort_order: 0,
                });
              }}
            >
              <div 
                className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">
                  {parentMenuForChild
                    ? `「${parentMenuForChild.name}」の子メニューを追加`
                    : selectedTab === "menu1"
                      ? "新しいメニュー-1を追加"
                      : selectedTab === "menu2"
                        ? "新しいメニュー-2を追加"
                        : "新しいサブメニューを追加"}
                </h3>
                
                <div className="space-y-4">
              <div>
                    <Label htmlFor="modal_menu_name">メニュー名</Label>
                <Input
                      id="modal_menu_name"
                      value={newTreatmentMenu.name}
                      onChange={(e) =>
                        setNewTreatmentMenu((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                  placeholder="例: 虫歯治療"
                      className="mt-1"
                />
              </div>
                  
              <div>
                    <Label htmlFor="modal_standard_duration">
                      標準時間（分）
                    </Label>
                    <Input
                      id="modal_standard_duration"
                      type="number"
                      value={newTreatmentMenu.standard_duration}
                      onChange={(e) =>
                        setNewTreatmentMenu((prev) => ({
                          ...prev,
                          standard_duration: parseInt(e.target.value),
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modal_menu_color">色</Label>
                    {parentMenuForChild && (
                      <div className="flex items-center space-x-2 mt-2 mb-2">
                        <Checkbox
                          id="use_parent_color"
                          checked={useParentColor}
                          onCheckedChange={(checked) => {
                            setUseParentColor(checked as boolean);
                            if (checked && parentMenuForChild) {
                              setNewTreatmentMenu((prev) => ({
                                ...prev,
                                color: parentMenuForChild.color || "#3B82F6",
                              }));
                            }
                          }}
                        />
                        <Label
                          htmlFor="use_parent_color"
                          className="text-sm flex items-center space-x-2 cursor-pointer"
                        >
                          <span>親メニューの色を使用</span>
                          {parentMenuForChild.color && (
                            <div
                              className="w-5 h-5 rounded border border-gray-300"
                              style={{
                                backgroundColor: parentMenuForChild.color,
                              }}
                            />
                          )}
                        </Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="modal_menu_color"
                        type="color"
                        value={newTreatmentMenu.color}
                        onChange={(e) => {
                          setNewTreatmentMenu((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }));
                          setUseParentColor(false);
                        }}
                        disabled={useParentColor && parentMenuForChild}
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={newTreatmentMenu.color}
                        onChange={(e) => {
                          setNewTreatmentMenu((prev) => ({
                            ...prev,
                            color: e.target.value,
                          }));
                          setUseParentColor(false);
                        }}
                        disabled={useParentColor && parentMenuForChild}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTreatmentAddForm(false);
                      setParentMenuForChild(null);
                      setUseParentColor(true);
                      setNewTreatmentMenu({
                        name: "",
                        level:
                          selectedTab === "menu1"
                            ? 1
                            : selectedTab === "menu2"
                              ? 2
                              : 3,
                        parent_id: "",
                        standard_duration: 30,
                        color: "#3B82F6",
                        sort_order: 0,
                      });
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={
                      parentMenuForChild
                        ? handleAddChildMenu
                        : handleAddTreatmentMenu
                    }
                    disabled={saving || !newTreatmentMenu.name}
                  >
                    {saving ? "追加中..." : "追加"}
                  </Button>
              </div>
            </div>
            </div>
          )}

          {/* 編集モーダル */}
          {editingTreatmentMenu && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setEditingTreatmentMenu(null)}
            >
              <div 
                className="bg-white rounded-lg p-6 w-96 max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4">メニューを編集</h3>
                
                <div className="space-y-4">
              <div>
                    <Label htmlFor="modal_edit_name">メニュー名</Label>
                <Input
                      id="modal_edit_name"
                      value={editingTreatmentMenu.name}
                      onChange={(e) =>
                        setEditingTreatmentMenu((prev: any) =>
                          prev ? { ...prev, name: e.target.value } : null,
                        )
                      }
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="modal_edit_duration">標準時間（分）</Label>
                    <Input
                      id="modal_edit_duration"
                  type="number"
                      value={editingTreatmentMenu.standard_duration || 30}
                      onChange={(e) =>
                        setEditingTreatmentMenu((prev: any) =>
                          prev
                            ? {
                                ...prev,
                                standard_duration: parseInt(e.target.value),
                              }
                            : null,
                        )
                      }
                      className="mt-1"
                />
              </div>
                  
              <div>
                    <Label htmlFor="modal_edit_color">色</Label>
                    <div className="flex items-center space-x-2 mt-1">
                <Input
                        id="modal_edit_color"
                  type="color"
                        value={editingTreatmentMenu.color || "#3B82F6"}
                        onChange={(e) =>
                          setEditingTreatmentMenu((prev: any) =>
                            prev ? { ...prev, color: e.target.value } : null,
                          )
                        }
                        className="w-12 h-8 p-1"
                      />
                      <Input
                        value={editingTreatmentMenu.color || "#3B82F6"}
                        onChange={(e) =>
                          setEditingTreatmentMenu((prev: any) =>
                            prev ? { ...prev, color: e.target.value } : null,
                          )
                        }
                        placeholder="#3B82F6"
                        className="flex-1"
                />
              </div>
            </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                    onClick={() => setEditingTreatmentMenu(null)}
              >
                キャンセル
              </Button>
              <Button
                    onClick={() =>
                      editingTreatmentMenu &&
                      handleEditTreatmentMenu(editingTreatmentMenu)
                    }
                    disabled={saving}
                  >
                    {saving ? "保存中..." : "保存"}
              </Button>
            </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 診療メニュー関連の関数
  const handleAddTreatmentMenu = async () => {
    try {
      setSaving(true);

      // 選択されたタブに応じてレベルを設定
      const menuData = {
        ...newTreatmentMenu,
        id: `temp-${Date.now()}`, // 一時的なID
        level: selectedTab === "menu1" ? 1 : selectedTab === "menu2" ? 2 : 3,
        parent_id: newTreatmentMenu.parent_id || null, // nullに統一
        is_active: true,
        clinic_id: DEMO_CLINIC_ID,
      };

      console.log("メニュー追加（ローカルのみ）:", menuData);

      // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
      setTreatmentMenus((prev) => [...prev, menuData]);

      setNewTreatmentMenu({
        name: "",
        level: selectedTab === "menu1" ? 1 : selectedTab === "menu2" ? 2 : 3,
        parent_id: "",
        standard_duration: 30,
        color: "#3B82F6",
        sort_order: 0,
      });
      setUseParentColor(true);
      setShowTreatmentAddForm(false);
    } catch (error) {
      console.error("メニュー追加エラー:", error);
      showAlert("メニューの追加に失敗しました: " + (error as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  // 子メニュー作成用の関数
  const handleAddChildMenu = async () => {
    try {
      setSaving(true);

      if (!parentMenuForChild) return;

      // 親メニューのレベルに基づいて子メニューのレベルを決定
      const childLevel = parentMenuForChild.level + 1;
      if (childLevel > 3) {
        showAlert("最大3階層までしか作成できません", "error");
        setSaving(false);
        return;
      }

      const menuData = {
        ...newTreatmentMenu,
        id: `temp-${Date.now()}`, // 一時的なID
        level: childLevel,
        parent_id: parentMenuForChild.id,
        standard_duration: newTreatmentMenu.standard_duration || 30,
        is_active: true,
        clinic_id: DEMO_CLINIC_ID,
      };

      console.log("子メニュー追加（ローカルのみ）:", menuData);

      // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
      setTreatmentMenus((prev) => [...prev, menuData]);

      setNewTreatmentMenu({
        name: "",
        level: childLevel,
        parent_id: "",
        standard_duration: 30,
        color: "#3B82F6",
        sort_order: 0,
      });
      setParentMenuForChild(null);
      setUseParentColor(true);
      setShowTreatmentAddForm(false);
    } catch (error) {
      console.error("子メニュー追加エラー:", error);
      console.error("エラーの詳細:", error);
      showAlert("子メニューの追加に失敗しました: " + (error as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTreatmentMenu = async (menu: any) => {
    try {
      setSaving(true);

      // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
      setTreatmentMenus((prev) =>
        prev.map((m) => (m.id === menu.id ? menu : m))
      );
      setEditingTreatmentMenu(null);
    } catch (error) {
      console.error("メニュー編集エラー:", error);
      showAlert("メニューの編集に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTreatmentMenu = async (menuId: string) => {
    // カスタムモーダルを表示
    setDeletingMenuId(menuId);
    setShowDeleteConfirmModal(true);
  };

  // 削除確認モーダルでの削除実行
  const confirmDeleteTreatmentMenu = async () => {
    if (!deletingMenuId) return;

    try {
      setSaving(true);

      // APIを呼ばず、ローカル状態のみ更新（保存ボタンで一括保存）
      // 削除フラグを立てる（実際の削除は保存時）
      setTreatmentMenus((prev) =>
        prev.map((m) =>
          m.id === deletingMenuId ? { ...m, _deleted: true } : m
        )
      );

      // モーダルを閉じる
      setShowDeleteConfirmModal(false);
      setDeletingMenuId(null);
    } catch (error) {
      console.error("メニュー削除エラー:", error);
      showAlert("メニューの削除に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  };

  // タブに応じたメニューのフィルタリング（階層構造で表示）
  const getFilteredTreatmentMenus = () => {
    // 削除フラグが立っているメニューを除外
    const allMenus = treatmentMenus.filter(m => !m._deleted);
    
    // レベル1のメニューを取得し、子メニューを追加
    const buildHierarchy = (
      menus: any[],
      parentId: string | null = null,
    ): any[] => {
      return menus
        .filter((menu) => {
          // parent_idがnull、undefined、空文字列のいずれかの場合、ルートメニューとみなす
          const menuParentId = menu.parent_id || null;
          return menuParentId === parentId;
        })
        .map((menu) => ({
          ...menu,
          children: buildHierarchy(menus, menu.id),
        }));
    };
    
    switch (selectedTab) {
      case "menu1":
        return buildHierarchy(allMenus, null);
      case "menu2":
        // レベル1のメニューのみ表示（子メニューも含む）
        return buildHierarchy(allMenus, null);
      case "submenu":
        // 全てのメニューを階層表示
        return buildHierarchy(allMenus, null);
      default:
        return buildHierarchy(allMenus, null);
    }
  };

  // 展開・収縮のトグル関数
  const toggleMenuExpansion = (menuId: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };

  // メニューアイテムのレンダリング（階層表示）
  const renderMenuItem = (menu: any, level: number = 0) => {
    const indent = level * 24;
    const isParent = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);
    
    return (
      <div key={menu.id}>
        <div 
          className="border rounded-lg p-3 mb-1 bg-white"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer flex-1"
              onClick={() => isParent && toggleMenuExpansion(menu.id)}
            >
              {isParent && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronRight className="w-3 h-3 rotate-90 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  )}
                </div>
              )}
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: menu.color }}
              />
              <div>
                <div className="font-medium">{menu.name}</div>
                <div className="text-sm text-gray-500">
                  {menu.standard_duration}分
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {menu.level < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setParentMenuForChild(menu);
                    setUseParentColor(true);
                    setNewTreatmentMenu({
                      name: "",
                      level: menu.level + 1,
                      parent_id: menu.id,
                      standard_duration: 30,
                      color: menu.color || "#3B82F6",
                      sort_order: 0,
                    });
                    setShowTreatmentAddForm(true);
                  }}
                  className="text-green-600 hover:text-green-700"
                  title="子メニューを追加"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingTreatmentMenu(menu)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTreatmentMenu(menu.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
          </Button>
            </div>
          </div>
        </div>
        
        {/* 子メニューを階層表示（展開時のみ） */}
        {isParent && isExpanded && (
          <div className="ml-4">
            {menu.children.map((child: any) => (
              <div key={`${child.id}-${level + 1}`}>
                {renderMenuItem(child, level + 1)}
              </div>
            ))}
        </div>
      )}
    </div>
    );
  };

  // 患者用URLの生成（問診票専用）
  const getPatientUrl = (questionnaireId?: string) => {
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    return questionnaireId
      ? `${baseUrl}/questionnaire/${questionnaireId}`
      : `${baseUrl}/questionnaire`;
  };

  // URLをクリップボードにコピー
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showAlert("URLをクリップボードにコピーしました", "success");
    } catch (error) {
      console.error("コピーに失敗しました:", error);
      // フォールバック: テキストエリアを使用
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showAlert("URLをクリップボードにコピーしました", "success");
    }
  };

  // ユニット設定のレンダリング
  const renderUnitsSettings = () => {
    return (
      <div className="space-y-6">
        {/* タブ */}
        <div className="flex space-x-0 mb-6 border-b border-gray-200">
          <button
            onMouseEnter={() => setUnitsActiveTab("units")}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              unitsActiveTab === "units"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <RockingChair className="w-4 h-4 inline mr-2" />
            ユニット管理
          </button>
          <button
            onMouseEnter={() => setUnitsActiveTab("priorities")}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              unitsActiveTab === "priorities"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            スタッフ優先順位
          </button>
        </div>

        {/* ユニット管理タブ */}
        {unitsActiveTab === "units" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {unitsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      ユニットが登録されていません
                    </div>
                  ) : (
                    unitsData
                      .filter((u) => !u._deleted)
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((unit, index) => (
                        <div
                          key={unit.id}
                          draggable={true}
                          onDragStart={() => setDraggedUnitIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropUnit(index)}
                          onDragEnd={() => setDraggedUnitIndex(null)}
                          className={`flex items-center justify-between p-4 rounded-lg cursor-move transition-all ${
                            draggedUnitIndex === index
                              ? 'opacity-50 bg-blue-50 border-2 border-blue-300 scale-95'
                              : draggedUnitIndex !== null
                              ? 'bg-white border-2 border-dashed border-blue-300 hover:bg-blue-50'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <RockingChair className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {unit.name}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUnit(unit);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUnit(unit);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                  
                  {/* 新規追加ボタン */}
                  <div className="pt-3">
                    <Button 
                      onClick={() => setShowUnitModal(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      新規追加
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* スタッフ優先順位タブ */}
        {unitsActiveTab === "priorities" && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {unitsData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      ユニットが登録されていません
                    </div>
                  ) : (
                    unitsData.map((unit) => (
                      <div
                        key={unit.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <RockingChair className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {unit.name}
                          </h3>
                        </div>
                        
                        {/* このユニットのスタッフ優先順位 */}
                        <div className="space-y-2">
                          {staffUnitPriorities
                            .filter((priority) => priority.unit_id === unit.id)
                            .sort((a, b) => a.priority_order - b.priority_order)
                            .map((priority, index) => (
                              <div
                                key={priority.id}
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(e, priority)
                                }
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, priority)}
                                className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:bg-gray-50"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-blue-600">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {priority.staff?.name}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleDeletePriority(priority.id)
                                  }
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          
                          {/* 未割り当てスタッフ */}
                          <div className="mt-4">
                            <Label className="text-sm font-medium text-gray-700">
                              未割り当てスタッフ
                            </Label>
                            <div className="space-y-2 mt-2">
                              {staff
                                .filter(
                                  (s) =>
                                    !staffUnitPriorities.some(
                                      (p) =>
                                        p.unit_id === unit.id &&
                                        p.staff_id === s.id,
                                    ),
                                )
                                .map((staffMember) => (
                                  <div
                                    key={staffMember.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                  >
                                    <div className="font-medium text-gray-700">
                                      {staffMember.name}
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        console.log("Add button clicked:", {
                                          unitId: unit.id,
                                          staffId: staffMember.id,
                                        });
                                        handleAddStaffToUnit(
                                          unit.id,
                                          staffMember.id,
                                        );
                                      }}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      追加
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ユニット編集モーダル */}
        {showUnitModal && (
          <Modal isOpen={showUnitModal} onClose={() => setShowUnitModal(false)}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingUnit ? "ユニット編集" : "ユニット新規作成"}
                </h3>
                <button
                  onClick={() => setShowUnitModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit-name">ユニット名</Label>
                  <Input
                    id="unit-name"
                    value={unitFormData.name}
                    onChange={(e) =>
                      setUnitFormData({ ...unitFormData, name: e.target.value })
                    }
                    placeholder="ユニット名を入力"
                  />
                </div>
                
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUnitModal(false)}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleSaveUnit}
                  disabled={saving || !unitFormData.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "保存中..." : "保存"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // 問診票設定のレンダリング
  const renderQuestionnaireSettings = () => {
    return (
      <div className="p-6">
        {/* サブタブナビゲーション */}
        <div className="flex space-x-0 mb-6 border-b border-gray-200">
          <button
            onMouseEnter={() => setQuestionnaireTab("basic")}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              questionnaireTab === "basic"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            基本設定
          </button>
          <button
            onMouseEnter={() => setQuestionnaireTab("list")}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              questionnaireTab === "list"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            一覧
          </button>
          <button
            onMouseEnter={() => setQuestionnaireTab("link-status")}
            className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
              questionnaireTab === "link-status"
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            連携状況
          </button>
        </div>

        {/* タブコンテンツ */}
        {questionnaireTab === "basic" && (
          <div className="max-w-4xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>問診票の利用設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="use-questionnaire"
                      checked={useQuestionnaire}
                      onCheckedChange={(checked) => {
                        setUseQuestionnaire(checked as boolean);
                        setHasUnsavedChanges(true);
                      }}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="use-questionnaire"
                        className="text-base font-medium cursor-pointer"
                      >
                        問診票を利用する
                      </Label>
                      <p className="text-sm text-gray-600">
                        問診票機能を有効にします。チェックを入れると、患者さんに問診票を送信して回答を受け取ることができます。
                      </p>
                    </div>
                  </div>

                  {useQuestionnaire && (
                    <div className="ml-7 pl-6 border-l-2 border-blue-200 space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                              本登録について
                            </h3>
                            <div className="mt-2 text-sm text-blue-700">
                              <p>
                                問診票を利用する場合、仮登録患者は問診票と連携することで自動的に本登録されます。
                              </p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>問診票回答後、連携ボタンをクリック</li>
                                <li>患者情報が自動入力されます</li>
                                <li>診察券番号が自動採番されます</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!useQuestionnaire && (
                    <div className="ml-7 pl-6 border-l-2 border-gray-200 space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-800">
                              問診票なしの場合
                            </h3>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>
                                問診票を利用しない場合、以下の方法で本登録を行います：
                              </p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>直接本登録</strong>：患者情報を入力して直接本登録</li>
                                <li><strong>カルテ連携</strong>：カルテシステムと連携して本登録（今後実装予定）</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {questionnaireTab === "list" && (
          <div className="grid grid-cols-2 gap-6">
            {/* 左カラム：問診表一覧 */}
            <div className="space-y-4">
              {/* 新規作成ボタン（枠外） */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setSelectedQuestionnaire(null);
                    setShowQuestionnaireModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新しい問診票を作成
                </Button>
              </div>

              {/* 問診表一覧の枠 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {questionnaires.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>問診票が登録されていません</p>
                    <p className="text-sm mt-2">
                      「新しい問診票を作成」ボタンから問診票を追加してください
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questionnaires.map((questionnaire) => (
                      <div
                        key={questionnaire.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-lg font-medium text-gray-900 mr-3">
                                {questionnaire.name}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                questionnaire.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {questionnaire.is_active ? "有効" : "無効"}
                              </span>
                            </div>
                            {questionnaire.description && (
                              <p className="text-sm text-gray-600 mt-1">{questionnaire.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {/* 問診票URLコピーボタン */}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(getPatientUrl(questionnaire.id))}
                              title="URLをコピー"
                            >
                              <Link2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setPreviewQuestionnaireId(questionnaire.id);
                              }}
                              title="プレビュー"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedQuestionnaire(questionnaire);
                                setShowQuestionnaireModal(true);
                              }}
                              title="編集"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {/* システム問診票は削除不可 */}
                            {!['標準問診表', '習慣チェック表', '習慣チェック表 簡潔'].includes(questionnaire.name) && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                  showConfirm("この問診票を削除しますか？", () => {
                                    handleDeleteQuestionnaire(questionnaire.id);
                                  }, { isDanger: true, confirmText: "削除" });
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右カラム：プレビューエリア */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {previewQuestionnaireId ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">プレビュー</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewQuestionnaireId(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                  <QuestionnaireForm
                    clinicId={DEMO_CLINIC_ID}
                    questionnaireId={previewQuestionnaireId}
                    onCancel={() => {}}
                    onSave={() => {}}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Eye className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">プレビュー</p>
                <p className="text-sm mt-2">問診表の👁アイコンをクリックすると</p>
                <p className="text-sm">ここにプレビューが表示されます</p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* 連携状況タブ */}
        {questionnaireTab === "link-status" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  連携状況
                </h3>
              </div>
              
              {/* フィルタ・検索 */}
              <div className="mb-6 space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="患者名で検索..."
                      value={linkStatusFilters.searchName}
                      onChange={(e) => setLinkStatusFilters({
                        ...linkStatusFilters,
                        searchName: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select 
                    value={linkStatusFilters.linkStatus}
                    onChange={(e) => setLinkStatusFilters({
                      ...linkStatusFilters,
                      linkStatus: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">連携状態</option>
                    <option value="unlinked">未連携</option>
                    <option value="linked">連携済み</option>
                  </select>
                  <select 
                    value={linkStatusFilters.questionnaireId}
                    onChange={(e) => setLinkStatusFilters({
                      ...linkStatusFilters,
                      questionnaireId: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">問診表</option>
                    {questionnaires.map((q) => (
                      <option key={q.id} value={q.id}>{q.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 患者一覧（未連携） */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  未連携患者 ({linkStatusData.unlinkedPatients.length}件)
                </h4>
                <div className="space-y-3">
                  {linkStatusData.unlinkedPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>未連携の患者はありません</p>
                    </div>
                  ) : (
                    linkStatusData.unlinkedPatients.map((patient: any) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h5 className="text-md font-medium text-gray-900 mr-3">
                                {patient.last_name} {patient.first_name}
                              </h5>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                未連携
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {patient.questionnaire_responses && patient.questionnaire_responses.length > 0 ? (
                                <>
                                  {patient.questionnaire_responses[0].questionnaires?.name} -
                                  回答完了: {new Date(patient.questionnaire_responses[0].completed_at).toLocaleDateString('ja-JP')}
                                </>
                              ) : (
                                '問診表未回答'
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLinkPatient(patient.id)}
                              className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                              連携
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 患者一覧（連携済み） */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">
                  連携済み患者 ({linkStatusData.linkedPatients.length}件)
                </h4>
                <div className="space-y-3">
                  {linkStatusData.linkedPatients.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>連携済みの患者はありません</p>
                    </div>
                  ) : (
                    linkStatusData.linkedPatients.map((patient: any) => (
                      <div key={patient.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h5 className="text-md font-medium text-gray-900 mr-3">
                                {patient.last_name} {patient.first_name}
                              </h5>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                連携済み
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              患者番号: {patient.patient_number || 'なし'}
                              {patient.questionnaire_responses && patient.questionnaire_responses.length > 0 && (
                                <>
                                  {' '}| {patient.questionnaire_responses[0].questionnaires?.name} -
                                  回答完了: {new Date(patient.questionnaire_responses[0].completed_at).toLocaleDateString('ja-JP')}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnlinkPatient(patient.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              連携解除
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    );
  };

  // トレーニング設定のレンダリング
  const renderTrainingSettings = () => {
    const trainingSubTabs = [
      { id: 'patients', name: '患者管理', icon: '👤' },
      { id: 'trainings', name: 'トレーニング一覧', icon: '🏋️' },
      { id: 'analytics', name: '分析', icon: '📊' },
    ];

    return (
      <div className="space-y-6">
        {/* サブタブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {trainingSubTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTrainingSubTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  trainingSubTab === tab.id
                    ? 'border-dmax-primary text-dmax-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* サブタブコンテンツ */}
        {trainingSubTab === 'patients' && (
          <div className="w-full">
            <iframe
              src="/training/clinic/patients"
              className="w-full border-0 rounded-lg"
              style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
              title="患者管理"
            />
          </div>
        )}

        {trainingSubTab === 'trainings' && (
          <div className="w-full">
            <iframe
              src="/training/clinic/trainings"
              className="w-full border-0 rounded-lg"
              style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
              title="トレーニング一覧"
            />
          </div>
        )}

        {trainingSubTab === 'analytics' && (
          <div className="w-full">
            <iframe
              src="/training/clinic/analytics"
              className="w-full border-0 rounded-lg"
              style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}
              title="分析"
            />
          </div>
        )}
      </div>
    );
  };

  // 患者一覧設定のレンダリング
  const renderPatientListSettings = () => {
    const registeredCount = filteredPatients.filter(p => p.is_registered).length;
    const temporaryCount = filteredPatients.filter(p => !p.is_registered).length;

    return (
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-end items-center">
          <Button
            onClick={() => setShowNewPatientModal(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            新規患者登録
          </Button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">全患者</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{patients.length}人</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">本登録</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{patients.filter(p => p.is_registered).length}人</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">仮登録</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{patients.filter(p => !p.is_registered).length}人</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="患者名、電話番号、診察券番号で検索..."
                value={patientSearchQuery}
                onChange={(e) => setPatientSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={patientFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setPatientFilter('all')}
              size="sm"
            >
              すべて ({patients.length})
            </Button>
            <Button
              variant={patientFilter === 'registered' ? 'default' : 'outline'}
              onClick={() => setPatientFilter('registered')}
              size="sm"
            >
              本登録 ({patients.filter(p => p.is_registered).length})
            </Button>
            <Button
              variant={patientFilter === 'temporary' ? 'default' : 'outline'}
              onClick={() => setPatientFilter('temporary')}
              size="sm"
            >
              仮登録 ({patients.filter(p => !p.is_registered).length})
            </Button>
          </div>
        </div>

        {/* 患者一覧テーブル */}
        <Card>
          <CardContent className="p-0">
            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">患者が見つかりませんでした</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        診察券番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        氏名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        フリガナ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        電話番号
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録状態
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        登録日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {patient.patient_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.last_name} {patient.first_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.last_name_kana} {patient.first_name_kana}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {patient.phone || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {patient.is_registered ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              本登録
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              仮登録
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {patient.created_at ? new Date(patient.created_at).toLocaleDateString('ja-JP') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 表示件数 */}
        <div className="text-sm text-gray-600 text-center">
          {filteredPatients.length}件 / {patients.length}件中
        </div>

        {/* 新規患者登録モーダル */}
        {showNewPatientModal && (
          <Modal
            isOpen={showNewPatientModal}
            onClose={() => setShowNewPatientModal(false)}
            title="新規患者登録"
          >
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      登録について
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>本登録として患者を作成します</li>
                        <li>診察券番号は自動で採番されます</li>
                        <li>氏名と電話番号は必須項目です</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <PatientForm
                onSubmit={async (formData: any) => {
                  try {
                    const { createPatient } = await import('@/lib/api/patients');
                    await createPatient(DEMO_CLINIC_ID, {
                      ...formData,
                      is_registered: true
                    });

                    // データ再読み込み
                    const data = await getPatients(DEMO_CLINIC_ID);
                    setPatients(data);
                    setFilteredPatients(data);

                    setShowNewPatientModal(false);
                    alert('患者を登録しました。');
                  } catch (error) {
                    console.error('患者登録エラー:', error);
                    alert('患者の登録に失敗しました。');
                  }
                }}
                onCancel={() => setShowNewPatientModal(false)}
                isEditing={false}
              />
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // データ移行設定のレンダリング
  const renderDataImportSettings = () => {
    return (
      <div className="space-y-6">
        {/* タブナビゲーション */}
        <div className="flex space-x-2 border-b">
          <button
            onMouseEnter={() => setDataImportTab('patients')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              dataImportTab === 'patients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            患者データ
          </button>
          <button
            onMouseEnter={() => setDataImportTab('appointments')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              dataImportTab === 'appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            予約データ
          </button>
          <button
            onMouseEnter={() => setDataImportTab('history')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              dataImportTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            移行履歴
          </button>
        </div>

        {/* タブコンテンツ */}
        <div className="mt-6">
          {dataImportTab === 'patients' && (
            <Card>
              <CardHeader>
                <CardTitle>患者データのインポート</CardTitle>
                <p className="text-sm text-gray-600">
                  CSVファイルから患者情報を一括インポートします。診察券番号もそのまま引き継げます。
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ステップ1: ファイルアップロード */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">ステップ1: CSVファイルをアップロード</h3>

                  {!csvData ? (
                    <div
                      onDragEnter={handleCsvDragEnter}
                      onDragOver={handleCsvDragOver}
                      onDragLeave={handleCsvDragLeave}
                      onDrop={handleCsvDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="space-y-3">
                          <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                          <p className="text-gray-600">ファイルを処理中...</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600 mb-2">
                            ここにファイルをドラッグ&ドロップ
                          </p>
                          <p className="text-sm text-gray-500 mb-4">または</p>
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            ファイルを選択
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-4">
                            対応形式: CSV (UTF-8, Shift_JIS)
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-8 h-8 text-green-600" />
                          <div>
                            <p className="font-medium text-gray-900">{csvData.fileName}</p>
                            <p className="text-sm text-gray-600">
                              {csvData.rowCount}件のデータ / {csvData.headers.length}列
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ステップ2: 移行元システム選択 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">ステップ2: 移行元システムを選択</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="system"
                        value="dentnet"
                        checked={selectedSystem === 'dentnet'}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>デントネット</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="system"
                        value="apotool"
                        checked={selectedSystem === 'apotool'}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Apotool & Box</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="system"
                        value="dentalx"
                        checked={selectedSystem === 'dentalx'}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>デンタルX</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="system"
                        value="other"
                        checked={selectedSystem === 'other'}
                        onChange={(e) => setSelectedSystem(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>その他:</span>
                      <input
                        type="text"
                        placeholder="システム名を入力"
                        value={customSystemName}
                        onChange={(e) => setCustomSystemName(e.target.value)}
                        disabled={selectedSystem !== 'other'}
                        className="border rounded px-2 py-1 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                      />
                    </label>
                  </div>
                </div>

                {/* ステップ3: 患者番号の扱い */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">ステップ3: 患者番号の扱い</h3>
                  <div className="space-y-3">
                    <label className="flex items-start space-x-2">
                      <input
                        type="radio"
                        name="number-handling"
                        value="keep"
                        checked={numberHandling === 'keep'}
                        onChange={(e) => setNumberHandling(e.target.value as 'keep' | 'new')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="font-medium">旧システムの番号をそのまま使用（推奨）</div>
                        <p className="text-sm text-gray-600">
                          診察券番号を変更せず、患者様の混乱を防ぎます。
                          文字列番号（例: P-1001）の場合は数字部分を抽出し、元の番号も保存します。
                        </p>
                      </div>
                    </label>
                    <label className="flex items-start space-x-2">
                      <input
                        type="radio"
                        name="number-handling"
                        value="new"
                        checked={numberHandling === 'new'}
                        onChange={(e) => setNumberHandling(e.target.value as 'keep' | 'new')}
                        className="w-4 h-4 mt-1"
                      />
                      <div>
                        <div className="font-medium">新しい番号を自動採番</div>
                        <p className="text-sm text-gray-600">
                          D-MAXで新しい患者番号を発行します。旧番号は参照用として保存されます。
                        </p>
                        <div className="mt-2">
                          <label className="text-sm">
                            開始番号:
                            <input
                              type="number"
                              value={startNumber}
                              onChange={(e) => setStartNumber(parseInt(e.target.value) || 10000)}
                              disabled={numberHandling !== 'new'}
                              className="border rounded px-2 py-1 text-sm ml-2 w-24 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </label>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 検証結果 */}
                {csvData && (validationErrors.length > 0 || validationWarnings.length > 0) && (
                  <div className="space-y-3">
                    {validationErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900 mb-2">エラー</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                              {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {validationWarnings.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-900 mb-2">警告</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                              {validationWarnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CSVデータプレビュー */}
                {csvData && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-3">データプレビュー</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              {csvData.headers.slice(0, 8).map((header, index) => (
                                <th
                                  key={index}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                              {csvData.headers.length > 8 && (
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  ...
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {csvData.rows.slice(0, 10).map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                  {rowIndex + 1}
                                </td>
                                {csvData.headers.slice(0, 8).map((header, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                                  >
                                    {row[header] || '-'}
                                  </td>
                                ))}
                                {csvData.headers.length > 8 && (
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                    ...
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csvData.rowCount > 10 && (
                        <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-t">
                          最初の10件を表示しています（全{csvData.rowCount}件）
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    CSVテンプレートをダウンロード
                  </Button>
                  <Button
                    disabled={!csvData || validationErrors.length > 0}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    次へ: フィールドマッピング
                  </Button>
                </div>

                {/* 検証成功メッセージ */}
                {csvData && validationErrors.length === 0 && validationWarnings.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-900">検証が完了しました</p>
                        <p className="text-sm text-green-800 mt-1">
                          すべてのデータが正常です。「次へ: フィールドマッピング」をクリックして続けてください。
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {dataImportTab === 'appointments' && (
            <Card>
              <CardHeader>
                <CardTitle>予約データのインポート</CardTitle>
                <p className="text-sm text-gray-600">
                  過去の予約履歴をCSVファイルから一括インポートします
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>予約データインポート機能は準備中です</p>
                  <p className="text-sm mt-2">まず患者データをインポートしてください</p>
                </div>
              </CardContent>
            </Card>
          )}

          {dataImportTab === 'history' && (
            <Card>
              <CardHeader>
                <CardTitle>移行履歴</CardTitle>
                <p className="text-sm text-gray-600">
                  過去のデータ移行の履歴を確認できます
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>移行履歴はありません</p>
                  <p className="text-sm mt-2">データをインポートすると履歴が表示されます</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 注意事項 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">インポート前の確認事項</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>CSVファイルの文字コードはUTF-8またはShift_JISに対応しています</li>
                  <li>患者番号が重複する場合は、スキップまたは新規番号を自動採番します</li>
                  <li>インポート後24時間以内であれば、「元に戻す」機能で取り消しできます</li>
                  <li>大量データの場合、処理に数分かかる場合があります</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // 問診票の削除処理
  const handleDeleteQuestionnaire = async (questionnaireId: string) => {
    try {
      await deleteQuestionnaire(questionnaireId);
      setQuestionnaires((prev) => prev.filter((q) => q.id !== questionnaireId));
    } catch (error) {
      console.error("問診票削除エラー:", error);
      showAlert("問診票の削除に失敗しました", "error");
    }
  };

  // 問診票リンクをコピー
  const copyQuestionnaireLink = async (questionnaireId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/questionnaire?id=${questionnaireId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedQuestionnaireId(questionnaireId);
      setTimeout(() => setCopiedQuestionnaireId(null), 2000);
    } catch (err) {
      console.error("クリップボードへのコピーに失敗:", err);
      showAlert("リンクのコピーに失敗しました", "error");
    }
  };

  // 右側コンテンツのレンダリング
  const renderRightContent = () => {
    if (!selectedCategory) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">
              設定を選択してください
            </h2>
            <p className="text-gray-600">
              左側のメニューから設定したい項目を選択してください
            </p>
          </div>
        </div>
      );
    }

    const category = settingCategories.find(
      (cat) => cat.id === selectedCategory,
    );
    if (!category) return null;

    return (
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {category.name}
            </h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 font-medium">
                ● 未保存の変更があります
              </span>
            )}
            <Button
              onClick={() => {
                console.log("🔵 保存ボタンがクリックされました！");
                console.log("現在のカテゴリ:", selectedCategory);
                handleSave();
              }}
              disabled={saving}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        {selectedCategory === "clinic" && renderClinicSettings()}
        {selectedCategory === "calendar" && renderCalendarSettings()}
        {selectedCategory === "treatment" && renderTreatmentSettings()}
        {selectedCategory === "questionnaire" && renderQuestionnaireSettings()}
        {selectedCategory === "units" && renderUnitsSettings()}
        {selectedCategory === "training" && renderTrainingSettings()}
        {selectedCategory === "patient-list" && renderPatientListSettings()}
        {selectedCategory === "data-import" && renderDataImportSettings()}
        {selectedCategory === "staff" && (
          <div className="space-y-6">
            {/* スタッフ管理 */}
              <div className="space-y-6">
                {/* スタッフ一覧表示（役職別グループ化） */}
                <div className="space-y-6">
                  {(() => {
                    // 削除フラグが立っているスタッフを除外
                    const activeStaff = staff.filter(s => !s._deleted);

                    // スタッフを役職別にグループ化
                  const staffByPosition = activeStaff.reduce(
                    (groups: { [key: string]: any[] }, member) => {
                      const positionName = member.position?.name || "その他";
                      if (!groups[positionName]) {
                        groups[positionName] = [];
                      }
                      groups[positionName].push(member);
                      return groups;
                    },
                    {},
                  );

                    // 役職の並び順を決定（マスタ設定のsort_orderに基づく）
                  const sortedPositions = Object.keys(staffByPosition).sort(
                    (a, b) => {
                      const positionA = staffPositions.find(
                        (p) => p.name === a,
                      );
                      const positionB = staffPositions.find(
                        (p) => p.name === b,
                      );
                      const orderA = positionA?.sort_order || 999;
                      const orderB = positionB?.sort_order || 999;
                      return orderA - orderB;
                    },
                  );

                  return sortedPositions.map((positionName) => (
                    <div
                      key={positionName}
                      className="bg-white rounded-lg border border-gray-200 p-4"
                    >
                        {/* 役職名（上部） */}
                        <h4 className="font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">
                          {positionName}
                        </h4>

                        {/* スタッフ一覧（縦並び） */}
                        <div className="space-y-2">
                          {staffByPosition[positionName].map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-gray-50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-gray-900">
                                  {member.name}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${member.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                                >
                                  {member.is_active ? "在籍" : "退職"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingStaff(member)}
                                  className="p-1.5 h-8 w-8 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    showConfirm("このスタッフを削除しますか？", () => {
                                      setStaff(
                                        staff.map((s) =>
                                          s.id === member.id ? { ...s, _deleted: true } : s
                                        )
                                      );
                                    }, { isDanger: true, confirmText: "削除" });
                                  }}
                                  className="p-1.5 h-8 w-8 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                  ));
                  })()}
                  
                  {/* 受付セクションの枠外に+ボタンを配置 */}
                  <div className="flex justify-start items-center mt-4">
                  <Button
                    onClick={() => setShowAddStaff(true)}
                    className="rounded-full w-8 h-8 p-0"
                  >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* スタッフ追加モーダル */}
                <Modal
                  isOpen={showAddStaff}
                  onClose={() => setShowAddStaff(false)}
                  title="新しいスタッフを追加"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staff_name">名前</Label>
                        <Input
                          id="staff_name"
                          value={newStaff.name}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                          placeholder="例: 田中太郎"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_name_kana">フリガナ</Label>
                        <Input
                          id="staff_name_kana"
                          value={newStaff.name_kana}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            name_kana: e.target.value,
                          }))
                        }
                          placeholder="例: タナカタロウ"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="staff_email">メールアドレス</Label>
                        <Input
                          id="staff_email"
                          type="email"
                          value={newStaff.email}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                          placeholder="例: tanaka@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff_phone">電話番号</Label>
                        <Input
                          id="staff_phone"
                          value={newStaff.phone}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                          placeholder="例: 03-1234-5678"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="staff_position">役職</Label>
                      <Select
                        value={newStaff.position_id}
                      onValueChange={(value) =>
                        setNewStaff((prev) => ({ ...prev, position_id: value }))
                      }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="役職を選択してください" />
                        </SelectTrigger>
                        <SelectContent>
                        {staffPositions.map((position) => (
                            <SelectItem key={position.id} value={position.id}>
                              {position.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {staffPositions.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          役職が登録されていません。マスタタブで役職を追加してください。
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => {
                        console.log("追加ボタンがクリックされました");
                        console.log("staffLoading:", staffLoading);
                        console.log("newStaff.name:", newStaff.name);
                        console.log(
                          "newStaff.position_id:",
                          newStaff.position_id,
                        );
                        console.log("newStaff全体:", newStaff);
                        handleAddStaff();
                        }}
                        disabled={staffLoading || !newStaff.name}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                      {staffLoading ? "追加中..." : "追加"}
                      </Button>
                    </div>
                  </div>
                </Modal>

                {/* スタッフ編集モーダル */}
                <Modal
                  isOpen={editingStaff !== null}
                  onClose={() => setEditingStaff(null)}
                  title="スタッフ情報を編集"
                >
                  {editingStaff && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_staff_name">名前</Label>
                          <Input
                            id="edit_staff_name"
                            value={editingStaff.name}
                            onChange={(e) =>
                              setEditingStaff((prev: any) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="例: 田中太郎"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_staff_name_kana">フリガナ</Label>
                          <Input
                            id="edit_staff_name_kana"
                            value={editingStaff.name_kana || ""}
                            onChange={(e) =>
                              setEditingStaff((prev: any) => ({
                                ...prev,
                                name_kana: e.target.value,
                              }))
                            }
                            placeholder="例: タナカタロウ"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_staff_email">メールアドレス</Label>
                          <Input
                            id="edit_staff_email"
                            type="email"
                            value={editingStaff.email || ""}
                            onChange={(e) =>
                              setEditingStaff((prev: any) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            placeholder="例: tanaka@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit_staff_phone">電話番号</Label>
                          <Input
                            id="edit_staff_phone"
                            value={editingStaff.phone || ""}
                            onChange={(e) =>
                              setEditingStaff((prev: any) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="例: 03-1234-5678"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit_staff_position">役職</Label>
                        <Select
                          value={editingStaff.position_id || ""}
                          onValueChange={(value) =>
                            setEditingStaff((prev: any) => ({ ...prev, position_id: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="役職を選択してください" />
                          </SelectTrigger>
                          <SelectContent>
                            {staffPositions.map((position) => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="edit_staff_status">ステータス</Label>
                        <Select
                          value={editingStaff.is_active ? "active" : "inactive"}
                          onValueChange={(value) =>
                            setEditingStaff((prev: any) => ({ ...prev, is_active: value === "active" }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">在籍</SelectItem>
                            <SelectItem value="inactive">退職</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end pt-4">
                        <Button
                          onClick={handleUpdateStaff}
                          disabled={staffLoading || !editingStaff.name}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {staffLoading ? "更新中..." : "更新"}
                        </Button>
                      </div>
                    </div>
                  )}
                </Modal>
              </div>
          </div>
        )}
        {selectedCategory === "shift" && (
          <div className="space-y-6">
            {/* サブタブ */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onMouseEnter={() => setSelectedShiftTab("table")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedShiftTab === "table"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                シフト表
              </button>
              <button
                onMouseEnter={() => setSelectedShiftTab("pattern")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedShiftTab === "pattern"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                パターン
              </button>
            </div>

            {/* シフト表タブ */}
            {selectedShiftTab === "table" && (
              <div>
                <ShiftTable 
                  clinicId={DEMO_CLINIC_ID} 
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}
            
            {/* パターンタブ */}
            {selectedShiftTab === "pattern" && (
              <div>
                <ShiftPatterns clinicId={DEMO_CLINIC_ID} />
              </div>
            )}
          </div>
        )}
        {selectedCategory === "web" && (
          <div className="space-y-6">
            {/* サブタブナビゲーション */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onMouseEnter={() => setSelectedWebTab('basic')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedWebTab === 'basic'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                基本設定
              </button>
              <button
                onMouseEnter={() => setSelectedWebTab('flow')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedWebTab === 'flow'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ArrowRight className="w-4 h-4 inline mr-2" />
                フロー設定
              </button>
              <button
                onMouseEnter={() => setSelectedWebTab('menu')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedWebTab === 'menu'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Stethoscope className="w-4 h-4 inline mr-2" />
                メニュー設定
              </button>
              <button
                onMouseEnter={() => setSelectedWebTab('notification-flow')}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  selectedWebTab === 'notification-flow'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Bell className="w-4 h-4 inline mr-2" />
                通知予約フロー
              </button>
            </div>

            {/* 基本設定タブ */}
            {selectedWebTab === 'basic' && (
              <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="is_enabled"
                    checked={webSettings.isEnabled}
                    onCheckedChange={(checked) =>
                        setWebSettings((prev) => ({
                          ...prev,
                          isEnabled: checked as boolean,
                        }))
                    }
                  />
                  <Label htmlFor="is_enabled" className="font-medium">
                    Web予約機能を有効にする
                  </Label>
                </div>

                {webSettings.isEnabled && (
                  <>
                    <div>
                        <Label htmlFor="reservation_period">
                          予約可能期間（日）
                        </Label>
                      <Input
                        id="reservation_period"
                        type="number"
                        min="1"
                        max="365"
                        value={webSettings.reservationPeriod}
                        onChange={(e) =>
                            setWebSettings((prev) => ({
                            ...prev,
                              reservationPeriod: parseInt(e.target.value) || 30,
                          }))
                        }
                        className="max-w-xs"
                      />
                    </div>

                  </>
                )}
              </CardContent>
            </Card>

            {/* Web予約ページ設定 */}
            <Card>
              <CardHeader>
                <CardTitle>Web予約ページ設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="web_page_url">予約ページURL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="web_page_url"
                        value={
                          typeof window !== "undefined"
                            ? `${window.location.origin}/web-booking`
                            : "/web-booking"
                        }
                      readOnly
                      className="flex-1 bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                          const url =
                            typeof window !== "undefined"
                              ? `${window.location.origin}/web-booking`
                              : "/web-booking";
                          navigator.clipboard.writeText(url);
                          showAlert("URLをコピーしました", "success");
                      }}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      コピー
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    患者がアクセスする予約ページのURLです。このURLを患者に共有してください。
                  </p>
                </div>

                {/* 受付患者タイプ設定 */}
                <div className="border-t pt-4 mt-4">
                  <Label className="text-base font-semibold mb-3 block">Web予約受付設定</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="accept_new_patient"
                        checked={webSettings.acceptNewPatient}
                        onCheckedChange={(checked) => {
                          const newValue = checked as boolean
                          // 両方OFFにならないようにチェック
                          if (!newValue && !webSettings.acceptReturningPatient) {
                            showAlert('少なくとも1つは選択してください', 'error')
                            return
                          }
                          setWebSettings((prev) => ({
                            ...prev,
                            acceptNewPatient: newValue,
                          }))
                        }}
                      />
                      <Label htmlFor="accept_new_patient" className="font-medium">
                        初診患者を受け付ける
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="accept_returning_patient"
                        checked={webSettings.acceptReturningPatient}
                        onCheckedChange={(checked) => {
                          const newValue = checked as boolean
                          // 両方OFFにならないようにチェック
                          if (!newValue && !webSettings.acceptNewPatient) {
                            showAlert('少なくとも1つは選択してください', 'error')
                            return
                          }
                          setWebSettings((prev) => ({
                            ...prev,
                            acceptReturningPatient: newValue,
                          }))
                        }}
                      />
                      <Label htmlFor="accept_returning_patient" className="font-medium">
                        再診患者を受け付ける
                      </Label>
                    </div>

                    <p className="text-sm text-gray-500 ml-7">
                      ※ チェックされた項目のみ患者に表示されます<br/>
                      ※ 少なくとも1つはチェックが必要です
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            )}

            {/* フロー設定タブ */}
            {selectedWebTab === 'flow' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側: フロー設定 */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>予約フロー設定</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* キャンセルポリシー設定 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_cancel_policy"
                            checked={webSettings.showCancelPolicy}
                            onCheckedChange={(checked) => 
                            setWebSettings((prev) => ({
                                ...prev,
                              showCancelPolicy: checked as boolean,
                              }))
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                            <Label
                              htmlFor="flow_cancel_policy"
                              className="font-medium"
                            >
                                キャンセルポリシー表示
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenCancelPolicyDialog}
                                className="p-1 h-auto"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 初診/再診選択 */}
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="flow_initial"
                            checked={webSettings.flow.initialSelection}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                initialSelection: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_initial" className="font-medium">
                              初診/再診選択
                            </Label>
                            <p className="text-sm text-gray-500">
                              患者が初診か再診かを選択するステップ<br/>
                              <span className="text-xs">※再診の場合は診察券番号・電話番号・メールアドレスのいずれか + 生年月日で患者認証を行います</span><br/>
                              <span className="text-xs text-blue-600">※右側のプレビューで初診/再診ボタンをクリックして、フローの違いを確認できます</span>
                            </p>
                          </div>
                        </div>

                        {/* 診療メニュー選択 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_menu"
                            checked={webSettings.flow.menuSelection}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                menuSelection: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_menu" className="font-medium">
                              診療メニュー選択
                            </Label>
                          </div>
                        </div>

                        {/* 担当者選択 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_staff"
                            checked={webSettings.flow.staffSelection}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                staffSelection: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                            <Label htmlFor="flow_staff" className="font-medium">
                              担当者選択
                            </Label>
                            <p className="text-sm text-gray-500">
                              患者が担当ドクター・衛生士を選択するステップ
                            </p>
                          </div>
                        </div>

                        {/* カレンダー表示 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_calendar"
                            checked={webSettings.flow.calendarDisplay}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                calendarDisplay: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                          <Label
                            htmlFor="flow_calendar"
                            className="font-medium"
                          >
                              カレンダー表示
                            </Label>
                          </div>
                        </div>

                        {/* 患者情報入力 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_patient"
                            checked={webSettings.flow.patientInfo}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                patientInfo: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                            <Label
                              htmlFor="flow_patient"
                              className="font-medium"
                            >
                                患者情報入力
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenPatientInfoFieldsDialog}
                                className="p-1 h-auto"
                              >
                                <Edit3 className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* 確認・確定 */}
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="flow_confirmation"
                            checked={webSettings.flow.confirmation}
                            onCheckedChange={(checked) =>
                            setWebSettings((prev) => ({
                                ...prev,
                              flow: {
                                ...prev.flow,
                                confirmation: checked as boolean,
                              },
                              }))
                            }
                          />
                          <div className="flex-1">
                          <Label
                            htmlFor="flow_confirmation"
                            className="font-medium"
                          >
                              確認・確定
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 右側: プレビュー */}
                <div className="space-y-6">
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle>プレビュー</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-0">
                      {/* 実際のWeb予約ページと全く同じプレビュー */}
                      <div className="min-h-screen bg-gray-50 py-8">
                        <div className="max-w-4xl mx-auto px-4">
                          {/* ヘッダー */}
                          <div className="text-center mb-8">
                          <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Web予約
                          </h1>
                          <p className="text-gray-600">
                            簡単にオンラインで予約できます
                          </p>
                          </div>

                          <div className="max-w-2xl mx-auto space-y-6">
                            {/* キャンセルポリシー表示 */}
                            {webSettings.showCancelPolicy && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>医院からのメッセージ</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                      <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {webSettings.cancelPolicyText}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ1: 初診/再診選択 */}
                            {webSettings.flow.initialSelection && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>初診/再診の選択</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-3">
                                      {/* 初診ボタン - acceptNewPatientがtrueの時のみ表示 */}
                                      {webSettings.acceptNewPatient && (
                                        <button
                                          onClick={() => setPreviewPatientType('new')}
                                          className={`w-full p-4 border-2 rounded-lg transition-colors ${
                                            previewPatientType === 'new'
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <div className="text-left">
                                            <h3 className="font-medium">初診</h3>
                                            <p className="text-sm text-gray-600">
                                              初めてご来院される方
                                            </p>
                                          </div>
                                        </button>
                                      )}

                                      {/* 再診ボタン - acceptReturningPatientがtrueの時のみ表示 */}
                                      {webSettings.acceptReturningPatient && (
                                        <button
                                          onClick={() => setPreviewPatientType('returning')}
                                          className={`w-full p-4 border-2 rounded-lg transition-colors ${
                                            previewPatientType === 'returning'
                                              ? 'border-blue-500 bg-blue-50'
                                              : 'border-gray-200 hover:border-blue-300'
                                          }`}
                                        >
                                          <div className="text-left">
                                            <h3 className="font-medium">再診</h3>
                                            <p className="text-sm text-gray-600">
                                              過去にご来院されたことがある方
                                            </p>
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* 再診患者認証画面 */}
                            {webSettings.flow.initialSelection && previewPatientType === 'returning' && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>患者情報の確認</CardTitle>
                                    <p className="text-sm text-gray-600 mt-2">
                                      以下のいずれか1つと生年月日を入力してください
                                    </p>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="preview_patient_number">診察券番号</Label>
                                        <Input
                                          id="preview_patient_number"
                                          placeholder="例: 12345"
                                          disabled
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="preview_phone">電話番号</Label>
                                        <Input
                                          id="preview_phone"
                                          placeholder="例: 03-1234-5678"
                                          disabled
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="preview_email">メールアドレス</Label>
                                        <Input
                                          id="preview_email"
                                          type="email"
                                          placeholder="例: tanaka@example.com"
                                          disabled
                                        />
                                      </div>

                                      <div>
                                        <Label>生年月日 *</Label>
                                        <div className="grid grid-cols-3 gap-2 mt-1">
                                          <Input
                                            placeholder="年 (例: 1990)"
                                            maxLength={4}
                                            disabled
                                          />
                                          <Input
                                            placeholder="月 (例: 01)"
                                            maxLength={2}
                                            disabled
                                          />
                                          <Input
                                            placeholder="日 (例: 01)"
                                            maxLength={2}
                                            disabled
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-center pt-2">
                                      <Button size="lg" className="w-full max-w-xs" disabled>
                                        ログイン
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ2: 診療メニュー選択 */}
                            {webSettings.flow.menuSelection && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>診療メニューの選択</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <button className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md transition-all text-left">
                                        <div>
                                          <h3 className="font-medium text-gray-900 mb-1">
                                            一般診療
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            所要時間: 30分
                                          </p>
                                        </div>
                                      </button>
                                      <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all text-left">
                                        <div>
                                          <h3 className="font-medium text-gray-900 mb-1">
                                            矯正相談
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            所要時間: 60分
                                          </p>
                                        </div>
                                      </button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ3: 担当者選択 */}
                            {webSettings.flow.staffSelection && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>担当者の選択</CardTitle>
                                    <p className="text-sm text-gray-600">
                                      担当をご希望される場合は選択してください
                                    </p>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all text-left">
                                        <div>
                                          <h3 className="font-medium text-gray-900 mb-1">
                                            指定なし
                                          </h3>
                                          <p className="text-sm text-gray-600">
                                            担当者を指定しない
                                          </p>
                                        </div>
                                      </button>
                                      <button className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-md transition-all text-left">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-600" />
                                          </div>
                                          <div>
                                            <h3 className="font-medium text-gray-900 mb-1">
                                              田中 太郎
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                              歯科医師
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                      <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all text-left">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-600" />
                                          </div>
                                          <div>
                                            <h3 className="font-medium text-gray-900 mb-1">
                                              佐藤 花子
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                              歯科衛生士
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                      <button className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all text-left">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                            <Users className="w-5 h-5 text-gray-600" />
                                          </div>
                                          <div>
                                            <h3 className="font-medium text-gray-900 mb-1">
                                              鈴木 次郎
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                              歯科医師
                                            </p>
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ4: カレンダー表示 */}
                            {webSettings.flow.calendarDisplay && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>日時選択</CardTitle>
                                    <p className="text-sm text-gray-600">
                                      ⭕️をクリックして予約日時を選択してください
                                    </p>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    {/* 週ナビゲーション */}
                                    <div className="flex items-center justify-between gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1 text-xs shrink-0"
                                    >
                                        <ChevronLeft className="w-3 h-3 mr-1" />
                                        先週
                                      </Button>
                                      <div className="text-sm font-medium text-center flex-1">
                                        01月15日 - 01月21日
                                      </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="px-2 py-1 text-xs shrink-0"
                                    >
                                        次週
                                        <ChevronRight className="w-3 h-3 ml-1" />
                                      </Button>
                                    </div>

                                    {/* 1週間分のカレンダー */}
                                    <div className="-mx-2 sm:mx-0">
                                      {/* ヘッダー（固定） */}
                                      <div className="overflow-hidden">
                                      <table
                                        className="w-full border-collapse text-xs sm:text-sm"
                                        style={{ tableLayout: "fixed" }}
                                      >
                                          <colgroup>
                                          <col
                                            style={{ width: "40px" }}
                                            className="sm:w-16"
                                          />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                          </colgroup>
                                          <thead>
                                            <tr>
                                            <th className="border p-1 sm:p-2 bg-gray-50 font-medium">
                                              時間
                                            </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                月
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/15
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                火
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/16
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                水
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/17
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                木
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/18
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                金
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/19
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                土
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/20
                                              </div>
                                              </th>
                                              <th className="border p-1 bg-gray-50 font-medium">
                                              <div className="text-[10px] sm:text-xs leading-tight">
                                                日
                                              </div>
                                              <div className="text-[9px] sm:text-xs text-gray-600">
                                                01/21
                                              </div>
                                              </th>
                                            </tr>
                                          </thead>
                                        </table>
                                      </div>

                                      {/* ボディ（スクロール可能） */}
                                      <div className="overflow-y-auto max-h-96 scrollbar-hide">
                                      <table
                                        className="w-full border-collapse text-xs sm:text-sm"
                                        style={{ tableLayout: "fixed" }}
                                      >
                                          <colgroup>
                                          <col
                                            style={{ width: "40px" }}
                                            className="sm:w-16"
                                          />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                            <col />
                                          </colgroup>
                                          <tbody>
                                            {/* 時間ごとの行を生成 */}
                                          {[
                                            "9:00",
                                            "10:00",
                                            "11:00",
                                            "14:00",
                                            "15:00",
                                            "16:00",
                                          ].map((time) => (
                                              <tr key={time}>
                                              <td className="border p-0.5 sm:p-1 text-[10px] sm:text-sm text-gray-600 text-center">
                                                {time}
                                              </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                <button className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-green-100 text-green-800 hover:bg-green-200">
                                                    ⭕️
                                                  </button>
                                                </td>
                                                <td className="border p-0.5 sm:p-1">
                                                  <button
                                                    className="w-full h-6 sm:h-10 flex items-center justify-center text-sm sm:text-lg font-bold rounded transition-colors bg-red-100 text-red-800"
                                                    disabled
                                                  >
                                                    ❌
                                                  </button>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ5: 患者情報入力（初診のみ） */}
                            {webSettings.flow.patientInfo && previewPatientType === 'new' && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>患者情報入力</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                  <div
                                    className={`grid gap-4 ${webSettings.patientInfoFields.phoneEnabled ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}
                                  >
                                      <div>
                                      <Label htmlFor="patientName">
                                        お名前 *
                                      </Label>
                                        <Input
                                          id="patientName"
                                          placeholder="例: 田中太郎"
                                          readOnly
                                        />
                                      </div>
                                    {webSettings.patientInfoFields
                                      .phoneEnabled && (
                                        <div>
                                          <Label htmlFor="patientPhone">
                                          電話番号{" "}
                                          {webSettings.patientInfoFields
                                            .phoneRequired
                                            ? "*"
                                            : ""}
                                          </Label>
                                          <Input
                                            id="patientPhone"
                                            placeholder="例: 03-1234-5678"
                                            readOnly
                                          />
                                        </div>
                                      )}
                                    </div>
                                  {webSettings.patientInfoFields
                                    .emailEnabled && (
                                      <div>
                                        <Label htmlFor="patientEmail">
                                        メールアドレス{" "}
                                        {webSettings.patientInfoFields
                                          .emailRequired
                                          ? "*"
                                          : ""}
                                        </Label>
                                        <Input
                                          id="patientEmail"
                                          type="email"
                                          placeholder="例: tanaka@example.com"
                                          readOnly
                                        />
                                      </div>
                                    )}
                                    <div>
                                    <Label htmlFor="patientRequest">
                                      ご要望・ご相談など（任意）
                                    </Label>
                                      <textarea
                                        id="patientRequest"
                                        placeholder="ご要望やご相談がございましたらご記入ください"
                                        className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                                        readOnly
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {/* ステップ6: 確認・確定 */}
                            {webSettings.flow.confirmation && (
                              <div className="animate-fadeIn">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>予約内容確認</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        予約日時:
                                      </span>
                                        <span>2024-01-15 10:00</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        診療メニュー:
                                      </span>
                                        <span>一般診療</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        診療時間:
                                      </span>
                                        <span>30分</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <User className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        患者名:
                                      </span>
                                        <span>田中太郎</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        電話番号:
                                      </span>
                                        <span>03-1234-5678</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <CheckCircle className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">
                                        診療種別:
                                      </span>
                                        <span>初診</span>
                                      </div>
                                    </div>

                                    <div className="flex justify-center">
                                    <Button
                                      size="lg"
                                      className="w-full max-w-xs"
                                    >
                                        予約確定
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* メニュー設定タブ */}
            {selectedWebTab === 'menu' && (
              <div className="space-y-6">
            {/* Web予約メニュー設定 */}
            {webSettings.isEnabled ? (
            <Card>
              <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Web予約メニュー</CardTitle>
                    </div>
                    <Button onClick={() => setIsAddWebMenuDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      メニューを追加
                    </Button>
                  </div>
              </CardHeader>
              <CardContent>
                  {webBookingMenus.length === 0 ? (
                  <p className="text-sm text-gray-500">
                      Web予約メニューが登録されていません。「メニューを追加」ボタンから追加してください。
                  </p>
                ) : (
                    <div className="space-y-4">
                        {webBookingMenus.map((menu) => (
                        <div key={menu.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-3">
                          {/* メニュー名とカラー */}
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-6 h-6 rounded"
                                      style={{
                                        backgroundColor:
                                          menu.treatment_menu_color ||
                                          "#bfbfbf",
                                      }}
                                    />
                                    <h4 className="font-medium text-lg">
                                      {menu.treatment_menu_name}
                                    </h4>
                                </div>

                              {/* 表示名 */}
                              {menu.display_name && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <span className="font-medium">表示名:</span>
                                  <span>{menu.display_name}</span>
                                </div>
                              )}

                              {/* 診療時間 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">診療時間:</span>
                                <span>{menu.duration}分</span>
                              </div>

                              {/* ステップ情報 */}
                              {menu.steps && menu.steps.length > 0 ? (
                                <div className="space-y-2">
                                    <span className="font-medium text-sm text-gray-700">
                                      処置ステップ:
                                    </span>
                                    {menu.steps.map(
                                      (step: any, index: number) => (
                                        <div
                                          key={step.id}
                                          className="bg-gray-50 p-2 rounded text-sm"
                                        >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-gray-700">
                                              ステップ{index + 1}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                              {step.end_time - step.start_time}分
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                            {step.staff_assignments?.map(
                                              (assignment: any) => {
                                                const s = staff.find(
                                                  (st) =>
                                                    st.id ===
                                                    assignment.staff_id,
                                                );
                                          return s ? (
                                                  <span
                                                    key={assignment.staff_id}
                                                    className="bg-white px-2 py-0.5 rounded text-xs border"
                                                  >
                                              {s.name}
                                                    {step.type === "serial" &&
                                                      ` (優先度: ${assignment.priority})`}
                                            </span>
                                                ) : null;
                                              },
                                            )}
                                      </div>
                                    </div>
                                      ),
                                    )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  ステップが設定されていません
                                </div>
                              )}

                              {/* 受付可能な患者 */}
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="font-medium">受付:</span>
                                <span>
                                    {menu.allow_new_patient &&
                                      menu.allow_returning &&
                                      "初診・再診"}
                                    {menu.allow_new_patient &&
                                      !menu.allow_returning &&
                                      "初診のみ"}
                                    {!menu.allow_new_patient &&
                                      menu.allow_returning &&
                                      "再診のみ"}
                                    {!menu.allow_new_patient &&
                                      !menu.allow_returning &&
                                      "なし"}
                                </span>
                              </div>
                            </div>

                            {/* 編集・削除ボタン */}
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditWebMenu(menu)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                  onClick={() =>
                                    handleRemoveWebBookingMenu(menu.id)
                                  }
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <p className="text-sm text-yellow-800">
                    ⚠️
                    Web予約機能が無効になっています。基本設定タブで「Web予約機能を有効にする」をチェックしてください。
                </p>
              </div>
            )}
              </div>
            )}

            {/* 通知予約フロータブ */}
            {selectedWebTab === 'notification-flow' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>通知からのWeb予約フロー</CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      患者さんに送る通知から直接Web予約へ誘導する仕組みです。メニューや担当者が事前に設定されたURLを送信できます。
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* ステップ1: 通知スケジュール作成 */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold">1</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              通知スケジュール作成
                            </h3>

                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-5 mb-4">
                              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                <Bell className="w-4 h-4 mr-2" />
                                通知を作成できる場所（2つの入口）
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* 入口1: 患者一覧から */}
                                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                                  <div className="flex items-start space-x-2 mb-2">
                                    <div className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">A</div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900">患者一覧から作成</p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-3 mb-3">
                                    <span className="inline-flex items-center">
                                      <User className="w-3 h-3 mr-1" />
                                      患者一覧
                                    </span>
                                    <span className="mx-1">→</span>
                                    <span className="inline-flex items-center">
                                      患者を選択
                                    </span>
                                    <span className="mx-1">→</span>
                                    <span className="inline-flex items-center">
                                      <Bell className="w-3 h-3 mr-1" />
                                      通知タブ
                                    </span>
                                  </p>
                                  <div className="bg-blue-50 rounded px-3 py-2">
                                    <p className="text-xs text-blue-700">💡 予約がない患者さんに定期検診の案内を送る時に使用</p>
                                  </div>
                                </div>

                                {/* 入口2: 予約編集モーダルから */}
                                <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                                  <div className="flex items-start space-x-2 mb-2">
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">B</div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900">予約編集モーダルから作成</p>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-3 mb-3">
                                    <span className="inline-flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      カレンダー
                                    </span>
                                    <span className="mx-1">→</span>
                                    <span className="inline-flex items-center">
                                      予約枠をクリック
                                    </span>
                                    <span className="mx-1">→</span>
                                    <span className="inline-flex items-center">
                                      <Bell className="w-3 h-3 mr-1" />
                                      通知設定タブ
                                    </span>
                                  </p>
                                  <div className="bg-green-50 rounded px-3 py-2">
                                    <p className="text-xs text-green-700">💡 予約作成と同時に次回の予約を促す通知を設定する時に使用</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 実際の通知作成フォームUI */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <Edit className="w-4 h-4 mr-2 text-blue-600" />
                                実際の作成フォーム画面
                              </h4>

                              {/* 実際のフォームを模したUI */}
                              <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm space-y-4">
                                {/* 通知タイプ */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">通知タイプ</label>
                                  <div className="flex items-center space-x-2 h-10 px-3 border-2 border-gray-300 rounded-md bg-white text-sm">
                                    <MessageSquare className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-900">定期検診リマインド</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                  </div>
                                </div>

                                {/* 診療メニュー */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">診療メニュー1（任意）</label>
                                    <div className="flex items-center space-x-2 h-10 px-3 border-2 border-gray-300 rounded-md bg-white text-sm">
                                      <Stethoscope className="w-4 h-4 text-gray-500" />
                                      <span className="text-gray-900">定期検診</span>
                                      <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">診療メニュー2（任意）</label>
                                    <div className="flex items-center space-x-2 h-10 px-3 border-2 border-gray-200 rounded-md bg-gray-50 text-sm">
                                      <span className="text-gray-400">選択しない</span>
                                      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                    </div>
                                  </div>
                                </div>

                                {/* 担当スタッフ */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">担当スタッフ（複数選択可）</label>
                                  <div className="border-2 border-gray-300 rounded-md p-3 bg-white max-h-[100px] overflow-y-auto space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-4 h-4 border-2 border-blue-600 bg-blue-600 rounded flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" />
                                      </div>
                                      <span className="text-sm text-gray-900">福永</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-4 h-4 border-2 border-gray-300 rounded bg-white"></div>
                                      <span className="text-sm text-gray-900">早水</span>
                                    </div>
                                  </div>
                                </div>

                                {/* 通知チャネル */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1.5">通知チャネル</label>
                                  <div className="flex items-center space-x-2 h-10 px-3 border-2 border-gray-300 rounded-md bg-white text-sm">
                                    <MessageSquare className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-900">LINE</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">デフォルト: LINE</p>
                                </div>

                                {/* Web予約を有効化 - 重要 */}
                                <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-5 h-5 border-2 border-green-600 bg-green-600 rounded flex items-center justify-center">
                                      <Check className="w-4 h-4 text-white font-bold" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="text-sm font-semibold text-green-900">Web予約を有効化</div>
                                      <div className="text-xs text-green-700 mt-0.5">
                                        ✓ トークン付きURLが自動生成されます
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* ボタン */}
                                <div className="flex justify-end space-x-2 pt-2 border-t">
                                  <button className="px-4 py-2 text-sm border-2 border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                    キャンセル
                                  </button>
                                  <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                                    作成
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 mt-4 mb-4 border-l-2 border-blue-300 h-8"></div>
                      </div>

                      {/* ステップ2: トークン自動生成 */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold">2</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              トークン自動生成
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-3">
                                「Web予約を有効化」をオンにすると、システムが自動的にトークン付きURLを生成します。
                              </p>
                              <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4 mb-3">
                                <div className="text-xs font-semibold text-green-800 mb-2">生成されるURL例:</div>
                                <div className="bg-white border border-gray-300 rounded p-3 text-sm font-mono text-xs break-all text-gray-700">
                                  http://localhost:3000/web-booking?token=a1b2c3d4e5f6...
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                <div className="bg-white border border-green-200 rounded p-2">
                                  <div className="flex items-center space-x-1 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="font-medium">メニュー・担当者情報</span>
                                  </div>
                                  <p className="text-gray-600 mt-1">トークンに埋め込み済み</p>
                                </div>
                                <div className="bg-white border border-green-200 rounded p-2">
                                  <div className="flex items-center space-x-1 text-green-700">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-medium">有効期限: 30日間</span>
                                  </div>
                                  <p className="text-gray-600 mt-1">期限切れ後は無効化</p>
                                </div>
                                <div className="bg-white border border-green-200 rounded p-2">
                                  <div className="flex items-center space-x-1 text-green-700">
                                    <CheckCircle className="w-3 h-3" />
                                    <span className="font-medium">1回限り使用可能</span>
                                  </div>
                                  <p className="text-gray-600 mt-1">予約後は使用済みに</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 mt-4 mb-4 border-l-2 border-green-300 h-8"></div>
                      </div>

                      {/* ステップ3: 通知メッセージ送信 */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-bold">3</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              通知メッセージ送信
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-3">
                                設定した送信タイミングになると、テンプレート内の <code className="bg-gray-200 px-1 rounded text-xs">{`{{booking_url}}`}</code> が実際のトークン付きURLに自動置換されて送信されます。
                              </p>

                              {/* スマホ画面風のデザイン */}
                              <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Smartphone className="w-5 h-5 text-purple-600" />
                                  <span className="text-sm font-semibold text-purple-900">実際のiPhone画面イメージ</span>
                                </div>

                                {/* iPhoneサイズのスマホフレーム */}
                                <div className="max-w-[280px] mx-auto">
                                  {/* iPhone本体 */}
                                  <div className="bg-black rounded-[2rem] p-2 shadow-2xl">
                                    {/* 画面 */}
                                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                                      {/* ステータスバー */}
                                      <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between text-[10px]">
                                        <span className="font-semibold">9:41</span>
                                        <div className="flex items-center space-x-1">
                                          <div className="w-3 h-2.5 border border-gray-400 rounded-sm"></div>
                                        </div>
                                      </div>

                                      {/* LINEヘッダー */}
                                      <div className="bg-[#06C755] px-3 py-2 flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                          <MessageSquare className="w-4 h-4 text-[#06C755]" />
                                        </div>
                                        <span className="text-white font-semibold text-xs">○○歯科クリニック</span>
                                      </div>

                                      {/* メッセージ内容 */}
                                      <div className="p-3 bg-gray-50 min-h-[220px]">
                                        {/* 吹き出し */}
                                        <div className="flex items-start space-x-1.5">
                                          <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>
                                          <div className="flex-1">
                                            <div className="bg-white rounded-xl rounded-tl-none p-2.5 shadow-sm">
                                              <p className="text-[11px] text-gray-900 mb-1.5">山田太郎様</p>
                                              <p className="text-[11px] text-gray-800 mb-1">いつもありがとうございます。</p>
                                              <p className="text-[11px] text-gray-800 mb-1">前回のご来院から3ヶ月が経過しました。</p>
                                              <p className="text-[11px] text-gray-900 font-medium mb-1.5">定期検診のご予約はこちらから↓</p>
                                              <div className="bg-blue-500 hover:bg-blue-600 rounded-md p-2 mt-1">
                                                <div className="text-white text-[9px] font-mono break-all leading-tight">
                                                  http://localhost:3000/web-booking?token=a1b2c3...
                                                </div>
                                              </div>
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-0.5 ml-1.5">9:41</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 入力エリア（参考） */}
                                      <div className="border-t border-gray-200 p-2 bg-white">
                                        <div className="flex items-center space-x-1.5">
                                          <div className="flex-1 bg-gray-100 rounded-full px-2.5 py-1.5">
                                            <span className="text-[10px] text-gray-400">メッセージを入力</span>
                                          </div>
                                          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 mt-4 mb-4 border-l-2 border-purple-300 h-8"></div>
                      </div>

                      {/* ステップ4: 患者がリンククリック */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 font-bold">4</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              患者さんがリンクをタップ
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-3">
                                患者さんがスマホで通知内のURLをタップして、Web予約ページを開きます。
                              </p>

                              {/* iPhoneサイズのスマホ画面 - URLタップ時 */}
                              <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Smartphone className="w-5 h-5 text-yellow-600" />
                                  <span className="text-sm font-semibold text-yellow-900">実際のiPhone画面イメージ（リンクをタップする瞬間）</span>
                                </div>

                                <div className="max-w-[280px] mx-auto">
                                  {/* iPhone本体 */}
                                  <div className="bg-black rounded-[2rem] p-2 shadow-2xl">
                                    {/* 画面 */}
                                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                                      {/* ステータスバー */}
                                      <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between text-[10px]">
                                        <span className="font-semibold">9:41</span>
                                        <div className="flex items-center space-x-1">
                                          <div className="w-3 h-2.5 border border-gray-400 rounded-sm"></div>
                                        </div>
                                      </div>

                                      {/* LINEヘッダー */}
                                      <div className="bg-[#06C755] px-3 py-2 flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                          <MessageSquare className="w-4 h-4 text-[#06C755]" />
                                        </div>
                                        <span className="text-white font-semibold text-xs">○○歯科クリニック</span>
                                      </div>

                                      {/* メッセージ内容 - URLタップ状態 */}
                                      <div className="p-3 bg-gray-50 min-h-[220px]">
                                        <div className="flex items-start space-x-1.5">
                                          <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>
                                          <div className="flex-1">
                                            <div className="bg-white rounded-xl rounded-tl-none p-2.5 shadow-sm">
                                              <p className="text-[11px] text-gray-900 mb-1.5">山田太郎様</p>
                                              <p className="text-[11px] text-gray-800 mb-1">いつもありがとうございます。</p>
                                              <p className="text-[11px] text-gray-800 mb-1">前回のご来院から3ヶ月が経過しました。</p>
                                              <p className="text-[11px] text-gray-900 font-medium mb-1.5">定期検診のご予約はこちらから↓</p>

                                              {/* タップ中のURL - ハイライト状態 */}
                                              <div className="relative">
                                                <div className="bg-blue-600 rounded-md p-2 mt-1 animate-pulse ring-4 ring-yellow-400">
                                                  <div className="text-white text-[9px] font-mono break-all leading-tight">
                                                    http://localhost:3000/web-booking?token=a1b2c3...
                                                  </div>
                                                </div>
                                                {/* タップエフェクト */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                  <div className="w-16 h-16 rounded-full bg-yellow-400 opacity-30 animate-ping"></div>
                                                </div>
                                              </div>
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-0.5 ml-1.5">9:41</p>
                                          </div>
                                        </div>

                                        {/* タップ時のヒント */}
                                        <div className="mt-3 flex items-center justify-center">
                                          <div className="bg-yellow-100 border-2 border-yellow-400 rounded-full px-3 py-1.5 flex items-center space-x-1.5">
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-semibold text-yellow-900">タップ！</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 入力エリア */}
                                      <div className="border-t border-gray-200 p-2 bg-white">
                                        <div className="flex items-center space-x-1.5">
                                          <div className="flex-1 bg-gray-100 rounded-full px-2.5 py-1.5">
                                            <span className="text-[10px] text-gray-400">メッセージを入力</span>
                                          </div>
                                          <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 矢印とブラウザへの遷移 */}
                                <div className="flex items-center justify-center my-3">
                                  <ArrowRight className="w-6 h-6 text-yellow-600 animate-bounce" />
                                </div>

                                {/* ブラウザが開く様子 */}
                                <div className="text-center">
                                  <div className="inline-block bg-white border-2 border-yellow-400 rounded-lg px-4 py-2 shadow-lg">
                                    <div className="flex items-center space-x-2">
                                      <Globe className="w-4 h-4 text-blue-600" />
                                      <span className="text-xs font-semibold text-gray-900">ブラウザでWeb予約ページを開く</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 mt-4 mb-4 border-l-2 border-yellow-300 h-8"></div>
                      </div>

                      {/* ステップ5: Web予約ページ表示 */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-indigo-600 font-bold">5</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Web予約ページ表示（情報プリセット済み）
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-700 mb-3">
                                トークンに含まれる情報が自動的に反映され、患者さんは日時を選ぶだけで予約完了できます。
                              </p>
                              {/* 実際のWeb予約画面 */}
                              <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Smartphone className="w-5 h-5 text-indigo-600" />
                                  <span className="text-sm font-semibold text-indigo-900">実際のiPhone画面イメージ</span>
                                </div>

                                {/* iPhoneサイズのスマホフレーム */}
                                <div className="max-w-[280px] mx-auto">
                                  {/* iPhone本体 */}
                                  <div className="bg-black rounded-[2rem] p-2 shadow-2xl">
                                    {/* 画面 */}
                                    <div className="bg-white rounded-[1.5rem] overflow-hidden">
                                      {/* ステータスバー */}
                                      <div className="bg-gray-50 px-3 py-1.5 flex items-center justify-between text-[10px]">
                                        <span className="font-semibold">9:41</span>
                                        <div className="flex items-center space-x-1">
                                          <div className="w-3 h-2.5 border border-gray-400 rounded-sm"></div>
                                        </div>
                                      </div>

                                      {/* Web予約ページコンテンツ */}
                                      <div className="p-2 bg-gray-50 space-y-2 max-h-[350px] overflow-y-auto">
                                        {/* ヘッダー */}
                                        <div className="text-center mb-1">
                                          <h2 className="text-sm font-bold text-gray-900">Web予約</h2>
                                          <p className="text-[9px] text-gray-600">簡単にオンラインで予約できます</p>
                                        </div>

                                        {/* ステップ1: 初診/再診選択（トークンで自動スキップされる） */}
                                        <div className="bg-white rounded border border-gray-200 p-2 opacity-50">
                                          <h3 className="font-medium text-gray-900 mb-1.5 text-[10px]">初診/再診の選択</h3>
                                          <div className="p-2 border border-blue-500 bg-blue-50 rounded">
                                            <h4 className="font-medium text-[9px]">再診</h4>
                                            <p className="text-[8px] text-gray-600">過去にご来院されたことがある方</p>
                                          </div>
                                          <div className="mt-1 flex items-center justify-center">
                                            <div className="bg-green-100 border border-green-300 rounded-full px-2 py-0.5">
                                              <span className="text-[8px] font-semibold text-green-800">✓ 自動選択済み</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ステップ2: 診療メニュー選択（トークンで自動選択） */}
                                        <div className="bg-white rounded border-2 border-green-400 p-2">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="font-medium text-gray-900 text-[10px]">診療メニューの選択</h3>
                                            <div className="bg-green-100 border border-green-300 rounded-full px-1.5 py-0.5">
                                              <span className="text-[8px] font-semibold text-green-800">✓ 選択済み</span>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-2 gap-1.5">
                                            <div className="p-2 rounded border-2 border-blue-500 bg-blue-50">
                                              <h4 className="font-medium text-[9px] text-gray-900">定期検診</h4>
                                              <p className="text-[8px] text-gray-600">45分</p>
                                            </div>
                                            <div className="p-2 rounded border border-gray-200 bg-white opacity-40">
                                              <h4 className="font-medium text-[9px] text-gray-900">一般歯科</h4>
                                              <p className="text-[8px] text-gray-600">30分</p>
                                            </div>
                                          </div>
                                        </div>

                                        {/* ステップ3: 日時選択（患者が選択する部分） */}
                                        <div className="bg-white rounded border-2 border-blue-500 p-2 relative">
                                          <div className="absolute -top-2 left-2 bg-blue-500 text-white px-2 py-0.5 rounded-full text-[8px] font-bold shadow-lg animate-pulse">
                                            患者さんが選択！
                                          </div>
                                          <h3 className="font-medium text-gray-900 mb-1 text-[10px]">日時選択</h3>
                                          <p className="text-[8px] text-gray-600 mb-1.5">⭕️をタップして選択</p>

                                          {/* 週ナビゲーション */}
                                          <div className="flex items-center justify-between mb-1.5 gap-1">
                                            <button className="px-1.5 py-0.5 text-[8px] border border-gray-300 rounded flex items-center">
                                              <ChevronLeft className="w-2 h-2" />
                                              先週
                                            </button>
                                            <div className="text-[8px] font-medium text-center">
                                              01/15 - 01/21
                                            </div>
                                            <button className="px-1.5 py-0.5 text-[8px] border border-gray-300 rounded flex items-center">
                                              次週
                                              <ChevronRight className="w-2 h-2" />
                                            </button>
                                          </div>

                                          {/* 週間カレンダー */}
                                          <div className="border border-gray-200 rounded overflow-hidden">
                                            <div className="grid grid-cols-7 bg-gray-100">
                                              {['月', '火', '水', '木', '金', '土', '日'].map((day, i) => (
                                                <div key={i} className="text-center text-[8px] font-medium p-0.5 border-r border-gray-200 last:border-r-0">
                                                  <div className="text-gray-600">{day}</div>
                                                  <div className="text-[7px] text-gray-500">{15 + i}</div>
                                                </div>
                                              ))}
                                            </div>
                                            {/* 時間スロット */}
                                            <div className="grid grid-cols-7">
                                              {[...Array(7)].map((_, dayIndex) => (
                                                <div key={dayIndex} className="border-r border-gray-200 last:border-r-0">
                                                  {/* 午前枠 */}
                                                  <div className="border-b border-gray-100 p-0.5">
                                                    <div className="text-[7px] text-center text-gray-500">AM</div>
                                                    {dayIndex === 3 ? (
                                                      <button className="w-full text-[8px] bg-blue-600 text-white rounded py-0.5 font-medium">
                                                        10:00
                                                      </button>
                                                    ) : dayIndex < 5 ? (
                                                      <button className="w-full text-[8px] bg-white border border-gray-300 rounded py-0.5">
                                                        ⭕️
                                                      </button>
                                                    ) : (
                                                      <div className="text-[8px] text-center text-gray-400">×</div>
                                                    )}
                                                  </div>
                                                  {/* 午後枠 */}
                                                  <div className="p-0.5">
                                                    <div className="text-[7px] text-center text-gray-500">PM</div>
                                                    {dayIndex < 5 ? (
                                                      <button className="w-full text-[8px] bg-white border border-gray-300 rounded py-0.5">
                                                        ⭕️
                                                      </button>
                                                    ) : (
                                                      <div className="text-[8px] text-center text-gray-400">×</div>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* ステップ4: 患者情報入力（トークンで自動入力） */}
                                        <div className="bg-white rounded border-2 border-green-400 p-2">
                                          <div className="flex items-center justify-between mb-1.5">
                                            <h3 className="font-medium text-gray-900 text-[10px]">患者情報の入力</h3>
                                            <div className="bg-green-100 border border-green-300 rounded-full px-1.5 py-0.5">
                                              <span className="text-[8px] font-semibold text-green-800">✓ 入力済み</span>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5">
                                            <div>
                                              <label className="block text-[8px] text-gray-700 mb-0.5">お名前</label>
                                              <div className="px-2 py-1 border-2 border-green-500 bg-green-50 rounded text-[9px] text-gray-900 font-medium">
                                                山田 太郎
                                              </div>
                                            </div>
                                            <div>
                                              <label className="block text-[8px] text-gray-700 mb-0.5">電話番号</label>
                                              <div className="px-2 py-1 border-2 border-green-500 bg-green-50 rounded text-[9px] text-gray-900 font-medium">
                                                090-1234-5678
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 予約確定ボタン */}
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-[10px] shadow-lg">
                                          予約を確定する
                                        </button>
                                      </div>

                                      {/* 入力エリア */}
                                      <div className="border-t border-gray-200 p-2 bg-white">
                                        <div className="h-6 bg-gray-100 rounded-full"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="ml-5 mt-4 mb-4 border-l-2 border-indigo-300 h-8"></div>
                      </div>

                      {/* ステップ6: 予約確定 */}
                      <div className="relative">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-600 to-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              予約完了
                            </h3>
                            <div className="bg-gradient-to-r from-blue-50 via-green-50 to-teal-50 border-2 border-green-300 rounded-lg p-5">
                              <div className="flex items-center space-x-3 mb-3">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <span className="text-base font-semibold text-green-900">予約が完了しました！</span>
                              </div>
                              <div className="bg-white border border-green-200 rounded-lg p-4 space-y-2 text-sm">
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600">✓</span>
                                  <span className="text-gray-700">患者さんが日時を選択して予約確定ボタンをクリック</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600">✓</span>
                                  <span className="text-gray-700">予約がカレンダーに自動登録されます</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-green-600">✓</span>
                                  <span className="text-gray-700">トークンは「使用済み」となり、再利用できなくなります</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-blue-600">📧</span>
                                  <span className="text-gray-700">患者さんに予約完了の通知が送信されます</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Web予約メニュー追加ダイアログ */}
            <Modal
              isOpen={isAddWebMenuDialogOpen}
              onClose={() => {
                setIsAddWebMenuDialogOpen(false);
                setNewWebMenu({
                  treatment_menu_id: "",
                  treatment_menu_level2_id: "",
                  treatment_menu_level3_id: "",
                  display_name: "",
                  duration: 30,
                  steps: [],
                  allow_new_patient: true,
                  allow_returning: true,
                });
              }}
              title="Web予約メニューを追加"
              size="large"
            >
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 診療メニュー選択（階層的） */}
                <div className="space-y-3">
                  {/* メニュー1選択 */}
                  <div>
                    <Label htmlFor="web_treatment_menu_level1">
                      診療メニュー1
                    </Label>
                    <Select
                      value={newWebMenu.treatment_menu_id}
                      onValueChange={(value) =>
                        setNewWebMenu((prev) => ({
                          ...prev, 
                          treatment_menu_id: value,
                          treatment_menu_level2_id: "",
                          treatment_menu_level3_id: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="メニュー1を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentMenus
                          .filter((m) => m.level === 1)
                          .map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                                  style={{
                                    backgroundColor: menu.color || "#bfbfbf",
                                  }}
                            />
                              <span>{menu.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                          </div>

                  {/* メニュー2選択（メニュー1が選択されている場合のみ表示） */}
                  {newWebMenu.treatment_menu_id &&
                    (() => {
                      const childMenus = treatmentMenus.filter(
                        (m) => m.parent_id === newWebMenu.treatment_menu_id,
                      );
                    return childMenus.length > 0 ? (
                      <div>
                          <Label htmlFor="web_treatment_menu_level2">
                            診療メニュー2（オプション）
                          </Label>
                        <Select
                            value={
                              newWebMenu.treatment_menu_level2_id || undefined
                            }
                          onValueChange={(value) =>
                              setNewWebMenu((prev) => ({
                              ...prev, 
                              treatment_menu_level2_id: value,
                                treatment_menu_level3_id: "",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メニュー2を選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                              {childMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                      style={{
                                        backgroundColor:
                                          menu.color || "#bfbfbf",
                                      }}
                                  />
                                  <span>{menu.name}</span>
                          </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      ) : null;
                  })()}

                  {/* メニュー3選択（メニュー2が選択されている場合のみ表示） */}
                  {newWebMenu.treatment_menu_level2_id &&
                    (() => {
                      const childMenus = treatmentMenus.filter(
                        (m) =>
                          m.parent_id === newWebMenu.treatment_menu_level2_id,
                      );
                    return childMenus.length > 0 ? (
                              <div>
                          <Label htmlFor="web_treatment_menu_level3">
                            サブメニュー（オプション）
                          </Label>
                        <Select
                            value={
                              newWebMenu.treatment_menu_level3_id || undefined
                            }
                          onValueChange={(value) =>
                              setNewWebMenu((prev) => ({
                              ...prev, 
                                treatment_menu_level3_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="サブメニューを選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                              {childMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                      style={{
                                        backgroundColor:
                                          menu.color || "#bfbfbf",
                                      }}
                                  />
                                  <span>{menu.name}</span>
                                    </div>
                              </SelectItem>
                                  ))}
                          </SelectContent>
                        </Select>
                                </div>
                      ) : null;
                  })()}
                              </div>

                {/* Web予約時の表示名 */}
                {newWebMenu.treatment_menu_id && (
                              <div>
                    <Label htmlFor="web_display_name">Web予約時の表示名</Label>
                                <Input
                      id="web_display_name"
                      value={newWebMenu.display_name}
                                  onChange={(e) =>
                        setNewWebMenu((prev) => ({
                          ...prev,
                          display_name: e.target.value,
                        }))
                      }
                      placeholder={(() => {
                        const level1Menu = treatmentMenus.find(
                          (m) => m.id === newWebMenu.treatment_menu_id,
                        );
                        const level2Menu = newWebMenu.treatment_menu_level2_id
                          ? treatmentMenus.find(
                              (m) =>
                                m.id === newWebMenu.treatment_menu_level2_id,
                            )
                          : null;
                        const level3Menu = newWebMenu.treatment_menu_level3_id
                          ? treatmentMenus.find(
                              (m) =>
                                m.id === newWebMenu.treatment_menu_level3_id,
                            )
                          : null;
                        const menuNameParts = [
                          level1Menu?.name,
                          level2Menu?.name,
                          level3Menu?.name,
                        ].filter(Boolean);
                        return menuNameParts.join(" > ") || "例: 初診検査";
                      })()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      空欄の場合は、選択した診療メニュー名が使用されます
                                </p>
                              </div>
                )}

                {/* 全体の診療時間表示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    全体の診療時間: {newWebMenu.duration}分
                  </p>
                </div>

                {/* ステップ一覧 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      処置ステップ
                    </Label>
                    <Button onClick={handleAddStep} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      ステップを追加
                    </Button>
                  </div>

                  {newWebMenu.steps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">ステップが登録されていません</p>
                      <p className="text-xs mt-1">
                        「ステップを追加」ボタンから処置ステップを追加してください
                      </p>
                    </div>
                  ) : (
                    newWebMenu.steps.map((step, index) => (
                      <div key={step.id}>
                        {/* ステップカード */}
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              ステップ {step.step_order}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 時間設定 */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                              <div>
                              <Label className="text-xs">開始時間</Label>
                              <Input
                                type="number"
                                value={step.start_time}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">終了時間</Label>
                              <Input
                                type="number"
                                value={step.end_time}
                                onChange={(e) =>
                                  handleUpdateStepTime(
                                    step.id,
                                    parseInt(e.target.value) || step.start_time,
                                  )
                                }
                                className="text-sm"
                                min={step.start_time + 5}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">所要時間</Label>
                              <Input
                                type="number"
                                value={step.duration}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                          </div>

                          {/* 配置タイプ */}
                          <div className="mb-3">
                            <Label className="text-xs mb-2 block">
                              配置タイプ
                            </Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === "serial"}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">順番（直列）</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === "parallel"}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">同時（並列）</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.type === "serial"
                                ? "選択した担当者のいずれか1人が自動割り当てされます"
                                : "選択した全ての担当者が同時に必要です"}
                            </p>
                          </div>

                          {/* 担当者選択 */}
                          <div>
                            <Label className="text-xs mb-2 block">担当者</Label>
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {staff.map((s) => (
                                  <label
                                    key={s.id}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={step.staff_assignments.some(
                                        (sa) => sa.staff_id === s.id,
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          handleAddStaffToStep(step.id, s.id);
                                        } else {
                                          handleRemoveStaffFromStep(
                                            step.id,
                                            s.id,
                                          );
                                        }
                                      }}
                                      className="shrink-0"
                                    />
                                    <span className="text-sm">{s.name}</span>
                                  </label>
                                ))}
                              </div>

                              {/* 選択された担当者の優先順位 */}
                              {step.staff_assignments.length > 0 &&
                                step.type === "serial" && (
                                <div className="border-t pt-3 mt-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">
                                      優先順位（上から順に割り当て）
                                    </p>
                                  <div className="space-y-1">
                                      {step.staff_assignments.map(
                                        (assignment, idx) => {
                                          const staffMember = staff.find(
                                            (s) => s.id === assignment.staff_id,
                                          );
                                      return (
                                            <div
                                              key={assignment.staff_id}
                                              className="flex items-center justify-between bg-white px-2 py-1 rounded"
                                            >
                                          <span className="text-sm">
                                            {idx + 1}. {staffMember?.name}
                                          </span>
                                          <div className="flex space-x-1">
                                            <button
                                                  onClick={() =>
                                                    handleMoveStaffPriority(
                                                      step.id,
                                                      assignment.staff_id,
                                                      "up",
                                                    )
                                                  }
                                              disabled={idx === 0}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                                            </button>
                                            <button
                                                  onClick={() =>
                                                    handleMoveStaffPriority(
                                                      step.id,
                                                      assignment.staff_id,
                                                      "down",
                                                    )
                                                  }
                                                  disabled={
                                                    idx ===
                                                    step.staff_assignments
                                                      .length -
                                                      1
                                                  }
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-90" />
                                            </button>
                                          </div>
                                        </div>
                                          );
                                        },
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ステップ間の矢印 */}
                        {index < newWebMenu.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            {step.type === "serial" &&
                              newWebMenu.steps[index + 1].type === "serial" && (
                              <div className="text-gray-400">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                                <p className="text-xs">順番</p>
                              </div>
                            )}
                            {step.type === "parallel" ||
                            newWebMenu.steps[index + 1].type === "parallel" ? (
                              <div className="text-gray-400">
                                <div className="flex items-center">
                                  <ChevronRight className="w-5 h-5 rotate-90" />
                                  <ChevronRight className="w-5 h-5 rotate-[-90deg] -ml-2" />
                                </div>
                                <p className="text-xs text-center">同時</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 受付可能な患者 */}
                <div>
                  <Label className="mb-2 block">受付可能な患者</Label>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                        id="web_menu_allow_new"
                        checked={newWebMenu.allow_new_patient}
                                      onCheckedChange={(checked) =>
                          setNewWebMenu((prev) => ({
                            ...prev,
                            allow_new_patient: checked as boolean,
                          }))
                                      }
                                    />
                      <Label htmlFor="web_menu_allow_new">初診</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                        id="web_menu_allow_returning"
                        checked={newWebMenu.allow_returning}
                                      onCheckedChange={(checked) =>
                          setNewWebMenu((prev) => ({
                            ...prev,
                            allow_returning: checked as boolean,
                          }))
                                      }
                                    />
                      <Label htmlFor="web_menu_allow_returning">再診</Label>
                                  </div>
                                </div>
                              </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddWebMenuDialogOpen(false);
                    setNewWebMenu({
                        treatment_menu_id: "",
                        treatment_menu_level2_id: "",
                        treatment_menu_level3_id: "",
                        display_name: "",
                      duration: 30,
                      steps: [],
                      allow_new_patient: true,
                        allow_returning: true,
                      });
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleAddWebBookingMenu}>追加</Button>
                </div>
                        </div>
            </Modal>

            {/* Web予約メニュー編集ダイアログ */}
            <Modal
              isOpen={isEditWebMenuDialogOpen}
              onClose={() => {
                setIsEditWebMenuDialogOpen(false);
                setEditingWebMenu(null);
                setNewWebMenu({
                  treatment_menu_id: "",
                  treatment_menu_level2_id: "",
                  treatment_menu_level3_id: "",
                  duration: 30,
                  steps: [],
                  allow_new_patient: true,
                  allow_returning: true,
                });
              }}
              title="Web予約メニューを編集"
              size="large"
            >
              <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 診療メニュー選択（階層的） */}
                <div className="space-y-3">
                  {/* メニュー1選択 */}
                  <div>
                    <Label htmlFor="edit_web_treatment_menu_level1">
                      診療メニュー1
                    </Label>
                    <Select
                      value={newWebMenu.treatment_menu_id}
                      onValueChange={(value) =>
                        setNewWebMenu((prev) => ({
                          ...prev, 
                          treatment_menu_id: value,
                          treatment_menu_level2_id: "",
                          treatment_menu_level3_id: "",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="メニュー1を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentMenus
                          .filter((m) => m.level === 1)
                          .map((menu) => (
                          <SelectItem key={menu.id} value={menu.id}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded"
                                  style={{
                                    backgroundColor: menu.color || "#bfbfbf",
                                  }}
                              />
                              <span>{menu.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* メニュー2選択 */}
                  {newWebMenu.treatment_menu_id &&
                    (() => {
                      const childMenus = treatmentMenus.filter(
                        (m) => m.parent_id === newWebMenu.treatment_menu_id,
                      );
                    return childMenus.length > 0 ? (
                      <div>
                          <Label htmlFor="edit_web_treatment_menu_level2">
                            診療メニュー2（オプション）
                          </Label>
                        <Select
                            value={
                              newWebMenu.treatment_menu_level2_id || undefined
                            }
                          onValueChange={(value) =>
                              setNewWebMenu((prev) => ({
                              ...prev, 
                              treatment_menu_level2_id: value,
                                treatment_menu_level3_id: "",
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="メニュー2を選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                              {childMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                      style={{
                                        backgroundColor:
                                          menu.color || "#bfbfbf",
                                      }}
                                  />
                                  <span>{menu.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      ) : null;
                  })()}

                  {/* メニュー3選択 */}
                  {newWebMenu.treatment_menu_level2_id &&
                    (() => {
                      const childMenus = treatmentMenus.filter(
                        (m) =>
                          m.parent_id === newWebMenu.treatment_menu_level2_id,
                      );
                    return childMenus.length > 0 ? (
                      <div>
                          <Label htmlFor="edit_web_treatment_menu_level3">
                            サブメニュー（オプション）
                          </Label>
                        <Select
                            value={
                              newWebMenu.treatment_menu_level3_id || undefined
                            }
                          onValueChange={(value) =>
                              setNewWebMenu((prev) => ({
                              ...prev, 
                                treatment_menu_level3_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="サブメニューを選択（任意）" />
                          </SelectTrigger>
                          <SelectContent>
                              {childMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                <div className="flex items-center space-x-2">
                                  <div
                                    className="w-4 h-4 rounded"
                                      style={{
                                        backgroundColor:
                                          menu.color || "#bfbfbf",
                                      }}
                                  />
                                  <span>{menu.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      ) : null;
                  })()}
                </div>

                {/* Web予約時の表示名 */}
                {newWebMenu.treatment_menu_id && (
                  <div>
                    <Label htmlFor="edit_web_display_name">
                      Web予約時の表示名
                    </Label>
                    <Input
                      id="edit_web_display_name"
                      value={newWebMenu.display_name}
                      onChange={(e) =>
                        setNewWebMenu((prev) => ({
                          ...prev,
                          display_name: e.target.value,
                        }))
                      }
                      placeholder={(() => {
                        const level1Menu = treatmentMenus.find(
                          (m) => m.id === newWebMenu.treatment_menu_id,
                        );
                        const level2Menu = newWebMenu.treatment_menu_level2_id
                          ? treatmentMenus.find(
                              (m) =>
                                m.id === newWebMenu.treatment_menu_level2_id,
                            )
                          : null;
                        const level3Menu = newWebMenu.treatment_menu_level3_id
                          ? treatmentMenus.find(
                              (m) =>
                                m.id === newWebMenu.treatment_menu_level3_id,
                            )
                          : null;
                        const menuNameParts = [
                          level1Menu?.name,
                          level2Menu?.name,
                          level3Menu?.name,
                        ].filter(Boolean);
                        return menuNameParts.join(" > ") || "例: 初診検査";
                      })()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      空欄の場合は、選択した診療メニュー名が使用されます
                    </p>
                            </div>
                          )}

                {/* 全体の診療時間表示 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900">
                    全体の診療時間: {newWebMenu.duration}分
                  </p>
                        </div>

                {/* ステップ一覧 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">
                      処置ステップ
                    </Label>
                    <Button onClick={handleAddStep} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      ステップを追加
                    </Button>
                  </div>

                  {newWebMenu.steps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">ステップが登録されていません</p>
                      <p className="text-xs mt-1">
                        「ステップを追加」ボタンから処置ステップを追加してください
                      </p>
                    </div>
                  ) : (
                    newWebMenu.steps.map((step, index) => (
                      <div key={step.id}>
                        {/* ステップカード */}
                        <div className="border border-gray-300 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              ステップ {step.step_order}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStep(step.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* 時間設定 */}
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <Label className="text-xs">開始時間</Label>
                              <Input
                                type="number"
                                value={step.start_time}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">終了時間</Label>
                              <Input
                                type="number"
                                value={step.end_time}
                                onChange={(e) =>
                                  handleUpdateStepTime(
                                    step.id,
                                    parseInt(e.target.value) || step.start_time,
                                  )
                                }
                                className="text-sm"
                                min={step.start_time + 5}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">所要時間</Label>
                              <Input
                                type="number"
                                value={step.duration}
                                disabled
                                className="text-sm bg-gray-50"
                              />
                            </div>
                          </div>

                          {/* 配置タイプ */}
                          <div className="mb-3">
                            <Label className="text-xs mb-2 block">
                              配置タイプ
                            </Label>
                            <div className="flex space-x-4">
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === "serial"}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">順番（直列）</span>
                              </label>
                              <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={step.type === "parallel"}
                                  onChange={() => handleToggleStepType(step.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm">同時（並列）</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {step.type === "serial"
                                ? "選択した担当者のいずれか1人が自動割り当てされます"
                                : "選択した全ての担当者が同時に必要です"}
                            </p>
                          </div>

                          {/* 担当者選択 */}
                          <div>
                            <Label className="text-xs mb-2 block">担当者</Label>
                            <div className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex flex-wrap gap-2 mb-3">
                                {staff.map((s) => (
                                  <label
                                    key={s.id}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={step.staff_assignments.some(
                                        (sa) => sa.staff_id === s.id,
                                      )}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          handleAddStaffToStep(step.id, s.id);
                                        } else {
                                          handleRemoveStaffFromStep(
                                            step.id,
                                            s.id,
                                          );
                                        }
                                      }}
                                      className="shrink-0"
                                    />
                                    <span className="text-sm">{s.name}</span>
                                  </label>
                                ))}
                              </div>

                              {/* 選択された担当者の優先順位 */}
                              {step.staff_assignments.length > 0 &&
                                step.type === "serial" && (
                                <div className="border-t pt-3 mt-3">
                                    <p className="text-xs font-medium text-gray-700 mb-2">
                                      優先順位（上から順に割り当て）
                                    </p>
                                  <div className="space-y-1">
                                      {step.staff_assignments.map(
                                        (assignment, idx) => {
                                          const staffMember = staff.find(
                                            (s) => s.id === assignment.staff_id,
                                          );
                                      return (
                                            <div
                                              key={assignment.staff_id}
                                              className="flex items-center justify-between bg-white px-2 py-1 rounded"
                                            >
                                          <span className="text-sm">
                                            {idx + 1}. {staffMember?.name}
                                          </span>
                                          <div className="flex space-x-1">
                                            <button
                                                  onClick={() =>
                                                    handleMoveStaffPriority(
                                                      step.id,
                                                      assignment.staff_id,
                                                      "up",
                                                    )
                                                  }
                                              disabled={idx === 0}
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-[-90deg]" />
                                            </button>
                                            <button
                                                  onClick={() =>
                                                    handleMoveStaffPriority(
                                                      step.id,
                                                      assignment.staff_id,
                                                      "down",
                                                    )
                                                  }
                                                  disabled={
                                                    idx ===
                                                    step.staff_assignments
                                                      .length -
                                                      1
                                                  }
                                              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                                            >
                                              <ChevronRight className="w-3 h-3 rotate-90" />
                                            </button>
                                          </div>
                                        </div>
                                          );
                                        },
                                      )}
                                  </div>
                    </div>
                  )}
                            </div>
                          </div>
                        </div>

                        {/* ステップ間の矢印 */}
                        {index < newWebMenu.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            {step.type === "serial" &&
                              newWebMenu.steps[index + 1].type === "serial" && (
                              <div className="text-gray-400">
                                <ChevronRight className="w-5 h-5 rotate-90" />
                                <p className="text-xs">順番</p>
                              </div>
                            )}
                            {step.type === "parallel" ||
                            newWebMenu.steps[index + 1].type === "parallel" ? (
                              <div className="text-gray-400">
                                <div className="flex items-center">
                                  <ChevronRight className="w-5 h-5 rotate-90" />
                                  <ChevronRight className="w-5 h-5 rotate-[-90deg] -ml-2" />
                                </div>
                                <p className="text-xs text-center">同時</p>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* 受付可能な患者 */}
                <div>
                  <Label className="mb-2 block">受付可能な患者</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit_web_menu_allow_new"
                        checked={newWebMenu.allow_new_patient}
                        onCheckedChange={(checked) =>
                          setNewWebMenu((prev) => ({
                            ...prev,
                            allow_new_patient: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="edit_web_menu_allow_new">初診</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit_web_menu_allow_returning"
                        checked={newWebMenu.allow_returning}
                        onCheckedChange={(checked) =>
                          setNewWebMenu((prev) => ({
                            ...prev,
                            allow_returning: checked as boolean,
                          }))
                        }
                      />
                      <Label htmlFor="edit_web_menu_allow_returning">
                        再診
                      </Label>
                    </div>
                  </div>
                </div>

                {/* フッター */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditWebMenuDialogOpen(false);
                      setEditingWebMenu(null);
                    setNewWebMenu({
                        treatment_menu_id: "",
                        treatment_menu_level2_id: "",
                        treatment_menu_level3_id: "",
                        display_name: "",
                      duration: 30,
                      steps: [],
                      allow_new_patient: true,
                        allow_returning: true,
                      });
                    }}
                  >
                    キャンセル
                  </Button>
                  <Button onClick={handleSaveEditWebMenu} className="bg-blue-600 hover:bg-blue-700 text-white">保存</Button>
                </div>
              </div>
            </Modal>

          {/* Web予約設定保存ボタン */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button onClick={handleSaveWebSettings} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              Web予約設定を保存
            </Button>
          </div>
          </div>
        )}
        {selectedCategory === "notification" && (
          <div className="space-y-6">
            {/* サブタブナビゲーション */}
            <div className="flex space-x-0 mb-6 border-b border-gray-200">
              <button
                onMouseEnter={() => setNotificationTab("connection")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  notificationTab === "connection"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                接続設定
              </button>
              <button
                onMouseEnter={() => setNotificationTab("templates")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  notificationTab === "templates"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                テンプレート
              </button>
              <button
                onMouseEnter={() => setNotificationTab("auto-reminder")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  notificationTab === "auto-reminder"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                自動リマインド
              </button>
              <button
                onMouseEnter={() => setNotificationTab("rich-menu")}
                className={`px-8 py-4 font-medium text-base transition-colors border-b-2 ${
                  notificationTab === "rich-menu"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                LINEリッチメニュー
              </button>
            </div>

            {/* タブコンテンツ */}
            {notificationTab === "connection" && (
              <div className="space-y-6">
                {/* メール設定 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Mail className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          メール設定
                        </h3>
                        <p className="text-sm text-gray-600">
                          SMTP経由でのメール送信設定
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email.enabled}
                        onChange={(e) =>
                          setNotificationSettings({
                          ...notificationSettings,
                            email: {
                              ...notificationSettings.email,
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        有効化
                      </span>
                    </label>
                  </div>

                  {notificationSettings.email.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMTPホスト
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.email.smtp_host}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                smtp_host: e.target.value,
                              },
                            })
                          }
                          placeholder="smtp.example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMTPポート
                        </label>
                        <input
                          type="number"
                          value={notificationSettings.email.smtp_port}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                smtp_port: parseInt(e.target.value),
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMTPユーザー名
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.email.smtp_user}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                smtp_user: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SMTPパスワード
                        </label>
                        <input
                          type="password"
                          value={notificationSettings.email.smtp_password}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                smtp_password: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          送信元アドレス
                        </label>
                        <input
                          type="email"
                          value={notificationSettings.email.from_address}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                from_address: e.target.value,
                              },
                            })
                          }
                          placeholder="noreply@example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          送信元名
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.email.from_name}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              email: {
                                ...notificationSettings.email,
                                from_name: e.target.value,
                              },
                            })
                          }
                          placeholder="〇〇クリニック"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SMS設定 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          SMS設定
                        </h3>
                        <p className="text-sm text-gray-600">
                          SMS送信サービスの設定
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.sms.enabled}
                        onChange={(e) =>
                          setNotificationSettings({
                          ...notificationSettings,
                            sms: {
                              ...notificationSettings.sms,
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        有効化
                      </span>
                    </label>
                  </div>

                  {notificationSettings.sms.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          プロバイダー
                        </label>
                        <select
                          value={notificationSettings.sms.provider}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              sms: {
                                ...notificationSettings.sms,
                                provider: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="twilio">Twilio</option>
                          <option value="aws-sns">AWS SNS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          APIキー
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.sms.api_key}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              sms: {
                                ...notificationSettings.sms,
                                api_key: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          APIシークレット
                        </label>
                        <input
                          type="password"
                          value={notificationSettings.sms.api_secret}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              sms: {
                                ...notificationSettings.sms,
                                api_secret: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          送信元番号
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.sms.sender_number}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              sms: {
                                ...notificationSettings.sms,
                                sender_number: e.target.value,
                              },
                            })
                          }
                          placeholder="+81-90-1234-5678"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LINE設定 */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          LINE公式アカウント設定
                        </h3>
                        <p className="text-sm text-gray-600">
                          LINE Messaging APIの設定
                        </p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.line.enabled}
                        onChange={(e) =>
                          setNotificationSettings({
                          ...notificationSettings,
                            line: {
                              ...notificationSettings.line,
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        有効化
                      </span>
                    </label>
                  </div>

                  {notificationSettings.line.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          チャンネルID
                        </label>
                        <input
                          type="text"
                          value={notificationSettings.line.channel_id}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              line: {
                                ...notificationSettings.line,
                                channel_id: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          チャンネルシークレット
                        </label>
                        <input
                          type="password"
                          value={notificationSettings.line.channel_secret}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              line: {
                                ...notificationSettings.line,
                                channel_secret: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          チャンネルアクセストークン
                        </label>
                        <input
                          type="password"
                          value={notificationSettings.line.channel_access_token}
                          onChange={(e) =>
                            setNotificationSettings({
                            ...notificationSettings,
                              line: {
                                ...notificationSettings.line,
                                channel_access_token: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Webhook URL（本番環境用）
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notificationSettings.line.webhook_url}
                            readOnly
                            placeholder="https://your-domain.com/api/line/webhook"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                          />
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                notificationSettings.line.webhook_url,
                              );
                              showAlert("Webhook URLをコピーしました", "success");
                            }}
                            variant="outline"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800 font-medium mb-1">
                            ⚠️ 開発環境での注意
                          </p>
                          <p className="text-xs text-yellow-700">
                            LINE
                            WebhookはHTTPSが必須です。ローカル開発環境（http://localhost）では動作しません。
                            <br />
                            開発時は{" "}
                            <a
                              href="https://ngrok.com"
                              target="_blank"
                              className="underline"
                            >
                              ngrok
                            </a>{" "}
                            を使用してHTTPSトンネルを作成し、
                            <br />
                            例:{" "}
                            <code className="bg-yellow-100 px-1 rounded">
                              https://xxxx.ngrok.io/api/line/webhook
                            </code>{" "}
                            のようなURLをLINE
                            Developersコンソールに設定してください。
                          </p>
                        </div>
                      </div>

                      {/* LIFF ID / ミニアプリID 設定 */}
                      <div className="col-span-2 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                          </svg>
                          LIFF ID / LINEミニアプリID
                        </h4>
                        <p className="text-xs text-blue-800 mb-4">
                          LINE Developers Console で作成した5つのLIFF（またはLINEミニアプリ）のIDを入力してください。<br/>
                          設定後は <code className="bg-blue-100 px-1 rounded">.env.local</code> ファイルへの手動設定は不要になります。
                        </p>

                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              初回連携 LIFF ID
                            </label>
                            <input
                              type="text"
                              value={notificationSettings.line.liff_id_initial_link}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  line: {
                                    ...notificationSettings.line,
                                    liff_id_initial_link: e.target.value,
                                  },
                                })
                              }
                              placeholder="1234567890-abcdefgh"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              環境変数: NEXT_PUBLIC_LIFF_ID_INITIAL_LINK
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              QRコード LIFF ID
                            </label>
                            <input
                              type="text"
                              value={notificationSettings.line.liff_id_qr_code}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  line: {
                                    ...notificationSettings.line,
                                    liff_id_qr_code: e.target.value,
                                  },
                                })
                              }
                              placeholder="1234567890-xxxxxxxx"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              環境変数: NEXT_PUBLIC_LIFF_ID_QR_CODE
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              家族登録 LIFF ID
                            </label>
                            <input
                              type="text"
                              value={notificationSettings.line.liff_id_family_register}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  line: {
                                    ...notificationSettings.line,
                                    liff_id_family_register: e.target.value,
                                  },
                                })
                              }
                              placeholder="1234567890-yyyyyyyy"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              環境変数: NEXT_PUBLIC_LIFF_ID_FAMILY_REGISTER
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              予約確認 LIFF ID
                            </label>
                            <input
                              type="text"
                              value={notificationSettings.line.liff_id_appointments}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  line: {
                                    ...notificationSettings.line,
                                    liff_id_appointments: e.target.value,
                                  },
                                })
                              }
                              placeholder="1234567890-zzzzzzzz"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              環境変数: NEXT_PUBLIC_LIFF_ID_APPOINTMENTS
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Web予約 LIFF ID
                            </label>
                            <input
                              type="text"
                              value={notificationSettings.line.liff_id_web_booking}
                              onChange={(e) =>
                                setNotificationSettings({
                                  ...notificationSettings,
                                  line: {
                                    ...notificationSettings.line,
                                    liff_id_web_booking: e.target.value,
                                  },
                                })
                              }
                              placeholder="1234567890-wwwwwwww"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              環境変数: NEXT_PUBLIC_LIFF_ID_WEB_BOOKING
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-900 font-medium mb-2">
                            💡 設定のヒント
                          </p>
                          <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                            <li>LINE Developers Console の「LIFF」または「LINEミニアプリ」タブで作成</li>
                            <li>各LIFFアプリ作成後に表示されるIDをコピーして貼り付け</li>
                            <li>保存後、サーバーを再起動すると設定が反映されます</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 保存ボタン */}
                <div className="flex justify-end">
                  <Button
                    onClick={async () => {
                      console.log(
                        "保存ボタンクリック - 現在の設定:",
                        notificationSettings,
                      );
                      setSaving(true);
                      try {
                        const payload = {
                          clinic_id: DEMO_CLINIC_ID,
                          settings: notificationSettings,
                        };
                        console.log("送信データ:", payload);

                        const response = await fetch(
                          "/api/notification-settings",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          },
                        );

                        console.log("レスポンスステータス:", response.status);
                        const responseData = await response.json();
                        console.log("レスポンスデータ:", responseData);

                        if (response.ok) {
                          showAlert("接続設定を保存しました", "success");
                        } else {
                          throw new Error(
                            responseData.error ||
                              responseData.details ||
                              "保存に失敗しました",
                          );
                        }
                      } catch (error) {
                        console.error("保存エラー詳細:", error);
                        showAlert(
                          `保存に失敗しました\n\n${error instanceof Error ? error.message : "不明なエラー"}`,
                          "error"
                        );
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            )}

            {notificationTab === "templates" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      通知テンプレート
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      メッセージテンプレートの管理
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingTemplate(null);
                    setTemplateForm({
                        name: "",
                        notification_type: "appointment_reminder",
                        line_message: "",
                        email_subject: "",
                        email_message: "",
                        sms_message: "",
                        auto_send_enabled: false,
                        auto_send_trigger: "manual",
                        auto_send_timing_value: 3,
                        auto_send_timing_unit: "days_before",
                      });
                      setActiveChannelTab("line");
                      setShowTemplateModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新規作成
                  </Button>
                </div>

                {/* テンプレート一覧 */}
                {templates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>テンプレートがありません</p>
                    <p className="text-sm mt-1">
                      「新規作成」ボタンからテンプレートを作成してください
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border border-gray-200 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {template.name}
                            </h4>
                            {/* 送信タイミング表示 */}
                            {template.auto_send_enabled && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                {template.auto_send_trigger === "appointment_created" && "予約作成時に送信"}
                                {template.auto_send_trigger === "appointment_date" &&
                                  `予約日の${template.auto_send_timing_value}${template.auto_send_timing_unit === "days_before" ? "日前" : "日後"}に送信`}
                                {template.auto_send_trigger === "line_linked" && "LINE連携時に送信"}
                                {template.auto_send_trigger === "manual" && "手動送信のみ"}
                              </span>
                            )}
                            </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateForm({
                                  name: template.name,
                                  notification_type: template.notification_type,
                                  line_message: template.line_message || "",
                                  email_subject: template.email_subject || "",
                                  email_message: template.email_message || "",
                                  sms_message: template.sms_message || "",
                                  auto_send_enabled: template.auto_send_enabled || false,
                                  auto_send_trigger: template.auto_send_trigger || "manual",
                                  auto_send_timing_value: template.auto_send_timing_value || 3,
                                  auto_send_timing_unit: template.auto_send_timing_unit || "days_before",
                                });
                                setActiveChannelTab("line");
                                setShowTemplateModal(true);
                              }}
                              className="h-7 px-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                showConfirm("このテンプレートを削除しますか?", async () => {
                                  try {
                                    const response = await fetch(
                                      `/api/notification-templates?id=${template.id}`,
                                      {
                                        method: "DELETE",
                                      },
                                    );

                                    if (response.ok) {
                                      setTemplates(
                                        templates.filter(
                                          (t) => t.id !== template.id,
                                        ),
                                      );
                                    } else {
                                      showAlert("削除に失敗しました", "error");
                                    }
                                  } catch (error) {
                                    console.error(
                                      "テンプレート削除エラー:",
                                      error,
                                    );
                                    showAlert("削除に失敗しました", "error");
                                  }
                                }, { isDanger: true, confirmText: "削除" });
                              }}
                              className="h-7 px-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* テンプレート作成・編集モーダル */}
                {showTemplateModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
                      {/* ヘッダー */}
                      <div className="flex justify-between items-center px-6 py-3 border-b border-gray-200 gap-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-1">
                          <input
                            type="text"
                            value={templateForm.name}
                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                              placeholder="テンプレート名を入力"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                          <div className="w-48">
                          <select
                            value={templateForm.notification_type}
                            onChange={(e) => setTemplateForm({ ...templateForm, notification_type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="appointment_reminder">予約リマインド</option>
                            <option value="periodic_checkup">定期検診</option>
                            <option value="treatment_reminder">治療リマインド</option>
                            <option value="appointment_change">予約変更</option>
                            <option value="custom">カスタム</option>
                          </select>
                        </div>
                          {/* 自動送信設定 */}
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={templateForm.auto_send_enabled}
                                onChange={(e) => setTemplateForm({ ...templateForm, auto_send_enabled: e.target.checked })}
                                className="w-4 h-4"
                              />
                              <span className="text-sm font-medium">自動送信</span>
                            </label>
                          </div>
                        </div>
                        {/* 自動送信設定の詳細 */}
                        {templateForm.auto_send_enabled && (
                          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center gap-4">
                              <label className="text-sm font-medium text-gray-700">送信タイミング:</label>
                              <select
                                value={templateForm.auto_send_trigger}
                                onChange={(e) => setTemplateForm({ ...templateForm, auto_send_trigger: e.target.value as any })}
                                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="appointment_created">予約作成時</option>
                                <option value="appointment_date">予約日から</option>
                                <option value="line_linked">LINE連携時</option>
                                <option value="manual">手動のみ</option>
                              </select>
                              {templateForm.auto_send_trigger === 'appointment_date' && (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    value={templateForm.auto_send_timing_value || 1}
                                    onChange={(e) => setTemplateForm({ ...templateForm, auto_send_timing_value: parseInt(e.target.value) || 1 })}
                                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                                  />
                                  <select
                                    value={templateForm.auto_send_timing_unit}
                                    onChange={(e) => setTemplateForm({ ...templateForm, auto_send_timing_unit: e.target.value as any })}
                                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
                                  >
                                    <option value="days_before">日前</option>
                                    <option value="days_after">日後</option>
                                  </select>
                                </>
                              )}
                              {templateForm.auto_send_trigger === 'appointment_created' && (
                                <span className="text-sm text-gray-600">→ 予約作成直後に自動送信</span>
                              )}
                              {templateForm.auto_send_trigger === 'line_linked' && (
                                <span className="text-sm text-gray-600">→ LINE連携完了時に自動送信</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setShowTemplateModal(false)}
                          >
                            キャンセル
                          </Button>
                          <Button
                            onClick={async () => {
                              // バリデーション
                              if (
                                !templateForm.line_message &&
                                !templateForm.email_message &&
                                !templateForm.sms_message
                              ) {
                                showAlert(
                                  "少なくとも1つのチャネルのメッセージを入力してください",
                                  "error"
                                );
                                return;
                              }

                              setSaving(true);
                              try {
                                if (editingTemplate) {
                                  // 更新
                                  const response = await fetch(
                                    "/api/notification-templates",
                                    {
                                      method: "PUT",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        id: editingTemplate.id,
                                        name: templateForm.name,
                                        notification_type:
                                          templateForm.notification_type,
                                        line_message: templateForm.line_message,
                                        email_subject:
                                          templateForm.email_subject,
                                        email_message:
                                          templateForm.email_message,
                                        sms_message: templateForm.sms_message,
                                        auto_send_enabled: templateForm.auto_send_enabled,
                                        auto_send_trigger: templateForm.auto_send_trigger,
                                        auto_send_timing_value: templateForm.auto_send_timing_value,
                                        auto_send_timing_unit: templateForm.auto_send_timing_unit,
                                      }),
                                    },
                                  );

                                  if (response.ok) {
                                    const updated = await response.json();
                                    setTemplates(
                                      templates.map((t) =>
                                        t.id === editingTemplate.id
                                          ? updated
                                          : t,
                                      ),
                                    );
                                  }
                                } else {
                                  // 新規作成
                                  const response = await fetch(
                                    "/api/notification-templates",
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        clinic_id: DEMO_CLINIC_ID,
                                        name: templateForm.name,
                                        notification_type:
                                          templateForm.notification_type,
                                        line_message: templateForm.line_message,
                                        email_subject:
                                          templateForm.email_subject,
                                        email_message:
                                          templateForm.email_message,
                                        sms_message: templateForm.sms_message,
                                        auto_send_enabled: templateForm.auto_send_enabled,
                                        auto_send_trigger: templateForm.auto_send_trigger,
                                        auto_send_timing_value: templateForm.auto_send_timing_value,
                                        auto_send_timing_unit: templateForm.auto_send_timing_unit,
                                      }),
                                    },
                                  );

                                  if (response.ok) {
                                    const created = await response.json();
                                    setTemplates([
                                      ...templates,
                                      created,
                                    ]);
                                  }
                                }
                                setShowTemplateModal(false);
                              } catch (error) {
                                console.error("テンプレート保存エラー:", error);
                                showAlert("保存に失敗しました", "error");
                              } finally {
                                setSaving(false);
                              }
                            }}
                            disabled={saving}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "保存中..." : "保存"}
                          </Button>
                          <button
                            onClick={() => setShowTemplateModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* 2カラムレイアウト */}
                      <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-6 p-6">
                          {/* 左カラム: プレビュー (2/5) */}
                        <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                プレビュー
                              </label>
                              <div className="border border-gray-300 rounded-lg overflow-hidden min-h-[500px]">
                                {activeChannelTab === "line" && (
                                  <div className="h-full bg-[#B2C7D9] p-4">
                                    {/* LINEトーク画面風 */}
                                    <div className="flex items-start gap-2">
                                      {/* アイコン */}
                                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
                                        🏥
                                      </div>
                                      {/* メッセージ吹き出し */}
                                      <div className="flex-1">
                                        <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
                                          <div className="text-sm whitespace-pre-wrap break-words">
                                            {templateForm.line_message
                                              .replace(
                                                /\{\{patient_name\}\}/g,
                                                "山田太郎",
                                              )
                                              .replace(
                                                /\{\{clinic_name\}\}/g,
                                                clinicInfo.name ||
                                                  "さくら歯科クリニック",
                                              )
                                              .replace(
                                                /\{\{appointment_date\}\}/g,
                                                "2025年10月10日",
                                              )
                                              .replace(
                                                /\{\{appointment_datetime\}\}/g,
                                                "2025年10月10日 14:00",
                                              )
                                              .replace(
                                                /\{\{treatment_name\}\}/g,
                                                "定期検診",
                                              )
                                              .replace(
                                                /\{\{staff_name\}\}/g,
                                                "田中先生",
                                              ) ||
                                              "（メッセージを入力するとプレビューが表示されます）"}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 ml-2">
                                          12:00
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {activeChannelTab === "email" && (
                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-2">
                                      メール
                                    </div>
                                    <div className="font-semibold mb-3 pb-2 border-b">
                                      件名:{" "}
                                      {templateForm.email_subject.replace(
                                        /\{\{clinic_name\}\}/g,
                                        clinicInfo.name ||
                                          "さくら歯科クリニック",
                                      ) || "（件名を入力してください）"}
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">
                                      {templateForm.email_message
                                        .replace(
                                          /\{\{patient_name\}\}/g,
                                          "山田太郎",
                                        )
                                        .replace(
                                          /\{\{clinic_name\}\}/g,
                                          clinicInfo.name ||
                                            "さくら歯科クリニック",
                                        )
                                        .replace(
                                          /\{\{appointment_date\}\}/g,
                                          "2025年10月10日",
                                        )
                                        .replace(
                                          /\{\{appointment_datetime\}\}/g,
                                          "2025年10月10日 14:00",
                                        )
                                        .replace(
                                          /\{\{treatment_name\}\}/g,
                                          "定期検診",
                                        )
                                        .replace(
                                          /\{\{staff_name\}\}/g,
                                          "田中先生",
                                        ) ||
                                        "（本文を入力するとプレビューが表示されます）"}
                                    </div>
                                  </div>
                                )}
                                {activeChannelTab === "sms" && (
                                  <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-2">
                                      SMS メッセージ
                                    </div>
                                    <div className="text-sm whitespace-pre-wrap">
                                      {templateForm.sms_message
                                        .replace(
                                          /\{\{patient_name\}\}/g,
                                          "山田太郎",
                                        )
                                        .replace(
                                          /\{\{clinic_name\}\}/g,
                                          clinicInfo.name || "さくら歯科",
                                        )
                                        .replace(
                                          /\{\{appointment_date\}\}/g,
                                          "10/10",
                                        )
                                        .replace(
                                          /\{\{appointment_time\}\}/g,
                                          "14:00",
                                        ) ||
                                        "（メッセージを入力するとプレビューが表示されます）"}
                                    </div>
                                  </div>
                                )}
                              </div>
                          </div>

                          {/* 右カラム: チャネル別メッセージ (3/5) */}
                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              送信チャンネル別メッセージ
                            </label>
                          <div className="border border-gray-300 rounded-lg">
                            <div className="flex border-b border-gray-300">
                              <button
                                type="button"
                                  onClick={() => setActiveChannelTab("line")}
                                className={`flex-1 px-4 py-2 text-sm font-medium ${
                                    activeChannelTab === "line"
                                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  LINE {templateForm.line_message && "✓"}
                              </button>
                              <button
                                type="button"
                                  onClick={() => setActiveChannelTab("email")}
                                className={`flex-1 px-4 py-2 text-sm font-medium ${
                                    activeChannelTab === "email"
                                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  メール {templateForm.email_message && "✓"}
                              </button>
                              <button
                                type="button"
                                  onClick={() => setActiveChannelTab("sms")}
                                className={`flex-1 px-4 py-2 text-sm font-medium ${
                                    activeChannelTab === "sms"
                                      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-700"
                                      : "text-gray-600 hover:bg-gray-50"
                                  }`}
                                >
                                  SMS {templateForm.sms_message && "✓"}
                              </button>
                            </div>

                            <div className="p-4">
                                {activeChannelTab === "line" && (
                                <div>
                                  <textarea
                                      id="line-message-textarea"
                                    value={templateForm.line_message}
                                      onChange={(e) =>
                                        setTemplateForm({
                                          ...templateForm,
                                          line_message: e.target.value,
                                        })
                                      }
                                      rows={15}
                                    placeholder="例：{{patient_name}}様&#10;&#10;{{clinic_name}}です。&#10;{{appointment_date}}のご予約のお知らせです。&#10;&#10;日時：{{appointment_datetime}}&#10;&#10;よろしくお願いいたします。"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                  />
                                    <div className="mt-2 space-y-2">
                                      <div className="text-xs font-medium text-gray-700">
                                        変数を挿入:
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{patient_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          患者名
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{clinic_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          クリニック名
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{appointment_date}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          予約日
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{appointment_datetime}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          予約日時
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{treatment_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          治療内容
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "line-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.line_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.line_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              line_message:
                                                textBefore +
                                                "{{staff_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          スタッフ名
                                        </button>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        最大5000文字
                                      </p>
                                    </div>
                                </div>
                              )}

                                {activeChannelTab === "email" && (
                                <div className="space-y-3">
                                  <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        件名
                                      </label>
                                    <input
                                        id="email-subject-input"
                                      type="text"
                                      value={templateForm.email_subject}
                                        onChange={(e) =>
                                          setTemplateForm({
                                            ...templateForm,
                                            email_subject: e.target.value,
                                          })
                                        }
                                      placeholder="例：【〇〇クリニック】ご予約のお知らせ"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        本文
                                      </label>
                                    <textarea
                                        id="email-message-textarea"
                                      value={templateForm.email_message}
                                        onChange={(e) =>
                                          setTemplateForm({
                                            ...templateForm,
                                            email_message: e.target.value,
                                          })
                                        }
                                        rows={16}
                                      placeholder="例：{{patient_name}}様&#10;&#10;いつもありがとうございます。&#10;{{clinic_name}}です。&#10;&#10;{{appointment_date}}のご予約のお知らせです。&#10;&#10;■ご予約内容&#10;日時：{{appointment_datetime}}&#10;治療内容：{{treatment_name}}&#10;&#10;よろしくお願いいたします。"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    />
                                      <div className="mt-2 space-y-2">
                                        <div className="text-xs font-medium text-gray-700">
                                          変数を挿入:
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{patient_name}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            患者名
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{clinic_name}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            クリニック名
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{appointment_date}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            予約日
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{appointment_datetime}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            予約日時
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{treatment_name}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            治療内容
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const textarea =
                                                document.getElementById(
                                                  "email-message-textarea",
                                                ) as HTMLTextAreaElement;
                                              const cursorPos =
                                                textarea.selectionStart;
                                              const textBefore =
                                                templateForm.email_message.substring(
                                                  0,
                                                  cursorPos,
                                                );
                                              const textAfter =
                                                templateForm.email_message.substring(
                                                  cursorPos,
                                                );
                                              setTemplateForm({
                                                ...templateForm,
                                                email_message:
                                                  textBefore +
                                                  "{{staff_name}}" +
                                                  textAfter,
                                              });
                                            }}
                                            className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                          >
                                            スタッフ名
                                          </button>
                                        </div>
                                      </div>
                                  </div>
                                </div>
                              )}

                                {activeChannelTab === "sms" && (
                                <div>
                                  <textarea
                                      id="sms-message-textarea"
                                    value={templateForm.sms_message}
                                      onChange={(e) =>
                                        setTemplateForm({
                                          ...templateForm,
                                          sms_message: e.target.value,
                                        })
                                      }
                                      rows={8}
                                    placeholder="例：明日10時のご予約です。〇〇クリニック"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    maxLength={160}
                                  />
                                    <div className="mt-2 space-y-2">
                                      <div className="text-xs font-medium text-gray-700">
                                        変数を挿入:
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "sms-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.sms_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.sms_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              sms_message:
                                                textBefore +
                                                "{{patient_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          患者名
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "sms-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.sms_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.sms_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              sms_message:
                                                textBefore +
                                                "{{clinic_name}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          クリニック名
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "sms-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.sms_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.sms_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              sms_message:
                                                textBefore +
                                                "{{appointment_date}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          予約日
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const textarea =
                                              document.getElementById(
                                                "sms-message-textarea",
                                              ) as HTMLTextAreaElement;
                                            const cursorPos =
                                              textarea.selectionStart;
                                            const textBefore =
                                              templateForm.sms_message.substring(
                                                0,
                                                cursorPos,
                                              );
                                            const textAfter =
                                              templateForm.sms_message.substring(
                                                cursorPos,
                                              );
                                            setTemplateForm({
                                              ...templateForm,
                                              sms_message:
                                                textBefore +
                                                "{{appointment_time}}" +
                                                textAfter,
                                            });
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 border border-blue-200"
                                        >
                                          予約時刻
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">
                                        70文字推奨
                                    </p>
                                      <p
                                        className={`text-xs font-medium ${
                                      templateForm.sms_message.length > 70
                                            ? "text-orange-600"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {templateForm.sms_message.length}
                                        /160文字
                                        {templateForm.sms_message.length > 70 &&
                                          " (課金2倍)"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {notificationTab === "auto-reminder" && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      自動リマインドルール
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      段階的な自動通知の設定（間隔は自由に追加・編集できます）
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoReminderRule.enabled}
                      onChange={(e) =>
                        setAutoReminderRule({
                          ...autoReminderRule,
                          enabled: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      有効化
                    </span>
                  </label>
                </div>

                {autoReminderRule.enabled && (
                  <div className="space-y-6">
                    {/* 送信間隔設定 */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          送信間隔設定
                        </h4>
                        <button
                          onClick={() => {
                            const newSequence = autoReminderRule.intervals.length + 1;
                            setAutoReminderRule({
                              ...autoReminderRule,
                              intervals: [
                                ...autoReminderRule.intervals,
                                { sequence: newSequence, months: 3 },
                              ],
                            });
                          }}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          間隔を追加
                        </button>
                      </div>
                      <div className="space-y-4">
                        {autoReminderRule.intervals.map((interval, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {index === 0 ? "最終来院から" : `${index}回目の通知から`}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={interval.months}
                                      onChange={(e) => {
                                        const newIntervals = [...autoReminderRule.intervals];
                                        newIntervals[index] = {
                                          ...newIntervals[index],
                                          months: parseInt(e.target.value) || 1,
                                        };
                                        setAutoReminderRule({
                                          ...autoReminderRule,
                                          intervals: newIntervals,
                                        });
                                      }}
                                      min="1"
                                      className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    />
                                    <span className="text-sm text-gray-600">ヶ月後</span>
                                  </div>
                                </div>
                                {autoReminderRule.intervals.length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newIntervals = autoReminderRule.intervals
                                        .filter((_, i) => i !== index)
                                        .map((interval, i) => ({
                                          ...interval,
                                          sequence: i + 1,
                                        }));
                                      setAutoReminderRule({
                                        ...autoReminderRule,
                                        intervals: newIntervals,
                                      });
                                    }}
                                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="この間隔を削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {index < autoReminderRule.intervals.length - 1 && (
                              <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        ))}

                        {/* 停止の表示 */}
                        {autoReminderRule.intervals.length > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-300">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-600 rounded-full font-semibold text-sm">
                                    ✓
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    {autoReminderRule.intervals.length}回目以降
                                  </label>
                                  <div className="text-sm font-medium text-gray-700">
                                    自動送信を停止
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-gray-600">
                            <p className="font-medium text-gray-900 mb-1">
                              自動リマインドの流れ
                            </p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>
                                最終来院日から設定した間隔で自動的に通知を送信
                              </li>
                              <li>
                                患者様が予約を入れた場合、自動的にリマインドをキャンセル
                              </li>
                              <li>
                                設定した回数の通知後、それ以降の自動送信は停止します
                              </li>
                              <li>
                                「間隔を追加」ボタンで送信回数を増やせます
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* テンプレート設定 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        使用テンプレート
                      </label>
                      <p className="text-xs text-gray-600 mb-3">
                        送信チャンネル（LINE/メール/SMS）は、各患者の連絡希望設定に基づいて自動的に選択されます
                      </p>
                      <select
                        value={autoReminderRule.template_id}
                        onChange={(e) =>
                          setAutoReminderRule({
                            ...autoReminderRule,
                            template_id: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">テンプレートを選択</option>
                        {templates
                          .filter((t) => t.notification_type === "periodic_checkup")
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                      {templates.filter((t) => t.notification_type === "periodic_checkup").length === 0 && (
                        <p className="text-xs text-orange-600 mt-2">
                          ※ 先にテンプレートタブで「定期検診」タイプのテンプレートを作成してください
                        </p>
                      )}
                    </div>

                    {/* 保存ボタン */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        onClick={async () => {
                          setSaving(true);
                          try {
                            // 自動リマインドルールを保存
                            const response = await fetch('/api/auto-reminder-rules', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                clinic_id: DEMO_CLINIC_ID,
                                enabled: autoReminderRule.enabled,
                                intervals: autoReminderRule.intervals,
                                template_id: autoReminderRule.template_id || null,
                                on_cancel_resend_enabled: false,
                                fallback_enabled: false,
                                optimize_send_time: true,
                                default_send_hour: 18,
                              }),
                            });

                            if (!response.ok) {
                              throw new Error('保存に失敗しました');
                            }

                            showAlert("自動リマインドルールを保存しました", "success");
                          } catch (error) {
                            console.error("自動リマインドルール保存エラー:", error);
                            showAlert("保存に失敗しました", "error");
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </div>
                )}

                {!autoReminderRule.enabled && (
                  <div className="text-center py-12 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>自動リマインドが無効になっています</p>
                    <p className="text-sm mt-1">
                      右上のスイッチをONにして設定を開始してください
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* リッチメニュータブ */}
            {notificationTab === "rich-menu" && (
              <div className="space-y-6">
                {/* サブタブ */}
                <div className="flex gap-4 border-b border-gray-200">
                  <button
                    onClick={() => setRichMenuSubTab("registered")}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
                      richMenuSubTab === "registered"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    連携済みユーザー用
                  </button>
                  <button
                    onClick={() => setRichMenuSubTab("unregistered")}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 cursor-pointer ${
                      richMenuSubTab === "unregistered"
                        ? "border-blue-500 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    未連携ユーザー用
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 左側: 設定エリア */}
                  <div className="space-y-6">
                    {/* ボタン設定 */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {richMenuSubTab === "registered" ? "連携済みユーザー用 " : "未連携ユーザー用 "}ボタン設定
                      </h3>
                      <div className="space-y-3">
                        {(richMenuSubTab === "registered" ? richMenuButtons : unregisteredRichMenuButtons).map((button, index) => (
                        <div
                          key={button.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                                {index + 1}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {button.label}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {button.url}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setEditingButton(
                                  editingButton === button.id
                                    ? null
                                    : button.id,
                                )
                              }
                            >
                              {editingButton === button.id ? "閉じる" : "編集"}
                            </Button>
                          </div>

                          {editingButton === button.id && (
                            <div className="space-y-3 pt-3 border-t">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ボタンラベル
                                </label>
                                <input
                                  type="text"
                                  value={button.label}
                                  onChange={(e) => {
                                    if (richMenuSubTab === "registered") {
                                      const newButtons = [...richMenuButtons];
                                      newButtons[index].label = e.target.value;
                                      setRichMenuButtons(newButtons);
                                    } else {
                                      const newButtons = [...unregisteredRichMenuButtons];
                                      newButtons[index].label = e.target.value;
                                      setUnregisteredRichMenuButtons(newButtons);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="例: 予約"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  アクションタイプ
                                </label>
                                <select
                                  value={button.action}
                                  onChange={(e) => {
                                    if (richMenuSubTab === "registered") {
                                      const newButtons = [...richMenuButtons];
                                      newButtons[index].action = e.target.value;
                                      setRichMenuButtons(newButtons);
                                    } else {
                                      const newButtons = [...unregisteredRichMenuButtons];
                                      newButtons[index].action = e.target.value;
                                      setUnregisteredRichMenuButtons(newButtons);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="url">URL</option>
                                  <option value="message">
                                    メッセージ送信
                                  </option>
                                  <option value="postback">Postback</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {button.action === "url"
                                    ? "URL"
                                    : button.action === "message"
                                      ? "メッセージ"
                                      : "データ"}
                                </label>
                                {((richMenuSubTab === "registered" && button.id === 4) ||
                                   (richMenuSubTab === "unregistered" && button.id === 2)) && (
                                  <p className="text-xs text-blue-600 mb-2">
                                    ℹ️ WebサイトURLはクリニック設定タブで設定したURLが自動的に反映されます
                                  </p>
                                )}
                                <input
                                  type="text"
                                  value={button.url}
                                  onChange={(e) => {
                                    if (richMenuSubTab === "registered") {
                                      const newButtons = [...richMenuButtons];
                                      newButtons[index].url = e.target.value;
                                      setRichMenuButtons(newButtons);
                                    } else {
                                      const newButtons = [...unregisteredRichMenuButtons];
                                      newButtons[index].url = e.target.value;
                                      setUnregisteredRichMenuButtons(newButtons);
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder={
                                    button.action === "url"
                                      ? "https://your-domain.com/booking"
                                      : button.action === "message"
                                        ? "予約したいです"
                                        : "action=booking"
                                  }
                                  disabled={(richMenuSubTab === "registered" && button.id === 4) ||
                                            (richMenuSubTab === "unregistered" && button.id === 2)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 保存ボタン */}
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (richMenuSubTab === "registered") {
                          // 連携済み用デフォルト設定にリセット
                          setRichMenuLayout("fixed");
                          setRichMenuButtons([
                            {
                              id: 1,
                              label: "QRコード",
                              action: "url",
                              url: "/qr-checkin",
                              icon: "qr",
                            },
                            {
                              id: 2,
                              label: "予約確認",
                              action: "url",
                              url: "/booking",
                              icon: "calendar",
                            },
                            {
                              id: 3,
                              label: "家族登録",
                              action: "url",
                              url: "/family",
                              icon: "users",
                            },
                            {
                              id: 4,
                              label: "Webサイト",
                              action: "url",
                              url: clinicInfo.website_url || "",
                              icon: "web",
                            },
                            {
                              id: 5,
                              label: "お問合せ",
                              action: "message",
                              url: "お問い合わせ",
                              icon: "chat",
                            },
                            {
                              id: 6,
                              label: "予約を取る",
                              action: "url",
                              url: "/appointment",
                              icon: "booking",
                            },
                          ]);
                        } else {
                          // 未連携用デフォルト設定にリセット
                          setUnregisteredRichMenuButtons([
                            { id: 1, label: "初回登録", action: "url", url: "/line-registration", icon: "user" },
                            {
                              id: 2,
                              label: "Webサイト",
                              action: "url",
                              url: clinicInfo.website_url || "",
                              icon: "web",
                            },
                            {
                              id: 3,
                              label: "お問合せ",
                              action: "message",
                              url: "CONTACT_REQUEST",
                              icon: "chat",
                            },
                          ]);
                        }
                        showAlert("デフォルト設定にリセットしました", "success");
                      }}
                    >
                      リセット
                    </Button>
                    <Button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          const richMenuConfig = {
                            layout: richMenuLayout,
                            buttons: richMenuSubTab === "registered" ? richMenuButtons : unregisteredRichMenuButtons,
                            type: richMenuSubTab
                          };

                          // LocalStorageに保存（デモ用）
                          const storageKey = richMenuSubTab === "registered"
                            ? "rich_menu_config_registered"
                            : "rich_menu_config_unregistered";
                          localStorage.setItem(
                            storageKey,
                            JSON.stringify(richMenuConfig),
                          );

                          showAlert(
                            `${richMenuSubTab === "registered" ? "連携済みユーザー用" : "未連携ユーザー用"}リッチメニュー設定を保存しました！`,
                            "success"
                          );
                        } catch (error) {
                          console.error("保存エラー:", error);
                          showAlert("保存に失敗しました", "error");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "保存中..." : "保存"}
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!notificationSettings.line.channel_access_token) {
                          showAlert(
                            "LINE設定のChannel Access Tokenを入力してください",
                            "error"
                          );
                          return;
                        }

                        setSaving(true);
                        try {
                          console.log("LINEリッチメニュー反映開始...");
                          console.log(
                            "Channel Access Token:",
                            notificationSettings.line.channel_access_token?.substring(
                              0,
                              20,
                            ) + "...",
                          );

                          // 相対パスを絶対URLに変換
                          const baseUrl = window.location.origin;
                          const currentButtons = richMenuSubTab === "registered" ? richMenuButtons : unregisteredRichMenuButtons;
                          const buttonsWithFullUrl = currentButtons.map(
                            (btn) => ({
                            ...btn,
                              url:
                                btn.action === "url" && btn.url.startsWith("/")
                              ? `${baseUrl}${btn.url}`
                                  : btn.url,
                            }),
                          );

                          console.log(
                            `Buttons (${richMenuSubTab}, with full URLs):`,
                            buttonsWithFullUrl,
                          );

                          const response = await fetch("/api/line/richmenu", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              channelAccessToken:
                                notificationSettings.line.channel_access_token,
                              buttons: buttonsWithFullUrl,
                              menuType: richMenuSubTab, // "registered" or "unregistered"
                              liffIds: {
                                initial_link: notificationSettings.line.liff_id_initial_link,
                                qr_code: notificationSettings.line.liff_id_qr_code,
                                family_register: notificationSettings.line.liff_id_family_register,
                                appointments: notificationSettings.line.liff_id_appointments,
                                web_booking: notificationSettings.line.liff_id_web_booking,
                              },
                            }),
                          });

                          console.log("Response status:", response.status);
                          const result = await response.json();
                          console.log("Response result:", result);

                          if (response.ok) {
                            const menuTypeText = richMenuSubTab === "registered" ? "連携済みユーザー用" : "未連携ユーザー用";
                            showAlert(`✅ ${menuTypeText}リッチメニューをLINE公式アカウントに反映しました`, "success");
                          } else {
                            console.error("エラー詳細:", result);
                            showAlert(
                              "❌ エラー: " +
                                result.error +
                                "\n詳細: " +
                                (result.details || "なし"),
                              "error"
                            );
                          }
                        } catch (error) {
                          console.error("LINEリッチメニュー反映エラー:", error);
                          showAlert(
                            "❌ LINEへの反映に失敗しました\n\nエラー: " +
                              (error instanceof Error
                                ? error.message
                                : String(error)) +
                              "\n\nブラウザのコンソール(F12)で詳細を確認してください",
                            "error"
                          );
                        } finally {
                          setSaving(false);
                        }
                      }}
                      disabled={
                        saving ||
                        !notificationSettings.line.channel_access_token
                      }
                      className="bg-[#00B900] hover:bg-[#00A000] text-white"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
                        <path d="M12 6c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 10c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
                      </svg>
                      {saving ? "LINEに反映中..." : "LINEに反映"}
                    </Button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-medium text-blue-900 mb-1">
                      💡 リッチメニューの適用について
                    </p>
                    <p>
                      「LINEに反映」ボタンを押すと、デフォルトリッチメニューとして設定され、既存ユーザーを含む全ユーザーに自動的に適用されます。
                    </p>
                  </div>
                </div>

                {/* 右側: プレビューエリア */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {richMenuSubTab === "registered" ? "連携済みユーザー用 " : "未連携ユーザー用 "}プレビュー
                  </h3>

                  {/* スマホプレビュー */}
                  <div className="flex justify-center">
                    {/* スマホ外枠 - iPhone サイズ */}
                    <div className="w-[300px] h-[550px] bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                      {/* スマホ画面 */}
                      <div className="bg-white rounded-[2rem] overflow-hidden h-full flex flex-col">
                        {/* LINEヘッダー */}
                        <div className="bg-[#00B900] px-3 py-2 flex items-center justify-between flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <span className="text-[10px] font-bold text-[#00B900]">
                                🦷
                              </span>
                            </div>
                            <span className="text-white font-medium text-xs">
                              デモクリニック
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                        </div>

                        {/* トーク履歴エリア */}
                        <div className="bg-[#E8F0F2] p-3 flex-1 overflow-y-auto relative">
                          <div className="space-y-2 pb-16">
                            <div className="flex justify-start">
                              <div className="bg-white rounded-2xl rounded-tl-none px-3 py-2 max-w-[70%] shadow-sm">
                                <p className="text-[10px] text-gray-900 leading-relaxed">
                                  こんにちは！<br/>ご予約ありがとうございます。
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end">
                              <div className="bg-[#00B900] rounded-2xl rounded-tr-none px-3 py-2 max-w-[70%] shadow-sm">
                                <p className="text-[10px] text-white leading-relaxed">
                                  よろしくお願いします
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* リッチメニュー - トーク画面の上にオーバーレイ */}
                          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
                            <div className="bg-gradient-to-b from-gray-100 to-gray-50 p-1.5">
                          {richMenuSubTab === "registered" ? (
                            /* 連携済みユーザー用リッチメニュー - 6ボタン */
                            <div className="grid grid-cols-3 grid-rows-2 gap-2">
                            {/* 左列を3段に分割 - リッチメニュー全体の高さを3等分 */}
                            <div className="row-span-2 flex flex-col gap-2">
                              {/* Webサイト (1段目) - アイコンなし、テキストのみ */}
                              <button className="flex-1 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200 transition-all duration-200 p-2 flex items-center justify-center active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  Webサイト
                                </span>
                              </button>
                              {/* 家族登録 (2段目) - アイコンなし、テキストのみ */}
                              <button className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200 transition-all duration-200 p-2 flex items-center justify-center active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  家族登録
                                </span>
                              </button>
                              {/* お問合せ (3段目) - アイコンなし、テキストのみ */}
                              <button className="flex-1 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border border-pink-200 transition-all duration-200 p-2 flex items-center justify-center active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  お問合せ
                                </span>
                              </button>
                            </div>
                            <button className="h-[90px] bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                <rect x="20" y="20" width="60" height="60" fill="#1F2937"/>
                                <rect x="24" y="24" width="52" height="52" fill="white"/>
                                <rect x="28" y="28" width="16" height="16" fill="#1F2937"/>
                                <rect x="30" y="30" width="12" height="12" fill="white"/>
                                <rect x="34" y="34" width="4" height="4" fill="#1F2937"/>
                                <rect x="56" y="28" width="16" height="16" fill="#1F2937"/>
                                <rect x="58" y="30" width="12" height="12" fill="white"/>
                                <rect x="62" y="34" width="4" height="4" fill="#1F2937"/>
                                <rect x="28" y="56" width="16" height="16" fill="#1F2937"/>
                                <rect x="30" y="58" width="12" height="12" fill="white"/>
                                <rect x="34" y="62" width="4" height="4" fill="#1F2937"/>
                                <rect x="56" y="56" width="3" height="3" fill="#1F2937"/>
                                <rect x="61" y="56" width="3" height="3" fill="#1F2937"/>
                                <rect x="66" y="56" width="3" height="3" fill="#1F2937"/>
                                <rect x="56" y="61" width="3" height="3" fill="#1F2937"/>
                                <rect x="66" y="61" width="3" height="3" fill="#1F2937"/>
                                <rect x="56" y="66" width="3" height="3" fill="#1F2937"/>
                                <rect x="61" y="66" width="3" height="3" fill="#1F2937"/>
                                <rect x="66" y="66" width="3" height="3" fill="#1F2937"/>
                              </svg>
                              <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                QRコード
                              </span>
                            </button>
                            <button className="h-[90px] bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-0.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                <rect x="17" y="23" width="66" height="62" rx="4" fill="#1F2937"/>
                                <rect x="17" y="23" width="66" height="14" fill="#1F2937"/>
                                <circle cx="33" cy="30" r="3.5" fill="white" stroke="#1F2937" strokeWidth="2"/>
                                <circle cx="50" cy="30" r="3.5" fill="white" stroke="#1F2937" strokeWidth="2"/>
                                <circle cx="67" cy="30" r="3.5" fill="white" stroke="#1F2937" strokeWidth="2"/>
                                <rect x="23" y="42" width="54" height="38" fill="white"/>
                                <rect x="27" y="48" width="46" height="2" fill="#E5E7EB"/>
                                <rect x="27" y="58" width="46" height="2" fill="#E5E7EB"/>
                                <rect x="27" y="68" width="46" height="2" fill="#E5E7EB"/>
                                <path d="M 28 54 L 32 58 L 40 48" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                予約確認
                              </span>
                              <span className="text-[8px] font-semibold text-gray-500 leading-tight text-center">
                                変更/キャンセル
                              </span>
                            </button>
                            {/* 2段目: 予約を取る(2マス分) */}
                            {/* 予約を取る - 2マス分 */}
                            <button className="h-[90px] col-span-2 bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 border border-yellow-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                              <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                <rect x="23" y="20" width="2" height="2" fill="rgba(0,0,0,0.1)" transform="translate(2, 2)"/>
                                <rect x="23" y="20" width="54" height="60" rx="3" fill="#1F2937"/>
                                <rect x="27" y="24" width="46" height="52" fill="white"/>
                                <rect x="32" y="30" width="36" height="3" fill="#1F2937"/>
                                <rect x="32" y="38" width="12" height="2" fill="#1F2937"/>
                                <rect x="48" y="38" width="20" height="2" fill="#E5E7EB"/>
                                <rect x="32" y="44" width="12" height="2" fill="#1F2937"/>
                                <rect x="48" y="44" width="20" height="2" fill="#E5E7EB"/>
                                <rect x="32" y="50" width="12" height="2" fill="#1F2937"/>
                                <rect x="48" y="50" width="20" height="2" fill="#E5E7EB"/>
                                <rect x="32" y="56" width="12" height="2" fill="#1F2937"/>
                                <rect x="48" y="56" width="20" height="2" fill="#E5E7EB"/>
                                <rect x="32" y="62" width="12" height="2" fill="#1F2937"/>
                                <rect x="48" y="62" width="20" height="2" fill="#E5E7EB"/>
                                <g transform="translate(64, 60) rotate(36)">
                                  <rect x="-2" y="-20" width="4" height="24" rx="1" fill="#1F2937"/>
                                  <polygon points="-2,4 0,9 2,4" fill="#FCD34D"/>
                                  <line x1="2" y1="-15" x2="4" y2="-18" stroke="white" strokeWidth="1.2"/>
                                </g>
                              </svg>
                              <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                予約を取る
                              </span>
                            </button>
                          </div>
                          ) : (
                            /* 未連携ユーザー用リッチメニュー - 3ボタン */
                            <div className="grid grid-cols-3 gap-2">
                              {/* 初回登録ボタン */}
                              <button className="h-[90px] bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                  <circle cx="50" cy="35" r="15" fill="#1F2937"/>
                                  <path d="M 25 75 Q 25 55 50 55 Q 75 55 75 75 L 25 75 Z" fill="#1F2937"/>
                                  <circle cx="65" cy="65" r="12" fill="#10B981"/>
                                  <path d="M 60 65 L 63 68 L 70 61" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  初回登録
                                </span>
                              </button>

                              {/* Webサイトボタン */}
                              <button className="h-[90px] bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border border-orange-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                  <circle cx="50" cy="50" r="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                                  <ellipse cx="50" cy="50" rx="15" ry="35" fill="none" stroke="#1F2937" strokeWidth="3"/>
                                  <line x1="15" y1="50" x2="85" y2="50" stroke="#1F2937" strokeWidth="3"/>
                                  <path d="M 20 30 Q 50 35 80 30" fill="none" stroke="#1F2937" strokeWidth="2"/>
                                  <path d="M 20 70 Q 50 65 80 70" fill="none" stroke="#1F2937" strokeWidth="2"/>
                                </svg>
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  Webサイト
                                </span>
                              </button>

                              {/* お問合せボタン */}
                              <button className="h-[90px] bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 border border-pink-200 transition-all duration-200 p-2 flex flex-col items-center justify-center gap-1.5 active:scale-95 rounded-lg shadow-md hover:shadow-lg">
                                <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none">
                                  <rect x="20" y="30" width="60" height="45" rx="5" fill="none" stroke="#1F2937" strokeWidth="3"/>
                                  <path d="M 20 35 L 50 55 L 80 35" fill="none" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                  <line x1="20" y1="35" x2="20" y2="75" stroke="#1F2937" strokeWidth="3"/>
                                  <line x1="80" y1="35" x2="80" y2="75" stroke="#1F2937" strokeWidth="3"/>
                                </svg>
                                <span className="text-[11px] font-bold text-gray-800 leading-tight text-center">
                                  お問合せ
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                          </div>
                        </div>

                        {/* 入力欄 */}
                        <div className="bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 flex-shrink-0">
                          <button className="w-6 h-6 text-gray-500 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="8" cy="10" r="1.5"/>
                              <circle cx="16" cy="10" r="1.5"/>
                              <path d="M8 14 Q12 17 16 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <div className="flex-1 bg-gray-100 rounded-full px-4 py-1.5">
                            <span className="text-[10px] text-gray-400">メッセージ</span>
                          </div>
                          <button className="w-6 h-6 text-gray-500 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="12" y1="8" x2="12" y2="16"/>
                              <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        )}
        {selectedCategory === "master" && renderMasterSettings()}
      </div>
  );
  };

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex h-full">
        {/* 左サイドバー */}
        <div className="w-52 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* ヘッダー */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              設定
            </h1>
          </div>

          {/* メニュー項目 */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-2">
              {settingCategories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                
                return (
                  <button
                    key={category.id}
                    onMouseEnter={() => handleCategoryClick(category.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors rounded-lg ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon
                        className={`w-5 h-5 mr-3 ${isActive ? "text-blue-600" : "text-gray-500"}`}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {renderRightContent()}
        </div>
      </div>

      {/* 問診票作成・編集モーダル */}
      {showQuestionnaireModal && (
        selectedQuestionnaire ? (
          <QuestionnaireEditModal
            isOpen={showQuestionnaireModal}
            onClose={() => {
              setShowQuestionnaireModal(false);
              setSelectedQuestionnaire(null);
            }}
            questionnaireId={selectedQuestionnaire.id}
            clinicId={DEMO_CLINIC_ID}
            onSave={(updatedQuestionnaire) => {
              console.log("問診票を保存しました:", updatedQuestionnaire);
              // リストを更新
              setQuestionnaires((prev) =>
                prev.map((q) =>
                  q.id === updatedQuestionnaire.id ? updatedQuestionnaire : q,
                ),
              );
              setShowQuestionnaireModal(false);
              setSelectedQuestionnaire(null);
            }}
          />
        ) : (
          <Modal
            isOpen={showQuestionnaireModal}
            onClose={() => {
              setShowQuestionnaireModal(false);
            }}
            title="新しい問診票を作成"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionnaire-name">問診票名</Label>
                <Input
                  id="questionnaire-name"
                  placeholder="例: 初診問診票"
                  defaultValue=""
                  onBlur={(e) => {
                    const name = e.target.value;
                    if (name.trim()) {
                      (window as any).newQuestionnaireName = name;
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="questionnaire-description">説明（任意）</Label>
                <Textarea
                  id="questionnaire-description"
                  placeholder="問診票の説明を入力"
                  rows={3}
                  onBlur={(e) => {
                    (window as any).newQuestionnaireDescription = e.target.value;
                  }}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowQuestionnaireModal(false);
                  }}
                >
                  キャンセル
                </Button>
                <Button
                  onClick={async () => {
                    const name = (window as any).newQuestionnaireName || '';
                    const description = (window as any).newQuestionnaireDescription || '';

                    if (!name.trim()) {
                      showAlert('問診票名を入力してください', 'error');
                      return;
                    }

                    try {
                      setSaving(true);
                      const newQuestionnaire = await createQuestionnaire(DEMO_CLINIC_ID, {
                        name: name.trim(),
                        description: description.trim(),
                        is_active: true
                      });

                      // リストに追加
                      setQuestionnaires((prev) => [...prev, newQuestionnaire]);
                      setShowQuestionnaireModal(false);

                      // 一時変数をクリア
                      delete (window as any).newQuestionnaireName;
                      delete (window as any).newQuestionnaireDescription;

                      showAlert('問診票を作成しました', 'success');
                    } catch (error) {
                      console.error('問診票作成エラー:', error);
                      const errorMessage = error instanceof Error ? error.message : '不明なエラー';
                      showAlert(`問診票の作成に失敗しました\n\nエラー: ${errorMessage}`, 'error');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving}
                >
                  {saving ? '作成中...' : '作成'}
                </Button>
              </div>
            </div>
          </Modal>
        )
      )}

      {/* デフォルトテキスト追加・編集モーダル */}
      {showAddDefaultTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingDefaultText
                  ? "デフォルトテキスト編集"
                  : "デフォルトテキスト追加"}
              </h3>
              <button
                onClick={() => {
                  setShowAddDefaultTextModal(false);
                  setEditingDefaultText(null);
                  setNewDefaultText({ title: "", content: "" });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  タイトル
                </label>
                <Input
                  value={newDefaultText.title}
                  onChange={(e) =>
                    setNewDefaultText({
                      ...newDefaultText,
                      title: e.target.value,
                    })
                  }
                  placeholder="デフォルトテキストのタイトル"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  内容
                </label>
                <textarea
                  value={newDefaultText.content}
                  onChange={(e) =>
                    setNewDefaultText({
                      ...newDefaultText,
                      content: e.target.value,
                    })
                  }
                  placeholder="デフォルトテキストの内容"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDefaultTextModal(false);
                  setEditingDefaultText(null);
                  setNewDefaultText({ title: "", content: "" });
                }}
              >
                キャンセル
              </Button>
              <Button
                onClick={
                  editingDefaultText
                    ? handleEditDefaultTextSave
                    : handleAddDefaultText
                }
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* キャンセルポリシー編集ダイアログ */}
      <Modal
        isOpen={isCancelPolicyDialogOpen}
        onClose={handleCancelPolicyDialogClose}
        title="キャンセルポリシー編集"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="cancel_policy_text">
              キャンセルポリシーテキスト
            </Label>
            <Textarea
              id="cancel_policy_text"
              value={tempCancelPolicyText}
              onChange={(e) => setTempCancelPolicyText(e.target.value)}
              rows={12}
              className="mt-2"
              placeholder="キャンセルポリシーの内容を入力してください"
            />
            <p className="text-sm text-gray-500 mt-1">
              患者に表示されるキャンセルポリシーの内容を編集できます
            </p>
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={handleCancelPolicyDialogClose}>
              キャンセル
            </Button>
            <Button onClick={handleSaveCancelPolicy} className="bg-blue-600 hover:bg-blue-700 text-white">保存</Button>
          </div>
        </div>
      </Modal>

      {/* 患者情報フィールド設定モーダル */}
      <Modal
        isOpen={isPatientInfoFieldsDialogOpen}
        onClose={handlePatientInfoFieldsDialogClose}
        title="メールアドレス、電話番号を表示する"
        size="medium"
      >
        <div className="space-y-6">
          {/* 電話番号設定 */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="modal_phone_enabled"
                checked={tempPatientInfoFields.phoneEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields((prev) => ({
                    ...prev,
                    phoneEnabled: checked as boolean,
                    // 電話番号を無効にする場合は必須も無効にする
                    phoneRequired: checked ? prev.phoneRequired : false,
                  }))
                }
              />
              <div>
                <Label
                  htmlFor="modal_phone_enabled"
                  className="font-medium text-base"
                >
                  電話番号
                </Label>
                <p className="text-sm text-gray-500">
                  患者情報入力で電話番号を表示
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="modal_phone_required"
                className="text-sm font-medium text-gray-600"
              >
                必須
              </Label>
              <Checkbox
                id="modal_phone_required"
                checked={tempPatientInfoFields.phoneRequired}
                disabled={!tempPatientInfoFields.phoneEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields((prev) => ({
                    ...prev,
                    phoneRequired: checked as boolean,
                  }))
                }
              />
            </div>
          </div>

          {/* メールアドレス設定 */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="modal_email_enabled"
                checked={tempPatientInfoFields.emailEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields((prev) => ({
                    ...prev,
                    emailEnabled: checked as boolean,
                    // メールアドレスを無効にする場合は必須も無効にする
                    emailRequired: checked ? prev.emailRequired : false,
                  }))
                }
              />
              <div>
                <Label
                  htmlFor="modal_email_enabled"
                  className="font-medium text-base"
                >
                  メールアドレス
                </Label>
                <p className="text-sm text-gray-500">
                  患者情報入力でメールアドレスを表示
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="modal_email_required"
                className="text-sm font-medium text-gray-600"
              >
                必須
              </Label>
              <Checkbox
                id="modal_email_required"
                checked={tempPatientInfoFields.emailRequired}
                disabled={!tempPatientInfoFields.emailEnabled}
                onCheckedChange={(checked) =>
                  setTempPatientInfoFields((prev) => ({
                    ...prev,
                    emailRequired: checked as boolean,
                  }))
                }
              />
            </div>
          </div>

          {/* プレビュー */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">プレビュー</h4>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前 *
                </Label>
                <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                  例: 田中太郎
                </div>
              </div>
              {tempPatientInfoFields.phoneEnabled && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号 {tempPatientInfoFields.phoneRequired ? "*" : ""}
                  </Label>
                  <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                    例: 03-1234-5678
                  </div>
                </div>
              )}
              {tempPatientInfoFields.emailEnabled && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス{" "}
                    {tempPatientInfoFields.emailRequired ? "*" : ""}
                  </Label>
                  <div className="w-full h-8 border border-gray-300 rounded px-3 bg-gray-50 flex items-center text-gray-500 text-sm">
                    例: tanaka@example.com
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePatientInfoFieldsDialogClose}
            >
              キャンセル
            </Button>
            <Button onClick={handleSavePatientInfoFields}>保存</Button>
          </div>
        </div>
      </Modal>

      {/* 未保存の変更警告モーダル */}
      <Modal
        isOpen={showUnsavedWarning}
        onClose={cancelNavigation}
        title="未保存の変更があります"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            変更内容が保存されていません。このページから移動すると、変更内容が失われます。
          </p>
          <p className="text-gray-700 font-medium">
            本当に移動しますか？
          </p>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={cancelNavigation}
            >
              キャンセル
            </Button>
            <Button
              onClick={discardChanges}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              変更を破棄して移動
            </Button>
          </div>
        </div>
      </Modal>

      {/* 保存完了モーダル */}
      <Modal
        isOpen={showSaveSuccessModal}
        onClose={() => setShowSaveSuccessModal(false)}
        title="保存完了"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                設定を保存しました
              </p>
              <p className="text-sm text-gray-500 mt-1">
                カレンダーページをリロードすると反映されます。
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowSaveSuccessModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          setShowDeleteConfirmModal(false);
          setDeletingMenuId(null);
        }}
        title="メニュー削除確認"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <p className="text-gray-700 font-medium">
                このメニューを削除しますか？
              </p>
              <p className="text-sm text-gray-500 mt-1">
                この操作は「保存」ボタンを押すまで確定されません。
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setDeletingMenuId(null);
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              キャンセル
            </Button>
            <Button
              onClick={confirmDeleteTreatmentMenu}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              削除
            </Button>
          </div>
        </div>
      </Modal>

      {/* 汎用確認モーダル */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={confirmModalConfig.title}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertCircle className={`w-12 h-12 ${confirmModalConfig.isDanger ? 'text-red-500' : 'text-blue-500'}`} />
            </div>
            <div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {confirmModalConfig.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowConfirmModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              {confirmModalConfig.cancelText || "キャンセル"}
            </Button>
            <Button
              onClick={() => {
                confirmModalConfig.onConfirm();
                setShowConfirmModal(false);
              }}
              className={confirmModalConfig.isDanger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {confirmModalConfig.confirmText || "OK"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 汎用通知モーダル */}
      <Modal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        title={alertModalConfig.title}
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {alertModalConfig.type === "success" && (
                <CheckCircle className="w-12 h-12 text-green-500" />
              )}
              {alertModalConfig.type === "error" && (
                <AlertCircle className="w-12 h-12 text-red-500" />
              )}
              {alertModalConfig.type === "info" && (
                <Info className="w-12 h-12 text-blue-500" />
              )}
            </div>
            <div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {alertModalConfig.message}
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowAlertModal(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
