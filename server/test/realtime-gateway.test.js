import { createServer } from "node:http";
import { io as createClient } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";
import { RealtimeGateway } from "../src/sockets/realtime-gateway.js";
import { createTelemetry } from "./fixtures/telemetry.js";
import { createAccessToken } from "../src/services/auth-service.js";

const openClient = (url) => new Promise((resolve, reject) => {
  const client = createClient(url, {
    transports: ["websocket"],
    auth: { token: createAccessToken() },
  });
  client.once("connect", () => resolve(client));
  client.once("connect_error", reject);
});

const subscribe = (client, event, payload) => new Promise((resolve) => {
  const argumentsList = payload === undefined ? [event] : [event, payload];
  client.emit(...argumentsList, resolve);
});

describe("selective Socket.IO broadcasting", () => {
  const resources = [];

  afterEach(async () => {
    for (const resource of resources.splice(0)) {
      resource.clientA?.disconnect();
      resource.clientB?.disconnect();
      resource.gateway.stop();
      await new Promise((resolve) => resource.server.close(resolve));
    }
  });

  it("sends truck updates only to clients in the relevant room", async () => {
    const server = createServer();
    const gateway = new RealtimeGateway(server, { broadcastIntervalMs: 20 });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const url = `http://127.0.0.1:${address.port}`;
    const clientA = await openClient(url);
    const clientB = await openClient(url);
    resources.push({ server, gateway, clientA, clientB });

    expect(await subscribe(clientA, "subscribe:truck", "TRK-001")).toMatchObject({ ok: true });
    expect(await subscribe(clientB, "subscribe:truck", "TRK-002")).toMatchObject({ ok: true });

    const receivedByA = new Promise((resolve) => clientA.once("truck:update", resolve));
    let receivedByB = false;
    clientB.once("truck:update", () => { receivedByB = true; });

    gateway.queueTelemetry({
      ...createTelemetry({ truckId: "TRK-001" }),
      status: "healthy",
      receivedAt: new Date().toISOString(),
    });

    const update = await receivedByA;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(update.truckId).toBe("TRK-001");
    expect(receivedByB).toBe(false);
    expect(gateway.getStats().connectedClients).toBe(2);
  });

  it("rejects subscriptions for unknown trucks", async () => {
    const server = createServer();
    const gateway = new RealtimeGateway(server, { broadcastIntervalMs: 20 });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const clientA = await openClient(`http://127.0.0.1:${address.port}`);
    resources.push({ server, gateway, clientA });

    expect(await subscribe(clientA, "subscribe:truck", "TRK-999")).toEqual({
      ok: false,
      error: "Unknown truck ID",
    });
  });
});

