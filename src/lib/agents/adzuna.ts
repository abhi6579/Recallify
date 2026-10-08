/**
 * Optional Adzuna integration (free tier, best India coverage).
 * Activated only when ADZUNA_APP_ID + ADZUNA_APP_KEY are set in .env.
 * Returns salary-bearing listings in the same shape the coach consumes.
 */
export function adzunaEnabled(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

type AdzunaJob = {
  salary_min?: number;
  salary_max?: number;
  currency?: string;
};

export async function fromAdzuna(
  what: string,
  country: string,
): Promise<{ minSalary?: number; maxSalary?: number; currency?: string; salaryPeriod?: string }[]> {
  const id = process.env.ADZUNA_APP_ID;
  const key = process.env.ADZUNA_APP_KEY;
  if (!id || !key) return [];
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${id}&app_key=${key}&what=${encodeURIComponent(
    what,
  )}&results_per_page=40`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: AdzunaJob[] };
    return (data.results ?? []).map((j) => ({
      minSalary: typeof j.salary_min === "number" ? j.salary_min : undefined,
      maxSalary: typeof j.salary_max === "number" ? j.salary_max : undefined,
      currency: j.currency,
      salaryPeriod: "year",
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}
