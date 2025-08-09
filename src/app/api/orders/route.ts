import { NextRequest, NextResponse } from 'next/server'
import { ensureInvoice } from '@/lib/invoice'
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { EmailService } from '@/lib/email'
import { FirebaseService } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Validate required fields
    if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Klant en producten zijn verplicht' },
        { status: 400 }
      )
    }

    // Generate sequential order number: next = AG-05000 (configurable via counter)
    let orderNumber = ''
    try {
      const counter = await FirebaseService.getDocument('counters', 'order_number') as any
      let nextSeq = 5000
      if (!counter || typeof counter.seq !== 'number') {
        await FirebaseService.updateDocument('counters', 'order_number', { seq: nextSeq })
      } else {
        nextSeq = Number(counter.seq || 5000) + 1
        await FirebaseService.updateDocument('counters', 'order_number', { seq: nextSeq })
      }
      orderNumber = `AG-${String(nextSeq).padStart(5, '0')}`
    } catch (e) {
      // Fallback to timestamp if counters fail
      const timestamp = Date.now()
      orderNumber = `AG-${timestamp}`
    }

    // Create order object
    const createdAt = new Date().toISOString()
    const order: any = {
      orderNumber,
      customer: orderData.customer,
      items: orderData.items,
      subtotal: orderData.subtotal,
      vat_amount: orderData.vat_amount,
      shipping_cost: orderData.shipping_cost,
      total: orderData.total,
      shipping_method: orderData.shipping_method,
      payment_method: orderData.payment_method,
      payment_status: 'open',
      status: 'pending',
      createdAt,
      updatedAt: createdAt
    }
    // Default payment terms for invoice
    if (orderData.payment_method === 'invoice') {
      order.payment_status = 'pending'
      order.payment_terms_days = orderData.payment_terms_days || 14
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (order.payment_terms_days || 14))
      order.due_at = dueDate.toISOString()
    }

    // Add order to Firestore
    const docRef = await addDoc(collection(db, 'orders'), order)

    // Update product stock
    try {
      for (const item of orderData.items) {
        const productRef = doc(db, 'products', item.id)
        const productDoc = await getDoc(productRef)
        
        if (productDoc.exists()) {
          const productData = productDoc.data()
          const currentStock = productData.stock || 0
          const newStock = Math.max(0, currentStock - item.quantity)
          
          await updateDoc(productRef, {
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          
          console.log(`Updated stock for product ${item.id}: ${currentStock} -> ${newStock}`)
        } else {
          console.warn(`Product ${item.id} not found for stock update`)
        }
      }
    } catch (stockError) {
      console.error('Error updating product stock:', stockError)
      // Don't fail the order creation if stock update fails
    }

    // Send e-mails (no invoice attachment here anymore)
    try {
      // Haal settings op uit de database
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
      } else {
        // Fallback naar environment variables
        emailService = new EmailService()
      }
      
      // Prepare email data
      const emailData = {
        orderNumber: order.orderNumber,
        customerName: `${orderData.customer.voornaam} ${orderData.customer.achternaam}`,
        customerEmail: orderData.customer.email,
        items: orderData.items,
        subtotal: orderData.subtotal,
        vat_amount: orderData.vat_amount,
        shipping_cost: orderData.shipping_cost,
        total: orderData.total,
        shipping_method: orderData.shipping_method,
        payment_status: order.payment_status || 'open',
        created_at: order.createdAt,
        payment_method: order.payment_method,
        due_at: order.due_at,
        payment_terms_days: order.payment_terms_days
      }

      // Send order confirmation to customer
      await emailService.sendOrderConfirmation(emailData)
      
      // Send notification to admin
      await emailService.sendOrderNotification(emailData)
      
      console.log('E-mails verzonden voor order:', order.orderNumber)
      // Do not auto-generate/send invoice on creation anymore; wait until payment is paid
    } catch (emailError) {
      console.error('Error sending e-mails:', emailError)
      // Don't fail the order creation if e-mail sending fails
    }

    return NextResponse.json({
      success: true,
      orderId: docRef.id,
      orderNumber: order.orderNumber
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de bestelling' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is verplicht' },
        { status: 400 }
      )
    }

    const ordersRef = collection(db, 'orders')
    const q = query(
      ordersRef,
      where('customer.id', '==', customerId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)

    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({
      success: true,
      orders
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van bestellingen' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...update } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Order ID is verplicht' },
        { status: 400 }
      )
    }

    update.updatedAt = new Date().toISOString()

    await FirebaseService.updateDocument('orders', id, update)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de bestelling' },
      { status: 500 }
    )
  }
}
