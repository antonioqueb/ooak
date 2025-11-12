import { BrandStory } from "@/components/brand-story";
import { FeatureSection } from "@/components/feature-section";
import { HeroSection } from "@/components/hero-section";
import { ProductGrid } from "@/components/ProductGrid";

export default function Home() {
  return (
    <>
    
      
      <main className="container mx-auto px-4 py-12">
        <HeroSection />
        <FeatureSection
          title="Cristales Únicos"
          description="Cada pieza es una obra maestra natural, formada durante millones de años en las profundidades de la tierra."
          imageSrc="/producto4.png"
          imageAlt="Colección de cristales"
          ctaText="Explorar Colección"
        />
        <BrandStory />
        <ProductGrid />
      </main>
    </>
  );
}