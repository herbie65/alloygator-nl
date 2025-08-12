'use client'

import { useState, useEffect } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface EmailTemplate {
  id: string
  name: string
  category: string
  subject: string
  html_content: string
  created_at: string
  updated_at: string
}

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const defaultTemplates: EmailTemplate[] = [
    {
      id: 'order-confirmation',
      name: 'Order Bevestiging',
      category: 'Bestellingen',
      subject: 'Bestelling bevestigd - #{order_number}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Bevestiging</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Bestelling Bevestigd</h1>
              <p>Bedankt voor je bestelling!</p>
            </div>
            
            <div class="content">
              <h2>Hallo {customer_name},</h2>
              <p>We hebben je bestelling ontvangen en gaan deze direct verwerken.</p>
              
              <div class="order-details">
                <h3>Bestelling #{order_number}</h3>
                <p><strong>Besteldatum:</strong> {order_date}</p>
                <p><strong>Totaalbedrag:</strong> €{total}</p>
                <p><strong>Betaalmethode:</strong> {payment_method}</p>
              </div>
              
              <p>We houden je op de hoogte van de status van je bestelling.</p>
            </div>
            
            <div class="footer">
              <p>AlloyGator - Voor al je velgbescherming</p>
            </div>
          </div>
        </body>
        </html>
      `,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'payment-reminder',
      name: 'Betalingsherinnering',
      category: 'Betalingen',
      subject: 'Betalingsherinnering - Bestelling #{order_number}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Betalingsherinnering</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .payment-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Betalingsherinnering</h1>
              <p>Je bestelling wacht op betaling</p>
            </div>
            
            <div class="content">
              <h2>Hallo {customer_name},</h2>
              <p>Dit is een vriendelijke herinnering dat je bestelling nog open staat.</p>
              
              <div class="payment-info">
                <h3>Bestelling #{order_number}</h3>
                <p><strong>Besteldatum:</strong> {order_date}</p>
                <p><strong>Vervaldatum:</strong> {due_date}</p>
                <p><strong>Openstaand bedrag:</strong> €{total}</p>
              </div>
              
              <p>Graag ontvangen we je betaling binnen de gestelde termijn.</p>
            </div>
            
            <div class="footer">
              <p>AlloyGator - Voor al je velgbescherming</p>
            </div>
          </div>
        </body>
        </html>
      `,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'invoice-sent',
      name: 'Factuur Verzonden',
      category: 'Facturen',
      subject: 'Factuur verzonden - Bestelling #{order_number}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Factuur Verzonden</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .invoice-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #8b5cf6; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧾 Factuur Verzonden</h1>
              <p>Je factuur is klaar</p>
            </div>
            
            <div class="content">
              <h2>Hallo {customer_name},</h2>
              <p>We hebben je factuur gegenereerd en toegevoegd aan je bestelling.</p>
              
              <div class="invoice-info">
                <h3>Bestelling #{order_number}</h3>
                <p><strong>Factuurdatum:</strong> {invoice_date}</p>
                <p><strong>Bedrag:</strong> €{total}</p>
                <p><strong>Betaaltermijn:</strong> {payment_terms}</p>
              </div>
              
              <p>Je kunt de factuur downloaden via je account of neem contact met ons op.</p>
            </div>
            
            <div class="footer">
              <p>AlloyGator - Voor al je velgbescherming</p>
            </div>
          </div>
        </body>
        </html>
      `,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'shipping-notification',
      name: 'Verzending Melding',
      category: 'Verzending',
      subject: 'Je bestelling is verzonden - #{order_number}',
      html_content: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verzending Melding</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #06b6d4; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .shipping-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #06b6d4; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Je Bestelling is Verzonden!</h1>
              <p>Op weg naar je toe</p>
            </div>
            
            <div class="content">
              <h2>Hallo {customer_name},</h2>
              <p>Geweldig nieuws! Je bestelling is verzonden en onderweg naar je toe.</p>
              
              <div class="shipping-info">
                <h3>Bestelling #{order_number}</h3>
                <p><strong>Verzenddatum:</strong> {shipping_date}</p>
                <p><strong>Verzendmethode:</strong> {shipping_method}</p>
                <p><strong>Tracking nummer:</strong> {tracking_number || 'Niet beschikbaar'}</p>
              </div>
              
              <p>Je ontvangt je bestelling binnenkort. Veel plezier ermee!</p>
            </div>
            
            <div class="footer">
              <p>AlloyGator - Voor al je velgbescherming</p>
            </div>
          </div>
        </body>
        </html>
      `,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await FirebaseService.getDocuments('email_templates')
      
      if (data && data.length > 0) {
        setTemplates(data)
      } else {
        // Initialize with default templates if collection is empty
        await Promise.all(defaultTemplates.map(template => 
          FirebaseService.addDocument('email_templates', template)
        ))
        setTemplates(defaultTemplates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      setError('Fout bij laden van email templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async (template: EmailTemplate) => {
    try {
      if (template.id && templates.find(t => t.id === template.id)) {
        // Update existing template
        await FirebaseService.updateDocument('email_templates', template.id, {
          name: template.name,
          category: template.category,
          subject: template.subject,
          html_content: template.html_content,
          updated_at: new Date().toISOString()
        })
        setSuccess('Template bijgewerkt')
      } else {
        // Create new template
        const newTemplate = await FirebaseService.addDocument('email_templates', {
          ...template,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        setTemplates(prev => [...prev, { ...template, id: newTemplate.id }])
        setSuccess('Nieuwe template aangemaakt')
      }
      
      setTimeout(() => setSuccess(''), 3000)
      setShowEditModal(false)
      setSelectedTemplate(null)
      await loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      setError('Fout bij opslaan van template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) return
    
    try {
      await FirebaseService.deleteDocument('email_templates', templateId)
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      setSuccess('Template verwijderd')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error deleting template:', error)
      setError('Fout bij verwijderen van template')
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    const duplicatedTemplate = {
      ...template,
      id: '',
      name: `${template.name} (Kopie)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setSelectedTemplate(duplicatedTemplate)
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Email templates laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-600">Beheer en bewerk email templates</p>
        <div className="mt-3">
          <button
            onClick={() => {
              setSelectedTemplate({
                id: '',
                name: '',
                category: '',
                subject: '',
                html_content: '',
                created_at: '',
                updated_at: ''
              })
              setShowEditModal(true)
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            + Nieuwe Template
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.category}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                  title="Dupliceren"
                >
                  📋
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                  title="Verwijderen"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Onderwerp:</strong> {template.subject}
              </p>
              <p className="text-xs text-gray-400">
                Laatst bijgewerkt: {new Date(template.updated_at).toLocaleDateString('nl-NL')}
              </p>
            </div>
            
            <button
              onClick={() => {
                setSelectedTemplate(template)
                setShowEditModal(true)
              }}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Bewerken
            </button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <EditTemplateModal
          template={selectedTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setShowEditModal(false)
            setSelectedTemplate(null)
          }}
        />
      )}
    </div>
  )
}

interface EditTemplateModalProps {
  template: EmailTemplate
  onSave: (template: EmailTemplate) => void
  onClose: () => void
}

function EditTemplateModal({ template, onSave, onClose }: EditTemplateModalProps) {
  const [formData, setFormData] = useState(template)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const placeholders = {
    customer_name: 'John Doe',
    order_number: 'ORD-12345',
    order_date: '15 januari 2024',
    total: '299.99',
    payment_method: 'iDEAL',
    due_date: '29 januari 2024',
    invoice_date: '15 januari 2024',
    payment_terms: '14 dagen',
    shipping_date: '16 januari 2024',
    shipping_method: 'DHL Express',
    tracking_number: 'DHL123456789'
  }

  const previewContent = formData.html_content.replace(
    /\{(\w+)\}/g,
    (match, key) => placeholders[key as keyof typeof placeholders] || match
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {template.id ? 'Template Bewerken' : 'Nieuwe Template'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Naam
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Selecteer categorie</option>
                <option value="Bestellingen">Bestellingen</option>
                <option value="Betalingen">Betalingen</option>
                <option value="Facturen">Facturen</option>
                <option value="Verzending">Verzending</option>
                <option value="Algemeen">Algemeen</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Onderwerp
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Gebruik {customer_name}, {order_number} etc. als placeholders"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Beschikbare placeholders: {Object.keys(placeholders).map(p => `{${p}}`).join(', ')}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                HTML Inhoud
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-green-600 hover:text-green-900"
              >
                {showPreview ? 'Bewerken' : 'Preview'}
              </button>
            </div>
            
            {showPreview ? (
              <div 
                className="w-full border border-gray-300 rounded-md p-4 bg-white"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            ) : (
              <textarea
                value={formData.html_content}
                onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                placeholder="Voer HTML code in..."
                required
              />
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
