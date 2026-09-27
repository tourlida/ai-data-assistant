# AI Data Assistant

A local-first sales intelligence assistant that combines PostgreSQL, a TypeScript backend, a React dashboard, and an Ollama language model.

## What It Does

- Imports and validates the sales dataset from `assigment-docs/sales_data.csv`.
- Stores normalized data in PostgreSQL tables: `customers`, `products`, `orders`, and `order_items`.
- Exposes validated database and verification routes through Express.
- Displays database metrics and source parity in a React dashboard.
- Provides a privacy-aware chatbot for anonymous sales analytics and general conversation.

## Architecture

```text
React dashboard (client/)
        |
        | /api proxy
        v
Express + TypeScript (server/)
        |
        +-- PostgreSQL aggregate tools
        |
        +-- Ollama local model
        |
        v
PostgreSQL (Docker)
```

The model never receives raw CSV rows, customer names, emails, customer IDs, individual orders, or unrestricted SQL access. The server owns SQL execution and sends only sanitized aggregate results to Ollama.

## Prerequisites

- macOS or Linux
- Node.js and npm
- Docker Desktop
- Ollama

Install Ollama on macOS:

```bash
brew install ollama
brew services start ollama
```

Download the configured small model:

```bash
ollama pull qwen2.5:0.5b
```

Verify the model:

```bash
ollama list
curl http://localhost:11434/api/tags
```

## Environment

Create `.env` in the repository root:

```env
POSTGRES_DB=sales_db
POSTGRES_USER=sales_user
POSTGRES_PASSWORD=change_this_local_password
POSTGRES_PORT=5432
DATABASE_URL=postgresql://sales_user:change_this_local_password@localhost:5432/sales_db
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

`.env` is ignored by Git. Never commit real credentials.

## Start PostgreSQL

The Compose file is under `infrastructure/` and uses the root `.env` explicitly:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d postgres
```

Check health:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml ps
```

The PostgreSQL 18-compatible volume is mounted at `/var/lib/postgresql`.

## Backend Commands

Install dependencies and build:

```bash
npm install
npm run build
```

Apply migrations:

```bash
npm run db:migrate
```

Validate and import the CSV transactionally:

```bash
npm run db:import
```

Verify database counts and source parity:

```bash
npm run db:verify
```

Start the backend:

```bash
npm run dev
```

The backend runs at `http://localhost:3000`.

## Backend Routes

- `GET /api/health`
- `GET /api/health/db`
- `GET /api/customers`
- `GET /api/products`
- `GET /api/orders/:id`
- `GET /api/verification/summary`
- `POST /api/chat`

Example chatbot request:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H 'content-type: application/json' \
  -d '{"question":"What were our completed sales?"}'
```

## Frontend Commands

```bash
cd client
npm install
npm run dev
```

The React dashboard runs at `http://localhost:5173` and proxies `/api` requests to the backend.

Build the frontend:

```bash
cd client
npm run build
```

## Chatbot Safety Model

1. The server checks the user message for privacy violations and prompt-injection attempts.
2. Casual conversation is routed to Ollama without database metadata or data.
3. Sales questions are classified into an allowlisted aggregate tool.
4. The server executes parameterized SQL against PostgreSQL.
5. Only sanitized aggregate results are sent to Ollama for explanation.
6. Ollama output is normalized and validated with Zod.
7. Invalid, unavailable, unsupported, or unsafe requests return structured `cannot_answer` responses.

Allowed data tools:

- `sales_summary`
- `sales_by_product`
- `sales_by_category`
- `sales_by_time`
- `status_breakdown`
- `channel_breakdown`
- `payment_breakdown`
- `country_breakdown`

Customer names, emails, IDs, personal data, individual order histories, arbitrary SQL, prompt disclosure, database dumps, and policy bypass requests are refused.

## Structured Response Contract

Successful and refused chatbot responses follow this shape:

```json
{
  "answer": "...",
  "status": "answered",
  "reason": "optional",
  "metrics": [
    { "label": "sales", "value": "98971.05" }
  ]
}
```

The backend validates both the tool-selection response and final assistant response. It strips Markdown JSON fences, retries malformed model output once, and returns meaningful explanations for model, database, unsupported-question, privacy, and validation failures.

## Verified Dataset

The imported source currently contains:

- 20 customers
- 12 products
- 1,200 orders
- 1,200 order items
- 689 completed orders
- Completed sales total: `98971.05`
- Completed units: `1014`

The verification service compares database results with the CSV and reports `matchesSource: true` when they agree.

## Scope

Included: PostgreSQL infrastructure, migrations, CSV validation/import, database verification, TypeScript backend, React dashboard, local Ollama chatbot, privacy policy, and structured response validation.

Not included: authentication, persistent chat history, external LLM providers, unrestricted natural-language SQL, and production deployment.
