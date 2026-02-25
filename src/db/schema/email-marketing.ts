import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "PENDING",
  "ACTIVE",
  "UNSUBSCRIBED",
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "SENT",
  "CANCELLED",
]);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    status: subscriberStatusEnum("status").default("PENDING").notNull(),
    confirmToken: text("confirm_token").$defaultFn(() => createId()),
    unsubscribeToken: text("unsubscribe_token")
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("user_id"),
    source: text("source").default("footer").notNull(),
    confirmedAt: timestamp("confirmed_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_idx").on(table.email),
    index("newsletter_subscribers_status_idx").on(table.status),
    uniqueIndex("newsletter_subscribers_confirm_token_idx").on(table.confirmToken),
    uniqueIndex("newsletter_subscribers_unsubscribe_token_idx").on(
      table.unsubscribeToken,
    ),
  ],
);

export const emailCampaigns = pgTable(
  "email_campaigns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    previewText: text("preview_text"),
    bodyHtml: text("body_html").notNull(),
    bodyJson: text("body_json"),
    segment: text("segment").default("all_subscribers").notNull(),
    status: campaignStatusEnum("status").default("DRAFT").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    totalRecipients: integer("total_recipients").default(0).notNull(),
    totalSent: integer("total_sent").default(0).notNull(),
    totalOpened: integer("total_opened").default(0).notNull(),
    totalClicked: integer("total_clicked").default(0).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_campaigns_status_idx").on(table.status),
    index("email_campaigns_scheduled_at_idx").on(table.scheduledAt),
  ],
);

export const campaignSends = pgTable(
  "campaign_sends",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    campaignId: text("campaign_id").notNull(),
    subscriberId: text("subscriber_id").notNull(),
    email: text("email").notNull(),
    resendEmailId: text("resend_email_id"),
    sentAt: timestamp("sent_at"),
    openedAt: timestamp("opened_at"),
    clickedAt: timestamp("clicked_at"),
    failedAt: timestamp("failed_at"),
    failureReason: text("failure_reason"),
  },
  (table) => [
    index("campaign_sends_campaign_id_idx").on(table.campaignId),
    index("campaign_sends_subscriber_id_idx").on(table.subscriberId),
    uniqueIndex("campaign_sends_campaign_subscriber_idx").on(
      table.campaignId,
      table.subscriberId,
    ),
  ],
);
