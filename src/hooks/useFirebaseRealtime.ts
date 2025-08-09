import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

export function useFirebaseRealtime<T>(
  collectionName: string,
  orderByField?: string
): [T[], boolean, Error | null] {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    console.log(`useFirebaseRealtime: Starting listener for ${collectionName}`)
    setLoading(true)
    setError(null)

    try {
      console.log(`useFirebaseRealtime: Creating collection reference for ${collectionName}`)
      const collectionRef = collection(db, collectionName)
      console.log(`useFirebaseRealtime: Collection reference created:`, collectionRef)
      
      const q = orderByField 
        ? query(collectionRef, orderBy(orderByField))
        : query(collectionRef)
      
      console.log(`useFirebaseRealtime: Query created:`, q)

      console.log(`useFirebaseRealtime: Setting up onSnapshot listener for ${collectionName}`)

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`useFirebaseRealtime: onSnapshot callback triggered for ${collectionName}`)
          console.log(`useFirebaseRealtime: Snapshot size: ${snapshot.size}`)
          
          const items: T[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            console.log(`useFirebaseRealtime: Document ${doc.id}:`, data)
            items.push({ id: doc.id, ...data } as T)
          })
          
          console.log(`useFirebaseRealtime: Final items for ${collectionName}:`, items.length, 'items', items)
          setData(items)
          setLoading(false)
        },
        (error) => {
          console.error(`useFirebaseRealtime: Error listening to ${collectionName}:`, error)
          setError(error)
          setLoading(false)
        }
      )

      console.log(`useFirebaseRealtime: Listener set up successfully for ${collectionName}`)

      return () => {
        console.log(`useFirebaseRealtime: Cleaning up listener for ${collectionName}`)
        unsubscribe()
      }
    } catch (error) {
      console.error(`useFirebaseRealtime: Error setting up ${collectionName} listener:`, error)
      setError(error as Error)
      setLoading(false)
    }
  }, [collectionName, orderByField])

  return [data, loading, error]
}
