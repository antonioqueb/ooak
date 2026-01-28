import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, AlertTriangle } from "lucide-react";

// --- CONFIGURACIÓN DE LA API ---
// Apuntamos directamente a tu instancia de Odoo
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://erp.oneofakind.com.mx/odoo";
const PLACEHOLDER_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// --- INTERFACES (Adaptadas a tu respuesta JSON exacta) ---

interface SectionContent {
  background_text?: string;
  badge?: { icon: string; text: string };
  subtitle: string;
  title: { normal: string; highlight: string };
  description: string;
  cta: { text: string; sub_text?: string; href: string };
  image: { src: string; alt: string; show_badge?: boolean };
}

interface Section {
  id: string;
  type: "hero" | "feature" | "brand_story";
  layout: string;
  content: SectionContent;
}

interface PageData {
  data: {
    seo: {
      title: string;
      description: string;
      keywords: string;
      image: string;
    };
    sections: Section[];
  };
}

// --- FETCHING DE DATOS ---

async function getHomeData(): Promise<PageData | null> {
  // Construimos la URL al endpoint que creamos en el controlador de Odoo
  const endpoint = `${API_URL}/api/v1/home`;
  
  console.log(`🚀 [DEBUG] Iniciando petición a: ${endpoint}`);

  try {
    const res = await fetch(endpoint, {
      // revalidate: 60 -> ISR: Cachea por 60 segs (bueno para producción)
      // cache: "no-store" -> SSR: Siempre busca dato fresco (bueno para dev)
      next: { revalidate: 60 }, 
      headers: {
        "Content-Type": "application/json",
      }
    });

    console.log(`📡 [DEBUG] Status HTTP: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ [DEBUG] Error del servidor Odoo: ${text}`);
      return null;
    }

    const json = await res.json();

    // Validaciones básicas de estructura
    if (json.data && Array.isArray(json.data.sections)) {
       console.log(`✅ [DEBUG] Datos recibidos correctamente. ${json.data.sections.length} secciones encontradas.`);
    } else {
       console.error("⚠️ [DEBUG] Estructura JSON inesperada:", json);
    }

    return json;

  } catch (error) {
    console.error("❌ [DEBUG] Error de conexión:", error);
    return null;
  }
}

// --- METADATA (SEO) ---

export async function generateMetadata() {
  const pageData = await getHomeData();
  
  // Fallback si falla la API
  if (!pageData?.data?.seo) return {
    title: "One Of A Kind | Jasper",
    description: "Luxury stones and crystals."
  };

  const { seo } = pageData.data;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.image ? [seo.image] : [],
    },
  };
}

// --- COMPONENTE PRINCIPAL ---

