'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Static dealer data for demo
const staticDealers = [
  {
    email: "demo@dealer.nl",
    password: "demo123",
    name: "Demo Dealer",
    group: "brons",
    discount: 10
  }
];

export default function DealerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    
    try {
      // Check against static dealer data
      const dealer = staticDealers.find(d => d.email === email);
      if (!dealer) {
        setError("Dealer niet gevonden");
        return;
      }
      
      if (dealer.password !== password) {
        setError("Onjuist wachtwoord");
        return;
      }
      
      window.localStorage.setItem("dealerEmail", dealer.email);
      window.localStorage.setItem("dealerName", dealer.name);
      window.localStorage.setItem("dealerGroup", dealer.group);
      window.localStorage.setItem("dealerDiscount", dealer.discount.toString());
      router.push("/winkel");
    } catch (error) {
      console.error("Login error:", error);
      setError("Fout bij inloggen");
    }
  }

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-16">
      <h2 className="text-3xl font-bebas text-[var(--ag-lime)] mb-4">Dealer login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" type="email" className="border rounded px-4 py-2 font-sans" required />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Wachtwoord" type="password" className="border rounded px-4 py-2 font-sans" required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button type="submit" className="px-8 py-4 rounded-lg font-bebas text-2xl bg-[var(--ag-lime)] text-white shadow-lg hover:bg-[var(--ag-grey)] transition-colors mt-2">
          Inloggen
        </button>
      </form>
      <div className="text-sm text-gray-600 mt-4">
        <p>Demo account: demo@dealer.nl / demo123</p>
      </div>
    </section>
  );
} 