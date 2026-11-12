import json
from openai import AsyncOpenAI
from .models import Evidence,Event,Report,Section
from .indicators import MINIMUM_COVERAGE,risk_index
def local_analysis(day:str,evidence:list[Evidence],events:list[Event],closes,document_count:int)->Report:
    score,coverage,_=risk_index(events,closes,document_count);negative=sum(e.type in ("CANCELLATION","DELAY","RENEGOTIATION") for e in events);positive=sum(e.type in ("CONTRACT","FINANCING") for e in events)
    signal="INDETERMINATE" if coverage<MINIMUM_COVERAGE else ("AGGRAVATION" if negative>positive else "RECOVERY" if positive>negative else "STABILIZATION")
    keys=[e.stableKey for e in evidence];missing=[]
    if not closes:missing.append("Feed de mercado com licença de redistribuição")
    if document_count<4:missing.append("Cobertura documental mínima de quatro empresas")
    return Report(stableKey=f"report:{day}",reportDate=day,title=f"Radar IA — {day}",summary="Leitura automatizada em modo local: sinais documentais e de mercado foram ponderados sem inferir números pelo modelo.",signal=signal,riskScore=score,coverage=coverage,minimumCoverage=MINIMUM_COVERAGE,missingData=missing,evidenceStableKeys=keys,sections=[Section(title="Sinais observados",body="Os eventos recentes foram classificados pelo tipo e pela qualidade da fonte. Afirmações confirmadas dependem de fonte primária.",evidenceStableKeys=keys[:4]),Section(title="Leitura do risco",body="O índice combina estresse de mercado (30%), eventos negativos (35%), financiamento (20%) e risco documental (15%).",evidenceStableKeys=keys[4:8])])
async def openai_analysis(day:str,evidence:list[Evidence],events:list[Event],closes,document_count:int,api_key:str,model:str)->Report:
    score,coverage,components=risk_index(events,closes,document_count);allowed=[e.stableKey for e in evidence]
    prompt={"date":day,"computed":{"riskScore":score,"coverage":coverage,"minimumCoverage":MINIMUM_COVERAGE,"components":components},"evidence":[e.model_dump(mode="json") for e in evidence],"events":[e.model_dump() for e in events],"rules":["Use somente IDs fornecidos","Não calcule percentuais","Diferencie confirmado, reportado e rumor","Liste dados faltantes"]}
    client=AsyncOpenAI(api_key=api_key);response=await client.responses.parse(model=model,input=[{"role":"system","content":"Você é analista do Radar IA. Produza análise sóbria em pt-BR com referências verificáveis."},{"role":"user","content":json.dumps(prompt,ensure_ascii=False)}],text_format=Report)
    report=response.output_parsed
    if report is None:raise RuntimeError("OpenAI não retornou análise estruturada")
    report.stableKey=f"report:{day}";report.reportDate=day;report.riskScore=score;report.coverage=coverage;report.minimumCoverage=MINIMUM_COVERAGE
    invalid=set(report.evidenceStableKeys+[k for s in report.sections for k in s.evidenceStableKeys])-set(allowed)
    if invalid:raise ValueError(f"IA referenciou evidências inválidas: {sorted(invalid)}")
    return report
