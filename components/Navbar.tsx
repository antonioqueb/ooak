"use client"

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
import { useCart } from "@/context/cart-context"

const topBarLinks = [
  { name: "SHOP", href: "#", hasMenu: true },
  { name: "THE BRAND", href: "/the-brand", hasMenu: false },
  { name: "CRAFT STORIES", href: "/craft-stories", hasMenu: false },
  { name: "NEWS & EVENTS", href: "/news-events", hasMenu: false },
  { name: "PROJECTS", href: "/projects", hasMenu: false },
]

// Definimos la interfaz. Agregamos _parentKey opcional para uso interno durante el armado
interface CollectionMenuItem {
  name: string;
  href: string;
  items: CollectionMenuItem[]; // Permitimos anidación recursiva
  _parentKey?: string | null;  // Temporal para lógica de armado
}

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isShopMenuOpen, setIsShopMenuOpen] = React.useState(false)
  const [isShopPanelOpen, setIsShopPanelOpen] = React.useState(false)
  
  const [collections, setCollections] = React.useState<CollectionMenuItem[]>([])
  const [selectedCollection, setSelectedCollection] = React.useState<CollectionMenuItem | null>(null)
  
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isHovering, setIsHovering] = React.useState(false)
  const pathname = usePathname()
  const { cartCount, toggleCart } = useCart()
  const shopMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // --- LÓGICA DE FETCH Y ANIDACIÓN AUTOMÁTICA ---
  React.useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch('https://erp.oneofakind.com.mx/odoo/api/collections_data');
        if (!res.ok) throw new Error('Error fetching menu');
        const data = await res.json();

        // 1. Crear un mapa plano de todos los nodos (items del menú)
        //    Esto nos permite buscar padres rápidamente por su 'key'.
        const nodesMap: Record<string, CollectionMenuItem> = {};

        Object.entries(data).forEach(([key, value]: [string, any]) => {
            nodesMap[key] = {
                name: value.title ? value.title.toUpperCase() : key.toUpperCase().replace(/_/g, " "),
                // Por defecto url base, luego la ajustaremos si es hijo
                href: `/collections/${key}`, 
                items: [],
                _parentKey: value.parent // Guardamos quien es el padre (ej: "alloys")
            };
        });

        // 2. Construir el árbol (Tree)
        const tree: CollectionMenuItem[] = [];

        Object.keys(nodesMap).forEach((key) => {
            const node = nodesMap[key];
            const parentKey = node._parentKey;

            if (parentKey && nodesMap[parentKey]) {
                // ES UN HIJO:
                // 1. Ajustamos su URL para que sea /collections/padre/hijo
                node.href = `/collections/${parentKey}/${key}`;
                
                // 2. Lo metemos dentro del array 'items' del padre
                nodesMap[parentKey].items.push(node);
            } else {
                // ES UN PADRE (RAÍZ) o huérfano:
                tree.push(node);
            }
        });

        // 3. Ordenar alfabéticamente los padres
        tree.sort((a, b) => a.name.localeCompare(b.name));

        // 4. Ordenar alfabéticamente los hijos dentro de cada padre
        tree.forEach(root => {
            if (root.items.length > 0) {
                root.items.sort((a, b) => a.name.localeCompare(b.name));
            }
        });

        setCollections(tree);
      } catch (error) {
        console.error("Failed to load collections for navbar", error);
      }
    };

    fetchCollections();
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20)
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
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
  const smoothTransition = "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu backface-invisible"

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full backdrop-blur supports-[backdrop-filter]:bg-[#6C7466]/95",
        "will-change-[background-color,backdrop-filter]",
        smoothTransition
      )}
      style={{ backgroundColor: '#6C7466' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Logo grande colapsable */}
      <div
        className={cn(
          "hidden lg:block border-b border-white/15 overflow-hidden py-6",
          "will-change-[max-height,opacity]",
          smoothTransition,
          showCompactNav
            ? "max-h-0 opacity-0 border-none py-0"
            : "max-h-40 opacity-100"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={490}
                height={290}
                className="h-24 w-auto"
                priority
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Barra de navegación principal */}
      <div className="hidden lg:block border-b border-white/15">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className={cn(
            "flex items-center justify-between",
            "will-change-[height]",
            smoothTransition,
            showCompactNav ? "h-14" : "h-20"
          )}>
            {/* Logo compacto */}
            <div className={cn(
              "absolute left-1/2 transform -translate-x-1/2",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8 pointer-events-none"
            )}>
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="OOAK Logo"
                  width={490}
                  height={290}
                  className="h-10 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Enlaces de navegación */}
            <nav className={cn(
              "flex items-center justify-center gap-8 flex-1",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-0 -translate-y-4 pointer-events-none"
                : "opacity-100 translate-y-0"
            )}>
              {topBarLinks.map((link) => (
                <div key={link.name} className="relative">
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

            {/* Iconos Derecha */}
            <div className={cn(
              "flex items-center gap-2 justify-end",
              "will-change-[opacity,transform]",
              smoothTransition,
              showCompactNav
                ? "opacity-0 translate-x-8 pointer-events-none"
                : "opacity-100 translate-x-0"
            )}>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/10 hover:text-white h-10 w-10"
                onClick={toggleCart}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {cartCount}
                  </Badge>
                )}
                <span className="sr-only">Carrito de compras</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panel SHOP */}
      <Sheet open={isShopPanelOpen} onOpenChange={setIsShopPanelOpen}>
        <SheetContent
          side="left"
          className="w-full sm:w-[400px] overflow-y-auto p-0 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
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
              {collections.length === 0 && (
                <div className="text-white/50 text-sm animate-pulse">Loading collections...</div>
              )}

              {collections.map((collection) => (
                <div key={collection.name}>
                  <button
                    onClick={() => {
                      if (collection.items && collection.items.length > 0) {
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
                    {collection.items && collection.items.length > 0 && (
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 flex-shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                          selectedCollection?.name === collection.name && "rotate-90"
                        )}
                      />
                    )}
                  </button>

                  <div className={cn(
                    "grid transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[grid-template-rows]",
                    selectedCollection?.name === collection.name && collection.items.length > 0
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}>
                    <div className="overflow-hidden">
                      <div className="ml-4 mt-2 space-y-1 pb-2">
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
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* MÓVIL */}
      <nav className="lg:hidden container mx-auto px-4 sm:px-6">
        <div className="flex h-[84px] sm:h-[104px] items-center justify-between">
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

          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="OOAK Logo"
                width={490}
                height={290}
                className="h-[62px] sm:h-[72px] w-auto"
                priority
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white h-10 w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Buscar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-white hover:bg-white/10 hover:text-white h-10 w-10"
              onClick={toggleCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {cartCount}
                </Badge>
              )}
              <span className="sr-only">Carrito de compras</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      {isSearchOpen && (
        <div
          className={cn(
            "border-t border-white/20 overflow-hidden",
            "will-change-[max-height,opacity]",
            smoothTransition,
            isSearchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          )}
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