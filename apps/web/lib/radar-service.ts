import {EventType,Prisma} from "@prisma/client";
import {ingestSchema,type IngestPayload} from "@radar-ia/contracts";
import {db} from "./db";

export class ApiError extends Error{constructor(public status:number,message:string,public details?:unknown){super(message)}}

const reportInclude={evidence:{include:{evidence:{include:{company:true,document:true}}}},run:true} as const;

async function publish(tx:Prisma.TransactionClient,p:IngestPayload){
 const run=await tx.run.upsert({where:{stableKey:p.run.stableKey},create:{stableKey:p.run.stableKey,startedAt:p.run.startedAt,finishedAt:p.run.finishedAt,mode:p.run.mode,status:"STARTED",sourceFailures:p.run.sourceFailures},update:{finishedAt:p.run.finishedAt,sourceFailures:p.run.sourceFailures,error:null}});
 const companies=new Map<string,string>();
 for(const c of p.companies){const row=await tx.company.upsert({where:{slug:c.slug},create:c,update:{name:c.name,ticker:c.ticker,region:c.region}});companies.set(c.slug,row.id)}
 const assets=new Map<string,string>();
 for(const a of p.assets){const{companySlug,...asset}=a;const row=await tx.asset.upsert({where:{stableKey:a.stableKey},create:{...asset,companyId:companies.get(companySlug)!},update:{symbol:a.symbol,exchange:a.exchange,timezone:a.timezone,currency:a.currency,publicDisplayAllowed:a.publicDisplayAllowed}});assets.set(a.stableKey,row.id)}
 for(const c of p.closes)await tx.marketClose.upsert({where:{assetId_tradingDate_provider:{assetId:assets.get(c.assetStableKey)!,tradingDate:new Date(c.tradingDate),provider:c.provider}},create:{assetId:assets.get(c.assetStableKey)!,tradingDate:new Date(c.tradingDate),close:c.close,provider:c.provider,redistributable:c.redistributable},update:{close:c.close,redistributable:c.redistributable}});
 const documents=new Map<string,string>();
 for(const d of p.documents){const row=await tx.document.upsert({where:{stableKey:d.stableKey},create:{stableKey:d.stableKey,companyId:d.companySlug?companies.get(d.companySlug):undefined,title:d.title,url:d.url,source:d.source,publishedAt:d.publishedAt,isPrimary:d.isPrimary},update:{title:d.title,url:d.url,source:d.source,publishedAt:d.publishedAt,isPrimary:d.isPrimary}});documents.set(d.stableKey,row.id)}
 const evidence=new Map<string,string>();
 for(const e of p.evidence){const{documentStableKey,companySlug,...item}=e;const row=await tx.evidence.upsert({where:{stableKey:e.stableKey},create:{...item,documentId:documents.get(documentStableKey)!,companyId:companySlug?companies.get(companySlug):undefined},update:{claim:e.claim,excerpt:e.excerpt,sourceUrl:e.sourceUrl,publishedAt:e.publishedAt,confidence:e.confidence,isPrimary:e.isPrimary}});evidence.set(e.stableKey,row.id)}
 for(const e of p.events){const{companySlug,evidenceStableKey,...event}=e;await tx.event.upsert({where:{stableKey:e.stableKey},create:{...event,companyId:companies.get(companySlug)!,evidenceId:evidence.get(evidenceStableKey)!},update:{title:e.title,region:e.region,occurredAt:e.occurredAt,confidence:e.confidence,evidenceId:evidence.get(evidenceStableKey)!}})}
 const r=p.report;
 const report=await tx.report.upsert({where:{stableKey:r.stableKey},create:{stableKey:r.stableKey,runId:run.id,reportDate:new Date(r.reportDate),title:r.title,summary:r.summary,signal:r.signal,riskScore:r.coverage>=r.minimumCoverage?r.riskScore:null,coverage:r.coverage,minimumCoverage:r.minimumCoverage,missingData:r.missingData,sections:r.sections},update:{title:r.title,summary:r.summary,signal:r.signal,riskScore:r.coverage>=r.minimumCoverage?r.riskScore:null,coverage:r.coverage,minimumCoverage:r.minimumCoverage,missingData:r.missingData,sections:r.sections}});
 await tx.reportEvidence.createMany({data:r.evidenceStableKeys.map(k=>({reportId:report.id,evidenceId:evidence.get(k)!})),skipDuplicates:true});
 await tx.run.update({where:{id:run.id},data:{status:"SUCCESS",error:null}});
 return{status:"published",runId:run.id,reportId:report.id};
}

