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

export default function Footer() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

    useEffect(() => {
    // Use default company info for static export
    setCompanyInfo({
      id: 'default',
      name: 'AlloyGator Nederland',
      address: 'Voorbeeldstraat 123',
      city: 'Amsterdam',
      postal_code: '1000 AB',
      country: 'Nederland',
      phone: '+31 20 123 4567',
      email: 'info@alloygator.nl',
      kvk_number: '12345678',
      btw_number: 'NL123456789B01',
      iban: 'NL91ABNA0417164300'
    });
  }, [])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Over AlloyGator */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Over AlloyGator</h3>
            <ul className="space-y-2">
              <li><Link href="/over-ons" className="text-gray-300 hover:text-white transition-colors">Over ons</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/reviews" className="text-gray-300 hover:text-white transition-colors">Reviews & Pers</Link></li>
              <li><Link href="/testing" className="text-gray-300 hover:text-white transition-colors">Kwaliteit en testen</Link></li>
              <li><Link href="/wat-zijn-onze-retourvoorwaarden" className="text-gray-300 hover:text-white transition-colors">Retourbeleid</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacybeleid</Link></li>
              <li><Link href="/algemene-voorwaarden" className="text-gray-300 hover:text-white transition-colors">Algemene voorwaarden</Link></li>
            </ul>
          </div>

          {/* Ondersteuning */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ondersteuning</h3>
            <ul className="space-y-2">
              <li><Link href="/news" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/customer-care" className="text-gray-300 hover:text-white transition-colors">Veelgestelde vragen</Link></li>
              <li><Link href="/montage-instructies" className="text-gray-300 hover:text-white transition-colors">Montage-instructies</Link></li>
              <li><Link href="/velgen-bescherming-laten-plaatsen" className="text-gray-300 hover:text-white transition-colors">Velgen bescherming laten plaatsen</Link></li>
              <li><Link href="/waarom-alloygator" className="text-gray-300 hover:text-white transition-colors">Waarom kiezen voor AlloyGator?</Link></li>
            </ul>
          </div>

          {/* Populaire artikelen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Populaire artikelen</h3>
            <ul className="space-y-2">
              <li><Link href="/winkel/alloygator-set" className="text-gray-300 hover:text-white transition-colors">AlloyGators</Link></li>
              <li><Link href="/winkel/accessoires" className="text-gray-300 hover:text-white transition-colors">Accessoires</Link></li>
              <li><Link href="/winkel/montagehulpmiddelen" className="text-gray-300 hover:text-white transition-colors">Montagehulpmiddelen</Link></li>
            </ul>
          </div>

          {/* Dealers */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dealers</h3>
            <ul className="space-y-2">
              <li><Link href="/vind-een-dealer" className="text-gray-300 hover:text-white transition-colors">Vind een dealer</Link></li>
              <li><Link href="/dealer-login" className="text-gray-300 hover:text-white transition-colors">Dealer inlog</Link></li>
              <li><Link href="/wholesale" className="text-gray-300 hover:text-white transition-colors">Aanmelden als dealer</Link></li>
              <li><Link href="/trade-partner-benefits" className="text-gray-300 hover:text-white transition-colors">Voordelen om dealer te worden</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            {companyInfo ? (
              <div className="text-gray-300">
                <p>{companyInfo.address}</p>
                <p>{companyInfo.postal_code} {companyInfo.city}</p>
                <p>{companyInfo.country}</p>
                <p className="mt-2">
                  <a href={`tel:${companyInfo.phone}`} className="text-green-400 hover:text-green-300">
                    {companyInfo.phone}
                  </a>
                </p>
                <p>
                  <a href={`mailto:${companyInfo.email}`} className="text-green-400 hover:text-green-300">
                    {companyInfo.email}
                  </a>
                </p>
              </div>
            ) : (
              <div className="text-gray-300">
                <p>Kweekgrasstraat 36</p>
                <p>1313 BX Almere</p>
                <p>Nederland</p>
                <p className="mt-2">
                  <a href="tel:0853033400" className="text-green-400 hover:text-green-300">085-3033400</a>
                </p>
                <p>
                  <a href="mailto:info@alloygator.nl" className="text-green-400 hover:text-green-300">info@alloygator.nl</a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>©2025 AlloyGator Netherlands. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
} 