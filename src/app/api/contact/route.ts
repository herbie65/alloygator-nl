import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email'
import { FirebaseService } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { naam, email, telefoon, onderwerp, bericht, privacy_accepted } = body

    // Validate required fields
    if (!naam || !email || !onderwerp || !bericht || !privacy_accepted) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create contact message object
    const contactMessage = {
      id: Date.now().toString(),
      naam,
      email,
      telefoon: telefoon || '',
      onderwerp,
      bericht,
      privacy_accepted,
      status: 'new',
      created_at: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    }

    console.log('Contact form submitted:', contactMessage)

    // Haal mailsettings op uit de backend database
    const settingsArray = await FirebaseService.getSettings()
    let emailService: EmailService
    
    if (settingsArray && settingsArray.length > 0) {
      const settings = settingsArray[0]
      emailService = new EmailService({
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || '587',
        smtpUser: settings.smtpUser || '',
        smtpPass: settings.smtpPass || '',
        adminEmail: settings.adminEmail || '',
        emailNotifications: settings.emailNotifications || false
      })
      console.log('Using backend mail settings:', { host: settings.smtpHost, user: settings.smtpUser, adminEmail: settings.adminEmail })
    } else {
      // Fallback naar environment variables
      emailService = new EmailService()
      console.log('Using environment variables for mail settings')
    }
    
    // Send notification email to admin
    try {
      const adminEmail = settingsArray && settingsArray.length > 0 ? settingsArray[0].adminEmail : 'info@alloygator.nl'
      await emailService.sendMail({
        from: `"AlloyGator Contact Formulier" <${settingsArray && settingsArray.length > 0 ? settingsArray[0].smtpUser : (process.env.SMTP_USER || 'noreply@alloygator.nl')}>`,
        to: adminEmail,
        subject: `Nieuw contactformulier: ${onderwerp}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; background: #f9fafb; }
              .header { background: #a2c614; color: white; padding: 20px; text-align: center; }
              .content { background: white; padding: 30px; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .info-row { display: flex; margin-bottom: 15px; }
              .label { font-weight: bold; width: 120px; color: #374151; }
              .value { flex: 1; }
              .message-box { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #a2c614; }
              .reply-button { display: inline-block; background: #a2c614; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
              .logo { max-width: 200px; height: auto; margin-bottom: 15px; }
            </style>
          </head>
          <body>
                          <div class="container">
                <div style="text-align: center; padding: 20px 0;">
                  <img src="https://alloygator-nl.web.app/wysiwyg/media/AlloyGator_Logo.png" alt="AlloyGator Logo" class="logo">
                </div>
                <div class="header">
                  <h1>📧 Nieuw Contactformulier</h1>
                  <p>Er is een nieuw bericht ingediend via de website</p>
                </div>
              
              <div class="content">
                <div class="info-row">
                  <span class="label">Naam:</span>
                  <span class="value">${naam}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value"><a href="mailto:${email}" style="color: #a2c614;">${email}</a></span>
                </div>
                <div class="info-row">
                  <span class="label">Telefoon:</span>
                  <span class="value">${telefoon || 'Niet opgegeven'}</span>
                </div>
                <div class="info-row">
                  <span class="label">Onderwerp:</span>
                  <span class="value">${onderwerp}</span>
                </div>
                <div class="info-row">
                  <span class="label">Datum:</span>
                  <span class="value">${new Date().toLocaleString('nl-NL')}</span>
                </div>
                <div class="info-row">
                  <span class="label">IP Adres:</span>
                  <span class="value">${contactMessage.ip_address}</span>
                </div>
                
                <div class="message-box">
                  <h3>Bericht:</h3>
                  <p style="white-space: pre-wrap; margin: 0;">${bericht}</p>
                </div>
                
                <div style="text-align: center;">
                  <a href="mailto:${email}" class="reply-button">📧 Direct Beantwoorden</a>
                </div>
                
                <p style="text-align: center; margin-top: 20px; color: #6b7280;">
                  <small>Klik op de knop hierboven om direct te reageren, of gebruik de email link bij de contactgegevens.</small>
                </p>
              </div>
              
              <div class="footer">
                <p>AlloyGator Nederland - Contactformulier</p>
                <p>Dit bericht is automatisch gegenereerd door het contactformulier op de website.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
      console.log('Admin notification email sent to info@alloygator.nl')
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
    }

                  // Send confirmation email to customer
              try {
                await emailService.sendMail({
                  from: `"AlloyGator Nederland" <${settingsArray && settingsArray.length > 0 ? settingsArray[0].smtpUser : (process.env.SMTP_USER || 'noreply@alloygator.nl')}>`,
                  to: email,
                  subject: `Bevestiging van uw bericht - AlloyGator`,
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; background: #f9fafb; }
                        .header { background: #a2c614; color: white; padding: 20px; text-align: center; }
                        .content { background: white; padding: 30px; margin: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .message-box { background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #a2c614; }
                        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                        .logo { max-width: 200px; height: auto; margin-bottom: 15px; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div style="text-align: center; padding: 20px 0;">
                          <img src="https://alloygator-nl.web.app/wysiwyg/media/AlloyGator_Logo.png" alt="AlloyGator Logo" class="logo">
                        </div>
                        <div class="header">
                          <h1>📧 Bericht Ontvangen</h1>
                          <p>We hebben uw contactformulier ontvangen</p>
                        </div>

                        <div class="content">
                          <p>Beste ${naam},</p>
                          <p>Bedankt voor uw bericht! We hebben uw contactformulier ontvangen en nemen binnen 1 werkdag contact met u op.</p>
                          
                          <div class="message-box">
                            <h3>Uw bericht:</h3>
                            <p><strong>Onderwerp:</strong> ${onderwerp}</p>
                            <p><strong>Bericht:</strong></p>
                            <p style="white-space: pre-wrap; margin: 0;">${bericht}</p>
                          </div>

                          <p>Met vriendelijke groet,<br><strong>AlloyGator Nederland</strong></p>
                        </div>

                        <div class="footer">
                          <p>AlloyGator Nederland - Contactformulier</p>
                          <p>Dit bericht is automatisch gegenereerd door het contactformulier op de website.</p>
                        </div>
                      </div>
                    </body>
                    </html>
                  `
                })
                console.log('Customer confirmation email sent to:', email)
              } catch (emailError) {
                console.error('Failed to send customer confirmation email:', emailError)
              }

    return NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully',
      contactId: contactMessage.id
    })

  } catch (error) {
    console.error('Error processing contact form:', error)
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    )
  }
}
