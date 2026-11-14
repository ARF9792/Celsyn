# ChainPulse architecture notes

## Telemetry event contract

Each event contains a globally unique `eventId`, per-truck increasing `sequence`, registered `truckId`, ISO timestamp, latitude/longitude, temperature, humidity, speed, fuel, door state, and reefer status/power.

Zod validates bounds and rejects unknown fields before processing. The service then rejects unregistered trucks and stale or repeated sequence numbers.

## Processing path

1. The simulator batches realistic stateful events.
2. Express counts the attempted events and validates each payload.
3. Accepted events update the latest-state Map.
4. The event is queued for unordered MongoDB batch persistence.
5. Deterministic rules evaluate the latest state and emit new incidents.
6. A Socket.IO scheduler retains the newest pending state per truck.
7. Every 150 ms, changed states are emitted only to subscribed rooms.

This path separates durable event capture from visualization frequency.

## Data model and indexes

`TelemetryEvent` uses:

- unique `eventId` index for idempotency;
- `{ truckId: 1, timestamp: 1 }` index for chronological truck history.

`Alert` uses truck/timestamp and severity/timestamp indexes.

The persistence buffer flushes every 400 ms or at 500 events. `insertMany(..., { ordered: false })` lets valid documents persist even when a duplicate event is encountered.

## Incident rules

| Rule | Severity |
| --- | --- |
| Slightly outside cargo-safe temperature range | Warning |
| At least 3°C outside safe range | Critical |
| Reefer status `failed` | Critical |
| Door open while speed is above 10 km/h | Warning |
| Fuel below 15% | Warning |

An incident key combines truck and alert type. An ongoing condition emits once and then respects a 60-second cooldown; recovery clears the incident so a future recurrence can alert immediately.

## Socket.IO rooms

| Room | Payload |
| --- | --- |
| `fleet` | Fleet summary and compact states, including current location, for changed trucks |
| `truck:<truckId>` | Full latest event for that truck |
| `alerts` | Newly detected alert |

Truck subscriptions validate the ID against the registered fleet. JWT authentication occurs during the Socket.IO handshake.

The Live Fleet map initializes its marker set from the authenticated fleet snapshot, then updates marker coordinates in place from compact `fleet:update` messages. Map, table, and detail-panel selection share one selected truck ID; filtering changes marker visibility without replacing the live fleet state.

## Metrics

Metrics are derived from live counters rather than generated display values:

- total received, valid, and rejected events;
- accepted events observed in the most recent one-second window;
- connected Socket.IO clients;
- total and per-second broadcast calls;
- persistence buffer depth, persisted documents, and duplicate events;
- events coalesced before visualization;
- average time from server receipt to scheduled broadcast.

## Graceful shutdown

On `SIGINT` or `SIGTERM`, the server stops accepting connections, disconnects sockets, drains the persistence buffer, closes MongoDB, and exits. This minimizes lost telemetry during a normal shutdown.

