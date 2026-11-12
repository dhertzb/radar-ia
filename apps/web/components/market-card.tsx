import Link from "next/link";
import type { Company } from "../lib/api";
import { Sparkline } from "./sparkline";
const delta = (v: number[], n: number) =>
  v.length > n ? (v[0] / v[n] - 1) * 100 : null;
export function MarketCard({ company }: { company: Company }) {
  const a = company.assets[0],
    values = (a?.closes ?? []).map((c) => Number(c.close));
  return (
    <Link
      href={`/empresas/${company.slug}`}
      className="card p-5 block hover:-translate-y-1 transition-transform"
    >
      <div className="flex justify-between">
        <div>
          <div className="eyebrow text-gray-500">
            {a?.exchange ?? company.region}
          </div>
          <h3 className="serif text-2xl mt-1">{company.name}</h3>
        </div>
        <b>{a?.symbol ?? "—"}</b>
      </div>
      {a?.publicDisplayAllowed && values.length ? (
        <>
          <div className="text-3xl font-semibold mt-5">
            {values[0].toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <Sparkline values={[...values].reverse()} />
          <div className="grid grid-cols-3 text-xs mt-2">
            {[1, 5, 20].map((n) => (
              <div key={n}>
                <span className="text-gray-500">{n}p</span>
                <br />
                <b>{delta(values, n)?.toFixed(1) ?? "—"}%</b>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-4">
            Último pregão:{" "}
            {new Date(a.closes[0].tradingDate).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })}
          </p>
        </>
      ) : (
        <p className="mt-8 text-sm text-gray-600">
          Cotação pública indisponível. A análise documental segue ativa.
        </p>
      )}
    </Link>
  );
}
