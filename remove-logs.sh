#!/bin/bash

# appointments.ts内の頻繁に呼ばれる関数のデバッグログを削除
sed -i '' '/console\.log(.*モックモード:/d' lib/api/appointments.ts
sed -i '' '/console\.log(.*患者情報検索:/d' lib/api/appointments.ts  
sed -i '' '/console\.log(.*日付フィルタリング/d' lib/api/appointments.ts
sed -i '' '/console\.log(.*予約日付:/d' lib/api/appointments.ts
sed -i '' '/console\.log(.*フィルタリング後の予約データ:/d' lib/api/appointments.ts
sed -i '' '/console\.log(.*データベースモード: 患者アイコン/d' lib/api/appointments.ts

echo "ログを削除しました"
