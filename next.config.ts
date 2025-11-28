import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",               // Ahora es HTTPS
        hostname: "odoo-ooak.alphaqueb.com", // Tu nuevo dominio
        port: "",                        // Puerto vacío (implica 443 estándar)
        pathname: "/**",                 // Permitir todas las rutas
      },
    ],
  },
};

export default nextConfig;