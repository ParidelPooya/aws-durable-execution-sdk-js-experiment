import type { DurableLambdaHandler } from "@aws/durable-execution-sdk-js";
export interface BrowserTestResult<T = any> {
  getResult(): T;
  getOperations(): any[];
}
export declare class BrowserDurableTestRunner<T = any> {
  private handler;
  constructor(params: { handlerFunction: DurableLambdaHandler });
  static setupTestEnvironment(params?: { skipTime?: boolean }): Promise<void>;
  run(params?: any): Promise<BrowserTestResult<T>>;
}
