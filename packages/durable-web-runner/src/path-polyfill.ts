// path polyfill for browser
export function resolve(...paths: string[]) {
  return paths.join("/").replace(/\/+/g, "/");
}

export function join(...paths: string[]) {
  return paths.join("/").replace(/\/+/g, "/");
}

export function dirname(path: string) {
  return path.split("/").slice(0, -1).join("/") || "/";
}

export function basename(path: string) {
  return path.split("/").pop() || "";
}

export function extname(path: string) {
  const name = basename(path);
  const lastDot = name.lastIndexOf(".");
  return lastDot > 0 ? name.slice(lastDot) : "";
}

export const sep = "/";
export const delimiter = ":";

const pathPolyfill = {
  resolve,
  join,
  dirname,
  basename,
  extname,
  sep,
  delimiter,
};
export default pathPolyfill;
