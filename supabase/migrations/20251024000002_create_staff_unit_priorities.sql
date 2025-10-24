-- スタッフユニット優先順位テーブルの作成
CREATE TABLE IF NOT EXISTS public.staff_unit_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  priority_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 同じスタッフ・ユニットの組み合わせは1つまで
  UNIQUE(clinic_id, staff_id, unit_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_staff_unit_priorities_clinic ON public.staff_unit_priorities(clinic_id);
CREATE INDEX IF NOT EXISTS idx_staff_unit_priorities_staff ON public.staff_unit_priorities(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_unit_priorities_unit ON public.staff_unit_priorities(unit_id);
CREATE INDEX IF NOT EXISTS idx_staff_unit_priorities_priority ON public.staff_unit_priorities(clinic_id, staff_id, priority_order);

-- RLSを無効化（開発用）
ALTER TABLE public.staff_unit_priorities DISABLE ROW LEVEL SECURITY;

-- コメントの追加
COMMENT ON TABLE public.staff_unit_priorities IS 'スタッフのユニット優先順位を管理するテーブル';
COMMENT ON COLUMN public.staff_unit_priorities.id IS '優先順位ID';
COMMENT ON COLUMN public.staff_unit_priorities.clinic_id IS 'クリニックID';
COMMENT ON COLUMN public.staff_unit_priorities.staff_id IS 'スタッフID';
COMMENT ON COLUMN public.staff_unit_priorities.unit_id IS 'ユニットID';
COMMENT ON COLUMN public.staff_unit_priorities.priority_order IS '優先順位（数字が小さいほど優先度が高い）';
COMMENT ON COLUMN public.staff_unit_priorities.is_active IS '有効フラグ';
COMMENT ON COLUMN public.staff_unit_priorities.created_at IS '作成日時';
COMMENT ON COLUMN public.staff_unit_priorities.updated_at IS '更新日時';
