import {createRequire} from "node:module";

const require=createRequire(new URL("../apps/web/package.json",import.meta.url));
const{PrismaClient}=require("@prisma/client");
const db=new PrismaClient();

const sourceUrl="https://chatgpt.com/c/6ae4ed85-dcd0-83e8-820d-02b23626b862";
const minimumCoverage=.6;
const reports=[
 {date:"2026-10-30",title:"Crise das ações de inteligência artificial — 30 de outubro de 2026",signal:"AGGRAVATION",summary:"Forte liquidação atingiu semicondutores, nuvem e infraestrutura de IA; o mercado passou a questionar se os investimentos bilionários produziriam retorno suficiente.",sections:["A correção se concentrou na cadeia de infraestrutura e semicondutores, com perdas expressivas também em mercados asiáticos e europeus.","A conversa classificou o episódio como correção financeira severa, mas sem prova suficiente de colapso operacional da demanda."]},
 {date:"2026-10-31",title:"Crise global da IA — atualização de 31 de outubro de 2026",signal:"AGGRAVATION",summary:"O fechamento de outubro ampliou a pressão para grandes compradores de infraestrutura, crédito e captação privada, sem pregão adicional no sábado.",sections:["A análise usou os fechamentos definitivos de 30/10 e notícias publicadas até 31/10.","O cenário já sustentava uma correção global severa, mas ainda não demonstrava colapso generalizado da demanda por tecnologia."]},
 {date:"2026-11-02",title:"Crise global da IA — 2 de novembro de 2026",signal:"AGGRAVATION",summary:"A tentativa de recuperação americana perdeu força; tecnologia continuou pressionada por endividamento e dúvidas sobre o retorno dos data centers.",sections:["A retirada de capital permaneceu seletiva em tecnologia, sem pânico indiscriminado no mercado amplo.","Oracle e outras empresas de infraestrutura ficaram sob pressão enquanto o financiamento se tornava parte central da análise."]},
 {date:"2026-11-03",title:"Crise global da IA — 3 de novembro de 2026",signal:"AGGRAVATION",summary:"Os EUA abriram em recuperação, mas Coreia do Sul e Taiwan fecharam com novas quedas fortes, mantendo elevada a pressão internacional.",sections:["A recuperação americana era apenas intradiária e não permitia concluir que havia estabilização.","Fabricantes asiáticas de chips devolveram ganhos, reforçando o contágio internacional da correção."]},
 {date:"2026-11-04",title:"Crise global da IA — 4 de novembro de 2026",signal:"STABILIZATION",summary:"O mercado permaneceu volátil e sem recuperação consolidada; risco regulatório cresceu, embora resultados de fabricantes ainda indicassem demanda forte.",sections:["A abertura americana foi positiva, mas empresas ligadas a data centers e energia continuaram sofrendo.","A evidência era contraditória: maior incerteza regulatória coexistia com crescimento operacional na cadeia de chips."]},
 {date:"2026-11-06",title:"Crise global da IA — 3 a 6 de novembro de 2026",signal:"AGGRAVATION",summary:"A crise se intensificou: a liquidação tornou-se global, alcançou crédito e cronogramas de infraestrutura, com 5/11 como o ponto mais crítico do período.",sections:["A correção passou de fabricantes de chips para mercados globais, financiamento de data centers e empresas especializadas em infraestrutura.","Havia estresse financeiro e revisões contratuais em casos específicos, mas não confirmação de cancelamentos generalizados ou crise sistêmica."]},
 {date:"2026-11-09",title:"Crise global da IA — 9 de novembro de 2026",signal:"STABILIZATION",summary:"Taiwan e Japão se recuperaram, a Coreia continuou frágil e bancos mostraram maior cautela para financiar data centers.",sections:["A recuperação foi desigual e não eliminou a deterioração observada no crédito.","Novos contratos continuavam surgindo, indicando demanda real apesar do financiamento mais caro."]},
 {date:"2026-11-10",title:"Crise global da IA — 10 de novembro de 2026",signal:"STABILIZATION",summary:"Wall Street voltou a sofrer pressão enquanto bolsas asiáticas recuperaram parte das perdas; inflação e juros agravaram o custo de financiar IA.",sections:["A volatilidade acionária permaneceu elevada, mas a receita recorde da TSMC contrariou uma tese de colapso imediato da demanda.","As condições de financiamento pioraram, sem evidência de uma nova onda generalizada de cancelamentos."]}
];

