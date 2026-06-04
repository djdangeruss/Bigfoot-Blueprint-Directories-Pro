import crypto from "crypto";

let bootstrapToken: string | null = crypto.randomBytes(24).toString("hex");

export function getSetupToken(): string | null {
  return bootstrapToken;
}

export function consumeSetupToken(): void {
  bootstrapToken = null;
}
