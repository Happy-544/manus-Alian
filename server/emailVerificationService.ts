import { getDb } from "./db";

let db: Awaited<ReturnType<typeof getDb>> | null = null;

// Initialize database
(async () => {
  db = await getDb();
})();
import { emailVerifications, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generate a secure verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create email verification record
 */
export async function createEmailVerification(
  userId: number,
  email: string,
  expiresInHours: number = 24
) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const result = await db.insert(emailVerifications).values({
    userId,
    email,
    token,
    isVerified: false,
    expiresAt,
  });

  return {
    token,
    expiresAt,
    verificationUrl: `/verify-email?token=${token}`,
  };
}

/**
 * Verify email with token
 */
export async function verifyEmailWithToken(token: string) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const verification = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token))
    .limit(1);

  if (!verification || verification.length === 0) {
    return { success: false, error: "Invalid verification token" };
  }

  const record = verification[0];

  // Check if token has expired
  if (new Date() > record.expiresAt) {
    return { success: false, error: "Verification token has expired" };
  }

  // Check if already verified
  if (record.isVerified) {
    return { success: false, error: "Email already verified" };
  }

  // Update verification status
  await db
    .update(emailVerifications)
    .set({
      isVerified: true,
      verifiedAt: new Date(),
    })
    .where(eq(emailVerifications.id, record.id));

  // Update user email if not already set
  await db
    .update(users)
    .set({
      email: record.email,
    })
    .where(eq(users.id, record.userId));

  return { success: true, userId: record.userId, email: record.email };
}

/**
 * Check if user email is verified
 */
export async function isEmailVerified(userId: number): Promise<boolean> {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const verification = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.userId, userId),
        eq(emailVerifications.isVerified, true)
      )
    )
    .limit(1);

  return verification && verification.length > 0;
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: number, email: string) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Check if there's an existing unverified token
  const existing = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.userId, userId),
        eq(emailVerifications.isVerified, false)
      )
    )
    .limit(1);

  if (existing && existing.length > 0) {
    // Delete old token
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.id, existing[0].id));
  }

  // Create new verification
  return createEmailVerification(userId, email);
}

/**
 * Get verification status for user
 */
export async function getVerificationStatus(userId: number) {
  if (!db) db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const verification = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.userId, userId))
    .orderBy(emailVerifications.createdAt)
    .limit(1);

  if (!verification || verification.length === 0) {
    return {
      verified: false,
      email: null,
      verifiedAt: null,
    };
  }

  const record = verification[0];
  return {
    verified: record.isVerified,
    email: record.email,
    verifiedAt: record.verifiedAt,
    expiresAt: record.expiresAt,
  };
}