export default async function Home() {
  const pageData = await getHomeData();

  // 1. MANEJO DE ERRORES / SIN DATOS
  if (!pageData || !pageData.data || !Array.isArray(pageData.data.sections)) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4">
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-sm border border-red-100">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-serif text-[#6C7466] mb-2">Content Unavailable</h1>
            <p className="text-[#6C7466]/70 mb-4">
              Could not retrieve content from Odoo.
            </p>
            <div className="bg-gray-100 p-3 rounded text-left text-xs font-mono text-gray-500 overflow-auto">
              <p>Target: {API_URL}</p>
              <p className="mt-2">Check server logs or Odoo module status.</p>
            </div>
        </div>
      </main>
    );
  }

  const { sections } = pageData.data;
  
  // Extraemos las secciones específicas usando el "type"
  const heroSection = sections.find((s) => s.type === "hero");
  const featureSection = sections.find((s) => s.type === "feature");
  const brandSection = sections.find((s) => s.type === "brand_story");

  // Helper para renderizar iconos dinámicos si fuera necesario
  const renderIcon = (iconName: string) => {
      // Por ahora solo usamos Star, pero aquí podrías agregar un switch
      return <Star className="w-3 h-3 fill-[#6C7466]" />;
  };

  // 2. RENDERIZADO
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] selection:bg-[#6C7466] selection:text-white">
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">
        
        {/* Background Noise effect */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
        <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

        <div className="container mx-auto max-w-7xl relative z-10 space-y-32 md:space-y-48">
          
          {/* --- HERO SECTION --- */}
          {heroSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Image Column */}
              <div className={`order-2 lg:col-span-7 relative group ${heroSection.layout === 'image_right' ? 'lg:order-2' : 'lg:order-1'}`}>
                {heroSection.content.background_text && (
                  <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
                    {heroSection.content.background_text}
                  </div>
                )}

                <div className="relative aspect-[4/5] md:aspect-[16/10] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm z-10">
                  <Image
                    src={heroSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={heroSection.content.image?.alt || "Hero Image"}
                    fill
                    className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                    unoptimized={true} // Importante: permite cargar desde dominio externo sin config extra
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {heroSection.content.badge && heroSection.content.badge.text && (
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">
                        {renderIcon(heroSection.content.badge.icon)}
                        {heroSection.content.badge.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Column */}
              <div className={`order-1 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left ${heroSection.layout === 'image_right' ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <span className="h-px w-6 bg-[#6C7466]"></span>
                  <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                    {heroSection.content.subtitle}
                  </p>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
                  {heroSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B] opacity-80">
                    {heroSection.content.title.highlight}
                  </span>
                </h1>
                <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                  {heroSection.content.description}
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    href={heroSection.content.cta?.href || "#"}
                    className="group relative inline-flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">
                        {heroSection.content.cta?.text}
                      </span>
                      {heroSection.content.cta?.sub_text && (
                        <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                          {heroSection.content.cta.sub_text}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* --- FEATURE SECTION --- */}
          {featureSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              {/* Text (Left usually) */}
              <div className={`order-1 lg:col-span-5 flex flex-col ${featureSection.layout === 'image_left' ? 'lg:order-2 lg:items-start lg:text-left' : 'lg:order-1 lg:items-end lg:text-right'} items-center text-center`}>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  {featureSection.layout !== 'image_left' && featureSection.content.subtitle}
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>
                  {featureSection.layout === 'image_left' && featureSection.content.subtitle}
                </span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8">
                  {featureSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B]">
                    {featureSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md">
                  {featureSection.content.description}
                </p>
                <Link
                  href={featureSection.content.cta?.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  {featureSection.layout !== 'image_left' && (
                    <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                    </span>
                  )}
                  <span>{featureSection.content.cta?.text}</span>
                  {featureSection.layout === 'image_left' && (
                    <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                        <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Link>
              </div>

              {/* Image (Right usually) */}
              <div className={`order-2 lg:col-span-6 relative group ${featureSection.layout === 'image_left' ? 'lg:order-1 lg:col-start-1' : 'lg:order-2 lg:col-start-7'}`}>
                <div className={`absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm transition-transform duration-500 group-hover:translate-y-2 ${featureSection.layout === 'image_left' ? '-translate-x-4 group-hover:-translate-x-2' : 'translate-x-4 group-hover:translate-x-2'}`} />
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                  <Image
                    src={featureSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={featureSection.content.image?.alt || "Feature Image"}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                </div>
              </div>
            </div>
          )}

          {/* --- BRAND STORY SECTION --- */}
          {brandSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              {/* Image (Left usually) */}
              <div className={`order-2 lg:col-span-5 relative group ${brandSection.layout === 'image_right' ? 'lg:order-2 lg:col-start-8' : 'lg:order-1'}`}>
                <div className={`absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm transition-transform duration-500 group-hover:translate-y-2 ${brandSection.layout === 'image_right' ? 'translate-x-4 group-hover:translate-x-2' : '-translate-x-4 group-hover:-translate-x-2'}`} />
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                  <Image
                    src={brandSection.content.image?.src || PLACEHOLDER_IMG}
                    alt={brandSection.content.image?.alt || "Brand Image"}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                  
                  {brandSection.content.image?.show_badge && (
                    <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-full shadow-xl animate-spin-slow-reverse hidden md:block z-10">
                      <div className="border border-[#6C7466]/20 rounded-full p-2">
                        <Star className="w-6 h-6 text-[#6C7466]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Text (Right usually) */}
              <div className={`order-1 lg:col-span-6 flex flex-col items-center text-center ${brandSection.layout === 'image_right' ? 'lg:order-1 lg:items-end lg:text-right lg:col-start-1' : 'lg:order-2 lg:items-start lg:text-left lg:col-start-7'}`}>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>{" "}
                  {brandSection.content.subtitle}
                </span>
                <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
                  {brandSection.content.title.normal} <br />
                  <span className="italic font-light opacity-80 text-[#2B2B2B]">
                    {brandSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 max-w-md">
                  {brandSection.content.description}
                </p>
                <Link
                  href={brandSection.content.cta?.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  <span>{brandSection.content.cta?.text}</span>
                  <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}