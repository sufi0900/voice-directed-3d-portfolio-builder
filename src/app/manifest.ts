import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Voxfolio Studio", short_name: "Voxfolio", description: "Voice-directed, evidence-grounded portfolio builder.", start_url: "/", display: "standalone", background_color: "#050914", theme_color: "#4deeea", icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }] };
}
