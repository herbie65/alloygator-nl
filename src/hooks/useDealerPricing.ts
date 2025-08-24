'use client'

import { useEffect, useMemo, useState } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'

export interface DealerPricingInfo {
  isDealer: boolean
  group: 'bronze' | 'silver' | 'gold' | 'platinum' | null
  discountPercent: number
}

// Geen hardcoded discounts meer - deze komen uit de database via customer_groups
const GROUP_DISCOUNTS: Record<string, number> = {}

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
      if (dealerSession || dealerGroup) {
        const ds = dealerSession ? JSON.parse(dealerSession) : {}
        const group = normalizeGroup(ds.group || ds.dealerGroup || dealerGroup || '')
        console.log('Dealer sessie gevonden:', { dealerSession, dealerGroup, group })
        // Stel dealer status in, maar wacht op customer_groups voor de juiste korting
        setInfo({ isDealer: true, group, discountPercent: 0 })
        return
      }

      // Try generic current user session
      const currentUserStr = localStorage.getItem('currentUser')
      if (currentUserStr) {
        const u = JSON.parse(currentUserStr)
        const isDealer = !!u.is_dealer
        const group = normalizeGroup(u.dealer_group || u.group || localStorage.getItem('dealerGroup') || '')
        console.log('Current user sessie gevonden:', { isDealer, group, dealer_group: u.dealer_group })
        // Stel dealer status in, maar wacht op customer_groups voor de juiste korting
        setInfo({ isDealer, group, discountPercent: 0 })
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
        const dealers = await FirebaseClientService.getDealersByEmail(email)
        if (Array.isArray(dealers) && dealers.length > 0) {
          const d: any = dealers[0]
          group = normalizeGroup(d.group || d.dealer_group)
          console.log('Dealer gevonden in Firestore:', { email, group, dealer: d })
          // Stel dealer status in, maar wacht op customer_groups voor de juiste korting
          setInfo({ isDealer: true, group, discountPercent: 0 })
          return
        }
        // Fallback to customers by email
        const customers = await FirebaseClientService.getCustomersByEmail(email)
        if (Array.isArray(customers) && customers.length > 0) {
          const c: any = customers[0]
          const isDealer = !!c.is_dealer
          group = normalizeGroup(c.dealer_group)
          console.log('Customer gevonden in Firestore:', { email, isDealer, group, dealer_group: c.dealer_group })
          if (isDealer) {
            // Stel dealer status in, maar wacht op customer_groups voor de juiste korting
            setInfo({ isDealer: true, group, discountPercent: 0 })
          }
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
        console.log('Customer groups geladen:', groups)
        
        const map: Record<'gold'|'silver'|'bronze'|'platinum', number> = { gold: 0, silver: 0, bronze: 0, platinum: 0 }
        ;(groups || []).forEach((g: any) => {
          const key = normalizeGroup(g.name)
          if (key) {
            const pct = Number(g.discount_percentage || g.discountPercent || 0) || 0
            // Choose the highest if multiple entries map to same key
            if (pct > map[key]) map[key] = pct
          }
        })
        
        console.log('Dealer kortingen mapping:', map)
        setGroupPercentByKey(map)
      } catch (error) {
        console.error('Fout bij laden customer groups:', error)
      }
    })()
  }, [])

  // When group mapping loads, always use the correct discount from customer_groups
  useEffect(() => {
    if (info.isDealer && info.group && groupPercentByKey[info.group]) {
      const correctPercent = groupPercentByKey[info.group]
      // Gebruik altijd de korting uit customer_groups, niet uit localStorage
      if (correctPercent !== info.discountPercent) {
        console.log(`Dealer korting bijgewerkt: ${info.discountPercent}% → ${correctPercent}% (uit customer_groups)`)
        setInfo(prev => ({ ...prev, discountPercent: correctPercent }))
      }
    }
    
    // Debug logging
    if (info.isDealer && info.group) {
      console.log('Dealer pricing debug:', {
        isDealer: info.isDealer,
        group: info.group,
        currentDiscount: info.discountPercent,
        availableGroups: groupPercentByKey,
        groupDiscount: groupPercentByKey[info.group]
      })
    }
  }, [groupPercentByKey, info.isDealer, info.group, info.discountPercent])

  return info
}


