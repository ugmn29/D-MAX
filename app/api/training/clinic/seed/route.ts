import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // 既存のデフォルトトレーニングを削除
    await supabase.from('trainings').delete().eq('is_default', true)

    // 16個のトレーニングを投入
    const trainings = [
      {
        training_name: '「あ」の口の確認',
        description: '大きく口を開けて「あ」の形を作る練習',
        category: '口の開閉',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '鏡を見ながら練習します',
          '口を大きく縦に開けます',
          '「あ」と発音するように口の形を作ります',
          '上下の歯が見えるように開けます'
        ],
        precautions: [
          '無理に大きく開けすぎないでください',
          '顎に痛みを感じたら中止してください',
          'ゆっくりと行ってください'
        ]
      },
      {
        training_name: '舌を前に出す',
        description: '舌を前方に突き出す練習',
        category: '舌の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を軽く開けます',
          '舌を前に真っ直ぐ突き出します',
          'できるだけ遠くまで伸ばします',
          '5秒間キープします'
        ],
        precautions: [
          '無理に伸ばしすぎないでください',
          '舌の付け根に痛みを感じたら中止してください'
        ]
      },
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
        training_name: '舌を左右に動かす',
        description: '舌を左右に移動させる練習',
        category: '舌の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '口を軽く開けます',
          '舌を右の口角に向けて伸ばします',
          '次に左の口角に向けて伸ばします',
          'リズミカルに繰り返します'
        ],
        precautions: [
          'ゆっくりと動かしてください',
          '無理な動きは避けてください'
        ]
      },
      {
        training_name: '舌で唇をなめる',
        description: '舌で上下の唇をなぞる練習',
        category: '舌の運動',
        is_default: true,
        default_action_seconds: 10,
        default_rest_seconds: 5,
        default_sets: 3,
        instructions: [
          '舌を出します',
          '上唇を右から左へゆっくりなめます',
          '下唇も同様に右から左へなめます',
          '円を描くようになめることもできます'
        ],
        precautions: [
          'ゆっくりと行ってください',
          '唇を舐めすぎると乾燥するので注意'
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
          '両頬を風船のように膨らませます',
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
        description: '��の開閉を繰り返す練習',
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
        training_name: 'ガム噛み',
        description: 'ガムを使った咀嚼練習',
        category: '咀嚼',
        is_default: true,
        default_action_seconds: 30,
        default_rest_seconds: 10,
        default_sets: 2,
        instructions: [
          'ガムを口に入れます',
          '右側の奥歯で10回噛みます',
          '左側の奥歯で10回噛みます',
          '両側バランスよく噛みます'
        ],
        precautions: [
          '無糖ガムを使用してください',
          'ゆっくりと噛んでください',
          '片側だけで噛まないように注意'
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
