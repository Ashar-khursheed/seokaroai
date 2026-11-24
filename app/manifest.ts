import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SEOKaroAI",
    short_name: "SEOKaroAI",
    description: "AI SEO audits, rank tracking and competitor analysis.",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b6bcb",
    icons: [
      { src: "/brand/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/logo-mark-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
