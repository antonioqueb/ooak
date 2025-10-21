// components/navbar.tsx
"use client"

// NOTA: Esta tienda NO maneja cuentas de usuario ni sesiones.
// Todo el seguimiento de pedidos se realiza por correo electrónico.
// Los usuarios compran como invitados y reciben links de seguimiento por email.

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingCart, Search, Menu, X, ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Define la barra superior con enlaces principales
const topBarLinks = [
  { name: "SHOP", href: "#", hasMenu: true },
  { name: "THE BRAND", href: "/the-brand", hasMenu: false },
  { name: "CRAFT STORIES", href: "/craft-stories", hasMenu: false },
  { name: "NEWS & EVENTS", href: "/news-events", hasMenu: false },
  { name: "PROJECTS", href: "/projects", hasMenu: false },
]

// Define las colecciones principales con sus subcategorías
const collections = [
  {
    name: "ALLOY COLLECTION",
    description: "Metal Sculptures",
    href: "/collections/alloy",
    items: []
  },
  {
    name: "CRYSTAL COLLECTION",
    description: "",
    href: "/collections/crystal",
    items: []
  },
  {
    name: "EARTH COLLECTION",
    description: "Mineral Specimens",
    href: "/collections/earth",
    items: []
  },
  {
    name: "FOSSILS",
    description: "",
    href: "/collections/fossils",
    items: []
  },
  {
    name: "PETRIFIED WOOD",
    description: "",
    href: "/collections/petrified-wood",
    items: []
  },
  {
    name: "HERITAGE COLLECTION",
    description: "Pots & Vases",
    href: "/collections/heritage",
    items: [
      { name: "POTS", href: "/collections/heritage/pots" },
      { name: "VASES", href: "/collections/heritage/vases" },
      { name: "HOME DÉCOR", href: "/collections/heritage/home-decor" },
    ]
  },
  {
    name: "LUMEN COLLECTION",
    description: "Lamps",
    href: "/collections/lumen",
    items: []
  },
  {
    name: "OCEAN COLLECTION",
    description: "Marine Treasures",
    href: "/collections/ocean",
    items: [
      { name: "CORALS", href: "/collections/ocean/corals" },
      { name: "SHELLS", href: "/collections/ocean/shells" },
    ]
  },
  {
    name: "SERENITY COLLECTION",
    description: "Fountains",
    href: "/collections/serenity",
    items: [
      { name: "LIMESTONE FOUNTAINS", href: "/collections/serenity/limestone" },
      { name: "JAR FOUNTAINS", href: "/collections/serenity/jar" },
    ]
  },
]

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isShopMenuOpen, setIsShopMenuOpen] = React.useState(false)
  const [expandedCollection, setExpandedCollection] = React.useState<string | null>(null)
  const pathname = usePathname()
  const [cartItemsCount, setCartItemsCount] = React.useState(3)
  const shopMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleShopMouseEnter = () => {
    if (shopMenuTimeoutRef.current) {
      clearTimeout(shopMenuTimeoutRef.current)
    }
    setIsShopMenuOpen(true)
  }

  const handleShopMouseLeave = () => {
    shopMenuTimeoutRef.current = setTimeout(() => {
      setIsShopMenuOpen(false)
    }, 200)
  }

  const toggleCollection = (collectionName: string) => {
    setExpandedCollection(expandedCollection === collectionName ? null : collectionName)
  }

  return (
    <header 
      className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-[#6C7466]/95"
      style={{ backgroundColor: '#6C7466' }}
    >
      {/* Barra superior con enlaces principales - Solo visible en desktop */}
      <div 
        className="hidden lg:block border-b border-white/15"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center h-10 gap-8">
            {topBarLinks.map((link) => (
              <div 
                key={link.name}
                className="relative"
                onMouseEnter={link.hasMenu ? handleShopMouseEnter : undefined}
                onMouseLeave={link.hasMenu ? handleShopMouseLeave : undefined}
              >
                {link.hasMenu ? (
                  <button
                    className="text-xs font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    className="text-xs font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Menú desplegable SHOP - Desktop */}
      {isShopMenuOpen && (
        <div 
          className="absolute left-0 right-0 top-full z-50 hidden lg:block animate-in fade-in-0 slide-in-from-top-2"
          onMouseEnter={handleShopMouseEnter}
          onMouseLeave={handleShopMouseLeave}
        >
          <div 
            className="border-t border-b border-white/15 shadow-lg"
            style={{ backgroundColor: '#6C7466' }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <div key={collection.name} className="space-y-2">
                    <Link
                      href={collection.href}
                      className="block group"
                    >
                      <h3 className="text-sm font-bold text-white tracking-wide group-hover:text-white/80 transition-colors">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-xs text-white/60 mt-0.5">
                          {collection.description}
                        </p>
                      )}
                    </Link>
                    {collection.items.length > 0 && (
                      <ul className="ml-3 space-y-1.5 mt-3">
                        {collection.items.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className="text-xs text-white/70 hover:text-white transition-colors block"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra principal de navegación */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Menú Hamburguesa - Izquierda - Solo en móvil */}
          <div className="flex items-center">
            {/* Espaciador invisible en desktop para balance */}
            <div className="hidden lg:block w-10"></div>
            
            {/* Menú hamburguesa visible solo en móvil */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white hover:bg-white/10 hover:text-white h-10 w-10"
                >
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-[300px] sm:w-[400px] overflow-y-auto p-6"
                style={{ 
                  backgroundColor: '#6C7466',
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <SheetTitle className="text-white text-xl font-bold mb-6">
                  MENU
                </SheetTitle>
                
                {/* Enlaces de la barra superior en mobile */}
                <nav className="flex flex-col gap-3 mb-8 pb-6 border-b border-white/20">
                  {topBarLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider py-2 px-2 hover:bg-white/10 rounded-md"
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>

                {/* Colecciones en mobile */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-white/60 tracking-widest mb-4 px-2">
                    COLLECTIONS
                  </h3>
                  <nav className="flex flex-col gap-2">
                    {collections.map((collection) => (
                      <div key={collection.name} className="border-b border-white/10 pb-3">
                        {collection.items.length > 0 ? (
                          <>
                            <button
                              onClick={() => toggleCollection(collection.name)}
                              className="flex items-center justify-between w-full text-left py-3 px-3 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors"
                            >
                              <div className="flex-1 pr-2 min-w-0">
                                <div className="font-semibold tracking-wide break-words">
                                  {collection.name}
                                </div>
                                {collection.description && (
                                  <div className="text-xs text-white/60 mt-1 break-words">
                                    {collection.description}
                                  </div>
                                )}
                              </div>
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200 flex-shrink-0 ml-2",
                                  expandedCollection === collection.name && "rotate-180"
                                )}
                              />
                            </button>
                            
                            {expandedCollection === collection.name && (
                              <div className="ml-3 mt-2 space-y-1 animate-in slide-in-from-top-2">
                                <Link
                                  href={collection.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="block py-2.5 px-4 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors font-medium"
                                >
                                  VIEW ALL
                                </Link>
                                {collection.items.map((item) => (
                                  <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="block py-2.5 px-4 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors break-words"
                                  >
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={collection.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block py-3 px-3 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors"
                          >
                            <div className="font-semibold tracking-wide break-words">
                              {collection.name}
                            </div>
                            {collection.description && (
                              <div className="text-xs text-white/60 mt-1 break-words">
                                {collection.description}
                              </div>
                            )}
                          </Link>
                        )}
                      </div>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Centro */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={400}
                height={200}
                className="h-12 sm:h-14 md:h-16 lg:h-20 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Búsqueda y Carrito - Derecha */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>

            {/* Cart Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-white hover:bg-white/10 hover:text-white h-10 w-10" 
              asChild
            >
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
                <span className="sr-only">Carrito de compras</span>
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Search Bar - Expandable */}
      {isSearchOpen && (
        <div 
          className="border-t border-white/20 animate-in slide-in-from-top-2"
          style={{ backgroundColor: '#6C7466' }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <Input
                  type="search"
                  placeholder="Buscar productos..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/50 h-10"
                  autoFocus
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchOpen(false)}
                className="text-white hover:bg-white/10 hover:text-white h-9 w-9 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}