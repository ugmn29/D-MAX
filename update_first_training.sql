-- 「あ」の口の確認トレーニングに全内容を追加
UPDATE trainings
SET
    instructions = ARRAY[
        '鏡を見ながら練習します',
        '口を大きく縦に開けます',
        '「あ」と発音するように口の形を作ります',
        '上下の歯が見えるように開けます'
    ],
    precautions = ARRAY[
        '無理に大きく開けすぎないでください',
        '顎に痛みを感じたら中止してください',
        'ゆっくりと行ってください'
    ]
WHERE training_name = '「あ」の口の確認';

-- 確認
SELECT training_name, instructions, precautions FROM trainings WHERE training_name = '「あ」の口の確認';
