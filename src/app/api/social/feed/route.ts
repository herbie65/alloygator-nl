import { NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-static"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform') || 'instagram'
    
    // Haal social media instellingen op uit environment variables
    const instagramUserId = process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID
    const instagramAccessToken = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN
    const facebookPageId = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID
    const facebookAccessToken = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN

    if (platform === 'instagram') {
      if (!instagramUserId || !instagramAccessToken) {
        return NextResponse.json({
          success: false,
          message: 'Instagram instellingen niet geconfigureerd',
          error: 'Missing Instagram credentials'
        }, { status: 400 })
      }

      try {
        // Instagram Basic Display API call
        const response = await fetch(
          `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${instagramAccessToken}`
        )

        if (!response.ok) {
          throw new Error(`Instagram API error: ${response.status}`)
        }

        const data = await response.json()
        
        // Format data voor de frontend
        const formattedData = (data.data || []).map((item: any) => ({
          id: item.id,
          caption: item.caption || '',
          image_url: item.media_url || item.thumbnail_url || '',
          permalink: item.permalink || '',
          platform: 'instagram',
          timestamp: item.timestamp
        }))
        
        return NextResponse.json({
          success: true,
          platform: 'instagram',
          items: formattedData,
          count: formattedData.length
        })
      } catch (instagramError) {
        console.error('Instagram API error:', instagramError)
        return NextResponse.json({
          success: false,
          message: 'Fout bij ophalen Instagram feed',
          error: instagramError instanceof Error ? instagramError.message : 'Unknown error'
        }, { status: 500 })
      }
    } else if (platform === 'facebook') {
      if (!facebookPageId || !facebookAccessToken) {
        return NextResponse.json({
          success: false,
          message: 'Facebook instellingen niet geconfigureerd',
          error: 'Missing Facebook credentials'
        }, { status: 400 })
      }

      try {
        // Facebook Graph API call
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${facebookPageId}/posts?fields=id,message,created_time,full_picture,permalink_url&access_token=${facebookAccessToken}`
        )

        if (!response.ok) {
          throw new Error(`Facebook API error: ${response.status}`)
        }

        const data = await response.json()
        
        // Format data voor de frontend
        const formattedData = (data.data || []).map((item: any) => ({
          id: item.id,
          caption: item.message || '',
          image_url: item.full_picture || '',
          permalink: item.permalink_url || '',
          platform: 'facebook',
          timestamp: item.created_time
        }))
        
        return NextResponse.json({
          success: true,
          platform: 'facebook',
          items: formattedData,
          count: formattedData.length
        })
      } catch (facebookError) {
        console.error('Facebook API error:', facebookError)
        return NextResponse.json({
          success: false,
          message: 'Fout bij ophalen Facebook feed',
          error: facebookError instanceof Error ? facebookError.message : 'Unknown error'
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({
        success: false,
        message: 'Platform niet ondersteund',
        error: 'Unsupported platform'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Social media API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Er is een fout opgetreden bij het ophalen van social media feeds',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { platform, action } = body

    if (action === 'test') {
      // Test de social media verbinding
      const testResponse = await fetch(`/api/social/feed?platform=${platform}`)
      const testData = await testResponse.json()
      
      return NextResponse.json({
        success: true,
        message: `Test ${platform} verbinding succesvol`,
        data: testData
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Onbekende actie'
    }, { status: 400 })
  } catch (error) {
    console.error('Social media test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Fout bij testen social media verbinding',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
