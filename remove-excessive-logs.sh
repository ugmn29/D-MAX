#!/bin/bash

echo "🧹 頻繁に呼ばれる関数の過剰なログを削除中..."

# questionnaires.ts から頻繁なログを削除
sed -i '' '/console\.log(.*MOCK_MODE: 問診表取得成功/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*問診表取得成功 - 生データ:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*問診表取得成功 - データ件数:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*問診表取得成功 - マッピング後:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*🔍 未連携問診票取得開始/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*✅ patient_id=nullの問診票:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*✅ 仮登録患者の問診票:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*📦 未連携問診票合計:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*MOCK_MODE: パース後の全問診票:/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*MOCK_MODE: 未連携問診票取得成功/d' lib/api/questionnaires.ts
sed -i '' '/console\.log(.*MOCK_MODE: localStorageから取得した生データ:/d' lib/api/questionnaires.ts

# clinic.ts から頻繁なログを削除
sed -i '' '/console\.log(.*モックモード: クリニック情報を返します/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*モックモード: クリニック設定データを返します/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*モックモード: 保存された設定を読み込みました/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*モックモード: 保存された設定のcancel_types:/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*モックモード: マージされた設定:/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*モックモード: cancel_typesの値:/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*getClinicSettings呼び出し:/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*使用するクライアント:/d' lib/api/clinic.ts
sed -i '' '/console\.log(.*getClinicSettingsレスポンス:/d' lib/api/clinic.ts

# patients.ts から頻繁なログを削除
sed -i '' '/console\.log(.*MOCK_MODE: localStorageから患者データを取得:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*MOCK_MODE: データベースから患者データを取得:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*MOCK_MODE: 合計患者数:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*getPatientById (MOCK_MODE/d' lib/api/patients.ts
sed -i '' '/console\.log(.*🔍 連携状況データ取得開始/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 未連携患者取得:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 連携済み患者取得:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*📦 最終結果:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*未連携患者サンプル:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*連携済み患者サンプル:/d' lib/api/patients.ts
sed -i '' '/console\.log(.*🔗 患者連携開始/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 患者連携完了/d' lib/api/patients.ts
sed -i '' '/console\.log(.*🔓 患者連携解除開始/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 患者を仮登録に戻しました/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 問診票の連携を解除しました/d' lib/api/patients.ts
sed -i '' '/console\.log(.*✅ 患者連携解除完了/d' lib/api/patients.ts

echo "✅ ログ削除完了"
echo ""
echo "📊 削除後のログ数:"
echo "questionnaires.ts: $(grep -c 'console\.log' lib/api/questionnaires.ts || echo 0)"
echo "clinic.ts: $(grep -c 'console\.log' lib/api/clinic.ts || echo 0)"
echo "patients.ts: $(grep -c 'console\.log' lib/api/patients.ts || echo 0)"
echo "appointments.ts: $(grep -c 'console\.log' lib/api/appointments.ts || echo 0)"
