import type { Express } from "express";
import { sdk } from "./_core/sdk";
import { getStudioData } from "./socialStudioDb";
import type { ContentPost } from "../drizzle/schema";

const exportableStatuses = new Set(["scheduled", "published"]);

function escapeICal(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatICalDate(date: Date, addMinutes = 0): string {
  const shifted = new Date(date.getTime() + addMinutes * 60_000);
  return shifted.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function exportablePosts(posts: ContentPost[]): ContentPost[] {
  return posts.filter(post => post.scheduledAt && exportableStatuses.has(post.status));
}

export function buildIcs(posts: ContentPost[]): string {
  const now = formatICalDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//S2 Studio//Calendario Editorial//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:S2 Studio - Calendario Editorial",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];
  for (const post of posts) {
    const scheduledAt = post.scheduledAt as Date;
    const description = [post.hook, `Área: ${post.area}`, `Formato: ${post.format}`, post.campaign ? `Campanha: ${post.campaign}` : null]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:content-post-${post.id}@s2-studio`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICalDate(scheduledAt)}`,
      `DTEND:${formatICalDate(scheduledAt, 30)}`,
      `SUMMARY:${escapeICal(post.title)}`,
      `DESCRIPTION:${escapeICal(description)}`,
      `CATEGORIES:${escapeICal(post.area)}`,
      `STATUS:${post.status === "published" ? "CONFIRMED" : "TENTATIVE"}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
}

export function buildCsv(posts: ContentPost[]): string {
  const rows = [["Título", "Área", "Formato", "Campanha", "Status", "Data agendada", "Hashtags"].join(",")];
  for (const post of posts) {
    rows.push([
      csvField(post.title),
      csvField(post.area),
      csvField(post.format),
      csvField(post.campaign ?? ""),
      csvField(post.status),
      (post.scheduledAt as Date).toISOString(),
      csvField(post.hashtags ?? ""),
    ].join(","));
  }
  return rows.join("\n");
}

export function registerCalendarExport(app: Express) {
  app.get("/api/calendar-export", async (req, res) => {
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.status(401).send("Authentication required");
      return;
    }
    const format = req.query.format === "csv" ? "csv" : "ics";
    const { posts } = await getStudioData(user.id);
    const due = exportablePosts(posts);
    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="social-studio-calendario-${Date.now()}.csv"`);
      res.send(buildCsv(due));
      return;
    }
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="social-studio-calendario-${Date.now()}.ics"`);
    res.send(buildIcs(due));
  });
}
