export function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getServerErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.startsWith("Missing required environment variable:")) {
    return "Payment backend is not configured yet. Add the required values to .env.local, then restart the dev server.";
  }

  if (error instanceof Error && error.message.startsWith("Missing public site URL:")) {
    return "Payment redirects are not configured. Set NEXT_PUBLIC_SITE_URL to the live website URL in Vercel, then redeploy.";
  }

  if (error instanceof Error && error.message.includes("orders_payment_method_check")) {
    return "Database schema needs the BLIK update. Run the latest supabase/schema.sql in Supabase, then retry checkout.";
  }

  if (error instanceof Error && error.message === "TypeError: fetch failed") {
    return "Payment backend could not reach Stripe or Supabase. Restart the app with npm run dev so Node uses the Windows certificate store.";
  }

  return error instanceof Error ? error.message : "Unexpected server error.";
}

export function getBaseUrl() {
  const configuredUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelProductionUrl = normalizeBaseUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  const vercelDeploymentUrl = normalizeBaseUrl(process.env.VERCEL_URL);
  const vercelUrl = vercelProductionUrl || vercelDeploymentUrl;

  if (process.env.VERCEL) {
    if (configuredUrl && !isLocalBaseUrl(configuredUrl)) return configuredUrl;
    if (vercelUrl) return vercelUrl;

    throw new Error("Missing public site URL: set NEXT_PUBLIC_SITE_URL to your deployed store URL.");
  }

  return configuredUrl || "http://localhost:3000";
}

function normalizeBaseUrl(value?: string) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : isLocalHostname(trimmed)
      ? `http://${trimmed}`
      : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

function isLocalBaseUrl(value: string) {
  try {
    return isLocalHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

function isLocalHostname(value: string) {
  const hostname = value.replace(/^\[/, "").replace(/\]$/, "").split(":")[0].toLowerCase();
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
