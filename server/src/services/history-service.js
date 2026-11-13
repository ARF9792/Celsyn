import { TelemetryEvent } from "../models/TelemetryEvent.js";

export const getTruckHistory = async (truckId, options) => {
  const query = {
    truckId,
    timestamp: {
      $gte: options.from,
      $lte: options.to,
    },
  };

  return TelemetryEvent.find(query)
    .sort({ timestamp: 1, sequence: 1 })
    .limit(options.limit)
    .lean()
    .exec();
};

