import { NextRequest, NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

export const dynamic = 'force-dynamic'

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { orderData, customerEmail } = await request.json()

    if (!orderData || !customerEmail) {
      return NextResponse.json(
        { error: 'Order data en customer email zijn verplicht' },
        { status: 400 }
      )
    }

    // Create email content
    const emailContent = {
      to: customerEmail,
      from: 'info@alloygator.nl', // Must be verified with SendGrid
      subject: `Bestelling bevestiging - ${orderData.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bestelling Bevestiging</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .product-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bedankt voor je bestelling!</h1>
              <p>Bestelling ${orderData.orderNumber}</p>
            </div>
            
            <div class="content">
              <h2>Hallo ${orderData.customer?.name || 'Klant'},</h2>
              <p>Bedankt voor je bestelling bij AlloyGator Nederland. Hier zijn de details van je bestelling:</p>
              
              <div class="order-details">
                <h3>Bestelling Details</h3>
                <p><strong>Bestelnummer:</strong> ${orderData.orderNumber}</p>
                <p><strong>Datum:</strong> ${new Date(orderData.createdAt).toLocaleDateString('nl-NL')}</p>
                <p><strong>Status:</strong> ${orderData.status}</p>
                
                <h4>Producten:</h4>
                ${orderData.items?.map((item: any) => `
                  <div class="product-item">
                    <p><strong>${item.name}</strong></p>
                    <p>Aantal: ${item.quantity} x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                `).join('') || ''}
                
                <div class="total">
                  <p><strong>Totaal:</strong> €${orderData.total?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              
              <p>Je ontvangt een e-mail zodra je bestelling wordt verzonden.</p>
              
              <p>Heb je vragen? Neem contact op via info@alloygator.nl of bel ons op 085-3033400.</p>
            </div>
            
            <div class="footer">
              <p>AlloyGator Nederland</p>
              <p>Kweekgrasstraat 36, 1313 BX Almere</p>
              <p>info@alloygator.nl | 085-3033400</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    // Send email via SendGrid
    if (process.env.SENDGRID_API_KEY) {
      await sgMail.send(emailContent)
      console.log('📧 Order confirmation email sent via SendGrid to:', customerEmail)
    } else {
      // Fallback to console log if no SendGrid API key
      console.log('📧 Order confirmation email would be sent to:', customerEmail)
      console.log('📦 Order details:', JSON.stringify(orderData, null, 2))
    }

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully',
      orderNumber: orderData.orderNumber
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het versturen van de email' },
      { status: 500 }
    )
  }
} 