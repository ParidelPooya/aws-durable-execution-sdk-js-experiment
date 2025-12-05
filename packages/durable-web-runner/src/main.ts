import { withDurableExecution } from "@aws/durable-execution-sdk-js";
import { BrowserDurableTestRunner } from "@aws/durable-browser-testing";
import * as monaco from "monaco-editor";
import * as ts from "typescript";

console.log("Main.ts loaded");

// Make SDK functions available globally
(window as any).withDurableExecution = withDurableExecution;

// Initialize Monaco Editor
let editor: monaco.editor.IStandaloneCodeEditor;

// Default TypeScript code
const defaultCode = `export const handler = withDurableExecution(
  async (event: any, context: DurableContext) => {
    const result = await context.step(async () => {
      return "Hello from durable execution!";
    });
    
    await context.wait({ seconds: 1 });
    
    return result;
  }
);`;

// Add TypeScript definitions for AWS Durable Execution SDK
const durableExecutionTypes = ``;

// TypeScript compilation function
function compileTypeScript(code: string): string {
  console.log("🔧 Compiling TypeScript to JavaScript...");

  try {
    const result = ts.transpile(code, {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      skipLibCheck: true,
      removeComments: false,
    });

    console.log("✅ TypeScript compilation successful");
    console.log("📝 Compiled JavaScript:", result);
    return result;
  } catch (error) {
    console.error("❌ TypeScript compilation failed:", error);
    throw new Error(`TypeScript compilation failed: ${error}`);
  }
}

