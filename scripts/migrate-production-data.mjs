#!/usr/bin/env node

/**
 * Supabaseの実運用データをGCP Cloud SQLに移行
 */

import pg from 'pg';

const { Pool } = pg;

const SUPABASE_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';
const GCP_URL = 'postgresql://postgres:QbPiXHPRDbMVXOsqRQBCiu4EDKu4jXFC@34.146.9.14:5432/postgres';

const supabasePool = new Pool({ connectionString: SUPABASE_URL });
const gcpPool = new Pool({ connectionString: GCP_URL });

// 移行対象テーブル（外部キー制約を考慮した順序）
const MIGRATION_ORDER = [
  {
    table: 'clinics',
    columns: ['id', 'name', 'slug', 'created_at', 'updated_at'],
    description: 'クリニック'
  },
  {
    table: 'staff',
    columns: ['id', 'clinic_id', 'name', 'email', 'role', 'created_at', 'updated_at'],
    description: 'スタッフ'
  },
  {
    table: 'treatment_menus',
    columns: ['id', 'clinic_id', 'parent_id', 'level', 'name', 'standard_duration', 'color', 'sort_order', 'is_active', 'web_booking_enabled', 'web_booking_staff_ids', 'web_booking_duration', 'web_booking_new_patient', 'web_booking_returning', 'created_at'],
    description: '診療メニュー'
  },
  {
    table: 'clinic_settings',
    columns: ['id', 'clinic_id', 'setting_key', 'setting_value', 'line_registered_rich_menu_id', 'line_unregistered_rich_menu_id', 'created_at', 'updated_at'],
    description: 'クリニック設定'
  },
  {
    table: 'patients',
    columns: ['id', 'clinic_id', 'patient_number', 'global_uuid', 'last_name', 'first_name', 'last_name_kana', 'first_name_kana', 'birth_date', 'gender', 'phone', 'email', 'postal_code', 'prefecture', 'city', 'address_line', 'allergies', 'medical_history', 'primary_doctor_id', 'primary_hygienist_id', 'created_at', 'updated_at'],
    description: '患者'
  },
  {
    table: 'questionnaire_responses',
    columns: ['id', 'questionnaire_id', 'patient_id', 'appointment_id', 'response_data', 'completed_at', 'created_at', 'updated_at'],
    description: '問診票回答'
  },
];

async function migrateTable(sourceClient, targetClient, { table, columns, description }) {
  console.log(`\n📦 ${description} (${table}) を移行中...`);

  try {
    // ソースデータを取得
    const columnList = columns.join(', ');
    const sourceResult = await sourceClient.query(`SELECT ${columnList} FROM ${table}`);

    if (sourceResult.rows.length === 0) {
      console.log(`   ⚠️  データなし（スキップ）`);
      return { table, count: 0, skipped: true };
    }

    console.log(`   📊 ${sourceResult.rows.length}件のデータを検出`);

    // ターゲットに挿入
    let inserted = 0;
    let skipped = 0;

    for (const row of sourceResult.rows) {
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => row[col]);

      try {
        await targetClient.query(
          `INSERT INTO ${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
          values
        );
        inserted++;
      } catch (error) {
        // 外部キー制約エラーの場合はスキップ
        if (error.code === '23503') {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`   ✅ ${inserted}件を移行、${skipped}件をスキップ`);
    return { table, count: inserted, skipped };

  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}`);
    return { table, count: 0, error: error.message };
  }
}

async function migrate() {
  console.log('🚀 Supabase → GCP Cloud SQL データ移行\n');
  console.log('ソース:', SUPABASE_URL);
  console.log('ターゲット:', GCP_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const sourceClient = await supabasePool.connect();
  const targetClient = await gcpPool.connect();

  try {
    // 接続テスト
    console.log('📡 データベース接続を確認中...');
    await sourceClient.query('SELECT 1');
    await targetClient.query('SELECT 1');
    console.log('✅ 接続成功\n');

    const results = [];

    // 各テーブルを個別のトランザクションで処理
    for (const config of MIGRATION_ORDER) {
      await targetClient.query('BEGIN');
      try {
        const result = await migrateTable(sourceClient, targetClient, config);
        results.push(result);
        await targetClient.query('COMMIT');
      } catch (error) {
        await targetClient.query('ROLLBACK');
        console.error(`   ⚠️  ロールバック: ${error.message}`);
        results.push({ table: config.table, count: 0, error: error.message });
      }
    }

    // サマリー
    console.log('\n' + '='.repeat(60));
    console.log('📊 移行サマリー\n');

    const totalMigrated = results.reduce((sum, r) => sum + r.count, 0);
    const totalSkipped = results.reduce((sum, r) => sum + (r.skipped || 0), 0);

    results.forEach(({ table, count, skipped, error }) => {
      if (error) {
        console.log(`  ❌ ${table}: エラー`);
      } else if (skipped && count === 0) {
        console.log(`  ⚠️  ${table}: データなし`);
      } else {
        console.log(`  ✅ ${table}: ${count}件移行${skipped ? ` (${skipped}件スキップ)` : ''}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 移行完了: ${totalMigrated}件を移行${totalSkipped ? ` (${totalSkipped}件スキップ)` : ''}`);

  } catch (error) {
    console.error('\n❌ 移行に失敗しました:', error.message);
    throw error;
  } finally {
    sourceClient.release();
    targetClient.release();
    await supabasePool.end();
    await gcpPool.end();
  }
}

migrate().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});
