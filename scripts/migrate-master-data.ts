#!/usr/bin/env tsx

/**
 * マスターデータ移行スクリプト
 *
 * ローカルSupabaseからマスターデータをエクスポートし、
 * GCP Cloud SQLにインポート可能な形式で保存します。
 *
 * エクスポート対象：
 * - trainings (18件)
 * - questionnaires (3件)
 * - questionnaire_questions (249件)
 * - notification_templates (5件)
 * - memo_templates (4件)
 * - treatment_codes (7件)
 */

import { getPrismaClient } from '../lib/prisma-client'
import * as fs from 'fs'
import * as path from 'path'

const OUTPUT_DIR = path.join(__dirname, '../.master-data')

// 出力ディレクトリを作成
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

async function exportTrainings() {
  console.log('\n📦 トレーニングデータをエクスポート中...')
  const prisma = getPrismaClient()

  const trainings = await prisma.trainings.findMany({
    where: {
      is_default: true // デフォルトデータのみ
    },
    orderBy: {
      category: 'asc'
    }
  })

  console.log(`✅ ${trainings.length}件のトレーニングを取得`)

  // JSON形式で保存
  const jsonPath = path.join(OUTPUT_DIR, 'trainings.json')
  fs.writeFileSync(jsonPath, JSON.stringify(trainings, null, 2))
  console.log(`💾 保存: ${jsonPath}`)

  // SQL INSERT文を生成
  const sqlPath = path.join(OUTPUT_DIR, 'trainings.sql')
  const sqlStatements = trainings.map(t => {
    const values = [
      `'${t.id}'`,
      `'${t.training_name.replace(/'/g, "''")}'`,
      `'${t.category.replace(/'/g, "''")}'`,
      t.description ? `'${t.description.replace(/'/g, "''")}'` : 'NULL',
      t.video_url ? `'${t.video_url.replace(/'/g, "''")}'` : 'NULL',
      t.thumbnail_url ? `'${t.thumbnail_url.replace(/'/g, "''")}'` : 'NULL',
      t.duration_seconds || 'NULL',
      t.sort_order,
      t.is_default ? 'TRUE' : 'FALSE',
      `'${t.created_at?.toISOString()}'`,
      t.updated_at ? `'${t.updated_at.toISOString()}'` : 'NULL'
    ]

    return `INSERT INTO trainings (id, training_name, category, description, video_url, thumbnail_url, duration_seconds, sort_order, is_default, created_at, updated_at)
VALUES (${values.join(', ')});`
  })

  fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
  console.log(`💾 保存: ${sqlPath}`)

  return trainings.length
}

