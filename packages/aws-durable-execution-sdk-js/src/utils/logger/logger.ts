/* eslint-disable no-console */
import { safeStringify } from "../safe-stringify/safe-stringify";

export const log = (emoji: string, message: string, data?: unknown): void => {
  // Hardcoded to always log for web runner debugging - using console.log for visibility
  console.log(`${emoji} ${message}`, data ? safeStringify(data) : "");
};
