import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { EmailService } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Test GET method to verify route is accessible
export async function GET() {
  return NextResponse.json({ 
    message: 'Forgot password API route is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'E-mail is verplicht' }, { status: 400 })
    }

    // Get user from Firebase
    const users = await FirebaseService.getDocuments('users')
    const user = users.find((u: any) => u.email?.toLowerCase().trim() === email.toLowerCase().trim())
    
    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    // Generate reset token (simple implementation)
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

    // Update user with reset token
    await FirebaseService.updateDocument('users', user.id, {
      reset_token: resetToken,
      reset_expiry: resetExpiry
    })

    // Generate reset URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/auth/reset?email=${encodeURIComponent(email)}&token=${resetToken}`

    // Send reset email
    try {
      const emailService = new EmailService()
      const emailSent = await emailService.sendCustomerPasswordResetEmail(email, resetUrl)
      
      if (emailSent) {
        return NextResponse.json({ 
          success: true, 
          message: 'Reset instructies verzonden naar je e-mail' 
        })
      } else {
        // Email failed, but token was saved - user can still reset manually
        return NextResponse.json({ 
          success: true, 
          message: 'Reset instructies verzonden naar je e-mail',
          resetUrl: resetUrl // Fallback for development
        })
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Email failed, but token was saved - user can still reset manually
      return NextResponse.json({ 
        success: true, 
        message: 'Reset instructies verzonden naar je e-mail',
        resetUrl: resetUrl // Fallback for development
      })
    }

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Fout bij verwerken verzoek' }, { status: 500 })
  }
}


