from typing import Protocol
import feedparser,httpx
from bs4 import BeautifulSoup
from .models import Close,Document,SourceFailure
class MarketProvider(Protocol):
    redistributable:bool
    async def closes(self,symbol:str)->list[Close]:...
class DisabledMarketProvider:
    redistributable=False
    async def closes(self,symbol:str)->list[Close]: return []
async def discover_sec(company_slug:str,cik:str,user_agent:str)->tuple[list[Document],list[SourceFailure]]:
    url=f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
    try:
        async with httpx.AsyncClient(headers={"User-Agent":user_agent},timeout=20) as client: response=await client.get(url);response.raise_for_status();data=response.json()
        recent=data["filings"]["recent"];docs=[]
        for i,form in enumerate(recent["form"][:20]):
            if form not in {"8-K","10-Q","10-K"}:continue
            accession=recent["accessionNumber"][i];primary=recent["primaryDocument"][i];compact=accession.replace("-","")
            docs.append(Document(stableKey=f"sec:{accession}",companySlug=company_slug,title=f"{form} — {recent['filingDate'][i]}",url=f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{compact}/{primary}",source="SEC EDGAR",publishedAt=f"{recent['filingDate'][i]}T12:00:00Z",isPrimary=True))
        return docs,[]
    except Exception as exc:return [],[SourceFailure(source=f"SEC:{company_slug}",message=str(exc)[:400])]
async def rss_documents(urls:list[str])->tuple[list[Document],list[SourceFailure]]:
    docs=[];failures=[]
    for url in urls:
        try:
            async with httpx.AsyncClient(timeout=20,follow_redirects=True) as client:r=await client.get(url);r.raise_for_status()
            feed=feedparser.loads(r.text)
            for entry in feed.entries[:20]:
                title=BeautifulSoup(entry.get("title","Sem título"),"html.parser").get_text(" ",strip=True);link=entry.get("link")
                if link:docs.append(Document(stableKey=f"rss:{entry.get('id',link)}",title=title,url=link,source=feed.feed.get("title","RSS"),publishedAt=entry.get("published","1970-01-01T00:00:00Z"),isPrimary=False))
        except Exception as exc:failures.append(SourceFailure(source=url,message=str(exc)[:400]))
    return docs,failures
