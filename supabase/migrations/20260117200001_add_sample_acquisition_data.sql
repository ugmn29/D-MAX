-- サンプルの患者獲得経路データを投入（来院経路分析のテスト用）

-- 既存の患者IDを取得して使用
DO $$
DECLARE
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
    v_patient_ids UUID[];
    v_patient_id UUID;
    v_sources TEXT[] := ARRAY['Google検索', 'Instagram広告', 'MEO(Googleマップ)', 'チラシ', 'ホットペッパー', '知人紹介', 'Facebook広告', 'LINE広告', 'YouTube広告', '看板'];
    v_devices TEXT[] := ARRAY['mobile', 'desktop', 'tablet'];
    v_utm_sources TEXT[] := ARRAY['google', 'instagram', 'facebook', 'line', 'youtube', 'hotpepper', 'flyer_001', 'flyer_002', 'meo', 'referral'];
    v_utm_mediums TEXT[] := ARRAY['cpc', 'social', 'organic', 'referral', 'qrcode', 'display'];
    i INTEGER;
    v_booking_date TIMESTAMP WITH TIME ZONE;
    v_day_offset INTEGER;
    v_hour INTEGER;
    v_source_idx INTEGER;
BEGIN
    -- 既存の患者IDを取得（最大50件）
    SELECT ARRAY_AGG(id) INTO v_patient_ids
    FROM (
        SELECT id FROM patients WHERE clinic_id = v_clinic_id LIMIT 50
    ) sub;

    -- 患者がいない場合はスキップ
    IF v_patient_ids IS NULL OR array_length(v_patient_ids, 1) IS NULL THEN
        RAISE NOTICE 'No patients found for clinic_id %', v_clinic_id;
        RETURN;
    END IF;

    -- 過去60日分のサンプルデータを生成
    FOR i IN 1..100 LOOP
        -- ランダムな患者を選択
        v_patient_id := v_patient_ids[1 + floor(random() * array_length(v_patient_ids, 1))::int];

        -- ランダムな日付（過去60日以内）
        v_day_offset := floor(random() * 60)::int;
        v_hour := 9 + floor(random() * 12)::int; -- 9時〜21時
        v_booking_date := NOW() - (v_day_offset || ' days')::interval + (v_hour || ' hours')::interval;

        -- ランダムな流入元
        v_source_idx := 1 + floor(random() * array_length(v_sources, 1))::int;

        -- patient_acquisition_sourcesにデータ挿入
        INSERT INTO patient_acquisition_sources (
            patient_id,
            clinic_id,
            utm_source,
            utm_medium,
            utm_campaign,
            device_type,
            final_source,
            tracking_method,
            first_visit_at,
            booking_completed_at
        ) VALUES (
            v_patient_id,
            v_clinic_id,
            v_utm_sources[v_source_idx],
            v_utm_mediums[1 + floor(random() * array_length(v_utm_mediums, 1))::int],
            'campaign_' || (2024 + floor(random() * 2))::text || '_' || lpad((1 + floor(random() * 12))::text, 2, '0'),
            v_devices[1 + floor(random() * array_length(v_devices, 1))::int],
            v_sources[v_source_idx],
            CASE WHEN random() > 0.3 THEN 'utm' ELSE 'questionnaire' END,
            v_booking_date - interval '30 minutes',
            v_booking_date
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    RAISE NOTICE 'Inserted sample acquisition data for clinic %', v_clinic_id;
END $$;

-- ファネルイベントのサンプルデータ
DO $$
DECLARE
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
    v_session_id UUID;
    v_sources TEXT[] := ARRAY['google', 'instagram', 'facebook', 'line', 'meo', 'direct'];
    v_devices TEXT[] := ARRAY['mobile', 'desktop', 'tablet'];
    v_steps TEXT[] := ARRAY['landing', 'date_selection', 'time_selection', 'menu_selection', 'patient_info', 'complete'];
    i INTEGER;
    j INTEGER;
    v_max_step INTEGER;
    v_event_time TIMESTAMP WITH TIME ZONE;
    v_day_offset INTEGER;
    v_source TEXT;
    v_device TEXT;
BEGIN
    -- 200セッション分のファネルデータを生成
    FOR i IN 1..200 LOOP
        v_session_id := gen_random_uuid();
        v_day_offset := floor(random() * 60)::int;
        v_event_time := NOW() - (v_day_offset || ' days')::interval + (9 + floor(random() * 12) || ' hours')::interval;
        v_source := v_sources[1 + floor(random() * array_length(v_sources, 1))::int];
        v_device := v_devices[1 + floor(random() * array_length(v_devices, 1))::int];

        -- 離脱ポイントをランダムに決定（完了率約30%）
        v_max_step := CASE
            WHEN random() < 0.15 THEN 1  -- 15%がランディングで離脱
            WHEN random() < 0.25 THEN 2  -- 10%が日付選択で離脱
            WHEN random() < 0.35 THEN 3  -- 10%が時間選択で離脱
            WHEN random() < 0.50 THEN 4  -- 15%がメニュー選択で離脱
            WHEN random() < 0.70 THEN 5  -- 20%が患者情報入力で離脱
            ELSE 6                        -- 30%が完了
        END;

        -- 各ステップのイベントを記録
        FOR j IN 1..v_max_step LOOP
            INSERT INTO web_booking_funnel_events (
                session_id,
                clinic_id,
                step_name,
                step_number,
                event_type,
                event_timestamp,
                utm_source,
                utm_medium,
                device_type,
                metadata
            ) VALUES (
                v_session_id,
                v_clinic_id,
                v_steps[j],
                j,
                CASE j WHEN 6 THEN 'form_submit' ELSE 'page_view' END,
                v_event_time + ((j - 1) * interval '2 minutes'),
                v_source,
                CASE WHEN v_source = 'google' THEN 'cpc'
                     WHEN v_source IN ('instagram', 'facebook', 'line') THEN 'social'
                     WHEN v_source = 'meo' THEN 'organic'
                     ELSE 'direct' END,
                v_device,
                jsonb_build_object('step', j, 'source', v_source)
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Inserted sample funnel data for clinic %', v_clinic_id;
END $$;

-- 広告費のサンプルデータ
DO $$
DECLARE
    v_clinic_id UUID := '11111111-1111-1111-1111-111111111111';
    v_platforms TEXT[] := ARRAY['google_ads', 'meta_ads', 'instagram', 'line_ads', 'yahoo_ads'];
    v_platform TEXT;
    v_spend_date DATE;
    i INTEGER;
BEGIN
    -- 過去60日分の広告費データを生成
    FOR i IN 0..59 LOOP
        v_spend_date := CURRENT_DATE - i;

        FOREACH v_platform IN ARRAY v_platforms LOOP
            -- 各プラットフォームの日次広告費（ランダム）
            INSERT INTO ad_spend_records (
                clinic_id,
                ad_platform,
                campaign_name,
                spend_date,
                amount,
                currency
            ) VALUES (
                v_clinic_id,
                v_platform,
                v_platform || '_campaign_' || to_char(v_spend_date, 'YYYYMM'),
                v_spend_date,
                (1000 + floor(random() * 9000))::decimal, -- 1000〜10000円
                'JPY'
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Inserted sample ad spend data for clinic %', v_clinic_id;
END $$;
