import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

type SocialItem = {
  id: string
  platform: 'instagram' | 'facebook'
  mediaUrl: string
  permalink: string
  caption?: string
  timestamp?: string
}

async function fetchInstagram(igUserId: string, accessToken: string, limit = 24): Promise<SocialItem[]> {
  const url = `https://graph.facebook.com/v17.0/${igUserId}/media?fields=id,caption,media_url,permalink,timestamp,media_type,thumbnail_url&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    const txt = await res.text().catch(()=>'')
    throw new Error(`Instagram API error: ${res.status} ${res.statusText} ${txt}`)
  }
  const data: any = await res.json()
  const list: SocialItem[] = (data?.data || []).map((m: any) => ({
    id: `ig_${m.id}`,
    platform: 'instagram',
    mediaUrl: (m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url),
    permalink: m.permalink,
    caption: m.caption,
    timestamp: m.timestamp,
  }))
  return list
}

async function fetchFacebook(pageId: string, accessToken: string, limit = 24): Promise<SocialItem[]> {
  const url = `https://graph.facebook.com/v17.0/${pageId}/posts?fields=full_picture,permalink_url,message,created_time&limit=${limit}&access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) {
    const txt = await res.text().catch(()=>'')
    throw new Error(`Facebook API error: ${res.status} ${res.statusText} ${txt}`)
  }
  const data: any = await res.json()
  const list: SocialItem[] = (data?.data || [])
    .filter((p: any) => p.full_picture && p.permalink_url)
    .map((p: any) => ({
      id: `fb_${p.id}`,
      platform: 'facebook',
      mediaUrl: p.full_picture,
      permalink: p.permalink_url,
      caption: p.message,
      timestamp: p.created_time,
    }))
  return list
}

async function readSettings() {
  const arr = await FirebaseService.getSettings()
  const cfg = Array.isArray(arr) && arr.length > 0 ? arr[0] as any : null
  return cfg
}

async function writeSettings(id: string, update: any) {
  return FirebaseService.updateSettings(id, update)
}

async function refreshFromGraph(): Promise<SocialItem[]> {
  const cfg = await readSettings()
  const igUserId = (process.env.IG_USER_ID || cfg?.instagramUserId || cfg?.instagram_user_id || '').trim()
  const igToken = (process.env.IG_ACCESS_TOKEN || cfg?.instagramAccessToken || cfg?.instagram_access_token || '').trim()
  const fbPageId = (process.env.FB_PAGE_ID || cfg?.facebookPageId || cfg?.facebook_page_id || '').trim()
  const fbToken = (process.env.FB_ACCESS_TOKEN || cfg?.facebookAccessToken || cfg?.facebook_access_token || '').trim()

  let items: SocialItem[] = []
  const tasks: Promise<SocialItem[]>[] = []
  if (igUserId && igToken) tasks.push(fetchInstagram(igUserId, igToken, 24))
  if (fbPageId && fbToken) tasks.push(fetchFacebook(fbPageId, fbToken, 24))

  if (tasks.length > 0) {
    const results = await Promise.allSettled(tasks)
    results.forEach(r => {
      if (r.status === 'fulfilled') items = items.concat(r.value)
    })
  }

  // Sort by timestamp desc and cap to 36
  items.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
  items = items.slice(0, 36)

  // Persist in settings for cache
  if (cfg && cfg.id) {
    await writeSettings(cfg.id, { social_media_cache: items, social_last_refreshed_at: new Date().toISOString() })
  } else {
    // If no settings doc yet, create one
    await FirebaseService.addDocument('settings', { social_media_cache: items, social_last_refreshed_at: new Date().toISOString() })
  }

  return items
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wantsRefresh = searchParams.get('refresh') === '1'

    const cfg = await readSettings()
    let items: SocialItem[] = Array.isArray(cfg?.social_media_cache) ? cfg.social_media_cache : []

    if (wantsRefresh || items.length === 0) {
      try {
        items = await refreshFromGraph()
      } catch (e) {
        console.warn('Refresh from graph failed, falling back to cache or demo', e)
      }
    }

    if (!items || items.length === 0) {
      items = [
        {
          id: 'ig_demo_1',
          platform: 'instagram',
          mediaUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop',
          permalink: 'https://instagram.com/alloygatornl',
          caption: 'AlloyGator montage bij een sportieve hatchback. #AlloyGator',
          timestamp: new Date().toISOString()
        },
        {
          id: 'fb_demo_1',
          platform: 'facebook',
          mediaUrl: 'https://images.unsplash.com/photo-1515923162045-541184b22317?q=80&w=1200&auto=format&fit=crop',
          permalink: 'https://facebook.com/alloygatornl',
          caption: 'Klantcase: velgbescherming netjes geplaatst.',
          timestamp: new Date(Date.now() - 86400000).toISOString()
        }
      ]
    }

    return NextResponse.json({ items })
  } catch (e) {
    console.error('social media GET error', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(_request: NextRequest) {
  try {
    const items = await refreshFromGraph()
    return NextResponse.json({ success: true, items })
  } catch (e) {
    console.error('social media POST error', e)
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}


