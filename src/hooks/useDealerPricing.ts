'use client'

import { useEffect, useMemo, useState } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

export interface DealerPricingInfo {
  isDealer: boolean
  group: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  discountPercent: number
}

const GROUP_DISCOUNTS: Record<string, number> = {
  bronze: 5,
  silver: 10,
  gold: 15,
  platinum: 20,
}

export function applyDealerDiscount(basePrice: number, discountPercent: number): number {
  if (!discountPercent || discountPercent <= 0) return Number(basePrice || 0)
  const discounted = Number(basePrice || 0) * (1 - discountPercent / 100)
  return Math.max(0, Number(discounted.toFixed(2)))
}

export function getDealerGroupLabel(group: DealerPricingInfo['group']): string {
  switch (group) {
    case 'gold': return 'Goud'
    case 'silver': return 'Zilver'
    case 'bronze': return 'Brons'
    case 'platinum': return 'Platina'
    default: return ''
  }
}

export function useDealerPricing(): DealerPricingInfo {
  const [info, setInfo] = useState<DealerPricingInfo>({ isDealer: false, group: null, discountPercent: 0 })
  const [groupPercentByKey, setGroupPercentByKey] = useState<Record<'gold'|'silver'|'bronze'|'platinum', number>>({ gold: 0, silver: 0, bronze: 0, platinum: 0 })

  const normalizeGroup = (raw: string | null | undefined): DealerPricingInfo['group'] => {
    const s = String(raw || '').toLowerCase().trim()
    if (!s) return null
    // Remove trailing descriptors like "dealers", extra spaces
    const cleaned = s.replace(/dealers?|groep|group/gi, '').trim()
    if (cleaned.includes('goud') || cleaned.includes('gold')) return 'gold'
    if (cleaned.includes('zilver') || cleaned.includes('silver')) return 'silver'
    if (cleaned.includes('brons') || cleaned.includes('bronze')) return 'bronze'
    if (cleaned.includes('platina') || cleaned.includes('platinum')) return 'platinum'
    return null
  }

  useEffect(() => {
    try {
      // Try dealer login session
      const dealerSession = localStorage.getItem('dealerSession')
      const dealerGroup = localStorage.getItem('dealerGroup')
      const dealerDiscount = localStorage.getItem('dealerDiscount')
      if (dealerSession || dealerGroup || dealerDiscount) {
        const ds = dealerSession ? JSON.parse(dealerSession) : {}
        const group = normalizeGroup(ds.group || ds.dealerGroup || dealerGroup || '')
        const percentFromSession = Number(ds.discount || ds.dealerDiscount || dealerDiscount || 0) || 0
        // Set preliminary percent; will be corrected by customer_groups mapping once loaded
        setInfo({ isDealer: true, group, discountPercent: percentFromSession })
        return
      }

      // Try generic current user session
      const currentUserStr = localStorage.getItem('currentUser')
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr)
        const isDealer = !!u.is_dealer
        const group = normalizeGroup(u.dealer_group || u.group || localStorage.getItem('dealerGroup') || '')
        const percent = Number(localStorage.getItem('dealerDiscount') || 0) || 0
        setInfo({ isDealer, group, discountPercent: isDealer ? percent : 0 })
        return
      }
    } catch {}
    setInfo({ isDealer: false, group: null, discountPercent: 0 })
  }, [])

  // Fallback: resolve dealer info from Firestore by email if not already determined
  useEffect(() => {
    if (info.discountPercent > 0 || info.isDealer) return
    (async () => {
      try {
        const email = localStorage.getItem('dealerEmail') || JSON.parse(localStorage.getItem('currentUser') || 'null')?.email
        if (!email) return
        // Try dealers collection first
        let group: DealerPricingInfo['group'] | null = null
        let percent = 0
        const dealers = await FirebaseClientService.getDealersByEmail(email)
        if (Array.isArray(dealers) && dealers.length > 0) {
          const d: any = dealers[0]
          group = normalizeGroup(d.group || d.dealer_group)
          percent = Number(d.discount || d.dealer_discount || 0) || 0
          setInfo({ isDealer: true, group, discountPercent: percent })
          return
        }
        // Fallback to customers by email
        const customers = await FirebaseClientService.getCustomersByEmail(email)
        if (Array.isArray(customers) && customers.length > 0) {
          const c: any = customers[0]
          const isDealer = !!c.is_dealer
          group = normalizeGroup(c.dealer_group)
          percent = Number(c.dealer_discount || 0) || 0
          if (isDealer) setInfo({ isDealer: true, group, discountPercent: percent })
          else {
            // Clear stale dealer flags if user is no longer a dealer
            try {
              localStorage.removeItem('dealerGroup')
              localStorage.removeItem('dealerDiscount')
              localStorage.removeItem('dealerSession')
              localStorage.removeItem('dealerName')
            } catch {}
            setInfo({ isDealer: false, group: null, discountPercent: 0 })
          }
        }
      } catch {}
    })()
  }, [info.isDealer, info.discountPercent])

  // Load discount percentages from customer_groups collection and map to canonical keys
  useEffect(() => {
    (async () => {
      try {
        const groups = await FirebaseClientService.getCustomerGroups()
        const map: Record<'gold'|'silver'|'bronze'|'platinum', number> = { gold: 0, silver: 0, bronze: 0, platinum: 0 }
        ;(groups || []).forEach((g: any) => {
          const key = normalizeGroup(g.name)
          if (key) {
            const pct = Number(g.discount_percentage || g.discountPercent || 0) || 0
            // Choose the highest if multiple entries map to same key
            if (pct > map[key]) map[key] = pct
          }
        })
        setGroupPercentByKey(map)
      } catch {}
    })()
  }, [])

  // When group mapping loads and we already know dealer group but percent is zero, update percent
  useEffect(() => {
    if (info.isDealer && info.group) {
      const pct = groupPercentByKey[info.group] || info.discountPercent || 0
      if (pct !== info.discountPercent) {
        setInfo(prev => ({ ...prev, discountPercent: pct }))
      }
    }
  }, [groupPercentByKey, info.isDealer, info.group, info.discountPercent])

  return info
}


