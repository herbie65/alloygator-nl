import { NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'
import { EmailService } from '@/lib/email'

type ReturnRequestPayload = {
  orderNumber: string
  customerName: string
  email: string
  phone?: string
  address?: string
  postalCode?: string
  city?: string
  item?: string
  quantity?: number
  purchaseDate?: string
  reason?: string
  condition?: string
  preferredResolution?: 'refund' | 'exchange' | 'repair' | 'other'
  iban?: string
  accountHolder?: string
  notes?: string
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Partial<ReturnRequestPayload>

    // Basic validation
    if (!data.orderNumber || !data.customerName || !data.email) {
      return NextResponse.json({ ok: false, error: 'orderNumber, customerName en email zijn verplicht' }, { status: 400 })
    }

    const payload: ReturnRequestPayload = {
      orderNumber: String(data.orderNumber).trim(),
      customerName: String(data.customerName).trim(),
      email: String(data.email).trim(),
      phone: (data.phone || '').toString().trim(),
      address: (data.address || '').toString().trim(),
      postalCode: (data.postalCode || '').toString().trim(),
      city: (data.city || '').toString().trim(),
      item: (data.item || '').toString().trim(),
      quantity: typeof data.quantity === 'number' ? data.quantity : Number(data.quantity || 1) || 1,
      purchaseDate: (data.purchaseDate || '').toString().trim(),
      reason: (data.reason || '').toString().trim(),
      condition: (data.condition || '').toString().trim(),
      preferredResolution: (data.preferredResolution as any) || 'refund',
      iban: (data.iban || '').toString().trim(),
      accountHolder: (data.accountHolder || '').toString().trim(),
      notes: (data.notes || '').toString().trim(),
    }

    // Generate RMA number (yearly sequence)
    const now = new Date()
    const year = now.getFullYear()
    let seq = 0
    try {
      const counter = await FirebaseService.getDocument('counters', 'rma') as any
      if (!counter || counter.year !== year) {
        await FirebaseService.updateDocument('counters', 'rma', { year, seq: 1 })
        seq = 1
      } else {
        seq = Number(counter.seq || 0) + 1
        await FirebaseService.updateDocument('counters', 'rma', { year, seq })
      }
    } catch (_) {
      // Initialize if missing
      try { await FirebaseService.updateDocument('counters', 'rma', { year, seq: 1 }); seq = 1 } catch {}
    }
    const rmaNumber = `RMA-${year}-${String(seq).padStart(5, '0')}`

    // Persist to Firestore
    const record = await FirebaseService.addDocument('return_requests', {
      ...payload,
      rmaNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    // Email admin and customer
    const email = new EmailService()
    const subject = `Retouraanvraag ${rmaNumber} – ${payload.customerName}`
    const adminRecipients = Array.from(new Set([
      process.env.ADMIN_EMAIL,
      process.env.RMA_EMAIL,
      process.env.SMTP_USER,
      'info@alloygator.nl',
    ].filter(Boolean))) as string[]
    const html = `
      <h2>Nieuwe retouraanvraag</h2>
      <p><strong>RMA:</strong> ${rmaNumber}</p>
      <p><strong>Ordernummer:</strong> ${payload.orderNumber}</p>
      <p><strong>Klant:</strong> ${payload.customerName}</p>
      <p><strong>E-mail:</strong> ${payload.email}</p>
      ${payload.phone ? `<p><strong>Telefoon:</strong> ${payload.phone}</p>` : ''}
      ${payload.address || payload.postalCode || payload.city ? `<p><strong>Adres:</strong> ${payload.address || ''}, ${payload.postalCode || ''} ${payload.city || ''}</p>` : ''}
      ${payload.item ? `<p><strong>Artikel:</strong> ${payload.item} (${payload.quantity || 1}x)</p>` : ''}
      ${payload.purchaseDate ? `<p><strong>Aankoopdatum:</strong> ${payload.purchaseDate}</p>` : ''}
      ${payload.reason ? `<p><strong>Reden:</strong> ${payload.reason}</p>` : ''}
      ${payload.condition ? `<p><strong>Staat/conditie:</strong> ${payload.condition}</p>` : ''}
      ${payload.preferredResolution ? `<p><strong>Voorkeur afhandeling:</strong> ${payload.preferredResolution}</p>` : ''}
      ${payload.iban ? `<p><strong>IBAN:</strong> ${payload.iban}</p>` : ''}
      ${payload.accountHolder ? `<p><strong>Tenaamstelling:</strong> ${payload.accountHolder}</p>` : ''}
      ${payload.notes ? `<p><strong>Opmerkingen:</strong><br/>${payload.notes}</p>` : ''}
      <hr/>
      <p>Request ID: ${record.id}</p>
    `

    if (adminRecipients.length > 0) {
      try {
        await (email as any).transporter.sendMail({
          from: `AlloyGator <${process.env.SMTP_USER || ''}>`,
          to: adminRecipients[0],
          bcc: adminRecipients.slice(1),
          subject,
          html,
          replyTo: payload.email,
        })
      } catch (e) {
        console.error('Failed to email admin return request', e)
      }
    }

    try {
      await (email as any).transporter.sendMail({
        from: `AlloyGator <${process.env.SMTP_USER || ''}>`,
        to: payload.email,
        subject: `Ontvangstbevestiging retouraanvraag ${rmaNumber}`,
        html: `<p>Hallo ${payload.customerName},</p><p>We hebben je retouraanvraag ontvangen en nemen zo snel mogelijk contact met je op.</p><p><strong>RMA:</strong> ${rmaNumber}<br/>Referentie: ${record.id}</p>`,
        replyTo: 'info@alloygator.nl',
      })
    } catch (e) {
      console.error('Failed to email customer return request', e)
    }

    return NextResponse.json({ ok: true, id: record.id, rmaNumber })
  } catch (error) {
    console.error('Return request error', error)
    return NextResponse.json({ ok: false, error: 'Serverfout' }, { status: 500 })
  }
}


