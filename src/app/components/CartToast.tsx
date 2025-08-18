'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface CartItem {
	id: string
	name: string
	price: number
	quantity: number
	image?: string
	vat_category?: string
}

export default function CartToast() {
	const [items, setItems] = useState<CartItem[]>([])
	const [visible, setVisible] = useState(false)

	const totalCount = useMemo(() => items.reduce((s, it) => s + Number(it.quantity || 0), 0), [items])
	const totalAmount = useMemo(() => items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0), [items])

	useEffect(() => {
		const readCart = (): CartItem[] => {
			try {
				const raw = localStorage.getItem('alloygator-cart') || '[]'
				const parsed = JSON.parse(raw)
				return Array.isArray(parsed) ? parsed : []
			} catch { return [] }
		}

		let lastCount = 0
		const sync = (triggerOpen: boolean) => {
			const next = readCart()
			const nextCount = next.reduce((s, it) => s + Number(it.quantity || 0), 0)
			const increased = nextCount > lastCount
			setItems(next)
			lastCount = nextCount
			if (triggerOpen && increased) {
				setVisible(true)
			}
		}

		// init
		sync(false)

		const onStorage = (e: StorageEvent) => {
			if (e.key === 'alloygator-cart') sync(true)
		}
		const onCartUpdated = () => sync(true)
		const interval = window.setInterval(() => sync(false), 1000)
		window.addEventListener('storage', onStorage)
		window.addEventListener('cart-updated', onCartUpdated as EventListener)
		return () => {
			window.clearInterval(interval)
			window.removeEventListener('storage', onStorage)
			window.removeEventListener('cart-updated', onCartUpdated as EventListener)
		}
	}, [])

	if (!visible || totalCount <= 0) return null

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<div className="bg-white rounded-lg shadow-lg p-4 border min-w-[260px]">
				<div className="flex items-center justify-between mb-2">
					<p className="text-sm text-gray-600">Winkelwagen</p>
					<button onClick={() => setVisible(false)} aria-label="Sluiten" className="text-gray-400 hover:text-gray-600">×</button>
				</div>
				<p className="font-semibold mb-3">{totalCount} item{totalCount !== 1 ? 's' : ''} - €{totalAmount.toFixed(2)}</p>
				<div className="flex justify-end">
					<Link href="/cart" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm">
						Bekijk winkelwagen
					</Link>
				</div>
			</div>
		</div>
	)
}
