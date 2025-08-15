import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection as fsCollection, doc as fsDoc, onSnapshot, QuerySnapshot, DocumentData } from 'firebase/firestore'

export function useFirebaseRealtime<T>(
  collectionName: string,
  documentId?: string,
  reloadKey?: any
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    // Prefer real-time snapshots; fallback to one-time read if snapshot fails
    try {
      if (documentId) {
        const ref = fsDoc(db as any, collectionName, documentId)
        const unsub = onSnapshot(ref, (snap) => {
          if (!mounted) return
          const val = snap.exists() ? ({ id: snap.id, ...(snap.data() as any) }) : null
          setData(val as T)
          setLoading(false)
        }, (err) => {
          if (!mounted) return
          setError(err)
          setLoading(false)
        })
        return () => { mounted = false; unsub() }
      } else {
        const ref = fsCollection(db as any, collectionName)
        const unsub = onSnapshot(ref, (qs: QuerySnapshot<DocumentData>) => {
          if (!mounted) return
          const rows = qs.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
          setData(rows as unknown as T)
          setLoading(false)
        }, (err) => {
          if (!mounted) return
          setError(err)
          setLoading(false)
        })
        return () => { mounted = false; unsub() }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setLoading(false)
      return () => { mounted = false }
    }
  }, [collectionName, documentId, reloadKey])

  return [data, loading, error]
}