// Initialize editor when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  // Add TypeScript definitions to Monaco as separate libraries
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    `
    declare function withDurableExecution<T>(
      handler: (event: any, context: DurableContext) => Promise<T>
    ): (event: any, context: any) => Promise<T>;

    interface DurableContext {
      step<T>(stepFunction: () => Promise<T>, config?: StepConfig): Promise<T>;
      wait(duration: { seconds: number }): Promise<void>;
      invoke<T>(config: InvokeConfig): Promise<T>;
      concurrent<T>(operations: (() => Promise<T>)[], config?: ConcurrencyConfig): Promise<T[]>;
      child<T>(childFunction: (childContext: DurableContext) => Promise<T>, config?: ChildConfig): Promise<T>;
      waitForCondition(config: WaitForConditionConfig): Promise<void>;
      batch<T, R>(items: T[], processor: (batch: T[]) => Promise<R>, config?: BatchConfig): Promise<R[]>;
    }

    interface StepConfig {
      maxAttempts?: number;
      retryStrategy?: RetryStrategy;
      timeout?: Duration;
    }

    interface InvokeConfig {
      functionName: string;
      payload?: any;
      invocationType?: 'RequestResponse' | 'Event';
    }

    interface ConcurrencyConfig {
      maxConcurrency?: number;
    }

    interface ChildConfig {
      timeout?: Duration;
    }

    interface WaitForConditionConfig {
      checkFunction: () => Promise<boolean>;
      maxWaitTime?: Duration;
      checkInterval?: Duration;
    }

    interface BatchConfig {
      batchSize: number;
      maxConcurrency?: number;
    }

    interface Duration {
      seconds?: number;
      minutes?: number;
      hours?: number;
    }

    interface RetryStrategy {
      type: 'exponential' | 'linear' | 'fixed';
      baseDelay?: Duration;
      maxDelay?: Duration;
      jitter?: 'none' | 'full' | 'equal';
    }
    `,
    "file:///globals.d.ts",
  );

  // Configure TypeScript compiler options for Monaco
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: "React",
    allowJs: true,
    checkJs: false,
    typeRoots: ["node_modules/@types"],
    strict: false,
    noImplicitAny: false,
    strictNullChecks: false,
    strictFunctionTypes: false,
    noImplicitReturns: false,
    noImplicitThis: false,
  });

  // Disable JavaScript validation to avoid conflicts
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  });

  // Configure Monaco Editor
  monaco.editor.defineTheme("aws-theme", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "569cd6" },
      { token: "string", foreground: "ce9178" },
      { token: "comment", foreground: "6a9955" },
      { token: "number", foreground: "b5cea8" },
    ],
    colors: {
      "editor.background": "#1e1e1e",
      "editor.foreground": "#d4d4d4",
      "editorCursor.foreground": "#aeafad",
      "editor.lineHighlightBackground": "#2d2d30",
      "editorLineNumber.foreground": "#858585",
      "editor.selectionBackground": "#264f78",
      "editor.inactiveSelectionBackground": "#3a3d41",
    },
  });

  // Create editor with TypeScript language and model
  const model = monaco.editor.createModel(
    defaultCode,
    "typescript",
    monaco.Uri.parse("file:///main.ts"),
  );

  editor = monaco.editor.create(document.getElementById("editor")!, {
    model: model,
    theme: "aws-theme",
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on",
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: false,
    cursorStyle: "line",
    wordWrap: "on",
    // Enhanced IntelliSense settings
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: {
      enabled: true,
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: "on",
    tabCompletion: "on",
    wordBasedSuggestions: "matchingDocuments",
    // Enable hover information
    hover: {
      enabled: true,
    },
    // Enable signature help
    signatureHelp: {
      enabled: true,
    },
  });

  // Setup run button
  const runButton = document.getElementById("runButton") as HTMLButtonElement;
  const statusElement = document.getElementById("status") as HTMLElement;
  const outputElement = document.getElementById("output") as HTMLElement;

  runButton.addEventListener("click", async () => {
    const code = editor.getValue();
    await executeCode(code);
  });

  // Override console methods to capture output
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  function appendOutput(
    message: string,
    type: "log" | "error" | "warn" = "log",
  ) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === "error" ? "❌" : type === "warn" ? "⚠️" : "📝";
    outputElement.innerHTML += `[${timestamp}] ${prefix} ${message}\n`;
    outputElement.scrollTop = outputElement.scrollHeight;
  }

  console.log = (...args) => {
    originalLog(...args);
    appendOutput(args.join(" "), "log");
  };

  console.error = (...args) => {
    originalError(...args);
    appendOutput(args.join(" "), "error");
  };

  console.warn = (...args) => {
    originalWarn(...args);
    appendOutput(args.join(" "), "warn");
  };

  function updateStatus(
    message: string,
    type: "success" | "error" | "running",
  ) {
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = message ? "inline-block" : "none";
  }

  async function executeCode(code: string) {
    try {
      console.log("🚀 Starting TypeScript code execution...");
      updateStatus("Compiling...", "running");
      runButton.disabled = true;

      // Compile TypeScript to JavaScript
      const compiledJs = compileTypeScript(code);

      // Extract wait duration and remove wait calls for browser compatibility
      const waitMatch = compiledJs.match(
        /await\s+context\.wait\(\s*{\s*seconds:\s*(\d+)\s*}\s*\)/,
      );
      const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 0;
      const modifiedCode = compiledJs.replace(
        /await\s+context\.wait\([^)]*\);?\s*/g,
        "// wait removed - simulated with delay\n",
      );

      console.log(
        `📝 Modified JavaScript (${waitSeconds}s wait will be simulated):`,
        modifiedCode,
      );

      updateStatus("Running...", "running");

      // Wrap the compiled JavaScript code to make it a complete module
      const moduleCode = `
        ${modifiedCode}
          
        
        // Export the handler if not already exported
        if (typeof handler !== 'undefined' && !window.tempHandler) {
          window.tempHandler = handler;
        }
      `;

      const blob = new Blob([moduleCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);

      // Clear any previous handler
      (window as any).tempHandler = null;
      console.log("📦 Importing compiled module...");
      await import(url);
      const handler = (window as any).tempHandler;
      if (!handler) {
        throw new Error(
          "No handler found. Make sure to export a handler function.",
        );
      }

      console.log("✅ Handler found:", typeof handler);

      // Setup test environment first
      console.log("⚙️ Setting up browser test environment...");
      await BrowserDurableTestRunner.setupTestEnvironment({
        skipTime: true,
      });

      console.log("🏃 Creating browser test runner...");
      // Create runner with correct parameters
      const runner = new BrowserDurableTestRunner({
        handlerFunction: handler,
      });

      console.log("▶️ Running durable function...");

      // Add delay to simulate wait duration
      if (waitSeconds > 0) {
        console.log(`⏳ Simulating ${waitSeconds}s wait...`);
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      }

      // Execute the function using run method
      const result = await runner.run({});

      console.log("🎉 Execution completed:", result);

      // Clean up
      URL.revokeObjectURL(url);
      (window as any).tempHandler = null;

      updateStatus("Success!", "success");

      return {
        success: true,
        result: result.getResult(),
        operations: result.getOperations()?.length || 0,
      };
    } catch (error) {
      console.error("❌ Execution failed:", error);
      updateStatus("Error!", "error");
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      runButton.disabled = false;
    }
  }

  // Expose runCode function globally for debugging
  (window as any).runCode = executeCode;
  console.log("runCode function exposed:", typeof (window as any).runCode);
});