async function exportQuestionnaires() {
  console.log('\n📦 問診票データをエクスポート中...')
  const prisma = getPrismaClient()

  // デフォルトclinic_idに紐づく問診票を取得
  const DEFAULT_CLINIC_ID = '11111111-1111-1111-1111-111111111111'
  const questionnaires = await prisma.questionnaires.findMany({
    where: {
      clinic_id: DEFAULT_CLINIC_ID
    },
    include: {
      questionnaire_questions: {
        orderBy: {
          sort_order: 'asc'
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  console.log(`✅ ${questionnaires.length}件の問診票を取得`)

  const totalQuestions = questionnaires.reduce(
    (sum, q) => sum + q.questionnaire_questions.length,
    0
  )
  console.log(`✅ ${totalQuestions}件の質問を取得`)

  // JSON形式で保存
  const jsonPath = path.join(OUTPUT_DIR, 'questionnaires.json')
  fs.writeFileSync(jsonPath, JSON.stringify(questionnaires, null, 2))
  console.log(`💾 保存: ${jsonPath}`)

  // SQL INSERT文を生成（問診票）
  const questionnaireSqlPath = path.join(OUTPUT_DIR, 'questionnaires.sql')
  const questionnaireSql = questionnaires.map(q => {
    const values = [
      `'${q.id}'`,
      `'${q.clinic_id}'`,
      `'${q.name.replace(/'/g, "''")}'`,
      q.description ? `'${q.description.replace(/'/g, "''")}'` : 'NULL',
      q.is_active ? 'TRUE' : 'FALSE',
      `'${q.created_at?.toISOString()}'`,
      q.updated_at ? `'${q.updated_at.toISOString()}'` : 'NULL',
      q.template_id ? `'${q.template_id}'` : 'NULL'
    ]

    return `INSERT INTO questionnaires (id, clinic_id, name, description, is_active, created_at, updated_at, template_id)
VALUES (${values.join(', ')});`
  })

  fs.writeFileSync(questionnaireSqlPath, questionnaireSql.join('\n\n'))
  console.log(`💾 保存: ${questionnaireSqlPath}`)

  // SQL INSERT文を生成（質問）
  const questionSqlPath = path.join(OUTPUT_DIR, 'questionnaire_questions.sql')
  const questionSql: string[] = []

  questionnaires.forEach(q => {
    q.questionnaire_questions.forEach(qq => {
      const values = [
        `'${qq.id}'`,
        `'${qq.questionnaire_id}'`,
        `'${qq.question_text.replace(/'/g, "''")}'`,
        `'${qq.question_type}'`,
        qq.options ? `'${JSON.stringify(qq.options).replace(/'/g, "''")}'::jsonb` : 'NULL',
        qq.is_required ? 'TRUE' : 'FALSE',
        qq.sort_order,
        `'${qq.created_at?.toISOString()}'`,
        qq.updated_at ? `'${qq.updated_at.toISOString()}'` : 'NULL'
      ]

      questionSql.push(`INSERT INTO questionnaire_questions (id, questionnaire_id, question_text, question_type, options, is_required, sort_order, created_at, updated_at)
VALUES (${values.join(', ')});`)
    })
  })

  fs.writeFileSync(questionSqlPath, questionSql.join('\n\n'))
  console.log(`💾 保存: ${questionSqlPath}`)

  return { questionnaires: questionnaires.length, questions: totalQuestions }
}

async function exportNotificationTemplates() {
  console.log('\n📦 通知テンプレートをエクスポート中...')
  const prisma = getPrismaClient()

  // デフォルトclinic_idに紐づくテンプレートを取得
  const DEFAULT_CLINIC_ID = '6a039f35-3e50-4009-8df9-5023464ee693'
  const templates = await prisma.notification_templates.findMany({
    where: {
      clinic_id: DEFAULT_CLINIC_ID
    },
    orderBy: {
      name: 'asc'
    }
  })

  console.log(`✅ ${templates.length}件のテンプレートを取得`)

  // JSON形式で保存
  const jsonPath = path.join(OUTPUT_DIR, 'notification_templates.json')
  fs.writeFileSync(jsonPath, JSON.stringify(templates, null, 2))
  console.log(`💾 保存: ${jsonPath}`)

  // SQL INSERT文を生成（基本フィールドのみ）
  const sqlPath = path.join(OUTPUT_DIR, 'notification_templates.sql')
  const sqlStatements = templates.map(t => {
    const values = [
      `'${t.id}'`,
      `'${t.clinic_id}'`,
      `'${t.name.replace(/'/g, "''")}'`,
      `'${t.notification_type}'`,
      `'${t.message_template.replace(/'/g, "''")}'`,
      t.is_system_template ? 'TRUE' : 'FALSE',
      `'${t.created_at?.toISOString()}'`,
      t.updated_at ? `'${t.updated_at.toISOString()}'` : 'NULL'
    ]

    return `-- 注意: すべてのフィールドは含まれていません。必要に応じて手動で追加してください
INSERT INTO notification_templates (id, clinic_id, name, notification_type, message_template, is_system_template, created_at, updated_at)
VALUES (${values.join(', ')});`
  })

  fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
  console.log(`💾 保存: ${sqlPath}`)

  return templates.length
}

async function exportMemoTemplates() {
  console.log('\n📦 メモテンプレートをエクスポート中...')
  const prisma = getPrismaClient()

  // 全て取得（clinic_idに依存するため、デフォルトフィルタなし）
  const templates = await prisma.memo_templates.findMany({
    orderBy: {
      name: 'asc'
    },
    take: 100 // 安全のため上限を設定
  })

  console.log(`✅ ${templates.length}件のテンプレートを取得`)

  if (templates.length === 0) {
    console.log('⚠️  メモテンプレートが見つかりませんでした。スキップします。')
    return 0
  }

  // JSON形式で保存
  const jsonPath = path.join(OUTPUT_DIR, 'memo_templates.json')
  fs.writeFileSync(jsonPath, JSON.stringify(templates, null, 2))
  console.log(`💾 保存: ${jsonPath}`)

  // SQL INSERT文を生成
  const sqlPath = path.join(OUTPUT_DIR, 'memo_templates.sql')
  const sqlStatements = templates.map(t => {
    const values = [
      `'${t.id}'`,
      `'${t.clinic_id}'`,
      `'${t.name.replace(/'/g, "''")}'`,
      `'${t.content.replace(/'/g, "''")}'`,
      t.sort_order !== null ? t.sort_order : 0,
      t.is_active ? 'TRUE' : 'FALSE',
      `'${t.created_at?.toISOString()}'`,
      t.updated_at ? `'${t.updated_at.toISOString()}'` : 'NULL'
    ]

    return `INSERT INTO memo_templates (id, clinic_id, name, content, sort_order, is_active, created_at, updated_at)
VALUES (${values.join(', ')});`
  })

  fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
  console.log(`💾 保存: ${sqlPath}`)

  return templates.length
}

async function exportTreatmentCodes() {
  console.log('\n📦 診療コードをエクスポート中...')
  const prisma = getPrismaClient()

  // 全て取得（clinic_id がないため、全て共通マスターデータ）
  const codes = await prisma.treatment_codes.findMany({
    orderBy: {
      code: 'asc'
    }
  })

  console.log(`✅ ${codes.length}件のコードを取得`)

  // JSON形式で保存
  const jsonPath = path.join(OUTPUT_DIR, 'treatment_codes.json')
  fs.writeFileSync(jsonPath, JSON.stringify(codes, null, 2))
  console.log(`💾 保存: ${jsonPath}`)

  // SQL INSERT文を生成
  const sqlPath = path.join(OUTPUT_DIR, 'treatment_codes.sql')
  const sqlStatements = codes.map(c => {
    const values = [
      `'${c.id}'`,
      `'${c.code}'`,
      `'${c.name.replace(/'/g, "''")}'`,
      `'${c.category}'`,
      c.points,
      `ARRAY[${c.inclusion_rules.map(r => `'${r.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
      c.exclusion_rules ? `'${JSON.stringify(c.exclusion_rules).replace(/'/g, "''")}'::jsonb` : 'NULL',
      c.frequency_limits ? `'${JSON.stringify(c.frequency_limits).replace(/'/g, "''")}'::jsonb` : 'NULL',
      `'${c.effective_from.toISOString().split('T')[0]}'`,
      c.effective_to ? `'${c.effective_to.toISOString().split('T')[0]}'` : 'NULL',
      `ARRAY[${c.requires_documents.map(d => `'${d.replace(/'/g, "''")}'`).join(', ')}]::text[]`,
      c.metadata ? `'${JSON.stringify(c.metadata).replace(/'/g, "''")}'::jsonb` : 'NULL',
      `'${c.created_at?.toISOString()}'`,
      c.updated_at ? `'${c.updated_at.toISOString()}'` : 'NULL'
    ]

    return `INSERT INTO treatment_codes (id, code, name, category, points, inclusion_rules, exclusion_rules, frequency_limits, effective_from, effective_to, requires_documents, metadata, created_at, updated_at)
VALUES (${values.join(', ')});`
  })

  fs.writeFileSync(sqlPath, sqlStatements.join('\n\n'))
  console.log(`💾 保存: ${sqlPath}`)

  return codes.length
}

async function generateImportScript() {
  console.log('\n📦 統合インポートスクリプトを生成中...')

  const importScript = `#!/bin/bash

# マスターデータ一括インポートスクリプト
#
# 使用方法:
# 1. GCP Cloud SQLのインスタンスに接続
# 2. このスクリプトを実行
#
# 例: ./import-master-data.sh

set -e

echo "🚀 マスターデータのインポートを開始します..."

# PostgreSQL接続情報（環境変数から取得）
PGHOST=\${PGHOST:-localhost}
PGPORT=\${PGPORT:-54322}
PGDATABASE=\${PGDATABASE:-postgres}
PGUSER=\${PGUSER:-postgres}
PGPASSWORD=\${PGPASSWORD:-postgres}

# データベース接続テスト
echo "📡 データベース接続を確認中..."
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ データベース接続成功"
else
  echo "❌ データベース接続失敗"
  exit 1
fi

# トランザクション内で一括実行
echo "📥 データをインポート中..."

psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE << EOF
BEGIN;

-- トレーニング
\\echo '📦 トレーニングをインポート中...'
\\i trainings.sql

-- 問診票
\\echo '📦 問診票をインポート中...'
\\i questionnaires.sql
\\i questionnaire_questions.sql

-- 通知テンプレート
\\echo '📦 通知テンプレートをインポート中...'
\\i notification_templates.sql

-- メモテンプレート
\\echo '📦 メモテンプレートをインポート中...'
\\i memo_templates.sql

-- 診療コード
\\echo '📦 診療コードをインポート中...'
\\i treatment_codes.sql

COMMIT;

\\echo '✅ すべてのマスターデータのインポートが完了しました'
EOF

echo "🎉 インポート完了！"
`

  const scriptPath = path.join(OUTPUT_DIR, 'import-master-data.sh')
  fs.writeFileSync(scriptPath, importScript)
  fs.chmodSync(scriptPath, '755') // 実行権限を付与
  console.log(`💾 保存: ${scriptPath}`)
}

async function main() {
  console.log('🚀 マスターデータ移行スクリプトを開始します')
  console.log(`📁 出力先: ${OUTPUT_DIR}`)

  try {
    const trainingCount = await exportTrainings()
    const { questionnaires: questionnaireCount, questions: questionCount } = await exportQuestionnaires()
    const notificationCount = await exportNotificationTemplates()
    const memoCount = await exportMemoTemplates()
    const treatmentCodeCount = await exportTreatmentCodes()
    await generateImportScript()

    console.log('\n✅ エクスポート完了!')
    console.log('\n📊 エクスポートサマリー:')
    console.log(`  - トレーニング: ${trainingCount}件`)
    console.log(`  - 問診票: ${questionnaireCount}件`)
    console.log(`  - 質問: ${questionCount}件`)
    console.log(`  - 通知テンプレート: ${notificationCount}件`)
    console.log(`  - メモテンプレート: ${memoCount}件`)
    console.log(`  - 診療コード: ${treatmentCodeCount}件`)
    console.log(`\n📂 出力ディレクトリ: ${OUTPUT_DIR}`)
    console.log('\n🎯 次のステップ:')
    console.log('  1. GCP Cloud SQLインスタンスを作成')
    console.log('  2. Prismaでスキーママイグレーション実行')
    console.log('  3. cd .master-data && ./import-master-data.sh を実行')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

main()
