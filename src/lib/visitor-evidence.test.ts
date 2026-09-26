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
  it("resolves ordinary questions about the published owner's identity",()=>{
    const evidence=visitorEvidence(DEFAULT_SITE_DOCUMENT,"example");
    for(const question of ["What is his role?", "What does he do?", "Who is he?", "Tell me shortly about himself", "What is his name?"]){
      expect(matchVisitorEvidence(question,evidence)[0]?.id,question).toBe("identity");
    }
    expect(matchVisitorEvidence("What is his role?",evidence)[0]?.text).toContain(DEFAULT_SITE_DOCUMENT.identity.role);
    expect(matchVisitorEvidence("What is his technical SEO approach?",evidence)[0]?.id).not.toBe("identity");
  });
  it("includes published education and public contact information",()=>{
    const document={...DEFAULT_SITE_DOCUMENT,content:{...DEFAULT_SITE_DOCUMENT.content,education:[{id:"degree",credential:"Computer Science",institution:"University",period:"2023",summary:"Specialized in design."}],contact:{...DEFAULT_SITE_DOCUMENT.content.contact,email:"hello@example.com"}}};
    const evidence=visitorEvidence(document,"example");
    expect(evidence.find((item)=>item.id==="education:degree")?.text).toContain("Computer Science");
    expect(evidence.find((item)=>item.id==="contact")?.text).toContain("hello@example.com");
  });
});
