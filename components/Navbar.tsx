// components/navbar.tsx
"use client"

// NOTA: Esta tienda NO maneja cuentas de usuario ni sesiones.
// Todo el seguimiento de pedidos se realiza por correo electrónico.
// Los usuarios compran como invitados y reciben links de seguimiento por email.

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingCart, Search, Menu, X, ChevronRight } from "lucide-react"

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
    href: "/collections/alloy",
    items: [
      { name: "Metal Sculptures", href: "/collections/alloy/metal-sculptures" },
    ]
  },
  {
    name: "CRYSTAL COLLECTION",
    href: "/collections/crystal",
    items: []
  },
  {
    name: "EARTH COLLECTION",
    href: "/collections/earth",
    items: [
      { name: "Mineral Specimens", href: "/collections/earth/mineral-specimens" },
    ]
  },
  {
    name: "FOSSILS",
    href: "/collections/fossils",
    items: []
  },
  {
    name: "PETRIFIED WOOD",
    href: "/collections/petrified-wood",
    items: []
  },
  {
    name: "HERITAGE COLLECTION",
    href: "/collections/heritage",
    items: [
      { name: "Pots", href: "/collections/heritage/pots" },
      { name: "Vases", href: "/collections/heritage/vases" },
      { name: "Home Décor", href: "/collections/heritage/home-decor" },
    ]
  },
  {
    name: "LUMEN COLLECTION",
    href: "/collections/lumen",
    items: [
      { name: "Lamps", href: "/collections/lumen/lamps" },
    ]
  },
  {
    name: "OCEAN COLLECTION",
    href: "/collections/ocean",
    items: [
      { name: "Corals", href: "/collections/ocean/corals" },
      { name: "Shells", href: "/collections/ocean/shells" },
    ]
  },
  {
    name: "SERENITY COLLECTION",
    href: "/collections/serenity",
    items: [
      { name: "Limestone Fountains", href: "/collections/serenity/limestone" },
      { name: "Jar Fountains", href: "/collections/serenity/jar" },
    ]
  },
]

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isShopMenuOpen, setIsShopMenuOpen] = React.useState(false)
  const [isShopPanelOpen, setIsShopPanelOpen] = React.useState(false)
  const [selectedCollection, setSelectedCollection] = React.useState<typeof collections[0] | null>(null)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)
  const pathname = usePathname()
  const [cartItemsCount, setCartItemsCount] = React.useState(3)
  const shopMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  const handleShopClick = () => {
    setIsShopPanelOpen(true)
    setSelectedCollection(null)
  }

  const showCompactNav = isScrolled && !isHovering

  return (
    <header 
      className="sticky top-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-[#6C7466]/95 transition-all duration-500 ease-in-out"
      style={{ backgroundColor: '#6C7466' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo arriba - Solo visible en desktop */}
      <div 
        className={cn(
          "hidden lg:block border-b border-white/15 transition-all duration-500 ease-in-out",
          showCompactNav && "max-h-0 overflow-hidden border-none opacity-0"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={400}
                height={200}
                className="h-24 w-auto"
                priority
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de navegación gruesa con búsqueda y carrito - Solo visible en desktop */}
      <div 
        className="hidden lg:block border-b border-white/15"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between transition-all duration-500 ease-in-out",
            showCompactNav ? "h-14" : "h-20"
          )}>
            {/* Logo compacto cuando hay scroll - CENTRADO */}
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out",
              showCompactNav ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="OOAK Logo"
                  width={400}
                  height={200}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>
            
            {/* Enlaces de navegación - Ocultos en modo compacto */}
            <nav className={cn(
              "flex items-center justify-center gap-8 flex-1 transition-all duration-500 ease-in-out",
              showCompactNav && "opacity-0 pointer-events-none"
            )}>
              {topBarLinks.map((link) => (
                <div 
                  key={link.name}
                  className="relative"
                >
                  {link.hasMenu ? (
                    <button
                      onClick={handleShopClick}
                      className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider"
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Búsqueda y Carrito - Ocultos en modo compacto */}
            <div className={cn(
              "flex items-center gap-2 justify-end transition-all duration-500 ease-in-out",
              showCompactNav && "opacity-0 pointer-events-none"
            )}>
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
        </div>
      </div>

      {/* Panel SHOP - Funciona en Desktop y Mobile */}
      <Sheet open={isShopPanelOpen} onOpenChange={setIsShopPanelOpen}>
        <SheetContent 
          side="left" 
          className="w-full sm:w-[400px] overflow-y-auto p-0"
          style={{ 
            backgroundColor: '#6C7466',
            color: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="p-6">
            <SheetTitle className="text-white text-xl font-bold mb-6">
              SHOP
            </SheetTitle>
            
            <nav className="flex flex-col gap-2">
              {collections.map((collection) => (
                <div key={collection.name}>
                  <button
                    onClick={() => {
                      if (collection.items.length > 0) {
                        setSelectedCollection(
                          selectedCollection?.name === collection.name ? null : collection
                        )
                      } else {
                        window.location.href = collection.href
                        setIsShopPanelOpen(false)
                      }
                    }}
                    className="flex items-center justify-between w-full text-left py-4 px-4 text-sm font-medium text-white hover:bg-white/10 rounded-md transition-colors border-b border-white/10"
                  >
                    <span className="font-semibold tracking-wide">
                      {collection.name}
                    </span>
                    {collection.items.length > 0 && (
                      <ChevronRight 
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-200",
                          selectedCollection?.name === collection.name && "rotate-90"
                        )}
                      />
                    )}
                  </button>
                  
                  {/* Subcategorías desplegables */}
                  {selectedCollection?.name === collection.name && collection.items.length > 0 && (
                    <div className="ml-4 mt-2 space-y-1 animate-in slide-in-from-top-2">
                      <Link
                        href={collection.href}
                        onClick={() => setIsShopPanelOpen(false)}
                        className="block py-3 px-4 rounded-md text-sm text-white/90 hover:text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        VIEW ALL
                      </Link>
                      {collection.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsShopPanelOpen(false)}
                          className="block py-3 px-4 rounded-md text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Barra principal de navegación MÓVIL */}
      <nav className="lg:hidden container mx-auto px-4 sm:px-6">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Menú Hamburguesa - IZQUIERDA en móvil */}
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
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
                
                {/* Enlaces principales en mobile */}
                <nav className="flex flex-col gap-3">
                  {topBarLinks.map((link) => (
                    link.hasMenu ? (
                      <button
                        key={link.name}
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsShopPanelOpen(true)
                        }}
                        className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider py-3 px-3 hover:bg-white/10 rounded-md text-left"
                      >
                        {link.name}
                      </button>
                    ) : (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-sm font-medium text-white/90 hover:text-white transition-colors tracking-wider py-3 px-3 hover:bg-white/10 rounded-md"
                      >
                        {link.name}
                      </Link>
                    )
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Centro en móvil */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={400}
                height={200}
                className="h-12 sm:h-14 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Búsqueda y Carrito - Derecha en móvil */}
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