const GITHUB_API = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function githubFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GitHubApiError(
      `GitHub ${res.status}: ${body.slice(0, 200)}`,
      res.status,
    );
  }
  return res;
}

export type SearchIssueItem = {
  html_url: string;
  repository_url: string;
  number: number;
};

export async function searchPrsReviewedBy(
  token: string,
  login: string,
  sinceYmd: string,
): Promise<SearchIssueItem[]> {
  const q = encodeURIComponent(
    `reviewed-by:${login} updated:>=${sinceYmd}`,
  );
  const items: SearchIssueItem[] = [];
  let page = 1;
  for (;;) {
    const res = await githubFetch(
      token,
      `/search/issues?q=${q}&per_page=100&page=${page}`,
    );
    const data = (await res.json()) as {
      items?: SearchIssueItem[];
    };
    const batch = data.items ?? [];
    items.push(...batch);
    if (batch.length < 100) break;
    page += 1;
    if (page > 10) break;
  }
  return items;
}

export type PullReview = {
  user: { login: string } | null;
  state: string;
  submitted_at: string | null;
};

export async function listPullReviews(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PullReview[]> {
  const reviews: PullReview[] = [];
  let page = 1;
  for (;;) {
    const res = await githubFetch(
      token,
      `/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100&page=${page}`,
    );
    const batch = (await res.json()) as PullReview[];
    reviews.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return reviews;
}

export function parseRepoFromIssue(item: SearchIssueItem): {
  owner: string;
  repo: string;
  number: number;
} | null {
  const match = item.html_url.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/,
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2], number: Number(match[3]) };
}