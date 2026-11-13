import mongoose from "mongoose";

const telemetryEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    sequence: { type: Number, required: true, min: 0 },
    truckId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    speed: { type: Number, required: true },
    fuel: { type: Number, required: true },
    doorOpen: { type: Boolean, required: true },
    reefer: {
      status: { type: String, enum: ["running", "standby", "failed"], required: true },
      power: { type: Number, required: true },
    },
    receivedAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: true, updatedAt: false },
  },
);

telemetryEventSchema.index({ truckId: 1, timestamp: 1 });

export const TelemetryEvent = mongoose.model("TelemetryEvent", telemetryEventSchema);

