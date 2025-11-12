import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="/producto5.png"
              alt="Luxury crystal tealight holders"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="text-center lg:text-left space-y-6 order-1 lg:order-2">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              {"Una oferta especial de noviembre"}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-balance">
              {"LEA HEART GREEN TEALIGHT HOLDER"}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">
              {"El mismo cristal en forma de cubo que ya conoces, ahora con corazones en rojo intenso y rosa suave."}
            </p>
            <div>
              <Button variant="link" className="text-foreground underline underline-offset-4 px-0">
                {"Comprar ahora"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
