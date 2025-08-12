declare global {
  interface Window {
    google: any
  }
}

let googleMapsLoaded = false
let googleMapsLoading = false
let googleMapsCallbacks: (() => void)[] = []

export async function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Als Google Maps al geladen is
    if (googleMapsLoaded && window.google) {
      resolve()
      return
    }

    // Als Google Maps al aan het laden is
    if (googleMapsLoading) {
      googleMapsCallbacks.push(resolve)
      return
    }

    googleMapsLoading = true

    // Controleer of het script al bestaat
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script bestaat al, wacht tot het geladen is
      const checkLoaded = () => {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true
          googleMapsLoading = false
          resolve()
          googleMapsCallbacks.forEach(callback => callback())
          googleMapsCallbacks = []
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      return
    }

    // Laad Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    
    script.onload = () => {
      googleMapsLoaded = true
      googleMapsLoading = false
      resolve()
      googleMapsCallbacks.forEach(callback => callback())
      googleMapsCallbacks = []
    }
    
    script.onerror = () => {
      googleMapsLoading = false
      reject(new Error('Failed to load Google Maps'))
    }
    
    document.head.appendChild(script)
  })
}

export function isGoogleMapsLoaded(): boolean {
  return googleMapsLoaded && !!window.google
}
