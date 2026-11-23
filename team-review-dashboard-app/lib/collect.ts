import {
  DEFAULT_PERIOD_DAYS,
  REVIEWERS,
  TIMEZONE,
  type ReviewerConfig,
} from "./reviewers";
import {
  listPullReviews,
  parseRepoFromIssue,
  searchPrsReviewedBy,
  type SearchIssueItem,
} from "./github";

export type ReviewerStats = {
  name: string;
  primaryLogin: string;
  total: number;
  daily: Record<string, number>;
};

export type CollectResult = {
  generatedAt: string;
  periodDays: number;
  sinceUtc: string;
  timezone: string;
  days: string[];
  reviewers: ReviewerStats[];
  source: string;
  sampleData?: boolean;
};

function utcMidnightDaysAgo(days: number): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}

function formatYmdUtc(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayKeysFortaleza(periodDays: number): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000);
    keys.push(
      d.toLocaleDateString("en-CA", { timeZone: TIMEZONE }),
    );
  }
  return keys;
}

function bucketDateFortaleza(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

function loginMatches(config: ReviewerConfig, login: string): boolean {
  const l = login.toLowerCase();
  return config.logins.some((x) => x.toLowerCase() === l);
}

function sampleData(periodDays: number): CollectResult {
  const days = dayKeysFortaleza(periodDays);
  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    sinceUtc: utcMidnightDaysAgo(periodDays).toISOString(),
    timezone: TIMEZONE,
    days,
    sampleData: true,
    source: "dados de exemplo (configure GITHUB_REVIEW_STATS_TOKEN)",
    reviewers: REVIEWERS.map((r, i) => ({
      name: r.name,
      primaryLogin: r.logins[0],
      total: [84, 20, 63, 63, 64][i] ?? 0,
      daily: Object.fromEntries(days.map((d, di) => [d, di === days.length - 1 ? 3 : i])),
    })),
  };
}

export async function collectReviewStats(
  token: string | undefined,
  periodDays: number = DEFAULT_PERIOD_DAYS,
): Promise<CollectResult> {
  const apiToken = token?.trim() ?? "";
  if (!apiToken) {
    return sampleData(periodDays);
  }

  const since = utcMidnightDaysAgo(periodDays);
  const sinceYmd = formatYmdUtc(since);
  const sinceMs = since.getTime();
  const days = dayKeysFortaleza(periodDays);

  const prKeys = new Set<string>();
  const prsByKey = new Map<string, SearchIssueItem>();

  for (const reviewer of REVIEWERS) {
    for (const login of reviewer.logins) {
      const found = await searchPrsReviewedBy(apiToken, login, sinceYmd);
      for (const item of found) {
        const parsed = parseRepoFromIssue(item);
        if (!parsed) continue;
        const key = `${parsed.owner}/${parsed.repo}#${parsed.number}`;
        if (!prKeys.has(key)) {
          prKeys.add(key);
          prsByKey.set(key, item);
        }
      }
    }
  }

  const stats: ReviewerStats[] = REVIEWERS.map((r) => ({
    name: r.name,
    primaryLogin: r.logins[0],
    total: 0,
    daily: Object.fromEntries(days.map((d) => [d, 0])),
  }));

  const prList = [...prsByKey.entries()];
  const concurrency = 8;
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < prList.length) {
      const current = idx;
      idx += 1;
      const [key, item] = prList[current];
      const parsed = parseRepoFromIssue(item);
      if (!parsed) continue;
      let reviews;
      try {
        reviews = await listPullReviews(
          apiToken,
          parsed.owner,
          parsed.repo,
          parsed.number,
        );
      } catch {
        continue;
      }
      for (const review of reviews) {
        if (review.state === "PENDING" || !review.submitted_at) continue;
        const submitted = new Date(review.submitted_at).getTime();
        if (submitted < sinceMs) continue;
        const login = review.user?.login;
        if (!login) continue;
        for (let ri = 0; ri < REVIEWERS.length; ri++) {
          if (!loginMatches(REVIEWERS[ri], login)) continue;
          const day = bucketDateFortaleza(review.submitted_at);
          if (stats[ri].daily[day] === undefined) continue;
          stats[ri].daily[day] += 1;
          stats[ri].total += 1;
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    sinceUtc: since.toISOString(),
    timezone: TIMEZONE,
    days,
    reviewers: stats,
    source: "GitHub API (reviews submitted_at, state ≠ PENDING)",
  };
}