-- トレーニングアニメーション用ストレージバケット作成
-- 作成日: 2025-10-02

-- =====================================
-- 1. Storageバケット作成
-- =====================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'training-animations',
    'training-animations',
    true, -- 公開バケット（患者側がアクセス可能）
    5242880, -- 5MB制限
    ARRAY['application/json']::text[] -- Lottie JSONファイルのみ
)
ON CONFLICT (id) DO NOTHING;

-- =====================================
-- 2. Storageポリシー設定
-- =====================================

-- デフォルトアニメーション：全員が閲覧可能
CREATE POLICY "Default animations are viewable by everyone"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'training-animations' AND
    (storage.foldername(name))[1] = 'default'
);

-- カスタムアニメーション：該当医院のみ閲覧可能
CREATE POLICY "Clinic can view their custom animations"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'training-animations' AND
    (storage.foldername(name))[1] = 'custom' AND
    (storage.foldername(name))[2] = (auth.jwt() ->> 'clinic_id')
);

-- カスタムアニメーション：該当医院のみアップロード可能
CREATE POLICY "Clinic can upload their custom animations"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'training-animations' AND
    (storage.foldername(name))[1] = 'custom' AND
    (storage.foldername(name))[2] = (auth.jwt() ->> 'clinic_id')
);

-- カスタムアニメーション：該当医院のみ更新可能
CREATE POLICY "Clinic can update their custom animations"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'training-animations' AND
    (storage.foldername(name))[1] = 'custom' AND
    (storage.foldername(name))[2] = (auth.jwt() ->> 'clinic_id')
);

-- カスタムアニメーション：該当医院のみ削除可能
CREATE POLICY "Clinic can delete their custom animations"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'training-animations' AND
    (storage.foldername(name))[1] = 'custom' AND
    (storage.foldername(name))[2] = (auth.jwt() ->> 'clinic_id')
);

-- =====================================
-- 完了
-- =====================================

DO $$
BEGIN
    RAISE NOTICE 'Training animations storage bucket created successfully';
    RAISE NOTICE 'Bucket: training-animations';
    RAISE NOTICE 'Public: true';
    RAISE NOTICE 'Max file size: 5MB';
    RAISE NOTICE 'Allowed types: application/json';
END $$;
