import type { SiteDocument } from "./site-document";
import { isOpportunityVariant } from "./opportunity";
import { reviewOpportunity } from "./opportunity-review";

export type OpportunityAcceptanceCheck = {
  id: string;
  label: string;
  complete: boolean;
  detail: string;
};

export type OpportunityAcceptance = {
  ready: boolean;
  checks: OpportunityAcceptanceCheck[];
};

/**
 * Pure V25 readiness checks. This never publishes or changes a document; it
 * gives the Studio/API one consistent explanation of what remains before an
 * opportunity can be delivered.
 */
export function opportunityAcceptance(document: SiteDocument, publishedDocument?: SiteDocument): OpportunityAcceptance {
  const review = reviewOpportunity(document);
  const checks: OpportunityAcceptanceCheck[] = [
    {
      id: "variant",
      label: "Independent opportunity variant",
      complete: isOpportunityVariant(document),
      detail: isOpportunityVariant(document) ? "This portfolio is isolated from its canonical source." : "Create an opportunity variant before delivery.",
    },
    {
      id: "review",
      label: "Opportunity review checklist",
      complete: review.ready,
      detail: review.ready ? "Title, audience, brief, and approved evidence are present." : "Complete the opportunity title, audience, brief, and evidence selection.",
    },
    {
      id: "shared",
      label: "Shared visibility selected",
      complete: document.opportunity.visibility === "shared",
      detail: document.opportunity.visibility === "shared" ? "The recipient link can be revocable and expiring." : "Choose Shared visibility to deliver privately.",
    },
    {
      id: "saved",
      label: "Published snapshot is current",
      complete: Boolean(publishedDocument && publishedDocument.revision === document.revision && publishedDocument.opportunity.visibility === "shared"),
      detail: publishedDocument && publishedDocument.revision === document.revision
        ? "The published snapshot matches the saved draft."
        : "Save and publish this exact revision before creating a share.",
    },
  ];
  return { ready: checks.every((check) => check.complete), checks };
}
