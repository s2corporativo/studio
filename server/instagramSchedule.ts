import { parse as parseCookie } from "cookie";
import type { Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { executeConfirmedInstagramPublication } from "./instagramPublicationService";
import { getPublicationJob, getPublicationJobByTaskUid, recordPublicationAttempt, updatePublicationJob, updateStudioPost } from "./socialStudioDb";

export function oneTimeInstagramCron(scheduledAt: Date) {
  if (scheduledAt.getTime() <= Date.now()) throw new Error("Informe uma data futura para o agendamento.");
  return `0 ${scheduledAt.getUTCMinutes()} ${scheduledAt.getUTCHours()} ${scheduledAt.getUTCDate()} ${scheduledAt.getUTCMonth() + 1} *`;
}

export async function scheduleConfirmedInstagramPublication(userId: number, jobId: number, scheduledAt: Date, sessionToken: string) {
  if (!ENV.isProduction) throw new Error("O agendamento automático será liberado depois de salvar esta versão e publicar o Social Studio.");
  const job = await getPublicationJob(userId, jobId);
  if (job.status !== "queued" || !job.confirmedAt) throw new Error("A publicação precisa estar confirmada antes de ser agendada.");
  if (job.scheduleCronTaskUid) throw new Error("Esta publicação já possui uma execução agendada.");
  const cron = oneTimeInstagramCron(scheduledAt);
  await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "started", detail: `Solicitando execução para ${scheduledAt.toISOString()}.` });
  try {
    const created = await createHeartbeatJob({
      name: `instagram-publication-${job.id}-${Date.now()}`,
      cron,
      path: "/api/scheduled/instagram-publication",
      payload: {},
      description: `Publicação Instagram #${job.id} do De Paula Social Studio`,
    }, sessionToken);
    await updatePublicationJob(job.id, { scheduledAt, scheduleCronTaskUid: created.taskUid, lastError: null });
    await updateStudioPost(userId, job.postId, { status: "scheduled", scheduledAt });
    await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "succeeded", externalReference: created.taskUid, detail: "Agendamento registrado com execução autenticada e idempotente." });
    return { taskUid: created.taskUid, nextExecutionAt: created.nextExecutionAt ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar o agendamento.";
    await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "failed", errorCode: "SCHEDULE_FAILED", detail: message.slice(0, 3_000) });
    throw new Error("Não foi possível registrar o agendamento. A falha foi gravada na trilha de auditoria.");
  }
}

export async function runInstagramPublicationSchedule(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      res.status(403).json({ error: "cron-only" });
      return;
    }
    taskUid = user.taskUid;
    const job = await getPublicationJobByTaskUid(taskUid);
    if (!job) {
      res.json({ ok: true, skipped: "orphan" });
      return;
    }
    if (job.status === "published") {
      await updateHeartbeatJob(taskUid, { enable: false }, "").catch(() => undefined);
      res.json({ ok: true, skipped: "already-published" });
      return;
    }
    if (job.status !== "queued" || !job.confirmedAt) {
      await updateHeartbeatJob(taskUid, { enable: false }, "").catch(() => undefined);
      res.json({ ok: true, skipped: "not-confirmed" });
      return;
    }
    await recordPublicationAttempt(job.id, { stage: "callback", outcome: "started", externalReference: taskUid, detail: "Execução agendada autenticada iniciada." });
    await executeConfirmedInstagramPublication(job.userId, job.id);
    await recordPublicationAttempt(job.id, { stage: "callback", outcome: "succeeded", externalReference: taskUid, detail: "Execução agendada concluída." });
    await updateHeartbeatJob(taskUid, { enable: false }, "").catch(() => undefined);
    res.json({ ok: true, jobId: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada em execução agendada.";
    console.error("[Instagram schedule] failed", { taskUid, message });
    res.status(500).json({ error: message, context: { taskUid }, timestamp: new Date().toISOString() });
  }
}
