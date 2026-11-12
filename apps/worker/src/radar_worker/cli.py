import asyncio
import hashlib
from datetime import UTC, date, datetime
from urllib.parse import urlparse

import httpx
import typer

from .analysis import local_analysis, openai_analysis
from .config import Settings
from .fixture import COMPANIES, demo_data
from .models import Evidence, Payload, Run
from .providers import discover_sec, rss_documents

app = typer.Typer(no_args_is_help=True)
CIKS = {"nvidia": "1045810", "amd": "2488", "coreweave": "1769628", "oracle": "1341439"}


@app.callback()
def main():
    """Coleta, analisa e publica o Radar IA."""


def validate_runtime_settings(cfg: Settings, demo: bool) -> None:
    parsed = urlparse(cfg.api_url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("API_URL deve ser uma URL completa com http:// ou https://")
    if not cfg.ingest_token.strip():
        raise ValueError("INGEST_TOKEN não foi configurado")
    if not demo and not cfg.sec_user_agent.strip():
        raise ValueError("SEC_USER_AGENT não foi configurado")


async def execute(demo: bool, day: date):
    cfg = Settings()
    validate_runtime_settings(cfg, demo)
    started = datetime.now(UTC)
    failures = []
    mode = "DEMO" if demo else "LIVE"
    run_key = f"daily:{day.isoformat()}:{mode.lower()}"
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            f"{cfg.api_url.rstrip('/')}/internal/runs",
            headers={"Authorization": f"Bearer {cfg.ingest_token}"},
            json={
                "stableKey": run_key,
                "startedAt": started.isoformat(),
                "mode": mode,
                "status": "STARTED",
                "sourceFailures": [],
            },
        )
        response.raise_for_status()
    if demo:
        assets, closes, documents, evidence, events = demo_data(day)
    else:
        assets = []
        closes = []
        documents = []
        evidence = []
        events = []
        for company in COMPANIES:
            docs, failed = await discover_sec(company.slug, CIKS[company.slug], cfg.sec_user_agent)
            documents.extend(docs)
            failures.extend(failed)
            for doc in docs[:1]:
                key = "evidence:" + hashlib.sha256(doc.stableKey.encode()).hexdigest()[:16]
                evidence.append(
                    Evidence(
                        stableKey=key,
                        documentStableKey=doc.stableKey,
                        companySlug=company.slug,
                        claim=f"{company.name} publicou {doc.title}.",
                        excerpt="Metadado oficial de protocolo no SEC EDGAR; o conteúdo deve ser consultado no documento vinculado.",
                        sourceUrl=doc.url,
                        publishedAt=doc.publishedAt,
                        confidence="CONFIRMED",
                        isPrimary=True,
                    )
                )
        rss, failed = await rss_documents(
            [u.strip() for u in cfg.news_rss_urls.split(",") if u.strip()]
        )
        documents.extend(rss)
        failures.extend(failed)
        if not evidence:
            sources = ", ".join(f.source for f in failures) or "nenhuma fonte respondeu"
            raise RuntimeError(f"Nenhuma evidência primária foi coletada. Falhas: {sources}")
    if cfg.openai_api_key and not demo:
        report = await openai_analysis(
            day.isoformat(),
            evidence,
            events,
            closes,
            len(documents),
            cfg.openai_api_key,
            cfg.openai_model,
        )
    else:
        report = local_analysis(day.isoformat(), evidence, events, closes, len(documents))
    finished = datetime.now(UTC)
    payload = Payload(
        run=Run(
            stableKey=run_key,
            startedAt=started.isoformat(),
            finishedAt=finished.isoformat(),
            mode=mode,
            sourceFailures=failures,
        ),
        companies=COMPANIES,
        assets=assets,
        closes=closes,
        documents=documents,
        evidence=evidence,
        events=events,
        report=report,
    )
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"{cfg.api_url.rstrip('/')}/internal/ingest",
            headers={"Authorization": f"Bearer {cfg.ingest_token}"},
            json=payload.model_dump(mode="json"),
        )
        if response.is_error:
            typer.echo(response.text, err=True)
        response.raise_for_status()
        typer.echo(response.json())


@app.command()
def run(
    demo: bool = typer.Option(False, "--demo", help="Usa dados sintéticos marcados"),
    day: str | None = typer.Option(None, "--date"),
):
    """Executa a mesma rotina usada localmente e no GitHub Actions."""
    target = date.fromisoformat(day) if day else date.today()
    try:
        asyncio.run(execute(demo, target))
    except Exception as exc:  # noqa: BLE001 - registra qualquer falha do job na API
        cfg = Settings()
        now = datetime.now(UTC)
        mode = "DEMO" if demo else "LIVE"
        try:
            httpx.post(
                f"{cfg.api_url.rstrip('/')}/internal/runs",
                headers={"Authorization": f"Bearer {cfg.ingest_token}"},
                json={
                    "stableKey": f"daily:{target.isoformat()}:{mode.lower()}",
                    "startedAt": now.isoformat(),
                    "finishedAt": now.isoformat(),
                    "mode": mode,
                    "status": "FAILED",
                    "sourceFailures": [],
                    "error": str(exc)[:1000],
                },
                timeout=20,
            ).raise_for_status()
        finally:
            raise


if __name__ == "__main__":
    app()
