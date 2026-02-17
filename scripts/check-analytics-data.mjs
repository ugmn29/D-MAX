import { PrismaClient } from '../generated/prisma/client/index.js'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function checkData() {
  try {
    const clinicId = '11111111-1111-1111-1111-111111111111'

    console.log('=== データ件数確認 ===')
    console.log('clinic_id:', clinicId)

    const appointmentsCount = await prisma.appointments.count({
      where: { clinic_id: clinicId }
    })
    console.log('予約数:', appointmentsCount)

    const patientsCount = await prisma.patients.count({
      where: { clinic_id: clinicId }
    })
    console.log('患者数:', patientsCount)

    const staffCount = await prisma.staff.count({
      where: { clinic_id: clinicId, is_active: true }
    })
    console.log('スタッフ数:', staffCount)

    // 実際にどのclinic_idのデータがあるか確認
    console.log('\n=== DB内のクリニック ===')
    const clinics = await prisma.clinics.findMany({
      select: { id: true, name: true }
    })
    clinics.forEach(c => console.log(`  ${c.name} (${c.id})`))

    // 期間内の予約を確認
    console.log('\n=== 2026-01-31 ~ 2026-02-16 の予約 ===')
    const recentAppointments = await prisma.appointments.findMany({
      where: {
        clinic_id: clinicId,
        appointment_date: {
          gte: new Date('2026-01-31'),
          lte: new Date('2026-02-16')
        }
      },
      take: 5,
      select: {
        id: true,
        appointment_date: true,
        appointment_time: true,
        status: true
      }
    })
    console.log(`件数: ${recentAppointments.length}`)
    recentAppointments.forEach(apt => {
      console.log(`  ${apt.appointment_date} ${apt.appointment_time} - ${apt.status}`)
    })

  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
