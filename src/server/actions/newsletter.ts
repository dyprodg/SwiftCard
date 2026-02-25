"use server";

import { db } from "@/db";
import { newsletterSubscribers, emailCampaigns, campaignSends } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { updateTag, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createId } from "@paralleldrive/cuid2";
import {
  subscribeNewsletterSchema,
  createCampaignSchema,
  updateCampaignSchema,
  importSubscribersSchema,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type ImportSubscribersInput,
} from "@/lib/validations/newsletter";
import { resolveSegmentEmails } from "@/server/queries/newsletter";
import { resend } from "@/lib/resend";

async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") throw new Error("Unauthorized");
  return userId;
}

// ==================== STOREFRONT ====================

export async function subscribeToNewsletter(
  email: string,
  source: "footer" | "popup" | "checkout" = "footer",
) {
  const data = subscribeNewsletterSchema.parse({ email, source });

  // Check if already exists
  const existing = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.email, data.email),
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return { success: true, alreadySubscribed: true };
    }
    // Re-subscribe: reset to PENDING with new confirm token
    if (existing.status === "UNSUBSCRIBED") {
      const newToken = createId();
      await db
        .update(newsletterSubscribers)
        .set({
          status: "PENDING",
          confirmToken: newToken,
          unsubscribedAt: null,
          source: data.source,
        })
        .where(eq(newsletterSubscribers.id, existing.id));

      await sendConfirmationEmail(data.email, newToken);
      updateTag("newsletter-subscribers");
      return { success: true };
    }
    // Still PENDING — resend confirmation
    if (existing.confirmToken) {
      await sendConfirmationEmail(data.email, existing.confirmToken);
    }
    return { success: true };
  }

  // New subscriber
  const confirmToken = createId();
  await db.insert(newsletterSubscribers).values({
    email: data.email,
    status: "PENDING",
    confirmToken,
    source: data.source,
  });

  await sendConfirmationEmail(data.email, confirmToken);
  updateTag("newsletter-subscribers");
  return { success: true };
}

export async function confirmSubscription(token: string) {
  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.confirmToken, token),
  });

  if (!subscriber) return { success: false, error: "Invalid token" };
  if (subscriber.status === "ACTIVE") return { success: true };

  await db
    .update(newsletterSubscribers)
    .set({
      status: "ACTIVE",
      confirmedAt: new Date(),
      confirmToken: null,
    })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  // Note: cache invalidation done by caller (revalidateTag in Route Handlers, updateTag in server actions)
  return { success: true };
}

export async function unsubscribeByToken(token: string) {
  const subscriber = await db.query.newsletterSubscribers.findFirst({
    where: eq(newsletterSubscribers.unsubscribeToken, token),
  });

  if (!subscriber) return { success: false, error: "Invalid token" };
  if (subscriber.status === "UNSUBSCRIBED") return { success: true };

  await db
    .update(newsletterSubscribers)
    .set({
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
    })
    .where(eq(newsletterSubscribers.id, subscriber.id));

  // Note: cache invalidation done by caller
  return { success: true };
}

// ==================== ADMIN: CAMPAIGNS ====================

export async function createCampaign(input: CreateCampaignInput) {
  const adminId = await requireAdmin();
  const data = createCampaignSchema.parse(input);

  const [campaign] = await db
    .insert(emailCampaigns)
    .values({
      name: data.name,
      subject: data.subject,
      previewText: data.previewText || null,
      bodyHtml: data.bodyHtml,
      bodyJson: data.bodyJson || null,
      segment: data.segment,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      createdBy: adminId,
    })
    .returning();

  updateTag("email-campaigns");
  return campaign;
}

export async function updateCampaign(input: UpdateCampaignInput) {
  await requireAdmin();
  const data = updateCampaignSchema.parse(input);
  const { id, ...updates } = data;

  // Only allow editing DRAFT campaigns
  const existing = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
  });
  if (!existing) throw new Error("Campaign not found");
  if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
    throw new Error("Can only edit draft or scheduled campaigns");
  }

  const setData: Record<string, unknown> = {};
  if (updates.name !== undefined) setData.name = updates.name;
  if (updates.subject !== undefined) setData.subject = updates.subject;
  if (updates.previewText !== undefined) setData.previewText = updates.previewText;
  if (updates.bodyHtml !== undefined) setData.bodyHtml = updates.bodyHtml;
  if (updates.bodyJson !== undefined) setData.bodyJson = updates.bodyJson;
  if (updates.segment !== undefined) setData.segment = updates.segment;
  if (updates.scheduledAt !== undefined) {
    setData.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null;
    setData.status = updates.scheduledAt ? "SCHEDULED" : "DRAFT";
  }

  if (Object.keys(setData).length > 0) {
    await db.update(emailCampaigns).set(setData).where(eq(emailCampaigns.id, id));
  }

  updateTag("email-campaigns");
  updateTag("email-campaign");
}

export async function deleteCampaign(id: string) {
  await requireAdmin();

  const existing = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
  });
  if (!existing) throw new Error("Campaign not found");
  if (existing.status !== "DRAFT") {
    throw new Error("Can only delete draft campaigns");
  }

  await db.transaction(async (tx) => {
    await tx.delete(campaignSends).where(eq(campaignSends.campaignId, id));
    await tx.delete(emailCampaigns).where(eq(emailCampaigns.id, id));
  });

  updateTag("email-campaigns");
  updateTag("email-campaign");
}

