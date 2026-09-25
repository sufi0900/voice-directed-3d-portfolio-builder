import { describe,expect,it } from "vitest";
import { DEFAULT_SITE_DOCUMENT } from "@/domain/site-document";
import { applySiteCommand } from "@/domain/commands";
import { matchVisitorEvidence,visitorEvidence } from "./visitor-evidence";

describe("Visitor Vox evidence boundary",()=>{
  it("includes approved notes while excluding draft posts and unrelated questions",()=>{
    const note=applySiteCommand(DEFAULT_SITE_DOCUMENT,{type:"visitor.addFact",text:"When technical SEO blocks progress, I inspect crawl logs and reproduce the issue before proposing a fix.",source:"Owner note"});
    const post=applySiteCommand(note,{type:"publishing.add",kind:"post",title:"Secret draft strategy"});
    const evidence=visitorEvidence(post,"example");
    expect(evidence.some(({text})=>text.includes("crawl logs"))).toBe(true);
    expect(evidence.some(({text})=>text.includes("Secret draft strategy"))).toBe(false);
    expect(matchVisitorEvidence("What is the population of Mars?",evidence)).toEqual([]);
    expect(matchVisitorEvidence("How do you inspect crawl logs?",evidence)[0]?.text).toContain("crawl logs");
  });
});
