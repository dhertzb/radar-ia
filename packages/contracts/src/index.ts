import { z } from "zod";
export const signalSchema = z.enum(["AGGRAVATION", "STABILIZATION", "RECOVERY", "INDETERMINATE"]);
export const confidenceSchema = z.enum(["CONFIRMED", "REPORTED", "RUMOR"]);
export const eventTypeSchema = z.enum(["CANCELLATION", "DELAY", "RENEGOTIATION", "CONTRACT", "FINANCING"]);
export const evidenceSchema = z.object({stableKey:z.string().min(3),documentStableKey:z.string().min(3),companySlug:z.string().optional(),claim:z.string().min(1),excerpt:z.string().min(1),sourceUrl:z.string().url(),publishedAt:z.string().datetime({offset:true}),confidence:confidenceSchema,isPrimary:z.boolean()});
export const ingestSchema = z.object({
 schemaVersion:z.literal("1.0.0"),
 run:z.object({stableKey:z.string().min(3),startedAt:z.string().datetime({offset:true}),finishedAt:z.string().datetime({offset:true}),mode:z.enum(["LIVE","DEMO","LOCAL"]),sourceFailures:z.array(z.object({source:z.string(),message:z.string()}))}),
 companies:z.array(z.object({slug:z.string(),name:z.string(),ticker:z.string().optional(),region:z.string()})),
 assets:z.array(z.object({stableKey:z.string(),companySlug:z.string(),symbol:z.string(),exchange:z.string(),timezone:z.string(),currency:z.string(),publicDisplayAllowed:z.boolean()})),
 closes:z.array(z.object({assetStableKey:z.string(),tradingDate:z.string().date(),close:z.number().positive(),provider:z.string(),redistributable:z.boolean()})),
 documents:z.array(z.object({stableKey:z.string(),companySlug:z.string().optional(),title:z.string(),url:z.string().url(),source:z.string(),publishedAt:z.string().datetime({offset:true}),isPrimary:z.boolean()})),
 evidence:z.array(evidenceSchema),
 events:z.array(z.object({stableKey:z.string(),companySlug:z.string(),evidenceStableKey:z.string(),type:eventTypeSchema,title:z.string(),region:z.string(),occurredAt:z.string().datetime({offset:true}),confidence:confidenceSchema})),
 report:z.object({stableKey:z.string(),reportDate:z.string().date(),title:z.string(),summary:z.string(),signal:signalSchema,riskScore:z.number().int().min(0).max(100).nullable(),coverage:z.number().min(0).max(1),minimumCoverage:z.number().min(0).max(1),missingData:z.array(z.string()),evidenceStableKeys:z.array(z.string()),sections:z.array(z.object({title:z.string(),body:z.string(),evidenceStableKeys:z.array(z.string())}))})
}).superRefine((value,ctx)=>{
 const keys=new Set(value.evidence.map(e=>e.stableKey));
 for(const key of [...value.report.evidenceStableKeys,...value.report.sections.flatMap(s=>s.evidenceStableKeys)]) if(!keys.has(key)) ctx.addIssue({code:z.ZodIssueCode.custom,message:`Referência de evidência inválida: ${key}`,path:["report"]});
 for(const event of value.events){const evidence=value.evidence.find(e=>e.stableKey===event.evidenceStableKey);if(!evidence)ctx.addIssue({code:z.ZodIssueCode.custom,message:`Evento sem evidência: ${event.stableKey}`});if(["CANCELLATION","RENEGOTIATION"].includes(event.type)&&event.confidence==="CONFIRMED"&&!evidence?.isPrimary)ctx.addIssue({code:z.ZodIssueCode.custom,message:"Cancelamento ou renegociação confirmada exige fonte primária"});}
});
export type IngestPayload=z.infer<typeof ingestSchema>;
