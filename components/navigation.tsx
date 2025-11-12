import Link from "next/link"
import { ShoppingCart } from "lucide-react"

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-sm tracking-widest font-medium">
              {"TIENDA"}
            </Link>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2">
            <div className="text-center">
              <div className="text-xl tracking-widest font-semibold">{"REFLECTIONS"}</div>
              <div className="text-[10px] tracking-[0.3em]">{"COPENHAGEN"}</div>
            </div>
          </Link>

          <div className="flex items-center gap-8">
            <Link href="/the-brand" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"LA MARCA"}
            </Link>
            <Link href="/events" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"EVENTOS"}
            </Link>
            <Link href="/bespoke" className="text-sm tracking-wide hover:opacity-70 transition-opacity">
              {"BESPOKE"}
            </Link>
            <Link href="/cart" className="hover:opacity-70 transition-opacity">
              <ShoppingCart className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
