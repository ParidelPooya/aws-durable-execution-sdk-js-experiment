import { TerminationManager } from "../../termination-manager/termination-manager";
import { TerminationReason } from "../../termination-manager/types";
import { DurableExecutionMode } from "../../types";

interface ContextInfo {
  contextId: string;
  parentId?: string;
  attempt?: number;
  durableExecutionMode?: DurableExecutionMode;
}

// Try to import AsyncLocalStorage, fallback to null if not available (browser environment)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let asyncLocalStorage: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncLocalStorageClass = require("async_hooks").AsyncLocalStorage;
  asyncLocalStorage = new AsyncLocalStorageClass();
} catch (_error) {
  // AsyncLocalStorage not available (browser environment)
  asyncLocalStorage = null;
}

export const getActiveContext = (): ContextInfo | undefined => {
  return asyncLocalStorage?.getStore();
};

export const runWithContext = <T>(
  contextId: string,
  parentId: string | undefined,
  fn: () => T,
  attempt?: number,
  durableExecutionMode?: DurableExecutionMode,
): T => {
  if (asyncLocalStorage) {
    return asyncLocalStorage.run(
      { contextId, parentId, attempt, durableExecutionMode },
      fn,
    );
  }
  // Fallback: just run the function without context tracking
  return fn();
};

export const validateContextUsage = (
  operationContextId: string | undefined,
  operationName: string,
  terminationManager: TerminationManager,
): void => {
  // Skip validation if AsyncLocalStorage is not available
  if (!asyncLocalStorage) {
    return;
  }

  const contextId = operationContextId || "root";
  const activeContext = getActiveContext();

  if (!activeContext) {
    return;
  }

  if (activeContext.contextId !== contextId) {
    const errorMessage = `Context usage error in "${operationName}": You are using a parent or sibling context instead of the current child context. Expected context ID: "${activeContext.contextId}", but got: "${operationContextId}". When inside runInChildContext(), you must use the child context parameter, not the parent context.`;
    terminationManager.terminate({
      reason: TerminationReason.CONTEXT_VALIDATION_ERROR,
      message: errorMessage,
      error: new Error(errorMessage),
    });

    // Only call termination manager, don't throw or return promise
  }
};
