import Link from "next/link";
import {api,type Report} from "../../lib/api";

const signalLabel:Record<string,string>={
 AGGRAVATION:"Agravamento",
 STABILIZATION:"Estabilização",
 RECOVERY:"Recuperação",
 INDETERMINATE:"Indeterminado",
};

const signalTone:Record<string,string>={
 AGGRAVATION:"text-[#b83228] border-[#b83228] bg-[#b83228]/5",
 STABILIZATION:"text-[#9a6500] border-[#9a6500] bg-[#9a6500]/5",
 RECOVERY:"text-[#126143] border-[#126143] bg-[#126143]/5",
 INDETERMINATE:"text-gray-600 border-gray-500 bg-gray-500/5",
};

function dateParts(value:string){
 const date=new Date(value);
 return{
  day:new Intl.DateTimeFormat("pt-BR",{day:"2-digit",timeZone:"UTC"}).format(date),
  month:new Intl.DateTimeFormat("pt-BR",{month:"short",timeZone:"UTC"}).format(date).replace(".",""),
  year:new Intl.DateTimeFormat("pt-BR",{year:"numeric",timeZone:"UTC"}).format(date),
  full:new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(date),
 };
}

function DailyReport({report,index}:{report:Report;index:number}){
 const date=dateParts(report.reportDate);
 const sources=report.evidence?.map(item=>item.evidence)??[];
 return <article className="history-report" aria-labelledby={`report-${report.id}`}>
  <div className="history-date" aria-label={date.full}>
   <span className="history-date-day">{date.day}</span>
   <span className="history-date-month">{date.month}</span>
   <span className="history-date-year">{date.year}</span>
  </div>

  <div className="history-content">
   <header className="grid gap-6 lg:grid-cols-[1fr_190px] lg:items-start">
    <div>
     <div className="flex flex-wrap items-center gap-3">
      <span className={`pill ${signalTone[report.signal]??signalTone.INDETERMINATE}`}>{signalLabel[report.signal]??report.signal}</span>
      {index===0&&<span className="eyebrow text-[#df3b2f]">Mais recente</span>}
     </div>
     <h2 id={`report-${report.id}`} className="serif text-3xl sm:text-4xl leading-tight mt-4">{report.title}</h2>
     <p className="text-lg text-gray-700 leading-relaxed mt-5 max-w-3xl">{report.summary}</p>
    </div>

    <aside className="history-score">
     <p className="eyebrow text-gray-500">Índice de risco</p>
     <div className="flex items-end gap-1 mt-2">
      <strong className="serif text-4xl leading-none">{report.riskScore??"—"}</strong>
      <span className="text-xs text-gray-500 mb-1">/ 100</span>
     </div>
     <div className="h-px bg-[#d5d0c2] my-4"/>
     <p className="text-xs text-gray-600">Cobertura {Math.round(report.coverage*100)}%</p>
     <div className="history-coverage mt-2" aria-label={`Cobertura de ${Math.round(report.coverage*100)}%`}>
      <span style={{width:`${Math.min(report.coverage*100,100)}%`}}/>
     </div>
     <p className="text-[11px] text-gray-500 mt-2">Mínimo exigido: {Math.round(report.minimumCoverage*100)}%</p>
    </aside>
   </header>

   <div className="history-sections">
    {report.sections?.map((section,sectionIndex)=><section key={`${section.title}-${sectionIndex}`} className="history-section">
     <p className="eyebrow text-gray-500">{String(sectionIndex+1).padStart(2,"0")}</p>
     <div>
      <h3 className="serif text-2xl">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed mt-2">{section.body}</p>
      <div className="flex flex-wrap gap-2 mt-4">
       {section.evidenceStableKeys?.map(key=>{const evidence=sources.find(item=>item.stableKey===key);return evidence?<a key={key} href={evidence.sourceUrl} target="_blank" rel="noreferrer" className="pill link">{evidence.isPrimary?"Fonte primária":"Fonte reportada"} ↗</a>:null})}
      </div>
     </div>
    </section>)}
   </div>

   <footer className="history-footer">
    <div>
     <p className="eyebrow text-gray-500">O que falta</p>
     <ul className="mt-3 text-sm text-gray-700 space-y-2 list-disc pl-4">
      {report.missingData?.length?report.missingData.map(item=><li key={item}>{item}</li>):<li>Nenhuma lacuna crítica registrada.</li>}
     </ul>
    </div>
    <div>
     <p className="eyebrow text-gray-500">Procedência</p>
     <p className="text-sm text-gray-700 mt-3">{sources.length} {sources.length===1?"evidência vinculada":"evidências vinculadas"}</p>
     {sources[0]&&<p className="text-xs text-gray-500 mt-1">{sources[0].document?.source??(sources[0].isPrimary?"Fonte primária":"Fonte reportada")}</p>}
    </div>
   </footer>
  </div>
 </article>;
}

export default async function History(){
 let data:Report[]=[];
 try{data=(await api<{data:Report[]}>("/reports?limit=50")).data}catch{}
 return <main className="grid-paper min-h-screen">
  <div className="max-w-7xl mx-auto px-5 py-12 sm:py-16">
   <header className="max-w-3xl">
    <p className="eyebrow text-[#df3b2f]">Arquivo diário</p>
    <h1 className="serif text-5xl sm:text-6xl leading-none mt-3">Um relatório para cada dia observado.</h1>
    <p className="text-lg text-gray-600 leading-relaxed mt-6">A evolução da infraestrutura de IA, preservada como foi lida em cada data — com sinal, contexto, cobertura e lacunas documentais.</p>
   </header>

   {data.length?<div className="history-list mt-14">{data.map((report,index)=><DailyReport key={report.id} report={report} index={index}/>)}</div>:<div className="card p-7 mt-12 max-w-2xl"><h2 className="serif text-2xl">Nenhum relatório disponível</h2><p className="text-sm text-gray-600 mt-2">O arquivo será preenchido assim que o primeiro relatório for publicado.</p></div>}

   <Link className="inline-block link text-sm mt-10" href="/">← Voltar ao relatório mais recente</Link>
  </div>
 </main>;
}
