import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voxfolio Studio — Voice-directed 3D portfolios",
  description: "Build a structured, cinematic portfolio with manual controls and guarded voice assistance.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
