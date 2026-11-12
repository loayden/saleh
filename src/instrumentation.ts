import type { Instrumentation } from "next";
import { reportRequestError } from "@/lib/observability";

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportRequestError(error, request, context);
};
