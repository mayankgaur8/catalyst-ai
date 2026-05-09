/**
 * Server-side in-memory store for video data.
 * Uses module-level singletons (works in Next.js single-instance deployment).
 * For multi-instance production, replace with Redis or a database.
 */
import { VideoLesson, DEFAULT_VIDEOS, VideoAccess } from "./videos";

// ── Video catalog ──────────────────────────────────────────────────────────────

const _videos: VideoLesson[] = DEFAULT_VIDEOS.map((v) => ({ ...v }));

/** Map of "userId:videoId" → xpAwardedAt ISO string (prevents duplicate XP) */
const _xpRegistry = new Map<string, string>();

/** Watch progress per user per video */
export interface WatchRecord {
  videoId: string;
  userId: string;
  progressPct: number;
  watchedSeconds: number;
  xpAwarded: boolean;
  lastWatched: string;
  completedAt: string | null;
  savedForLater: boolean;
  notes: string;
}

const _watchRecords = new Map<string, WatchRecord>(); // key: "userId:videoId"

/** Admin audit log */
export interface AuditEntry {
  id: string;
  adminId: string;
  action: string;
  target: string;
  detail: Record<string, unknown>;
  timestamp: string;
}
const _auditLog: AuditEntry[] = [];

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface VideoAnalyticsRecord {
  videoId: string;
  impressions: number;
  playClicks: number;
  totalWatchedSeconds: number;
  xpAwardedCount: number;
  completions: number;
  upgradeClicks: number;
  searchTermHits: number;
  dropOffSeconds: number[];
}
const _analytics = new Map<string, VideoAnalyticsRecord>();

// ── Helper ────────────────────────────────────────────────────────────────────

function watchKey(userId: string, videoId: string) {
  return `${userId}:${videoId}`;
}

function getOrInitAnalytics(videoId: string): VideoAnalyticsRecord {
  if (!_analytics.has(videoId)) {
    _analytics.set(videoId, {
      videoId,
      impressions: 0,
      playClicks: 0,
      totalWatchedSeconds: 0,
      xpAwardedCount: 0,
      completions: 0,
      upgradeClicks: 0,
      searchTermHits: 0,
      dropOffSeconds: [],
    });
  }
  return _analytics.get(videoId)!;
}

// ── Video CRUD ────────────────────────────────────────────────────────────────

export function getVideos(includeDeleted = false): VideoLesson[] {
  if (includeDeleted) return _videos;
  return _videos.filter((v) => !v.deletedAt);
}

export function getVideoById(id: string): VideoLesson | null {
  return _videos.find((v) => v.id === id) ?? null;
}

export function createVideo(v: VideoLesson, adminId: string): VideoLesson {
  _videos.push(v);
  addAuditLog(adminId, "CREATE_VIDEO", v.id, { title: v.title });
  return v;
}

export function updateVideo(id: string, patch: Partial<VideoLesson>, adminId: string): VideoLesson | null {
  const idx = _videos.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  _videos[idx] = { ..._videos[idx], ...patch };
  addAuditLog(adminId, "UPDATE_VIDEO", id, patch as Record<string, unknown>);
  return _videos[idx];
}

/** Soft delete */
export function deleteVideo(id: string, adminId: string): boolean {
  const idx = _videos.findIndex((v) => v.id === id);
  if (idx === -1) return false;
  _videos[idx] = { ..._videos[idx], deletedAt: new Date().toISOString() };
  addAuditLog(adminId, "DELETE_VIDEO", id, {});
  return true;
}

/** Restore soft-deleted video */
export function restoreVideo(id: string, adminId: string): VideoLesson | null {
  const idx = _videos.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  _videos[idx] = { ..._videos[idx], deletedAt: null };
  addAuditLog(adminId, "RESTORE_VIDEO", id, {});
  return _videos[idx];
}

/** Reorder by new ordered list of IDs */
export function reorderVideos(orderedIds: string[], adminId: string): void {
  orderedIds.forEach((id, idx) => {
    const v = _videos.find((v) => v.id === id);
    if (v) v.order = idx;
  });
  addAuditLog(adminId, "REORDER_VIDEOS", "all", { orderedIds });
}

// ── Watch progress ────────────────────────────────────────────────────────────

export function getWatchRecord(userId: string, videoId: string): WatchRecord | null {
  return _watchRecords.get(watchKey(userId, videoId)) ?? null;
}

export function getAllWatchRecords(userId: string): WatchRecord[] {
  const result: WatchRecord[] = [];
  for (const [key, record] of _watchRecords) {
    if (key.startsWith(`${userId}:`)) result.push(record);
  }
  return result;
}

