import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

export function useFirebaseRealtime<T>(
  collectionName: string,
  documentId?: string
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (documentId) {
          // Fetch single document
          const doc = await FirebaseService.getDocument(collectionName, documentId)
          if (mounted) {
            setData(doc as T)
          }
        } else {
          // Fetch all documents
          const docs = await FirebaseService.getDocuments(collectionName)
          if (mounted) {
            setData(docs as T)
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [collectionName, documentId])

  return [data, loading, error]
}
