import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const codes = ['140000310', '140000410', '140009110', '140009210', '140009310', '140009410', '140000210'];

  console.log('データベース内のCR充填コード確認:\n');

  for (const code of codes) {
    const { data, error } = await supabase
      .from('treatment_codes')
      .select('code, name, points')
      .eq('code', code)
      .single();

    if (error || !data) {
      console.log(`❌ ${code}: 見つかりません`);
    } else {
      console.log(`✅ ${code}: ${data.name} (${data.points}点)`);
    }
  }
}

check();
