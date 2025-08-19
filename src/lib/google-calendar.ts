import { google } from 'googleapis'
import { FirebaseService } from '@/lib/firebase'

export interface GCalConfig {
  serviceAccountEmail: string
  serviceAccountKey: string // JSON string contents of the private key (not base64)
  calendarId: string
}

export function getCalendarClient(config: GCalConfig) {
  const scopes = ['https://www.googleapis.com/auth/calendar']
  const auth = new google.auth.JWT(
    config.serviceAccountEmail,
    undefined,
    config.serviceAccountKey,
    scopes
  )
  return google.calendar({ version: 'v3', auth })
}

export async function upsertEvent(config: GCalConfig, appt: { id: string; title: string; start_at: string; end_at: string; location?: string; notes?: string }) {
  const calendar = getCalendarClient(config)
  const body: any = {
    summary: appt.title || 'Afspraak',
    description: appt.notes || '',
    location: appt.location || undefined,
    start: { dateTime: new Date(appt.start_at).toISOString() },
    end:   { dateTime: new Date(appt.end_at).toISOString() },
    extendedProperties: { private: { crmId: String(appt.id) } }
  }
  try {
    // Zoek event op crmId (private extended property)
    const list = await calendar.events.list({
      calendarId: config.calendarId,
      privateExtendedProperty: `crmId=${String(appt.id)}`,
      maxResults: 1,
      singleEvents: true,
      showDeleted: false,
      orderBy: 'startTime'
    })
    const existing = list.data.items && list.data.items[0]
    if (existing && existing.id) {
      await calendar.events.update({ calendarId: config.calendarId, eventId: existing.id, requestBody: body })
      return { action: 'updated', id: existing.id }
    }
    const created = await calendar.events.insert({ calendarId: config.calendarId, requestBody: body })
    return { action: 'created', id: created.data.id }
  } catch (e) {
    throw e
  }
}

export async function deleteEvent(config: GCalConfig, apptId: string) {
  const calendar = getCalendarClient(config)
  const eventId = `crm-${apptId}`
  try {
    await calendar.events.delete({ calendarId: config.calendarId, eventId })
    return true
  } catch {
    return false
  }
}

export async function resolveGCalConfig(): Promise<GCalConfig | null> {
  try {
    const docs = await FirebaseService.getDocuments('settings')
    const s: any = Array.isArray(docs) && docs.length > 0 ? docs[0] : null
    const emailS = s?.gcal_service_account_email || s?.gcalServiceAccountEmail || ''
    const keyS = s?.gcal_service_account_key || s?.gcalServiceAccountKey || ''
    const calS = s?.gcal_calendar_id || s?.gcalCalendarId || ''
    if (emailS && keyS && calS) {
      const normalizedKey = String(keyS).replace(/\\n/g, '\n').replace(/\r\n/g, '\n')
      return { serviceAccountEmail: String(emailS), serviceAccountKey: normalizedKey, calendarId: String(calS) }
    }
  } catch {}
  const email = process.env.GCAL_SERVICE_ACCOUNT_EMAIL || ''
  const key = (process.env.GCAL_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n')
  const calendarId = process.env.GCAL_CALENDAR_ID || ''
  if (!email || !key || !calendarId) return null
  return { serviceAccountEmail: email, serviceAccountKey: key, calendarId }
}


