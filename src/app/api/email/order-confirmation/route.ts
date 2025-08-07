import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { order, customer } = await request.json()

    // In a real application, you would use a service like SendGrid, Mailgun, or AWS SES
    // For now, we'll simulate the email sending process
    
    const emailContent = {
      to: customer.email,
      subject: `Bestelling bevestiging - ${order.order_number}`,
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
              <p>Bestelling ${order.order_number}</p>
            </div>
            
            <div class="content">
              <h2>Hallo ${customer.voornaam} ${customer.achternaam},</h2>
              <p>Bedankt voor je bestelling bij AlloyGator Nederland. Hier zijn de details van je bestelling:</p>
              
              <div class="order-details">
                <h3>Bestelling Details</h3>
                <p><strong>Bestelnummer:</strong> ${order.order_number}</p>
                <p><strong>Datum:</strong> ${new Date(order.created_at).toLocaleDateString('nl-NL')}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                
                <h4>Producten:</h4>
                ${order.items.map((item: any) => `
                  <div class="product-item">
                    <p><strong>${item.name}</strong></p>
                    <p>Aantal: ${item.quantity} x €${item.price.toFixed(2)} = €${(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                `).join('')}
                
                <div class="total">
                  <p><strong>Totaal:</strong> €${order.total.toFixed(2)}</p>
                </div>
              </div>
              
              <h3>Verzendadres</h3>
              <p>
                ${customer.voornaam} ${customer.achternaam}<br>
                ${customer.adres}<br>
                ${customer.postcode} ${customer.plaats}<br>
                ${customer.land}
              </p>
              
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

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In a real application, you would send the email here
    console.log('Order confirmation email sent:', emailContent)

    return NextResponse.json({ 
      success: true, 
      message: 'Order confirmation email sent successfully' 
    })

  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send order confirmation email' },
      { status: 500 }
    )
  }
} 