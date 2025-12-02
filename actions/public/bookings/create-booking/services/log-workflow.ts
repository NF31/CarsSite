interface LogWorkflowParams {
  step: string;
  bookingId?: string;
  reference?: string;
  data?: Record<string, unknown>;
}

export function logWorkflowStep({ step, bookingId, reference, data }: LogWorkflowParams): void {
  console.log(`[📋 WORKFLOW ${step}]`, {
    ...(bookingId && { bookingId }),
    ...(reference && { reference }),
    ...(data || {}),
    timestamp: new Date().toISOString(),
    workflowStep: step,
  });
}