const historicalEvents=[
 {date:"2026-11-02",companySlug:"oracle",type:"FINANCING",title:"Oracle planejava nova captação bilionária",confidence:"REPORTED"},
 {date:"2026-11-06",companySlug:"oracle",type:"CANCELLATION",title:"Microsoft não teria renovado parte da capacidade computacional da Oracle",confidence:"REPORTED"},
 {date:"2026-11-09",companySlug:"coreweave",type:"CONTRACT",title:"CoreWeave anunciou contrato plurianual com a Wayve",confidence:"REPORTED"}
];

const imported=[];
for(const item of reports){
 const stableKey=`report:${item.date}`;
 const existing=await db.report.findUnique({where:{stableKey},include:{run:true}});
 if(existing&&existing.run.mode!=="LOCAL"){imported.push({date:item.date,status:"skipped-non-local"});continue}
 await db.$transaction(async tx=>{
  const publishedAt=new Date(`${item.date}T22:00:00.000Z`);
  const run=await tx.run.upsert({where:{stableKey:`history:${item.date}:chat-import`},create:{stableKey:`history:${item.date}:chat-import`,startedAt:publishedAt,finishedAt:publishedAt,mode:"LOCAL",status:"SUCCESS",sourceFailures:[]},update:{finishedAt:publishedAt,status:"SUCCESS",error:null}});
  const document=await tx.document.upsert({where:{stableKey:`chat-history:document:${item.date}`},create:{stableKey:`chat-history:document:${item.date}`,title:item.title,url:sourceUrl,source:"Conversa ChatGPT — importação histórica",publishedAt,isPrimary:false},update:{title:item.title,url:sourceUrl,source:"Conversa ChatGPT — importação histórica",publishedAt,isPrimary:false}});
  const evidence=await tx.evidence.upsert({where:{stableKey:`chat-history:evidence:${item.date}`},create:{stableKey:`chat-history:evidence:${item.date}`,documentId:document.id,claim:item.summary,excerpt:`Reconstrução histórica baseada no relatório datado de ${item.date} presente na conversa fornecida pelo usuário.`,sourceUrl,publishedAt,confidence:"REPORTED",isPrimary:false},update:{documentId:document.id,claim:item.summary,excerpt:`Reconstrução histórica baseada no relatório datado de ${item.date} presente na conversa fornecida pelo usuário.`,sourceUrl,publishedAt,confidence:"REPORTED",isPrimary:false}});
  const reportData={reportDate:new Date(`${item.date}T00:00:00.000Z`),title:item.title,summary:item.summary,signal:item.signal,riskScore:null,coverage:.5,minimumCoverage,missingData:["Importação retroativa: o pipeline atual não foi executado nesta data","Cotações e fontes primárias não foram revalidadas nesta importação"],sections:[{title:"Resumo histórico",body:item.sections[0],evidenceStableKeys:[evidence.stableKey]},{title:"Leitura do período",body:item.sections[1],evidenceStableKeys:[evidence.stableKey]}],publishedAt};
  const report=await tx.report.upsert({where:{stableKey},create:{stableKey,runId:run.id,...reportData},update:reportData});
  await tx.reportEvidence.deleteMany({where:{reportId:report.id}});
  await tx.reportEvidence.create({data:{reportId:report.id,evidenceId:evidence.id}});
  for(const event of historicalEvents.filter(event=>event.date===item.date)){
   const company=await tx.company.findUniqueOrThrow({where:{slug:event.companySlug}});
   const eventEvidence=await tx.evidence.upsert({where:{stableKey:`chat-history:event-evidence:${event.date}:${event.companySlug}:${event.type.toLowerCase()}`},create:{stableKey:`chat-history:event-evidence:${event.date}:${event.companySlug}:${event.type.toLowerCase()}`,documentId:document.id,companyId:company.id,claim:event.title,excerpt:"Evento reportado na conversa histórica; requer revalidação na fonte original antes de ser tratado como confirmado.",sourceUrl,publishedAt,confidence:event.confidence,isPrimary:false},update:{documentId:document.id,companyId:company.id,claim:event.title,sourceUrl,publishedAt,confidence:event.confidence,isPrimary:false}});
   await tx.event.upsert({where:{stableKey:`chat-history:event:${event.date}:${event.companySlug}:${event.type.toLowerCase()}`},create:{stableKey:`chat-history:event:${event.date}:${event.companySlug}:${event.type.toLowerCase()}`,companyId:company.id,evidenceId:eventEvidence.id,type:event.type,title:event.title,region:"Estados Unidos",occurredAt:publishedAt,confidence:event.confidence},update:{evidenceId:eventEvidence.id,title:event.title,occurredAt:publishedAt,confidence:event.confidence}});
  }
 });
 imported.push({date:item.date,status:existing?"updated":"created"});
}

console.log(JSON.stringify({source:sourceUrl,coverage:.5,imported},null,2));
await db.$disconnect();
