import type { Request, Response } from "express";
import { createHeartbeatJob, deleteHeartbeatJob } from "./_core/heartbeat";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { executeConfirmedInstagramPublication } from "./instagramPublicationService";
import { getPublicationJob, getPublicationJobByTaskUid, recordPublicationAttempt, updatePublicationJob, updateStudioPost } from "./socialStudioDb";

export function oneTimeInstagramCron(scheduledAt: Date) {
  if (scheduledAt.getTime() <= Date.now()) throw new Error("Informe uma data futura para o agendamento.");
  return `0 ${scheduledAt.getUTCMinutes()} ${scheduledAt.getUTCHours()} ${scheduledAt.getUTCDate()} ${scheduledAt.getUTCMonth() + 1} *`;
}

export function assertInstagramScheduleReadiness(job: { status: string; confirmedAt?: Date | null; testedAt?: Date | null; testContainerId?: string | null }) {
  if (job.status !== "queued" || !job.confirmedAt) throw new Error("A publicação precisa estar confirmada antes de ser agendada.");
  if (!job.testedAt || !job.testContainerId) throw new Error("Execute e aprove o teste não público antes de agendar a publicação.");
}

export async function scheduleConfirmedInstagramPublication(userId: number, jobId: number, scheduledAt: Date, sessionToken: string) {
  if (!ENV.isProduction) throw new Error("O agendamento automático será liberado depois de salvar esta versão e publicar o Social Studio.");
  if (!sessionToken.trim()) throw new Error("O agendamento exige uma sessão web autenticada. Entre novamente no Studio antes de programar a publicação.");
  const job = await getPublicationJob(userId, jobId);
  assertInstagramScheduleReadiness(job);
  if (job.scheduleCronTaskUid) throw new Error("Esta publicação já possui uma execução agendada.");
  const cron = oneTimeInstagramCron(scheduledAt);
  await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "started", detail: `Solicitando execução para ${scheduledAt.toISOString()}.` });
  try {
    const created = await createHeartbeatJob({
      name: `instagram-publication-${job.id}-${Date.now()}`,
      cron,
      path: "/api/scheduled/instagram-publication",
      payload: {},
      description: `Publicação Instagram #${job.id} do S2 Studio`,
    }, sessionToken);
    await updatePublicationJob(job.id, { scheduledAt, scheduleCronTaskUid: created.taskUid, lastError: null });
    await updateStudioPost(userId, job.postId, { status: "scheduled", scheduledAt });
    await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "succeeded", externalReference: created.taskUid, detail: "Agendamento registrado com sessão explícita, execução autenticada e idempotente." });
    return { taskUid: created.taskUid, nextExecutionAt: created.nextExecutionAt ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao registrar o agendamento.";
    await recordPublicationAttempt(job.id, { stage: "schedule", outcome: "failed", errorCode: "SCHEDULE_FAILED", detail: message.slice(0, 3_000) });
    throw new Error("Não foi possível registrar o agendamento. A falha foi gravada na trilha de auditoria.");
  }
}

async function removeScheduledTask(taskUid: string, jobId?: number) {
  try {
    await deleteHeartbeatJob(taskUid, "");
    if (jobId) await recordPublicationAttempt(jobId, { stage: "callback", outcome: "succeeded", externalReference: taskUid, detail: "Tarefa de agendamento removida após execução; não haverá recorrência anual residual." });
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Instagram schedule] heartbeat cleanup failed", { taskUid, message });
    if (jobId) await recordPublicationAttempt(jobId, { stage: "callback", outcome: "failed", externalReference: taskUid, errorCode: "HEARTBEAT_CLEANUP_FAILED", detail: message.slice(0, 3_000) }).catch(() => undefined);
    return false;
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
      const cleaned = await removeScheduledTask(taskUid);
      res.json({ ok: true, skipped: "orphan", cleaned });
      return;
    }
    if (job.status === "published") {
      const cleaned = await removeScheduledTask(taskUid, job.id);
      res.json({ ok: true, skipped: "already-published", cleaned });
      return;
    }
    if (job.status !== "queued" || !job.confirmedAt) {
      const cleaned = await removeScheduledTask(taskUid, job.id);
      res.json({ ok: true, skipped: "not-confirmed", cleaned });
      return;
    }
    await recordPublicationAttempt(job.id, { stage: "callback", outcome: "started", externalReference: taskUid, detail: "Execução agendada autenticada iniciada." });
    await executeConfirmedInstagramPublication(job.userId, job.id);
    await recordPublicationAttempt(job.id, { stage: "callback", outcome: "succeeded", externalReference: taskUid, detail: "Execução agendada concluída." });
    const cleaned = await removeScheduledTask(taskUid, job.id);
    res.json({ ok: true, jobId: job.id, cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha inesperada em execução agendada.";
    const job = taskUid ? await getPublicationJobByTaskUid(taskUid).catch(() => null) : null;
    if (job) await recordPublicationAttempt(job.id, { stage: "callback", outcome: "failed", externalReference: taskUid, errorCode: "SCHEDULE_EXECUTION_FAILED", detail: message.slice(0, 3_000) }).catch(() => undefined);
    console.error("[Instagram schedule] failed", { taskUid, code: "SCHEDULE_EXECUTION_FAILED" });
    res.status(500).json({ error: "scheduled-publication-failed", timestamp: new Date().toISOString() });
  }
}
