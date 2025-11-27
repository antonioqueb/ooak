import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface FeatureSectionProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  ctaText: string;
  href?: string; // Agregué esto para que el link sea funcional
  reverse?: boolean;
}

export function FeatureSection({
  title,
  description,
  imageSrc,
  imageAlt,
  ctaText,
  href = "#",
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">
      
      {/* 1. Background Grain (Textura de papel/film) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
      />

      {/* Líneas Arquitectónicas Verticales */}
      <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          
          {/* 
             2. Lógica de Reversión vía CSS Grid 
             Si es reverse: La imagen va a la col-start-8 (derecha) y el texto a la izquierda.
             Si no es reverse: La imagen va a la col-span-5 (izquierda) y el texto a la derecha.
          */}
          
          {/* --- COLUMNA IMAGEN --- */}
          <div className={`relative group ${reverse ? "lg:col-span-6 lg:col-start-7 lg:order-2" : "lg:col-span-5 lg:order-1"}`}>
            
            {/* Marco decorativo (Offset border) */}
            <div className={`absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm transition-transform duration-500 group-hover:translate-x-0 group-hover:translate-y-0 ${reverse ? "translate-x-4 translate-y-4" : "-translate-x-4 translate-y-4"}`} />

            <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
              <Image 
                src={imageSrc || "/placeholder.svg"} 
                alt={imageAlt} 
                fill
                className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Filtro sutil para unificar tono */}
              <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
            </div>
          </div>

          {/* --- COLUMNA TEXTO --- */}
          <div className={`flex flex-col justify-center ${reverse ? "lg:col-span-5 lg:col-start-1 lg:order-1 lg:text-right lg:items-end" : "lg:col-span-6 lg:col-start-7 lg:order-2 lg:text-left lg:items-start"}`}>
            
            {/* Tag decorativo */}
            <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
               {!reverse && <span className="w-8 h-px bg-[#6C7466]/40"></span>}
               Featured Story
               {reverse && <span className="w-8 h-px bg-[#6C7466]/40"></span>}
            </span>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8">
              {title}
            </h2>
            
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md">
              {description}
            </p>

            <Link
              href={href}
              className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
            >
              {reverse && (
                 <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                 </span>
              )}
              
              <span>{ctaText}</span>

              {!reverse && (
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}