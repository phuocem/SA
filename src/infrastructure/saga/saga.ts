export type SagaAction<TCtx> = (ctx: TCtx) => Promise<void> | void;
export type SagaCompensation<TCtx> = (ctx: TCtx, error: unknown) => Promise<void> | void;

export interface SagaStep<TCtx> {
  name: string;
  action: SagaAction<TCtx>;
  compensate?: SagaCompensation<TCtx>;
}

export interface SagaResult<TCtx> {
  success: boolean;
  error?: unknown;
  executed: string[];
  compensated: string[];
  context: TCtx;
}

export class Saga<TCtx> {
  private readonly steps: SagaStep<TCtx>[];

  constructor(steps: SagaStep<TCtx>[]) {
    this.steps = steps;
  }

  async run(ctx: TCtx): Promise<SagaResult<TCtx>> {
    const executed: SagaStep<TCtx>[] = [];
    const compensated: string[] = [];

    try {
      for (const step of this.steps) {
        await step.action(ctx);
        executed.push(step);
      }

      return {
        success: true,
        executed: executed.map((s) => s.name),
        compensated,
        context: ctx,
      };
    } catch (error) {
      for (const step of executed.reverse()) {
        if (step.compensate) {
          try {
            await step.compensate(ctx, error);
            compensated.push(step.name);
          } catch {
            compensated.push(`${step.name} (compensate failed)`);
          }
        }
      }

      return {
        success: false,
        error,
        executed: executed.map((s) => s.name),
        compensated,
        context: ctx,
      };
    }
  }
}
