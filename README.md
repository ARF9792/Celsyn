# ChainPulse

ChainPulse is a real-time cold-chain fleet telemetry platform built for the MERNIFY Hackathon. It ingests simulated refrigerated-truck telemetry, maintains live fleet state, stores historical events in MongoDB, and streams selective updates to a React dashboard with Socket.IO.

## Development status

The project is being built incrementally. The initial scaffold includes a runnable Express API and React/Vite client.

## Quick start

```bash
npm install
cp server/.env.example server/.env
npm run dev
```

- Client: http://localhost:5173
- API health check: http://localhost:5000/api/health

Detailed setup and architecture documentation will be added as the telemetry pipeline is implemented.

