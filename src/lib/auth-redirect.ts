export function safeAuthNext(value: string | null, fallback = "/account") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