export async function cancelCampaign(id: string) {
  await requireAdmin();

  const existing = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
  });
  if (!existing) throw new Error("Campaign not found");
  if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
    throw new Error("Can only cancel draft or scheduled campaigns");
  }

  await db
    .update(emailCampaigns)
    .set({ status: "CANCELLED" })
    .where(eq(emailCampaigns.id, id));

  updateTag("email-campaigns");
  updateTag("email-campaign");
}

export async function sendCampaignNow(id: string) {
  await requireAdmin();

  const existing = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, id),
  });
  if (!existing) throw new Error("Campaign not found");
  if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
    throw new Error("Can only send draft or scheduled campaigns");
  }

  await db
    .update(emailCampaigns)
    .set({ status: "SENDING" })
    .where(eq(emailCampaigns.id, id));

  // Process send in background (fire-and-forget in server action context)
  processCampaignSend(id).catch((err) =>
    console.error(`Failed to process campaign ${id}:`, err),
  );

  updateTag("email-campaigns");
  updateTag("email-campaign");
}

// ==================== ADMIN: SUBSCRIBERS ====================

export async function importSubscribers(input: ImportSubscribersInput) {
  await requireAdmin();
  const data = importSubscribersSchema.parse(input);

  let imported = 0;
  for (const email of data.emails) {
    try {
      await db
        .insert(newsletterSubscribers)
        .values({
          email,
          status: "ACTIVE",
          confirmedAt: new Date(),
          source: "admin_import",
        })
        .onConflictDoNothing();
      imported++;
    } catch {
      // Skip duplicates
    }
  }

  updateTag("newsletter-subscribers");
  return { imported };
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();

  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));

  updateTag("newsletter-subscribers");
}

// ==================== CAMPAIGN SEND PROCESSOR ====================

export async function processCampaignSend(campaignId: string) {
  const campaign = await db.query.emailCampaigns.findFirst({
    where: eq(emailCampaigns.id, campaignId),
  });

  if (!campaign || campaign.status !== "SENDING") return;

  const recipients = await resolveSegmentEmails(campaign.segment);

  await db
    .update(emailCampaigns)
    .set({ totalRecipients: recipients.length })
    .where(eq(emailCampaigns.id, campaignId));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let totalSent = 0;

  // Process in batches of 50
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50);

    for (const recipient of batch) {
      try {
        const sendId = createId();
        const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?token=${recipient.unsubscribeToken}`;
        const trackOpenUrl = `${appUrl}/api/newsletter/track/open?sid=${sendId}`;

        const htmlWithTracking = `${campaign.bodyHtml}<img src="${trackOpenUrl}" width="1" height="1" alt="" style="display:none" />`;
        const htmlWithUnsubscribe = `${htmlWithTracking}<p style="text-align:center;font-size:12px;color:#888;margin-top:32px;"><a href="${unsubscribeUrl}" style="color:#888;">Unsubscribe</a></p>`;

        const result = await resend.emails.send({
          from: "SwiftCard <onboarding@resend.dev>",
          to: recipient.email,
          subject: campaign.subject,
          html: htmlWithUnsubscribe,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        await db.insert(campaignSends).values({
          id: sendId,
          campaignId,
          subscriberId: recipient.id,
          email: recipient.email,
          resendEmailId: result.data?.id || null,
          sentAt: new Date(),
        });

        totalSent++;
      } catch (err) {
        // Log failure and continue
        const sendId = createId();
        await db.insert(campaignSends).values({
          id: sendId,
          campaignId,
          subscriberId: recipient.id,
          email: recipient.email,
          failedAt: new Date(),
          failureReason: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Small delay between batches
    if (i + 50 < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  await db
    .update(emailCampaigns)
    .set({
      status: "SENT",
      sentAt: new Date(),
      totalSent,
    })
    .where(eq(emailCampaigns.id, campaignId));

  revalidateTag("email-campaigns", "minutes");
  revalidateTag("email-campaign", "minutes");
}

// ==================== CRON: PROCESS SCHEDULED CAMPAIGNS ====================

export async function processScheduledCampaigns() {
  const now = new Date();

  const scheduled = await db.query.emailCampaigns.findMany({
    where: and(
      eq(emailCampaigns.status, "SCHEDULED"),
      lte(emailCampaigns.scheduledAt, now),
    ),
  });

  for (const campaign of scheduled) {
    await db
      .update(emailCampaigns)
      .set({ status: "SENDING" })
      .where(eq(emailCampaigns.id, campaign.id));

    await processCampaignSend(campaign.id);
  }

  return scheduled.length;
}

// ==================== HELPERS ====================

async function sendConfirmationEmail(email: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const confirmUrl = `${appUrl}/api/newsletter/confirm?token=${token}`;

  try {
    const { NewsletterConfirmEmail } = await import("@/emails/newsletter-confirm");

    await resend.emails.send({
      from: "SwiftCard <onboarding@resend.dev>",
      to: email,
      subject: "Confirm your newsletter subscription",
      react: NewsletterConfirmEmail({ confirmUrl }),
    });
  } catch (err) {
    console.error("Failed to send confirmation email:", err);
  }
}
