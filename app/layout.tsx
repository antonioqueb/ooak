import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { CartProvider } from "@/context/cart-context"
import { CartSidebar } from "@/components/cart-sidebar"

// 1. Configuramos las variables para que Tailwind las pueda usar
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "One Of A Kind",
  description:
    "One Of A Kind, Unique Artefacts of Exceptional Quality for Your Home Decor and Collections. Handmade and Handcrafted by artisans in Copenhagen, Denmark.",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-[#FDFBF7] text-[#2B2B2B]`}
      >
        <CartProvider>
          <Navbar />
          <CartSidebar />

          {/* 
             2. WRAPPER PRINCIPAL (<main>)
             Aquí es donde ocurre la magia de la armonía. 
             
             - pt-20 (80px): Espacio para el Navbar en Móvil.
             - lg:pt-[220px]: Espacio para el Navbar Expandido en Desktop (Logo grande + Menú).
             - min-h-screen: Asegura que el footer siempre se empuje al final.
          */}
          <main className="relative flex flex-col min-h-screen pt-20 lg:pt-[220px]">
            {children}
          </main>

          <Footer />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  )
}