import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "odoo-ooak.alphaqueb.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "odoo-ooak.alphaqueb.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "oneofakind.alphaqueb.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;