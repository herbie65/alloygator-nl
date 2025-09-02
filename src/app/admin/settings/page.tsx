'use client'

import { useState, useEffect } from 'react'
import { FirebaseClientService } from '@/lib/firebase-client'
import { useSearchParams } from 'next/navigation'

export default function SettingsPage() {
  const params = useSearchParams()
  const currentTab = (params.get('tab') || 'general') as 'general'|'shipping'|'payments'|'email'|'dhl'|'taxmap'|'social'|'crm'|'data'
  
  // Database state voor BTW instellingen
  const [vatSettings, setVatSettings] = useState<any[]>([])
  const [loadingVat, setLoadingVat] = useState(true)
  
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    vatNumber: '',
    googleMapsApiKey: '',
    analyticsGoogle: '',
    socialFacebook: '',
    socialInstagram: '',
    facebook_page_id: '',
    facebook_access_token: '',
    instagram_user_id: '',
    instagram_access_token: '',
    socialLinkedin: '',
    mapCenterLat: 52.3676,
    mapCenterLng: 4.9041,
    mapZoom: 7,
    searchRadius: 25,
    // BTW settings - VOLLEDIG uit database, geen hardcoded waarden
    defaultVatRate: 0,
    vatHighRate: 0,
    vatLowRate: 0,
    vatZeroRate: 0,
    showVatAsLastLine: false,
    labelShippingExclVat: false,
    autoReverseChargeEU: false,
    shippingCost: '8.95',
    freeShippingThreshold: '300',
    defaultCarrier: 'postnl',
    enabledCarriers: ['postnl', 'local'],
    shippingMethods: [
      {
        id: 'postnl-standard',
        name: 'PostNL Standaard',
        description: 'Levering binnen 1-2 werkdagen',
        carrier: 'postnl',
        delivery_type: 'standard',
        price: 8.95,
        enabled: true
      },
      {
        id: 'postnl-express',
        name: 'PostNL Express',
        description: 'Levering de volgende werkdag',
        carrier: 'postnl',
        delivery_type: 'morning',
        price: 12.95,
        enabled: false
      },
      {
        id: 'local-pickup',
        name: 'Afhalen (Almere)',
        description: 'Gratis afhalen bij ons magazijn',
        carrier: 'local',
        delivery_type: 'pickup_local',
        price: 0,
        enabled: true
      },
      {
        id: 'dhl-standard',
        name: 'DHL Standaard',
        description: 'Levering binnen 1-2 werkdagen',
        carrier: 'dhl',
        delivery_type: 'standard',
        price: 9.95,
        enabled: false
      },
      {
        id: 'dhl-express',
        name: 'DHL Express',
        description: 'Levering de volgende werkdag',
        carrier: 'dhl',
        delivery_type: 'express',
        price: 14.95,
        enabled: false
      },
      {
        id: 'dhl-pickup',
        name: 'DHL Afhaalpunt',
        description: 'Ophalen bij DHL afhaalpunt',
        carrier: 'dhl',
        delivery_type: 'pickup',
        price: 6.95,
        enabled: false
      }
    ],
    dhlApiUserId: process.env.NEXT_PUBLIC_DHL_API_USER_ID || '',
    dhlApiKey: process.env.NEXT_PUBLIC_DHL_API_KEY || '',
    dhlAccountId: process.env.NEXT_PUBLIC_DHL_ACCOUNT_ID || '',
    dhlTestMode: process.env.NEXT_PUBLIC_DHL_TEST_MODE === 'true',
    mollieApiKey: process.env.NEXT_PUBLIC_MOLLIE_API_KEY || '',
    mollieTestApiKey: process.env.NEXT_PUBLIC_MOLLIE_TEST_API_KEY || '',
    mollieProfileId: process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID || '',
    mollieTestMode: process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true',
    mollieWebhookUrl: process.env.NEXT_PUBLIC_MOLLIE_WEBHOOK_URL || '',
    // E-mail instellingen komen uit database of environment variables
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
    emailNotifications: process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true',
    smtpHost: process.env.NEXT_PUBLIC_SMTP_HOST || '',
    smtpPort: process.env.NEXT_PUBLIC_SMTP_PORT || '',
    smtpUser: process.env.NEXT_PUBLIC_SMTP_USER || '',
    smtpPass: process.env.NEXT_PUBLIC_SMTP_PASS || ''
  })
  // Google Calendar settings (persisted in Firestore settings doc)
  const [gcalEmail, setGcalEmail] = useState('')
  const [gcalKey, setGcalKey] = useState('')
  const [gcalCalendarId, setGcalCalendarId] = useState('')

  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [dhlTestStatus, setDhlTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [dhlTestMessage, setDhlTestMessage] = useState('')
  const [emailTestStatus, setEmailTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [emailTestMessage, setEmailTestMessage] = useState('')
  const [socialTestStatus, setSocialTestStatus] = useState<'idle'|'testing'|'success'|'error'>('idle')
  const [socialTestMessage, setSocialTestMessage] = useState('')
  const [socialPreview, setSocialPreview] = useState<Array<{id:string; platform:'facebook'|'instagram'; image_url:string; permalink:string; caption?:string}>>([])
  const [paymentMethods, setPaymentMethods] = useState<Array<{id:string; name:string; description:string; mollie_id:string; is_active:boolean; fee_percent:number;}>>([])
  const [pmLoading, setPmLoading] = useState(false)
  const [pmError, setPmError] = useState('')
  
  // CRM state
  const [visitTypes, setVisitTypes] = useState<any[]>([])
  const [contactMomentTypes, setContactMomentTypes] = useState<any[]>([])
  const [crmLoading, setCrmLoading] = useState(false)
  const [documentCategories, setDocumentCategories] = useState<Array<{id:string; name:string; description?:string; color?:string; active?:boolean}>>([])
  const [documentPermissions, setDocumentPermissions] = useState<Array<{id:string; name:string; description?:string; level?:number; active?:boolean}>>([])
  const [docMetaLoading, setDocMetaLoading] = useState(false)


  useEffect(() => {
    loadSettings()
    loadVatSettings()
    loadPaymentMethods()
    loadCRMSettings()
    loadDocumentMeta()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const data = await response.json()
      
      if (data && data.length > 0) {
        const savedSettings = data[0];
        
        // Ensure shipping methods have the correct structure
        const fixedShippingMethods = (savedSettings.shippingMethods || []).map((method: any) => {
          if (!method.carrier || !method.delivery_type) {
            const [carrier, deliveryType] = method.id.split('-');
            return {
              ...method,
              carrier: carrier || 'postnl',
              delivery_type: deliveryType || 'standard'
            };
          }
          return method;
        });

        // Ensure enabledCarriers exists
        const enabledCarriers = savedSettings.enabledCarriers || [];
        
        setSettings(prev => ({
          ...prev,
          ...savedSettings,
          // Map database field names to component field names
          googleMapsApiKey: savedSettings.google_maps_api_key || '',
          shippingMethods: fixedShippingMethods, // Geen hardcoded fallbacks meer
          enabledCarriers: Array.from(new Set([...(enabledCarriers || []), 'local'])),
          mollieApiKey: savedSettings.mollieApiKey || savedSettings.mollie_api_key || prev.mollieApiKey,
          mollieTestApiKey: savedSettings.mollieTestApiKey || savedSettings.mollie_test_api_key || prev.mollieTestApiKey,
          mollieProfileId: savedSettings.mollieProfileId || savedSettings.mollie_profile_id || prev.mollieProfileId,
          mollieTestMode: savedSettings.mollieTestMode ?? savedSettings.mollie_test_mode ?? prev.mollieTestMode,
          mollieWebhookUrl: savedSettings.mollieWebhookUrl || savedSettings.mollie_webhook_url || prev.mollieWebhookUrl,
                  // E-mail instellingen komen uit database of environment variables
        adminEmail: savedSettings.adminEmail || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
        emailNotifications: savedSettings.emailNotifications || process.env.NEXT_PUBLIC_EMAIL_NOTIFICATIONS_ENABLED === 'true',
        smtpHost: savedSettings.smtpHost || process.env.NEXT_PUBLIC_SMTP_HOST || '',
        smtpPort: savedSettings.smtpPort || process.env.NEXT_PUBLIC_SMTP_PORT || '',
        smtpUser: savedSettings.smtpUser || process.env.NEXT_PUBLIC_SMTP_USER || '',
        smtpPass: savedSettings.smtpPass || process.env.NEXT_PUBLIC_SMTP_PASS || ''
        }));
        // Load Google Calendar config if present
        setGcalEmail(savedSettings.gcal_service_account_email || savedSettings.gcalServiceAccountEmail || '')
        setGcalKey(savedSettings.gcal_service_account_key || savedSettings.gcalServiceAccountKey || '')
        setGcalCalendarId(savedSettings.gcal_calendar_id || savedSettings.gcalCalendarId || '')
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  // Laad BTW instellingen uit de database
  const loadVatSettings = async () => {
    try {
      setLoadingVat(true)
      const vatData = await FirebaseClientService.getVatSettings()
      
      if (vatData && Array.isArray(vatData)) {
        setVatSettings(vatData)
        
        // Update settings met BTW data uit database - GEEN fallbacks
        const nlVat = vatData.find((v: any) => v.country_code === 'NL')
        if (nlVat) {
          setSettings(prev => ({
            ...prev,
            defaultVatRate: (nlVat as any).standard_rate,
            vatHighRate: (nlVat as any).standard_rate,
            vatLowRate: (nlVat as any).reduced_rate,
            vatZeroRate: (nlVat as any).zero_rate
          }))
        }
      }
    } catch (error) {
      console.error('Error loading VAT settings:', error)
    } finally {
      setLoadingVat(false)
    }
  }



  const loadPaymentMethods = async () => {
    try {
      setPmLoading(true)
      setPmError('')
      const res = await fetch('/api/payment-methods')
      if (!res.ok) throw new Error('Failed to load payment methods')
      const data = await res.json()
      setPaymentMethods(Array.isArray(data) ? data : [])
    } catch (e:any) {
      console.error(e)
      setPmError(e.message || 'Kon betaalmethodes niet laden')
    } finally {
      setPmLoading(false)
    }
  }

  const loadCRMSettings = async () => {
    try {
      setCrmLoading(true)
      // Load CRM settings from Firebase directly
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        // Laad CRM types uit database - geen hardcoded fallbacks meer
        if (data.visitTypes && data.visitTypes.length > 0) {
          setVisitTypes(data.visitTypes)
        } else {
          setVisitTypes([])
        }
        
        if (data.contactMomentTypes && data.contactMomentTypes.length > 0) {
          setContactMomentTypes(data.contactMomentTypes)
        } else {
          setContactMomentTypes([])
        }
      }
    } catch (error) {
      console.error('Error loading CRM settings:', error)
      // Geen hardcoded fallbacks meer - lege arrays bij fout
      setVisitTypes([])
      setContactMomentTypes([])
    } finally {
      setCrmLoading(false)
    }
  }

  const loadDocumentMeta = async () => {
    try {
      setDocMetaLoading(true)
      const [cats, perms] = await Promise.all([
        FirebaseClientService.getDocumentCategories(),
        FirebaseClientService.getDocumentPermissions()
      ])
      setDocumentCategories(Array.isArray(cats) ? (cats as any[]) : [])
      setDocumentPermissions(Array.isArray(perms) ? (perms as any[]) : [])
    } catch (e) {
      console.error('Error loading document meta:', e)
      setDocumentCategories([])
      setDocumentPermissions([])
    } finally {
      setDocMetaLoading(false)
    }
  }

  const togglePaymentMethod = async (id: string, nextActive: boolean) => {
    const method = paymentMethods.find(m => m.id === id)
    if (!method) return
    const updated = { ...method, is_active: nextActive }
    await fetch('/api/payment-methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) })
    setPaymentMethods(prev => prev.map(m => m.id === id ? updated : m))
  }

  const updatePaymentFee = async (id: string, nextFeePercent: number) => {
    const method = paymentMethods.find(m => m.id === id)
    if (!method) return
    const updated = { ...method, fee_percent: nextFeePercent }
    await fetch('/api/payment-methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...updated, fees: nextFeePercent }) })
    setPaymentMethods(prev => prev.map(m => m.id === id ? updated : m))
  }

  const addPaymentMethod = async (payload: { name:string; description:string; mollie_id:string; fee_percent:number }) => {
    const body = { ...payload, is_active: true, fees: payload.fee_percent }
    const res = await fetch('/api/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      await loadPaymentMethods()
    }
  }

  const deletePaymentMethod = async (id: string) => {
    const url = `/api/payment-methods?id=${encodeURIComponent(id)}`
    const res = await fetch(url, { method: 'DELETE' })
    if (res.ok) {
      setPaymentMethods(prev => prev.filter(m => m.id !== id))
    }
  }

  const handleSave = async () => {
    try {
      setSaveStatus('saving')
      
      // Sla eerst BTW instellingen op in de database
      if (vatSettings.length > 0) {
        const nlVat = vatSettings.find((v: any) => v.country_code === 'NL')
        if (nlVat) {
          const updatedVatData = {
            ...nlVat,
            standard_rate: settings.vatHighRate,
            reduced_rate: settings.vatLowRate,
            zero_rate: settings.vatZeroRate,
            updated_at: new Date().toISOString()
          }
          
          // Update in database
          await FirebaseClientService.updateVatSettings(nlVat.id, updatedVatData)
        }
      }
      
      // Prepare settings for database (map component field names to database field names)
      // E-mail instellingen worden NIET opgeslagen - deze komen uit environment variables
      const settingsForDatabase = {
        ...settings,
        google_maps_api_key: settings.googleMapsApiKey,
        gcal_service_account_email: gcalEmail,
        gcal_service_account_key: gcalKey,
        gcal_calendar_id: gcalCalendarId,
        // E-mail instellingen worden NIET opgeslagen in database
        // Deze komen uit Vercel Environment Variables
      }
      
      console.log('💾 Instellingen opslaan via API...');
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsForDatabase),
      })

      const result = await response.json();
      console.log('📡 API response:', { status: response.status, ok: response.ok, result });

      if (response.ok) {
        setSaveStatus('success')
        console.log('✅ Instellingen succesvol opgeslagen');
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        setSaveStatus('error')
        console.error('❌ Fout bij opslaan:', result.message || 'Onbekende fout');
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDhlTest = async () => {
    try {
      setDhlTestStatus('testing')
      setDhlTestMessage('')

      const response = await fetch('/api/dhl/test-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUserId: settings.dhlApiUserId,
          apiKey: settings.dhlApiKey,
          accountId: settings.dhlAccountId,
          testMode: settings.dhlTestMode
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setDhlTestStatus('success')
        setDhlTestMessage(result.message)
      } else {
        setDhlTestStatus('error')
        setDhlTestMessage(result.message || 'Onbekende fout')
      }
    } catch (error) {
      console.error('Error testing DHL authentication:', error)
      setDhlTestStatus('error')
      setDhlTestMessage('❌ Connection error - check your internet connection')
    }
  }

  const testEmailConfiguration = async () => {
    try {
      setEmailTestStatus('testing')
      setEmailTestMessage('')

      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Alle SMTP instellingen uit de database
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          // Admin instellingen
          adminEmail: settings.adminEmail,
          emailNotifications: settings.emailNotifications
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEmailTestStatus('success')
        setEmailTestMessage('✅ E-mail configuratie werkt correct!')
      } else {
        setEmailTestStatus('error')
        setEmailTestMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      console.error('Error testing email configuration:', error)
      setEmailTestStatus('error')
      setEmailTestMessage('❌ Connection error - check your internet connection')
    }
  }



  const toggleShippingMethod = (methodId: string) => {
    setSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === methodId 
          ? { ...method, enabled: !method.enabled }
          : method
      )
    }))
  }

  const updateShippingMethodPrice = (methodId: string, price: number) => {
    setSettings(prev => ({
      ...prev,
      shippingMethods: prev.shippingMethods.map(method => 
        method.id === methodId 
          ? { ...method, price }
          : method
      )
    }))
  }

  const toggleCarrier = (carrier: string) => {
    setSettings(prev => ({
      ...prev,
      enabledCarriers: prev.enabledCarriers.includes(carrier)
        ? prev.enabledCarriers.filter(c => c !== carrier)
        : [...prev.enabledCarriers, carrier]
    }))
  }

  const getCarrierName = (carrier: string) => {
    switch (carrier) {
      case 'postnl': return 'PostNL'
      case 'dhl': return 'DHL'
      case 'dpd': return 'DPD'
      case 'local': return 'Afhalen'
      default: return carrier
    }
  }

  const getDeliveryTypeName = (type: string) => {
    switch (type) {
      case 'standard': return 'Standaard'
      case 'morning': return 'Ochtend'
      case 'evening': return 'Avond'
      case 'express': return 'Express'
      case 'pickup': return 'Afhaalpunt'
      case 'pickup_local': return 'Afhalen (magazijn)'
      default: return type
    }
  }

  // CRM functions
  const addVisitType = async (type: { name: string; description: string; color: string }) => {
    try {
      const newType = { ...type, id: Date.now().toString(), active: true }
      const updatedTypes = [...visitTypes, newType]
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          visitTypes: updatedTypes 
        })
      })
      setVisitTypes(updatedTypes)
    } catch (error) {
      console.error('Error adding visit type:', error)
    }
  }

  const updateVisitType = async (id: string, updates: Partial<any>) => {
    try {
      const updatedTypes = visitTypes.map(type => 
        type.id === id ? { ...type, ...updates } : type
      )
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          visitTypes: updatedTypes 
        })
      })
      setVisitTypes(updatedTypes)
    } catch (error) {
      console.error('Error updating visit type:', error)
    }
  }

  const deleteVisitType = async (id: string) => {
    try {
      const updatedTypes = visitTypes.filter(type => type.id !== id)
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          visitTypes: updatedTypes 
        })
      })
      setVisitTypes(updatedTypes)
    } catch (error) {
      console.error('Error deleting visit type:', error)
    }
  }

  const addContactMomentType = async (type: { name: string; description: string; color: string }) => {
    try {
      const newType = { ...type, id: Date.now().toString(), active: true }
      const updatedTypes = [...contactMomentTypes, newType]
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          contactMomentTypes: updatedTypes 
        })
      })
      setContactMomentTypes(updatedTypes)
    } catch (error) {
      console.error('Error adding contact moment type:', error)
    }
  }

  const updateContactMomentType = async (id: string, updates: Partial<any>) => {
    try {
      const updatedTypes = contactMomentTypes.map(type => 
        type.id === id ? { ...type, ...updates } : type
      )
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          contactMomentTypes: updatedTypes 
        })
      })
      setContactMomentTypes(updatedTypes)
    } catch (error) {
      console.error('Error updating contact moment type:', error)
    }
  }

  const deleteContactMomentType = async (id: string) => {
    try {
      const updatedTypes = contactMomentTypes.filter(type => type.id !== id)
      // Save to existing settings API
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...settings,
          contactMomentTypes: updatedTypes 
        })
      })
      setContactMomentTypes(updatedTypes)
    } catch (error) {
      console.error('Error deleting contact moment type:', error)
    }
  }

  // Document categories CRUD
  const addDocumentCategory = async () => {
    const name = prompt('Naam van categorie:')
    if (!name) return
    const description = prompt('Beschrijving:') || ''
    const color = prompt('Kleur (hex, optioneel):', '#6B7280') || '#6B7280'
    const payload = { name, description, color, active: true }
    const created = await FirebaseClientService.addDocument('document_categories', payload)
    setDocumentCategories(prev => [{ id: (created as any).id, ...payload }, ...prev])
  }

  const updateDocumentCategory = async (id: string, current: any) => {
    const name = prompt('Nieuwe naam:', current.name) || current.name
    const description = prompt('Nieuwe beschrijving:', current.description || '') || ''
    const color = prompt('Kleur (hex):', current.color || '#6B7280') || '#6B7280'
    const updates = { name, description, color }
    await FirebaseClientService.updateDocumentInCollection('document_categories', id, updates)
    setDocumentCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteDocumentCategory = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je categorie "${name}" wilt verwijderen?`)) return
    await FirebaseClientService.deleteDocumentFromCollection('document_categories', id)
    setDocumentCategories(prev => prev.filter(c => c.id !== id))
  }

  // Document Permissions CRUD
  const addDocumentPermission = async () => {
    const name = prompt('Naam van permissie:')
    if (!name) return
    const description = prompt('Beschrijving:') || ''
    const levelStr = prompt('Niveau (getal, lager = beperkter):', '1') || '1'
    const level = parseInt(levelStr, 10) || 1
    const payload = { name, description, level, active: true }
    const created = await FirebaseClientService.addDocument('document_permissions', payload)
    setDocumentPermissions(prev => [{ id: (created as any).id, ...payload }, ...prev])
  }

  const updateDocumentPermission = async (id: string, current: any) => {
    const name = prompt('Nieuwe naam:', current.name) || current.name
    const description = prompt('Nieuwe beschrijving:', current.description || '') || ''
    const level = parseInt(prompt('Niveau:', String(current.level ?? 1)) || String(current.level ?? 1), 10) || (current.level ?? 1)
    const updates = { name, description, level }
    await FirebaseClientService.updateDocumentInCollection('document_permissions', id, updates)
    setDocumentPermissions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteDocumentPermission = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je permissie "${name}" wilt verwijderen?`)) return
    await FirebaseClientService.deleteDocumentFromCollection('document_permissions', id)
    setDocumentPermissions(prev => prev.filter(p => p.id !== id))
  }

  function PaymentMethodForm({ onSubmit }: { onSubmit: (payload: { name:string; description:string; mollie_id:string; fee_percent:number }) => Promise<void> }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [mollieId, setMollieId] = useState('ideal')
    const [feePercent, setFeePercent] = useState(0)
    const [saving, setSaving] = useState(false)

    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      try {
        setSaving(true)
        await onSubmit({ name, description, mollie_id: mollieId, fee_percent: feePercent })
        setName('')
        setDescription('')
        setMollieId('ideal')
        setFeePercent(0)
      } finally {
        setSaving(false)
      }
    }

    return (
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Naam</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Omschrijving</label>
          <input value={description} onChange={(e)=>setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Methode (Mollie ID)</label>
          <select value={mollieId} onChange={(e)=>setMollieId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="ideal">iDEAL (0%)</option>
            <option value="creditcard">Creditcard (+5%)</option>
            <option value="paypal">PayPal (+5%)</option>
            <option value="applepay">Apple Pay (0%)</option>
            <option value="bancontact">Bancontact (0%)</option>
            <option value="banktransfer">Bankoverschrijving (0%)</option>
            <option value="belfius">Belfius (0%)</option>
            <option value="kbc">KBC (0%)</option>
            <option value="klarna">Klarna (0%)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kosten/Korting (%)</label>
          <input type="number" step="0.1" value={feePercent} onChange={(e)=>setFeePercent(parseFloat(e.target.value || '0'))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="md:col-span-5">
          <button disabled={saving} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {saving ? 'Opslaan...' : 'Toevoegen'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-600">Configureer website instellingen</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[
            {id:'general',label:'Algemeen'},
            {id:'shipping',label:'Verzending'},
            {id:'payments',label:'Betalingen'},
            {id:'email',label:'E-mail'},
            {id:'dhl',label:'DHL'},
            {id:'social',label:'Social media'},
            {id:'taxmap',label:'BTW/Map'},
            {id:'crm',label:'CRM'},
            {id:'data',label:'Data (Import/Export)'}
          ].map(t=> (
            <a key={t.id} href={`/admin/settings?tab=${t.id}`} className={`px-3 py-1 rounded border ${currentTab===t.id ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{t.label}</a>
          ))}
        </div>
      </div>
      {currentTab==='data' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Data import/export</h2>
            <p className="text-sm text-gray-600">Exporteer of importeer klanten en producten.</p>
          </div>
          <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Exporteer klanten</h3>
                <p className="text-sm text-gray-600 mb-3">Download een CSV met alle klantenvelden.</p>
                <button onClick={async()=>{
                  try{
                    const list = await FirebaseClientService.getCustomers()
                    const link = document.createElement('a')
                    const header = ['id','name','email','phone','company_name','address','city','postal_code','country','is_dealer','dealer_group','total_orders','total_spent','created_at']
                    const rows = [header.join(',')]
                    for(const c of (list||[]) as any[]){
                      const vals = header.map(k=>{
                        let v = (c as any)[k]
                        if (k==='is_dealer') v = v? 'ja':'nee'
                        if (v===null||v===undefined) v=''
                        if (typeof v==='string' && (v.includes(',')||v.includes('"'))) v = '"'+v.replace(/\"/g,'""')+'"'
                        return v
                      })
                      rows.push(vals.join(','))
                    }
                    const blob = new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'})
                    const url = URL.createObjectURL(blob)
                    link.href = url
                    link.download = `klanten_export_${new Date().toISOString().slice(0,10)}.csv`
                    link.click()
                    URL.revokeObjectURL(url)
                  }catch(e){ alert('Fout bij exporteren klanten') }
                }} className="bg-green-600 text-white px-4 py-2 rounded">Export Klanten (CSV)</button>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Importeer klanten</h3>
                <p className="text-sm text-gray-600 mb-3">Upload een CSV en voeg klanten toe.</p>
                <input type="file" accept=".csv" onChange={async(e)=>{
                  const f = e.target.files?.[0]; if(!f) return
                  const text = await f.text()
                  const lines = text.split('\n').filter(Boolean)
                  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,''))
                  const find = (k:string)=> headers.findIndex(h=> h.toLowerCase()===k.toLowerCase())
                  const idx = { email: find('email'), name: find('name'), phone: find('phone'), company_name: find('company_name'), address: find('address'), city: find('city'), postal_code: find('postal_code'), country: find('country') }
                  let ok=0, fail=0
                  for(let i=1;i<lines.length;i++){
                    const cols = lines[i].split(',')
                    const payload:any = { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), status:'active' }
                    Object.entries(idx).forEach(([k,ix])=>{ if(ix>=0) payload[k]= (cols[ix]||'').replace(/"/g,'') })
                    if(!payload.email) { fail++; continue }
                    try { await FirebaseClientService.addCustomer(payload as any); ok++ } catch { fail++ }
                  }
                  alert(`Import voltooid: ${ok} toegevoegd, ${fail} fouten`)
                  e.currentTarget.value=''
                }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Exporteer producten</h3>
                <p className="text-sm text-gray-600 mb-3">Download een CSV met productvelden.</p>
                <button onClick={async()=>{
                  try{
                    const list = await FirebaseClientService.getProducts()
                    const header = ['id','name','price','sku','stock','category']
                    const rows = [header.join(',')]
                    for(const p of (list||[]) as any[]){
                      const vals = header.map(k=>{
                        let v = (p as any)[k]
                        if (v===null||v===undefined) v=''
                        if (typeof v==='string' && (v.includes(',')||v.includes('"'))) v = '"'+v.replace(/\"/g,'""')+'"'
                        return v
                      })
                      rows.push(vals.join(','))
                    }
                    const blob = new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'})
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = `producten_export_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url)
                  }catch{ alert('Fout bij exporteren producten') }
                }} className="bg-green-600 text-white px-4 py-2 rounded">Export Producten (CSV)</button>
              </div>
              <div className="border rounded p-4">
                <h3 className="font-semibold mb-2">Importeer producten</h3>
                <p className="text-sm text-gray-600 mb-3">Upload een CSV en voeg producten toe.</p>
                <input type="file" accept=".csv" onChange={async(e)=>{
                  const f=e.target.files?.[0]; if(!f) return
                  const text = await f.text()
                  const lines = text.split('\n').filter(Boolean)
                  const headers = lines[0].split(',').map(h=>h.trim().replace(/"/g,''))
                  const get = (row:string[], key:string)=>{ const i = headers.findIndex(h=> h.toLowerCase()===key.toLowerCase()); return i>=0? row[i]:'' }
                  let ok=0, fail=0
                  for(let i=1;i<lines.length;i++){
                    const cols = lines[i].split(',')
                    const payload:any = {
                      name: get(cols,'name'),
                      price: parseFloat(get(cols,'price')||'0'),
                      sku: get(cols,'sku'),
                      stock: parseInt(get(cols,'stock')||'0',10),
                      category: get(cols,'category')
                    }
                    try { await FirebaseClientService.addDocument('products', payload); ok++ } catch { fail++ }
                  }
                  alert(`Import voltooid: ${ok} toegevoegd, ${fail} fouten`)
                  e.currentTarget.value=''
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
      {currentTab==='general' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Algemene Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Naam
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Beschrijving
              </label>
              <input
                type="text"
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Telefoon
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({...settings, contactPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({...settings, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BTW Nummer
            </label>
            <input
              type="text"
              value={settings.vatNumber}
              onChange={(e) => setSettings({...settings, vatNumber: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>


        </div>
      </div>)}

      {currentTab==='crm' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">CRM Instellingen</h2>
            <p className="text-sm text-gray-600">Configureer bezoek types en contact moment types</p>
          </div>
          <div className="p-6 space-y-8">
            {/* Koppeling agenda */}
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Agenda koppelen</h3>
              <p className="text-sm text-gray-600">We schakelen over naar Google Calendar voor 2‑wegs synchronisatie met Apple (via Google‑account in Apple Calendar).</p>
              <p className="text-xs text-gray-500 mt-1">Note: ICS‑knop is verwijderd op verzoek.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service account email</label>
                  <input value={gcalEmail} onChange={(e)=> setGcalEmail(e.target.value)} placeholder="service-account@project.iam.gserviceaccount.com" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calendar ID</label>
                  <input value={gcalCalendarId} onChange={(e)=> setGcalCalendarId(e.target.value)} placeholder="jouw@gmail.com of agenda-id" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Private key (exact overnemen, met echte enters of \n)</label>
                  <textarea value={gcalKey} onChange={(e)=> setGcalKey(e.target.value)} placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={async ()=>{
                    const id = prompt('Voer een afspraak ID in om te syncen (test):')
                    if (!id) return
                    const res = await fetch('/api/crm/appointments/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id }) })
                    alert(res.ok ? 'Sync gestart/voltooid' : 'Fout bij sync')
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Test sync met Google Calendar
                </button>
                <span className="text-xs text-gray-500">Zorg dat env vars zijn gezet: GCAL_SERVICE_ACCOUNT_EMAIL, GCAL_SERVICE_ACCOUNT_KEY, GCAL_CALENDAR_ID</span>
              </div>
            </div>
            {/* Visit Types ... bestaande sectie blijft ongewijzigd */}
          </div>
        </div>
      )}

      {/* Document meta beheer */}
      {currentTab==='crm' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Documenten: Categorieën & Permissies</h2>
            <p className="text-sm text-gray-600">Beheer categorieën en permissies voor Documenten Beheer</p>
          </div>
          <div className="p-6 space-y-8">
            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Categorieën</h3>
                <button onClick={addDocumentCategory} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">+ Nieuwe Categorie</button>
              </div>
              {docMetaLoading ? (
                <div>Gegevens laden…</div>
              ) : (
                <div className="space-y-2">
                  {documentCategories.length === 0 && (
                    <div className="text-sm text-gray-500">Nog geen categorieën.</div>
                  )}
                  {documentCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color || '#6B7280' }} />
                        <div>
                          <div className="font-medium text-gray-900">{cat.name}</div>
                          {cat.description && <div className="text-sm text-gray-600">{cat.description}</div>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => updateDocumentCategory(cat.id, cat)} className="text-blue-600 hover:text-blue-800 text-sm">Bewerken</button>
                        <button onClick={() => deleteDocumentCategory(cat.id, cat.name)} className="text-red-600 hover:text-red-800 text-sm">Verwijderen</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Permissies</h3>
                <button onClick={addDocumentPermission} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">+ Nieuwe Permissie</button>
              </div>
              {docMetaLoading ? (
                <div>Gegevens laden…</div>
              ) : (
                <div className="space-y-2">
                  {documentPermissions.length === 0 && (
                    <div className="text-sm text-gray-500">Nog geen permissies.</div>
                  )}
                  {documentPermissions.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{p.name} {typeof p.level === 'number' && <span className="text-xs text-gray-500">(niveau {p.level})</span>}</div>
                        {p.description && <div className="text-sm text-gray-600">{p.description}</div>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => updateDocumentPermission(p.id, p)} className="text-blue-600 hover:text-blue-800 text-sm">Bewerken</button>
                        <button onClick={() => deleteDocumentPermission(p.id, p.name)} className="text-red-600 hover:text-red-800 text-sm">Verwijderen</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {currentTab==='payments' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mollie Configuratie</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mollie Webhook URL
              </label>
              <input
                type="text"
                value={settings.mollieWebhookUrl || ''}
                onChange={(e) => setSettings({...settings, mollieWebhookUrl: e.target.value})}
                placeholder="https://jouw-domein.nl/api/payment/mollie/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Webhook URL voor betalingsnotificaties (configureer in Vercel console)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mollie Profile ID
              </label>
              <input
                type="text"
                value={settings.mollieProfileId || ''}
                onChange={(e) => setSettings({...settings, mollieProfileId: e.target.value})}
                placeholder="pfl_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">Profile ID voor betalingen (configureer in Vercel console)</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mollie Test Mode
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.mollieTestMode}
                  onChange={(e) => setSettings({...settings, mollieTestMode: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Testmodus gebruiken</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Gebruik test API key in plaats van live</p>
            </div>
          </div>
          
          {/* Test Mollie verbinding knop */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={async () => {
                try {
                  // Test Mollie API verbinding
                  const response = await fetch('/api/test/mollie')
                  const result = await response.json()
                  
                  if (response.ok && result.success) {
                    alert(`✅ Mollie verbinding succesvol!\n\n${result.message}\n\nDetails:\n- API Key: ${result.details?.hasApiKey ? '✅ Geconfigureerd' : '❌ Niet geconfigureerd'}\n- Profile ID: ${result.details?.hasProfileId ? '✅ Geconfigureerd' : '❌ Niet geconfigureerd'}\n- Test Mode: ${result.details?.testMode ? 'Aan' : 'Uit'}\n- Status: ${result.details?.status || 'Onbekend'}\n\nMollie is klaar voor gebruik!`)
                  } else {
                    alert(`❌ Mollie verbinding mislukt:\n\n${result.message || 'Onbekende fout'}\n\nDetails:\n- Status: ${result.details?.status || 'Onbekend'}\n- Fout: ${result.details?.error || 'Geen details'}`)
                  }
                } catch (error) {
                  console.error('Test Mollie verbinding fout:', error)
                  alert(`❌ Test verbinding mislukt:\n\n${error.message || 'Onbekende fout'}`)
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              💳 Test Mollie Verbinding
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Test of de Mollie API correct is geconfigureerd en werkt.
            </p>
          </div>
        </div>
      </div>)}

      {currentTab==='payments' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Betalingsmethodes</h2>
          <p className="text-sm text-gray-600">Zet methodes aan/uit en stel extra kosten of korting in (negatief bedrag is korting).</p>
        </div>
        <div className="p-6 space-y-6">
          {pmError && (
            <div className="bg-red-100 text-red-700 rounded p-3 text-sm">{pmError}</div>
          )}
          {pmLoading ? (
            <div>Betalingsmethodes laden...</div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={m.is_active}
                      onChange={(e) => togglePaymentMethod(m.id, e.target.checked)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{m.name} <span className="text-xs text-gray-500">({m.mollie_id})</span></div>
                      <div className="text-sm text-gray-600">{m.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">%</span>
                    <input
                      type="number"
                      step="0.1"
                      value={m.fee_percent}
                      onChange={(e) => updatePaymentFee(m.id, parseFloat(e.target.value || '0'))}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button onClick={() => deletePaymentMethod(m.id)} className="ml-2 text-red-600 text-sm hover:underline">Verwijderen</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Nieuwe methode toevoegen</h3>
            <PaymentMethodForm onSubmit={addPaymentMethod} />
          </div>
        </div>
      </div>)}

      {currentTab==='dhl' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">DHL eCommerce API Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DHL API User ID
              </label>
              <input
                type="text"
                value={settings.dhlApiUserId}
                onChange={(e) => setSettings({...settings, dhlApiUserId: e.target.value})}
                placeholder="DHL API User ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DHL API Key
              </label>
              <input
                type="password"
                value={settings.dhlApiKey}
                onChange={(e) => setSettings({...settings, dhlApiKey: e.target.value})}
                placeholder="DHL API Key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DHL Account ID
              </label>
              <input
                type="text"
                value={settings.dhlAccountId}
                onChange={(e) => setSettings({...settings, dhlAccountId: e.target.value})}
                placeholder="DHL Account ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.dhlTestMode}
                  onChange={(e) => setSettings({...settings, dhlTestMode: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Testmodus gebruiken</span>
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleDhlTest}
              disabled={dhlTestStatus === 'testing'}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {dhlTestStatus === 'testing' ? 'Testen...' : 'Test DHL Verbinding'}
            </button>
            {dhlTestStatus !== 'idle' && (
              <div className={`text-sm ${
                dhlTestStatus === 'success' ? 'text-green-600' : 
                dhlTestStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {dhlTestMessage}
              </div>
            )}
          </div>
        </div>
      </div>)}

      {currentTab==='email' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">E-mail Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">SMTP Instellingen</h3>
            <p className="text-blue-700 text-sm mb-3">
              <strong>ℹ️ Info:</strong> SMTP instellingen worden automatisch geladen uit Vercel Environment Variables.
              Deze kunnen alleen in de Vercel Console worden gewijzigd.
            </p>
            <div className="mt-3 text-xs text-blue-600">
              <strong>Tip:</strong> Gebruik de "Test Verbinding" knop hieronder om te controleren of de SMTP instellingen correct zijn ingesteld.
            </div>
          </div>



          <div className="flex items-center space-x-4">
            <button
              onClick={testEmailConfiguration}
              disabled={!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass || emailTestStatus === 'testing'}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {emailTestStatus === 'testing' ? 'Testen...' : 'Test E-mail Configuratie'}
            </button>
            {emailTestMessage && (
              <span className={`text-sm ${emailTestStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {emailTestMessage}
              </span>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <h3 className="font-semibold text-green-900 mb-2">ℹ️ E-mail Notificaties</h3>
            <p className="text-sm text-green-700">
              Met e-mail notificaties ontvangen klanten automatisch bestelbevestigingen en status updates. 
              Voor Gmail gebruik je een app-wachtwoord in plaats van je normale wachtwoord.
            </p>
          </div>
        </div>
      </div>)}



      {currentTab==='social' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Social media</h2>
            <p className="text-sm text-gray-600">Configureer Facebook en Instagram feed voor de pagina Foto's & media.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Page ID</label>
                <input type="text" value={settings.facebook_page_id} onChange={(e)=>setSettings({...settings, facebook_page_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Access Token</label>
                <input type="password" value={settings.facebook_access_token} onChange={(e)=>setSettings({...settings, facebook_access_token: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram User ID</label>
                <input type="text" value={settings.instagram_user_id} onChange={(e)=>setSettings({...settings, instagram_user_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Access Token</label>
                <input type="password" value={settings.instagram_access_token} onChange={(e)=>setSettings({...settings, instagram_access_token: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
              Tip: Je kunt deze waarden ook via environment variables instellen. Waarden hier overschrijven de env-waarden.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async ()=>{
                  try {
                    setSocialTestStatus('testing')
                    setSocialTestMessage('')
                    setSocialPreview([])
                    const res = await fetch('/api/social/feed?platform=instagram', { cache: 'no-store' })
                    const data = await res.json()
                    
                    if (!data.success) {
                      setSocialTestStatus('error')
                      setSocialTestMessage(data.message || 'Fout bij ophalen feed')
                      return
                    }
                    
                    const items = Array.isArray(data?.items) ? data.items : []
                    if (items.length === 0) {
                      setSocialTestStatus('error')
                      setSocialTestMessage('Geen items ontvangen (controleer tokens/permissions)')
                    } else {
                      setSocialTestStatus('success')
                      setSocialPreview(items.slice(0,3))
                      setSocialTestMessage(`Feed werkt. Onderstaand een preview van ${items.length} posts.`)
                    }
                  } catch (e:any) {
                    setSocialTestStatus('error')
                    setSocialTestMessage(e.message || 'Fout bij ophalen feed')
                  }
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {socialTestStatus==='testing' ? 'Testen…' : 'Feed testen'}
              </button>
              {socialTestMessage && (
                <pre className={`text-sm whitespace-pre-wrap ${socialTestStatus==='success' ? 'text-green-700' : 'text-red-700'}`}>{socialTestMessage}</pre>
              )}
            </div>
            {socialPreview.length>0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {socialPreview.map((it)=> (
                  <a key={it.id} href={it.permalink} target="_blank" rel="noreferrer" className="block border rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image_url} alt={it.caption || 'post'} className="w-full h-48 object-cover" />
                    <div className="px-3 py-2 text-xs text-gray-600 flex justify-between">
                      <span className="uppercase">{it.platform}</span>
                      <span>Bekijken →</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab==='taxmap' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">BTW en Kaartinstellingen</h2>
            <p className="text-sm text-gray-600">Configureer BTW weergave en instellingen voor de dealerkaart.</p>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">BTW</h3>
              {loadingVat && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">BTW instellingen laden uit database...</p>
                </div>
              )}
              
              {/* Toon alle landen met BTW instellingen */}
              {vatSettings.length > 0 && (
                <div className="space-y-4">
                  {vatSettings.map((vatCountry: any) => (
                    <div key={vatCountry.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {vatCountry.country_code} - {vatCountry.description}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Standaard tarief (%)</label>
                          <input 
                            type="number" 
                            value={vatCountry.country_code === 'NL' ? settings.vatHighRate : vatCountry.standard_rate} 
                            onChange={(e) => {
                              if (vatCountry.country_code === 'NL') {
                                setSettings(prev => ({...prev, vatHighRate: parseInt(e.target.value || '0', 10)}))
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Verlaagd tarief (%)</label>
                          <input 
                            type="number" 
                            value={vatCountry.country_code === 'NL' ? settings.vatLowRate : vatCountry.reduced_rate} 
                            onChange={(e) => {
                              if (vatCountry.country_code === 'NL') {
                                setSettings(prev => ({...prev, vatLowRate: parseInt(e.target.value || '0', 10)}))
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nultarief (%)</label>
                          <input 
                            type="number" 
                            value={vatCountry.country_code === 'NL' ? settings.vatZeroRate : vatCountry.zero_rate} 
                            onChange={(e) => {
                              if (vatCountry.country_code === 'NL') {
                                setSettings(prev => ({...prev, vatZeroRate: parseInt(e.target.value || '0', 10)}))
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                          />
                        </div>
                      </div>
                      {vatCountry.country_code === 'NL' && (
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Nederlandse BTW instellingen worden opgeslagen via de hoofdknop "Instellingen Opslaan"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* BTW Weergave Instellingen */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">BTW Weergave Instellingen</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input id="showVatAsLastLine" type="checkbox" checked={settings.showVatAsLastLine} onChange={(e)=> setSettings(prev=>({...prev, showVatAsLastLine: e.target.checked}))} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                    <label htmlFor="showVatAsLastLine" className="ml-2 text-sm text-gray-700">Toon BTW altijd als laatste regel</label>
                  </div>
                  <div className="flex items-center">
                    <input id="labelShippingExclVat" type="checkbox" checked={settings.labelShippingExclVat} onChange={(e)=> setSettings(prev=>({...prev, labelShippingExclVat: e.target.checked}))} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                    <label htmlFor="labelShippingExclVat" className="ml-2 text-sm text-gray-700">Label verzendkosten als excl. BTW</label>
                  </div>
                  <div className="flex items-center">
                    <input id="autoReverseChargeEU" type="checkbox" checked={settings.autoReverseChargeEU} onChange={(e)=> setSettings(prev=>({...prev, autoReverseChargeEU: e.target.checked}))} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                    <label htmlFor="autoReverseChargeEU" className="ml-2 text-sm text-gray-700">BTW verleggen automatisch bij geldig EU BTW (niet NL)</label>
                  </div>
                </div>
              </div>
              
              {/* BTW Database Info */}
              {vatSettings.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    ✅ BTW instellingen geladen uit database ({vatSettings.length} landen)
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Huidige waarden komen uit de vat_settings collectie
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-3">Kaart</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Midden (lat)</label>
                  <input type="number" step="0.0001" value={settings.mapCenterLat} onChange={(e)=> setSettings(prev=>({...prev, mapCenterLat: parseFloat(e.target.value||'0')}))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Midden (lng)</label>
                  <input type="number" step="0.0001" value={settings.mapCenterLng} onChange={(e)=> setSettings(prev=>({...prev, mapCenterLng: parseFloat(e.target.value||'0')}))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zoom</label>
                  <input type="number" value={settings.mapZoom} onChange={(e)=> setSettings(prev=>({...prev, mapZoom: parseInt(e.target.value||'7',10)}))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zoekradius (km)</label>
                  <input type="number" value={settings.searchRadius} onChange={(e)=> setSettings(prev=>({...prev, searchRadius: parseInt(e.target.value||'25',10)}))} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>

              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: De kaartinstellingen worden gebruikt in de pagina `vind-een-dealer`.</p>
              
              {/* Test verbinding knop */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      // Test Google Maps API verbinding
                      const response = await fetch('/api/test/google-maps')
                      const result = await response.json()
                      
                      if (response.ok && result.ok) {
                        alert(`✅ Google Maps verbinding succesvol!\n\n${result.message}\n\nDetails:\n- Status: ${result.details?.status || 'Onbekend'}\n- Test adres: ${result.details?.testAddress || 'Onbekend'}\n- Resultaten: ${result.details?.results || 0}`)
                      } else {
                        alert(`❌ Google Maps verbinding mislukt:\n\n${result.message || 'Onbekende fout'}\n\nDetails:\n- Status: ${result.details?.status || 'Onbekend'}\n- Fout: ${result.details?.error || 'Geen details'}`)
                      }
                    } catch (error) {
                      console.error('Test verbinding fout:', error)
                      alert(`❌ Test verbinding mislukt:\n\n${error.message || 'Onbekende fout'}`)
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  🗺️ Test Google Maps Verbinding
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Test of de Google Maps API correct is geconfigureerd en werkt.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab==='shipping' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Verzending Instellingen</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standaard Verzendkosten (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.shippingCost}
                onChange={(e) => setSettings({...settings, shippingCost: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gratis verzending vanaf (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({...settings, freeShippingThreshold: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Carrier Selection */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Beschikbare Verzendmaatschappijen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['postnl', 'dhl', 'dpd', 'local'].map((carrier) => (
                <div key={carrier} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={settings.enabledCarriers.includes(carrier)}
                      onChange={() => toggleCarrier(carrier)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{getCarrierName(carrier)}</h4>
                      <p className="text-sm text-gray-600">
                        {carrier === 'postnl' && 'Nederlandse postdienst'}
                        {carrier === 'dhl' && 'Internationale koerier'}
                        {carrier === 'dpd' && 'Europese koerier'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Methods by Carrier */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Verzendmethodes per Carrier</h3>
            <div className="space-y-6">
              {['postnl', 'dhl', 'dpd', 'local'].map((carrier) => (
                settings.enabledCarriers.includes(carrier) && (
                  <div key={carrier} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{getCarrierName(carrier)} Methodes</h4>
                    <div className="space-y-3">
                      {settings.shippingMethods
                        .filter(method => method.carrier === carrier)
                        .map((method) => (
                          <div key={method.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={method.enabled}
                                onChange={() => toggleShippingMethod(method.id)}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                              />
                              <div>
                                <h5 className="font-medium text-gray-900">{method.name}</h5>
                                <p className="text-sm text-gray-600">{method.description}</p>
                                <p className="text-xs text-gray-500">
                                  Type: {getDeliveryTypeName(method.delivery_type)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">€</span>
                              <input
                                type="number"
                                step="0.01"
                                value={method.price}
                                onChange={(e) => updateShippingMethodPrice(method.id, parseFloat(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>)}

      {currentTab==='crm' && (<div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">CRM Instellingen</h2>
          <p className="text-sm text-gray-600">Configureer bezoek types en contact moment types</p>
        </div>
        <div className="p-6 space-y-8">
          
          {/* Visit Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bezoek Types</h3>
              <button
                onClick={() => {
                  const name = prompt('Naam van bezoek type:')
                  const description = prompt('Beschrijving:')
                  if (name) {
                    addVisitType({ name, description: description || '', color: '#10B981' })
                  }
                }}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                + Nieuw Type
              </button>
            </div>
            
            {crmLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Bezoek types laden...</p>
              </div>
            ) : visitTypes.length > 0 ? (
              <div className="space-y-3">
                {visitTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: type.color }}></div>
                      <div>
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const name = prompt('Nieuwe naam:', type.name)
                          const description = prompt('Nieuwe beschrijving:', type.description)
                          if (name) {
                            updateVisitType(type.id, { name, description: description || '' })
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Weet je zeker dat je "${type.name}" wilt verwijderen?`)) {
                            deleteVisitType(type.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Nog geen bezoek types geconfigureerd. Klik op + Nieuw Type om er een toe te voegen.
              </p>
            )}
          </div>

          {/* Contact Moment Types */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Moment Types</h3>
              <button
                onClick={() => {
                  const name = prompt('Naam van contact moment type:')
                  const description = prompt('Beschrijving:')
                  if (name) {
                    addContactMomentType({ name, description: description || '', color: '#3B82F6' })
                  }
                }}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                + Nieuw Type
              </button>
            </div>
            
            {crmLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Contact moment types laden...</p>
              </div>
            ) : contactMomentTypes.length > 0 ? (
              <div className="space-y-3">
                {contactMomentTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: type.color }}></div>
                      <div>
                        <div className="font-medium text-gray-900">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const name = prompt('Nieuwe naam:', type.name)
                          const description = prompt('Nieuwe beschrijving:', type.description)
                          if (name) {
                            updateContactMomentType(type.id, { name, description: description || '' })
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Weet je zeker dat je "${type.name}" wilt verwijderen?`)) {
                            deleteContactMomentType(type.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Verwijderen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Nog geen contact moment types geconfigureerd. Klik op + Nieuw Type om er een toe te voegen.
              </p>
            )}
          </div>
        </div>
      </div>)}

      <div className="flex justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={loading || saveStatus === 'saving'}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saveStatus === 'saving' ? 'Opslaan...' : 'Instellingen Opslaan'}
        </button>
        {saveStatus === 'success' && (
          <span className="text-green-600 text-sm flex items-center">
            ✅ Instellingen opgeslagen!
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-red-600 text-sm flex items-center">
            ❌ Fout bij opslaan
          </span>
        )}
      </div>
    </div>
  )
}
