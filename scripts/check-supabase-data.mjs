#!/usr/bin/env node

/**
 * Supabaseのデータ量を調査するスクリプト
 */

import pg from 'pg';

const { Pool } = pg;

const SUPABASE_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';

const pool = new Pool({
  connectionString: SUPABASE_URL,
});

// 調査対象のテーブル（実運用データのみ）
const TABLES_TO_CHECK = [
  'clinics',
  'staff',
  'patients',
  'appointments',
  'appointment_staff',
  'treatment_records',
  'treatment_record_items',
  'payment_records',
  'questionnaire_responses',
  'training_records',
  'training_evaluations',
  'notification_logs',
  'clinic_settings',
  'units',
  'treatment_menus',
  'daily_memos',
  'memo_todos',
];

async function checkData() {
  console.log('📊 Supabaseデータ量調査\n');
  console.log('接続先:', SUPABASE_URL);
  console.log('');

  const client = await pool.connect();

  try {
    const results = [];
    let totalRows = 0;

    for (const table of TABLES_TO_CHECK) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        results.push({ table, count });
        totalRows += count;
      } catch (error) {
        results.push({ table, count: 'エラー', error: error.message });
      }
    }

    // 結果を表示
    console.log('テーブル名'.padEnd(40) + '件数');
    console.log('='.repeat(50));

    results
      .sort((a, b) => (typeof b.count === 'number' ? b.count : 0) - (typeof a.count === 'number' ? a.count : 0))
      .forEach(({ table, count, error }) => {
        if (error) {
          console.log(`${table.padEnd(40)}エラー: ${error}`);
        } else {
          console.log(`${table.padEnd(40)}${count.toLocaleString()}`);
        }
      });

    console.log('='.repeat(50));
    console.log(`合計${totalRows.toLocaleString()}件のデータ\n`);

    // データが存在するテーブルのみリスト
    const tablesWithData = results.filter(r => typeof r.count === 'number' && r.count > 0);

    if (tablesWithData.length > 0) {
      console.log('\n📦 データが存在するテーブル:');
      tablesWithData.forEach(({ table, count }) => {
        console.log(`  - ${table}: ${count.toLocaleString()}件`);
      });
    } else {
      console.log('\n⚠️  実運用データは存在しません（マスターデータのみ）');
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkData().catch(error => {
  console.error('調査に失敗しました:', error);
  process.exit(1);
});
