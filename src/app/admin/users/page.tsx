'use client'

import { useEffect, useState } from 'react'

type AdminUser = { id: string; email: string; role: 'admin'|'staff'; name?: string }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin'|'staff'>('staff')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data as AdminUser[] : [])
  }

  useEffect(() => { load() }, [])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, role, name, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Fout')
      setEmail(''); setPassword(''); setName(''); setRole('staff')
      await load()
    } catch (e:any) { setError(e.message) } finally { setLoading(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Verwijderen?')) return
    await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gebruikersbeheer</h1>
      <form onSubmit={add} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end bg-white p-4 rounded shadow">
        <div>
          <label className="text-sm">E-mail</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <label className="text-sm">Naam (optioneel)</label>
          <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm">Rol</label>
          <select value={role} onChange={(e)=>setRole(e.target.value as any)} className="w-full border rounded px-2 py-1">
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div>
          <label className="text-sm">Wachtwoord</label>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full border rounded px-2 py-1" required />
        </div>
        <div>
          <button disabled={loading} className="bg-green-600 text-white px-3 py-2 rounded">{loading?'Opslaan...':'Toevoegen'}</button>
        </div>
        {error && <div className="md:col-span-5 text-red-600 text-sm">{error}</div>}
      </form>

      <div className="bg-white rounded shadow p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">E-mail</th>
              <th>Naam</th>
              <th>Rol</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u=> (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-2">{u.email}</td>
                <td>{u.name || '-'}</td>
                <td>{u.role}</td>
                <td className="text-right">
                  <button onClick={()=>remove(u.id)} className="text-red-600 hover:underline">Verwijderen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


