// Crypto polyfill for browser using Web Crypto API
export function createHash(algorithm: string) {
  return {
    update(data: string) {
      this.data = data;
      return this;
    },
    digest(encoding: string) {
      // Simple hash for browser - just return a consistent string
      // In a real implementation, you'd use Web Crypto API
      const hash = btoa(this.data || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 32);
      return encoding === "hex" ? hash : hash;
    },
    data: "",
  };
}

export function randomBytes(size: number) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomUUID() {
  return crypto.randomUUID();
}

const cryptoPolyfill = { createHash, randomBytes, randomUUID };
export default cryptoPolyfill;
