# 治療計画機能 データベース設計

## テーブル構成

### 1. treatment_plans（治療計画）

```sql
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id VARCHAR NOT NULL,

  -- 治療内容
  treatment_content TEXT NOT NULL,        -- 治療内容（例：CR充填、抜歯）
  treatment_menu_id UUID REFERENCES treatment_menus(id),  -- 診療メニューへの参照

  -- 対象歯
  tooth_number VARCHAR,                   -- 歯式（例：17、右上7番）
  tooth_position VARCHAR,                 -- 部位詳細（頬側、口蓋側など）

  -- 優先度・順序
  priority INTEGER DEFAULT 0,             -- 優先度（1=高、2=中、3=低）
  sort_order INTEGER NOT NULL,            -- 実施順序

  -- 衛生士メニュー
  hygienist_menu_type VARCHAR,            -- TBI, SRP, PMT, OTHER
  hygienist_menu_detail TEXT,             -- 詳細説明

  -- 歯周病治療フェーズ
  periodontal_phase VARCHAR,              -- INITIAL, RE_EVAL_1, SURGERY, RE_EVAL_2, MAINTENANCE
  periodontal_phase_detail JSONB,         -- フェーズ詳細（チェックリスト）

  -- ステータス
  status VARCHAR DEFAULT 'planned',       -- planned, in_progress, completed, cancelled
  completed_at TIMESTAMP,                 -- 完了日時

  -- 実施記録
  implemented_date DATE,                  -- 実施日
  implemented_by VARCHAR,                 -- 実施者
  memo TEXT,                              -- メモ・コメント

  -- サブカルテ連携
  subkarte_id UUID REFERENCES subkartes(id),  -- 関連サブカルテ

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_treatment_plans_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- インデックス
CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);
CREATE INDEX idx_treatment_plans_sort_order ON treatment_plans(patient_id, sort_order);
```

### 2. periodontal_phase_templates（歯周病フェーズテンプレート）

```sql
CREATE TABLE periodontal_phase_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),

  phase_name VARCHAR NOT NULL,            -- フェーズ名
  phase_code VARCHAR NOT NULL,            -- INITIAL, RE_EVAL_1, etc.
  sort_order INTEGER NOT NULL,

  checklist_items JSONB NOT NULL,         -- チェックリスト項目
  /*
  例：
  [
    {"id": "tbi", "label": "TBI実施", "required": true},
    {"id": "scaling", "label": "スケーリング", "required": true},
    {"id": "srp", "label": "SRP", "required": false}
  ]
  */

  is_default BOOLEAN DEFAULT false,       -- デフォルトテンプレート
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 歯周病治療フェーズの標準フロー

### フェーズ定義

1. **初期治療（INITIAL）**
   - TBI（ブラッシング指導）
   - プラークコントロール
   - スケーリング
   - SRP（ルートプレーニング）
   - 咬合調整
   - 暫間固定

2. **再評価1（RE_EVAL_1）**
   - 歯周組織検査
   - 治療効果判定
   - 次フェーズの決定

3. **歯周外科（SURGERY）**
   - フラップ手術
   - 歯周組織再生療法
   - 歯肉切除術

4. **再評価2（RE_EVAL_2）**
   - 術後評価
   - メンテナンス移行判定

5. **メンテナンス（MAINTENANCE）**
   - SPT（サポーティブペリオドンタルセラピー）
   - PMT（プロフェッショナル・メカニカル・トゥース・クリーニング）
   - 定期検診

## サブカルテとの連携

### サブカルテTODO表示ロジック

```typescript
// 患者の未完了治療計画を取得
async function getTreatmentPlanTodos(patientId: string) {
  const todos = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('patient_id', patientId)
    .in('status', ['planned', 'in_progress'])
    .order('sort_order', { ascending: true })

  return todos
}

// サブカルテ作成時にTODOを関連付け
async function linkTodoToSubkarte(subkarteId: string, treatmentPlanId: string) {
  await supabase
    .from('treatment_plans')
    .update({
      subkarte_id: subkarteId,
      status: 'in_progress',
      implemented_date: new Date().toISOString()
    })
    .eq('id', treatmentPlanId)
}
```

## UI構成案

### 治療計画タブ
```
┌─────────────────────────────────────┐
│ 治療計画                              │
├─────────────────────────────────────┤
│ [+ 新規追加]  [フェーズ別表示]         │
├─────────────────────────────────────┤
│ □ 1. TBI（ブラッシング指導）           │
│    優先度: 高 | 状態: 未実施            │
│    [編集] [削除]                      │
├─────────────────────────────────────┤
│ □ 2. SRP（右上1-3番）                │
│    優先度: 高 | 状態: 未実施            │
│    [編集] [削除]                      │
├─────────────────────────────────────┤
│ □ 3. CR充填（17番）                   │
│    優先度: 中 | 状態: 計画中            │
│    [編集] [削除]                      │
└─────────────────────────────────────┘
```

### サブカルテTODOリスト
```
┌─────────────────────────────────────┐
│ 本日の治療TODO                        │
├─────────────────────────────────────┤
│ ☑ TBI（ブラッシング指導）              │
│    実施日: 2026-01-11                │
│    メモ: [フロス使用指導済み]          │
├─────────────────────────────────────┤
│ □ SRP（右上1-3番）                   │
│    [完了にする] [メモを追加]           │
└─────────────────────────────────────┘
```

## 実装フェーズ

### Phase 1: 基本機能（最優先）
- [ ] 治療計画の登録・編集・削除
- [ ] 対象歯の選択UI
- [ ] 優先度・順序の設定
- [ ] サブカルテでのTODO表示
- [ ] 完了チェック機能

### Phase 2: 衛生士メニュー
- [ ] 衛生士メニュー選択
- [ ] TBI、SRP、PMTの登録
- [ ] 実施記録の保存

### Phase 3: 歯周病フェーズ管理
- [ ] フェーズテンプレート作成
- [ ] チェックリスト機能
- [ ] フェーズ進行管理

### Phase 4: 高度な機能
- [ ] メモ・コメント機能
- [ ] 実施日の記録
- [ ] 順序のドラッグ&ドロップ変更
- [ ] フェーズ別フィルタ表示
