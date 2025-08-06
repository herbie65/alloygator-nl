'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface User {
  id: string
  voornaam: string
  achternaam: string
  email: string
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userData = localStorage.getItem('currentUser')
    
    if (isLoggedIn && userData) {
      try {
        const user = JSON.parse(userData)
        setUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    // Load cart count
    const savedCart = localStorage.getItem('alloygator-cart')
    if (savedCart) {
      const cart = JSON.parse(savedCart)
      setCartCount(cart.length)
    }

    // Load wishlist count
    const savedWishlist = localStorage.getItem('alloygator-wishlist')
    if (savedWishlist) {
      const wishlist = JSON.parse(savedWishlist)
      setWishlistCount(wishlist.length)
    }

    setLoading(false)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('isLoggedIn')
    setUser(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm" data-version="3.0">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-600">
                AlloyGator
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/winkel" className="text-gray-700 hover:text-green-600 transition-colors">
              Winkel
            </Link>
            <Link href="/vind-een-dealer" className="text-gray-700 hover:text-green-600 transition-colors">
              Vind een Dealer
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
                          {/* Wishlist */}
              <Link href="/wishlist" className="relative text-gray-700 hover:text-green-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative text-gray-700 hover:text-green-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

            {/* User Account / Login */}
            {user ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors">
                  <span className="hidden md:inline">Hallo, {user.voornaam}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mijn Account
                  </Link>
                  <Link href="/account?tab=orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mijn Bestellingen
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Uitloggen
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" className="text-gray-700 hover:text-green-600 transition-colors">
                  Inloggen
                </Link>
                <span className="text-gray-400">|</span>
                <Link href="/auth/register" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Registreren
                </Link>
              </div>
            )}

            {/* Dealer Login */}
            <Link href="/dealer-login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Dealer Login
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
} 