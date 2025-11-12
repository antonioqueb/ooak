export function BrandStory() {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <img
              src="/producto3.png"
              alt="Crystal decorative objects"
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="space-y-6 text-center lg:text-left order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-light italic tracking-tight">{"THE BRAND"}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {
                "One of a Kind presenta piezas únicas de la naturaleza que cuentan historias milenarias. Cada mineral, gema y fósil es auténtico y cuidadosamente seleccionado, ofreciendo una conexión especial con la tierra y su fascinante historia geológica."
              }
            </p>
            <div>
              <a
                href="#"
                className="text-sm tracking-wider underline underline-offset-4 hover:opacity-70 transition-opacity uppercase"
              >
                {"Leer más"}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
