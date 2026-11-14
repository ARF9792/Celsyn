# Celsyn frontend design system

## Direction

Celsyn uses a **precision control-room** visual direction derived from the supplied Origyn product reference: near-black canvas, charcoal operational surfaces, fine neutral borders, compact typography, and restrained status colour reserved for fleet state. The interface is designed for quick scanning during an active monitoring shift rather than for decorative presentation.

The existing application structure remains unchanged while the shared visual system follows these rules:

- Palette: graphite-black canvas, charcoal surfaces, neutral text and a muted steel-blue selection accent.
- Type pairing: Manrope for display headings, Inter for interface text and JetBrains Mono for telemetry values.
- Radius: compact — 6px controls and 9px operational panels.
- Surfaces: flat and precise, without gradients, glow, glassmorphism, purple or neon treatments.

## Tokens

Shared tokens live in `client/src/styles/tokens.css`.

- Typography: Manrope for display headings; Inter for interface text; JetBrains Mono for IDs, measurements and timestamps.
- Canvas: `#0b0c0d`; surfaces: `#111214` and `#17181a`; primary ink: `#ededee`.
- Action: neutral light `#e8e8eb`; selection and focus: muted steel-blue `#859cd0`.
- Healthy: green; warning: amber; critical: red; offline: neutral grey.
- Spacing: 4, 8, 12, 16, 24, 32, 48 and 64px.
- Motion: 120–180ms interface transitions. Live state is communicated without glow or distracting animation.

Semantic colours must not be used decoratively. Red always means critical, amber always means operator review, and green always means within limits or connected.

## Shared application shell

- A charcoal desktop sidebar keeps product navigation visually separate from operational data.
- The active route uses a muted steel-blue indicator, a raised neutral surface and a single Lucide icon family.
- The top bar provides route context and the actual Socket.IO connection state.
- At tablet and phone widths the sidebar becomes an accessible drawer with `aria-expanded`, a backdrop and 44px controls.
- A keyboard skip link targets the dashboard content.

## Component rules

### Operational panels

Panels use one charcoal surface, one fine neutral border and no gradient. Nested content uses the raised surface token rather than another bordered card. Panel headings use a sentence-case context line, a direct noun heading and at most one action.

### Metrics

Metrics combine a restrained icon, a live value and its unit or meaning. Telemetry values use JetBrains Mono. Safety counts do not share equal visual weight with throughput metrics: the fleet-posture component owns the primary hierarchy.

### Status

Status pills use both text and colour. Fleet distribution repeats the same semantics in a proportional bar. Connection status includes readable text on desktop and an accessible status role at every width.

### Tables

Rows are 48px high, keyboard selectable and retain a visible focus state. IDs and timestamps use JetBrains Mono. Overview queues are sorted critical, warning, offline and healthy; the complete Fleet route remains the source for all vehicles.

### Incidents

Incident items show a type-specific icon, severity treatment, vehicle ID and real timestamp. The Overview shows only the newest incidents and links to the Incident Center for the complete stream.

### States

- Loading: neutral panel copy that names the operation in progress.
- Empty: plain copy inside the component, without invented success claims.
- Error: red semantic surface with `role="alert"`.
- Disabled: reduced opacity while preserving readable contrast.

## Overview information hierarchy

The Overview answers: **Is the refrigerated fleet operating safely right now, and which vehicles require immediate attention?**

1. Fleet posture: the strongest current safety state, affected counts and reporting coverage.
2. Vehicle attention queue: critical and warning vehicles before healthy ones.
3. Incoming incidents: the newest real alerts with severity and time.
4. Supporting operations metrics: reporting availability, event rate, broadcast latency and persistence queue.

No static business claims or mock telemetry are introduced. Every value continues to come from the existing REST and Socket.IO data flow.

## Live Fleet information hierarchy

The Live Fleet screen treats geography as the primary operational surface and keeps one synchronized vehicle selection across the map, directory, and telemetry panel.

1. Search and status controls narrow the current live fleet without replacing or freezing incoming telemetry.
2. The map displays backend coordinates, status-coloured markers, navigation controls, visible-provider attribution, and explicit loading, empty, and error states.
3. The selected-asset panel presents the cargo-safe range beside current temperature, then humidity, speed, fuel, door, reefer, position, and update time.
4. The directory remains the complete scannable fleet record and highlights the selected row.
5. The historical + live chart uses a numeric Celsius axis and a quiet safe-range band.

On desktop, the selected asset sits beside the map. Tablet and phone layouts stack the same sequence without changing the selection model. The selected asset links directly to its dedicated truck record.

## Operational detail screens

### Truck record

The route `/app/fleet/:truckId` preserves the current live selection while adding a durable record view. The asset identity, status and route lead the page; eight current measurements follow; then actual stored/live temperature history, 60-minute compliance and truck-specific detection events provide operational context. Unknown truck IDs receive a bounded empty state instead of breaking the shell.

### Incident center

The incident center is a triage workspace rather than a static alert feed. It keeps the most recent 100 real detection events, supports text, severity, type and truck filters, and synchronizes a selectable queue with a detailed event panel. Actions lead to the associated truck record or locate the vehicle in Live Fleet. The interface explicitly states that acknowledgement and resolution are not stored, rather than inventing unsupported workflow states.

### Compliance

Compliance uses stored telemetry from the existing API. Operators can select any truck and a 60-minute, 6-hour or 24-hour window. The page shows the actual analyzed interval, time in range, excursion duration and count, temperature extrema, sample gaps and the newest excursions. Truncation and empty responses remain visible.

### System health

System health presents the real ingestion-to-client path: accepted rate, broadcast activity and latency, persistence queue, connected clients, cumulative processing counters and a rolling one-minute browser view of incoming system metrics. Health wording is derived only from rejection, drop and queue signals already exposed by the backend.

### Authentication and route states

The sign-in page uses the same graphite, neutral and operational typography system while retaining the existing JWT flow and demo credentials. The application also includes a shell-consistent not-found state for unknown authenticated routes.

## Remaining frontend scope

The marketing landing page is intentionally excluded. All authenticated navigation destinations now have a dedicated, responsive operational experience; future work should focus on usability findings and demo rehearsal rather than adding unsupported product scope.
