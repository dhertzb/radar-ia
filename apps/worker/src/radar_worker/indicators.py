from collections import defaultdict
from .models import Close,Event
MINIMUM_COVERAGE=.60
WEIGHTS={"market_stress":.30,"negative_events":.35,"financing_stress":.20,"document_risk":.15}
def market_changes(closes:list[Close])->dict[str,dict[str,float|None]]:
    grouped=defaultdict(list)
    for row in closes: grouped[row.assetStableKey].append(row)
    out={}
    for key,rows in grouped.items():
        rows.sort(key=lambda x:x.tradingDate,reverse=True); values=[r.close for r in rows]
        out[key]={f"change_{n}d":round((values[0]/values[n]-1)*100,2) if len(values)>n else None for n in (1,5,20)}
    return out
def risk_index(events:list[Event],closes:list[Close],document_count:int,expected_documents:int=4)->tuple[int|None,float,dict[str,float]]:
    changes=market_changes(closes); market_values=[abs(v["change_20d"] or 0) for v in changes.values() if v["change_20d"] is not None]
    market=min(100,(sum(market_values)/len(market_values))*4) if market_values else 0
    negative=sum(1 for e in events if e.type in ("CANCELLATION","DELAY","RENEGOTIATION")); financing=sum(1 for e in events if e.type=="FINANCING")
    components={"market_stress":market,"negative_events":min(100,negative*25),"financing_stress":min(100,financing*20),"document_risk":min(100,negative*15)}
    coverage=sum([.30 if market_values else 0,.35 if events else 0,.20 if any(e.type=="FINANCING" for e in events) else 0,.15*min(1,document_count/expected_documents)])
    score=round(sum(components[k]*WEIGHTS[k] for k in WEIGHTS)) if coverage>=MINIMUM_COVERAGE else None
    return score,round(coverage,2),components
