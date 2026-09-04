import crypto from "crypto";

let bootstrapToken: string | null = process.env.SETUP_TOKEN
  || (process.env.NODE_ENV === "production" ? null : crypto.randomBytes(24).toString("hex"));

export function getSetupToken(): string | null {
  return bootstrapToken;
}

export function consumeSetupToken(): void {
  bootstrapToken = null;
}

export function verifySetupToken(candidate: unknown): boolean {
  if (!bootstrapToken || typeof candidate !== "string") return false;
  const expected = Buffer.from(bootstrapToken);
  const provided = Buffer.from(candidate);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}
