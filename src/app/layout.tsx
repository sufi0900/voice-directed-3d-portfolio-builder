import type { Metadata } from "next";
import "./globals.css";
import "@/features/portfolio/collection-templates.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  applicationName: "Voxfolio",
  title: { default: "Voxfolio Studio — Voice-directed 3D portfolios", template: "%s · Voxfolio" },
  description: "Build a structured, cinematic portfolio with manual controls and guarded voice assistance.",
  openGraph: { type: "website", siteName: "Voxfolio", title: "Voxfolio Studio", description: "Build a structured, cinematic portfolio with manual controls and guarded voice assistance." },
  twitter: { card: "summary_large_image", title: "Voxfolio Studio", description: "Build a structured, cinematic portfolio with guarded voice assistance." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
