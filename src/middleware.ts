import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Protect admin and agadmin paths
  if (pathname.startsWith('/admin') || pathname.startsWith('/agadmin')) {
    // Allow unauthenticated access to login/reset pages
    if (pathname === '/admin/login' || pathname === '/agadmin/login' || pathname === '/admin/reset' || pathname === '/agadmin/reset') {
      return NextResponse.next()
    }
    const session = req.cookies.get('adminSessionV2')?.value || ''
    // We also allow localStorage in client, but for SSR we rely on cookie.
    if (!session) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
    try {
      const s = JSON.parse(decodeURIComponent(session))
      // route-level restriction: staff cannot access Content or Settings
      const lower = pathname.toLowerCase()
      if (s.role === 'staff') {
        if (lower.startsWith('/admin/settings') || lower.startsWith('/agadmin/settings') || lower.includes('/cms') || lower.includes('/media')) {
          const dash = req.nextUrl.clone()
          dash.pathname = '/admin'
          return NextResponse.redirect(dash)
        }
      }
    } catch {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      return NextResponse.redirect(loginUrl)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/agadmin/:path*']
}


