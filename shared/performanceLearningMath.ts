export type MetricSnapshot = {
  postId: number;
  network: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  leads: number;
  capturedAt: Date | string;
};

export function latestMetricSnapshots<T extends MetricSnapshot>(rows: T[]) {
  const sorted = [...rows].sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  const latest = new Map<string, T>();
  for (const row of sorted) {
    const key = `${row.postId}:${row.network}`;
    if (!latest.has(key)) latest.set(key, row);
  }
  return [...latest.values()];
}

export function safeRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export function performanceRates(metric: Pick<MetricSnapshot, "reach" | "likes" | "comments" | "shares" | "saves" | "clicks" | "leads">) {
  return {
    engagementRate: safeRate(metric.likes + metric.comments + metric.shares + metric.saves, metric.reach),
    actionRate: safeRate(metric.clicks + metric.leads, metric.reach),
    saveShareRate: safeRate(metric.saves + metric.shares, metric.reach),
  };
}

export function confidenceForSampleSize(sampleSize: number) {
  if (sampleSize < 2) return 0;
  return Math.min(92, 35 + sampleSize * 11);
}

export function percentageLift(value: number, baseline: number) {
  if (baseline <= 0) return null;
  return Math.round(((value - baseline) / baseline) * 1000) / 10;
}

export function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
