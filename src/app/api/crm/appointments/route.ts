import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    console.log('CRM Appointments API called with params:', { from, to })
    
    // Haal alle afspraken op uit de database
    const appointments = await FirebaseService.getDocuments('appointments')
    
    if (!appointments || appointments.length === 0) {
      console.log('No appointments found in database')
      return NextResponse.json([])
    }
    
    console.log(`Found ${appointments.length} appointments`)
    
    // Filter op datum als from/to parameters zijn opgegeven
    let filteredAppointments = appointments
    
    if (from) {
      const fromDate = new Date(from)
      console.log('Filtering from date:', fromDate.toISOString())
      filteredAppointments = filteredAppointments.filter(apt => {
        // Probeer verschillende datum velden
        const aptDate = new Date(apt.start_at || apt.date || apt.created_at)
        const isValidDate = !isNaN(aptDate.getTime())
        if (!isValidDate) {
          console.log('Invalid date for appointment:', apt.id, apt.start_at, apt.date, apt.created_at)
          return false
        }
        const result = aptDate >= fromDate
        console.log(`Appointment ${apt.id}: ${aptDate.toISOString()} >= ${fromDate.toISOString()} = ${result}`)
        return result
      })
    }
    
    if (to) {
      const toDate = new Date(to)
      console.log('Filtering to date:', toDate.toISOString())
      filteredAppointments = filteredAppointments.filter(apt => {
        // Probeer verschillende datum velden
        const aptDate = new Date(apt.start_at || apt.date || apt.created_at)
        const isValidDate = !isNaN(aptDate.getTime())
        if (!isValidDate) {
          console.log('Invalid date for appointment:', apt.id, apt.start_at, apt.date, apt.created_at)
          return false
        }
        const result = aptDate <= toDate
        console.log(`Appointment ${apt.id}: ${aptDate.toISOString()} <= ${toDate.toISOString()} = ${result}`)
        return result
      })
    }
    
    console.log(`Returning ${filteredAppointments.length} filtered appointments`)
    
    return NextResponse.json(filteredAppointments)
    
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json()
    
    if (!appointmentData) {
      return NextResponse.json({ error: 'Appointment data is required' }, { status: 400 })
    }
    
    // Voeg timestamp toe
    const appointment = {
      ...appointmentData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Sla afspraak op in database
    const result = await FirebaseService.addDocument('appointments', appointment)
    
    return NextResponse.json({ 
      success: true, 
      appointment_id: result.id,
      message: 'Appointment created successfully'
    })
    
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
