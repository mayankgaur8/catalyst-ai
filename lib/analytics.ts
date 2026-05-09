export type VideoAnalyticsEvent =
  | "VIDEO_STARTED"
  | "VIDEO_70_PERCENT_REACHED"
  | "VIDEO_COMPLETED";

/**
 * Fire a typed video analytics event.
 * Dispatches a native CustomEvent so any listener (GTM, Segment, etc.) can pick it up.
 */
export function trackVideoEvent(
  event: VideoAnalyticsEvent,
  videoId: string,
  meta?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("catalyst_analytics", {
      detail: { event, videoId, timestamp: Date.now(), ...meta },
    })
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(`[CATalyst Analytics] ${event}`, { videoId, ...meta });
  }
}
