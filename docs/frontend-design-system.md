# ChainPulse frontend design system

## Direction

ChainPulse uses a **refrigeration control-room** visual direction: bright operational surfaces, graphite structure, cobalt navigation and action, and semantic safety colours reserved for fleet state. The interface is designed for quick scanning during an active monitoring shift rather than for decorative presentation.

The direction was dealt with Taste Skill 2.5.1 using its `software` / `saas` route:

- Palette: `white-link-blue` — white ground, neutral surface and cobalt action.
- Type pairing: Instrument Sans with DM Mono for telemetry values.
- Radius: soft — 8px controls, 12px panels and 20px primary operational surfaces.

## Tokens

Shared tokens live in `client/src/styles/tokens.css`.

- Typography: Instrument Sans for interface text; DM Mono for IDs, measurements and timestamps.
- Canvas: `#f5f6f8`; surfaces: white and `#f0f2f5`; primary ink: `#111318`.
- Action: cobalt `#1a4be0`.
- Healthy: green; warning: amber; critical: red; offline: neutral grey.
- Spacing: 4, 8, 12, 16, 24, 32, 48 and 64px.
- Motion: 120–180ms interface transitions with one restrained live-connection pulse. Reduced-motion preferences stop non-essential motion.

Semantic colours must not be used decoratively. Red always means critical, amber always means operator review, and green always means within limits or connected.

## Shared application shell

- A graphite desktop sidebar keeps product navigation visually separate from operational data.
- The active route uses a cobalt indicator and a single Lucide icon family.
- The top bar provides route context and the actual Socket.IO connection state.
- At tablet and phone widths the sidebar becomes an accessible drawer with `aria-expanded`, a backdrop and 44px controls.
- A keyboard skip link targets the dashboard content.

## Component rules

### Operational panels

Panels use one white surface, one neutral border and no gradient. Nested content uses the subtle surface token rather than another bordered card. Panel headings use a sentence-case context line, a direct noun heading and at most one action.

### Metrics

Metrics combine a restrained icon, a live value and its unit or meaning. Telemetry values use DM Mono. Safety counts do not share equal visual weight with throughput metrics: the fleet-posture component owns the primary hierarchy.

### Status

Status pills use both text and colour. Fleet distribution repeats the same semantics in a proportional bar. Connection status includes readable text on desktop and an accessible status role at every width.

### Tables

Rows are 48px high, keyboard selectable and retain a visible focus state. IDs and timestamps use DM Mono. Overview queues are sorted critical, warning, offline and healthy; the complete Fleet route remains the source for all vehicles.

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

## Future screens

The shared tokens and shell are ready for later screen-specific work. Fleet should emphasize geography and vehicle selection; truck details should emphasize safe range and history; incidents should emphasize triage; compliance should emphasize time in range; system health should emphasize ingestion-to-persistence flow. Their current structure remains intentionally unchanged until each receives its own redesign pass.
