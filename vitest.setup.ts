// Set env vars before any module loads (order-url.ts reads NEXT_PUBLIC_APP_URL at module scope)
process.env.NEXT_PUBLIC_APP_URL = "https://test.swiftcard.ch";

// Suppress zustand persist "storage unavailable" warnings in node test environment
const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[zustand persist middleware]"))
    return;
  origWarn.call(console, ...args);
};
