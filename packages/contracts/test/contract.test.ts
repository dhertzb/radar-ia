import { describe, expect, it } from "vitest";
import { ingestSchema } from "../src/index";
describe("contrato", () => {
  it("rejeita referência inexistente", () => {
    const now = new Date().toISOString();
    const result = ingestSchema.safeParse({
      schemaVersion: "1.0.0",
      run: {
        stableKey: "run-1",
        startedAt: now,
        finishedAt: now,
        mode: "DEMO",
        sourceFailures: [],
      },
      companies: [],
      assets: [],
      closes: [],
      documents: [],
      evidence: [],
      events: [],
      report: {
        stableKey: "report-1",
        reportDate: "2026-11-11",
        title: "t",
        summary: "s",
        signal: "INDETERMINATE",
        riskScore: null,
        coverage: 0,
        minimumCoverage: 0.6,
        missingData: [],
        evidenceStableKeys: ["missing"],
        sections: [],
      },
    });
    expect(result.success).toBe(false);
  });
});
