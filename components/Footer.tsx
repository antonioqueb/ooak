// components/footer.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ========================================
// 📝 TEXT CONFIGURATION
// ========================================
const FOOTER_COPY = {
  brandName: "One of a Kind",
  tagline: "Unique pieces from nature that tell ancient stories. Each mineral, gem, and fossil is authentic and carefully selected.",
  
  newsletter: {
    title: "Newsletter",
    description: "Be the first to receive new finds, exclusive offers, and knowledge about the fascinating world of minerals.",
    placeholder: "your@email.com",
    buttonDefault: "Subscribe",
    buttonSuccess: "Subscribed!",
    privacyText: "By subscribing, you accept our",
    privacyLink: "Privacy Policy"
  },

  quickLinks: {
    title: "Explore",
    links: [
      { label: "Full Catalog", href: "/catalog" },
      { label: "Featured Pieces", href: "/featured" },
      { label: "Our Story", href: "/about-us" },
      { label: "Certificates", href: "/authenticity" },
      { label: "Mineral Care", href: "/care" }
    ]
  },

  legalLinks: {
    title: "Legal",
    links: [
      { label: "Terms and Conditions", href: "/terms-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Shipping and Delivery", href: "/shipping-policy" },
      { label: "Returns and Exchanges", href: "/returns-policy" },
      { label: "Legal Notice", href: "/legal-notice" }
    ]
  },

  contact: {
    title: "Contact",
    location: "García, Nuevo León, Mexico",
    phone: "+52 81 1234 5678",
    email: "hello@oneofakind.mx"
  },

  social: {
    facebook: "https://facebook.com/oneofakind",
    instagram: "https://instagram.com/oneofakind",
    email: "mailto:hello@oneofakind.mx"
  },

  bottom: {
    copyright: "One of a Kind. All rights reserved.",
    links: [
      { label: "Site Map", href: "/sitemap" },
      { label: "Accessibility", href: "/accessibility" }
    ]
  }
}

export function Footer() {
  const [email, setEmail] = React.useState("")
  const [isSubscribed, setIsSubscribed] = React.useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setTimeout(() => {
        setEmail("")
        setIsSubscribed(false)
      }, 3000)
    }
  }

  return (
    <footer className="bg-[#F5F3F0] border-t border-[#6C7466]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Main Footer Content */}
        <div className="py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
            
            {/* Company Info */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-base sm:text-lg tracking-wider">
                {FOOTER_COPY.brandName}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed max-w-xs">
                {FOOTER_COPY.tagline}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link 
                  href={FOOTER_COPY.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                </Link>
                <Link 
                  href={FOOTER_COPY.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                </Link>
                <Link 
                  href={FOOTER_COPY.social.email}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {FOOTER_COPY.quickLinks.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {FOOTER_COPY.quickLinks.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="text-[#6C7466]/70 hover:text-[#6C7466] text-sm sm:text-base transition-colors duration-200 inline-block hover:translate-x-1 transform"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {FOOTER_COPY.legalLinks.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {FOOTER_COPY.legalLinks.links.map((link) => (
                  <li key={link.href}>
                    <Link 
                      href={link.href}
                      className="text-[#6C7466]/70 hover:text-[#6C7466] text-sm sm:text-base transition-colors duration-200 inline-block hover:translate-x-1 transform"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {FOOTER_COPY.newsletter.title}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed">
                {FOOTER_COPY.newsletter.description}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder={FOOTER_COPY.newsletter.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-[#6C7466]/20 text-[#6C7466] placeholder:text-[#6C7466]/40 focus:border-[#6C7466] focus:ring-[#6C7466]/20 h-11 sm:h-12 text-sm sm:text-base"
                  required
                />
                <Button
                  type="submit"
                  className={cn(
                    "w-full transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base font-medium",
                    isSubscribed
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-[#6C7466] hover:bg-[#6C7466]/90"
                  )}
                >
                  {isSubscribed ? FOOTER_COPY.newsletter.buttonSuccess : FOOTER_COPY.newsletter.buttonDefault}
                </Button>
              </form>
              <p className="text-[#6C7466]/50 text-xs sm:text-sm leading-relaxed">
                {FOOTER_COPY.newsletter.privacyText}{" "}
                <Link href="/privacy-policy" className="underline hover:text-[#6C7466] transition-colors">
                  {FOOTER_COPY.newsletter.privacyLink}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="border-t border-[#6C7466]/10 py-6 sm:py-7 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
            <div className="flex items-center gap-2 text-[#6C7466]/70 group">
              <MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 group-hover:text-[#6C7466] transition-colors" />
              <span className="text-xs sm:text-sm lg:text-base">{FOOTER_COPY.contact.location}</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            <Link 
              href={`tel:${FOOTER_COPY.contact.phone}`}
              className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
            >
              <Phone className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-xs sm:text-sm lg:text-base">{FOOTER_COPY.contact.phone}</span>
            </Link>
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            <Link 
              href={`mailto:${FOOTER_COPY.contact.email}`}
              className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
            >
              <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-xs sm:text-sm lg:text-base">{FOOTER_COPY.contact.email}</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#6C7466]/10 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[#6C7466]/60 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} {FOOTER_COPY.bottom.copyright}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              {FOOTER_COPY.bottom.links.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && <span className="text-[#6C7466]/30 text-xs">•</span>}
                  <Link 
                    href={link.href}
                    className="text-[#6C7466]/60 hover:text-[#6C7466] text-xs sm:text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}