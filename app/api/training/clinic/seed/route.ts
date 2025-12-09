import { NextResponse } from 'next/server'
import { supabase } from '@/lib/utils/supabase-client'

export async function POST() {
  try {
    // 既存のデフォルトトレーニングを削除
    await supabase.from('trainings').delete().eq('is_default', true)

    // 資料に基づいたトレーニングデータ
    const trainings = [
      // 舌系の訓練
      {
        training_name: '「あ」の口の確認',
        description: '正しい姿勢で口を開ける練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '正しい姿勢で力を抜いて口を閉じます',
          '「あ」と声に出しながら口を開けます',
          '口の開ける大きさは、人差し指と中指の2本分が目安です',
          'これを10秒間、1日に10回行います'
        ],
        precautions: [
          '下顎をあげないようにします',
          '口を大きく開けすぎないようにします',
          '顔の真ん中のライン（正中）を揃えます'
        ]
      },
      {
        training_name: '舌を前に出す',
        description: 'スティックを使った舌の前方突出練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '姿勢を正しくします',
          'スティックを顔の前に持ち、舌をスティックに対して90度になるように真っ直ぐ前に出します（3〜5秒間）',
          'スティックを押し倒すように舌を前へ出します',
          'これを10回繰り返します'
        ],
        precautions: [
          '舌の先端（舌尖）がつぶれないようにします',
          '力がついてきたら、逆にスティックで舌を押す練習もします',
          '舌を伸ばした時に、傾かずに真っ直ぐ伸ばすようにします'
        ]
      },
      {
        training_name: '舌を左右に振る',
        description: '舌を前に出して左右に振る練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '舌を思いきり前に出します',
          '出した舌を左右に振ります',
          'これを10回繰り返します'
        ],
        precautions: [
          '顔、目、顎は動かさないようにします',
          '力を入れすぎないようにします（唇をなぞるように）',
          '舌の先を丸めないようにします（舌先を伸ばし、唇をなぞるように）',
          '舌を左右に動かす時に口が小さくならないように、「あ」の口を意識します',
          '舌の出しすぎに注意します'
        ]
      },
      {
        training_name: '口唇をなぞる',
        description: '舌で上唇をなぞる練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '舌を尖らせて口の端（口角）に置きます',
          '反対側の口角まで、ゆっくり上唇をなぞります',
          '一定の速さで、なめらかに動かします',
          'これを10回繰り返します'
        ],
        precautions: [
          '難しい場合は、上の前歯の外側をなぞっても構いません',
          '下のあごが一緒に動かないようにします',
          '上唇に力を入れないようにします',
          '舌を小刻みに動かさないようにします'
        ]
      },
      {
        training_name: 'スポットの位置確認',
        description: '舌の正しい位置を確認する練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '姿勢を正し、「あ」の形で口を開けます',
          'スティックをスポット（上顎の少し手前にあるくぼみ）に当てて5秒間押します',
          'スティックを外し、舌の先をスポットに5秒間当てます',
          '舌をスポットにつけたまま、奥歯を噛みます',
          'そのまま唇も閉じます'
        ],
        precautions: [
          '舌の先端を当てないようにします',
          '舌の先を丸めないようにします'
        ]
      },
      {
        training_name: '吸い上げ',
        description: '舌全体を上あごに吸い上げる練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 5,
        instructions: [
          '口を開け、舌の先をスポットに付けます',
          'その位置から舌全体を上あごに吸い上げます',
          'その状態から舌をはじいて「ポン」と音を出します',
          '（可能であれば、吸い上げたまま唾液を飲み込みます）',
          'これを5回繰り返します'
        ],
        precautions: [
          '下の顎が前に出たり、左右にぶれたりしないようにします',
          '舌の裏のひも（舌小帯）をしっかり伸ばします',
          '舌の先はスポットに付けます',
          '舌の先は丸めないようにします',
          '口は縦に開けます'
        ]
      },
      {
        training_name: '吸い上げができない場合',
        description: '吸い上げの準備練習',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          '舌の先をスポットにつけます',
          'その状態を維持しながら、舌を後ろに持っていきます',
          '1日10回行います'
        ],
        precautions: [
          '下の顎が動かないようにします',
          '舌だけを動かすように意識します'
        ]
      },
      {
        training_name: '舌筋の訓練',
        description: '器具を使った舌の筋力強化',
        category: '舌系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '舌の先端から少し後ろの部分に、器具の丸まっているところが当たるようにします',
          '舌で器具を上に押し付けます',
          '10回を3セット行います'
        ],
        precautions: [
          '無理に力を入れすぎないでください',
          '正しい位置に器具を当ててください'
        ]
      },

      // 口唇系の訓練
      {
        training_name: '上唇小帯と下唇小帯を伸ばす',
        description: '唇の裏のすじを伸ばす練習',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 5,
        default_rest_seconds: 3,
        default_sets: 5,
        instructions: [
          '小帯（唇の裏にあるすじ）を挟むように親指を深く入れます',
          '付着部を持ち上げるようにします',
          '5秒間を5回行います'
        ],
        precautions: [
          '痛み��感じたらすぐに中止してください',
          '無理に引っ張らないでください'
        ]
      },
      {
        training_name: '口唇の緊張除去',
        description: '唇の内側に空気を入れて緊張をほぐす',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 5,
        default_rest_seconds: 3,
        default_sets: 5,
        instructions: [
          '上下の唇の内側に空気を入れます',
          '5秒間を5回行います'
        ],
        precautions: [
          'ゆっくりと行ってください'
        ]
      },
      {
        training_name: '息吹きかけ',
        description: '風船やシャボン玉を吹く練習',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 30,
        default_rest_seconds: 10,
        default_sets: 5,
        instructions: [
          '風船やシャボン玉、ティッシュなどを吹きます',
          '楽しみながら行いましょう'
        ],
        precautions: [
          '無理に強く吹かないでください',
          '息苦しくなったら休憩してください'
        ]
      },
      {
        training_name: '口輪筋訓練',
        description: '器具を使った唇の筋力強化',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 10,
        instructions: [
          'リラックスして座り、奥歯を噛み合わせて器具を唇に沿わせます',
          '唇を閉じて「1、2、3」と数えながら、ホルダーが口から出ないように引っ張ります',
          '前方・左右の各方向で10回を1セットとします',
          '※保護者の方が引っ張るのも効果的です'
        ],
        precautions: [
          '無理に引っ張りすぎないでください',
          '痛みを感じたら中止してください'
        ]
      },
      {
        training_name: 'あいうべ体操',
        description: '口を大きく動かす体操',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 30,
        default_rest_seconds: 10,
        default_sets: 30,
        instructions: [
          '正しい姿勢で力を抜きます',
          '「あー、いー、うー、べー」と口を大きく動かします',
          '1日30セット行います'
        ],
        precautions: [
          '無理に大きく動かさないでください',
          'ゆっくりと行ってください'
        ]
      },
      {
        training_name: 'タラ体操',
        description: '舌と口蓋の位置関係を確認する体操',
        category: '口唇系の訓練',
        is_default: true,
        default_action_seconds: 30,
        default_rest_seconds: 10,
        default_sets: 10,
        instructions: [
          '「タ」：口蓋（口の天井）に舌先をつけます',
          '「ラ」：巻き舌にして口蓋に押し当てます',
          '「タ・タ・タ・タ…」「ラ・ラ・ラ・ラ…」と繰り返します'
        ],
        precautions: [
          'リズミカルに行ってください',
          '疲れたら休憩してください'
        ]
      },

      // 咬合力系の訓練
      {
        training_name: 'ガムトレーニング',
        description: 'ガムを使った咀嚼と飲み込みの練習',
        category: '咬合力系の訓練',
        is_default: true,
        default_action_seconds: 60,
        default_rest_seconds: 10,
        default_sets: 10,
        instructions: [
          'ガムを前後・左右の歯で1分間噛みます',
          '舌の上に丸めたガムを載せます',
          '上の顎にガムを押し付けて広げます',
          'その状態で唾を飲み込みます',
          '飲み込みを3回繰り返します'
        ],
        precautions: [
          '無糖ガムを使用してください',
          'ゆっくりと噛んでください',
          '片側だけで噛まないように注意'
        ]
      },
      {
        training_name: 'パナリング',
        description: 'リズムに合わせて噛む練習',
        category: '咬合力系の訓練',
        is_default: true,
        default_action_seconds: 180,
        default_rest_seconds: 30,
        default_sets: 3,
        instructions: [
          '「ギュ、ギュ、ギュ、ギュー、バッ」とリズムに合わせて噛みます',
          '噛んだ後にゆるめることで血流がよくなります',
          'テレビを見ながらなど、1日3分〜10分程行います',
          '指で筋肉の動きを確認しながら行うと効果的です',
          '奥歯で噛む際は、舌の先をリングの上にのせて上アゴに押しつけると効果的です'
        ],
        precautions: [
          '無理に強く噛まないでください',
          '顎に痛みを感じたら中止してください'
        ]
      },

      // 歯列改善系の訓練
      {
        training_name: 'パナスティック',
        description: '器具を使った下顎の位置調整',
        category: '歯列改善系の訓練',
        is_default: true,
        default_action_seconds: 60,
        default_rest_seconds: 10,
        default_sets: 5,
        instructions: [
          '歯の絵がある表側を上、T字の引っかけ部分を下にして持ちます',
          'T字の部分を下あごの前歯の先端にひっかけ、てこの支点とします',
          'リングに指をかけ、なるべく弱い力で後方下向きに押します',
          '※なるべく長時間行うと効果的です'
        ],
        precautions: [
          '強い力で押さないでください',
          '痛みを感じたら中止してください'
        ]
      },
      {
        training_name: '下顎を前に出すトレーニング',
        description: '下顎を前方に移動させる練習',
        category: '歯列改善系の訓練',
        is_default: true,
        default_action_seconds: 15,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '「イー」の口をします',
          '下顎を前に滑らせ、前歯の先端同士で噛む位置に移動させます',
          '5秒かけて、ゆっくり口を開けます（指2本分）',
          '同じく5秒かけて、ゆっくり口を閉じます',
          'これを3セット行います'
        ],
        precautions: [
          'ゆっくりと行ってください',
          '無理に前に出さないでください'
        ]
      },

      // 既存のトレーニング（資料にないもの）
      {
        training_name: '舌を上に上げる',
        description: '舌を上顎に押し付ける練習',
        category: '舌の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を開けます',
          '舌の先を上の前歯の付け根に当てます',
          'そのまま舌全体を上顎に押し付けます',
          '5秒間キープします'
        ],
        precautions: [
          '呼吸は鼻で行ってください',
          '力を入れすぎないでください'
        ]
      },
      {
        training_name: '頬を膨らませる',
        description: '両頬に空気を溜めて膨らませる練習',
        category: '頬の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を閉じます',
          '空気を口の中に溜めます',
          '���頬を風船のように膨らませます',
          '5秒間キープします'
        ],
        precautions: [
          '鼻から息が漏れないように注意',
          '無理に膨らませすぎないでください'
        ]
      },
      {
        training_name: '頬をへこませる',
        description: '頬を内側に吸い込む練習',
        category: '頬の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を閉じます',
          '口の中の空気を吸い込みます',
          '両頬を内側に引き込みます',
          '5秒間キープします'
        ],
        precautions: [
          '無理に吸い込みすぎないでください',
          'ゆっくりと行ってください'
        ]
      },
      {
        training_name: '片方の頬を膨らませる',
        description: '左右交互に頬を膨らませる練習',
        category: '頬の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を閉じます',
          '右頬だけを膨らませます',
          '次に左頬だけを膨らませます',
          '交互に繰り返します'
        ],
        precautions: [
          'バランスよく左右を動かしてください',
          '無理に膨らませすぎないでください'
        ]
      },
      {
        training_name: '唇を突き出す',
        description: '唇を前方に突き出す練習',
        category: '唇の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '唇を閉じます',
          'タコの口のように唇を前に突き出します',
          'できるだけ遠くに伸ばします',
          '5秒間キープします'
        ],
        precautions: [
          '唇に力を入れすぎないでください',
          'ゆっくりと行ってください'
        ]
      },
      {
        training_name: '唇を横に引く',
        description: '唇を横に広げる練習',
        category: '唇の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を閉じます',
          '「い」の発音のように唇を横に引きます',
          '口角を上げるように意識します',
          '5秒間キープします'
        ],
        precautions: [
          '自然な笑顔を意識してください',
          '力を入れすぎないでください'
        ]
      },
      {
        training_name: 'パ・タ・カの発音',
        description: 'パ・タ・カを繰り返し発音する練習',
        category: '発音',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '「パ」を5回はっきり言います',
          '「タ」を5回はっきり言います',
          '「カ」を5回はっきり言います',
          '「パタカ」と連続で言います'
        ],
        precautions: [
          'はっきりと発音してください',
          '急がずにゆっくりと'
        ]
      },
      {
        training_name: '口を大きく開閉',
        description: '口の開閉を繰り返す練習',
        category: '口の開閉',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を大きく開けます',
          'ゆっくりと口を閉じます',
          'これを繰り返します',
          'リズミカルに行います'
        ],
        precautions: [
          '顎に痛みを感じたら中止',
          '無理に開けすぎないでください'
        ]
      },
      {
        training_name: 'ストロー吸い',
        description: 'ストローで水を吸う練習',
        category: '吸引',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          'ストローを口にくわえます',
          '唇でストローをしっかり挟みます',
          '水をゆっくり吸い上げます',
          '飲み込みます'
        ],
        precautions: [
          'こぼさないように注意',
          'ゆっくりと吸ってください'
        ]
      },
      {
        training_name: 'ブクブクうがい',
        description: '口の中で水をブクブクさせる練習',
        category: 'うがい',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '少量の水を口に含みます',
          '口を閉じたまま水を動かします',
          '左右の頬を使ってブクブクします',
          '吐き出します'
        ],
        precautions: [
          '水を飲み込まないように注意',
          '無理に強く動かさないでください'
        ]
      },
      {
        training_name: 'ガラガラうがい',
        description: '喉でうがいをする練習',
        category: 'うがい',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '少量の水を口に含みます',
          '上を向きます',
          '喉の奥で「ガラガラ」と音を立てます',
          '5秒続けて吐き出します'
        ],
        precautions: [
          '水を飲み込まないように注意',
          'むせないように気をつけてください',
          '最初は少量の水から始めてください'
        ]
      }
    ]

    const { data, error } = await supabase
      .from('trainings')
      .insert(trainings)
      .select()

    if (error) {
      console.error('データ投入エラー:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      message: `${data.length}件のトレーニングを登録しました`
    })
  } catch (error: any) {
    console.error('エラー:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
