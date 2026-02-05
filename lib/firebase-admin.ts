import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let app: App
let adminAuth: Auth

function getFirebaseAdmin() {
  if (!app) {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

    if (serviceAccountKey) {
      // サービスアカウントキーが環境変数にある場合
      const serviceAccount = JSON.parse(serviceAccountKey)
      app = getApps().length === 0
        ? initializeApp({ credential: cert(serviceAccount) })
        : getApps()[0]
    } else {
      // ADC（gcloud auth application-default login）を使用
      app = getApps().length === 0
        ? initializeApp({
            credential: applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          })
        : getApps()[0]
    }

    adminAuth = getAuth(app)
  }

  return { app, adminAuth }
}

export { getFirebaseAdmin }
