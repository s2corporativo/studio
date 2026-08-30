import { describe, expect, it } from "vitest";
import type { ContentPost } from "../drizzle/schema";
import { buildCsv, buildIcs, exportablePosts } from "./calendarExport";

function fixture(overrides: Partial<ContentPost>): ContentPost {
  return {
    id: 1,
    userId: 1,
    topicId: null,
    sourceId: null,
    area: "Trabalhista",
    format: "post",
    audience: "Empresas",
    strategicObjective: null,
    contentPillar: null,
    campaign: null,
    funnelStage: null,
    templateKey: null,
    title: "Título do post",
    hook: "Gancho editorial",
    caption: null,
    cta: null,
    hashtags: "#direito #trabalhista",
    altText: null,
    keyStatement: null,
    legalSource: null,
    reviewDueAt: null,
    mediaUrl: null,
    status: "scheduled",
    approvalOwnerId: null,
    approvalOwnerName: null,
    approvalNotes: null,
    scheduledAt: new Date("2026-09-01T18:30:00.000Z"),
    publishedAt: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("exportablePosts", () => {
  it("mantém apenas posts agendados ou publicados com data definida", () => {
    const posts = [
      fixture({ id: 1, status: "scheduled" }),
      fixture({ id: 2, status: "published", scheduledAt: new Date("2026-08-15T12:00:00.000Z") }),
      fixture({ id: 3, status: "draft" }),
      fixture({ id: 4, status: "scheduled", scheduledAt: null }),
    ];
    expect(exportablePosts(posts).map(p => p.id)).toEqual([1, 2]);
  });
});

describe("buildIcs", () => {
  it("gera um VCALENDAR válido com um VEVENT por post", () => {
    const ics = buildIcs([fixture({ id: 7, title: "Post \"especial\"; teste" })]);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("UID:content-post-7@depaula-social-studio");
    expect(ics).toContain('SUMMARY:Post "especial"\\; teste');
    expect(ics).toContain("DTSTART:20260901T183000Z");
  });

  it("usa CONFIRMED para publicado e TENTATIVE para agendado", () => {
    const published = buildIcs([fixture({ status: "published" })]);
    const scheduled = buildIcs([fixture({ status: "scheduled" })]);
    expect(published).toContain("STATUS:CONFIRMED");
    expect(scheduled).toContain("STATUS:TENTATIVE");
  });
});

describe("buildCsv", () => {
  it("gera cabeçalho e uma linha por post com aspas escapadas", () => {
    const csv = buildCsv([fixture({ title: 'Título com "aspas"' })]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Título,Área,Formato,Campanha,Status,Data agendada,Hashtags");
    expect(lines[1]).toContain('"Título com ""aspas"""');
  });
});
