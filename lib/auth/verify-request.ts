import { NextRequest } from 'next/server'
import { getFirebaseAdmin } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma-client'

interface VerifiedUser {
  uid: string
  email: string
  clinicId: string
  role: 'admin' | 'staff'
  staffId: string
}

export async function verifyAuth(request: NextRequest): Promise<VerifiedUser> {
  const sessionCookie = request.cookies.get('__session')?.value
  const authHeader = request.headers.get('Authorization')
  const token = sessionCookie || authHeader?.replace('Bearer ', '')

  if (!token) {
    throw new Error('認証トークンがありません')
  }

  const { adminAuth } = getFirebaseAdmin()
  const decoded = await adminAuth.verifyIdToken(token)

  const clinicId = decoded.clinic_id as string

  // 停止中クリニックはアクセス拒否
  if (clinicId) {
    const clinic = await prisma.clinics.findUnique({
      where: { id: clinicId },
      select: { status: true },
    }).catch(() => null)
    if (clinic?.status === 'suspended') {
      throw new Error('このクリニックのアカウントは停止されています')
    }
  }

  return {
    uid: decoded.uid,
    email: decoded.email || '',
    clinicId,
    role: (decoded.role as 'admin' | 'staff') || 'staff',
    staffId: decoded.staff_id as string,
  }
}

export async function verifyAdmin(request: NextRequest): Promise<VerifiedUser> {
  const user = await verifyAuth(request)
  if (user.role !== 'admin') {
    throw new Error('管理者権限が必要です')
  }
  return user
}
