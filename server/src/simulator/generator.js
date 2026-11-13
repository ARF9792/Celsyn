import { randomUUID } from "node:crypto";

const cityCoordinates = {
  Mumbai: [19.076, 72.8777],
  Pune: [18.5204, 73.8567],
  Delhi: [28.6139, 77.209],
  Jaipur: [26.9124, 75.7873],
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Hyderabad: [17.385, 78.4867],
  Vijayawada: [16.5062, 80.648],
  Kolkata: [22.5726, 88.3639],
  Bhubaneswar: [20.2961, 85.8245],
  Ahmedabad: [23.0225, 72.5714],
  Surat: [21.1702, 72.8311],
  Lucknow: [26.8467, 80.9462],
  Kanpur: [26.4499, 80.3319],
  Chandigarh: [30.7333, 76.7794],
  Kochi: [9.9312, 76.2673],
  Coimbatore: [11.0168, 76.9558],
  Nagpur: [21.1458, 79.0882],
  Raipur: [21.2514, 81.6296],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const drift = (value, change, min, max, random) =>
  clamp(value + (random() - 0.5) * change, min, max);
const round = (value, precision = 2) => Number(value.toFixed(precision));

export const createTruckSimulator = (truck, options = {}) => {
  const random = options.random || Math.random;
  const anomalyRate = options.anomalyRate ?? 0.002;
  const start = cityCoordinates[truck.route.origin] || [20.5937, 78.9629];
  const end = cityCoordinates[truck.route.destination] || start;
  const safeMidpoint = (truck.safeTemperature.min + truck.safeTemperature.max) / 2;

  const state = {
    sequence: options.initialSequence || 0,
    temperature: safeMidpoint,
    humidity: 64 + random() * 8,
    speed: 45 + random() * 20,
    fuel: 75 + random() * 20,
    reeferPower: 72 + random() * 20,
    progress: random() * 0.35,
    anomalyTicks: 0,
  };

  return {
    next(timestamp = new Date()) {
      if (state.anomalyTicks === 0 && random() < anomalyRate) {
        state.anomalyTicks = 20;
      }

      const hasReeferFailure = state.anomalyTicks > 0;
      state.anomalyTicks = Math.max(0, state.anomalyTicks - 1);
      state.sequence += 1;
      state.progress = (state.progress + 0.0008 + random() * 0.0012) % 1;
      state.speed = drift(state.speed, 8, 20, 85, random);
      state.humidity = drift(state.humidity, 2.5, 45, 88, random);
      state.fuel = clamp(state.fuel - 0.004 - random() * 0.008, 0, 100);

      if (hasReeferFailure) {
        state.temperature += 0.28 + random() * 0.18;
        state.reeferPower = drift(state.reeferPower, 8, 0, 35, random);
      } else {
        state.temperature += (safeMidpoint - state.temperature) * 0.2;
        state.temperature = drift(state.temperature, 0.18, safeMidpoint - 0.5, safeMidpoint + 0.5, random);
        state.reeferPower = drift(state.reeferPower, 5, 60, 100, random);
      }

      const lat = start[0] + (end[0] - start[0]) * state.progress;
      const lng = start[1] + (end[1] - start[1]) * state.progress;

      return {
        eventId: randomUUID(),
        sequence: state.sequence,
        truckId: truck.truckId,
        timestamp: timestamp.toISOString(),
        location: { lat: round(lat, 6), lng: round(lng, 6) },
        temperature: round(state.temperature),
        humidity: round(state.humidity),
        speed: round(state.speed),
        fuel: round(state.fuel),
        doorOpen: random() < 0.001,
        reefer: {
          status: hasReeferFailure ? "failed" : "running",
          power: round(state.reeferPower),
        },
      };
    },
  };
};

