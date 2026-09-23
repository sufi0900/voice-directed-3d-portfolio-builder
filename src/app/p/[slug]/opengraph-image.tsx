import { ImageResponse } from "next/og";
import { getPublicationSnapshot } from "@/lib/publication-snapshot";

export const runtime = "nodejs";
export const alt = "Voxfolio portfolio preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await getPublicationSnapshot(slug);
  const name = snapshot?.document.identity.name ?? "Voxfolio";
  const role = snapshot?.document.identity.role ?? "Portfolio unavailable";
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 70, color: "#f5f7fc", background: "linear-gradient(135deg,#0b1120,#101f32 65%,#153c40)" }}><span style={{ fontSize: 26, letterSpacing: 8, color: "#64e2da" }}>VOXFOLIO</span><div style={{ display: "flex", flexDirection: "column", gap: 20 }}><span style={{ fontSize: 74, fontWeight: 800, lineHeight: 1.05 }}>{name}</span><span style={{ fontSize: 30, color: "#b4c9d3" }}>{role}</span></div><span style={{ fontSize: 18, color: "#99b4c5" }}>A focused portfolio, shaped for an opportunity.</span></div>, size);
}
