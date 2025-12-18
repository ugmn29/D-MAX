/**
 * デフォルトの提供文書テンプレートデータ
 */

export interface DefaultDocumentTemplate {
  document_type: string
  template_key: string
  template_name: string
  template_data: Record<string, any>
  display_order: number
}

export const DEFAULT_DOCUMENT_TEMPLATES: DefaultDocumentTemplate[] = [
  // 診療情報提供料(I)のテンプレート
  {
    document_type: '診療情報提供料(I)',
    template_key: 'impacted_wisdom_tooth',
    template_name: '親知らず抜歯依頼',
    template_data: {
      referToDepartment: '口腔外科',
      diagnosis: '智歯周囲炎\n埋伏智歯',
      chiefComplaint: '右下奥歯の痛みと腫れ',
      referralReason: '下顎智歯（右側第三大臼歯）が水平埋伏しており、周囲組織に炎症を繰り返しているため、抜歯が必要と判断いたしました。当院での処置は困難なため、貴院での抜歯をお願いいたします。',
      presentIllness: '2ヶ月前より右下奥歯の痛みと腫れを繰り返しております。パノラマX線写真にて右側下顎智歯が水平埋伏していることを確認いたしました。',
      clinicalSummary: '智歯周囲の歯肉は腫脹し、軽度の発赤を認めます。開口障害は認めません。',
      requestedExam: '抜歯処置をお願いいたします。必要に応じてCT撮影による下歯槽神経との位置関係の確認をお願いいたします。'
    },
    display_order: 0
  },
  {
    document_type: '診療情報提供料(I)',
    template_key: 'mri_tmj',
    template_name: 'MRI撮影依頼（顎関節症）',
    template_data: {
      referToDepartment: '放射線科・口腔外科',
      diagnosis: '顎関節症',
      chiefComplaint: '口を開けると顎が痛い、カクカク音がする',
      referralReason: '顎関節部の疼痛とクリック音を認め、顎関節症と診断いたしました。関節円板の転位の有無および顎関節の詳細な評価のため、MRI撮影をお願いいたします。',
      presentIllness: '3ヶ月前より開口時の顎関節部痛とクリック音が出現しました。徐々に症状が増悪し、食事にも支障をきたすようになりました。',
      clinicalSummary: '最大開口量：35mm（制限あり）\n開口時に両側顎関節部にクリック音を認めます。\n左側顎関節部に圧痛を認めます。',
      treatmentHistory: 'スプリント療法を開始しましたが、症状の改善が乏しく、精査が必要と判断いたしました。',
      requestedExam: '顎関節MRI撮影（開口位・閉口位）をお願いいたします。関節円板の転位の有無、関節腔の状態、骨変形の有無について評価をお願いいたします。'
    },
    display_order: 1
  },
  {
    document_type: '診療情報提供料(I)',
    template_key: 'hypertension_consultation',
    template_name: '高血圧疑い（内科紹介）',
    template_data: {
      referToDepartment: '内科・循環器内科',
      diagnosis: '高血圧症疑い',
      chiefComplaint: '歯科治療前の血圧測定にて高値を認める',
      referralReason: '歯科治療に際して血圧測定を実施したところ、複数回にわたり収縮期血圧160mmHg以上の高値を認めました。ご本人は高血圧の既往を認識しておらず、精査・加療が必要と判断いたしました。',
      presentIllness: '当院での血圧測定（安静時）：\n1回目 165/95 mmHg\n2回目 170/100 mmHg\n3回目 162/98 mmHg\n\nご本人は自覚症状に乏しく、これまで血圧を測定する機会がなかったとのことです。',
      clinicalSummary: '頭痛、めまい、動悸などの自覚症状は特に訴えておりません。',
      pastMedicalHistory: '特記すべき既往歴なし',
      requestedExam: '高血圧症の精査・診断および治療をお願いいたします。血圧コントロール後、歯科治療を再開したいと考えております。'
    },
    display_order: 2
  },
  {
    document_type: '診療情報提供料(I)',
    template_key: 'diabetes_consultation',
    template_name: '糖尿病疑い（内科紹介）',
    template_data: {
      referToDepartment: '内科・糖尿病内科',
      diagnosis: '糖尿病疑い\n重度歯周炎',
      chiefComplaint: '歯肉の腫れ、出血、口渇感',
      referralReason: '重度歯周炎の患者様で、治療経過が不良であり、口渇感・多飲多尿などの症状を認めます。糖尿病の可能性を考慮し、精査をお願いいたします。',
      presentIllness: '広範囲の重度歯周炎があり、歯周基本治療を実施しておりますが、治療に対する反応が悪く、歯肉の腫脹・出血が持続しております。\n\nご本人より、最近口が渇く、水をよく飲む、トイレが近い、という訴えがありました。',
      clinicalSummary: '全顎的に歯周ポケット6mm以上の部位が多数あり、排膿を認める部位もあります。創傷治癒が遅延している印象です。',
      pastMedicalHistory: '家族歴：母親が糖尿病',
      requestedExam: '糖尿病の精査（HbA1c、血糖値測定等）をお願いいたします。糖尿病と診断された場合は、医科歯科連携による管理を行いたいと考えております。'
    },
    display_order: 3
  },
  {
    document_type: '診療情報提供料(I)',
    template_key: 'allergic_rhinitis',
    template_name: 'アレルギー性鼻炎疑い（耳鼻科紹介）',
    template_data: {
      referToDepartment: '耳鼻咽喉科',
      diagnosis: 'アレルギー性鼻炎疑い\n口呼吸',
      chiefComplaint: '口が乾く、いびき、鼻づまり',
      referralReason: '慢性的な鼻閉により口呼吸が習慣化しており、口腔乾燥症状が顕著です。アレルギー性鼻炎の可能性が高く、精査・加療をお願いいたします。',
      presentIllness: '幼少期より鼻づまりがあり、常に口呼吸をしているとのことです。朝起きると口がカラカラに乾いており、喉も痛いとのことです。いびきも指摘されているとのことです。',
      clinicalSummary: '口腔粘膜の乾燥が著明で、う蝕リスクが高い状態です。舌苔の付着も認めます。',
      treatmentHistory: '口腔乾燥に対して、保湿剤の使用を指導しておりますが、根本的な改善には鼻呼吸の確立が必要と考えます。',
      requestedExam: 'アレルギー性鼻炎の精査・診断および治療をお願いいたします。鼻閉の改善により、口呼吸から鼻呼吸への移行を図りたいと考えております。'
    },
    display_order: 4
  },
  {
    document_type: '診療情報提供料(I)',
    template_key: 'preoperative_dental_care',
    template_name: '便宜抜歯（術前口腔ケア）',
    template_data: {
      referToDepartment: '口腔外科',
      diagnosis: '保存不可能歯（複数歯）\n慢性歯周炎',
      chiefComplaint: '他院での手術予定があり、事前の歯科治療を依頼された',
      referralReason: '患者様は〇〇病院にて全身麻酔下での手術が予定されており、術前の口腔環境整備が必要とのことで当院を受診されました。保存不可能な残根歯が複数あり、感染源除去のための抜歯が必要ですが、抗凝固薬服用中であるため、貴院での処置をお願いいたします。',
      presentIllness: '〇〇病院での手術予定日：〇月〇日\n現在、抗凝固薬（ワーファリン/DOAC）を服用中です。',
      clinicalSummary: '保存不可能な残根歯：〇〇部、〇〇部、〇〇部\n歯周ポケット6mm以上の部位が多数あり、術前の口腔ケアが必要です。',
      requestedExam: '抗凝固薬管理下での抜歯処置および周術期口腔機能管理をお願いいたします。手術予定日までに感染源の除去と口腔環境の改善を図りたいと考えております。',
      remarks: '手術予定の主治医：〇〇病院 〇〇科 〇〇先生'
    },
    display_order: 5
  },

  // 診療情報等連携共有料1のテンプレート
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'extraction',
    template_name: '抜歯の可否確認',
    template_data: {
      inquiryPurpose: '抜歯処置を予定しているため、全身状態の確認と抜歯の可否についてご教示をお願いいたします。',
      systemicManagementReason: '患者様は抗凝固薬を服用中であり、観血的処置である抜歯を行うにあたり、全身的管理が必要と判断いたしました。出血リスクの評価と、必要に応じた休薬や代替療法についてご指導をいただきたく存じます。',
      treatmentPolicy: '残根状態の歯牙の抜歯を予定しております。全身状態を確認の上、安全に処置を行いたいと考えております。',
      requestedInformation: ['投薬内容', '血液検査データ', '処方薬詳細'],
      requestedInformationDetail: '・現在服用中の抗凝固薬・抗血小板薬の種類と用量\n・最近の血液検査データ（PT-INR値、血小板数等）\n・抜歯時の休薬の必要性について\n・代替療法の検討が必要な場合はその内容\n・その他、抜歯時の注意事項'
    },
    display_order: 0
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'implant',
    template_name: 'インプラント治療の可否確認',
    template_data: {
      inquiryPurpose: 'インプラント治療を希望されており、全身状態の確認とインプラント治療の可否についてご教示をお願いいたします。',
      systemicManagementReason: '患者様は糖尿病・骨粗鬆症の既往があり、インプラント治療を行うにあたり、全身的管理が必要と判断いたしました。特に骨代謝や創傷治癒への影響、BP製剤の使用歴について確認が必要です。',
      treatmentPolicy: '欠損部位へのインプラント埋入を検討しております。全身状態を確認の上、治療の可否を判断したいと考えております。',
      requestedInformation: ['投薬内容', '血液検査データ', '処方薬詳細', '既往歴', '治療経過'],
      requestedInformationDetail: '・糖尿病のコントロール状態（HbA1c値等）\n・骨粗鬆症治療薬（BP製剤等）の使用歴と現在の投薬状況\n・その他インプラント治療に影響を及ぼす可能性のある疾患・投薬\n・インプラント治療の可否についてのご意見\n・治療を行う場合の注意事項'
    },
    display_order: 1
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'medication_change',
    template_name: '薬剤変更・休薬の依頼',
    template_data: {
      inquiryPurpose: '歯科治療を安全に行うため、服用中の薬剤の変更または一時的な休薬についてご検討をお願いいたします。',
      systemicManagementReason: '患者様は抗凝固薬を長期服用中であり、今後予定している観血的処置（抜歯、歯周外科等）において出血のリスクが高いと判断いたしました。処置を安全に行うため、薬剤の調整についてご相談させていただきたく存じます。',
      treatmentPolicy: '観血的処置を予定しております。出血リスクを最小限にするため、薬剤の調整をご検討いただきたいと考えております。',
      requestedInformation: ['投薬内容', '処方薬詳細'],
      requestedInformationDetail: '・現在の抗凝固薬・抗血小板薬の種類と用量\n・処置前の休薬の可否と期間\n・代替薬への変更の可否\n・休薬が困難な場合の対応方法\n・処置後の投薬再開のタイミング'
    },
    display_order: 2
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'medication_status',
    template_name: '服薬状況の確認',
    template_data: {
      inquiryPurpose: '患者様の服薬状況を正確に把握し、安全な歯科治療を提供するため、現在の投薬内容についてご教示をお願いいたします。',
      systemicManagementReason: '患者様は複数の医療機関を受診されており、全ての服用薬を正確に把握する必要があると判断いたしました。特に歯科治療に影響を及ぼす可能性のある薬剤について確認が必要です。',
      treatmentPolicy: '全身状態を考慮した適切な歯科治療を提供したいと考えております。',
      requestedInformation: ['投薬内容', '服用薬の情報', '処方薬詳細', 'アレルギー情報'],
      requestedInformationDetail: '・現在処方されている全ての薬剤の名称と用量\n・服薬のコンプライアンス状況\n・薬物アレルギーの有無\n・歯科治療において注意すべき薬剤の有無\n・薬剤の相互作用について留意すべき事項'
    },
    display_order: 3
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'general_condition',
    template_name: '全身状態の確認',
    template_data: {
      inquiryPurpose: '患者様の全身状態を把握し、安全な歯科治療を提供するため、現在の病状と治療状況についてご教示をお願いいたします。',
      systemicManagementReason: '患者様は全身疾患の既往があり、歯科治療を行うにあたり、現在の病状と治療状況を正確に把握する必要があると判断いたしました。',
      treatmentPolicy: '全身状態を十分に考慮した上で、適切な歯科治療を提供したいと考えております。',
      requestedInformation: ['検査結果', '投薬内容', '既往歴', '現病歴', '治療経過'],
      requestedInformationDetail: '・現在の病状とコントロール状態\n・最近の検査データ（血液検査、画像検査等）\n・現在の治療内容と投薬状況\n・歯科治療において注意すべき事項\n・歯科治療の可否についてのご意見'
    },
    display_order: 4
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'perioperative_management',
    template_name: '周術期の管理についての相談',
    template_data: {
      inquiryPurpose: '歯科の観血的処置を予定しており、周術期の全身管理についてご指導をお願いいたします。',
      systemicManagementReason: '患者様は心疾患・糖尿病等の全身疾患を有しており、観血的処置を安全に行うため、周術期の全身管理が必要と判断いたしました。',
      treatmentPolicy: '抜歯または歯周外科処置を予定しております。周術期の管理方法についてご指導いただきたいと考えております。',
      requestedInformation: ['投薬内容', '血液検査データ', '治療経過'],
      requestedInformationDetail: '・術前に中止すべき薬剤の有無と期間\n・術中・術後の感染予防について（抗菌薬の予防投与等）\n・血糖コントロールへの影響と対策\n・循環器系への配慮事項\n・その他周術期管理において注意すべき事項'
    },
    display_order: 5
  },
  {
    document_type: '診療情報等連携共有料1',
    template_key: 'bisphosphonate',
    template_name: 'BP製剤使用患者の治療相談',
    template_data: {
      inquiryPurpose: '患者様がビスフォスフォネート製剤を使用中であり、歯科治療（特に抜歯等の観血処置）の可否と注意事項についてご教示をお願いいたします。',
      systemicManagementReason: '患者様は骨粗鬆症の治療でビスフォスフォネート製剤を使用中であり、顎骨壊死のリスクがあるため、観血的処置を行う前に詳細な情報確認が必要と判断いたしました。',
      treatmentPolicy: '抜歯が必要な状態ですが、BP製剤の影響を考慮し、慎重に判断したいと考えております。',
      requestedInformation: ['投薬内容', '処方薬詳細', '治療経過'],
      requestedInformationDetail: '・使用中のBP製剤の種類（経口/注射）\n・投与期間と累積投与量\n・休薬の可否と期間\n・骨密度の現状と治療の必要性\n・歯科処置を行う場合の注意事項とリスク管理方法'
    },
    display_order: 6
  },

  // 診療情報等連携共有料2のテンプレート
  {
    document_type: '診療情報等連携共有料2',
    template_key: 'perioperative_dental_info',
    template_name: '周術期口腔機能管理の情報提供',
    template_data: {
      chiefComplaint: '歯科治療のため当院通院中',
      dentalDiagnosis: '慢性歯周炎\n多数歯う蝕',
      dentalFindings: '歯周ポケット4mm以上の部位が複数あり、歯肉からの出血を認めます。\nう蝕により残根状態の歯が複数あります。\nプラークコントロールは不良な状態です。',
      dentalTreatmentStatus: '現在、歯周基本治療を実施中です。\nスケーリング・ルートプレーニングを行い、歯周組織の改善を図っております。\n残根歯については、全身状態を考慮しながら抜歯を予定しております。',
      treatmentHistory: '約3ヶ月前より歯周病治療のため通院を開始いたしました。\n口腔衛生指導とスケーリングを継続的に実施しております。',
      medications: '現在、歯科からの処方薬はございません。',
      examResults: 'パノラマX線写真にて、複数歯に歯槽骨吸収像を認めます。\n歯周ポケット検査：4mm以上の部位が約40%',
      precautions: '・術前・術後の口腔ケアを徹底し、口腔内細菌の減少を図ります\n・全身麻酔や鎮静下での処置の際は、誤嚥性肺炎のリスクに注意が必要です\n・抗凝固薬服用中の場合、観血的処置時の出血リスクがあります\n・免疫抑制状態では感染リスクが高まるため、より慎重な口腔管理が必要です'
    },
    display_order: 0
  },
  {
    document_type: '診療情報等連携共有料2',
    template_key: 'anticoagulant_response',
    template_name: '抗凝固薬に関する回答',
    template_data: {
      chiefComplaint: '歯科治療のため当院通院中',
      dentalDiagnosis: '残根（〇〇部）',
      dentalFindings: '〇〇部に残根があり、周囲歯肉に軽度の炎症を認めます。',
      dentalTreatmentStatus: '残根の抜歯が必要な状態です。\n抗凝固薬服用中とのことで、主治医の先生にご相談の上、安全に処置を行いたいと考えております。',
      treatmentHistory: '保存不可能と判断し、抜歯を予定しております。',
      medications: '歯科からの処方薬はございません。',
      examResults: 'パノラマX線写真にて残根を確認しております。',
      precautions: '・抗凝固薬服用中のため、抜歯時の出血リスクについて評価が必要です\n・PT-INR値が治療域内であれば、休薬せずに抜歯可能な場合が多いとされています\n・必要に応じて局所止血処置（縫合、止血剤の使用等）を行います\n・術後の止血確認を十分に行い、出血時の対応について患者様にもご説明いたします'
    },
    display_order: 1
  },
  {
    document_type: '診療情報等連携共有料2',
    template_key: 'diabetes_dental_care',
    template_name: '糖尿病患者の歯科管理状況',
    template_data: {
      chiefComplaint: '歯肉の腫れと出血',
      dentalDiagnosis: '糖尿病性歯周炎（重度）',
      dentalFindings: '歯周ポケット6mm以上の部位が多数あり、排膿を認める部位もあります。\n歯肉は全体的に腫脹し、易出血性です。\n歯の動揺も認めます。',
      dentalTreatmentStatus: '歯周基本治療を実施中です。\n徹底した口腔清掃指導を行い、スケーリング・ルートプレーニングを継続しております。\n血糖コントロールの状態を確認しながら、必要に応じて外科的処置も検討しております。',
      treatmentHistory: '2ヶ月前より歯周病治療を開始いたしました。\n口腔衛生状態は徐々に改善傾向にあります。',
      medications: '抗菌薬の短期投与を検討する場合があります（急性炎症時）。',
      examResults: 'パノラマX線写真にて、広範囲に歯槽骨吸収を認めます。\n歯周ポケット検査：平均5.2mm',
      precautions: '・歯周病と糖尿病は相互に悪影響を及ぼすため、継続的な歯科管理が重要です\n・血糖コントロール不良時は感染リスクが高く、創傷治癒も遅延します\n・HbA1c 7%未満を目標に、医科歯科連携による管理が望ましいと考えます\n・低血糖発作のリスクに注意し、治療時間帯にも配慮しております'
    },
    display_order: 2
  },
  {
    document_type: '診療情報等連携共有料2',
    template_key: 'cancer_treatment_dental',
    template_name: 'がん治療前の歯科管理',
    template_data: {
      chiefComplaint: 'がん治療前の歯科チェック',
      dentalDiagnosis: '慢性歯周炎\nう蝕（複数歯）\n感染源となりうる病巣の存在',
      dentalFindings: '歯周ポケット4mm以上の部位が複数あります。\n〇〇部にう蝕を認め、打診痛があります。\n智歯周囲炎のリスクがある埋伏智歯があります。',
      dentalTreatmentStatus: 'がん治療開始前に、感染源となりうる病巣の治療を優先的に行っております。\n重度う蝕歯の抜歯、歯周病の急性期治療を実施中です。\n口腔衛生指導を徹底し、がん治療中の口腔トラブル予防に努めております。',
      treatmentHistory: '治療開始1ヶ月前より、集中的に歯科治療を実施しております。\n感染源除去と口腔環境の改善を進めております。',
      medications: '抗菌薬、鎮痛薬を一時的に処方する場合があります。',
      examResults: 'パノラマX線写真、デンタルX線写真にて、保存不可能歯を確認しております。',
      precautions: '・化学療法開始前に、感染源となりうる歯は可能な限り除去することが望ましいです\n・治療中は骨髄抑制による易感染性、易出血性に注意が必要です\n・口腔粘膜炎の予防・管理のため、継続的な口腔ケアを実施いたします\n・緊急時以外の観血的処置は、血球数の回復を待って行うことが推奨されます'
    },
    display_order: 3
  },
  {
    document_type: '診療情報等連携共有料2',
    template_key: 'general_dental_status',
    template_name: '一般的な歯科治療状況の報告',
    template_data: {
      chiefComplaint: '歯科治療のため通院中',
      dentalDiagnosis: 'う蝕（〇〇部）\n歯周炎',
      dentalFindings: '〇〇部にう蝕を認めます。\n全体的に軽度から中等度の歯周炎を認めます。\n現時点で急性症状はございません。',
      dentalTreatmentStatus: 'う蝕治療および歯周病治療を計画的に実施しております。\n現在、大きな問題なく治療が進行しております。',
      treatmentHistory: '定期的に歯科治療を受けられており、口腔内の状態は安定しております。',
      medications: '現在、歯科からの処方薬はございません。',
      examResults: 'パノラマX線写真、口腔内写真にて経過観察中です。',
      precautions: '・現時点で、医科治療に影響を及ぼすような口腔内の問題はございません\n・継続的な歯科管理により、口腔内環境の維持に努めております\n・全身麻酔や手術を予定される場合は、事前にご連絡いただければ幸いです'
    },
    display_order: 4
  }
]
