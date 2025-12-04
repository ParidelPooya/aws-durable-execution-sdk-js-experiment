import { withDurableExecution } from "@aws/durable-execution-sdk-js";
import { BrowserDurableTestRunner } from "@aws/durable-browser-testing";

console.log("Main.ts loaded");

// Make SDK functions available globally
(window as any).withDurableExecution = withDurableExecution;

async function executeCode(code: string) {
  try {
    console.log("🚀 Starting code execution...");

    // Extract wait duration and remove wait calls for browser compatibility
    const waitMatch = code.match(
      /await\s+context\.wait\(\s*{\s*seconds:\s*(\d+)\s*}\s*\)/,
    );
    const waitSeconds = waitMatch ? parseInt(waitMatch[1]) : 0;
    const modifiedCode = code.replace(
      /await\s+context\.wait\([^)]*\);?\s*/g,
      "// wait removed - simulated with delay\n",
    );

    console.log(
      `📝 Modified code (${waitSeconds}s wait will be simulated):`,
      modifiedCode,
    );

    // Wrap the user code to make it a complete module
    const moduleCode = `
      ${modifiedCode}
      
      // Export the handler if not already exported
      if (typeof handler !== 'undefined' && !window.tempHandler) {
        window.tempHandler = handler;
      }
    `;

    console.log("📝 User code wrapped:", moduleCode);

    // Create a blob URL for the code
    const blob = new Blob([moduleCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);

    // Clear any previous handler
    (window as any).tempHandler = null;

    console.log("📦 Importing user module...");
    // Import the module
    /* @vite-ignore */
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

    return {
      success: true,
      result: result.getResult(),
      operations: result.getOperations()?.length || 0,
    };
  } catch (error) {
    console.error("❌ Execution failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runCode() {
  console.log("runCode called");
  const codeInput = document.getElementById("codeInput") as HTMLTextAreaElement;
  const output = document.getElementById("output") as HTMLDivElement;

  output.textContent = "Running...";
  output.className = "output";

  const result = await executeCode(codeInput.value);

  if (result.success) {
    output.className = "output success";
    output.textContent = `Result: ${JSON.stringify(result.result, null, 2)}\n\nOperations: ${result.operations}`;
  } else {
    output.className = "output error";
    output.textContent = `Error: ${result.error}`;
  }
}

// Expose runCode to global scope
(globalThis as any).runCode = runCode;
(window as any).runCode = runCode;

console.log("runCode function exposed:", typeof (window as any).runCode);