export const radar={
 async ingest(input:unknown){
  const parsed=ingestSchema.safeParse(input);if(!parsed.success)throw new ApiError(400,"Payload inválido",parsed.error.flatten());const p=parsed.data;
  const existing=await db.run.findUnique({where:{stableKey:p.run.stableKey},include:{report:true}});if(existing?.status==="SUCCESS")return{status:"already-published",runId:existing.id,reportId:existing.report?.id};
  try{return await db.$transaction(async tx=>{await tx.$queryRaw(Prisma.sql`SELECT true AS acquired FROM pg_advisory_xact_lock(hashtext(${p.run.stableKey}))`);const concurrent=await tx.run.findUnique({where:{stableKey:p.run.stableKey},include:{report:true}});if(concurrent?.status==="SUCCESS")return{status:"already-published",runId:concurrent.id,reportId:concurrent.report?.id};return publish(tx,p)},{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:30000})}
  catch(error){await db.run.upsert({where:{stableKey:p.run.stableKey},create:{stableKey:p.run.stableKey,startedAt:p.run.startedAt,finishedAt:new Date(),mode:p.run.mode,status:"FAILED",sourceFailures:p.run.sourceFailures,error:String(error)},update:{finishedAt:new Date(),status:"FAILED",sourceFailures:p.run.sourceFailures,error:String(error)}}).catch(()=>undefined);throw error}
 },
 async recordRun(input:unknown){
  if(!input||typeof input!=="object")throw new ApiError(400,"Payload inválido");const value=input as Record<string,unknown>;
  if(typeof value.stableKey!=="string"||typeof value.startedAt!=="string"||!["LIVE","DEMO","LOCAL"].includes(String(value.mode))||!["STARTED","FAILED"].includes(String(value.status)))throw new ApiError(400,"Payload inválido");
  const existing=await db.run.findUnique({where:{stableKey:value.stableKey}});if(existing?.status==="SUCCESS")return existing;
  return db.run.upsert({where:{stableKey:value.stableKey},create:{stableKey:value.stableKey,startedAt:new Date(value.startedAt),finishedAt:value.finishedAt?new Date(String(value.finishedAt)):undefined,mode:value.mode as "LIVE"|"DEMO"|"LOCAL",status:value.status as "STARTED"|"FAILED",sourceFailures:(value.sourceFailures??[]) as Prisma.InputJsonValue,error:typeof value.error==="string"?value.error:undefined},update:{finishedAt:value.finishedAt?new Date(String(value.finishedAt)):undefined,status:value.status as "STARTED"|"FAILED",sourceFailures:(value.sourceFailures??[]) as Prisma.InputJsonValue,error:typeof value.error==="string"?value.error:undefined}});
 },
 async status(){const[lastRun,lastReport]=await Promise.all([db.run.findFirst({orderBy:{startedAt:"desc"}}),db.report.findFirst({orderBy:{publishedAt:"desc"}})]);return{lastAttempt:lastRun,lastPublishedAt:lastReport?.publishedAt??null,lastReportDate:lastReport?.reportDate??null}},
 async latest(){const report=await db.report.findFirst({orderBy:{publishedAt:"desc"},include:reportInclude});if(!report)throw new ApiError(404,"Nenhum relatório publicado");return report},
 async reports(page:number,limit:number){const take=Math.min(Math.max(limit,1),50),skip=(Math.max(page,1)-1)*take;const[data,total]=await Promise.all([db.report.findMany({skip,take,orderBy:{reportDate:"desc"},include:reportInclude}),db.report.count()]);return{data,meta:{page,take,total,pages:Math.ceil(total/take)}}},
 companies(){return db.company.findMany({orderBy:{name:"asc"},include:{assets:{include:{closes:{where:{redistributable:true},orderBy:{tradingDate:"desc"},take:21}}}}})},
 async company(slug:string){const row=await db.company.findUnique({where:{slug},include:{assets:{include:{closes:{where:{redistributable:true},orderBy:{tradingDate:"desc"},take:21}}},documents:{orderBy:{publishedAt:"desc"},take:20},events:{orderBy:{occurredAt:"desc"},include:{evidence:true}}}});if(!row)throw new ApiError(404,"Empresa não encontrada");return row},
 events(q:URLSearchParams){const from=q.get("from"),to=q.get("to"),company=q.get("company"),type=q.get("type"),region=q.get("region");return db.event.findMany({where:{company:company?{slug:company}:undefined,type:type?type as EventType:undefined,region:region??undefined,occurredAt:from||to?{gte:from?new Date(from):undefined,lte:to?new Date(to):undefined}:undefined},orderBy:{occurredAt:"desc"},take:Math.min(Number(q.get("limit"))||50,100),include:{company:true,evidence:true}})}
};
