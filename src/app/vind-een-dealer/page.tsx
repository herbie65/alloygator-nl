'use client'

export default function VindEenDealer() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Vind een Dealer
        </h1>
        <p className="text-lg text-gray-600">
          Zoek een dealer bij u in de buurt.
        </p>
        <div className="mt-8">
          <a 
            href="/" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Terug naar home
          </a>
        </div>
      </div>
    </div>
  )
} 