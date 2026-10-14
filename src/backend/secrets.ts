import crypto from "crypto";

function encryptionKey(purpose: string) {
  const seed = process.env.APP_SECRETS_ENCRYPTION_KEY
    || process.env.PROJECT_ACCESS_ENCRYPTION_KEY
    || process.env.WA_INTERNAL_TOKEN
    || process.env.DATABASE_URL
    || "develoi-server-secrets";
  return crypto.createHash("sha256").update(`${purpose}:${seed}`).digest();
}

export function encryptSecret(value: string, purpose: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(purpose), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string | null | undefined, purpose: string): string | null {
  if (!value) return null;
  try {
    const [version, iv, tag, encrypted] = value.split(":");
    if (version !== "v1" || !iv || !tag || !encrypted) return null;
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(purpose), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
