const base =
  process.env.API_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/v1`
    : "http://localhost:3000/api/v1");
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
export type Evidence = {
  id: string;
  stableKey: string;
  claim: string;
  excerpt: string;
  sourceUrl: string;
  publishedAt: string;
  confidence: "CONFIRMED" | "REPORTED" | "RUMOR";
  isPrimary: boolean;
  company?: { name: string };
  document: { title: string; source: string };
};
export type Report = {
  id: string;
  title: string;
  summary: string;
  reportDate: string;
  publishedAt: string;
  signal: string;
  riskScore: number | null;
  coverage: number;
  minimumCoverage: number;
  missingData: string[];
  sections: { title: string; body: string; evidenceStableKeys: string[] }[];
  evidence: { evidence: Evidence }[];
  run: { sourceFailures: { source: string; message: string }[] };
};
export type Company = {
  id: string;
  slug: string;
  name: string;
  ticker?: string;
  region: string;
  assets: {
    symbol: string;
    exchange: string;
    timezone: string;
    publicDisplayAllowed: boolean;
    closes: { tradingDate: string; close: string }[];
  }[];
};
