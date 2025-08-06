'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CompanyInfo {
  name: string
  address: string
  city: string
  postal_code: string
  country: string
  phone: string
  email: string
  kvk_number: string
  btw_number: string
  iban: string
}

// Static company data
const staticCompanyInfo: CompanyInfo = {
  name: 'AlloyGator Netherlands',
  address: 'Kweekgrasstraat 36',
  city: 'Almere',
  postal_code: '1313 BX',
  country: 'Nederland',
  phone: '085-3033400',
  email: 'info@alloygator.nl',
  kvk_number: '12345678',
  btw_number: 'NL123456789B01',
  iban: 'NL91ABNA0417164300'
}

export default function ContactPage() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use static company data
    setCompanyInfo(staticCompanyInfo)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link href="/" className="hover:text-green-600">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900">Contact</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Neem contact met ons op voor vragen over onze producten of voor professioneel advies. 
            Onze experts staan klaar om u te helpen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Bedrijfsgegevens</h2>
            
            {companyInfo && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{companyInfo.name}</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-gray-600">{companyInfo.address}</p>
                  <p className="text-gray-600">{companyInfo.postal_code} {companyInfo.city}</p>
                  <p className="text-gray-600">{companyInfo.country}</p>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${companyInfo.phone}`} className="text-green-600 hover:text-green-700">
                      {companyInfo.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${companyInfo.email}`} className="text-green-600 hover:text-green-700">
                      {companyInfo.email}
                    </a>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Bedrijfsinformatie</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">KVK:</span> {companyInfo.kvk_number}</p>
                    <p><span className="font-medium">BTW:</span> {companyInfo.btw_number}</p>
                    <p><span className="font-medium">IBAN:</span> {companyInfo.iban}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Stuur ons een bericht</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    Voornaam *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Achternaam *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  E-mailadres *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefoonnummer
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                  Onderwerp *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecteer een onderwerp</option>
                  <option value="product-inquiry">Productinformatie</option>
                  <option value="technical-support">Technische ondersteuning</option>
                  <option value="dealer-inquiry">Dealer informatie</option>
                  <option value="order-status">Bestelling status</option>
                  <option value="other">Anders</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Bericht *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Beschrijf uw vraag of opmerking..."
                ></textarea>
              </div>

              <div className="flex items-center">
                <input
                  id="privacy"
                  name="privacy"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="privacy" className="ml-2 block text-sm text-gray-900">
                  Ik ga akkoord met de{' '}
                  <Link href="/privacy-policy" className="text-green-600 hover:text-green-700">
                    privacy policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Verstuur bericht
              </button>
            </form>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Openingstijden</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Kantoor</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Maandag - Vrijdag</span>
                  <span>09:00 - 17:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Zaterdag</span>
                  <span>10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Zondag</span>
                  <span>Gesloten</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Technische ondersteuning</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Maandag - Vrijdag</span>
                  <span>08:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Zaterdag</span>
                  <span>09:00 - 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Zondag</span>
                  <span>Gesloten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 