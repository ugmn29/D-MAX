-- System questionnaire templates (shared across all clinics)
CREATE TABLE IF NOT EXISTS system_questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'standard' or 'habit_check'
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System questionnaire template questions
CREATE TABLE IF NOT EXISTS system_questionnaire_template_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES system_questionnaire_templates(id) ON DELETE CASCADE,
  section_name TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'text', 'radio', 'checkbox', 'select', 'textarea', 'date', 'number'
  options JSONB, -- For radio, checkbox, select
  is_required BOOLEAN DEFAULT false,
  conditional_logic JSONB, -- For conditional display logic
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add template_id to questionnaires table to track which template it was copied from
ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES system_questionnaire_templates(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_system_questionnaire_templates_active ON system_questionnaire_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_system_questionnaire_templates_category ON system_questionnaire_templates(category);
CREATE INDEX IF NOT EXISTS idx_system_questionnaire_template_questions_template_id ON system_questionnaire_template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_system_questionnaire_template_questions_sort_order ON system_questionnaire_template_questions(template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questionnaires_template_id ON questionnaires(template_id);

-- RLS Policies
ALTER TABLE system_questionnaire_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_questionnaire_template_questions ENABLE ROW LEVEL SECURITY;

-- System templates are readable by everyone (authenticated users)
CREATE POLICY "System questionnaire templates are viewable by everyone"
  ON system_questionnaire_templates
  FOR SELECT
  USING (true);

CREATE POLICY "System questionnaire template questions are viewable by everyone"
  ON system_questionnaire_template_questions
  FOR SELECT
  USING (true);

-- Only admins can modify system templates (future implementation)
-- For now, we'll insert data via migrations
