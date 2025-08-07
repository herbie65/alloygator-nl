'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          AlloyGator
        </h1>
        <p className="text-lg text-gray-600">
          Welkom bij AlloyGator - uw specialist in velgbescherming.
        </p>
        <div className="mt-8">
          <a 
            href="/winkel" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          >
            Bekijk onze producten
          </a>
        </div>
      </div>
    </div>
  )
}
