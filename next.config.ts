import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "46.202.88.177",
        port: "5050",
        pathname: '/web/image/**',
        
      },
    ],
  },
};

export default nextConfig;