import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma-client'

/**
 * POST /api/questionnaire-responses/link
 * 問診票回答を患者に連携（患者情報を自動更新）
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    const { responseId, patientId } = body

    if (!responseId || !patientId) {
      return NextResponse.json(
        { error: 'responseId and patientId are required' },
        { status: 400 }
      )
    }

    // トランザクション内で全ての処理を実行
    await prisma.$transaction(async (tx) => {
      // 0. 既存の問診票データを取得
      const existingResponse = await tx.questionnaire_responses.findUnique({
        where: { id: responseId },
        select: { original_patient_data: true, response_data: true, questionnaire_id: true }
      })

      if (!existingResponse) {
        throw new Error('問診票が見つかりません')
      }

      // 1. 連携前の患者データを取得（初回連携時のみ保存）
      let originalPatientData = existingResponse.original_patient_data

      if (!originalPatientData) {
        const currentPatient = await tx.patients.findUnique({
          where: { id: patientId },
          select: {
            last_name: true, first_name: true, last_name_kana: true, first_name_kana: true,
            birth_date: true, gender: true, phone: true, email: true, postal_code: true,
            address: true, allergies: true, medical_history: true, medications: true,
            visit_reason: true, preferred_contact_method: true
          }
        })

        if (!currentPatient) {
          throw new Error('患者が見つかりません')
        }

        originalPatientData = currentPatient
        console.log('初回連携: 連携前の患者データを保存')
      }

      // 2. 問診票のpatient_idを更新
      await tx.questionnaire_responses.update({
        where: { id: responseId },
        data: {
          patient_id: patientId,
          original_patient_data: originalPatientData,
          updated_at: new Date()
        }
      })

      // 3. 問診票の質問定義を取得
      const questionnaireData = await tx.questionnaires.findUnique({
        where: { id: existingResponse.questionnaire_id },
        include: { questionnaire_questions: true }
      })

      if (!questionnaireData) {
        throw new Error('問診票定義が見つかりません')
      }

      // 4. 患者情報を抽出して更新
      const patientUpdate: any = { is_registered: true, updated_at: new Date() }
      const answers = existingResponse.response_data || {}
      let medicationStatus = null, medicationDetails = null
      let homePhone = null, mobilePhone = null

      questionnaireData.questionnaire_questions.forEach((question: any) => {
        let answer = answers[question.id]
        if (!answer) {
          const section = Math.floor(question.sort_order / 10) + 1
          const number = question.sort_order % 10 || 10
          answer = answers[`q${section}-${number}`]
        }

        if (question.linked_field && answer) {
          switch (question.linked_field) {
            case 'name':
              const nameParts = answer.split(' ')
              patientUpdate.last_name = nameParts[0] || ''
              patientUpdate.first_name = nameParts.slice(1).join(' ') || ''
              break
            case 'furigana_kana':
              const kanaParts = answer.split(' ')
              patientUpdate.last_name_kana = kanaParts[0] || ''
              patientUpdate.first_name_kana = kanaParts.slice(1).join(' ') || ''
              break
            case 'last_name': patientUpdate.last_name = answer; break
            case 'first_name': patientUpdate.first_name = answer; break
            case 'last_name_kana': patientUpdate.last_name_kana = answer; break
            case 'first_name_kana': patientUpdate.first_name_kana = answer; break
            case 'birth_date':
              patientUpdate.birth_date = new Date(answer + 'T00:00:00Z')
              break
            case 'gender':
              if (['男性', '男'].includes(answer)) patientUpdate.gender = 'male'
              else if (['女性', '女'].includes(answer)) patientUpdate.gender = 'female'
              else if (['その他', 'other'].includes(answer)) patientUpdate.gender = 'other'
              else patientUpdate.gender = answer
              break
            case 'home_phone': homePhone = answer; break
            case 'phone': mobilePhone = answer; break
            case 'email': patientUpdate.email = answer; break
            case 'postal_code': patientUpdate.postal_code = answer; break
            case 'address': patientUpdate.address = answer; break
            case 'referral_source':
              patientUpdate.visit_reason = Array.isArray(answer) ? answer.join('、') : answer
              break
            case 'preferred_contact_method':
              let method = answer.toLowerCase()
              if (method.includes('line')) method = 'line'
              else if (method.includes('email') || method.includes('メール')) method = 'email'
              else if (method.includes('sms')) method = 'sms'
              if (['line', 'email', 'sms'].includes(method)) {
                patientUpdate.preferred_contact_method = method
              }
              break
            case 'allergies':
              patientUpdate.allergies = answer === 'ない' ? 'なし' : 
                (Array.isArray(answer) ? answer.join(', ') : answer)
              break
            case 'medical_history':
              patientUpdate.medical_history = (answer === 'ない' || answer.includes('なし')) ? 'なし' :
                (Array.isArray(answer) ? answer.join(', ') : answer)
              break
            case 'medications':
              if (question.question_text.includes('服用中のお薬')) {
                medicationStatus = answer
              } else if (question.question_text.includes('薬剤名')) {
                medicationDetails = answer
              } else {
                patientUpdate.medications = (answer === 'ない' || answer.includes('なし')) ? 'なし' :
                  (Array.isArray(answer) ? answer.join(', ') : answer)
              }
              break
          }
        }
      })

      // 服用薬の統合処理
      if (medicationStatus) {
        if (medicationStatus === 'ない' || medicationStatus.includes('なし')) {
          patientUpdate.medications = 'なし'
        } else if (medicationStatus === 'ある' || medicationStatus.includes('ある')) {
          patientUpdate.medications = medicationDetails || 'あり（詳細未記入）'
        }
      } else if (medicationDetails) {
        patientUpdate.medications = medicationDetails
      }

      // 電話番号の統合処理
      if (homePhone && mobilePhone) {
        patientUpdate.phone = `自宅: ${homePhone} / 携帯: ${mobilePhone}`
      } else if (mobilePhone) {
        patientUpdate.phone = mobilePhone
      } else if (homePhone) {
        patientUpdate.phone = homePhone
      }

      // 5. 診察券番号を自動生成
      const currentPatient = await tx.patients.findUnique({
        where: { id: patientId },
        select: { patient_number: true, clinic_id: true }
      })

      if (currentPatient && !currentPatient.patient_number) {
        const existingPatients = await tx.patients.findMany({
          where: { clinic_id: currentPatient.clinic_id, patient_number: { not: null } },
          select: { patient_number: true },
          orderBy: { patient_number: 'asc' }
        })
        const numbers = existingPatients.map(p => p.patient_number as number).sort((a, b) => a - b)
        // 欠番を探して連番を割り当て
        let nextNumber = numbers.length + 1
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== i + 1) {
            nextNumber = i + 1
            break
          }
        }
        patientUpdate.patient_number = nextNumber
        console.log('診察券番号を自動生成:', nextNumber)
      }

      // 6. 患者情報を更新
      await tx.patients.update({
        where: { id: patientId },
        data: patientUpdate
      })

      console.log('問診票連携完了:', patientId)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('問診票連携エラー:', error)
    return NextResponse.json(
      { error: error.message || '問診票の連携に失敗しました' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/questionnaire-responses/link?responseId=xxx&patientId=xxx
 * 問診票回答の患者連携を解除
 */
