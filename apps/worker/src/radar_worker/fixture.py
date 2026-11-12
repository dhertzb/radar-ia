from datetime import date,datetime,timedelta,timezone
from .models import Asset,Close,Company,Document,Evidence,Event
COMPANIES=[Company(slug="nvidia",name="Nvidia",ticker="NVDA",region="Estados Unidos"),Company(slug="amd",name="AMD",ticker="AMD",region="Estados Unidos"),Company(slug="coreweave",name="CoreWeave",ticker="CRWV",region="Estados Unidos"),Company(slug="oracle",name="Oracle",ticker="ORCL",region="Estados Unidos")]
def demo_data(day:date):
    assets=[Asset(stableKey=f"nasdaq:{c.ticker}",companySlug=c.slug,symbol=c.ticker or "",exchange="NASDAQ" if c.slug!="oracle" else "NYSE",timezone="America/New_York",currency="USD",publicDisplayAllowed=True) for c in COMPANIES]
    closes=[]
    for ci,c in enumerate(COMPANIES):
        cursor=day;rows=[]
        while len(rows)<21:
            if cursor.weekday()<5:rows.append(cursor)
            cursor-=timedelta(days=1)
        for i,d in enumerate(reversed(rows)):closes.append(Close(assetStableKey=f"nasdaq:{c.ticker}",tradingDate=d.isoformat(),close=90+ci*35+i*(1.2-ci*.25),provider="DEMO_FIXTURE",redistributable=True))
    now=datetime.combine(day,datetime.min.time(),tzinfo=timezone.utc).replace(hour=15).isoformat().replace("+00:00","Z")
    docs=[];evidence=[];events=[]
    definitions=[("nvidia","10-Q de demonstração","Crescimento de demanda permanece concentrado em grandes clientes.","CONTRACT"),("amd","8-K de demonstração","Novo contrato de infraestrutura foi anunciado.","CONTRACT"),("coreweave","Comunicado de demonstração","Financiamento adicional aumenta a alavancagem observada.","FINANCING"),("oracle","Comunicado de demonstração","Cronograma de um data center foi adiado.","DELAY")]
    for i,(slug,title,claim,event_type) in enumerate(definitions):
        url=f"https://example.com/demonstracao/{slug}/{day.isoformat()}";doc_key=f"demo-doc:{slug}:{day}";ev_key=f"demo-evidence:{slug}:{day}"
        docs.append(Document(stableKey=doc_key,companySlug=slug,title=f"[DEMONSTRAÇÃO] {title}",url=url,source="Fixture local — não é fonte real",publishedAt=now,isPrimary=True))
        evidence.append(Evidence(stableKey=ev_key,documentStableKey=doc_key,companySlug=slug,claim=f"[DEMONSTRAÇÃO] {claim}",excerpt="Conteúdo sintético usado exclusivamente para validar o fluxo ponta a ponta.",sourceUrl=url,publishedAt=now,confidence="CONFIRMED",isPrimary=True))
        events.append(Event(stableKey=f"demo-event:{slug}:{day}",companySlug=slug,evidenceStableKey=ev_key,type=event_type,title=f"[DEMONSTRAÇÃO] {claim}",region="Estados Unidos",occurredAt=now,confidence="CONFIRMED"))
    return assets,closes,docs,evidence,events
