# Radar IA

Plataforma pública em português para acompanhar sinais de crise, financiamento e possível bolha no ecossistema global de inteligência artificial. O relatório publicado liga cada afirmação às evidências usadas e nunca substitui o último relatório válido quando uma execução falha.

> **Importante:** dados produzidos com `--demo` são sintéticos e aparecem como **[DEMONSTRAÇÃO]**. Não representam fatos sobre as empresas.

## Arquitetura

- `apps/web`: Next.js + React + Tailwind + D3 e API em Vercel Functions (`/api/v1`).
- `apps/api/prisma`: schema e migrações Prisma mantidos como código; não há servidor de API permanente.
- `apps/worker`: HTTPX, BeautifulSoup, RSS/SEC EDGAR e saída estruturada da OpenAI.
- `packages/contracts`: schema Zod versionado, compartilhado pela API e validado no CI.

O worker calcula datas, variações e o índice; o modelo só redige e classifica usando IDs existentes. A API revalida referências e publica documento, evidências, eventos e relatório em uma transação serializável. `stableKey` e restrições únicas tornam reexecuções idempotentes.

## Rodar localmente

Requer Docker, Node 20+, pnpm 9, Python 3.12 e uv.

```bash
cp .env.example .env
pnpm install
cd apps/worker && uv sync --all-extras && cd ../..
docker compose up -d postgres
pnpm db:migrate
pnpm --filter @radar-ia/api dev
# em outro terminal
pnpm --filter @radar-ia/web dev
# em outro terminal: publica fixture sintética
pnpm worker:demo
```

Abra `http://localhost:3000`. Para subir tudo em containers e disparar a fixture uma vez:

```bash
docker compose up -d --build postgres api web
docker compose run --rm worker --demo
```

## Operação pelo celular

1. Abra **Actions → Radar diário → Run workflow** no GitHub e escolha `demo=false`.
2. Veja falhas no log da etapa “Coletar, analisar e publicar”; falhas por fonte também ficam em `run.sourceFailures`, visíveis em `GET /v1/status`.
3. Confirme `lastAttempt.status`, `lastPublishedAt` e `lastReportDate` em `https://SUA_API/v1/status`.
4. Abra a URL da Vercel; o dashboard consulta a API em cada acesso, sem novo deploy.

## Índice de risco

O índice (0–100) é calculado em `apps/worker/src/radar_worker/indicators.py`:

| Componente | Peso | Regra atual |
|---|---:|---|
| estresse de mercado | 30% | média do valor absoluto da variação de 20 pregões × 4, limitada a 100 |
| eventos negativos | 35% | cancelamento, atraso ou renegociação × 25, limitado a 100 |
| estresse de financiamento | 20% | eventos de financiamento × 20, limitado a 100 |
| risco documental | 15% | eventos negativos × 15, limitado a 100 |

Cobertura mínima: **60%** dos pesos observáveis. Abaixo disso o resultado é `null` e a interface mostra “dados insuficientes”. Variações de 1, 5 e 20 pregões usam linhas de fechamento, nunca dias corridos. Em feriados/fins de semana, o worker preserva a data da última linha fornecida pelo provedor. O provedor de mercado fica desabilitado por padrão; preços só são públicos quando `redistributable=true`.

## Coleta e fontes

SEC EDGAR é consultado pela API oficial de submissions, com `SEC_USER_AGENT` identificável. Relações com investidores devem ser adicionadas como coletores específicos, respeitando termos e `robots.txt`. RSS configuráveis (`NEWS_RSS_URLS`) servem para descoberta; notícias não viram confirmação de cancelamento/renegociação sem uma fonte primária. Playwright não é instalado por padrão: só deve ser habilitado por coletor quando a fonte permitir e exigir renderização.

## Testes e validação

```bash
pnpm contracts:check
pnpm typecheck
pnpm build
cd apps/worker && uv run pytest
docker compose config
```

Os testes cobrem referências inválidas da IA, cobertura insuficiente, cálculo por pregões, preservação da sexta-feira em fim de semana e chave idempotente. A transação da API preserva o último relatório: o novo `Report` só existe se todo o callback transacional concluir.

## Implantação

1. O projeto Neon fica vinculado pela `.neon`; `neon deploy` atualiza `.env.local` com `DATABASE_URL` (pooled) e `DATABASE_URL_UNPOOLED` (migrações).
2. Importe o monorepo na Vercel com root na raiz e configure `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `INGEST_TOKEN` e `WEB_ORIGIN`. A API será publicada em `https://SEU_SITE/api/v1`.
3. No GitHub, crie environment `production`, secrets `API_URL=https://SEU_SITE/api/v1`, `INGEST_TOKEN`, `OPENAI_API_KEY`, e variables `SEC_USER_AGENT`, `NEWS_RSS_URLS`, `OPENAI_MODEL`.
4. Rode `Radar diário` manualmente, confirme `/api/v1/status`, `/api/v1/reports/latest` e o site. O cron executa às 22:00 UTC, equivalente a 19:00 em `America/Sao_Paulo` no regime atual; revise se a legislação de horário de verão mudar.

Segredos nunca usam prefixo `NEXT_PUBLIC_` nem entram no navegador. Amplie `COMPANIES`/CIKs e provedores para novos mercados sem alterar o contrato público.
