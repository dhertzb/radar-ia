import Link from "next/link";
import { api } from "../../../lib/api";
import { MarketCard } from "../../../components/market-card";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await api<any>(`/companies/${slug}`);
  return (
    <main className="max-w-5xl mx-auto px-5 py-12">
      <Link className="link text-sm" href="/">
        ← Visão geral
      </Link>
      <p className="eyebrow text-[#1a7352] mt-10">{c.region}</p>
      <h1 className="serif text-6xl mt-2">{c.name}</h1>
      <div className="max-w-md mt-8">
        <MarketCard company={c} />
      </div>
      <section className="mt-12">
        <h2 className="serif text-3xl">Documentos e comunicados</h2>
        {c.documents.map((d: any) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            className="block border-t border-[#bdb7a8] py-4 link"
          >
            <b>{d.title}</b>
            <br />
            <span className="text-xs text-gray-500">
              {d.source} · {new Date(d.publishedAt).toLocaleDateString("pt-BR")}
            </span>
          </a>
        ))}
      </section>
    </main>
  );
}
