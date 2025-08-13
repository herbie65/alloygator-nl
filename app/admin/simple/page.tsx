export default function SimpleAdminPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Eenvoudige Admin Test</h1>
      <p className="text-gray-600 mb-4">Deze pagina test of de admin routing werkt.</p>
      
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h2 className="font-semibold text-green-900 mb-2">✅ Admin werkt!</h2>
        <p className="text-sm text-green-700">
          Als je deze pagina ziet, werkt de admin sectie correct.
        </p>
      </div>
      
      <div className="mt-6">
        <a 
          href="/admin" 
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Terug naar Dashboard
        </a>
      </div>
    </div>
  )
}
