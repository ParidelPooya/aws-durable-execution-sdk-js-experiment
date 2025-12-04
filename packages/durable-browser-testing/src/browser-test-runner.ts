import type {
  DurableLambdaHandler,
  DurableExecutionClient,
} from "@aws/durable-execution-sdk-js";
import { DurableExecutionInvocationInputWithClient } from "@aws/durable-execution-sdk-js";

export interface TestResult<T = any> {
  getResult(): T;
  getOperations(): any[];
}

// Mock client that immediately completes all operations
class MockDurableExecutionClient implements DurableExecutionClient {
  private completedOperations: Map<string, any> = new Map();

  async getExecutionState(): Promise<any> {
    return {
      $metadata: {},
      Operations: Array.from(this.completedOperations.values()),
      NextMarker: "",
    };
  }

  async checkpoint(params: any): Promise<any> {
    // Immediately complete any operations that are started
    if (params.Updates) {
      for (const update of params.Updates) {
        if (update.Action === "START") {
          // Mark operation as completed immediately
          this.completedOperations.set(update.Id, {
            Id: update.Id,
            Type: update.Type,
            Status: "SUCCEEDED",
            Result: {},
          });
          console.log(
            `⚡ Auto-completed ${update.Type} operation: ${update.Id}`,
          );
        }
      }
    }

    return {
      $metadata: {},
      ExecutionStatus: "RUNNING",
      NewExecutionState: {
        Operations: Array.from(this.completedOperations.values()),
        NextMarker: "",
      },
    };
  }
}

export class BrowserDurableTestRunner<T = any> {
  private handler: DurableLambdaHandler;

  constructor(params: { handlerFunction: DurableLambdaHandler }) {
    this.handler = params.handlerFunction;
  }

  static async setupTestEnvironment() {
    // No-op for browser
  }

  async run(): Promise<TestResult<T>> {
    const mockContext = {
      functionName: "test-function",
      functionVersion: "1",
      invokedFunctionArn:
        "arn:aws:lambda:us-east-1:123456789012:function:test-function",
      memoryLimitInMB: "128",
      awsRequestId: "test-request-id",
      logGroupName: "/aws/lambda/test-function",
      logStreamName: "2023/01/01/[$LATEST]test-stream",
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
      callbackWaitsForEmptyEventLoop: true,
    };

    const mockClient = new MockDurableExecutionClient();

    // Run with auto-completing client
    const mockInput = new DurableExecutionInvocationInputWithClient(
      {
        DurableExecutionArn:
          "arn:aws:lambda:us-east-1:123456789012:function:test-function:durable:test-execution",
        CheckpointToken: "test-checkpoint-token",
        InitialExecutionState: {
          Operations: [],
          NextMarker: "",
        },
      },
      mockClient,
    );

    console.log("🚀 Running with auto-completing operations...");
    const result = await this.handler(mockInput, mockContext);
    console.log("📊 Result:", result);

    return {
      getResult: () => result as T,
      getOperations: () =>
        Array.from(mockClient["completedOperations"].values()),
    };
  }
}
