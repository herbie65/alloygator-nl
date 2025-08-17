'use client'

import { useEffect, useMemo, useState } from 'react'
import { FirebaseService } from '@/lib/firebase'

interface ProductColor {
	id: string
	name: string
	hex?: string
	is_active?: boolean
	sort_order?: number
	created_at?: string
	updated_at?: string
}

export default function ProductColorsPage() {
	const [colors, setColors] = useState<ProductColor[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string>('')
	const [showModal, setShowModal] = useState(false)
	const [editing, setEditing] = useState<ProductColor | null>(null)
	const [search, setSearch] = useState('')

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true)
				setError('')
				const rows = await FirebaseService.getDocuments('product_colors')
				setColors(Array.isArray(rows) ? (rows as ProductColor[]).sort((a,b)=> (a.sort_order||0)-(b.sort_order||0)) : [])
			} catch (e: any) {
				setError(e?.message || 'Fout bij laden van kleuren')
				setColors([])
			} finally { setLoading(false) }
		}
		load()
	}, [])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return colors.filter(c => !q || c.name?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q))
	}, [colors, search])

	const handleSave = async (data: Partial<ProductColor>) => {
		try {
			setError('')
			if (editing?.id) {
				await FirebaseService.updateProductColor(editing.id, {
					name: data.name || editing.name,
					hex: data.hex ?? editing.hex ?? '',
					is_active: data.is_active ?? (editing.is_active ?? true),
					sort_order: data.sort_order ?? (editing.sort_order ?? 0)
				})
			} else {
				await FirebaseService.createProductColor({
					name: (data.name || '').trim(),
					hex: (data.hex || '').trim(),
					is_active: data.is_active ?? true,
					sort_order: data.sort_order ?? 0
				})
			}
			// refresh
			const rows = await FirebaseService.getDocuments('product_colors')
			setColors(Array.isArray(rows) ? (rows as ProductColor[]).sort((a,b)=> (a.sort_order||0)-(b.sort_order||0)) : [])
			setShowModal(false)
			setEditing(null)
		} catch (e: any) {
			setError(e?.message || 'Fout bij opslaan van kleur')
		}
	}

	const handleDelete = async (id: string) => {
		if (!confirm('Weet je zeker dat je deze kleur wilt verwijderen?')) return
		try {
			await FirebaseService.deleteProductColor(id)
			setColors(prev => prev.filter(c => c.id !== id))
		} catch (e: any) {
			setError(e?.message || 'Fout bij verwijderen van kleur')
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 p-6">
			<div className="max-w-5xl mx-auto space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Producten › Attributen › Kleuren</h1>
						<p className="text-gray-600">Beheer beschikbare productkleuren</p>
					</div>
					<button onClick={() => { setEditing(null); setShowModal(true) }} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">+ Nieuwe kleur</button>
				</div>

				<div className="bg-white rounded shadow p-4">
					<div className="flex gap-3 mb-4">
						<input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Zoek op naam of ID..." className="flex-1 px-3 py-2 border rounded" />
						{colors.length === 0 && (
							<span title="Geen kleuren gevonden in database" className="self-center text-orange-500">❗</span>
						)}
					</div>

					{loading ? (
						<div className="text-gray-600">Kleuren laden...</div>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Voorbeeld</th>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Naam</th>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hex</th>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Actief</th>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Volgorde</th>
										<th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Acties</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{filtered.map((c)=> (
										<tr key={c.id}>
											<td className="px-4 py-2">
												<div className="w-6 h-6 rounded border" style={{ backgroundColor: c.hex || '#fff' }} title={c.hex || ''} />
											</td>
											<td className="px-4 py-2 text-sm">{c.name}</td>
											<td className="px-4 py-2 text-sm font-mono">{c.hex || '-'}</td>
											<td className="px-4 py-2 text-sm">{c.is_active ? 'Ja' : 'Nee'}</td>
											<td className="px-4 py-2 text-sm">{c.sort_order ?? 0}</td>
											<td className="px-4 py-2 text-sm">
												<button onClick={()=> { setEditing(c); setShowModal(true) }} className="text-green-600 hover:text-green-800 mr-3">Bewerken</button>
												<button onClick={()=> handleDelete(c.id)} className="text-red-600 hover:text-red-800">Verwijderen</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{showModal && (
					<ColorModal
						color={editing}
						onClose={() => { setShowModal(false); setEditing(null) }}
						onSave={handleSave}
					/>
				)}
			</div>
		</div>
	)
}

function ColorModal({ color, onClose, onSave }: { color: ProductColor | null; onClose: ()=>void; onSave: (c: Partial<ProductColor>)=>void }) {
	const [name, setName] = useState<string>(color?.name || '')
	const [hex, setHex] = useState<string>(color?.hex || '')
	const [isActive, setIsActive] = useState<boolean>(color?.is_active ?? true)
	const [order, setOrder] = useState<number>(color?.sort_order ?? 0)
	const preview = (hex || '').match(/^#?[0-9a-fA-F]{6}$/) ? (hex.startsWith('#') ? hex : `#${hex}`) : '#ffffff'

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-semibold">{color ? 'Kleur bewerken' : 'Nieuwe kleur'}</h2>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Naam *</label>
						<input value={name} onChange={(e)=>setName(e.target.value)} className="w-full px-3 py-2 border rounded" required />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Hex (bijv. #FF0000)</label>
						<div className="flex items-center gap-2">
							<input value={hex} onChange={(e)=>setHex(e.target.value)} className="flex-1 px-3 py-2 border rounded font-mono" placeholder="#RRGGBB" />
							<div className="w-8 h-8 rounded border" style={{ backgroundColor: preview }} />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<input id="isActive" type="checkbox" checked={isActive} onChange={(e)=>setIsActive(e.target.checked)} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
						<label htmlFor="isActive" className="text-sm">Actief</label>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Volgorde</label>
						<input type="number" value={order} onChange={(e)=>setOrder(parseInt(e.target.value||'0',10))} className="w-full px-3 py-2 border rounded" />
					</div>
				</div>

				<div className="flex justify-end gap-3 mt-6">
					<button onClick={onClose} className="px-4 py-2 border rounded">Annuleren</button>
					<button onClick={()=> onSave({ name, hex, is_active: isActive, sort_order: order })} className="px-4 py-2 bg-green-600 text-white rounded">Opslaan</button>
				</div>
			</div>
		</div>
	)
}
