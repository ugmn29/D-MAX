import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

console.log('📝 LINE設定を挿入\n');

// すでに存在するか確認
const { data: existing } = await supabase
  .from('clinic_settings')
  .select('*')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .eq('setting_key', 'line')
  .maybeSingle();

if (existing) {
  console.log('既存のLINE設定:');
  console.log(JSON.stringify(existing.setting_value, null, 2));
} else {
  console.log('LINE設定が見つかりません。新規作成します。');

  // LINE設定を作成
  const { error } = await supabase
    .from('clinic_settings')
    .insert({
      clinic_id: '11111111-1111-1111-1111-111111111111',
      setting_key: 'line',
      setting_value: {
        channel_id: '2008448369',
        channel_secret: 'bf58beb86b72e29e7d72f0d0ad9b8350',
        channel_access_token: '6bl58DetQhDHVMxbICvGYb6aWEbxSq7RrKAqGn7Fzg8iLOKAR+ieSx/YSEGIl4rFsKpEk8vZGhsHCnJKOVBphDv0Ao6FfaM7C1RH8VNPtPIbnXyYE8cW9s/g/pBq/fk3fBqGe9r8DdpNK3/a8UiBOQdB04t89/1O/w1cDnyilFU='
      }
    });

  if (error) {
    console.error('❌ 挿入エラー:', error);
    process.exit(1);
  }

  console.log('✅ LINE設定を作成しました');
}
