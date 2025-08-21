'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type OpenState = {
  label: string
  detail: string
}

function computeOpenState(now: Date): OpenState {
  const day = now.getDay() // 0=Sun .. 6=Sat
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentMinutes = hour * 60 + minute

  const openTime = 8 * 60 + 30 // 08:30
  const closeTime = 17 * 60 // 17:00
  const isWeekday = day >= 1 && day <= 5

  if (isWeekday && currentMinutes >= openTime && currentMinutes < closeTime) {
    const minsLeft = closeTime - currentMinutes
    const hrs = Math.floor(minsLeft / 60)
    const mins = minsLeft % 60
    return {
      label: 'Nu open',
      detail: `Nog ${hrs > 0 ? `${hrs} uur ` : ''}${mins} min tot sluiting`
    }
  }

  // compute next open
  let nextOpenDay = day
  if (day === 6 || currentMinutes >= closeTime) nextOpenDay = (day + 1) % 7
  if (day === 0) nextOpenDay = 1
  if (nextOpenDay === 6 || nextOpenDay === 0) nextOpenDay = 1
  let daysAhead = (nextOpenDay - day + 7) % 7
  if (daysAhead === 0 && currentMinutes < openTime) daysAhead = 0
  const nextOpen = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
  nextOpen.setHours(8, 30, 0, 0)
  const diffMs = +nextOpen - +now
  const diffMin = Math.max(0, Math.floor(diffMs / 60000))
  const hrs = Math.floor(diffMin / 60)
  const mins = diffMin % 60

  return {
    label: 'Nu gesloten',
    detail: `Opent over ${hrs > 0 ? `${hrs} uur ` : ''}${mins} min`
  }
}

export default function Footer() {
  const [openState, setOpenState] = useState<OpenState>(() => computeOpenState(new Date()))

  useEffect(() => {
    setOpenState(computeOpenState(new Date()))
    const t = setInterval(() => setOpenState(computeOpenState(new Date())), 60_000)
    return () => clearInterval(t)
  }, [])

  const year = useMemo(() => new Date().getFullYear(), [])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Over AlloyGator</h3>
            <ul className="space-y-2">
              <li><Link href="/over-ons" className="text-gray-300 hover:text-white transition-colors">Over ons</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/reviews" className="text-gray-300 hover:text-white transition-colors">Reviews & Pers</Link></li>
              <li><Link href="/wat-zijn-onze-retourvoorwaarden" className="text-gray-300 hover:text-white transition-colors">Retourbeleid</Link></li>
              <li><Link href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacybeleid</Link></li>
              <li><Link href="/algemene-voorwaarden" className="text-gray-300 hover:text-white transition-colors">Algemene voorwaarden</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Content</h3>
            <ul className="space-y-2">
              <li><Link href="/news" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/customer-care" className="text-gray-300 hover:text-white transition-colors">Veelgestelde vragen</Link></li>
              <li><Link href="/montage-instructies" className="text-gray-300 hover:text-white transition-colors">Montage-instructies</Link></li>
              <li><Link href="/velgen-bescherming-laten-plaatsen" className="text-gray-300 hover:text-white transition-colors">Velgen bescherming laten plaatsen</Link></li>
              <li><Link href="/waarom-alloygator" className="text-gray-300 hover:text-white transition-colors">Waarom kiezen voor AlloyGator?</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Dealers</h3>
            <ul className="space-y-2">
              <li><Link href="/vind-een-dealer" className="text-gray-300 hover:text-white transition-colors">Vind een dealer</Link></li>
              <li><Link href="/wholesale" className="text-gray-300 hover:text-white transition-colors">Aanmelden als dealer</Link></li>
              <li><Link href="/trade-partner-benefits" className="text-gray-300 hover:text-white transition-colors">Voordelen om dealer te worden</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Bedrijfsinfo</h3>
            <div className="text-gray-300 space-y-1">
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
            <div className="mt-4 text-sm relative inline-flex flex-col items-start group">
              <div className="font-semibold cursor-default" aria-live="polite" aria-describedby="footer-open-tooltip">
                {openState.label}
              </div>
              <div
                id="footer-open-tooltip"
                role="tooltip"
                className="pointer-events-none absolute left-0 top-full mt-2 hidden max-w-xs whitespace-normal rounded-xl bg-gray-800/95 px-3 py-2 text-[0.9rem] text-white shadow-lg ring-1 ring-lime-400/30 group-hover:block"
              >
                {openState.detail}
              </div>
              <div className="mt-2 text-gray-400">
                Ma–Vr: 08:30–17:00<br />Za–Zo: Gesloten
              </div>
            </div>
          </div>
        </div>



        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {year} AlloyGator. Alle rechten voorbehouden.</p>
        </div>
      </div>
    </footer>
  )
}