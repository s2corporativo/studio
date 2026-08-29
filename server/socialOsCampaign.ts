import { and, eq } from "drizzle-orm";
import { contentPosts } from "../drizzle/schema";
import { campaignRuns } from "../drizzle/socialOsSchema";
import { getDb } from "./db";
import { getCampaignPlanningContext } from "./studioPlanningContextDb";
import { generateLegalDraft } from "./socialStudioGenerator";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function parseCsv(value?: string | null) {
  return new Set((value ?? "").split(",").map(item => item.trim().toLowerCase()).filter(Boolean));
}

function datePartsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return { year: Number(value.year), month: Number(value.month), day: Number(value.day) };
}

function offsetAt(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day), Number(value.hour), Number(value.minute), Number(value.second));
  return asUtc - date.getTime();
}

export function localDateTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone = DEFAULT_TIMEZONE) {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const first = new Date(guess.getTime() - offsetAt(guess, timeZone));
  const secondOffset = offsetAt(first, timeZone);
  return new Date(guess.getTime() - secondOffset);
}

export function buildCampaignSlots(input: { startDate: Date; days: number; postsPerWeek: number; publishTime: string; weekdaysOnly: boolean; timezone?: string }) {
  const timezone = input.timezone ?? DEFAULT_TIMEZONE;
  const base = datePartsInZone(input.startDate, timezone);
  const eligible: Array<{ year: number; month: number; day: number }> = [];
  for (let i = 0; i < input.days; i++) {
    const cursor = new Date(Date.UTC(base.year, base.month - 1, base.day + i, 12, 0, 0));
    const parts = datePartsInZone(cursor, timezone);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(cursor);
    if (input.weekdaysOnly && (weekday === "Sat" || weekday === "Sun")) continue;
    eligible.push(parts);
  }
  if (!eligible.length) return [];

  const target = Math.min(eligible.length, Math.max(1, Math.round((input.days / 7) * input.postsPerWeek)));
  const [hour, minute] = input.publishTime.split(":").map(Number);
  const selectedIndexes = new Set<number>();
  for (let i = 0; i < target; i++) {
    const idx = target === 1 ? 0 : Math.round((i * (eligible.length - 1)) / (target - 1));
    selectedIndexes.add(idx);
  }
  for (let idx = 0; selectedIndexes.size < target && idx < eligible.length; idx++) selectedIndexes.add(idx);
  return Array.from(selectedIndexes).sort((a, b) => a - b).map(idx => {
    const value = eligible[idx];
    return localDateTimeToUtc(value.year, value.month, value.day, hour, minute, timezone);
  });
}

function affectedRows(result: unknown) {
  if (!Array.isArray(result)) return 0;
  const first = result[0];
  if (!first || typeof first !== "object" || !("affectedRows" in first)) return 0;
  const value = first.affectedRows;
  return typeof value === "number" ? value : 0;
}

