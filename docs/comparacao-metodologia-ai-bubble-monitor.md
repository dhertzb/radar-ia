# Comparação metodológica: Radar IA × AI Bubble Monitor

Data da análise: 12 de novembro de 2026
Referência externa: <https://aibubblemonitor.com/methodology>

## Resumo executivo

O Radar IA já possui uma boa arquitetura de coleta, evidências, validação e publicação, mas ainda não é comparável ao AI Bubble Monitor como índice quantitativo de bolha.

No estado atual, o Radar IA funciona melhor como um monitor de eventos corporativos e risco operacional. O AI Bubble Monitor 2.0 opera como um índice financeiro historicamente calibrado, composto por múltiplas séries quantitativas.

Nossa principal vantagem é a rastreabilidade entre documento, evidência, evento e relatório. As principais lacunas são a falta de dados de mercado no fluxo real, ausência de calibração histórica e baixa independência entre os componentes do índice.

## Comparação

| Aspecto        | AI Bubble Monitor 2.0                                               | Radar IA                                                                          |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Objetivo       | Medir euforia, fragilidade e distância entre demanda e investimento | Detectar estresse de mercado, eventos negativos, financiamento e risco documental |
| Componentes    | Sete pilares e dezenas de métricas                                  | Quatro componentes simples                                                        |
| Universo       | Cesta de líderes de IA e benchmarks de mercado                      | Nvidia, AMD, CoreWeave e Oracle                                                   |
| Histórico      | Séries desde 1990; algumas desde 1926                               | Sem calibração histórica                                                          |
| Normalização   | Percentil contra o histórico disponível                             | Multiplicadores fixos e limites manuais                                           |
| Validação      | Backtest contra bolhas e períodos tranquilos                        | Testes de código, sem backtest econômico                                          |
| Dados ausentes | Pesos redistribuídos; dados vencidos perdem peso gradualmente       | Componentes ausentes ficam em zero; nota é anulada abaixo de 60% de cobertura     |
| Revisões       | Metodologia versionada e histórico imutável                         | Execuções idempotentes, sem versão metodológica explícita                         |
| Evidências     | Fontes e metodologia públicas                                       | Vínculo direto entre documento, evidência, evento e relatório                     |

## Metodologia do AI Bubble Monitor 2.0

Os sete pilares informados são:

| Pilar                     | Peso | Eixo principal |
| ------------------------- | ---: | -------------- |
| Valuation & concentration |  20% | Euforia        |
| Price dynamics            |  10% | Euforia        |
| Capex strain              |  20% | Fragilidade    |
| Credit & financing        |  15% | Fragilidade    |
| Leverage & positioning    |  15% | Ambos          |
| Demand reality check      |  15% | Demanda        |
| Narrative & attention     |   5% | Euforia        |

Características relevantes:

- Cada entrada é classificada por percentil contra seu próprio histórico.
- Algumas métricas têm o sentido invertido quando um valor elevado reduz o risco de bolha.
- Uma série só entra no índice após possuir histórico mínimo suficiente.
- Dados desatualizados perdem peso gradualmente.
- Entradas ausentes têm o peso redistribuído entre as demais.
- O histórico usa somente informações que já eram públicas em cada data.
- Metodologias novas recebem um identificador de série novo.
- Correções são registradas sem sobrescrever silenciosamente o histórico.
- O backtest verifica bolhas conhecidas e períodos de baixa especulação.

## Metodologia atual do Radar IA

Implementação principal: `apps/worker/src/radar_worker/indicators.py`.

| Componente                | Peso | Regra atual                                                  |
| ------------------------- | ---: | ------------------------------------------------------------ |
| Estresse de mercado       |  30% | Média da variação absoluta de 20 pregões × 4, limitada a 100 |
| Eventos negativos         |  35% | Cancelamento, atraso ou renegociação × 25, limitado a 100    |
| Estresse de financiamento |  20% | Eventos de financiamento × 20, limitado a 100                |
| Risco documental          |  15% | Eventos negativos × 15, limitado a 100                       |

A cobertura mínima é de 60%. Abaixo desse valor, `riskScore` fica `null`.

## Problemas identificados

### 1. O fluxo real não consegue produzir uma nota útil

No modo real, o worker começa com ativos, preços e eventos vazios. O coletor SEC registra a publicação de formulários, mas ainda não interpreta o conteúdo para produzir eventos. RSS também é usado apenas para descoberta.

Com isso, a cobertura tende a ficar limitada ao componente documental, abaixo do mínimo de 60%, e a nota permanece `null`.

