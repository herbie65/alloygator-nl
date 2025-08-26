// app/home/page.tsx
// Complete homepagina met CMS-support + graceful fallbacks
import Image from "next/image";

export const revalidate = 60; // refresh deze pagina elke 60s indien CMS-data verandert

type CMSImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

type CMSProduct = {
  id: string | number;
  name: string;
  slug?: string;
  price?: number;
  image?: CMSImage;
  badge?: string;
};

type CMSHomeData = {
  hero: {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    image?: CMSImage;
  };
  usps?: Array<{ title: string; description?: string; icon?: string }>;
  products?: CMSProduct[];
  testimonials?: Array<{ quote: string; author: string }>;
  faq?: Array<{ q: string; a: string }>;
};

// ---- CMS fetch (optioneel). Valt terug op defaults als er geen endpoint is. ----
async function getHomeData(): Promise<CMSHomeData | null> {
  try {
    const res = await fetch("/api/cms/home", {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`CMS ${res.status}`);
    const data = (await res.json()) as CMSHomeData;
    return data;
  } catch (error) {
    console.error('Error loading CMS data:', error);
    return null;
  }
}

// ---- UI helpers ----
function formatPrice(n?: number) {
  if (typeof n !== "number") return "";
  try {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `€ ${n.toFixed(2)}`;
  }
}

// ---- PAGE ----
export default async function HomePage() {
  const data = await getHomeData();

  // Geen fallback meer - toon foutmelding als er geen data is
  if (!data || !data.hero) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Geen content beschikbaar</h1>
          <p className="text-gray-600">De CMS data kon niet worden geladen. Controleer je database verbinding.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl bg-gray-100">
        <div className="grid md:grid-cols-2 gap-8 items-center p-6 md:p-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              {data.hero.title}
            </h1>
            {data.hero.subtitle && (
              <p className="text-gray-600 text-lg md:text-xl">{data.hero.subtitle}</p>
            )}
            {data.hero.ctaLabel && data.hero.ctaHref && (
              <a
                href={data.hero.ctaHref}
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 bg-black text-white hover:opacity-90 transition"
              >
                {data.hero.ctaLabel}
              </a>
            )}
          </div>

          <div className="relative aspect-[16/10] w-full">
            {data.hero.image?.url && (
              <Image
                src={data.hero.image.url}
                alt={data.hero.image.alt || "Hero"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover rounded-xl"
                priority
              />
            )}
          </div>
        </div>
      </section>

      {/* USP’s */}
      {data.usps && data.usps.length > 0 && (
        <section className="grid md:grid-cols-3 gap-6">
          {data.usps.map((u, i) => (
            <div
              key={`${u.title}-${i}`}
              className="rounded-2xl border p-6 bg-white shadow-sm"
            >
              <div className="text-lg font-semibold">{u.title}</div>
              {u.description && (
                <p className="text-gray-600 mt-1">{u.description}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {/* PRODUCT TEASERS */}
      {data.products && data.products.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Onze favorieten</h2>
            <a href="/winkel" className="text-sm underline hover:opacity-80">
              Alles bekijken
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.products.map((p) => (
              <a
                key={p.id}
                href={p.slug ? `/winkel/${p.slug}` : "#"}
                className="group rounded-2xl border bg-white overflow-hidden hover:shadow-md transition"
              >
                <div className="relative aspect-square">
                  {p.image?.url ? (
                    <Image
                      src={p.image.url}
                      alt={p.image.alt || p.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                  {p.badge && (
                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-medium shadow">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="font-medium">{p.name}</div>
                  {typeof p.price === "number" && (
                    <div className="text-gray-600 mt-1">{formatPrice(p.price)}</div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {data.testimonials && data.testimonials.length > 0 && (
        <section className="rounded-2xl bg-gray-50 p-6 md:p-10 space-y-6">
          <h2 className="text-2xl font-semibold">Wat klanten zeggen</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {data.testimonials.map((t, i) => (
              <figure
                key={`${t.author}-${i}`}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <blockquote className="text-gray-800">“{t.quote}”</blockquote>
                <figcaption className="mt-3 text-sm text-gray-600">
                  — {t.author}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {data.faq && data.faq.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Veelgestelde vragen</h2>
          <div className="divide-y rounded-2xl border bg-white">
            {data.faq.map((f, i) => (
              <details key={`${f.q}-${i}`} className="p-5">
                <summary className="cursor-pointer font-medium">{f.q}</summary>
                <p className="mt-2 text-gray-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}