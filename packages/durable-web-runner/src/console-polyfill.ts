// Console polyfill for browser
export function Console() {
  return console;
}

Console.prototype = console;
export default Console;