export async function DELETE(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const { searchParams } = new URL(request.url)
    const responseId = searchParams.get('responseId')
    const patientId = searchParams.get('patientId')

    if (!responseId || !patientId) {
      return NextResponse.json(
        { error: 'responseId and patientId are required' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // 1. 元の患者データを取得
      const response = await tx.questionnaire_responses.findUnique({
        where: { id: responseId },
        select: { original_patient_data: true }
      })

      if (!response) {
        throw new Error('問診票が見つかりません')
      }

      // 2. 患者情報を復元
      if (response.original_patient_data) {
        const originalData = response.original_patient_data as any
        const restoreData: any = { is_registered: false, updated_at: new Date() }

        const fieldsToRestore = [
          'last_name', 'first_name', 'last_name_kana', 'first_name_kana',
          'birth_date', 'gender', 'phone', 'email', 'postal_code', 'address',
          'allergies', 'medical_history', 'medications', 'visit_reason', 'preferred_contact_method'
        ]

        fieldsToRestore.forEach(field => {
          if (field in originalData) {
            if (field === 'birth_date' && originalData[field]) {
              restoreData[field] = new Date(originalData[field])
            } else {
              restoreData[field] = originalData[field]
            }
          }
        })

        await tx.patients.update({ where: { id: patientId }, data: restoreData })
        console.log('患者データの復元完了')
      } else {
        await tx.patients.update({
          where: { id: patientId },
          data: { is_registered: false, updated_at: new Date() }
        })
      }

      // 3. 問診票の連携を解除
      await tx.questionnaire_responses.update({
        where: { id: responseId },
        data: { patient_id: null, original_patient_data: null, updated_at: new Date() }
      })
    })

    console.log('問診票連携解除完了:', responseId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('問診票連携解除エラー:', error)
    return NextResponse.json(
      { error: error.message || '問診票連携の解除に失敗しました' },
      { status: 500 }
    )
  }
}
