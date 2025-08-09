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
}
