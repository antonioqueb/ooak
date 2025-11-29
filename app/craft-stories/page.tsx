'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gem, Hammer, ArrowRight, Star, Clock, Mountain, Microscope, MoveDown, Loader2 } from 'lucide-react';

// Mapeo de strings (API) a Componentes Lucide
const iconMap: any = {
  mountain: Mountain,
  hammer: Hammer,
  clock: Clock,
  gem: Gem,
  microscope: Microscope,
  star: Star,
};

export default function CraftStoriesPage() {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://odoo-ooak.alphaqueb.com/api/craft-stories/content');
        if (!res.ok) throw new Error('Error fetching data');
        const json = await res.json();
        setContent(json.data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return <div className="min-h-screen flex items-center justify-center">Error loading content.</div>;
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

      {/* 1. BACKGROUND LAYERS */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="container mx-auto h-full border-x border-[#6C7466]/5 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12">
          <div className="hidden md:block col-span-1 h-full border-r border-[#6C7466]/5"></div>
          <div className="hidden lg:block col-span-1 h-full border-r border-[#6C7466]/5 col-start-12"></div>
        </div>
      </div>

      <div className="relative z-10">

        {/* 2. HERO SECTION */}
        <section className="min-h-[90vh] flex flex-col justify-center container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-screen-2xl mx-auto w-full">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 border-b border-[#6C7466]/20 pb-12">
              <div className="mb-8 md:mb-0">
                <div className="flex items-center gap-2 text-[#6C7466] mb-4">
                  <Star className="w-4 h-4 animate-spin-slow" />
                  <span className="text-xs font-bold tracking-[0.25em] uppercase">{content.hero.est}</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-serif text-[#1a1a1a] tracking-tight leading-[0.9]">
                  {content.hero.title_raw} <br />
                  <span className="italic font-light text-[#6C7466]">{content.hero.title_pure}</span>
                </h1>
              </div>
              <div className="max-w-sm pb-2">
                <p className="text-sm md:text-base text-gray-500 font-light leading-relaxed text-justify">
                  {content.hero.description}
                </p>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-[#6C7466]/60">SCROLL TO DISCOVER</span>
              <div className="w-12 h-12 rounded-full border border-[#6C7466]/20 flex items-center justify-center animate-bounce duration-3000">
                <MoveDown className="w-4 h-4 text-[#6C7466]" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. INFINITE MARQUEE */}
        <div className="w-full border-y border-[#6C7466]/10 bg-[#6C7466]/5 py-4 overflow-hidden mb-32">
          <div className="whitespace-nowrap animate-marquee flex gap-12">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-4xl font-serif italic text-[#6C7466]/40">
                {content.marquee}
              </span>
            ))}
          </div>
        </div>

        {/* 4. THE CHAPTERS (Dynamic Rendering) */}
        <section className="container mx-auto px-6 mb-40">
          {content.chapters.map((chapter: any, index: number) => {
            const isEven = index % 2 === 0; // Para alternar izquierda/derecha
            const ChapterIcon = iconMap[chapter.icon] || Star;

            // Fallback images si la API viene vacía (para que se vea bonito el demo)
            const fallbackImage = isEven 
              ? "https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=1600&auto=format&fit=crop"
              : "https://images.unsplash.com/photo-1597523920677-24a9d7743d50?q=80&w=1600&auto=format&fit=crop";

            return (
              <div key={chapter.id} className="grid lg:grid-cols-2 gap-16 items-center mb-40 group">
                
                {/* Image Side */}
                <div className={`${isEven ? 'order-2 lg:order-1' : 'relative'} relative`}>
                  <div className="aspect-[4/5] overflow-hidden bg-gray-200 relative">
                    <img
                      src={chapter.image_url || fallbackImage}
                      alt={chapter.title.main}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />
                    <div className={`absolute top-4 ${isEven ? 'left-4' : 'right-4'} bg-[#FDFBF7] px-3 py-1 text-xs font-bold tracking-widest uppercase text-[#6C7466]`}>
                      {chapter.fig_label}
                    </div>
                  </div>
                </div>

                {/* Text Side */}
                <div className={`${isEven ? 'order-1 lg:order-2 lg:pl-12' : 'lg:pr-12'} relative`}>
                  <span className={`text-9xl font-serif text-[#6C7466]/10 absolute -translate-y-16 select-none ${isEven ? '-translate-x-8' : 'right-0 lg:right-12'}`}>
                    {chapter.number}
                  </span>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <ChapterIcon className="w-5 h-5 text-[#6C7466]" />
                      <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase">
                        {chapter.label_top}
                      </span>
                    </div>
                    
                    <h2 className="text-5xl md:text-6xl font-serif text-[#2B2B2B] mb-8 leading-[1.1]">
                      {chapter.title.main} <br />
                      <span className="italic text-[#6C7466]">{chapter.title.italic}</span>
                    </h2>
                    
                    <p className="text-lg text-gray-600 font-light leading-relaxed mb-8">
                      {chapter.description}
                    </p>

                    {/* Features List (Conditional) */}
                    {chapter.features && chapter.features.length > 0 && (
                      <ul className="space-y-4 border-t border-[#6C7466]/20 pt-6">
                        {chapter.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6C7466]"></span> {feature}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Video Button (Conditional - solo ejemplo visual si no hay features) */}
                    {(!chapter.features || chapter.features.length === 0) && (
                      <div className="flex gap-4">
                        <div className="px-6 py-3 border border-[#6C7466]/30 text-[#6C7466] text-xs font-bold uppercase tracking-widest hover:bg-[#6C7466] hover:text-white transition-all cursor-pointer">
                          Watch Video
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* 5. DETAILS BENTO GRID */}
        {content.bento_grid && (
          <section className="bg-[#6C7466] text-[#FDFBF7] py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div className="container mx-auto px-6 relative z-10">
              <div className="max-w-xl mb-16">
                <h3 className="text-4xl font-serif mb-4">{content.bento_grid.title}</h3>
                <p className="opacity-80 font-light">It is not just art; it is mineralogy. Understanding the physical properties allows us to push boundaries.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#FDFBF7]/20 border border-[#FDFBF7]/20">
                {content.bento_grid.cards.map((card: any, idx: number) => {
                  const CardIcon = iconMap[card.icon] || Star;
                  return (
                    <div key={idx} className="bg-[#6C7466] p-10 hover:bg-[#5e6659] transition-colors group">
                      <CardIcon className="w-8 h-8 mb-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <h4 className="text-xl font-serif mb-2">{card.title}</h4>
                      <p className="text-sm opacity-70 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 6. BIG QUOTE SECTION */}
        <section className="py-40 container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <Star className="w-6 h-6 text-[#6C7466] mx-auto mb-10" />
            <blockquote className="text-4xl md:text-6xl font-serif leading-tight text-[#2B2B2B]">
              {content.quote.text}
            </blockquote>
            <cite className="block mt-8 text-sm font-bold tracking-widest text-[#6C7466] uppercase not-italic">
              — {content.quote.author}
            </cite>
          </div>
        </section>

        {/* 7. FOOTER CTA */}
        <div className="pb-20 text-center relative z-10">
          <div className="inline-block relative group">
            <div className="absolute inset-0 bg-[#6C7466] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <Link href={content.footer.link || "#"} className="relative z-10 flex items-center gap-6 px-12 py-6 bg-[#2B2B2B] rounded-full text-[#FDFBF7] overflow-hidden transition-transform active:scale-95">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#6C7466]">
                  {content.footer.label}
                </span>
                <span className="text-xl font-serif italic">{content.footer.cta}</span>
              </div>
              <div className="w-10 h-10 bg-[#6C7466] rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>

          <div className="mt-16 text-[10px] uppercase tracking-widest text-gray-400">
            © 2024 Craft Stories · Designed with purpose
          </div>
        </div>

      </div>
    </main>
  );
}