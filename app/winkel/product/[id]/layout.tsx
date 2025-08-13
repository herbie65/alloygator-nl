import { Metadata } from 'next'

// Static product data
const staticProducts = [
  {
    id: '1',
    name: 'AlloyGator Complete Set 17"',
    description: 'Complete set voor 17 inch velgen inclusief montagehulpmiddelen. Professionele velgbescherming die eenvoudig te monteren is en langdurige bescherming biedt tegen stoeprandschade.',
    category: 'alloygator-set',
    image_url: '/product-placeholder.jpg'
  },
  {
    id: '2',
    name: 'AlloyGator Complete Set 18"',
    description: 'Complete set voor 18 inch velgen inclusief montagehulpmiddelen. Ideaal voor grotere velgen die extra bescherming nodig hebben.',
    category: 'alloygator-set',
    image_url: '/product-placeholder.jpg'
  },
  {
    id: '3',
    name: 'Montage Tool Set',
    description: 'Professionele montagehulpmiddelen voor eenvoudige installatie van AlloyGator velgbescherming. Complete set met alle benodigde gereedschappen.',
    category: 'montagehulpmiddelen',
    image_url: '/product-placeholder.jpg'
  },
  {
    id: '4',
    name: 'Vervangingsonderdelen Set',
    description: 'Extra onderdelen voor onderhoud en reparatie van uw AlloyGator velgbescherming. Ideaal voor het vervangen van beschadigde onderdelen.',
    category: 'accessoires',
    image_url: '/product-placeholder.jpg'
  }
]

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const product = staticProducts.find(p => p.id === resolvedParams.id)
  
  if (!product) {
    return {
      title: 'Product niet gevonden',
      description: 'Het opgevraagde product kon niet worden gevonden.'
    }
  }

  return {
    title: product.name,
    description: product.description,
    keywords: [
      'velgbescherming',
      'alloygator',
      product.name.toLowerCase(),
      product.category,
      'auto onderdelen',
      'velg bescherming'
    ],
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description,
      images: [product.image_url],
    },
    alternates: {
      canonical: `/winkel/product/${product.id}`,
    },
  }
}

export async function generateStaticParams() {
  return staticProducts.map((product) => ({
    id: product.id,
  }))
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 