import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Add generateStaticParams for static export
export async function generateStaticParams() {
  return [
    { slug: 'about' },
    { slug: 'contact' },
    { slug: 'privacy' },
    { slug: 'terms' }
  ]
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  
  // For now, return static metadata to avoid Firebase errors during build
  return {
    title: `${resolvedParams.slug.charAt(0).toUpperCase() + resolvedParams.slug.slice(1)} - AlloyGator Nederland`,
    description: 'AlloyGator Nederland - Professionele velgbescherming tegen stoeprandschade',
    keywords: 'velgbescherming, stoeprandschade, alloygator',
  }
}

export default async function CmsPage({ params }: PageProps) {
  const resolvedParams = await params
  
  // For now, show a simple page to avoid Firebase errors during build
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {resolvedParams.slug.charAt(0).toUpperCase() + resolvedParams.slug.slice(1)}
          </h1>
        </div>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="prose prose-lg max-w-none">
            <p>Deze pagina wordt momenteel geladen...</p>
            <p>Voor dynamische content, log in op de admin panel.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 