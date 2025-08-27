'use client';

import { useState, useEffect, useRef } from 'react'

interface MollieCreditCardProps {
  onTokenCreated: (token: string) => void;
  onError: (error: string) => void;
  loading: boolean;
}

declare global {
  interface Window {
    Mollie: any;
  }
}

export default function MollieCreditCard({ onTokenCreated, onError, loading }: MollieCreditCardProps) {
  const [mollieLoaded, setMollieLoaded] = useState(false);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const cardNumberRef = useRef<HTMLDivElement>(null);
  const cardHolderRef = useRef<HTMLDivElement>(null);
  const expiryDateRef = useRef<HTMLDivElement>(null);
  const verificationCodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Mollie.js script
    const script = document.createElement('script');
    script.src = 'https://js.mollie.com/v1/mollie.js';
    script.onload = () => {
      setMollieLoaded(true);
    };
    script.onerror = () => {
      onError('Fout bij laden van Mollie.js');
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onError]);

  useEffect(() => {
    if (!mollieLoaded || !window.Mollie) return;

    try {
      // Initialize Mollie with your profile ID and custom styling
      const mollie = window.Mollie({
        profileId: process.env.NEXT_PUBLIC_MOLLIE_PROFILE_ID,
        locale: 'nl_NL',
        testmode: process.env.NEXT_PUBLIC_MOLLIE_TEST_MODE === 'true',
        styles: {
          base: {
            fontSize: '16px',
            color: '#374151',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            '::placeholder': {
              color: '#9CA3AF'
            }
          },
          valid: {
            color: '#059669'
          },
          invalid: {
            color: '#DC2626'
          },
          ':focus': {
            outline: 'none',
            borderColor: '#10B981'
          }
        }
      });

      // Create and mount components
      if (cardNumberRef.current) {
        const cardNumber = mollie.createComponent('cardNumber');
        cardNumber.mount('#card-number');
        
        cardNumber.addEventListener('change', (event: any) => {
          if (event.error && event.touched) {
            setErrors(prev => ({ ...prev, cardNumber: event.error }));
          } else {
            setErrors(prev => ({ ...prev, cardNumber: '' }));
          }
        });
      }

      if (cardHolderRef.current) {
        const cardHolder = mollie.createComponent('cardHolder');
        cardHolder.mount('#card-holder');
        
        cardHolder.addEventListener('change', (event: any) => {
          if (event.error && event.touched) {
            setErrors(prev => ({ ...prev, cardHolder: event.error }));
          } else {
            setErrors(prev => ({ ...prev, cardHolder: '' }));
          }
        });
      }

      if (expiryDateRef.current) {
        const expiryDate = mollie.createComponent('expiryDate');
        expiryDate.mount('#expiry-date');
        
        expiryDate.addEventListener('change', (event: any) => {
          if (event.error && event.touched) {
            setErrors(prev => ({ ...prev, expiryDate: event.error }));
          } else {
            setErrors(prev => ({ ...prev, expiryDate: '' }));
          }
        });
      }

      if (verificationCodeRef.current) {
        const verificationCode = mollie.createComponent('verificationCode');
        verificationCode.mount('#verification-code');
        
        verificationCode.addEventListener('change', (event: any) => {
          if (event.error && event.touched) {
            setErrors(prev => ({ ...prev, verificationCode: event.error }));
          } else {
            setErrors(prev => ({ ...prev, verificationCode: '' }));
          }
        });
      }

      // Store mollie instance for token creation
      (window as any).mollieInstance = mollie;

    } catch (error) {
      console.error('Error initializing Mollie Components:', error);
      onError('Fout bij initialiseren van Mollie Components');
    }
  }, [mollieLoaded, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!window.Mollie || !(window as any).mollieInstance) {
      onError('Mollie is niet geladen');
      return;
    }

    try {
      const { token, error } = await (window as any).mollieInstance.createToken();

      if (error) {
        onError('Fout bij aanmaken van betalingstoken');
        return;
      }

      if (token) {
        setCardToken(token);
        onTokenCreated(token);
      }
    } catch (error) {
      console.error('Error creating token:', error);
      onError('Fout bij aanmaken van betalingstoken');
    }
  };

  if (!mollieLoaded) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Mollie laden...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Creditcard Gegevens
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kaartnummer
            </label>
            <div id="card-number" ref={cardNumberRef} className="w-full h-12 border border-gray-300 rounded-lg bg-white shadow-sm transition-all duration-200 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"></div>
            {errors.cardNumber && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {errors.cardNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kaarthouder
            </label>
            <div id="card-holder" ref={cardHolderRef} className="w-full h-12 border border-gray-300 rounded-lg bg-white shadow-sm transition-all duration-200 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"></div>
            {errors.cardHolder && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {errors.cardHolder}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vervaldatum
              </label>
              <div id="expiry-date" ref={expiryDateRef} className="w-full h-12 border border-gray-300 rounded-lg bg-white shadow-sm transition-all duration-200 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"></div>
              {errors.expiryDate && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.expiryDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVC
              </label>
              <div id="verification-code" ref={verificationCodeRef} className="w-full h-12 border border-gray-300 rounded-lg bg-white shadow-sm transition-all duration-200 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-200"></div>
              {errors.verificationCode && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.verificationCode}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {cardToken && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            ✅ Betalingstoken aangemaakt: {cardToken.substring(0, 8)}...
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !!cardToken}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-lg font-medium text-lg shadow-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Verwerken...
          </div>
        ) : cardToken ? (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 text-white mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Token aangemaakt
          </div>
        ) : (
          'Betalingstoken aanmaken'
        )}
      </button>
    </form>
  );
}
