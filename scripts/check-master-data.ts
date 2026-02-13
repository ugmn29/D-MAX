import { getPrismaClient } from '../lib/prisma-client'

async function checkMasterData() {
  const prisma = getPrismaClient()

  console.log('📊 マスターデータ調査')
  console.log('='.repeat(60))

  try {
    // トレーニング関連
    const trainings = await prisma.trainings.count()
    const trainingMenus = await prisma.training_menus.count()
    console.log(`🏋️ トレーニング: ${trainings}件`)
    console.log(`   メニュー: ${trainingMenus}件`)

    // 問診票関連
    const questionnaires = await prisma.questionnaires.count()
    const questions = await prisma.questionnaire_questions.count()
    console.log(`📋 問診票: ${questionnaires}件`)
    console.log(`   質問: ${questions}件`)

    // 通知テンプレート
    const notificationTemplates = await prisma.notification_templates.count()
    console.log(`📬 通知テンプレート: ${notificationTemplates}件`)

    // メモテンプレート
    const memoTemplates = await prisma.memo_templates.count()
    const memoTodoTemplates = await prisma.memo_todo_templates.count()
    console.log(`📝 メモテンプレート: ${memoTemplates}件`)
    console.log(`   TODOテンプレート: ${memoTodoTemplates}件`)

    // 治療コード
    const treatmentCodes = await prisma.treatment_codes.count()
    const treatmentSets = await prisma.treatment_sets.count()
    console.log(`💊 治療コード: ${treatmentCodes}件`)
    console.log(`   治療セット: ${treatmentSets}件`)

    // 詳細確認: トレーニング
    if (trainings > 0) {
      console.log('\n🏋️ トレーニング詳細:')
      const trainingList = await prisma.trainings.findMany({
        select: { id: true, training_name: true, category: true, is_default: true },
        take: 10
      })
      trainingList.forEach(t => {
        const defaultLabel = t.is_default ? ' [デフォルト]' : ''
        console.log(`   - ${t.training_name} (${t.category})${defaultLabel}`)
      })
      if (trainings > 10) console.log(`   ... 他 ${trainings - 10}件`)
    }

    // 詳細確認: 問診票
    if (questionnaires > 0) {
      console.log('\n📋 問診票詳細:')
      const questionnaireList = await prisma.questionnaires.findMany({
        select: { id: true, name: true, description: true, template_id: true },
        take: 10
      })
      questionnaireList.forEach(q => {
        const isTemplate = q.template_id ? ' [テンプレート]' : ''
        console.log(`   - ${q.name}${isTemplate}`)
      })
      if (questionnaires > 10) console.log(`   ... 他 ${questionnaires - 10}件`)
    }

    // 詳細確認: 通知テンプレート
    if (notificationTemplates > 0) {
      console.log('\n📬 通知テンプレート詳細:')
      const templateList = await prisma.notification_templates.findMany({
        select: { id: true, name: true, notification_type: true, is_system_template: true },
        take: 10
      })
      templateList.forEach(t => {
        const systemLabel = t.is_system_template ? ' [システム]' : ''
        console.log(`   - ${t.name} (${t.notification_type})${systemLabel}`)
      })
    }

    // 詳細確認: メモテンプレート
    if (memoTemplates > 0) {
      console.log('\n📝 メモテンプレート詳細:')
      const templateList = await prisma.memo_templates.findMany({
        select: { id: true, name: true, category: true },
        take: 10
      })
      templateList.forEach(t => {
        console.log(`   - ${t.name} (${t.category})`)
      })
    }

    // 詳細確認: 治療コード
    if (treatmentCodes > 0) {
      console.log('\n💊 治療コード詳細:')
      const codeList = await prisma.treatment_codes.findMany({
        select: { id: true, name: true, code: true },
        take: 10
      })
      codeList.forEach(c => {
        console.log(`   - ${c.code}: ${c.name}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ マスターデータ調査完了')

  } catch (error) {
    console.error('❌ エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMasterData().catch(console.error)
