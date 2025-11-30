// components/footer.tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useFooterData } from "@/hooks/useFooterData"

export function Footer() {
  const { footerData, loading, subscribeEmail } = useFooterData()
  const [email, setEmail] = React.useState("")
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = React.useState("")

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setSubscriptionStatus('loading')
    try {
      await subscribeEmail(email)
      setSubscriptionStatus('success')
      setMessage("¡Gracias por suscribirte!")
      setEmail("")
      setTimeout(() => {
        setSubscriptionStatus('idle')
        setMessage("")
      }, 3000)
    } catch (err: any) {
      setSubscriptionStatus('error')
      setMessage(err.message)
      setTimeout(() => {
        setSubscriptionStatus('idle')
        setMessage("")
      }, 3000)
    }
  }

  if (loading) {
    return (
      <footer className="bg-[#F5F3F0] border-t border-[#6C7466]/10 py-20">
        <div className="flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#6C7466]" />
        </div>
      </footer>
    )
  }

  if (!footerData) return null

  return (
    <footer className="bg-[#F5F3F0] border-t border-[#6C7466]/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Main Footer Content */}
        <div className="py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 xl:gap-16">

            {/* Company Info */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-base sm:text-lg tracking-wider">
                {footerData.brandName}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed max-w-xs">
                {footerData.tagline}
              </p>
              <div className="flex items-center gap-3 pt-2">
                {footerData.social?.facebook && (
                  <Link
                    href={footerData.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
                {footerData.social?.instagram && (
                  <Link
                    href={footerData.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
                {footerData.social?.email && (
                  <Link
                    href={footerData.social.email}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#6C7466]/10 hover:bg-[#6C7466]/20 flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Email"
                  >
                    <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#6C7466]" />
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 sm:space-y-5">
              <h3 className="text-[#6C7466] font-bold text-sm sm:text-base tracking-wider uppercase">
                {footerData.quickLinks?.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {footerData.quickLinks?.links?.map((link: any) => (
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
                {footerData.legalLinks?.title}
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {footerData.legalLinks?.links?.map((link: any) => (
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
                {footerData.newsletter?.title}
              </h3>
              <p className="text-[#6C7466]/70 text-sm sm:text-base leading-relaxed">
                {footerData.newsletter?.description}
              </p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder={footerData.newsletter?.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-[#6C7466]/20 text-[#6C7466] placeholder:text-[#6C7466]/40 focus:border-[#6C7466] focus:ring-[#6C7466]/20 h-11 sm:h-12 text-sm sm:text-base"
                  required
                  disabled={subscriptionStatus === 'loading' || subscriptionStatus === 'success'}
                />
                <Button
                  type="submit"
                  disabled={subscriptionStatus === 'loading' || subscriptionStatus === 'success'}
                  className={cn(
                    "w-full transition-all duration-300 h-11 sm:h-12 text-sm sm:text-base font-medium",
                    subscriptionStatus === 'success'
                      ? "bg-green-600 hover:bg-green-700"
                      : subscriptionStatus === 'error'
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[#6C7466] hover:bg-[#6C7466]/90"
                  )}
                >
                  {subscriptionStatus === 'loading' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : subscriptionStatus === 'success' ? (
                    "¡Suscrito!"
                  ) : subscriptionStatus === 'error' ? (
                    "Error"
                  ) : (
                    "Suscribirse"
                  )}
                </Button>
                {message && (
                  <p className={cn("text-xs mt-2", subscriptionStatus === 'error' ? "text-red-500" : "text-green-600")}>
                    {message}
                  </p>
                )}
              </form>
              <p className="text-[#6C7466]/50 text-xs sm:text-sm leading-relaxed">
                {footerData.newsletter?.privacyText}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="border-t border-[#6C7466]/10 py-6 sm:py-7 lg:py-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8 xl:gap-12">
            {footerData.contact?.location && (
              <div className="flex items-center gap-2 text-[#6C7466]/70 group">
                <MapPin className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0 group-hover:text-[#6C7466] transition-colors" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.location}</span>
              </div>
            )}
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            {footerData.contact?.phone && (
              <Link
                href={`tel:${footerData.contact.phone}`}
                className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
              >
                <Phone className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.phone}</span>
              </Link>
            )}
            <div className="hidden sm:block w-px h-4 bg-[#6C7466]/20" />
            {footerData.contact?.email && (
              <Link
                href={`mailto:${footerData.contact.email}`}
                className="flex items-center gap-2 text-[#6C7466]/70 hover:text-[#6C7466] transition-colors group"
              >
                <Mail className="w-4 h-4 sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                <span className="text-xs sm:text-sm lg:text-base">{footerData.contact.email}</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#6C7466]/10 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-[#6C7466]/60 text-xs sm:text-sm text-center sm:text-left">
              © {new Date().getFullYear()} {footerData.bottom?.copyright}
            </p>
            <div className="flex items-center gap-3 sm:gap-4">
              {footerData.bottom?.links?.map((link: any, index: number) => (
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