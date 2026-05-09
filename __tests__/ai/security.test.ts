import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signSessionToken, validateToken } from "@/lib/ai/session";

const ORIGINAL_SECRET = process.env.SESSION_SECRET;

describe("HMAC session tokens", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret-supersafe-12345";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = ORIGINAL_SECRET;
  });

  it("roundtrips: sign → validate returns original payload", () => {
    const token = signSessionToken("user123", "pro", false);
    const user = validateToken(token);

    expect(user).not.toBeNull();
    expect(user!.userId).toBe("user123");
    expect(user!.plan).toBe("pro");
    expect(user!.isAdmin).toBe(false);
  });

  it("round-trips admin=true", () => {
    const token = signSessionToken("admin_1", "admin", true);
    const user = validateToken(token);

    expect(user).not.toBeNull();
    expect(user!.isAdmin).toBe(true);
    expect(user!.plan).toBe("admin");
  });

  it("detects a tampered signature", () => {
    const token = signSessionToken("user123", "pro", false);
    const tampered = token.slice(0, -4) + "xxxx";
    expect(validateToken(tampered)).toBeNull();
  });

  it("detects a forged admin flag in the payload", () => {
    const token = signSessionToken("user123", "free", false);
    const parts = token.split(".");
    // Flip the admin flag (index 2) without updating the signature
    parts[2] = "1";
    const forged = parts.join(".");
    expect(validateToken(forged)).toBeNull();
  });

  it("detects a forged plan upgrade in the payload", () => {
    const token = signSessionToken("user123", "free", false);
    const parts = token.split(".");
    parts[1] = "elite"; // try to elevate plan
    const forged = parts.join(".");
    expect(validateToken(forged)).toBeNull();
  });

  it("returns null when SESSION_SECRET is empty", () => {
    process.env.SESSION_SECRET = "";
    const token = signSessionToken("user123", "pro", false);
    expect(validateToken(token)).toBeNull();
  });

  it("returns null for malformed token (wrong segment count)", () => {
    expect(validateToken("abc.def.ghi")).toBeNull();
    expect(validateToken("")).toBeNull();
  });
});
