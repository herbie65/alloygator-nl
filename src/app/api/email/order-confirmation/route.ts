import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order, customer } = body

    // Validate required fields
    if (!order || !customer) {
      return NextResponse.json(
        { error: 'Missing order or customer data' },
        { status: 400 }
      )
    }

    // Email template for order confirmation
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestelling Bevestiging - AlloyGator Nederland</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #22c55e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bestelling Bevestiging</h1>
            <p>Bedankt voor uw bestelling bij AlloyGator Nederland</p>
          </div>
          
          <div class="content">
            <h2>Beste ${customer.voornaam} ${customer.achternaam},</h2>
            
            <p>We hebben uw bestelling ontvangen en deze wordt momenteel verwerkt.</p>
            
            <div class="order-details">
              <h3>Bestelling Details</h3>
              <p><strong>Bestelnummer:</strong> ${order.order_number}</p>
              <p><strong>Datum:</strong> ${new Date(order.created_at).toLocaleDateString('nl-NL')}</p>
              
              <h4>Producten:</h4>
              ${order.items.map((item: any) => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>€${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
              
              <div class="total">
                <div class="item">
                  <span>Subtotaal:</span>
                  <span>€${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>BTW (21%):</span>
                  <span>€${order.vat_amount.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>Verzendkosten:</span>
                  <span>€${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span><strong>Totaal:</strong></span>
                  <span><strong>€${order.total.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
            
            <h3>Verzendadres</h3>
            <p>
              ${customer.voornaam} ${customer.achternaam}<br>
              ${customer.adres}<br>
              ${customer.postcode} ${customer.plaats}<br>
              ${customer.land}
            </p>
            
            <h3>Betaalmethode</h3>
            <p>${order.payment_method === 'ideal' ? 'iDEAL' : 
                order.payment_method === 'creditcard' ? 'Creditcard' : 'Bankoverschrijving'}</p>
            
            <p>U ontvangt een aparte email zodra uw bestelling is verzonden.</p>
            
            <p>Heeft u vragen? Neem dan contact met ons op via info@alloygator.nl of bel 085-3033400.</p>
          </div>
          
          <div class="footer">
            <p>AlloyGator Nederland<br>
            Kweekgrasstraat 36, 1313 BX Almere<br>
            info@alloygator.nl | 085-3033400</p>
          </div>
        </div>
      </body>
      </html>
    `

    // In a real application, you would send this email using a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Nodemailer with SMTP
    
    // For now, we'll just log the email content
    console.log('Order confirmation email would be sent to:', customer.email)
    console.log('Email content:', emailTemplate)

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Order confirmation email sent successfully',
      orderId: order.id,
      customerEmail: customer.email
    })

  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return NextResponse.json(
      { error: 'Failed to send order confirmation email' },
      { status: 500 }
    )
  }
}
