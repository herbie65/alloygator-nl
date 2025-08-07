'use client'

import { useState } from 'react'

interface ContactForm {
  naam: string
  email: string
  telefoon: string
  onderwerp: string
  bericht: string
  privacy_accepted: boolean
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactForm>({
    naam: '',
    email: '',
    telefoon: '',
    onderwerp: '',
    bericht: '',
    privacy_accepted: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof ContactForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.naam.trim()) {
      newErrors.naam = 'Naam is verplicht'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is verplicht'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Voer een geldig email adres in'
    }

    if (!formData.onderwerp.trim()) {
      newErrors.onderwerp = 'Onderwerp is verplicht'
    }

    if (!formData.bericht.trim()) {
      newErrors.bericht = 'Bericht is verplicht'
    }

    if (!formData.privacy_accepted) {
      newErrors.privacy_accepted = 'U moet akkoord gaan met de privacyvoorwaarden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // In a real application, you would send this to your API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setFormData({
          naam: '',
          email: '',
          telefoon: '',
          onderwerp: '',
          bericht: '',
          privacy_accepted: false
        })
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending contact form:', error)
      setErrors({ submit: 'Er is een fout opgetreden bij het versturen van uw bericht. Probeer het later opnieuw.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Heeft u vragen over onze producten of service? Neem gerust contact met ons op. 
            We helpen u graag verder!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Stuur ons een bericht</h2>
            
            {submitSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-800 font-medium">
                    Bedankt voor uw bericht! We nemen binnen 24 uur contact met u op.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-2">
                      Naam *
                    </label>
                    <input
                      type="text"
                      id="naam"
                      value={formData.naam}
                      onChange={(e) => handleInputChange('naam', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.naam ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Uw naam"
                    />
                    {errors.naam && (
                      <p className="text-red-500 text-sm mt-1">{errors.naam}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="uw@email.nl"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="telefoon" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefoon
                  </label>
                  <input
                    type="tel"
                    id="telefoon"
                    value={formData.telefoon}
                    onChange={(e) => handleInputChange('telefoon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="06 12345678"
                  />
                </div>

                <div>
                  <label htmlFor="onderwerp" className="block text-sm font-medium text-gray-700 mb-2">
                    Onderwerp *
                  </label>
                  <select
                    id="onderwerp"
                    value={formData.onderwerp}
                    onChange={(e) => handleInputChange('onderwerp', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.onderwerp ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecteer een onderwerp</option>
                    <option value="product-vraag">Product vraag</option>
                    <option value="bestelling">Bestelling</option>
                    <option value="technische-ondersteuning">Technische ondersteuning</option>
                    <option value="dealer-worden">Dealer worden</option>
                    <option value="klachten">Klachten</option>
                    <option value="overig">Overig</option>
                  </select>
                  {errors.onderwerp && (
                    <p className="text-red-500 text-sm mt-1">{errors.onderwerp}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bericht" className="block text-sm font-medium text-gray-700 mb-2">
                    Bericht *
                  </label>
                  <textarea
                    id="bericht"
                    rows={6}
                    value={formData.bericht}
                    onChange={(e) => handleInputChange('bericht', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.bericht ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Beschrijf uw vraag of opmerking..."
                  />
                  {errors.bericht && (
                    <p className="text-red-500 text-sm mt-1">{errors.bericht}</p>
                  )}
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={formData.privacy_accepted}
                    onChange={(e) => handleInputChange('privacy_accepted', e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-700">
                    Ik ga akkoord met de{' '}
                    <a href="/privacy-policy" className="text-green-600 hover:text-green-700 underline">
                      privacyvoorwaarden
                    </a>
                    *
                  </label>
                </div>
                {errors.privacy_accepted && (
                  <p className="text-red-500 text-sm mt-1">{errors.privacy_accepted}</p>
                )}

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isSubmitting ? 'Versturen...' : 'Bericht versturen'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contactgegevens</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Adres</h3>
                    <p className="text-gray-600">
                      AlloyGator Nederland<br />
                      Kweekgrasstraat 36<br />
                      1313 BX Almere<br />
                      Nederland
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Telefoon</h3>
                    <p className="text-gray-600">
                      <a href="tel:0853033400" className="hover:text-green-600 transition-colors">
                        085-3033400
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <p className="text-gray-600">
                      <a href="mailto:info@alloygator.nl" className="hover:text-green-600 transition-colors">
                        info@alloygator.nl
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Openingstijden</h3>
                    <p className="text-gray-600">
                      Maandag - Vrijdag: 09:00 - 17:00<br />
                      Zaterdag: 09:00 - 15:00<br />
                      Zondag: Gesloten
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Veelgestelde Vragen</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Hoe lang duurt het voordat mijn bestelling wordt verzonden?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Bestellingen worden binnen 1-2 werkdagen verzonden. U ontvangt een verzendbevestiging per email.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Welke betaalmethodes accepteert u?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    We accepteren iDEAL, creditcard en bankoverschrijving. Alle betalingen zijn veilig en versleuteld.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Kunt u helpen met de montage van AlloyGator?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Ja! We hebben een netwerk van erkende dealers die u kunnen helpen met professionele montage.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Wat is uw retourbeleid?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    U heeft 14 dagen om producten terug te sturen. Zie onze voorwaarden voor meer informatie.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 