import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "46.202.88.177",
        port: "5050", // El puerto externo de tu Odoo
        pathname: '/**', // Permitir cualquier ruta (incluyendo /web/image con params)
      },
    ],
    // Opcional: Si quieres forzar que no optimice nada por defecto (ahorra recursos)
    // unoptimized: true, 
  },
};

export default nextConfig;