import { api, type Company, type Report } from "../lib/api";
import { MarketCard } from "../components/market-card";
import { Timeline } from "../components/timeline";
const signal: Record<string, string> = {
  AGGRAVATION: "Agravamento",
  STABILIZATION: "Estabilização",
  RECOVERY: "Recuperação",
  INDETERMINATE: "Indeterminado",
};
export default async function Home() {
  let report: Report | null = null,
    companies: Company[] = [],
    events: any[] = [];
  try {
    [report, companies, events] = await Promise.all([
      api<Report>("/reports/latest"),
      api<Company[]>("/companies"),
      api<any[]>("/events"),
    ]);
  } catch {}
  return (
    <main className="grid-paper">
      <div className="max-w-7xl mx-auto px-5 pt-12">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">
          <section>
            <p className="eyebrow text-[#df3b2f]">
              Pulso diário da infraestrutura de IA
            </p>
            <h1 className="serif text-5xl sm:text-7xl leading-[.96] max-w-4xl mt-4">
              O capital está esfriando — ou só mudando de forma?
            </h1>
            {report ? (
              <>
                <p className="text-xl text-gray-700 max-w-3xl mt-7 leading-relaxed">
                  {report.summary}
                </p>
                <p className="text-xs text-gray-500 mt-5">
                  Relatório de{" "}
                  {new Date(report.reportDate).toLocaleDateString("pt-BR", {
                    timeZone: "UTC",
                  })}{" "}
                  · publicado{" "}
                  {new Date(report.publishedAt).toLocaleString("pt-BR")}
                </p>
              </>
            ) : (
              <div className="card p-5 mt-7 max-w-2xl">
                <b>Aguardando o primeiro relatório.</b>
                <p className="text-sm mt-2">
                  Execute o worker em modo demonstração para validar o fluxo sem
                  credenciais.
                </p>
              </div>
            )}
          </section>
          <aside className="card p-6">
            <p className="eyebrow text-gray-500">Sinal de hoje</p>
            <p className="serif text-3xl mt-3">
              {report ? signal[report.signal] : "Sem dados"}
            </p>
            <div className="h-px bg-[#d5d0c2] my-5" />
            <div className="flex items-end gap-2">
              <strong className="text-5xl">{report?.riskScore ?? "—"}</strong>
              <span className="text-gray-500 mb-1">/ 100</span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Cobertura: {report ? Math.round(report.coverage * 100) : 0}% ·
              mínimo {report ? Math.round(report.minimumCoverage * 100) : 60}%
            </p>
            {report?.riskScore === null && (
              <p className="text-sm text-[#df3b2f] mt-3">
                Dados insuficientes para calcular o índice.
              </p>
            )}
          </aside>
        </div>
        {report && (
          <section className="mt-16 grid lg:grid-cols-[1fr_330px] gap-10">
            <div>
              {report.sections.map((s) => (
                <article
                  key={s.title}
                  className="border-t border-[#aaa493] py-7"
                >
                  <h2 className="serif text-3xl">{s.title}</h2>
                  <p className="mt-3 leading-relaxed text-gray-700">{s.body}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {s.evidenceStableKeys.map((k) => {
                      const ev = report!.evidence.find(
                        (x) => x.evidence.stableKey === k,
                      )?.evidence;
                      return ev ? (
                        <a
                          key={k}
                          href={ev.sourceUrl}
                          target="_blank"
                          className="pill link"
                        >
                          {ev.isPrimary ? "Fonte primária" : "Fonte"} ↗
                        </a>
                      ) : null;
                    })}
                  </div>
                </article>
              ))}
            </div>
            <aside>
              <p className="eyebrow">O que falta</p>
              <ul className="mt-3 text-sm space-y-2 list-disc pl-5">
                {report.missingData.length ? (
                  report.missingData.map((x) => <li key={x}>{x}</li>)
                ) : (
                  <li>Nenhuma lacuna crítica registrada.</li>
                )}
              </ul>
            </aside>
          </section>
        )}
        <section id="mercado" className="mt-16">
          <p className="eyebrow text-[#1a7352]">Comparação de mercado</p>
          <h2 className="serif text-4xl mt-2">Empresas sob observação</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-7 mobile-scroll">
            {companies.map((c) => (
              <MarketCard key={c.id} company={c} />
            ))}
          </div>
        </section>
        <Timeline events={events} />
      </div>
    </main>
  );
}