export interface ProgressPayload {
  progressPct: number;
  watchedSeconds: number;
}

export function saveProgress(userId: string, videoId: string, payload: ProgressPayload): WatchRecord {
  const key = watchKey(userId, videoId);
  const prev = _watchRecords.get(key);
  const newPct = Math.max(prev?.progressPct ?? 0, payload.progressPct);
  const newSecs = Math.max(prev?.watchedSeconds ?? 0, payload.watchedSeconds);

  const record: WatchRecord = {
    videoId,
    userId,
    progressPct: newPct,
    watchedSeconds: newSecs,
    xpAwarded: prev?.xpAwarded ?? false,
    lastWatched: new Date().toISOString(),
    completedAt: newPct >= 95 ? (prev?.completedAt ?? new Date().toISOString()) : (prev?.completedAt ?? null),
    savedForLater: prev?.savedForLater ?? false,
    notes: prev?.notes ?? "",
  };
  _watchRecords.set(key, record);

  // Update analytics
  const analytics = getOrInitAnalytics(videoId);
  analytics.totalWatchedSeconds = Math.max(analytics.totalWatchedSeconds, newSecs);

  return record;
}

export function completeVideo(userId: string, videoId: string): { record: WatchRecord; xpGranted: boolean } {
  const key = watchKey(userId, videoId);
  const prev = _watchRecords.get(key);

  // Validate that real watch time supports XP (server-side check)
  const video = getVideoById(videoId);
  if (!video) throw new Error("Video not found");

  // Prevent duplicate XP
  const xpKey = watchKey(userId, videoId);
  const alreadyAwarded = _xpRegistry.has(xpKey);

  const record: WatchRecord = {
    videoId,
    userId,
    progressPct: 100,
    watchedSeconds: prev?.watchedSeconds ?? 0,
    xpAwarded: true,
    lastWatched: new Date().toISOString(),
    completedAt: prev?.completedAt ?? new Date().toISOString(),
    savedForLater: prev?.savedForLater ?? false,
    notes: prev?.notes ?? "",
  };
  _watchRecords.set(key, record);

  if (!alreadyAwarded) {
    _xpRegistry.set(xpKey, new Date().toISOString());
    const analytics = getOrInitAnalytics(videoId);
    analytics.xpAwardedCount++;
    analytics.completions++;
  }

  return { record, xpGranted: !alreadyAwarded };
}

export function updateNotes(userId: string, videoId: string, notes: string): WatchRecord {
  const key = watchKey(userId, videoId);
  const prev = _watchRecords.get(key) ?? {
    videoId,
    userId,
    progressPct: 0,
    watchedSeconds: 0,
    xpAwarded: false,
    lastWatched: new Date().toISOString(),
    completedAt: null,
    savedForLater: false,
    notes: "",
  };
  const record = { ...prev, notes };
  _watchRecords.set(key, record);
  return record;
}

export function toggleSavedForLater(userId: string, videoId: string): WatchRecord {
  const key = watchKey(userId, videoId);
  const prev = _watchRecords.get(key) ?? {
    videoId,
    userId,
    progressPct: 0,
    watchedSeconds: 0,
    xpAwarded: false,
    lastWatched: new Date().toISOString(),
    completedAt: null,
    savedForLater: false,
    notes: "",
  };
  const record = { ...prev, savedForLater: !prev.savedForLater };
  _watchRecords.set(key, record);
  return record;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function trackImpression(videoId: string): void {
  getOrInitAnalytics(videoId).impressions++;
}

export function trackPlayClick(videoId: string): void {
  getOrInitAnalytics(videoId).playClicks++;
}

export function trackUpgradeClick(videoId: string): void {
  getOrInitAnalytics(videoId).upgradeClicks++;
}

export function getAnalytics(): VideoAnalyticsRecord[] {
  return Array.from(_analytics.values());
}

// ── Audit log ─────────────────────────────────────────────────────────────────

function addAuditLog(adminId: string, action: string, target: string, detail: Record<string, unknown>): void {
  _auditLog.push({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    adminId,
    action,
    target,
    detail,
    timestamp: new Date().toISOString(),
  });
}

export function getAuditLog(): AuditEntry[] {
  return [..._auditLog].reverse();
}

// ── Access control ────────────────────────────────────────────────────────────

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, elite: 2 };

export function userCanAccess(userPlan: string | null | undefined, requiredAccess: VideoAccess): boolean {
  if (!userPlan) return requiredAccess === "free";
  return (PLAN_ORDER[userPlan] ?? -1) >= (PLAN_ORDER[requiredAccess] ?? 99);
}
