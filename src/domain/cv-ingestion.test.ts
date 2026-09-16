import { describe, expect, it } from "vitest";
import { extractCvCandidates } from "./cv-ingestion";

describe("CV ingestion", () => {
  it("extracts candidates without approving or inventing facts", () => {
    const candidates = extractCvCandidates(`Amina Khan
Product Designer
amina@example.com

Summary
I design accessible financial products for mobile users.

Skills
Product Design, Accessibility, User Research, Figma`);

    expect(candidates.find((item) => item.kind === "name")?.value).toBe("Amina Khan");
    expect(candidates.find((item) => item.kind === "role")?.value).toBe("Product Designer");
    expect(candidates.find((item) => item.kind === "intro")?.value).toContain("accessible financial products");
    expect(candidates.filter((item) => item.kind === "skill").map((item) => item.value)).toContain("Accessibility");
    expect(candidates.some((item) => "approved" in item)).toBe(false);
  });

  it("returns no candidates for an empty document", () => {
    expect(extractCvCandidates("   \n\n")).toEqual([]);
  });

  it("classifies a multi-column CV even when PDF reading order is scrambled", () => {
    const candidates = extractCvCandidates(`E D U C A T I O N
linkedin.com/in/sufian-
mustafa/
C O N T A C T
Gulberg Green, Zone IV, Islamabad Capital Territory, Pakistan
SUFIAN MUSTAFA
W O R K E X P E R I E N C E
E X E C U T I V E S U M M A R Y
Founder & SEO Lead Strategist | doitwithai.tools
Apr 2024 – July 2026
Built and independently manage an AI tools and SEO education platform using Next.js and Sanity CMS, with direct responsibility for website structure, publishing, on-page SEO, and content quality.
S K I L L S
Keyword Research &
Competitor Analysis
Technical SEO & Site
Architecture
R E F E R E N C E
SEO Specialist and Content Writer with hands-on experience researching, writing, optimizing, and quality-checking content for service-based websites, educational platforms, and regulated topics across UK, US, and Australian markets.
Expertise spans on-page, off-page, and technical SEO, including keyword research, competitor and SERP analysis, search-intent mapping, content optimization, internal linking, ethical link building, crawlability, and indexation.
Master's Degree in Computer Science
Abdul Wali Khan University Mardan (AWKUM)
Bachelor's Degree in Computer Science
F.G. College Nowshera | University of Peshawar
SEO SPECIALIST & CONTENT WRITER`);

    expect(candidates.find((item) => item.kind === "name")?.value).toBe("SUFIAN MUSTAFA");
    expect(candidates.find((item) => item.kind === "role")?.value).toBe("SEO SPECIALIST & CONTENT WRITER");
    expect(candidates.find((item) => item.kind === "intro")?.value).toContain("hands-on experience");
    expect(candidates.filter((item) => item.kind === "education")).toHaveLength(2);
    expect(candidates.some((item) => item.value.includes("linkedin"))).toBe(false);
    expect(candidates.some((item) => item.value === "EDUCATION")).toBe(false);
  });

  it("recognizes introduction copy under alternate resume headings", () => {
    const candidates = extractCvCandidates(`Jordan Taylor
Product Strategy Consultant

Career Profile
Product strategy consultant with eight years of experience turning customer research into accessible digital services and measurable product roadmaps.

Core Skills
Product Strategy, User Research, Accessibility`);

    expect(candidates.find((item) => item.kind === "intro")?.value).toContain("eight years of experience");
  });
});
