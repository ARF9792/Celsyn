import { beforeEach, describe, expect, it } from "vitest";
import { pipelineMetrics } from "../src/services/pipeline-metrics.js";

describe("pipeline metrics", () => {
  beforeEach(() => pipelineMetrics.reset());

  it("calculates a one-second accepted event rate from real timestamps", () => {
    pipelineMetrics.recordReceived(3);
    pipelineMetrics.recordAccepted(2, 10_000);
    pipelineMetrics.recordRejected(1);

    expect(pipelineMetrics.getSnapshot(10_500)).toMatchObject({
      eventsReceivedTotal: 3,
      currentEventsPerSecond: 2,
      validEvents: 2,
      rejectedEvents: 1,
    });

    expect(pipelineMetrics.getSnapshot(11_100).currentEventsPerSecond).toBe(0);
  });
});

