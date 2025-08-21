import { NextRequest, NextResponse } from 'next/server'
import { FirebaseService } from '@/lib/firebase'

function formatIcsDate(dateIso: string): string {
  const d = new Date(dateIso)
  // Convert to UTC basic format YYYYMMDDTHHMMSSZ
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mi = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`
}

function formatIcsDateValue(dateIso: string): string {
  const d = new Date(dateIso)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id') || undefined
    const assignedTo = searchParams.get('assigned_to') || undefined
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let conditions: any[] = []
    if (customerId) conditions.push({ field: 'customer_id', operator: '==', value: customerId })
    if (assignedTo) conditions.push({ field: 'assigned_to', operator: '==', value: assignedTo })

    const list: any[] = await FirebaseService.getDocuments('appointments', conditions)

    const now = new Date()
    const startDefault = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endDefault = new Date(startDefault)
    endDefault.setDate(endDefault.getDate() + 365)
    const startTime = from ? new Date(from).getTime() : startDefault.getTime()
    const endTime = to ? new Date(to).getTime() : endDefault.getTime()

    const filtered = list.filter((a: any) => {
      const t = new Date(a.start_at || a.startAt || 0).getTime()
      return t >= startTime && t <= endTime
    })

    const lines: string[] = []
    lines.push('BEGIN:VCALENDAR')
    lines.push('VERSION:2.0')
    lines.push('PRODID:-//AlloyGator CRM//Appointments//NL')
    lines.push('CALSCALE:GREGORIAN')

    for (const a of filtered) {
      const uid = `appt-${a.id || Math.random().toString(36).slice(2)}@alloygator`
      const isFullDay = !!a.full_day || (a.start_at && a.end_at && (() => {
        try {
          const s = new Date(a.start_at)
          const e = new Date(a.end_at)
          return s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 23
        } catch { return false }
      })())
      lines.push('BEGIN:VEVENT')
      lines.push(`UID:${uid}`)
      lines.push(`SUMMARY:${(a.title || 'Afspraak').toString().replace(/\n/g, ' ')}`)
      if (a.notes) lines.push(`DESCRIPTION:${String(a.notes).replace(/\n/g, '\\n')}`)
      if (a.location) lines.push(`LOCATION:${String(a.location).replace(/\n/g, ' ')}`)
      if (isFullDay) {
        // All day: DTSTART;VALUE=DATE & DTEND;VALUE=DATE (exclusive end)
        const dtStart = formatIcsDateValue(a.start_at)
        // DTEND is next day for all-day events
        const end = new Date(new Date(a.start_at).getTime() + 24*60*60*1000)
        const dtEnd = formatIcsDateValue(end.toISOString())
        lines.push(`DTSTART;VALUE=DATE:${dtStart}`)
        lines.push(`DTEND;VALUE=DATE:${dtEnd}`)
      } else {
        const dtStart = formatIcsDate(a.start_at)
        const dtEnd = formatIcsDate(a.end_at || a.start_at)
        lines.push(`DTSTART:${dtStart}`)
        lines.push(`DTEND:${dtEnd}`)
      }
      lines.push('END:VEVENT')
    }

    lines.push('END:VCALENDAR')
    const body = lines.join('\r\n') + '\r\n'
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    })
  } catch (e) {
    console.error('ICS feed error', e)
    return NextResponse.json({ error: 'Serverfout' }, { status: 500 })
  }
}


