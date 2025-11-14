#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // 抜髄関連のコードを検索
  console.log('抜髄関連のコード:');
  const { data: pulp, error: pulpError } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%抜髄%')
    .limit(10);

  if (pulpError) {
    console.error('エラー:', pulpError);
  } else {
    console.log(JSON.stringify(pulp, null, 2));
  }

  // 抜歯関連のコードを検索
  console.log('\n抜歯関連のコード:');
  const { data: extraction, error: extractionError } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%抜歯%')
    .limit(10);

  if (extractionError) {
    console.error('エラー:', extractionError);
  } else {
    console.log(JSON.stringify(extraction, null, 2));
  }

  // 充填関連のコードを検索
  console.log('\n充填関連のコード:');
  const { data: filling, error: fillingError } = await supabase
    .from('treatment_codes')
    .select('code, name, points')
    .ilike('name', '%充填%')
    .limit(10);

  if (fillingError) {
    console.error('エラー:', fillingError);
  } else {
    console.log(JSON.stringify(filling, null, 2));
  }
}

main().catch(console.error);
