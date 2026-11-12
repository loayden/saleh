export function safeAuthNext(value: string | null, fallback = "/account") {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function authCallbackUrl(next: string) {
  const origin = typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    : window.location.origin;
  const callback = new URL("/auth/confirm", origin);
  callback.searchParams.set("next", safeAuthNext(next));
  return callback.toString();
}
