import type {
  DurableLambdaHandler,
  DurableExecutionClient,
} from "@aws/durable-execution-sdk-js";
import { DurableExecutionInvocationInputWithClient } from "@aws/durable-execution-sdk-js";

export interface BrowserTestResult<T = any> {
  getResult(): T;
  getOperations(): any[];
}

// Mock durable execution client for browser - implements local mode
class MockDurableExecutionClient implements DurableExecutionClient {
  private completedOperations: any[] = [];

  async getExecutionState(params: any): Promise<any> {
    console.log(
      "📊 Local getExecutionState - returning completed operations:",
      this.completedOperations.length,
    );
    return {
      $metadata: {},
      Operations: this.completedOperations,
      NextMarker: "",
    };
  }

  async checkpoint(params: any): Promise<any> {
    console.log(
      "🔄 Local checkpoint - processing updates:",
      params.Updates?.length || 0,
    );

    // Auto-complete ALL operations immediately for testing
    if (params.Updates) {
      for (const update of params.Updates) {
        if (update.Action === "START") {
          // Immediately mark any started operation as completed
          this.completedOperations.push({
            Id: update.Id,
            Action: "SUCCEED",
            Type: update.Type,
            Result: {},
          });
          console.log(`⚡ Auto-completed ${update.Type} operation:`, update.Id);
        }
      }
    }

    return {
      $metadata: {},
      ExecutionStatus: "RUNNING",
      NewExecutionState: {
        Operations: this.completedOperations,
        NextMarker: "",
      },
    };
  }
}

// Custom input class that provides the mock client
class BrowserDurableExecutionInput extends DurableExecutionInvocationInputWithClient {
  constructor() {
    const baseInput = {
      DurableExecutionArn:
        "arn:aws:lambda:us-east-1:123456789012:function:test-function:durable:test-execution",
      CheckpointToken: "test-checkpoint-token",
      InitialExecutionState: {
        Operations: [],
        NextMarker: "",
      },
    };

    super(baseInput, new MockDurableExecutionClient());
  }
}

export class BrowserDurableTestRunner<T = any> {
  private handler: DurableLambdaHandler;

  constructor(params: { handlerFunction: DurableLambdaHandler }) {
    this.handler = params.handlerFunction;
  }

  static async setupTestEnvironment(params: { skipTime?: boolean } = {}) {
    console.log("🌐 Browser test environment setup - local mode enabled");
  }

  async run(params: any = {}): Promise<BrowserTestResult<T>> {
    console.log("🚀 Running handler in local mode (no AWS API calls)...");

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

    const mockEvent = new BrowserDurableExecutionInput();
    console.log("📞 Calling handler with local mode input...");

    try {
      const result = await this.handler(mockEvent, mockContext);
      console.log("✅ Handler completed successfully:", result);

      return {
        getResult: () => result as T,
        getOperations: () => [],
      };
    } catch (error) {
      console.error("❌ Handler failed:", error);
      throw error;
    }
  }
}
