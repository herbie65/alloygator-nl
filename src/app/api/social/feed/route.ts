import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

type SocialItem = {
  id: string
  platform: 'facebook' | 'instagram'
  image_url: string
  permalink: string
  caption?: string
  timestamp?: string
}

async function fetchFacebook(pageId: string, accessToken: string): Promise<SocialItem[]> {
  try {
    const fields = [
      'full_picture',
      'permalink_url',
      'message',
      'created_time',
    ].join(',')
    const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(pageId)}/posts?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      let msg = `Facebook error ${res.status}`
      try {
        const ej = await res.json()
        msg = ej?.error?.message ? `Facebook error ${res.status}: ${ej.error.message}` : msg
      } catch {}
      throw new Error(msg)
    }
    const json = await res.json()
    const data = Array.isArray(json.data) ? json.data : []
    return data
      .filter((p: any) => Boolean(p.full_picture))
      .map((p: any) => ({
        id: `fb_${p.id}`,
        platform: 'facebook' as const,
        image_url: p.full_picture,
        permalink: p.permalink_url,
        caption: p.message,
        timestamp: p.created_time,
      }))
  } catch (e) {
    console.error('fetchFacebook failed:', e)
    return []
  }
}

async function fetchInstagram(userId: string, accessToken: string): Promise<SocialItem[]> {
  try {
    const fields = [
      'id',
      'caption',
      'media_url',
      'thumbnail_url',
      'permalink',
      'timestamp',
      'media_type',
    ].join(',')
    const url = `https://graph.instagram.com/${encodeURIComponent(userId)}/media?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      let msg = `Instagram error ${res.status}`
      try {
        const ej = await res.json()
        msg = ej?.error?.message ? `Instagram error ${res.status}: ${ej.error.message}` : msg
      } catch {}
      throw new Error(msg)
    }
    const json = await res.json()
    const data = Array.isArray(json.data) ? json.data : []
    return data
      .filter((m: any) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM')
      .map((m: any) => ({
        id: `ig_${m.id}`,
        platform: 'instagram' as const,
        image_url: m.media_url || m.thumbnail_url,
        permalink: m.permalink,
        caption: m.caption,
        timestamp: m.timestamp,
      }))
  } catch (e) {
    console.error('fetchInstagram failed:', e)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platformFilter = (searchParams.get('platform') || '').toLowerCase() as 'facebook'|'instagram'|''
    const verifyOnly = searchParams.get('verify') === '1'
    // Read from env first
    let fbPageId = process.env.FACEBOOK_PAGE_ID || ''
    let fbToken = process.env.FACEBOOK_GRAPH_TOKEN || ''
    let igUserId = process.env.INSTAGRAM_USER_ID || ''
    let igToken = process.env.INSTAGRAM_ACCESS_TOKEN || ''

    // Fallback to Firestore settings
    if (!fbPageId || !fbToken || !igUserId || !igToken) {
      try {
        const settingsArr: any[] = await FirebaseService.getSettings()
        const s = settingsArr && settingsArr.length > 0 ? settingsArr[0] : {}
        fbPageId = fbPageId || s.facebook_page_id || ''
        fbToken = fbToken || s.facebook_access_token || ''
        igUserId = igUserId || s.instagram_user_id || ''
        igToken = igToken || s.instagram_access_token || ''
      } catch (e) {
        // ignore
      }
    }

    const errors: string[] = []
    let items: SocialItem[] = []
    const debug: any = {}
    if (!fbPageId && !fbToken && !igUserId && !igToken) {
      return NextResponse.json({ items: [], note: 'No social tokens configured' })
    }

    // VERIFY mode returns basic info without collecting posts
    if (verifyOnly) {
      if ((platformFilter === '' || platformFilter === 'facebook') && fbPageId && fbToken) {
        try {
          const vres = await fetch(`https://graph.facebook.com/v18.0/${encodeURIComponent(fbPageId)}?fields=id,name,link,fan_count&access_token=${encodeURIComponent(fbToken)}`, { cache: 'no-store' })
          const vjson = await vres.json()
          if (!vres.ok) throw new Error(vjson?.error?.message || `Facebook verify error ${vres.status}`)
          debug.facebook = vjson
        } catch (e: any) {
          errors.push(`Facebook verify: ${e?.message || 'unknown error'}`)
        }
      }
      if ((platformFilter === '' || platformFilter === 'instagram') && igUserId && igToken) {
        try {
          const vres = await fetch(`https://graph.instagram.com/${encodeURIComponent(igUserId)}?fields=id,username,account_type&access_token=${encodeURIComponent(igToken)}`, { cache: 'no-store' })
          const vjson = await vres.json()
          if (!vres.ok) throw new Error(vjson?.error?.message || `Instagram verify error ${vres.status}`)
          debug.instagram = vjson
        } catch (e: any) {
          errors.push(`Instagram verify: ${e?.message || 'unknown error'}`)
        }
      }
      return NextResponse.json({ items: [], errors, debug })
    }

    if ((platformFilter === '' || platformFilter === 'facebook') && fbPageId && fbToken) {
      try {
        const fb = await fetchFacebook(fbPageId, fbToken)
        items = items.concat(fb)
      } catch (e: any) {
        errors.push(`Facebook: ${e?.message || 'unknown error'}`)
      }
    }

    if ((platformFilter === '' || platformFilter === 'instagram') && igUserId && igToken) {
      try {
        const ig = await fetchInstagram(igUserId, igToken)
        items = items.concat(ig)
      } catch (e: any) {
        errors.push(`Instagram: ${e?.message || 'unknown error'}`)
      }
    }

    items.sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return tb - ta
    })

    return NextResponse.json({ items, errors })
  } catch (error) {
    console.error('Error in social feed:', error)
    return NextResponse.json({ items: [] }, { status: 500 })
  }
}


