import { and, desc, eq, inArray } from "drizzle-orm";
import { contentPosts } from "../drizzle/schema";
import { contentMetrics } from "../drizzle/socialOsSchema";
import { buildContentFingerprint } from "../shared/contentFingerprint";
import { inferHumanizationCategory } from "../shared/humanizationPolicy";
import { compositionDirectiveFor } from "../shared/visualRepetition";
import { getDb } from "./db";
import { createBrandMemorySnapshot, getBrandWorkspace, listPerformanceLearnings, listWorkspacePostIds, upsertPerformanceLearning } from "./brandWorkspaceDb";

type MetricSample = {
  postId: number;
  network: string;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  leads: number;
};

type LearningDimension = "topic" | "format" | "schedule" | "cta" | "audience" | "channel" | "visual_family" | "humanization";

function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function roundRate(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

function scheduleBucket(date: Date | null) {
  if (!date) return "unknown";
  const hour = date.getHours();
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manha";
  if (hour < 18) return "tarde";
  return "noite";
}

function normalizedAudience(value: string | null) {
  const text = (value ?? "geral").replace(/\s+/g, " ").trim();
  return text.slice(0, 180) || "geral";
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pctLift(value: number, baseline: number) {
  if (baseline <= 0) return null;
  return Math.round(((value - baseline) / baseline) * 1000) / 10;
}

export async function learnBrandPerformance(userId: number, brandWorkspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");
  const workspace = await getBrandWorkspace(userId, brandWorkspaceId);
  const postIds = await listWorkspacePostIds(userId, brandWorkspaceId);
  if (!postIds.length) return { samples: 0, learnings: [], snapshot: null, message: "A marca ainda não possui conteúdos vinculados." };

  const [posts, metrics] = await Promise.all([
    db.select().from(contentPosts).where(and(eq(contentPosts.userId, userId), inArray(contentPosts.id, postIds))).orderBy(desc(contentPosts.updatedAt)),
    db.select().from(contentMetrics).where(and(eq(contentMetrics.userId, userId), inArray(contentMetrics.postId, postIds))).orderBy(desc(contentMetrics.capturedAt)),
  ]);
  const postById = new Map(posts.map(post => [post.id, post]));

  const latestByPostNetwork = new Map<string, MetricSample>();
  for (const metric of metrics) {
    const key = `${metric.postId}:${metric.network}`;
    if (!latestByPostNetwork.has(key)) {
      latestByPostNetwork.set(key, {
        postId: metric.postId,
        network: metric.network,
        impressions: metric.impressions,
        reach: metric.reach,
        likes: metric.likes,
        comments: metric.comments,
        shares: metric.shares,
        saves: metric.saves,
        clicks: metric.clicks,
        leads: metric.leads,
      });
    }
  }

  const enriched = [...latestByPostNetwork.values()].flatMap(metric => {
    const post = postById.get(metric.postId);
    if (!post) return [];
    const engagementRate = safeRate(metric.likes + metric.comments + metric.shares + metric.saves, metric.reach);
    const actionRate = safeRate(metric.clicks + metric.leads, metric.reach);
    const saveShareRate = safeRate(metric.saves + metric.shares, metric.reach);
    const fingerprint = buildContentFingerprint({
      title: post.title,
      hook: post.hook,
      caption: post.caption,
      area: post.area,
      audience: post.audience,
      objective: post.strategicObjective,
      pillar: post.contentPillar,
      campaign: post.campaign,
      funnelStage: post.funnelStage,
      format: post.format,
      visualFamily: compositionDirectiveFor(`${post.area}:${post.title}`).key,
      cta: post.cta,
    });
    return [{ metric, post, fingerprint, engagementRate, actionRate, saveShareRate }];
  });

  if (!enriched.length) return { samples: 0, learnings: [], snapshot: null, message: "Ainda não há snapshots de métricas vinculados a esta marca." };

  const baseline = {
    engagementRate: mean(enriched.map(item => item.engagementRate)),
    actionRate: mean(enriched.map(item => item.actionRate)),
    saveShareRate: mean(enriched.map(item => item.saveShareRate)),
    reach: mean(enriched.map(item => item.metric.reach)),
  };

  const groups = new Map<string, { dimension: LearningDimension; key: string; rows: typeof enriched }>();
  const add = (dimension: LearningDimension, key: string, row: (typeof enriched)[number]) => {
    const normalizedKey = key.replace(/\s+/g, " ").trim().slice(0, 180) || "unknown";
    const mapKey = `${dimension}:${normalizedKey}`;
    const group = groups.get(mapKey) ?? { dimension, key: normalizedKey, rows: [] };
    group.rows.push(row);
    groups.set(mapKey, group);
  };
  for (const row of enriched) {
    add("topic", row.post.area, row);
    add("format", row.post.format, row);
    add("schedule", scheduleBucket(row.post.publishedAt), row);
    add("cta", row.fingerprint.ctaClass, row);
    add("audience", normalizedAudience(row.post.audience), row);
    add("channel", row.metric.network, row);
    add("visual_family", row.fingerprint.visualFamily ?? "unknown", row);
    add("humanization", inferHumanizationCategory(row.post), row);
  }

  const saved = [];
  for (const group of groups.values()) {
    if (group.rows.length < 2) continue;
    const stats = {
      engagementRate: mean(group.rows.map(item => item.engagementRate)),
      actionRate: mean(group.rows.map(item => item.actionRate)),
      saveShareRate: mean(group.rows.map(item => item.saveShareRate)),
      reach: mean(group.rows.map(item => item.metric.reach)),
    };
    const engagementLift = pctLift(stats.engagementRate, baseline.engagementRate);
    const actionLift = pctLift(stats.actionRate, baseline.actionRate);
    const saveShareLift = pctLift(stats.saveShareRate, baseline.saveShareRate);
    const positive = (engagementLift ?? 0) >= 10 || (actionLift ?? 0) >= 10 || (saveShareLift ?? 0) >= 10;
    const negative = (engagementLift ?? 0) <= -15 && (actionLift ?? 0) <= -15;
    const recommendation = positive
      ? `O padrão ${group.dimension}=${group.key} ficou acima do baseline interno em pelo menos uma taxa. Priorize como hipótese em teste controlado, sem assumir causalidade.`
      : negative
        ? `O padrão ${group.dimension}=${group.key} ficou abaixo do baseline interno nas principais taxas. Reduza frequência e teste uma variação antes de descartar o tema.`
        : `O padrão ${group.dimension}=${group.key} está próximo do baseline. Mantenha coleta antes de mudar a estratégia.`;
    const confidenceScore = Math.min(92, 35 + group.rows.length * 11);
    const evidence = {
      methodology: "latest_snapshot_per_post_network",
      causalClaim: false,
      sampleSize: group.rows.length,
      baseline: {
        engagementRate: roundRate(baseline.engagementRate),
        actionRate: roundRate(baseline.actionRate),
        saveShareRate: roundRate(baseline.saveShareRate),
        averageReach: Math.round(baseline.reach),
      },
      observed: {
        engagementRate: roundRate(stats.engagementRate),
        actionRate: roundRate(stats.actionRate),
        saveShareRate: roundRate(stats.saveShareRate),
        averageReach: Math.round(stats.reach),
      },
      liftPercent: { engagement: engagementLift, action: actionLift, saveShare: saveShareLift },
    };
    await upsertPerformanceLearning(userId, brandWorkspaceId, {
      dimension: group.dimension,
      key: group.key,
      sampleSize: group.rows.length,
      evidenceJson: JSON.stringify(evidence),
      recommendation,
      confidenceScore,
      active: true,
    });
    saved.push({ dimension: group.dimension, key: group.key, sampleSize: group.rows.length, confidenceScore, evidence, recommendation });
  }

  const learnings = await listPerformanceLearnings(userId, brandWorkspaceId);
  const memory = {
    schemaVersion: 1,
    brandWorkspaceId,
    brand: {
      name: workspace.name,
      segment: workspace.segment,
      location: workspace.location,
      positioning: workspace.commercialGoal,
      audiences: workspace.targetAudience,
      tone: workspace.toneOfVoice,
      forbiddenClaims: workspace.prohibitedTerms,
      approvedCta: workspace.primaryCta,
      visualSystem: workspace.visualGuidelines,
    },
    contentHistory: posts.slice(0, 30).map(post => ({ id: post.id, title: post.title, area: post.area, format: post.format, audience: post.audience, status: post.status, publishedAt: post.publishedAt })),
    visualHistory: posts.slice(0, 30).map(post => ({ postId: post.id, family: compositionDirectiveFor(`${post.area}:${post.title}`).key, humanization: inferHumanizationCategory(post) })),
    performanceHistory: learnings.map(item => ({ dimension: item.dimension, key: item.key, sampleSize: item.sampleSize, confidenceScore: item.confidenceScore, evidence: JSON.parse(item.evidenceJson), recommendation: item.recommendation })),
    complianceRules: { prohibitedTerms: workspace.prohibitedTerms, humanApprovalRequiredForSensitiveLegalContent: true },
    sourcePolicy: { officialSourcesPreferred: true, currentFactsRequireSourceDateConsultedAtAndValidity: true, unknownDateRequiresHumanVerification: true },
    generatedAt: new Date().toISOString(),
  };
  const snapshot = await createBrandMemorySnapshot(userId, brandWorkspaceId, memory, "performance_learning_engine");
  return { samples: enriched.length, learnings: saved, snapshot, baseline };
}
