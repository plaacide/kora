import "server-only";

import { connection } from "next/server";
import { notFound } from "next/navigation";

function enabledByEnvironment(): boolean {
  const configured = process.env.SANZA_V2_ENABLED;

  if (configured === "true") return true;
  if (configured === "false") return false;

  return process.env.NODE_ENV !== "production";
}

export async function requireV2Enabled(): Promise<void> {
  await connection();

  if (!enabledByEnvironment()) notFound();
}
