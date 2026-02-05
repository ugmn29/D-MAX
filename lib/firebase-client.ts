import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null

export function getFirebaseAuth(): Auth | null {
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null
  if (!_auth) {
    if (!_app) {
      _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    }
    _auth = getAuth(_app)
  }
  return _auth
}

// 後方互換性（SSR/ビルド時はnull、クライアント側は遅延初期化）
export const firebaseAuth = typeof window !== 'undefined' ? getFirebaseAuth() : null
