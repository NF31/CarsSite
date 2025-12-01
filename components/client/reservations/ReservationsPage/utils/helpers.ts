import type { ResolvedSearchParams, SearchParamsInput } from "../types";

export async function resolveSearchParams(
  searchParams?: SearchParamsInput
): Promise<ResolvedSearchParams> {
  if (!searchParams) {
    return {};
  }

  if (searchParams instanceof URLSearchParams) {
    return Object.fromEntries(searchParams.entries()) as ResolvedSearchParams;
  }

  if (searchParams instanceof Promise) {
    const awaited = await searchParams;
    return (awaited ?? {}) as ResolvedSearchParams;
  }

  return searchParams as ResolvedSearchParams;
}

export function parsePageParam(param: string | string[] | undefined): number {
  if (Array.isArray(param)) {
    if (param.length === 0) {
      return 1;
    }
    return parsePageParam(param[0]);
  }

  if (!param) {
    return 1;
  }

  const parsed = Number.parseInt(param, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return 1;
  }

  return parsed;
}

export function createHistoryPageHref(
  page: number,
  resolvedSearchParams: ResolvedSearchParams
): string {
  const params = new URLSearchParams();
  const entries = Object.entries(resolvedSearchParams ?? {});

  for (const [key, rawValue] of entries) {
    if (key === "historyPage" || rawValue === undefined || rawValue === null) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      rawValue.forEach((entry) => {
        params.append(key, entry);
      });
    } else {
      params.set(key, String(rawValue));
    }
  }

  if (page > 1) {
    params.set("historyPage", page.toString());
  } else {
    params.delete("historyPage");
  }

  const query = params.toString();
  return query.length > 0 ? `/reservations?${query}` : "/reservations";
}

