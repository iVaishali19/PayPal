# PayPal in a Microservice Architecture (NestJS + gRPC + RabbitMQ + Docker)

A hands-on implementation of the pattern from
[this freeCodeCamp article](https://www.freecodecamp.org/news/how-to-implement-paypal-in-a-microservice-architecture-using-nestjs-grpc-and-docker/):
one dedicated **payment-service** owns all PayPal logic; other services ask it
over gRPC and react to results via RabbitMQ events.

## The big picture

```
Frontend ──HTTP──> student-apigw ──gRPC──> students-service ──gRPC──> payment-service ──REST──> PayPal
                                               ▲                            │
                                               └──────── RabbitMQ ◀─────────┘
                                                     payment.application.completed
                          payment-service also persists to PostgreSQL
```

| Service | Role | Ports |
| --- | --- | --- |
| `student-apigw` | Public HTTP door for the frontend. No PayPal creds. | 3000 (HTTP) |
| `students-service` | Business logic (applications, tuition). gRPC server + event consumer. | 3004 (HTTP), 50062 (gRPC) |
| `payment-service` | Owns ALL PayPal calls, DB, wallet, ledger, events. | 3003 (HTTP), 50061 (gRPC) |
| `postgres` | Payment database. | 5432 |
| `rabbitmq` | Event bus (+ management UI on 15672, guest/guest). | 5672 |

## Payment lifecycle

`NOT_STARTED` → `EXECUTING` → `SUCCESS` (or `FAILED`)

1. **Create** — payment-service asks PayPal to create an order, gets an `approveUrl`.
2. **Approve** — user visits `approveUrl`, logs in, approves; PayPal redirects back.
3. **Capture** — payment-service captures the funds, updates wallet/ledger, and
   publishes `payment.application.completed` to RabbitMQ.

Two safety nets: **idempotency keys** stop double charges, and the **RabbitMQ
event** lets students-service mark the application PAID even if the synchronous
capture response was lost.

## Prerequisites

- Docker + Docker Compose (recommended path), or Node.js 18+ for local runs
- A PayPal **sandbox** account: create a REST app at
  <https://developer.paypal.com> → Apps & Credentials → Sandbox, and copy the
  Client ID + Secret. You also get sandbox buyer/seller test accounts there.

## Quick start (Docker)

```bash
# 1. Configure credentials
cp .env.example .env
# edit .env and paste your PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (sandbox)

# 2. Build & run everything
docker compose up --build

# 3. Verify health
curl http://localhost:3003/health   # payment-service
curl http://localhost:3000/health   # gateway
```

## Try the full payment flow

A sample application `id=42` (amount $500) is seeded in students-service.

```bash
# 1. Initiate payment (frontend sends its own origin as "domain")
curl -X POST http://localhost:3000/applications/42/pay/applicationfee \
  -H "Content-Type: application/json" \
  -d '{ "domain": "http://localhost:3000" }'
# -> returns { approveUrl, paypalOrderId, paymentOrderId }

# 2. Open the approveUrl in a browser, log in with a PayPal SANDBOX BUYER
#    account, and approve. PayPal redirects to the returnUrl (which contains
#    the token / PayPal order id).

# 3. Capture the approved payment
curl -X POST http://localhost:3000/applications/42/pay/applicationfee/capture \
  -H "Content-Type: application/json" \
  -d '{ "paypalOrderId": "PASTE_PAYPAL_ORDER_ID" }'

# 4. Confirm the application is now PAID (updated via capture AND/OR event)
curl http://localhost:3000/applications/42
```

You can also test the payment-service directly (bypassing gRPC):

```bash
curl -X POST http://localhost:3003/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{ "amount": "12.00", "currency": "USD" }'
```

## Local development (one command)

The services run on your host with live reload; Postgres + RabbitMQ run in
Docker. **Docker Desktop must be running.**

```bash
cp .env.example .env      # PowerShell: Copy-Item .env.example .env
npm install
npm run dev               # starts postgres + rabbitmq, then all 3 services
```

`npm run dev` does two things:

1. `dev:infra` — `docker compose up -d --wait postgres rabbitmq` (waits until healthy)
2. `dev:services` — runs payment, students and gateway together via `concurrently`

Other handy scripts:

| Script | What it does |
| --- | --- |
| `npm run dev:infra` | Start only Postgres + RabbitMQ |
| `npm run dev:infra:down` | Stop Postgres + RabbitMQ |
| `npm run dev:payment` / `dev:students` / `dev:gateway` | Run a single service with reload |
| `npm run docker:up` | Run EVERYTHING (incl. services) in Docker |
| `npm run build` / `npm run typecheck` | Compile / type-check all services |

For local dev the services default to `localhost` and local ports, so you only
need PayPal credentials in `.env` — do not set `DB_HOST` or `*_SERVICE_URL`.

## Project structure

```
apps/
  payment-service/   # owns PayPal, DB (Sequelize), wallet, ledger, events
  students-service/  # domain logic + gRPC client + RabbitMQ consumer
  student-apigw/     # public HTTP gateway -> students-service (gRPC)
libs/
  shared/proto/      # payment.proto + students.proto (shared gRPC contracts)
docker-compose.yml
```

## Notes & simplifications vs. the article

- **DB schema** is auto-created on boot (`synchronize: true`) for convenience.
  In production you'd use real migrations (Umzug/Sequelize CLI) compiled to JS
  and copied into the image — the article calls this out as a common gotcha.
- **students-service** uses an in-memory application store instead of its own
  database, so the demo runs without a second DB.
- **Auth (JWT), coupons, and webhook signature verification** are stubbed /
  omitted to keep the focus on the payment flow. A webhook endpoint exists at
  `POST /api/payments/webhooks/paypal` as a starting point.
- Switch to **live** PayPal by setting `PAYPAL_API_BASE=https://api-m.paypal.com`
  and using live credentials — no code changes.
```
