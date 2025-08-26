import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Debug logging
  console.log('🔍 Middleware processing:', pathname)
  
  // Skip middleware completely for API routes
  if (pathname.startsWith('/api/')) {
    console.log('🔍 Skipping API route:', pathname)
    return NextResponse.next()
  }
  
  // Skip middleware for static files
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
    console.log('🔍 Skipping static file:', pathname)
    return NextResponse.next()
  }
  
  // Protect admin and agadmin paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/agadmin')) {
    console.log('🔍 Processing admin route:', pathname)
    
    // Allow unauthenticated access to login/reset pages
    if (pathname === '/admin/login' || pathname === '/agadmin/login' || pathname === '/admin/reset' || pathname === '/agadmin/reset') {
      console.log('🔍 Allowing access to login/reset page:', pathname)
      return NextResponse.next()
    }
    
    const session = req.cookies.get('adminSessionV2')?.value || ''
    console.log('🔍 Admin session found:', !!session)
    
    // We also allow localStorage in client, but for SSR we rely on cookie.
    if (!session) {
      console.log('🔍 No session, redirecting to login')
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
    
    try {
      const s = JSON.parse(decodeURIComponent(session))
      console.log('🔍 Session parsed successfully, role:', s.role)
      
      // route-level restriction: staff cannot access Content or Settings
      const lower = pathname.toLowerCase()
      if (s.role === 'staff') {
        if (lower.startsWith('/admin/settings') || lower.startsWith('/agadmin/settings') || lower.includes('/cms') || lower.includes('/media')) {
          console.log('🔍 Staff role restricted from:', pathname)
          const dash = req.nextUrl.clone()
          dash.pathname = '/admin'
          return NextResponse.redirect(dash)
        }
      }
    } catch (error) {
      console.log('🔍 Session parsing failed:', error)
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
  }
  
  console.log('🔍 No middleware action for:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match admin routes, exclude API routes completely
    '/admin/:path*',
    '/agadmin/:path*'
  ]
}


