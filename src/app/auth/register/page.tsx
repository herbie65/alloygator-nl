'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name })
			})
			const data = await res.json().catch(()=>({}))
			if (!res.ok) {
				setError(data?.error || 'Registratie mislukt')
				return
			}
			// Succes: door naar inloggen
			window.location.href = '/auth/login'
		} catch (e: any) {
			setError(e?.message || 'Er ging iets mis')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-md">
				<div className="bg-white shadow-md rounded-lg p-8">
					<h1 className="text-2xl font-bold text-gray-900 mb-6">Registreren</h1>
					{error && (
						<div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
					)}
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Naam (optioneel)</label>
							<input
								type="text"
								value={name}
								onChange={(e)=>setName(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">E‑mail</label>
							<input
								type="email"
								required
								value={email}
								onChange={(e)=>setEmail(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Wachtwoord</label>
							<input
								type="password"
								required
								minLength={6}
								value={password}
								onChange={(e)=>setPassword(e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
							/>
							<p className="mt-1 text-xs text-gray-500">Minimaal 6 tekens.</p>
						</div>
						<button
							type="submit"
							disabled={loading}
							className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
						>
							{loading ? 'Bezig…' : 'Account aanmaken'}
						</button>
					</form>
					<p className="mt-4 text-sm text-gray-600">
						Heb je al een account?{' '}
						<Link href="/auth/login" className="text-green-600 hover:text-green-700">Inloggen</Link>
					</p>
				</div>
			</div>
		</div>
	)
}
