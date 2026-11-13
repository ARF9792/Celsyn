import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, getAccessToken } from "../services/api.js";
import { mergeTelemetryPoints } from "../utils/telemetry.js";

const mergeAlert = (alerts, alert) => {
  if (alerts.some((existing) => existing.alertId === alert.alertId)) return alerts;
  return [alert, ...alerts].slice(0, 30);
};

export const useDashboardData = () => {
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [trucks, setTrucks] = useState([]);
  const [summary, setSummary] = useState({
    totalTrucks: 0,
    onlineTrucks: 0,
    healthyTrucks: 0,
    warningTrucks: 0,
    criticalTrucks: 0,
  });
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [series, setSeries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [demoPending, setDemoPending] = useState(false);
  const socketRef = useRef(null);
  const selectedTruckRef = useRef(null);
  const previousTruckRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getTrucks(),
      api.getFleetSummary(),
      api.getAlerts(),
      api.getMetrics(),
    ])
      .then(([truckPayload, summaryPayload, alertPayload, metricsPayload]) => {
        if (!active) return;
        setTrucks(truckPayload.trucks);
        setSummary(summaryPayload.summary);
        setAlerts(alertPayload.alerts);
        setMetrics(metricsPayload.metrics);
        setSelectedTruckId((current) => current || truckPayload.trucks[0]?.truckId || null);
      })
      .catch((initialError) => {
        if (active) setError(initialError.message);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const socket = io(api.url, {
      autoConnect: true,
      auth: { token: getAccessToken() },
    });
    socketRef.current = socket;

    const onConnect = () => {
      setConnectionStatus("connected");
      setError("");
      socket.emit("subscribe:fleet");
      socket.emit("subscribe:alerts");
      if (selectedTruckRef.current) socket.emit("subscribe:truck", selectedTruckRef.current);
    };
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onReconnectAttempt = () => setConnectionStatus("reconnecting");
    const onConnectError = (socketError) => {
      setConnectionStatus("reconnecting");
      setError(`Live connection: ${socketError.message}`);
    };
    const onFleetUpdate = (payload) => {
      setSummary(payload.summary);
      const changesById = new Map(payload.changedTrucks.map((truck) => [truck.truckId, truck]));
      setTrucks((current) => current.map((truck) => {
        const change = changesById.get(truck.truckId);
        if (!change) return truck;
        return {
          ...truck,
          online: true,
          status: change.status,
          latestTelemetry: { ...truck.latestTelemetry, ...change },
        };
      }));
    };
    const onTruckUpdate = (telemetry) => {
      if (telemetry.truckId !== selectedTruckRef.current) return;
      setSeries((current) => mergeTelemetryPoints(current, [telemetry]));
      setTrucks((current) => current.map((truck) => (
        truck.truckId === telemetry.truckId
          ? { ...truck, online: true, status: telemetry.status, latestTelemetry: telemetry }
          : truck
      )));
    };
    const onAlert = (alert) => setAlerts((current) => mergeAlert(current, alert));

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("fleet:update", onFleetUpdate);
    socket.on("truck:update", onTruckUpdate);
    socket.on("alert:new", onAlert);
    socket.on("system:metrics", setMetrics);

    return () => {
      socket.off();
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectedTruckRef.current = selectedTruckId;
    if (!selectedTruckId) return undefined;

    const socket = socketRef.current;
    if (previousTruckRef.current && previousTruckRef.current !== selectedTruckId) {
      socket?.emit("unsubscribe:truck", previousTruckRef.current);
    }
    socket?.emit("subscribe:truck", selectedTruckId);
    previousTruckRef.current = selectedTruckId;

    let active = true;
    setSeries([]);
    setHistoryLoading(true);
    api.getTruckHistory(selectedTruckId)
      .then((payload) => {
        if (active && selectedTruckRef.current === selectedTruckId) {
          setSeries((livePoints) => mergeTelemetryPoints(payload.events, livePoints));
        }
      })
      .catch((historyError) => {
        if (active) setError(historyError.message);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => { active = false; };
  }, [selectedTruckId]);

  const triggerExcursion = async () => {
    if (!selectedTruckId || demoPending) return;
    setDemoPending(true);
    setError("");
    try {
      await api.triggerExcursion(selectedTruckId);
    } catch (demoError) {
      setError(demoError.message);
    } finally {
      setDemoPending(false);
    }
  };

  return {
    connectionStatus,
    trucks,
    summary,
    metrics,
    alerts,
    selectedTruckId,
    selectedTruck: trucks.find((truck) => truck.truckId === selectedTruckId) || null,
    selectTruck: setSelectedTruckId,
    series,
    historyLoading,
    error,
    demoPending,
    triggerExcursion,
  };
};

