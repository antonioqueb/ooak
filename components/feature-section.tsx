import Link from "next/link"

interface FeatureSectionProps {
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  ctaText: string
  reverse?: boolean
}

export function FeatureSection({
  title,
  description,
  imageSrc,
  imageAlt,
  ctaText,
  reverse = false,
}: FeatureSectionProps) {
  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className={`grid lg:grid-cols-2 gap-8 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}>
          {reverse ? (
            <>
              <div>
                <img src={imageSrc || "/placeholder.svg"} alt={imageAlt} className="w-full h-auto object-cover" />
              </div>
              <div className="text-center space-y-6 px-8">
                <h2 className="text-4xl md:text-5xl font-light italic tracking-tight text-balance">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div>
                  <Link
                    href="#"
                    className="text-sm tracking-wider underline underline-offset-4 hover:opacity-70 transition-opacity uppercase"
                  >
                    {ctaText}
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-6 px-8">
                <h2 className="text-4xl md:text-5xl font-light italic tracking-tight text-balance">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                <div>
                  <Link
                    href="#"
                    className="text-sm tracking-wider underline underline-offset-4 hover:opacity-70 transition-opacity uppercase"
                  >
                    {ctaText}
                  </Link>
                </div>
              </div>
              <div>
                <img src={imageSrc || "/placeholder.svg"} alt={imageAlt} className="w-full h-auto object-cover" />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
