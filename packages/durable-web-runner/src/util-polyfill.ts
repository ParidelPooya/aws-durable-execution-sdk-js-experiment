// Util polyfill for browser
export const inspect = (obj: any) => JSON.stringify(obj, null, 2);
export const format = (f: string, ...args: any[]) => {
  let i = 0;
  return f.replace(/%[sdj%]/g, (x) => {
    if (x === "%%") return x;
    if (i >= args.length) return x;
    switch (x) {
      case "%s":
        return String(args[i++]);
      case "%d":
        return Number(args[i++]);
      case "%j":
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return "[Circular]";
        }
      default:
        return x;
    }
  });
};

const util = { inspect, format };
export default util;
