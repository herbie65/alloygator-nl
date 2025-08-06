'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HomePageContent {
  hero_title: string
  hero_subtitle: string
  hero_button_text: string
  hero_button_link: string
  about_title: string
  about_content: string
  features: Array<{
    title: string
    description: string
    icon: string
  }>
  products_section_title: string
  products_section_subtitle: string
  cta_title: string
  cta_content: string
  cta_button_text: string
  cta_button_link: string
}

export default function HomePage() {
  const [content, setContent] = useState<HomePageContent>({
    hero_title: 'AlloyGator Nederland',
    hero_subtitle: 'Professionele velgbescherming tegen stoeprandschade',
    hero_button_text: 'Bekijk onze producten',
    hero_button_link: '/winkel',
    about_title: 'Waarom AlloyGator?',
    about_content: 'AlloyGator is de meest effectieve manier om uw velgen te beschermen tegen stoeprandschade. Onze kunststof velgbescherming is duurzaam, eenvoudig te monteren en vrijwel onzichtbaar.',
    features: [
      {
        title: 'Eenvoudige montage',
        description: 'Monteer AlloyGator in slechts 30 minuten zonder speciale gereedschappen',
        icon: '🔧'
      },
      {
        title: 'Onzichtbare bescherming',
        description: 'De bescherming is vrijwel onzichtbaar en behoudt de originele uitstraling',
        icon: '👁️'
      },
      {
        title: 'Duurzaam materiaal',
        description: 'Hoogwaardige kunststof die bestand is tegen extreme weersomstandigheden',
        icon: '🛡️'
      },
      {
        title: 'Gegarandeerde bescherming',
        description: 'Beschermt uw velgen tegen schade tot 5cm van de stoeprand',
        icon: '✅'
      }
    ],
    products_section_title: 'Onze Producten',
    products_section_subtitle: 'Ontdek ons complete assortiment velgbescherming',
    cta_title: 'Klaar om uw velgen te beschermen?',
    cta_content: 'Vind een dealer bij u in de buurt of bestel direct online',
    cta_button_text: 'Vind een dealer',
    cta_button_link: '/vind-een-dealer'
  })

  useEffect(() => {
    // Use default content for static export
    console.log('Using default homepage content');
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {content.hero_title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {content.hero_subtitle}
            </p>
            <Link 
              href={content.hero_button_link}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              {content.hero_button_text}
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {content.about_title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {content.about_content}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(content.features || []).map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {content.products_section_title}
            </h2>
            <p className="text-lg text-gray-600">
              {content.products_section_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-green-100 flex items-center justify-center">
                <span className="text-6xl">🚗</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AlloyGator Sets</h3>
                <p className="text-gray-600 mb-4">
                  Complete sets voor verschillende velgmaten en voertuigtypes
                </p>
                <Link 
                  href="/winkel/alloygator-set"
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Bekijk sets
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-blue-100 flex items-center justify-center">
                <span className="text-6xl">🔧</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Montagehulpmiddelen</h3>
                <p className="text-gray-600 mb-4">
                  Professionele gereedschappen voor eenvoudige montage
                </p>
                <Link 
                  href="/winkel/montagehulpmiddelen"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Bekijk gereedschappen
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-orange-100 flex items-center justify-center">
                <span className="text-6xl">🎒</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Accessoires</h3>
                <p className="text-gray-600 mb-4">
                  Handige accessoires en onderdelen voor uw AlloyGator
                </p>
                <Link 
                  href="/winkel/accessoires"
                  className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded transition-colors"
          >
                  Bekijk accessoires
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {content.cta_title}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {content.cta_content}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={content.cta_button_link}
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
            >
              {content.cta_button_text}
            </Link>
            <Link 
              href="/winkel"
              className="inline-block bg-white hover:bg-gray-100 text-green-600 font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
        >
              Online bestellen
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
