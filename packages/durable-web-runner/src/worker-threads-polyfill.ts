// worker_threads polyfill for browser
export class Worker {
  constructor() {
    // Return a mock worker instead of throwing
    return {
      postMessage: () => {},
      terminate: () => {},
      on: () => {},
      off: () => {},
    } as any;
  }
}

export const isMainThread = true;
export const parentPort = null;
export const workerData = null;

const workerThreads = { Worker, isMainThread, parentPort, workerData };
export default workerThreads;
