import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "46.202.88.177",
        port: "5050",
        pathname: '/**', // Usar /** permite cualquier ruta y evita problemas con query params
      },
    ],
    // Opcional: Si quieres desactivar la optimización globalmente para ahorrar CPU
    // unoptimized: true, 
  },
};

export default nextConfig;