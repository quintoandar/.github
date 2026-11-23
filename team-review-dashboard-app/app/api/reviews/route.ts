import { collectReviewStats } from "@/lib/collect";
import { DEFAULT_PERIOD_DAYS } from "@/lib/reviewers";
import { getIdentity } from "../../../cursor/identity";

export const dynamic = "force-dynamic";

let cache: { expires: number; body: string } | null = null;
const CACHE_MS = 45_000;

export async function GET(request: Request): Promise<Response> {
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return Response.json(
      { error: "unauthorized", reason: identity.reason },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";
  const days = Math.min(
    30,
    Math.max(1, Number(url.searchParams.get("days") ?? DEFAULT_PERIOD_DAYS)),
  );

  if (!force && cache && cache.expires > Date.now()) {
    return new Response(cache.body, {
      headers: {
        "content-type": "application/json",
        "cache-control": "private, no-store",
        "x-review-cache": "hit",
      },
    });
  }

  const token = process.env.GITHUB_REVIEW_STATS_TOKEN;
  const data = await collectReviewStats(token, days);
  const body = JSON.stringify(data);
  cache = { expires: Date.now() + CACHE_MS, body };

  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-review-cache": "miss",
    },
  });
}