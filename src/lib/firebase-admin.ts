import * as admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN__: admin.app.App | undefined
}

function initializeAdminApp(): admin.app.App {
  if (global.__FIREBASE_ADMIN__) return global.__FIREBASE_ADMIN__

  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'alloygator-nl.appspot.com'

  // Try Application Default Credentials first
  try {
    const app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket,
    })
    global.__FIREBASE_ADMIN__ = app
    return app
  } catch (_) {
    // Fallback to local serviceAccount file if available
  }

  // Look for serviceAccountKey.json at project root
  const rootPath = process.cwd()
  const keyPath = path.join(rootPath, 'serviceAccountKey.json')
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      'Firebase Admin initialization failed. Provide Application Default Credentials (gcloud auth application-default login) or place serviceAccountKey.json in the project root.'
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(keyPath)
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket,
  })
  global.__FIREBASE_ADMIN__ = app
  return app
}

export const adminApp = initializeAdminApp()
export const adminStorage = admin.storage()
export const adminFirestore = admin.firestore()



