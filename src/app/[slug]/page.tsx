import { Metadata } from 'next'
import { getDatabase } from '@/lib/database'
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
  try {
    const db = await getDatabase()
    const resolvedParams = await params
    const page = await db.get('SELECT * FROM cms_pages WHERE slug = ? AND is_active = 1', resolvedParams.slug)
    
    if (!page) {
      return {
        title: 'Page Not Found - AlloyGator Nederland',
        description: 'De opgevraagde pagina kon niet worden gevonden.'
      }
    }

    return {
      title: `${page.title} - AlloyGator Nederland`,
      description: page.meta_description || 'AlloyGator Nederland - Professionele velgbescherming',
      keywords: page.meta_keywords || 'velgbescherming, stoeprandschade, alloygator',
      openGraph: {
        title: page.title,
        description: page.meta_description,
        images: page.image ? [page.image] : [],
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'AlloyGator Nederland',
      description: 'Professionele velgbescherming tegen stoeprandschade'
    }
  }
}

export default async function CmsPage({ params }: PageProps) {
  try {
    const db = await getDatabase()
    const resolvedParams = await params
    const page = await db.get('SELECT * FROM cms_pages WHERE slug = ? AND is_active = 1', resolvedParams.slug)
    
    if (!page) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{page.title}</h1>
            {page.image && (
              <div className="mb-6">
                <img 
                  src={page.image} 
                  alt={page.title}
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          {/* Page Content */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>

          {/* SEO Info (only visible in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">SEO Info (Development)</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Meta Description:</strong> {page.meta_description}</p>
                <p><strong>Meta Keywords:</strong> {page.meta_keywords}</p>
                <p><strong>Slug:</strong> {page.slug}</p>
                <p><strong>Last Updated:</strong> {new Date(page.updated_at).toLocaleDateString('nl-NL')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading CMS page:', error)
    notFound()
  }
} 