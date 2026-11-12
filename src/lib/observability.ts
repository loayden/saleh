type RequestErrorContext = {
  routerKind?: string;
  routePath?: string;
  routeType?: string;
  renderSource?: string;
  revalidateReason?: string;
  renderType?: string;
};

type RequestSnapshot = {
  path?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

function errorDetails(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack };
  return { name: "UnknownError", message: String(error) };
}

function pathnameOnly(value: string | undefined) {
  if (!value) return undefined;
  try { return new URL(value, "http://saleh.internal").pathname; } catch { return value.split("?")[0]; }
}

function writeLog(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const entry = { timestamp: new Date().toISOString(), service: "saleh", environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development", event, ...fields };
  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  writer(JSON.stringify(entry));
}

export async function reportRequestError(error: unknown, request: RequestSnapshot, context: RequestErrorContext) {
  const details = errorDetails(error);
  const payload = {
    ...details,
    path: pathnameOnly(request.path),
    method: request.method,
    requestId: request.headers?.["x-request-id"] || request.headers?.["x-vercel-id"],
    route: context.routePath,
    routeType: context.routeType,
    router: context.routerKind,
    renderSource: context.renderSource,
    digest: typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined,
  };
  writeLog("error", "next_request_error", payload);

  const endpoint = process.env.OBSERVABILITY_INGEST_URL;
  if (!endpoint) return;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.OBSERVABILITY_INGEST_TOKEN) headers.authorization = `Bearer ${process.env.OBSERVABILITY_INGEST_TOKEN}`;
  try {
    await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload), cache: "no-store" });
  } catch (deliveryError) {
    writeLog("error", "observability_delivery_failed", errorDetails(deliveryError));
  }
}

export function logOperationalEvent(event: string, fields: Record<string, unknown> = {}) {
  writeLog("info", event, fields);
}
