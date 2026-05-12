export type MicrophoneError =
  | "not-supported"
  | "not-found"
  | "not-readable"
  | "not-allowed"
  | "blocked"
  | "security-error"
  | "unknown";

export interface MicrophoneCheckResult {
  supported: boolean;
  hasSpeechRecognition: boolean;
  granted: boolean;
  denied: boolean;
  blocked: boolean;
  deviceFound: boolean;
  error: MicrophoneError | null;
}

export const MIC_ERROR_MESSAGES: Record<MicrophoneError, string> = {
  "not-supported":  "Microphone access is not supported in this browser.",
  "not-found":      "No microphone found. Please connect a microphone and try again.",
  "not-readable":   "Microphone is in use by another app. Close other apps and try again.",
  "not-allowed":    "Microphone access was denied. Click the lock icon in your address bar to re-allow.",
  "blocked":        "Microphone is blocked in your browser settings.",
  "security-error": "Microphone access is blocked by a browser security policy.",
  "unknown":        "An unexpected error occurred accessing the microphone.",
};

function categorizeError(err: unknown): MicrophoneError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case "NotAllowedError":  return "not-allowed";
      case "NotFoundError":
      case "DevicesNotFoundError": return "not-found";
      case "NotReadableError":
      case "TrackStartError":  return "not-readable";
      case "SecurityError":    return "security-error";
      case "AbortError":       return "unknown";
    }
  }
  return "unknown";
}

function hasSpeechRecognitionAPI(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    (window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition
  );
}

/** Query existing permission state WITHOUT triggering a browser prompt. */
export async function getMicPermissionState(): Promise<PermissionState | "unknown"> {
  if (typeof navigator === "undefined" || !navigator.permissions) return "unknown";
  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}

/**
 * Full microphone access check.
 *
 * Calls getUserMedia — this WILL trigger the browser prompt if state is "prompt".
 * Stop any stream tracks immediately after confirming access to avoid holding a
 * live stream while SpeechRecognition opens its own.
 */
export async function checkMicrophoneAccess(): Promise<MicrophoneCheckResult> {
  const base: MicrophoneCheckResult = {
    supported: false,
    hasSpeechRecognition: false,
    granted: false,
    denied: false,
    blocked: false,
    deviceFound: false,
    error: null,
  };

  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    console.log("[VOICE_PERMISSION] getUserMedia not available");
    return { ...base, error: "not-supported" };
  }

  const hasSR = hasSpeechRecognitionAPI();
  console.log("[VOICE_PERMISSION] SpeechRecognition available:", hasSR);

  // Fast-path: already known to be blocked (no prompt needed)
  const permState = await getMicPermissionState();
  console.log("[VOICE_PERMISSION] Permission state:", permState);

  if (permState === "denied") {
    return { ...base, supported: true, hasSpeechRecognition: hasSR, denied: true, blocked: true, error: "blocked" };
  }

  // Request access (may show prompt when state === "prompt")
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    const error = categorizeError(err);
    const blocked = error === "not-allowed" || error === "security-error";
    console.log("[VOICE_ERROR] getUserMedia failed:", error, err);
    return { ...base, supported: true, hasSpeechRecognition: hasSR, denied: true, blocked, error };
  }

  const audioTracks = stream.getAudioTracks();
  const deviceFound = audioTracks.length > 0;
  console.log("[VOICE_PERMISSION] Audio tracks:", audioTracks.length);

  // Release immediately — SpeechRecognition opens its own stream
  stream.getTracks().forEach(t => t.stop());

  if (!deviceFound) {
    return { ...base, supported: true, hasSpeechRecognition: hasSR, error: "not-found" };
  }

  console.log("[VOICE_PERMISSION] Access granted, device found");
  return { ...base, supported: true, hasSpeechRecognition: hasSR, granted: true, deviceFound: true };
}
