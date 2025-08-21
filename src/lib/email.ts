import * as nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailSettings {
  smtpHost: string
  smtpPort: string
  smtpUser: string
  smtpPass: string
  adminEmail: string
  emailNotifications: boolean
}



interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  vat_amount: number
  shipping_cost: number
  total: number
  shipping_method: string
  payment_status: string
  created_at: string
  payment_method?: string
  payment_terms_days?: number
  due_at?: string
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private settings?: EmailSettings

  constructor(settings?: EmailSettings) {
    this.settings = settings
    
    // Gebruik settings of environment variables voor e-mail configuratie
    this.transporter = nodemailer.createTransport({
      host: settings?.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(settings?.smtpPort || process.env.SMTP_PORT || '587'),
      secure: false, // true voor 465, false voor andere poorten
      auth: {
        user: settings?.smtpUser || process.env.SMTP_USER || '',
        pass: settings?.smtpPass || process.env.SMTP_PASS || ''
      }
    })
  }

  // Publieke methode om e-mails te versturen
  async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  // Admin wachtwoord reset e-mail
  async sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `AlloyGator <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Wachtwoord resetten - AlloyGator Admin',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
              .header { background: #111827; color: white; padding: 16px; text-align: center; }
              .content { background: white; padding: 20px; border-radius: 8px; margin-top: 16px; }
              .btn { display: inline-block; padding: 10px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">AlloyGator Admin</div>
              <div class="content">
                <p>Je hebt een verzoek gedaan om je admin wachtwoord te resetten.</p>
                <p>Klik op de knop hieronder om een nieuw wachtwoord in te stellen:</p>
                <p><a class="btn" href="${resetUrl}">Reset wachtwoord</a></p>
                <p>Werkt de knop niet? Kopieer en plak deze link in je browser:</p>
                <p><a href="${resetUrl}">${resetUrl}</a></p>
                <p>Als je dit verzoek niet hebt gedaan, kun je deze e-mail negeren.</p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Fout bij verzenden reset e-mail:', error)
      return false
    }
  }

  // Klant wachtwoord reset e-mail
  async sendCustomerPasswordResetEmail(toEmail: string, resetUrl: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `AlloyGator <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Wachtwoord resetten - AlloyGator',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
              .header { background: #a2c614; color: white; padding: 20px; text-align: center; }
              .logo { max-width: 200px; height: auto; margin-bottom: 10px; }
              .content { background: white; padding: 20px; border-radius: 8px; margin-top: 16px; }
              .btn { display: inline-block; padding: 12px 24px; background: #a2c614; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://alloygator-nl.web.app/wysiwyg/media/AlloyGator_Logo.png" alt="AlloyGator Logo" class="logo">
                <h1 style="margin: 0; font-size: 24px;">AlloyGator</h1>
              </div>
              <div class="content">
                <h2>Wachtwoord resetten</h2>
                <p>Je hebt een verzoek gedaan om je wachtwoord te resetten.</p>
                <p>Klik op de knop hieronder om een nieuw wachtwoord in te stellen:</p>
                <p style="text-align: center;">
                  <a class="btn" href="${resetUrl}">Nieuw wachtwoord instellen</a>
                </p>
                <p>Werkt de knop niet? Kopieer en plak deze link in je browser:</p>
                <p style="word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
                  <a href="${resetUrl}">${resetUrl}</a>
                </p>
                <p><strong>Let op:</strong> Deze link is 24 uur geldig.</p>
                <p>Als je dit verzoek niet hebt gedaan, kun je deze e-mail negeren.</p>
              </div>
              <div class="footer">
                <p>AlloyGator Nederland - Professionele velgbescherming</p>
                <p>Voor vragen: <a href="mailto:info@alloygator.nl">info@alloygator.nl</a></p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      await this.transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Fout bij verzenden klant reset e-mail:', error)
      return false
    }
  }

  // Test e-mail configuratie
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing SMTP connection with:', {
        host: this.settings?.smtpHost || process.env.SMTP_HOST,
        port: this.settings?.smtpPort || process.env.SMTP_PORT,
        user: this.settings?.smtpUser || process.env.SMTP_USER,
        pass: this.settings?.smtpPass ? '***' : 'empty'
      })
      
      await this.transporter.verify()
      console.log('SMTP connection successful')
      return true
    } catch (error) {
      console.error('E-mail configuratie test gefaald:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command
      })
      return false
    }
  }



  // Bestelbevestiging naar klant
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"AlloyGator" <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: data.customerEmail,
        subject: `Bestelbevestiging - Order #${data.orderNumber}`,
        html: this.generateOrderConfirmationHTML(data)
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Bestelbevestiging verzonden naar ${data.customerEmail}`)
      return true
    } catch (error) {
      console.error('Fout bij verzenden bestelbevestiging:', error)
      return false
    }
  }

  // Bestelnotificatie naar admin
  async sendOrderNotification(data: OrderEmailData): Promise<boolean> {
    try {
      const adminEmail = this.settings?.adminEmail || process.env.ADMIN_EMAIL || process.env.SMTP_USER
      
      const mailOptions = {
        from: `"AlloyGator" <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `Nieuwe bestelling - Order #${data.orderNumber}`,
        html: this.generateOrderNotificationHTML(data)
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Bestelnotificatie verzonden naar admin`)
      return true
    } catch (error) {
      console.error('Fout bij verzenden bestelnotificatie:', error)
      return false
    }
  }

  // Status update notificatie
  async sendStatusUpdateNotification(
    orderNumber: string,
    customerEmail: string,
    customerName: string,
    oldStatus: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"AlloyGator" <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: customerEmail,
        subject: `Status update - Order #${orderNumber}`,
        html: this.generateStatusUpdateHTML(orderNumber, customerName, oldStatus, newStatus)
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Status update verzonden naar ${customerEmail}`)
      return true
    } catch (error) {
      console.error('Fout bij verzenden status update:', error)
      return false
    }
  }

  // Factuur mailen als PDF-bijlage
  async sendInvoiceEmail(
    meta: { orderNumber: string; customerName: string; customerEmail: string },
    pdfBuffer: Buffer,
    invoiceNumber: string
  ): Promise<boolean> {
    try {
      const adminEmail = this.settings?.adminEmail || process.env.ADMIN_EMAIL || process.env.SMTP_USER
      const attachments = [{ filename: `factuur-${invoiceNumber}.pdf`, content: pdfBuffer }]

      // Naar klant
      await this.transporter.sendMail({
        from: `AlloyGator <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: meta.customerEmail,
        subject: `Factuur ${invoiceNumber} - Order #${meta.orderNumber}`,
        html: `<p>Hallo ${meta.customerName},</p><p>In de bijlage vind je de factuur voor je bestelling #${meta.orderNumber}.</p><p>Bedankt voor je bestelling!</p>`,
        attachments
      })

      // Naar admin
      if (adminEmail) {
        await this.transporter.sendMail({
          from: `AlloyGator <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `Factuur ${invoiceNumber} gestuurd - Order #${meta.orderNumber}`,
          html: `<p>Factuur ${invoiceNumber} voor order #${meta.orderNumber} is naar ${meta.customerEmail} gemaild.</p>`,
          attachments
        })
      }
      return true
    } catch (e) {
      console.error('sendInvoiceEmail error', e)
      return false
    }
  }

  // HTML templates
  private generateOrderConfirmationHTML(data: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bestelbevestiging</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bestelbevestiging</h1>
            <p>Bedankt voor je bestelling!</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${data.customerName},</h2>
            <p>We hebben je bestelling ontvangen en gaan er direct mee aan de slag.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Ordernummer:</strong> #${data.orderNumber}</p>
              <p><strong>Datum:</strong> ${new Date(data.created_at).toLocaleDateString('nl-NL')}</p>
              <p><strong>Status:</strong> ${this.getStatusText(data.payment_status)}</p>
              
              <h4>Producten:</h4>
               ${data.items.map(item => `
                <div class="item">
                  <span>${item.name} (${item.quantity}x)</span>
                  <span>€${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
               ${(() => {
                 // Dealer korting tonen indien herkenbaar (subtotaal < som regelprijzen?)
                 try {
                   const sum = data.items.reduce((s, it) => s + (it.price * it.quantity), 0)
                   if (sum > data.subtotal) {
                     const diff = sum - data.subtotal
                     return `<div class="item"><span>Dealerkorting</span><span>-€${diff.toFixed(2)}</span></div>`
                   }
                 } catch {}
                 return ''
               })()}
              
              <div class="total">
                <div class="item">
                  <span>Subtotaal:</span>
                  <span>€${data.subtotal.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>BTW:</span>
                  <span>€${data.vat_amount.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>Verzendkosten:</span>
                  <span>€${data.shipping_cost.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span><strong>Totaal:</strong></span>
                  <span><strong>€${data.total.toFixed(2)}</strong></span>
                </div>
                ${data.payment_method === 'invoice' ? `
                <div class="item">
                  <span>Betaalvoorwaarden:</span>
                  <span>${data.payment_terms_days || 14} dagen${data.due_at ? ` (vóór ${new Date(data.due_at).toLocaleDateString('nl-NL')})` : ''}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <p>We houden je op de hoogte van de status van je bestelling.</p>
          </div>
          
          <div class="footer">
            <p>AlloyGator - Voor al je velgbescherming</p>
            <p>Heb je vragen? Neem contact met ons op.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateOrderNotificationHTML(data: OrderEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nieuwe Bestelling</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Nieuwe Bestelling</h1>
            <p>Er is een nieuwe bestelling geplaatst</p>
          </div>
          
          <div class="content">
            <h2>Order Details</h2>
            <div class="order-details">
              <p><strong>Ordernummer:</strong> #${data.orderNumber}</p>
              <p><strong>Klant:</strong> ${data.customerName}</p>
              <p><strong>E-mail:</strong> ${data.customerEmail}</p>
              <p><strong>Datum:</strong> ${new Date(data.created_at).toLocaleDateString('nl-NL')}</p>
              <p><strong>Status:</strong> ${this.getStatusText(data.payment_status)}</p>
              
              <h4>Producten:</h4>
               ${data.items.map(item => `
                <div class="item">
                  <span>${item.name} (${item.quantity}x)</span>
                  <span>€${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
               ${(() => {
                 try {
                   const sum = data.items.reduce((s, it) => s + (it.price * it.quantity), 0)
                   if (sum > data.subtotal) {
                     const diff = sum - data.subtotal
                     return `<div class=\"item\"><span>Dealerkorting</span><span>-€${diff.toFixed(2)}</span></div>`
                   }
                 } catch {}
                 return ''
               })()}
              
              <div class="total">
                <div class="item">
                  <span>Subtotaal:</span>
                  <span>€${data.subtotal.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>BTW:</span>
                  <span>€${data.vat_amount.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span>Verzendkosten:</span>
                  <span>€${data.shipping_cost.toFixed(2)}</span>
                </div>
                <div class="item">
                  <span><strong>Totaal:</strong></span>
                  <span><strong>€${data.total.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateStatusUpdateHTML(
    orderNumber: string,
    customerName: string,
    oldStatus: string,
    newStatus: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .status-update { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Status Update</h1>
            <p>Je bestelling is bijgewerkt</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${customerName},</h2>
            <p>De status van je bestelling is bijgewerkt.</p>
            
            <div class="status-update">
              <h3>Order #${orderNumber}</h3>
              <p><strong>Oude status:</strong> ${this.getStatusText(oldStatus)}</p>
              <p><strong>Nieuwe status:</strong> ${this.getStatusText(newStatus)}</p>
            </div>
            
            <p>We houden je op de hoogte van verdere updates.</p>
          </div>
          
          <div class="footer">
            <p>AlloyGator - Voor al je velgbescherming</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getStatusText(status: string): string {
    switch (status) {
      case 'open': return 'Open'
      case 'paid': return 'Betaald'
      case 'failed': return 'Mislukt'
      case 'pending': return 'In behandeling'
      case 'processing': return 'Wordt verwerkt'
      case 'shipped': return 'Verzonden'
      case 'delivered': return 'Afgeleverd'
      case 'cancelled': return 'Geannuleerd'
      default: return 'Onbekend'
    }
  }

  // Payment confirmation email
  async sendPaymentConfirmation(
    toEmail: string,
    data: {
      orderNumber: string
      customerName: string
      paymentMethod: string
      paymentStatus: string
      total: string
      paymentDate: string
      orderDate: string
    }
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: `AlloyGator <${this.settings?.smtpUser || process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Betaling bevestigd - Bestelling #${data.orderNumber}`,
        html: this.generatePaymentConfirmationHTML(data)
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Payment confirmation email sent to ${toEmail}`)
      return true
    } catch (error) {
      console.error('Error sending payment confirmation email:', error)
      return false
    }
  }

  private generatePaymentConfirmationHTML(data: {
    orderNumber: string
    customerName: string
    paymentMethod: string
    paymentStatus: string
    total: string
    paymentDate: string
    orderDate: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Betaling Bevestigd</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .highlight { background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Betaling Bevestigd</h1>
            <p>Je betaling is succesvol ontvangen</p>
          </div>
          
          <div class="content">
            <h2>Hallo ${data.customerName},</h2>
            <p>Bedankt voor je betaling! We hebben je betaling succesvol ontvangen.</p>
            
            <div class="payment-info">
              <h3>Bestelling #${data.orderNumber}</h3>
              <div class="highlight">
                <p><strong>Betaling ontvangen op:</strong> ${data.paymentDate}</p>
                <p><strong>Betaalmethode:</strong> ${data.paymentMethod}</p>
                <p><strong>Bedrag:</strong> €${data.total}</p>
                <p><strong>Besteldatum:</strong> ${data.orderDate}</p>
              </div>
            </div>
            
            <p>Je bestelling wordt nu verwerkt en we houden je op de hoogte van verdere updates.</p>
            
            <p>Heb je vragen? Neem gerust contact met ons op.</p>
          </div>
          
          <div class="footer">
            <p>AlloyGator - Voor al je velgbescherming</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
