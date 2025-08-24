'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseClientService } from "@/lib/firebase-client";

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
      const dealers: any[] = await FirebaseClientService.getDealersByEmail(email);
      if (!dealers || dealers.length === 0) {
        setError("Dealer niet gevonden");
        return;
      }
      
      const dealer: any = dealers[0];
      if ((dealer as any).password !== password) {
        setError("Onjuist wachtwoord");
        return;
      }
      
      window.localStorage.setItem("dealerEmail", String(dealer.email || ''));
      window.localStorage.setItem("dealerName", String(dealer.name || ''));
      window.localStorage.setItem("dealerGroup", String(dealer.group || dealer.dealer_group || ''));
      // Geen dealerDiscount meer opslaan - dit komt uit customer_groups
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
    </section>
  );
} 