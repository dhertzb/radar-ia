from typing import Literal
from pydantic import BaseModel, Field, HttpUrl, model_validator
Confidence=Literal["CONFIRMED","REPORTED","RUMOR"]
class SourceFailure(BaseModel): source:str; message:str
class Run(BaseModel): stableKey:str; startedAt:str; finishedAt:str; mode:Literal["LIVE","DEMO","LOCAL"]; sourceFailures:list[SourceFailure]=[]
class Company(BaseModel): slug:str; name:str; ticker:str|None=None; region:str
class Asset(BaseModel): stableKey:str; companySlug:str; symbol:str; exchange:str; timezone:str; currency:str; publicDisplayAllowed:bool
class Close(BaseModel): assetStableKey:str; tradingDate:str; close:float; provider:str; redistributable:bool
class Document(BaseModel): stableKey:str; companySlug:str|None=None; title:str; url:HttpUrl; source:str; publishedAt:str; isPrimary:bool
class Evidence(BaseModel): stableKey:str; documentStableKey:str; companySlug:str|None=None; claim:str; excerpt:str; sourceUrl:HttpUrl; publishedAt:str; confidence:Confidence; isPrimary:bool
class Event(BaseModel): stableKey:str; companySlug:str; evidenceStableKey:str; type:Literal["CANCELLATION","DELAY","RENEGOTIATION","CONTRACT","FINANCING"]; title:str; region:str; occurredAt:str; confidence:Confidence
class Section(BaseModel): title:str; body:str; evidenceStableKeys:list[str]
class Report(BaseModel): stableKey:str; reportDate:str; title:str; summary:str; signal:Literal["AGGRAVATION","STABILIZATION","RECOVERY","INDETERMINATE"]; riskScore:int|None=Field(ge=0,le=100); coverage:float=Field(ge=0,le=1); minimumCoverage:float=Field(ge=0,le=1); missingData:list[str]; evidenceStableKeys:list[str]; sections:list[Section]
class Payload(BaseModel):
    schemaVersion:Literal["1.0.0"]="1.0.0";run:Run;companies:list[Company];assets:list[Asset];closes:list[Close];documents:list[Document];evidence:list[Evidence];events:list[Event];report:Report
    @model_validator(mode="after")
    def validate_references(self):
        evidence={e.stableKey:e for e in self.evidence}; docs={d.stableKey for d in self.documents}
        refs=self.report.evidenceStableKeys+[k for s in self.report.sections for k in s.evidenceStableKeys]
        missing=set(refs)-set(evidence)
        if missing: raise ValueError(f"Referências de evidência inválidas: {sorted(missing)}")
        if any(e.documentStableKey not in docs for e in self.evidence): raise ValueError("Evidência sem documento")
        for event in self.events:
            ev=evidence.get(event.evidenceStableKey)
            if not ev: raise ValueError(f"Evento sem evidência: {event.stableKey}")
            if event.type in ("CANCELLATION","RENEGOTIATION") and event.confidence=="CONFIRMED" and not ev.isPrimary: raise ValueError("Confirmação exige fonte primária")
        return self