export async function generateCampaignSafely(userId: number, input: {
  idempotencyKey: string;
  days: 7 | 15 | 30;
  startDate: Date;
  postsPerWeek: number;
  defaultPublishTime: string;
  objective: string;
  timezone?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const lookup = () => db.select().from(campaignRuns).where(and(eq(campaignRuns.userId, userId), eq(campaignRuns.idempotencyKey, input.idempotencyKey))).limit(1);
  let [run] = await lookup();
  if (run?.status === "generated") return { campaignRunId: run.id, count: run.generatedCount, reused: true };
  if (run?.status === "planning") throw new Error("Este planejamento já está em processamento.");

  if (run?.status === "failed") {
    const reset = await db.update(campaignRuns).set({ status: "planning", generatedCount: 0, errorMessage: null, updatedAt: new Date() })
      .where(and(eq(campaignRuns.id, run.id), eq(campaignRuns.userId, userId), eq(campaignRuns.status, "failed")));
    if (affectedRows(reset) !== 1) {
      [run] = await lookup();
      if (run?.status === "generated") return { campaignRunId: run.id, count: run.generatedCount, reused: true };
      throw new Error("Este planejamento já foi retomado por outra execução.");
    }
  } else if (!run) {
    try {
      const inserted = await db.insert(campaignRuns).values({
        userId,
        idempotencyKey: input.idempotencyKey,
        name: `Plano ${input.days} dias`,
        horizonDays: input.days,
        postsPerWeek: input.postsPerWeek,
        timezone: input.timezone ?? DEFAULT_TIMEZONE,
        status: "planning",
      });
      const id = Number(inserted[0].insertId);
      [run] = await db.select().from(campaignRuns).where(eq(campaignRuns.id, id)).limit(1);
    } catch (error) {
      [run] = await lookup();
      if (run?.status === "generated") return { campaignRunId: run.id, count: run.generatedCount, reused: true };
      if (run?.status === "planning") throw new Error("Este planejamento já está em processamento por outra execução.");
      throw error;
    }
  }
  if (!run) throw new Error("Não foi possível reservar a execução da campanha.");

  try {
    const studio = await getCampaignPlanningContext(userId);
    if (!studio.topics.length) throw new Error("Cadastre pelo menos uma pauta antes de gerar o plano.");
    const preferredAreas = parseCsv(studio.automation?.preferredAreas);
    const preferredFormats = parseCsv(studio.automation?.preferredFormats);
    const filteredTopics = studio.topics.filter(topic => {
      const areaOk = preferredAreas.size === 0 || preferredAreas.has(topic.area.toLowerCase());
      const formatOk = preferredFormats.size === 0 || preferredFormats.has(topic.suggestedFormat.toLowerCase());
      return topic.isActive && areaOk && formatOk;
    });
    const topics = filteredTopics.length ? filteredTopics : studio.topics.filter(topic => topic.isActive);
    if (!topics.length) throw new Error("Nenhuma pauta ativa corresponde às preferências configuradas.");

    const timezone = input.timezone ?? DEFAULT_TIMEZONE;
    const slots = buildCampaignSlots({ startDate: input.startDate, days: input.days, postsPerWeek: input.postsPerWeek, publishTime: input.defaultPublishTime, weekdaysOnly: studio.automation?.cadence === "weekdays", timezone });
    if (!slots.length) throw new Error("Não foi possível criar datas elegíveis para a campanha.");

    const generated: Array<{ topic: (typeof topics)[number]; draft: Awaited<ReturnType<typeof generateLegalDraft>>; scheduledAt: Date }> = [];
    for (let index = 0; index < slots.length; index++) {
      const topic = topics[index % topics.length];
      const draft = await generateLegalDraft({ area: topic.area, topic: topic.title, audience: topic.audience, format: topic.suggestedFormat, objective: input.objective, legalSource: topic.sourceUrl, primaryCta: studio.brand?.primaryCta, toneOfVoice: studio.brand?.toneOfVoice, prohibitedTerms: studio.brand?.prohibitedTerms });
      generated.push({ topic, draft, scheduledAt: slots[index] });
    }

    const createdIds = await db.transaction(async tx => {
      const ids: number[] = [];
      for (let index = 0; index < generated.length; index++) {
        const { topic, draft, scheduledAt } = generated[index];
        const result = await tx.insert(contentPosts).values({
          userId,
          topicId: topic.id,
          sourceId: null,
          area: topic.area,
          format: topic.suggestedFormat,
          audience: topic.audience,
          strategicObjective: input.objective,
          contentPillar: "Planejamento automático",
          campaign: `Plano ${input.days} dias #${run!.id}`,
          funnelStage: index % 4 === 0 ? "relationship" : index % 3 === 0 ? "consideration" : "discovery",
          templateKey: topic.suggestedFormat === "carousel" ? "carrossel_didatico" : topic.suggestedFormat === "reel" ? "reel_roteiro" : "noticia_comentada",
          title: draft.title,
          hook: draft.hook,
          caption: draft.caption,
          cta: draft.cta,
          hashtags: draft.hashtags,
          altText: draft.altText,
          keyStatement: draft.hook,
          legalSource: topic.sourceUrl ?? null,
          reviewDueAt: new Date(scheduledAt.getTime() + 30 * 24 * 60 * 60 * 1000),
          scheduledAt,
          status: "draft",
        });
        ids.push(Number(result[0].insertId));
      }
      await tx.update(campaignRuns).set({ status: "generated", generatedCount: ids.length, errorMessage: null, updatedAt: new Date() })
        .where(and(eq(campaignRuns.id, run!.id), eq(campaignRuns.userId, userId), eq(campaignRuns.status, "planning")));
      return ids;
    });
    return { campaignRunId: run.id, count: createdIds.length, createdIds, startDate: slots[0], endDate: slots.at(-1) ?? slots[0], timezone, reused: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida ao gerar campanha.";
    await db.update(campaignRuns).set({ status: "failed", errorMessage: message.slice(0, 5000), updatedAt: new Date() })
      .where(and(eq(campaignRuns.id, run.id), eq(campaignRuns.userId, userId), eq(campaignRuns.status, "planning")));
    throw error;
  }
}
