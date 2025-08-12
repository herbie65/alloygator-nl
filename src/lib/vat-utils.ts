export interface VatSettings {
  vat_settings: Array<{
    country_code: string
    country_name: string
    standard_rate: number
    reduced_rate: number
    zero_rate: number
  }>
  display_settings: {
    frontend_prices_include_vat: boolean
    dealer_prices_exclude_vat: boolean
  }
}

export interface Product {
  id: number | string
  name: string
  description: string
  price: number
  category: string
  stock: number
  image?: string | null
  vat_category?: string
}

// Simple VAT calculation function for frontend
export const calculatePriceWithVat = (price: number, vatRate: number): number => {
  return price * (1 + vatRate / 100)
}

// Simple VAT display text function for frontend
export const getVatDisplayText = (vatRate: number, countryCode: string = 'NL'): string => {
  if (vatRate === 0) return '0% BTW'
  return `${vatRate}% BTW incl.`
}

// Original complex function for backend
export const calculatePriceWithVatComplex = (
  product: Product, 
  vatSettings: VatSettings | null, 
  isDealer: boolean = false,
  countryCode: string = 'NL'
): { price: number; vatIncluded: boolean; vatRate: number } => {
  if (!vatSettings) {
    return { price: product.price, vatIncluded: false, vatRate: 0 }
  }

  // Check if dealer should see prices excl VAT
  if (isDealer && vatSettings.display_settings.dealer_prices_exclude_vat) {
    return { price: product.price, vatIncluded: false, vatRate: 0 }
  }

  // Check if frontend should show prices incl VAT
  if (vatSettings.display_settings.frontend_prices_include_vat) {
    // Get VAT rates for the country
    const countryVat = vatSettings.vat_settings.find(s => s.country_code === countryCode)
    if (!countryVat) {
      return { price: product.price, vatIncluded: false, vatRate: 0 }
    }

    // Calculate VAT based on product category
    let vatRate = countryVat.standard_rate
    if (product.vat_category === 'reduced') {
      vatRate = countryVat.reduced_rate
    } else if (product.vat_category === 'zero') {
      vatRate = 0
    }

    const priceWithVat = product.price * (1 + vatRate / 100)
    return { price: priceWithVat, vatIncluded: true, vatRate }
  }

  return { price: product.price, vatIncluded: false, vatRate: 0 }
}

export const getVatDisplayTextComplex = (
  vatSettings: VatSettings | null,
  isDealer: boolean = false
): string => {
  if (!vatSettings) return ''

  if (isDealer && vatSettings.display_settings.dealer_prices_exclude_vat) {
    return 'excl. BTW'
  }

  if (vatSettings.display_settings.frontend_prices_include_vat) {
    return 'incl. BTW'
  }

  return 'excl. BTW'
} 