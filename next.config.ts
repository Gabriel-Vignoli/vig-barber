import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Keep in sync with IMAGE_HOSTNAME in app/_lib/validations/barbershop.ts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        // UploadThing file URLs (<app-id>.ufs.sh/f/<key>)
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
}

export default nextConfig
