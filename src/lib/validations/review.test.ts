import { describe, it, expect } from "vitest";
import { submitReviewSchema, moderateReviewSchema, deleteReviewSchema } from "./review";

describe("submitReviewSchema", () => {
  const validReview = {
    productId: "prod-123",
    rating: 4,
    title: "Great product",
  };

  it("accepts valid review", () => {
    const result = submitReviewSchema.parse(validReview);
    expect(result.rating).toBe(4);
    expect(result.title).toBe("Great product");
  });

  it("accepts review with body", () => {
    const result = submitReviewSchema.parse({
      ...validReview,
      body: "Detailed review text",
    });
    expect(result.body).toBe("Detailed review text");
  });

  it("rejects rating below 1", () => {
    const result = submitReviewSchema.safeParse({ ...validReview, rating: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects rating above 5", () => {
    const result = submitReviewSchema.safeParse({ ...validReview, rating: 6 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating", () => {
    const result = submitReviewSchema.safeParse({ ...validReview, rating: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = submitReviewSchema.safeParse({ ...validReview, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 characters", () => {
    const result = submitReviewSchema.safeParse({
      ...validReview,
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects body over 2000 characters", () => {
    const result = submitReviewSchema.safeParse({
      ...validReview,
      body: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing product ID", () => {
    const result = submitReviewSchema.safeParse({ rating: 4, title: "Good" });
    expect(result.success).toBe(false);
  });
});

describe("moderateReviewSchema", () => {
  it("accepts APPROVED status", () => {
    const result = moderateReviewSchema.parse({ reviewId: "rev-1", status: "APPROVED" });
    expect(result.status).toBe("APPROVED");
  });

  it("accepts REJECTED status", () => {
    const result = moderateReviewSchema.parse({ reviewId: "rev-1", status: "REJECTED" });
    expect(result.status).toBe("REJECTED");
  });

  it("rejects PENDING status", () => {
    const result = moderateReviewSchema.safeParse({
      reviewId: "rev-1",
      status: "PENDING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing review ID", () => {
    const result = moderateReviewSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(false);
  });
});

describe("deleteReviewSchema", () => {
  it("accepts valid review ID", () => {
    const result = deleteReviewSchema.parse({ reviewId: "rev-1" });
    expect(result.reviewId).toBe("rev-1");
  });

  it("rejects empty review ID", () => {
    const result = deleteReviewSchema.safeParse({ reviewId: "" });
    expect(result.success).toBe(false);
  });
});
