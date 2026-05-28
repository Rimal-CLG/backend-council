import { Context } from '../interfaces/context.interface';

export class ContextBuilder {
  static build(payload: Partial<Context>): Context {
    return {
      framework: payload.framework,
      database: payload.database,
      orm: payload.orm,
      error: payload.error,
      logs: payload.logs,
      stackTrace: payload.stackTrace,
      code: payload.code,
    };
  }
}
