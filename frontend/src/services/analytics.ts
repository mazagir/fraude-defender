interface AnalyticsClient {
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

const POSTHOG_KEY = (import.meta.env.VITE_POSTHOG_KEY as string | undefined)?.trim() || "";
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() || "https://us.i.posthog.com";

let client: AnalyticsClient | null = null;
let loading = false;

export const isAnalyticsEnabled = (): boolean => Boolean(POSTHOG_KEY);

export function initAnalytics(): void {
  if (!POSTHOG_KEY || client || loading) return;
  loading = true;
  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: true,
        capture_pageview: true,
        persistence: "localStorage+cookie",
      });
      client = posthog;
    })
    .catch(() => {
      loading = false;
    });
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!client) return;
  try {
    client.capture(event, properties);
  } catch { /* ignore */ }
}
