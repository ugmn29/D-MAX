import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📋 招待コード一覧を確認中...\n');

const { data, error } = await supabase
  .from('line_invitation_codes')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('❌ エラー:', error);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.log('⚠️ 招待コードが1件も見つかりません');
  process.exit(0);
}

console.log(`✅ ${data.length}件の招待コードが見つかりました:\n`);

const now = new Date();

data.forEach((code, i) => {
  const isExpired = new Date(code.expires_at) < now;
  console.log(`${i + 1}. 招待コード: ${code.invitation_code}`);
  console.log(`   ステータス: ${code.status}`);
  console.log(`   患者ID: ${code.patient_id}`);
  console.log(`   有効期限: ${code.expires_at}`);
  console.log(`   期限切れ: ${isExpired ? 'はい ❌' : 'いいえ ✅'}`);
  console.log(`   作成日時: ${code.created_at}\n`);
});
