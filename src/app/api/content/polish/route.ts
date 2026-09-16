import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inputSchema = z.object({
  target: z.enum(["hero_intro", "about_body", "experience_summary", "education_summary", "project_summary"]),
  text: z.string().trim().min(3).max(3_000),
});
const resultSchema = z.object({ text: z.string().trim().min(1).max(900) });

function outputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  if (typeof (payload as { output_text?: unknown }).output_text === "string") return (payload as { output_text: string }).output_text;
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;
  for (const item of output) if (item && typeof item === "object" && Array.isArray((item as { content?: unknown }).content)) {
    for (const content of (item as { content: unknown[] }).content) if (content && typeof content === "object" && typeof (content as { text?: unknown }).text === "string") return (content as { text: string }).text;
  }
  return null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use AI writing refinement." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid writing request." }, { status: 400 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const model = process.env.OPENAI_CONTENT_MODEL || process.env.OPENAI_CV_MODEL || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", signal: controller.signal,
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model, store: false,
        reasoning: /^(gpt-5|gpt-6|o\d)/i.test(model) ? { effort: "low" } : undefined,
        input: [{ role: "system", content: [{ type: "input_text", text: "You refine user-supplied portfolio copy. Preserve every fact, name, number, qualification, date, technology, and scope exactly. Never add achievements, metrics, employers, credentials, or capabilities. Improve clarity, grammar, structure, specificity, and natural professional tone. Avoid inflated AI-style wording, clichés, and unsupported claims. Return only the rewritten field." }] }, { role: "user", content: [{ type: "input_text", text: `Target field: ${parsed.data.target}\nRaw user text:\n${parsed.data.text}` }] }],
        max_output_tokens: 900,
        text: { verbosity: "low", format: { type: "json_schema", name: "polished_portfolio_copy", strict: true, schema: { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string", maxLength: 900 } } } } },
      }),
    });
    if (!response.ok) return NextResponse.json({ error: `AI refinement failed with status ${response.status}.` }, { status: response.status === 429 ? 429 : 502 });
    const text = outputText(await response.json());
    if (!text) return NextResponse.json({ error: "AI refinement returned no usable text." }, { status: 502 });
    const result = resultSchema.safeParse(JSON.parse(text));
    if (!result.success) return NextResponse.json({ error: "AI refinement returned an invalid result." }, { status: 502 });
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.name === "AbortError" ? "AI refinement timed out." : "AI refinement is temporarily unavailable." }, { status: 503 });
  } finally { clearTimeout(timeout); }
}
