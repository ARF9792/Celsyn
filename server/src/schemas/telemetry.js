import { z } from "zod";

export const telemetrySchema = z.strictObject({
  eventId: z.uuid(),
  sequence: z.int().nonnegative(),
  truckId: z.string().regex(/^TRK-\d{3}$/, "Expected truck ID such as TRK-001"),
  timestamp: z.iso.datetime({ offset: true }),
  location: z.strictObject({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  temperature: z.number().min(-80).max(80),
  humidity: z.number().min(0).max(100),
  speed: z.number().min(0).max(200),
  fuel: z.number().min(0).max(100),
  doorOpen: z.boolean(),
  reefer: z.strictObject({
    status: z.enum(["running", "standby", "failed"]),
    power: z.number().min(0).max(100),
  }),
});

export const telemetryBatchSchema = z.array(z.unknown()).min(1).max(500);

export const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));

