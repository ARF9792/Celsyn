import { TelemetryEvent } from "../models/TelemetryEvent.js";

const MAX_ANALYTICS_SAMPLES = 50_000;
const MAX_SAMPLE_GAP_MS = 60_000;
const MAX_RETURNED_EXCURSIONS = 50;

const round = (value, digits = 2) => Number(value.toFixed(digits));

const getDeviation = (temperature, safeRange) => {
  if (temperature < safeRange.min) {
    return { amount: safeRange.min - temperature, direction: "below" };
  }
  if (temperature > safeRange.max) {
    return { amount: temperature - safeRange.max, direction: "above" };
  }
  return { amount: 0, direction: "in-range" };
};

const closeExcursion = (excursion, endTimestamp, ongoing = false) => ({
  ...excursion,
  endTimestamp: new Date(endTimestamp).toISOString(),
  durationMs: Math.round(excursion.durationMs),
  maximumDeviation: round(excursion.maximumDeviation),
  minimumTemperature: round(excursion.minimumTemperature),
  maximumTemperature: round(excursion.maximumTemperature),
  severity: excursion.maximumDeviation >= 3 ? "critical" : "warning",
  ongoing,
});

export const calculateComplianceAnalytics = (events, truck, options) => {
  const safeRange = truck.safeTemperature;
  const fromMs = options.from.getTime();
  const toMs = options.to.getTime();
  const orderedEvents = [...events].sort((left, right) => (
    new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    || left.sequence - right.sequence
  ));

  if (orderedEvents.length === 0) {
    return {
      sampleCount: 0,
      compliantSamples: 0,
      outOfRangeSamples: 0,
      observedDurationMs: 0,
      compliantDurationMs: 0,
      outOfRangeDurationMs: 0,
      compliancePercentage: null,
      excursionCount: 0,
      excursions: [],
      excursionsTruncated: false,
      temperature: {
        safeRange,
        minimum: null,
        maximum: null,
        average: null,
        worstDeviation: null,
      },
    };
  }

  let temperatureTotal = 0;
  let minimumTemperature = Number.POSITIVE_INFINITY;
  let maximumTemperature = Number.NEGATIVE_INFINITY;
  let compliantSamples = 0;
  let observedDurationMs = 0;
  let outOfRangeDurationMs = 0;
  let worstDeviation = null;
  let activeExcursion = null;
  const excursions = [];

  orderedEvents.forEach((event, index) => {
    const timestampMs = new Date(event.timestamp).getTime();
    const nextTimestampMs = index + 1 < orderedEvents.length
      ? new Date(orderedEvents[index + 1].timestamp).getTime()
      : toMs;
    const intervalEndMs = Math.min(nextTimestampMs, timestampMs + MAX_SAMPLE_GAP_MS, toMs);
    const intervalStartMs = Math.max(timestampMs, fromMs);
    const intervalMs = Math.max(0, intervalEndMs - intervalStartMs);
    const deviation = getDeviation(event.temperature, safeRange);
    const compliant = deviation.amount === 0;

    temperatureTotal += event.temperature;
    minimumTemperature = Math.min(minimumTemperature, event.temperature);
    maximumTemperature = Math.max(maximumTemperature, event.temperature);
    observedDurationMs += intervalMs;

    if (compliant) {
      compliantSamples += 1;
      if (activeExcursion) {
        excursions.push(closeExcursion(activeExcursion, event.timestamp));
        activeExcursion = null;
      }
      return;
    }

    outOfRangeDurationMs += intervalMs;
    if (!worstDeviation || deviation.amount > worstDeviation.amount) {
      worstDeviation = {
        amount: deviation.amount,
        direction: deviation.direction,
        temperature: event.temperature,
        timestamp: new Date(event.timestamp).toISOString(),
        eventId: event.eventId,
      };
    }

    if (!activeExcursion) {
      activeExcursion = {
        startTimestamp: new Date(event.timestamp).toISOString(),
        durationMs: 0,
        sampleCount: 0,
        maximumDeviation: 0,
        minimumTemperature: event.temperature,
        maximumTemperature: event.temperature,
        directions: [],
      };
    }

    activeExcursion.durationMs += intervalMs;
    activeExcursion.sampleCount += 1;
    activeExcursion.maximumDeviation = Math.max(activeExcursion.maximumDeviation, deviation.amount);
    activeExcursion.minimumTemperature = Math.min(activeExcursion.minimumTemperature, event.temperature);
    activeExcursion.maximumTemperature = Math.max(activeExcursion.maximumTemperature, event.temperature);
    if (!activeExcursion.directions.includes(deviation.direction)) {
      activeExcursion.directions.push(deviation.direction);
    }
  });

  if (activeExcursion) {
    excursions.push(closeExcursion(activeExcursion, toMs, true));
  }

  const outOfRangeSamples = orderedEvents.length - compliantSamples;
  const compliancePercentage = observedDurationMs > 0
    ? ((observedDurationMs - outOfRangeDurationMs) / observedDurationMs) * 100
    : (compliantSamples / orderedEvents.length) * 100;
  const returnedExcursions = excursions.slice(-MAX_RETURNED_EXCURSIONS).reverse();

  return {
    sampleCount: orderedEvents.length,
    compliantSamples,
    outOfRangeSamples,
    observedDurationMs: Math.round(observedDurationMs),
    compliantDurationMs: Math.round(observedDurationMs - outOfRangeDurationMs),
    outOfRangeDurationMs: Math.round(outOfRangeDurationMs),
    compliancePercentage: round(compliancePercentage),
    excursionCount: excursions.length,
    excursions: returnedExcursions,
    excursionsTruncated: excursions.length > returnedExcursions.length,
    temperature: {
      safeRange,
      minimum: round(minimumTemperature),
      maximum: round(maximumTemperature),
      average: round(temperatureTotal / orderedEvents.length),
      worstDeviation: worstDeviation
        ? { ...worstDeviation, amount: round(worstDeviation.amount) }
        : null,
    },
  };
};

export const getTruckComplianceAnalytics = async (truck, options) => {
  const events = await TelemetryEvent.find({
    truckId: truck.truckId,
    timestamp: { $gte: options.from, $lte: options.to },
  })
    .sort({ timestamp: -1, sequence: -1 })
    .select({ _id: 0, eventId: 1, sequence: 1, timestamp: 1, temperature: 1 })
    .limit(MAX_ANALYTICS_SAMPLES + 1)
    .lean()
    .exec();

  const truncated = events.length > MAX_ANALYTICS_SAMPLES;
  const analyzedEvents = truncated ? events.slice(0, MAX_ANALYTICS_SAMPLES) : events;
  const analytics = calculateComplianceAnalytics(analyzedEvents, truck, options);
  const newestAnalyzedEvent = analyzedEvents[0];
  const oldestAnalyzedEvent = analyzedEvents.at(-1);

  return {
    ...analytics,
    truncated,
    analyzedFrom: oldestAnalyzedEvent
      ? new Date(oldestAnalyzedEvent.timestamp).toISOString()
      : null,
    analyzedTo: newestAnalyzedEvent
      ? new Date(newestAnalyzedEvent.timestamp).toISOString()
      : null,
    maximumSamples: MAX_ANALYTICS_SAMPLES,
    maximumAttributedSampleGapMs: MAX_SAMPLE_GAP_MS,
  };
};

