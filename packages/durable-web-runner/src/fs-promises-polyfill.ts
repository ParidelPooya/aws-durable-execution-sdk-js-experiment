// fs/promises polyfill for browser
export async function access() {
  throw new Error("File system access not available in browser");
}

export async function readFile() {
  throw new Error("File system access not available in browser");
}

export async function writeFile() {
  throw new Error("File system access not available in browser");
}

export async function mkdir() {
  throw new Error("File system access not available in browser");
}

export async function rmdir() {
  throw new Error("File system access not available in browser");
}

export async function unlink() {
  throw new Error("File system access not available in browser");
}

// Mock fs constants
export const constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
};

const fsPromises = {
  access,
  readFile,
  writeFile,
  mkdir,
  rmdir,
  unlink,
  constants,
};
export default fsPromises;
