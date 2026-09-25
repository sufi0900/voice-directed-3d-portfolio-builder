import { NextResponse } from "next/server";

export function GET(request: Request) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const field = { type: "string" };
  const command = {
    type: "object", required: ["type"],
    properties: {
      type: field, field, value: { oneOf: [field, { type: "array", items: field }] },
      kind: field, itemId: field, blockId: field, blockType: field, title: field, label: field,
      credential: field, role: field, organization: field, period: field, summary: field,
    },
  };
  const schema = {
    openapi: "3.1.0",
    info: { title: "Voxfolio private portfolio actions", version: "1.0.0", description: "Owner-only private GPT connection. Edits remain drafts until the owner publishes from Studio. Never place this key in a shared GPT." },
    servers: [{ url: site }],
    paths: {
      "/api/connect/portfolio": { get: { operationId: "readPortfolioDraft", summary: "Read the connected portfolio draft and revision", responses: { "200": { description: "Current draft" } } } },
      "/api/connect/command": { post: {
        operationId: "savePortfolioDraftChange", summary: "Save one validated change to the private portfolio draft",
        description: "First read the draft. Use its projectId and revision. Confirm factual changes with the owner. Supported: identity.set, content.setAbout, content.setContact, skill.add/update/remove, experience.add/update/remove, education.add/update/remove, project.add/update/remove, publishing.add/update, block.add/update/remove, opportunity.set. Publishing, media and Visitor Vox knowledge remain owner-controlled in Studio.",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["projectId", "expectedRevision", "command"], properties: { projectId: { type: "string", format: "uuid" }, expectedRevision: { type: "integer", minimum: 0 }, command } } } } },
        responses: { "200": { description: "Saved private draft revision" }, "409": { description: "Revision conflict. Read the current draft before retrying." } },
      } },
    },
    components: { securitySchemes: { VoxfolioPrivateKey: { type: "http", scheme: "bearer", description: "Private owner key, never share with other users." } } },
    security: [{ VoxfolioPrivateKey: [] }],
  };
  return NextResponse.json(schema, { headers: { "Cache-Control": "no-store" } });
}
