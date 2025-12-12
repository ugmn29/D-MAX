import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 全設定を確認\n');

const { data: clinics } = await supabase
  .from('clinics')
  .select('id, name')
  .limit(1);

const clinicId = clinics[0].id;
console.log(`🏥 クリニック: ${clinics[0].name}\n`);

// すべての設定を取得
const { data: allSettings } = await supabase
  .from('clinic_settings')
  .select('*')
  .eq('clinic_id', clinicId);

console.log(`📊 保存されている設定キー (${allSettings?.length || 0}件):\n`);

allSettings?.forEach(setting => {
  console.log(`  - ${setting.setting_key}`);

  if (setting.setting_key === 'notification_settings') {
    console.log('    └─ LINE有効:', setting.setting_value?.line?.enabled);
    console.log('    └─ チャンネルID:', setting.setting_value?.line?.channel_id);
    console.log('    └─ トークン:', setting.setting_value?.line?.channel_access_token ?
      setting.setting_value.line.channel_access_token.substring(0, 20) + '...' : '未設定');
  }

  if (setting.setting_key === 'line') {
    console.log('    └─ チャンネルID:', setting.setting_value?.channel_id);
    console.log('    └─ トークン:', setting.setting_value?.channel_access_token ?
      setting.setting_value.channel_access_token.substring(0, 20) + '...' : '未設定');
  }
});
