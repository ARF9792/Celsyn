import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    alertId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: [
        "TEMPERATURE_WARNING",
        "TEMPERATURE_CRITICAL",
        "REEFER_FAILURE",
        "DOOR_OPEN_WHILE_MOVING",
        "LOW_FUEL",
      ],
      required: true,
    },
    severity: { type: String, enum: ["warning", "critical"], required: true },
    truckId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    message: { type: String, required: true },
    sourceEventId: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { versionKey: false, timestamps: { createdAt: true, updatedAt: false } },
);

alertSchema.index({ truckId: 1, timestamp: -1 });
alertSchema.index({ severity: 1, timestamp: -1 });

export const Alert = mongoose.model("Alert", alertSchema);

