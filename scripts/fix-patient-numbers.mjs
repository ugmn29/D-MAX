import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env.local')))
for (const k in envConfig) { process.env[k] = envConfig[k] }

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    // 全患者の診察券番号を確認
    const patients = await prisma.patients.findMany({
      where: { patient_number: { not: null } },
      select: { id: true, patient_number: true, last_name: true, first_name: true, clinic_id: true },
      orderBy: { patient_number: 'asc' }
    })

    console.log(`診察券番号を持つ患者: ${patients.length}件\n`)

    // 異常に大きい番号（1000以上）を検出
    const abnormalPatients = patients.filter(p => p.patient_number > 1000)
    const normalPatients = patients.filter(p => p.patient_number <= 1000)

    console.log(`正常な番号: ${normalPatients.length}件`)
    normalPatients.forEach(p => {
      console.log(`  #${p.patient_number} - ${p.last_name} ${p.first_name}`)
    })

    console.log(`\n異常に大きい番号（タイムスタンプ由来）: ${abnormalPatients.length}件`)
    abnormalPatients.forEach(p => {
      console.log(`  #${p.patient_number} - ${p.last_name} ${p.first_name} (ID: ${p.id})`)
    })

    if (abnormalPatients.length === 0) {
      console.log('\n修正不要')
      return
    }

    // clinic_idごとにグループ化して連番を再割り当て
    const clinicGroups = new Map()
    for (const p of abnormalPatients) {
      if (!clinicGroups.has(p.clinic_id)) {
        clinicGroups.set(p.clinic_id, [])
      }
      clinicGroups.get(p.clinic_id).push(p)
    }

    for (const [clinicId, abnormals] of clinicGroups) {
      // このクリニックの正常な番号を取得
      const existingNumbers = normalPatients
        .filter(p => p.clinic_id === clinicId)
        .map(p => p.patient_number)
        .sort((a, b) => a - b)

      console.log(`\nクリニック ${clinicId}:`)
      console.log(`  既存の正常番号: [${existingNumbers.join(', ')}]`)

      // 次の連番を計算
      let nextNumber = 1
      for (const num of existingNumbers) {
        if (num === nextNumber) nextNumber++
      }

      // 異常な番号を持つ患者に新しい連番を割り当て
      for (const p of abnormals) {
        // 欠番を探す
        while (existingNumbers.includes(nextNumber)) {
          nextNumber++
        }

        console.log(`  ${p.last_name} ${p.first_name}: ${p.patient_number} → ${nextNumber}`)

        await prisma.patients.update({
          where: { id: p.id },
          data: { patient_number: nextNumber }
        })

        existingNumbers.push(nextNumber)
        existingNumbers.sort((a, b) => a - b)
        nextNumber++
      }
    }

    console.log('\n修正完了')
  } catch (error) {
    console.error('エラー:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
main()
