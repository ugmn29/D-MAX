import { createClient } from '@supabase/supabase-js';

const PROD_URL = 'https://obdfmwpdkwraqqqyjgwu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGZtd3Bka3dyYXFxcXlqZ3d1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDk3NTkzMCwiZXhwIjoyMDQ2NTUxOTMwfQ.AuBYte-x23H2dKxZC7qK6aZxmJpTsvVXAo3hYsWTW5Y';

const supabase = createClient(PROD_URL, SERVICE_ROLE_KEY);

const { data, error } = await supabase
  .from('clinic_settings')
  .select('setting_key, setting_value')
  .eq('clinic_id', '11111111-1111-1111-1111-111111111111')
  .like('setting_key', 'line%');

console.log('LINE関連設定:');
console.log(JSON.stringify(data, null, 2));
