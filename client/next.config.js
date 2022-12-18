/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tailwindui.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "gateway.pinata.cloud",
      },
    ],
  },
  env: {
    PINATA_KEY: process.env.PINATA_KEY,
    PINATA_SECRET: process.env.PINATA_SECRET,
  },
};

module.exports = nextConfig;
