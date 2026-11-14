<p align="center">
  <img src="client/public/celsyn-logo.png" width="92" alt="Celsyn logo" />
</p>

<h1 align="center">Celsyn</h1>

<p align="center"><strong>Real-time cold-chain fleet operations, from telemetry to action.</strong></p>

<p align="center">
  React 19 · Node.js · Express · MongoDB · Socket.IO · Leaflet · Recharts
</p>

![Celsyn landing page](docs/assets/celsyn-landing.png)

Celsyn is a real-time cold-chain fleet telemetry platform built for the MERNIFY Hackathon. It validates and processes high-frequency vehicle events, stores historical telemetry in MongoDB, detects deterministic cold-chain incidents, and streams selective live updates to an authenticated operations workspace.

> **Deployment link:** will be added after deployment.

## Navigate

- [Product capabilities](#current-feature-set)
- [Architecture](#architecture)
- [Run the complete demo](#run-the-complete-local-demo)
- [API and real-time protocol](#rest-api)
- [Testing and performance](#tests-and-production-build)

## Problem being solved

Temperature-sensitive cargo can be damaged before an operations team realizes that a refrigeration unit has failed, a cargo door is open, or a vehicle has left its safe operating range. Celsyn gives operators one live view of fleet health, individual truck telemetry, historical temperature trends, incident alerts, and the performance of the telemetry pipeline itself.

## Current feature set

- Configurable refrigerated-fleet simulation with cargo-specific safe temperature ranges and routes
- Gradually changing location, temperature, humidity, speed, fuel, door, and reefer telemetry
- Zod-validated single and batch ingestion with rate limiting
- Latest-state fleet model with stale-sequence rejection
- Buffered MongoDB persistence with unique `eventId` deduplication
- Bounded historical queries ordered by timestamp and sequence
- Selective Socket.IO fleet, truck, and alert rooms
- Controlled 150 ms visualization broadcasting independent of ingestion rate
- Temperature, reefer, moving-door, and low-fuel incident detection with cooldowns
- Development-only temperature excursion demo
- Actual throughput, latency, persistence, rejection, and connection counters
- JWT-protected dashboard APIs and Socket.IO connections
- Reproducible configurable stress-test workflow
- Responsive React dashboard with historical + live Recharts visualization
- Interactive live fleet map with status markers, synchronized selection, and operational filtering
- Dedicated truck records with live telemetry, stored history, compliance, and truck-specific incidents
- Searchable incident triage with synchronized truck and fleet navigation
- Stored-telemetry compliance analysis across 60-minute, 6-hour, and 24-hour windows
- Live telemetry pipeline visualization with throughput, latency, persistence, and delivery counters

## Architecture

![Celsyn hand-drawn system architecture](docs/architecture-handdrawn.svg)

The backend can ingest many events between visual updates. The broadcast scheduler retains only the newest changed state for each truck, while every accepted event is still queued for MongoDB persistence.

The [detailed architecture plan](docs/architecture.md) covers component ownership, data contracts, ingestion and delivery sequences, Socket.IO rooms, frontend routing, security boundaries, performance controls, failure behavior, deployment, and a realistic scale-out path.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Socket.IO Client, Recharts 3, Leaflet 1.9 |
| Backend | Node.js, Express 5, Socket.IO, Zod |
| Database | MongoDB, Mongoose |
| Security | JWT, rate limiting, strict request validation |
| Testing | Vitest, Supertest, Socket.IO Client |

## Repository structure

```text
client/               React/Vite dashboard
  src/components/     Shared dashboard panels, map, and charts
  src/hooks/          REST + Socket.IO state orchestration
  src/pages/          Overview and operational application screens
  src/services/       Authenticated API client
server/
  scripts/            Simulator and stress-test CLIs
  src/models/         MongoDB telemetry and alert schemas
  src/routes/         REST endpoints
  src/services/       Fleet, anomaly, persistence, metrics, and auth logic
  src/sockets/        Selective real-time gateway
  test/               Unit and integration tests
docs/                 Architecture notes
```

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB running locally or a MongoDB connection string

MongoDB defaults to `mongodb://127.0.0.1:27017/chainpulse`.

## Setup

```bash
git clone git@github.com:ARF9792/ChainPulse.git
cd ChainPulse
npm install
cp server/.env.example server/.env
cp client/.env.example client/.env
```

For anything beyond local development, replace `JWT_SECRET` in `server/.env` with a long random secret and change the demo account password.

### Environment variables

Server:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/chainpulse
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
TELEMETRY_FLUSH_INTERVAL_MS=400
TELEMETRY_MAX_BATCH_SIZE=500
JWT_SECRET=replace-with-a-long-random-secret
DEMO_USER_EMAIL=demo@chainpulse.dev
DEMO_USER_PASSWORD=chainpulse-demo
```

Client:

```dotenv
VITE_API_URL=http://localhost:5000
# Optional map-provider overrides. Keep provider attribution visible.
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
```

Never commit `.env` files or credentials. The repository tracks only `.env.example` templates.

The Live Fleet map uses Leaflet and defaults to the standard OpenStreetMap raster tile endpoint without an API key. This is suitable for a modest local hackathon demo. For a public or higher-traffic deployment, configure a production tile provider or self-hosted tiles with the two optional client variables above, follow that provider's usage policy, and retain the required attribution.

## Run the complete local demo

Start MongoDB first. Then open three terminals from the repository root.

Terminal 1 - API:

```bash
npm start
```

Terminal 2 - dashboard:

```bash
npm run dev:client
```

Terminal 3 - 25-truck simulator:

```bash
npm run simulate -- --trucks=25 --interval=200
```

Open [http://localhost:5173](http://localhost:5173) and use the seeded demo account:

```text
Email: demo@chainpulse.dev
Password: chainpulse-demo
```

The simulator reads the current truck sequences from the API before starting, so it can be stopped and restarted without producing stale sequence numbers.

## Demonstrate an incident

1. Start the API, client, and simulator.
2. Sign in and select a truck.
3. Click **Trigger temperature excursion**.
4. Watch subsequent simulator events show rising temperature and a failed reefer.
5. Observe the fleet and truck status change, the chart rise, and live warning/critical alerts appear.

The demo endpoint is disabled when `NODE_ENV=production`.

## REST API

Dashboard endpoints require `Authorization: Bearer <token>`. Telemetry ingestion and simulator sequence bootstrapping remain available to the simulator.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Obtain an eight-hour demo operator token |
| `GET` | `/api/auth/me` | Validate the current session |
| `POST` | `/api/telemetry` | Ingest one telemetry event |
| `POST` | `/api/telemetry/batch` | Ingest up to 500 events |
| `GET` | `/api/telemetry/sequences` | Bootstrap simulator sequence numbers |
| `GET` | `/api/trucks` | Fleet metadata and latest state |
| `GET` | `/api/trucks/:truckId` | One truck snapshot |
| `GET` | `/api/trucks/:truckId/history` | Bounded chronological history |
| `GET` | `/api/trucks/:truckId/compliance` | Time-weighted cold-chain compliance analytics |
| `GET` | `/api/fleet/summary` | Fleet health counts |
| `GET` | `/api/alerts` | Recent in-session alerts |
| `GET` | `/api/system/metrics` | Actual pipeline counters |
| `POST` | `/api/demo/trucks/:truckId/temperature-excursion` | Activate a 30-second demo failure |

History accepts `minutes`, `from`, `to`, and `limit` parameters. Limits are capped to prevent unbounded datasets.

Compliance analytics accepts `minutes`, `from`, and `to`. It reports minimum, maximum, and average temperature; time and samples outside the safe range; compliance percentage; excursion count and recent excursion durations; and the worst recorded deviation. Analysis is capped at the most recent 50,000 samples, marks truncated responses explicitly, and returns the actual analyzed time span. Telemetry gaps longer than 60 seconds are not fully attributed to the last known sample.

## Socket.IO protocol

Clients connect with the JWT in `handshake.auth.token`.

Client events:

- `subscribe:fleet` / `unsubscribe:fleet`
- `subscribe:truck` / `unsubscribe:truck` with a registered truck ID
- `subscribe:alerts`

Server events:

- `fleet:update` - compact changed-truck states (including current location) plus fleet summary
- `truck:update` - full latest telemetry only for the selected truck room
- `alert:new` - newly detected incident
- `system:metrics` - actual pipeline measurements once per second

The server does not broadcast every raw event to every client.

## Historical + live merge strategy

When a truck is selected, the dashboard:

1. clears the previous truck series;
2. fetches bounded MongoDB history;
3. subscribes to `truck:<truckId>`;
4. merges live and historical points by `eventId`;
5. orders them by timestamp, then sequence;
6. retains only the latest 300 points in browser memory.

Socket listeners are removed on unmount. Reconnection resubscribes to fleet, alerts, and the selected truck without duplicating chart points.

## Batching and performance controls

- Simulator events are sent in batches instead of one request per event.
- Ingestion accepts at most 500 events per batch.
- Persistence buffers events and uses unordered MongoDB `insertMany` writes every 400 ms or at 500 buffered events.
- `eventId` has a unique index; duplicate-key writes are handled without failing the whole batch.
- `truckId + timestamp` is indexed for historical retrieval.
- The Socket.IO scheduler broadcasts at about 6-7 visual updates per second and coalesces intermediate states per truck.
- The client stores at most 300 chart points.

## Stress testing

With the API and MongoDB running:

```bash
npm run stress -- --trucks=25 --rate=5000 --duration=5 --batch-size=500
```

Supported options:

- `--trucks` - 1 to 25 registered trucks
- `--rate` - target 1 to 20,000 events/second
- `--duration` - 1 to 300 seconds
- `--batch-size` - 1 to 500 events
- `--backend-url` - API base URL

Measured local development result on 13 November 2026:

```text
Generated: 25,000
Accepted: 25,000
Rejected: 0
Failed requests: 0
Duration: 4.999 seconds
Achieved throughput: 5,000.7 events/second
MongoDB persisted: 25,000
Average ingestion-to-broadcast latency: 56.68 ms
```

These numbers describe one local run and are not a general production guarantee. Re-run the command in the target environment for comparable results.

## Tests and production build

```bash
npm test
npm run build
npm audit
```

The backend suite covers health, validation, ingestion, stale sequences, fleet state, persistence batching and deduplication, simulator behavior, anomaly cooldowns, selective two-client Socket.IO delivery, JWT protection, and metrics.

## Known limitations

- The fleet catalog is a fixed 25-truck hackathon dataset rather than an administration workflow.
- Authentication uses one seeded demo operator instead of persistent users, password reset, or organizations.
- Recent alert retrieval is session-backed for dashboard simplicity, though new alerts are also persisted to MongoDB.
- Demo incidents are stored in memory and reset when the API restarts.
- Deployment configuration, TLS termination, and production secret management remain environment-specific.
- Advanced role management and production identity workflows remain future work.

## Attribution

Celsyn uses open-source packages listed in `package.json`, including React, Vite, Leaflet, Express, MongoDB/Mongoose, Socket.IO, Zod, Recharts, JSON Web Token, Vitest, and Supertest. The default map tiles are © OpenStreetMap contributors, with attribution displayed in the map.