### 2. Ausência de evento é confundida com ausência de observação

Atualmente, não encontrar um evento de financiamento elimina a cobertura desse componente. É necessário distinguir:

- fonte consultada e nenhum evento encontrado;
- fonte indisponível ou não consultada;
- evento encontrado e confirmado.

### 3. Alta e queda recebem o mesmo tratamento

O valor absoluto da variação de mercado faz uma alta de 25% e uma queda de 25% produzirem o mesmo nível de estresse. Para um índice de bolha, euforia e deterioração precisam ser dimensões separadas.

### 4. Componentes não são independentes

`negative_events` e `document_risk` são derivados da mesma contagem de cancelamentos, atrasos e renegociações. Isso duplica o peso do mesmo sinal.

### 5. Não existe calibração histórica

Os multiplicadores atuais não foram calibrados contra episódios como dot-com, 2008, 2021 ou períodos tranquilos. A nota pode ser internamente consistente sem possuir interpretação econômica confiável.

### 6. Dados ausentes são tratados como zero

Quando a cobertura ultrapassa 60%, componentes ausentes continuam contribuindo como zero e os pesos não são redistribuídos. Isso pode reduzir artificialmente a nota.

## Pontos fortes a preservar

- Rastreabilidade de cada afirmação até sua evidência.
- Distinção entre fonte primária e fonte reportada.
- Confirmações sensíveis exigem fonte primária.
- O modelo de IA não calcula a nota quantitativa.
- Contratos estruturados e validação de referências.
- Publicação em transação serializável.
- Chaves idempotentes para impedir duplicação.
- Falhas de coleta são registradas explicitamente.
- Cobertura insuficiente resulta em ausência de nota, não em número inventado.

## Roadmap recomendado

### Fase 1 — Tornar o índice operacional

- [ ] Implementar um provedor de preços reais com licença compatível.
- [ ] Adicionar benchmarks como S&P 500, Nasdaq-100 e índices setoriais.
- [ ] Separar disponibilidade da fonte de ocorrência de eventos.
- [ ] Interpretar o conteúdo de 8-K, 10-Q e 10-K, não apenas seus metadados.
- [ ] Criar coletores de relações com investidores e comunicados oficiais.
- [ ] Remover a duplicação entre risco documental e eventos negativos.

### Fase 2 — Melhorar a metodologia

- [ ] Separar euforia, fragilidade e demanda real.
- [ ] Adicionar valuation: P/E, preço/vendas e crescimento de receita.
- [ ] Adicionar concentração de mercado e participação no índice.
- [ ] Adicionar momentum relativo ao mercado, RSI e média de longo prazo.
- [ ] Adicionar capex relativo ao fluxo de caixa operacional.
- [ ] Adicionar spreads de crédito e estresse de financiamento.
- [ ] Adicionar demanda real por IA, com controles adequados para crescimento estrutural.
- [ ] Normalizar métricas por percentis históricos.
- [ ] Redistribuir pesos quando dados realmente estiverem ausentes.
- [ ] Fazer dados desatualizados perderem peso gradualmente.

### Fase 3 — Validação e governança

- [ ] Construir base histórica point-in-time, respeitando a data de publicação.
- [ ] Executar backtests contra períodos de bolha e períodos tranquilos.
- [ ] Definir pesos e regras antes de avaliar o backtest final.
- [ ] Versionar a metodologia e o identificador da série.
- [ ] Manter histórico imutável e registrar correções.
- [ ] Publicar página de metodologia, fontes, limitações e changelog.
- [ ] Expor os componentes da nota na API e na interface.

## Direção de produto sugerida

O Radar IA não precisa copiar integralmente o concorrente. Uma posição mais diferenciada seria combinar:

1. um núcleo quantitativo historicamente calibrado;
2. um monitor de eventos corporativos com evidências primárias;
3. relatórios explicativos em português;
4. transparência sobre cobertura, falhas e dados ausentes.

Essa combinação preserva nossa vantagem de rastreabilidade e acrescenta a robustez quantitativa necessária para sustentar a expressão “índice de risco de bolha”.

## Referências

- AI Bubble Monitor — Methodology: <https://aibubblemonitor.com/methodology>
- AI Bubble Monitor — Data Sources: <https://aibubblemonitor.com/data-sources>
- Implementação local do índice: `apps/worker/src/radar_worker/indicators.py`
- Fluxo do worker: `apps/worker/src/radar_worker/cli.py`
- Coletores atuais: `apps/worker/src/radar_worker/providers.py`
- Documentação do projeto: `README.md`
